// =====================================================================
// /api/public/hooks/trigger-cron
//
// Manually invoke the scheduled-generation logic via HTTP. Required when
// the Cloudflare cron is misbehaving and we need to fire it on demand.
//
// Auth: x-internal-cron-secret header — same as the auto-generate endpoint.
// =====================================================================

import { createFileRoute } from "@tanstack/react-router";
import { runScheduledGeneration } from "@/server";
import { getRequestExecCtx } from "@/lib/exec-ctx";

export const Route = createFileRoute("/api/public/hooks/trigger-cron")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cronHeader = request.headers.get("x-internal-cron-secret");
        const expected = process.env.INTERNAL_CRON_SECRET;
        if (!expected || cronHeader !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const env = process.env as Record<string, string | undefined>;
        const ctx = getRequestExecCtx();

        // Preferred path: kick generation off in the BACKGROUND and return a
        // fast 200. The external cron (cron-job.org) has a short request
        // timeout, so a long inline run would be reported as "failed" even
        // though it succeeded. waitUntil keeps the worker alive until the
        // generation promise settles.
        if (ctx?.waitUntil) {
          ctx.waitUntil(
            runScheduledGeneration(env, "manual-trigger").catch((e) =>
              console.error("trigger-cron background generation failed:", e),
            ),
          );
          return new Response(
            JSON.stringify({
              success: true,
              mode: "background",
              dispatched_at: new Date().toISOString(),
              note: "Generation running in background. Check cron_heartbeats + content_generation_runs for results.",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        // Fallback: no execution context captured — run inline (slower response).
        try {
          await runScheduledGeneration(env, "manual-trigger");
        } catch (e: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: e?.message ?? "runScheduledGeneration threw",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            mode: "inline",
            dispatched_at: new Date().toISOString(),
            note: "Check cron_heartbeats table + content_generation_runs for results.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      },
    },
  },
});
