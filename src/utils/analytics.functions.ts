// Lightweight page-view analytics. Anonymized.
// Called from the root layout on every navigation, fire-and-forget.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const RecordSchema = z.object({
  path: z.string().min(1).max(500),
  anonId: z.string().min(8).max(64).optional(),
  referrer: z.string().max(1000).optional(),
});

/**
 * Public — accepts both authed and anonymous visits.
 * If an authorization header is present, attribute the view to the user.
 */
export const recordPageView = createServerFn({ method: "POST" })
  .inputValidator((input) => RecordSchema.parse(input))
  .handler(async ({ data }) => {
    let userId: string | null = null;
    let country: string | null = null;
    let userAgent: string | null = null;
    try {
      const req = getRequest();
      // Cloudflare attaches the visitor's country to every request — free
      // and accurate. "XX" = unknown, "T1" = Tor; treat both as null.
      const cc = req?.headers.get("cf-ipcountry") ?? null;
      country = cc && cc !== "XX" && cc !== "T1" ? cc : null;
      userAgent = req?.headers.get("user-agent")?.slice(0, 500) ?? null;
      const auth = req?.headers.get("authorization") ?? req?.headers.get("Authorization");
      if (auth?.startsWith("Bearer ")) {
        const token = auth.slice(7);
        const { data: u } = await supabaseAdmin.auth.getUser(token);
        userId = u?.user?.id ?? null;
      }
    } catch {
      // ignore — auth/headers are optional here
    }

    await supabaseAdmin.from("page_views").insert({
      path: data.path.slice(0, 500),
      user_id: userId,
      anon_id: data.anonId ?? null,
      referrer: data.referrer ?? null,
      country,
      user_agent: userAgent,
    });
    return { ok: true };
  });

export type TrafficChannel =
  | "direct" | "search" | "ai" | "social" | "referral" | "internal";

/**
 * Map a cleaned referrer host (from v_page_views_sources_30d) to an
 * acquisition channel. Kept in code (not SQL) so the host lists are easy
 * to extend without a migration. "ai" = AI answer engines (AEO):
 * ChatGPT, Perplexity, Gemini, Copilot, Claude, etc. "internal" =
 * our own domain / localhost (navigation noise, excluded from sources).
 */
function classifyHost(host: string): TrafficChannel {
  if (host === "direct") return "direct";
  const h = host.toLowerCase();
  if (h.includes("launchvault") || h === "localhost" || h.startsWith("localhost"))
    return "internal";
  // AI answer engines — checked first so gemini.google / copilot.microsoft land here.
  if (
    h.includes("chatgpt") || h.includes("openai") || h.includes("perplexity") ||
    h.includes("gemini") || h.includes("bard.google") || h.includes("copilot") ||
    h.includes("claude") || h.includes("anthropic") || h === "you.com" ||
    h.endsWith(".you.com") || h.includes("poe.com") || h.includes("phind") ||
    h.includes("deepseek") || h.includes("grok") || h.includes("meta.ai")
  )
    return "ai";
  // Search engines.
  if (
    h.includes("google.") || h === "google" || h.includes("bing.") || h === "bing" ||
    h.includes("duckduckgo") || h.includes("yahoo") || h.includes("yandex") ||
    h.includes("ecosia") || h.includes("baidu") || h.includes("brave") ||
    h.includes("startpage") || h.includes("qwant") || h.includes("kagi")
  )
    return "search";
  // Social / messaging.
  if (
    h.includes("instagram") || h.includes("facebook") || h === "fb.com" ||
    h.endsWith(".fb.com") || h.includes("twitter") || h === "t.co" || h === "x.com" ||
    h.endsWith(".x.com") || h.includes("linkedin") || h.includes("lnkd.in") ||
    h.includes("reddit") || h.includes("youtube") || h.includes("youtu.be") ||
    h.includes("tiktok") || h.includes("pinterest") || h.includes("threads") ||
    h === "t.me" || h.includes("whatsapp") || h.includes("discord") ||
    h.includes("telegram")
  )
    return "social";
  return "referral";
}

/**
 * Admin-only: 30-day analytics — daily series, totals, traffic sources
 * (SEO vs AEO vs social vs direct), top referrers, top pages, countries.
 * Uses requireSupabaseAuth to get a verified userId, then checks the admin
 * role. All aggregation happens in bounded SQL views.
 */
export const getVisitorStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const [
      { data: rollup },
      { data: sourceRows },
      { data: pageRows },
      { data: countryRows },
    ] = await Promise.all([
      supabaseAdmin
        .from("v_page_views_daily")
        .select("day, views, unique_visitors, auth_views")
        .order("day", { ascending: true }),
      supabaseAdmin.from("v_page_views_sources_30d").select("host, views, uniques"),
      supabaseAdmin.from("v_page_views_top_pages_30d").select("path, views, uniques"),
      supabaseAdmin.from("v_page_views_countries_30d").select("country, views, uniques"),
    ]);

    // Build a full 30-day series, zero-filled
    const byDay = new Map<string, { views: number; uniques: number; auth: number }>();
    (rollup ?? []).forEach((r: any) => {
      byDay.set(r.day, { views: r.views, uniques: r.unique_visitors, auth: r.auth_views });
    });

    const series: Array<{ day: string; views: number; uniques: number; auth: number }> = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      const v = byDay.get(key) ?? { views: 0, uniques: 0, auth: 0 };
      series.push({ day: key, ...v });
    }

    const totalViews = series.reduce((a, x) => a + x.views, 0);
    const totalUniques = series.reduce((a, x) => a + x.uniques, 0);
    const totalAuth = series.reduce((a, x) => a + x.auth, 0);
    const last7 = series.slice(-7).reduce((a, x) => a + x.views, 0);
    const prev7 = series.slice(-14, -7).reduce((a, x) => a + x.views, 0);
    const trend = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;

    // Classify each cleaned referrer host into an acquisition channel and
    // tally views per channel. sourceRows has one row per host (incl. the
    // 'direct' bucket); 'internal' = our own domain / localhost navigation
    // noise, which we fold out of the acquisition splits.
    const channelViews: Record<TrafficChannel, number> = {
      direct: 0, search: 0, ai: 0, social: 0, referral: 0, internal: 0,
    };
    const externalReferrers: Array<{ host: string; views: number; channel: TrafficChannel }> = [];
    (sourceRows ?? []).forEach((r: any) => {
      const channel = classifyHost(r.host);
      channelViews[channel] += r.views;
      if (channel !== "direct" && channel !== "internal") {
        externalReferrers.push({ host: r.host, views: r.views, channel });
      }
    });
    externalReferrers.sort((a, b) => b.views - a.views);

    const sourceOrder: TrafficChannel[] = ["direct", "search", "ai", "social", "referral"];
    const sources = sourceOrder.map((channel) => ({ channel, views: channelViews[channel] }));

    const topPages = (pageRows ?? []).slice(0, 12).map((r: any) => ({
      path: r.path, views: r.views, uniques: r.uniques,
    }));
    const countries = (countryRows ?? []).slice(0, 10).map((r: any) => ({
      country: r.country, views: r.views, uniques: r.uniques,
    }));

    return {
      series,
      totals: {
        views30d: totalViews,
        uniques30d: totalUniques,
        authViews30d: totalAuth,
        last7d: last7,
        prev7d: prev7,
        trendPct: trend,
        today: series[series.length - 1]?.views ?? 0,
      },
      sources,
      topReferrers: externalReferrers.slice(0, 8),
      topPages,
      countries,
    };
  });
