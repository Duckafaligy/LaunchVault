#!/usr/bin/env node
// =====================================================================
// LaunchVault — Stripe price verification (READ-ONLY)
//
// Confirms the live Stripe prices behind the lookup_keys used in
// src/config/brand.ts actually charge the displayed amounts. Makes ONLY
// GET requests — never creates, archives, or modifies anything.
//
// Usage:  node scripts/verify-stripe-prices.mjs
// =====================================================================
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const text = readFileSync(resolve(ROOT, ".env.local"), "utf8");
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (!m || m[1].startsWith("#")) continue;
  if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const KEY = process.env.STRIPE_LIVE_SECRET_KEY;
if (!KEY) {
  console.error("STRIPE_LIVE_SECRET_KEY missing from .env.local");
  process.exit(1);
}
console.log("Using key:", KEY.slice(0, 12) + "..." + (KEY.startsWith("sk_live") ? " (LIVE)" : " (NOT LIVE!)"));

const API = "https://api.stripe.com/v1";
async function stripeGet(path) {
  const res = await fetch(`${API}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}: ${JSON.stringify(json.error || json)}`);
  return json;
}

async function findPriceByLookup(key) {
  const r = await stripeGet(
    `/prices?lookup_keys[]=${encodeURIComponent(key)}&expand[]=data.product&limit=10`,
  );
  return r.data || [];
}

// What brand.ts DISPLAYS — must match live Stripe amounts.
const EXPECTED = [
  { tier: "tier1 (Starter)", key: "tier1_monthly_v4", display: 5 },
  { tier: "tier2 (Creator)", key: "tier2_monthly_v4", display: 12 },
  { tier: "tier3 (Pro)",     key: "tier3_monthly_v3", display: 30 },
  { tier: "tier4 (Master)",  key: "tier4_monthly_v3", display: 50 },
];

console.log("\n=== Verifying displayed prices vs live Stripe (lookup_keys) ===\n");
let mismatches = 0;
let missing = 0;
for (const e of EXPECTED) {
  const prices = await findPriceByLookup(e.key);
  if (prices.length === 0) {
    console.log(`MISSING  ${e.tier.padEnd(18)} lookup_key=${e.key}  — NO live price! Displayed $${e.display}/mo is unbacked.`);
    missing++;
    continue;
  }
  for (const p of prices) {
    const amt = p.unit_amount / 100;
    const interval = p.recurring?.interval || "one-time";
    const ok = amt === e.display && p.active && interval === "month";
    const flag = ok ? "OK    " : (amt !== e.display ? "MISMATCH" : !p.active ? "INACTIVE" : "INTERVAL?");
    if (!ok) mismatches++;
    console.log(
      `${flag.padEnd(8)} ${e.tier.padEnd(18)} display=$${e.display}/mo  live=$${amt} ${p.currency}/${interval}  active=${p.active}  id=${p.id}  product=${typeof p.product === "object" ? p.product.name : p.product}`,
    );
  }
}

// Also surface ANY active recurring price, so leftover/duplicate active
// legacy prices (which could let someone subscribe at an old amount) show up.
console.log("\n=== All ACTIVE recurring prices in the live account ===\n");
const all = await stripeGet(`/prices?active=true&type=recurring&expand[]=data.product&limit=100`);
for (const p of all.data) {
  console.log(
    `  $${(p.unit_amount / 100).toString().padStart(5)} ${p.currency}/${p.recurring?.interval}  lookup_key=${(p.lookup_key || "(none)").padEnd(20)} id=${p.id}  product=${typeof p.product === "object" ? p.product.name : p.product}`,
  );
}

console.log("\n=== Summary ===");
console.log(`Expected tiers checked: ${EXPECTED.length}`);
console.log(`Missing (no live price): ${missing}`);
console.log(`Mismatched/inactive:     ${mismatches}`);
console.log(`Total active recurring prices in account: ${all.data.length}`);
console.log(mismatches === 0 && missing === 0
  ? "\nRESULT: PASS — every displayed price is backed by a matching active live Stripe price."
  : "\nRESULT: ATTENTION NEEDED — see flags above.");
