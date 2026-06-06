import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Resolve or create a Stripe Customer, ALWAYS setting metadata.userId so
// later read paths (portal, search, dashboards) can find it.
async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({
      email: options.email,
      limit: 1,
    });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

function assertSafeReturnUrl(url: string, requestOrigin: string | null): string {
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("Invalid returnUrl"); }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid returnUrl protocol");
  }
  const allowed = new Set<string>();
  if (requestOrigin) allowed.add(new URL(requestOrigin).origin);
  if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  // Lovable preview + published origins for this project.
  const host = parsed.host;
  if (host.endsWith(".lovable.app") || host === "localhost" || host.startsWith("localhost:")) {
    return parsed.toString();
  }
  if (!allowed.has(parsed.origin)) throw new Error("returnUrl not allowed");
  return parsed.toString();
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) {
        throw new Error("Invalid priceId");
      }
      if (data.environment !== "sandbox" && data.environment !== "live") {
        throw new Error("Invalid environment");
      }
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({
      lookup_keys: [data.priceId],
    });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const email = data.customerEmail || (claims?.email as string | undefined);

    const customerId = await resolveOrCreateCustomer(stripe, {
      email,
      userId,
    });

    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const origin = getRequestHeader("origin") ?? getRequestHeader("referer") ?? null;
    const safeReturnUrl = assertSafeReturnUrl(data.returnUrl, origin);

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: data.quantity || 1 }],
      mode: isRecurring ? "subscription" : "payment",
      // Stripe Checkout's embedded mode value is "embedded_page" (the older
      // "embedded" was deprecated). Returns a client_secret for the embedded
      // checkout component.
      ui_mode: "embedded_page" as any,
      return_url: safeReturnUrl,
      customer: customerId,
      metadata: { userId, priceId: data.priceId },
      ...(isRecurring && {
        subscription_data: {
          metadata: { userId, priceId: data.priceId },
        },
      }),
      // (removed managed_payments — Lovable-specific, real Stripe doesn't have it)
    });

    return session.client_secret;
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { returnUrl?: string; environment: StripeEnv }) => {
      if (data.environment !== "sandbox" && data.environment !== "live") {
        throw new Error("Invalid environment");
      }
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile?.stripe_customer_id) {
      throw new Error("No customer record found");
    }

    const stripe = createStripeClient(data.environment);
    let safeReturnUrl: string | undefined;
    if (data.returnUrl) {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const origin = getRequestHeader("origin") ?? getRequestHeader("referer") ?? null;
      safeReturnUrl = assertSafeReturnUrl(data.returnUrl, origin);
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      ...(safeReturnUrl && { return_url: safeReturnUrl }),
    });
    return portal.url;
  });

/**
 * Cancel the caller's subscription IMMEDIATELY and revoke access right away.
 *
 * We cancel in Stripe (which also fires customer.subscription.deleted → the
 * webhook revokes too, idempotently) AND proactively flip the profile to free
 * here, so access is gone the instant the button is clicked — no waiting on
 * the webhook round-trip. Uses the service-role client so the user can't be
 * left in a half-cancelled state.
 */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => {
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Invalid environment");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

    const stripe = createStripeClient(data.environment);

    // Resolve the subscription to cancel: stored id first, else look it up by
    // customer (covers subs whose id never made it onto the profile).
    let subId = (profile?.stripe_subscription_id as string | null) ?? undefined;
    if (!subId && profile?.stripe_customer_id) {
      try {
        const subs = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id as string,
          status: "all",
          limit: 3,
        });
        subId = subs.data.find((s) => s.status === "active" || s.status === "trialing" || s.status === "past_due")?.id;
      } catch {/* ignore lookup failure — still revoke locally */}
    }

    if (subId) {
      try {
        await stripe.subscriptions.cancel(subId);
      } catch (e: any) {
        // "resource_missing" = already gone; anything else we still revoke locally.
        if (e?.code !== "resource_missing") {
          console.error("cancelSubscription: stripe cancel failed", e?.message ?? e);
        }
      }
    }

    // Revoke access immediately — don't wait for the webhook.
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_status: "canceled",
        stripe_subscription_id: null,
        current_period_end: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return { ok: true as const };
  });
