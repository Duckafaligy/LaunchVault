import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { generateContentInProcess } from "./routes/api/public/hooks/auto-generate-content";
import { setRequestExecCtx, type ExecCtx } from "./lib/exec-ctx";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

// Scheduled handler — the Cloudflare Cron Trigger fires this every 2 hours
// (12 runs/day; see wrangler.jsonc `triggers.crons`). This is the ONLY scheduler.
//
// Generation runs IN-PROCESS (we call generateContentInProcess directly — a
// Worker can't fetch its own hostname, so the old HTTP fan-out silently failed).
// The scheduled() handler gets a generous execution budget, so a full multi-type
// run can complete in one invocation. We process the plan in small concurrent
// batches and put the SEO-critical types (glossary, essay, insight) first so
// they generate even if a later batch runs out of budget.
async function logHeartbeat(env: Record<string, string | undefined>, fields: Record<string, any>) {
  // Fire-and-forget heartbeat — proves whether Cloudflare invoked us at all.
  // We write directly via PostgREST so we don't depend on createClient bundles.
  try {
    const supabaseUrl = env?.SUPABASE_URL?.trim();
    const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceKey) return null;
    const r = await fetch(`${supabaseUrl}/rest/v1/cron_heartbeats`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(fields),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function updateHeartbeat(env: Record<string, string | undefined>, id: string, fields: Record<string, any>) {
  try {
    const supabaseUrl = env?.SUPABASE_URL?.trim();
    const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceKey || !id) return;
    await fetch(`${supabaseUrl}/rest/v1/cron_heartbeats?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fields),
    });
  } catch {/* ignore */}
}

async function runScheduledGeneration(env: Record<string, string | undefined>, source = "cron") {
  // Step 0 — heartbeat row that proves Cloudflare invoked the handler
  const heartbeatId = await logHeartbeat(env, {
    source,
    env_ok: !!(env?.OPENAI_API_KEY && env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY),
  });

  // We no longer dispatch HTTP subrequests — a Cloudflare Worker cannot fetch
  // its own hostname (those subrequests are silently dropped, which is why the
  // cron "fired" but produced nothing). Generation now runs IN-PROCESS, so
  // WORKER_URL / INTERNAL_CRON_SECRET are not required here. The real env the
  // engine needs (OPENAI_API_KEY / SUPABASE_*) is validated inside
  // generateContentInProcess. We keep `origin` only for the heartbeat log.
  const origin = ((env?.WORKER_URL ?? env?.PUBLIC_BASE_URL ?? "") as string).trim().replace(/\/+$/, "");
  if (!env?.OPENAI_API_KEY || !env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
    const msg = "missing OPENAI_API_KEY or SUPABASE_* — cannot generate";
    console.error("scheduled: " + msg);
    if (heartbeatId) await updateHeartbeat(env, heartbeatId, { error: msg, finished_at: new Date().toISOString() });
    return;
  }
  console.log(`scheduled: in-process generation starting at ${new Date().toISOString()}`);
  if (heartbeatId) await updateHeartbeat(env, heartbeatId, { origin: origin || "in-process" });

  // === Coverage-first strategy ===
  // Every type should have at least 1 published item before the regular rotation
  // takes over. We query content_items to find which types are still at 0,
  // then we generate FOR THOSE FIRST (with retries until they succeed).
  const ALL_GEN_TYPES = [
    "insight", "prompt", "workflow", "course", "agent", "business_lesson",
    "tool_guide", "playbook", "challenge", "cheatsheet", "glossary", "essay",
  ];
  let emptyTypes: string[] = [];
  try {
    const supabaseUrl = env?.SUPABASE_URL?.trim();
    const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (supabaseUrl && serviceKey) {
      // PostgREST: count for each type via a single grouped query
      const r = await fetch(`${supabaseUrl}/rest/v1/content_items?select=type&is_published=eq.true`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      if (r.ok) {
        const rows = (await r.json()) as Array<{ type: string }>;
        const present = new Set(rows.map((x) => x.type));
        emptyTypes = ALL_GEN_TYPES.filter((t) => !present.has(t));
      }
    }
  } catch (e) {
    console.error("scheduled: coverage probe failed", (e as any)?.message ?? e);
  }
  if (emptyTypes.length > 0) {
    console.log(`scheduled: coverage-first run — empty types: ${emptyTypes.join(",")}`);
  }

  // Per-cron-run distribution, ordered SEO-FIRST. Generation runs in-process in
  // small concurrent batches, so the earliest entries always complete even if a
  // later batch runs out of execution budget. The organic-ranking content
  // (glossary, essay, insight) therefore leads every run.
  //
  // At 2-hour cadence = 12 runs/day. Daily totals (before ~30% quality-gate
  // rejection and before any budget cut of later batches):
  //   - glossary:        3 × 12 = 36/day  (AEO citation goldmine — DefinedTerm)
  //   - essay:           1 × 12 = 12/day  (founder-voice blog — Article schema)
  //   - insight:         2 × 12 = 24/day  (frequent, highly indexable)
  //   - prompt:          2 × 12 = 24/day
  //   - workflow:        1 × 12 = 12/day
  //   - business_lesson: 1 × 12 = 12/day
  //   - course:          1 × 12 = 12/day
  //   - agent:           1 × 12 = 12/day
  //   + 1 rotating extra type per run (tool_guide / playbook / challenge / cheatsheet)
  // ORDERING + BATCHING NOTE: this plan is consumed in CONCURRENCY-sized (3)
  // slices, and a Worker can exhaust its execution budget on the LATER batches
  // (that's the whole reason the SEO content leads). A COURSE is by far the
  // heaviest item we generate — 3 full 500-900 word lessons + quizzes ≈ 34s in
  // one call — so when it sat in the last batch it was killed before it could
  // finish on almost every run. That's why the library was stuck at 3 stale
  // courses. Course now rides in the FIRST batch (concurrent with the fast
  // glossary + insight jobs) so it is protected from the budget cutoff.
  //   batch 0: glossary (fast, AEO lead) · course (heavy, protected) · insight
  //   batch 1: prompt · workflow · essay
  //   batch 2: business_lesson · agent · rotating extra  (cut first if budget runs low)
  const plan: Array<[string, number]> = [
    // --- batch 0: AEO lead + the heavy course, both protected from any cutoff ---
    ["glossary",         3], // AEO citation goldmine — DefinedTerm schema per item
    ["course",           1], // HEAVIEST item — must run first or it never finishes
    ["insight",          2], // Frequent, highly indexable short takes
    // --- batch 1: core product content ---
    ["prompt",           2],
    ["workflow",         1],
    ["essay",            1], // Founder-voice blog — Article schema
    // --- batch 2: may be cut if execution budget runs low ---
    ["business_lesson",  1],
    ["agent",            1],
  ];
  const hour = new Date().getUTCHours();
  const extras: Array<[string, number]> = [
    ["tool_guide", 2], ["playbook", 2], ["challenge", 2], ["cheatsheet", 2],
  ];
  // Rotate the extra every tick (every 2h) so all four get covered across the day.
  const extraIdx = Math.floor(hour / 2) % extras.length;
  plan.push(extras[extraIdx]);

  // Coverage-first: prepend a retry batch for any empty types (3 attempts each
  // at count=1 — different temperature/seed each call, raises odds the model
  // produces something that passes validation).
  if (emptyTypes.length > 0) {
    for (const t of emptyTypes) {
      // Up to 3 priority attempts per empty type per cron tick
      plan.unshift([t, 1]);
      plan.unshift([t, 1]);
      plan.unshift([t, 1]);
    }
  }

  // Run the plan IN-PROCESS in small concurrent batches. Each entry calls the
  // engine directly (no HTTP), so nothing depends on the worker reaching its
  // own hostname. Batching keeps memory + OpenAI concurrency bounded.
  const CONCURRENCY = 3;
  let okCount = 0;
  let totalInserted = 0;
  const triggerLabel = source === "cron" ? "cron" : source;
  for (let i = 0; i < plan.length; i += CONCURRENCY) {
    const batch = plan.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(async ([type, count]) => {
        const res = await generateContentInProcess({
          jobs: [{ type: type as any, count }],
          trigger: triggerLabel,
          env, // scheduled() delivers secrets via env, not process.env
        });
        return { type, ok: res.ok, inserted: res.inserted, rejected: res.rejected };
      }),
    );
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value.ok) {
        okCount++;
        totalInserted += s.value.inserted;
        console.log(`scheduled[${s.value.type}] ok inserted=${s.value.inserted} rejected=${s.value.rejected}`);
      } else {
        const reason = s.status === "rejected"
          ? String((s as PromiseRejectedResult).reason)
          : `error=${(s.value as any)?.ok === false ? "engine returned ok:false" : "unknown"}`;
        console.error(`scheduled batch entry failed: ${reason}`);
      }
    }
  }
  console.log(`scheduled run complete: ${okCount}/${plan.length} jobs ran, ${totalInserted} items inserted`);
  if (heartbeatId) await updateHeartbeat(env, heartbeatId, {
    plan_size: plan.length,
    finished_at: new Date().toISOString(),
  });
}

// Exported so the manual-trigger API route can call it
export { runScheduledGeneration };

// Rewrite well-known crawler URLs to our internal API routes.
// /robots.txt → /api/public/robots
// /sitemap.xml → /api/public/sitemap
// /llms.txt → /api/public/llms (AEO — answer-engine optimisation)
function rewriteCrawlerUrls(request: Request): Request {
  const url = new URL(request.url);
  if (url.pathname === "/robots.txt") {
    const rewritten = new URL(request.url);
    rewritten.pathname = "/api/public/robots";
    return new Request(rewritten.toString(), request);
  }
  if (url.pathname === "/sitemap.xml") {
    const rewritten = new URL(request.url);
    rewritten.pathname = "/api/public/sitemap";
    return new Request(rewritten.toString(), request);
  }
  if (url.pathname === "/llms.txt" || url.pathname === "/llms-full.txt") {
    const rewritten = new URL(request.url);
    rewritten.pathname = "/api/public/llms";
    return new Request(rewritten.toString(), request);
  }
  return request;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Stash the per-request execution context so route handlers can reach
    // waitUntil (TanStack Start doesn't thread ctx into them). Used by the
    // generation endpoints to run work in the background and return instantly.
    if (ctx && typeof (ctx as ExecCtx).waitUntil === "function") {
      setRequestExecCtx(ctx as ExecCtx);
    }
    try {
      const handler = await getServerEntry();
      const rewritten = rewriteCrawlerUrls(request);
      const response = await handler.fetch(rewritten, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
  async scheduled(_event: unknown, env: unknown, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    const e = (env ?? {}) as Record<string, string | undefined>;
    ctx.waitUntil(runScheduledGeneration(e));
  },
};
