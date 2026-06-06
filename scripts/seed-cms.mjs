#!/usr/bin/env node
// =====================================================================
// LaunchVault — bulk seed via single-type runs only.
//
// Each auto-gen call generates one content type. Keeps each request well
// under Cloudflare Workers wall-time limit (~5min). Multi-type default
// runs occasionally exceed that with the upgraded prompts.
// =====================================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load env
const text = readFileSync(resolve(ROOT, ".env.local"), "utf8");
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (!m || m[1].startsWith("#")) continue;
  if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const WORKER = process.env.WORKER_URL ?? "https://tanstack-start-app.brendanhllau.workers.dev";
const SECRET = process.env.INTERNAL_CRON_SECRET;
if (!SECRET) { console.error("missing INTERNAL_CRON_SECRET in .env.local"); process.exit(1); }

// Per-type counts per run. Tier mixing is handled inside the auto-gen.
// Keeps each call under ~90 seconds typically.
const TYPE_PLAN = [
  { type: "insight",          count: 4, runs: 2 },
  { type: "prompt",           count: 4, runs: 2 },
  { type: "workflow",         count: 3, runs: 2 },
  { type: "course",           count: 2, runs: 2 },
  { type: "agent",            count: 3, runs: 2 },
  { type: "business_lesson",  count: 3, runs: 2 },
  { type: "tool_guide",       count: 3, runs: 1 },
  { type: "playbook",         count: 2, runs: 1 },
  { type: "challenge",        count: 3, runs: 1 },
  { type: "cheatsheet",       count: 3, runs: 1 },
];

async function fireRun(label, params = {}) {
  const url = new URL(`${WORKER}/api/public/hooks/auto-generate-content`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set("trigger", "manual");
  const start = Date.now();
  // Each call gets up to 5 min from us.
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 290_000);
  try {
    const r = await fetch(url.toString(), {
      method: "POST",
      headers: { "x-internal-cron-secret": SECRET, "Content-Type": "application/json" },
      body: "{}",
      signal: controller.signal,
    });
    clearTimeout(t);
    const j = await r.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (!r.ok) {
      console.log(`  ✗ ${label} (${elapsed}s) → ${r.status}: ${JSON.stringify(j).slice(0, 160)}`);
      return { ok: false, inserted: 0, rejected: 0 };
    }
    console.log(`  ${j.inserted > 0 ? "✓" : "~"} ${label} (${elapsed}s) → +${j.inserted}, rej ${j.rejected}`);
    return { ok: true, inserted: j.inserted, rejected: j.rejected };
  } catch (e) {
    clearTimeout(t);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✗ ${label} (${elapsed}s) → ${e.message ?? e.name ?? e}`);
    return { ok: false, inserted: 0, rejected: 0 };
  }
}

console.log(`Seeding via ${WORKER}\n`);

let totalInserted = 0;
let totalRejected = 0;
let totalFailed = 0;

// Fire all type-runs in parallel for fastest wall time, but cap at ~6
// concurrent so we don't stack too many subrequests.
async function pool(tasks, limit = 6) {
  const queue = [...tasks];
  const workers = Array.from({ length: limit }).map(async () => {
    while (queue.length) {
      const t = queue.shift();
      if (!t) break;
      await t();
    }
  });
  await Promise.all(workers);
}

const tasks = [];
for (const plan of TYPE_PLAN) {
  for (let i = 1; i <= plan.runs; i++) {
    tasks.push(async () => {
      const r = await fireRun(`${plan.type} #${i}`, { type: plan.type, count: plan.count });
      totalInserted += r.inserted;
      totalRejected += r.rejected;
      if (!r.ok) totalFailed++;
    });
  }
}

await pool(tasks, 6);

console.log(`\n========================================`);
console.log(`Summary: ${totalInserted} inserted, ${totalRejected} rejected, ${totalFailed} failed runs of ${tasks.length}`);
