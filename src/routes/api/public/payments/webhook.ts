import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook, createStripeClient } from "@/lib/stripe.server";
import { PRICE_TO_TIER } from "@/lib/payment-products";

let _supabase: ReturnType<typeof createClient<any>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<any>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

function resolvePriceLookupKey(item: any): string | undefined {
  return (
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id
  );
}

async function recordEvent(eventType: string, raw: any, extra: Record<string, any>) {
  await getSupabase().from("payment_events").insert({
    event_type: eventType,
    provider: "stripe",
    raw_event: raw,
    ...extra,
  });
}

async function resolveUserId(subscription: any): Promise<string | undefined> {
  if (subscription.metadata?.userId) return subscription.metadata.userId;
  // Fallback: the subscription/customer id we stored on the profile at signup.
  const { data } = await getSupabase()
    .from("profiles")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  return (data?.id as string | undefined) ?? undefined;
}

async function applySubscriptionState(subscription: any, env: StripeEnv) {
  const userId = await resolveUserId(subscription);
  if (!userId) {
    console.error("subscription event: cannot resolve user", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceLookup = resolvePriceLookupKey(item);
  const status: string = subscription.status;

  // Per user choice: revoke immediately on any non-active status.
  const isActive = status === "active" || status === "trialing";
  const tier = isActive && priceLookup ? PRICE_TO_TIER[priceLookup] ?? "free" : "free";
  const dbStatus = isActive ? "active" : "inactive";

  const periodEnd =
    item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: dbStatus,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await recordEvent("subscription." + status, subscription, {
    user_id: userId,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    product_key: priceLookup,
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = await resolveUserId(subscription);
  if (!userId) return;
  await getSupabase()
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      stripe_subscription_id: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await recordEvent("subscription.deleted", subscription, {
    user_id: userId,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
  });
}

async function handleCheckoutCompleted(session: any, _env: StripeEnv) {
  // Subscriptions are handled by the customer.subscription.* events. We no
  // longer sell any one-time product (the credit system was removed), so a
  // completed one-time payment has nothing to grant — we just record it for
  // audit. Subscription checkouts (mode === "subscription") are ignored here.
  if (session.mode !== "payment") return;

  await recordEvent("checkout.session.completed", session, {
    user_id: session.metadata?.userId ?? null,
    stripe_customer_id: (session.customer as string) ?? null,
    stripe_payment_intent_id: (session.payment_intent as string) ?? null,
    product_key: session.metadata?.priceId ?? null,
  });
}

async function handleInvoiceFailed(invoice: any) {
  await recordEvent("invoice.payment_failed", invoice, {
    stripe_customer_id: invoice.customer ?? null,
    stripe_subscription_id: invoice.subscription ?? null,
  });
}

async function handleChargeRefunded(charge: any, env: StripeEnv) {
  // A refund means the money was returned — revoke access + cancel any live
  // subscription so they aren't billed again.
  if (charge.customer) {
    const { data: prof } = await getSupabase()
      .from("profiles")
      .select("id, stripe_subscription_id")
      .eq("stripe_customer_id", charge.customer)
      .maybeSingle();
    if (prof?.id) {
      if (prof.stripe_subscription_id) {
        try { await createStripeClient(env).subscriptions.cancel(prof.stripe_subscription_id as string); }
        catch {/* already gone — ignore */}
      }
      await getSupabase()
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_status: "canceled",
          stripe_subscription_id: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", prof.id);
    }
  }
  await recordEvent("charge.refunded", charge, {
    stripe_customer_id: charge.customer ?? null,
    stripe_payment_intent_id: charge.payment_intent ?? null,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await applySubscriptionState(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}


export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv as StripeEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
