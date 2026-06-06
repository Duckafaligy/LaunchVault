import Stripe from "stripe";

// =====================================================================
// LaunchVault — direct Stripe integration
// (no Lovable gateway). Requires the following env vars per environment:
//   STRIPE_LIVE_SECRET_KEY      (sk_live_...)
//   STRIPE_LIVE_WEBHOOK_SECRET  (whsec_... from Stripe Dashboard → Webhooks)
//   STRIPE_TEST_SECRET_KEY      (sk_test_...) — only if you want test mode
//   STRIPE_TEST_WEBHOOK_SECRET  (whsec_...) — only if you want test mode
// =====================================================================

export type StripeEnv = "sandbox" | "live";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
};

function getSecretKey(env: StripeEnv): string {
  return env === "sandbox"
    ? getEnv("STRIPE_TEST_SECRET_KEY")
    : getEnv("STRIPE_LIVE_SECRET_KEY");
}

function getWebhookSecret(env: StripeEnv): string {
  return env === "sandbox"
    ? getEnv("STRIPE_TEST_WEBHOOK_SECRET")
    : getEnv("STRIPE_LIVE_WEBHOOK_SECRET");
}

export function createStripeClient(env: StripeEnv): Stripe {
  return new Stripe(getSecretKey(env), {
    // Use the SDK's bundled default API version. We were on Lovable's
    // gateway-specific "2026-03-25.dahlia" which doesn't exist on real Stripe.
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/**
 * Verify a Stripe webhook signature.
 *
 * We do this manually (HMAC-SHA256 over `${timestamp}.${body}`) instead of
 * using `stripe.webhooks.constructEvent` because the SDK depends on a Node
 * crypto path that isn't available in Cloudflare Workers without the
 * nodejs_compat flag — and even then the WebCrypto path is faster.
 */
export async function verifyWebhook(
  req: Request,
  env: StripeEnv,
): Promise<{ type: string; data: { object: any } }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret = getWebhookSecret(env);

  if (!signature || !body) throw new Error("Missing signature or body");

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signatures.push(value);
  }
  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Invalid signature format");
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) throw new Error("Webhook timestamp too old");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const expected = Buffer.from(new Uint8Array(signed)).toString("hex");

  if (!v1Signatures.includes(expected)) {
    throw new Error("Invalid webhook signature");
  }

  return JSON.parse(body);
}
