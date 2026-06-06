// =====================================================================
// Public, cacheable stats endpoint for the landing page + dashboard.
// Returns LIVE counts pulled from the database — no auth required.
// All numbers used on /, /pricing, /features are wired through this.
// =====================================================================
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }
  return _client;
}

const TYPE_KEYS = [
  "prompt", "course", "workflow", "agent", "business_lesson",
  "insight", "tool_guide", "playbook", "challenge", "cheatsheet",
  "glossary", "essay",
] as const;

export const Route = createFileRoute("/api/public/stats")({
  server: {
    handlers: {
      GET: async () => {
        const sb = getClient();
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [
          { count: totalContent },
          { count: totalMembers },
          { count: newIn24h },
          { count: newIn7d },
          { data: recent },
        ] = await Promise.all([
          sb.from("content_items").select("*", { count: "exact", head: true }).eq("is_published", true),
          sb.from("profiles").select("*", { count: "exact", head: true }),
          sb.from("content_items").select("*", { count: "exact", head: true }).eq("is_published", true).gte("created_at", dayAgo),
          sb.from("content_items").select("*", { count: "exact", head: true }).eq("is_published", true).gte("created_at", weekAgo),
          sb.from("content_items").select("title, type, slug, created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(1),
        ]);

        // Per-type counts — group manually since the RPC may not exist
        const grouped: Record<string, number> = {};
        await Promise.all(
          TYPE_KEYS.map(async (t) => {
            const { count } = await sb
              .from("content_items")
              .select("*", { count: "exact", head: true })
              .eq("is_published", true)
              .eq("type", t);
            grouped[t] = count ?? 0;
          }),
        );

        // Cron run stats — last 24h
        const { data: lastRun } = await sb
          .from("content_generation_runs")
          .select("started_at, finished_at, inserted_count, status")
          .order("started_at", { ascending: false })
          .limit(1);

        return new Response(
          JSON.stringify({
            content_total: totalContent ?? 0,
            members_total: totalMembers ?? 0,
            new_in_24h: newIn24h ?? 0,
            new_in_7d: newIn7d ?? 0,
            by_type: grouped,
            // Helper rollups for landing
            glossary_total: grouped.glossary ?? 0,
            essay_total: grouped.essay ?? 0,
            // 50 mastery domains is fixed
            domains_total: 50,
            // Engine cadence (hardcoded — matches wrangler.jsonc cron)
            cycle_hours: 2,
            most_recent: recent?.[0]
              ? {
                  title: (recent[0] as any).title,
                  type: (recent[0] as any).type,
                  slug: (recent[0] as any).slug,
                  created_at: (recent[0] as any).created_at,
                }
              : null,
            last_run: lastRun?.[0] ?? null,
            updated_at: new Date().toISOString(),
          }),
          {
            headers: {
              "content-type": "application/json",
              // Cache 60s at the edge, allow stale for 5 min
              "cache-control": "public, max-age=60, stale-while-revalidate=300",
            },
          },
        );
      },
    },
  },
});
