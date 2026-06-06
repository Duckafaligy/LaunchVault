#!/usr/bin/env node
// =====================================================================
// LaunchVault — Stripe reprice (live, two-phase, both reversible)
//
// New tiers: Starter $5 / Creator $12 / Pro $30 / Master $50
// (Master = the former tier4 "Studio"; tier4 key is unchanged in code.)
//
// Phase 1  "create"  (additive, safe): mints NEW recurring monthly prices
//   with NEW lookup_keys + new amounts. Old prices keep working, so the
//   currently-deployed checkout is unaffected. Run this FIRST.
//
// Phase 2  "archive" (reversible): deactivates the OLD subscription prices
//   and the old one-time credit-pack prices. Run this LAST — only after the
//   app code has been repointed at the new lookup_keys (and ideally deployed).
//
// Usage (Windows PowerShell or any shell):
//   node scripts/reprice-stripe.mjs create
//   node scripts/reprice-stripe.mjs archive
//
// Loads STRIPE_LIVE_SECRET_KEY from .env.local (same loader as query-db.mjs).
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

const API = "https://api.stripe.com/v1";
async function stripe(path, { method = "GET", form } = {}) {
  const opts = { method, headers: { Authorization: `Bearer ${KEY}` } };
  if (form) {
    opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opts.body = form.toString();
  }
  const res = await fetch(`${API}${path}`, opts);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `Stripe ${method} ${path} -> ${res.status}: ${JSON.stringify(json.error || json)}`,
    );
  }
  return json;
}

async function findPriceByLookup(key) {
  const r = await stripe(
    `/prices?lookup_keys[]=${encodeURIComponent(key)}&expand[]=data.product&limit=1`,
  );
  return r.data?.[0];
}

// old subscription lookup_key -> { newKey, amount(minor units) }
const TIERS = [
  { old: "tier1_monthly_v3", newKey: "tier1_monthly_v4", amount: 500 },  // Starter $5
  { old: "tier2_monthly_v3", newKey: "tier2_monthly_v4", amount: 1200 }, // Creator $12
  { old: "tier3_monthly_v2", newKey: "tier3_monthly_v3", amount: 3000 }, // Pro $30
  { old: "tier4_monthly_v2", newKey: "tier4_monthly_v3", amount: 5000 }, // Master $50
];

// one-time credit-pack lookup_keys to retire (credit system removed)
const CREDIT_KEYS = [
  "starter_credit_pack",
  "growth_credit_pack",
  "business_credit_pack",
  "business_credit_pack_v2",
];

async function create() {
  for (const t of TIERS) {
    const existingNew = await findPriceByLookup(t.newKey);
    if (existingNew) {
      console.log(
        `SKIP  ${t.newKey} already exists: ${existingNew.id} ($${existingNew.unit_amount / 100} ${existingNew.currency})`,
      );
      continue;
    }
    const oldPrice = await findPriceByLookup(t.old);
    if (!oldPrice) {
      console.error(`!!    old price ${t.old} not found — cannot resolve product/currency`);
      continue;
    }
    const productId =
      typeof oldPrice.product === "string" ? oldPrice.product : oldPrice.product.id;
    const form = new URLSearchParams();
    form.set("product", productId);
    form.set("currency", oldPrice.currency);
    form.set("unit_amount", String(t.amount));
    form.set("recurring[interval]", "month");
    form.set("lookup_key", t.newKey);
    const created = await stripe(`/prices`, { method: "POST", form });
    console.log(
      `CREATE ${t.newKey}: ${created.id}  $${created.unit_amount / 100} ${created.currency}/mo  (product ${productId})`,
    );
  }
}

async function archiveKey(key) {
  const price = await findPriceByLookup(key);
  if (!price) {
    console.log(`--     ${key} not found / already gone`);
    return;
  }
  if (!price.active) {
    console.log(`--     ${key} already inactive (${price.id})`);
    return;
  }
  const form = new URLSearchParams();
  form.set("active", "false");
  await stripe(`/prices/${price.id}`, { method: "POST", form });
  console.log(`ARCHIVE ${key}: ${price.id}`);
}

async function archive() {
  for (const t of TIERS) await archiveKey(t.old);
  for (const k of CREDIT_KEYS) await archiveKey(k);
}

const cmd = process.argv[2] || "create";
if (cmd === "create") await create();
else if (cmd === "archive") await archive();
else {
  console.error("Usage: node scripts/reprice-stripe.mjs [create|archive]");
  process.exit(1);
}
console.log("done:", cmd);
