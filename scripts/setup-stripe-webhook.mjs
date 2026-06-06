#!/usr/bin/env node
// =====================================================================
// LaunchVault — One-shot Stripe webhook endpoint setup
//
// Creates a webhook endpoint in your Stripe account pointed at your
// deployed Cloudflare Worker, subscribed to all the events the app
// listens for, and prints the signing secret you need to set as
// STRIPE_LIVE_WEBHOOK_SECRET (or STRIPE_TEST_WEBHOOK_SECRET).
//
// Usage:
//   node scripts/setup-stripe-webhook.mjs https://YOUR-WORKER-URL.workers.dev
//
// Requires env vars:
//   STRIPE_SECRET_KEY  (sk_live_... or sk_test_...)
//
// The simplest way to run this on Windows PowerShell:
//   $env:STRIPE_SECRET_KEY = "sk_live_..."
//   node scripts/setup-stripe-webhook.mjs https://launchvault.your-sub.workers.dev
// =====================================================================

const EVENTS = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "checkout.session.completed",
  "invoice.payment_failed",
  "charge.refunded",
];

async function main() {
  const baseUrl = process.argv[2];
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!baseUrl || !apiKey) {
    console.error("Usage: STRIPE_SECRET_KEY=sk_... node scripts/setup-stripe-webhook.mjs <worker-url>");
    console.error("Example: node scripts/setup-stripe-webhook.mjs https://launchvault.example.workers.dev");
    process.exit(1);
  }

  // The route is mounted at /api/public/payments/webhook and the handler
  // requires ?env=live or ?env=sandbox. We pick live or sandbox based on
  // the secret-key prefix.
  const envParam = apiKey.startsWith("sk_test_") ? "sandbox" : "live";
  const url = `${baseUrl.replace(/\/$/, "")}/api/public/payments/webhook?env=${envParam}`;

  console.log("Creating webhook endpoint:");
  console.log("  URL:    ", url);
  console.log("  Events: ", EVENTS.length);
  console.log("  Mode:   ", envParam);
  console.log();

  // Stripe webhookEndpoints.create
  const form = new URLSearchParams();
  form.set("url", url);
  for (const ev of EVENTS) form.append("enabled_events[]", ev);
  form.set("description", "LaunchVault — auto-created by setup-stripe-webhook.mjs");
  form.set("api_version", "2026-03-25.dahlia");

  const res = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("Stripe API error:", res.status, txt);
    process.exit(2);
  }

  const payload = await res.json();
  console.log("Endpoint created.");
  console.log("  id:     ", payload.id);
  console.log("  status: ", payload.status);
  console.log();
  console.log("SIGNING SECRET (set this in Cloudflare):");
  console.log();
  console.log("  ", payload.secret);
  console.log();
  console.log("Run this next:");
  if (envParam === "live") {
    console.log("  npx wrangler secret put STRIPE_LIVE_WEBHOOK_SECRET");
  } else {
    console.log("  npx wrangler secret put STRIPE_TEST_WEBHOOK_SECRET");
  }
  console.log("  # paste the secret above when prompted");
}

main().catch((e) => {
  console.error(e);
  process.exit(99);
});
