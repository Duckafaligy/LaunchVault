import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users, Eye, TrendingUp, TrendingDown, ShieldCheck, Calendar,
  UserCheck, PieChart, FileText, Link2, Globe,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { getVisitorStats, type TrafficChannel } from "@/utils/analytics.functions";

// Display metadata per acquisition channel. Search = SEO, AI engines = AEO.
const CHANNEL_META: Record<
  TrafficChannel,
  { label: string; sub?: string; dot: string; bar: string }
> = {
  direct:   { label: "Direct",     sub: "typed / saved", dot: "bg-slate-400",   bar: "from-slate-400 to-slate-500" },
  search:   { label: "Search",     sub: "SEO",           dot: "bg-emerald-500", bar: "from-emerald-500 to-teal-500" },
  ai:       { label: "AI engines", sub: "AEO",           dot: "bg-fuchsia-500", bar: "from-fuchsia-500 to-violet-500" },
  social:   { label: "Social",     sub: undefined,       dot: "bg-sky-500",     bar: "from-sky-500 to-cyan-500" },
  referral: { label: "Referral",   sub: undefined,       dot: "bg-amber-500",   bar: "from-amber-500 to-orange-500" },
  internal: { label: "Internal",   sub: undefined,       dot: "bg-zinc-300",    bar: "from-zinc-300 to-zinc-400" },
};

export function VisitorStats() {
  const { user } = useAuth();

  // Server function does its own admin role check. If it throws, we render
  // nothing — the user just isn't admin. Simpler than a separate client-side
  // RLS check.
  const fetchStats = useServerFn(getVisitorStats);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["visitor-stats", user?.id],
    enabled: !!user,
    queryFn: () => fetchStats(),
    staleTime: 60_000,
    retry: false,
  });

  // Non-admins (or any error) → render nothing.
  if (isError) return null;
  if (!user) return null;

  if (isLoading || !data) {
    return (
      <section className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-6 shadow-soft">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
          <ShieldCheck className="h-3 w-3" /> Admin · Site analytics
        </div>
        <div className="mt-4 h-44 animate-pulse rounded-2xl bg-muted/40" />
      </section>
    );
  }

  const { series, totals, sources, topReferrers, topPages, countries } = data;
  const TrendIcon = totals.trendPct >= 0 ? TrendingUp : TrendingDown;
  const trendColor = totals.trendPct >= 0 ? "text-emerald-600" : "text-rose-600";

  // Source % is relative to acquisition traffic (direct + external referrers);
  // our own-domain navigation ("internal") is folded out server-side.
  const totalSourceViews = sources.reduce((a, s) => a + s.views, 0);
  const pct = (n: number) => (totalSourceViews ? Math.round((n / totalSourceViews) * 100) : 0);
  const aiViews = sources.find((s) => s.channel === "ai")?.views ?? 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-fuchsia-500/5 p-6 shadow-soft md:p-7">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-soft">
            <ShieldCheck className="h-3 w-3" /> Admin · Site analytics
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">Last 30 days</h3>
        </div>
        <div className={`inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold ring-1 ring-border ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" /> {totals.trendPct > 0 ? "+" : ""}{totals.trendPct}% vs prev 7d
        </div>
      </div>

      {/* Stat tiles */}
      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Eye} label="Page views (30d)" value={totals.views30d.toLocaleString()} accent="from-violet-500 to-fuchsia-500" />
        <StatTile icon={Users} label="Unique visits (30d)" value={totals.uniques30d.toLocaleString()} accent="from-indigo-500 to-cyan-500" />
        <StatTile icon={UserCheck} label="Logged-in views (30d)" value={totals.authViews30d.toLocaleString()} accent="from-emerald-500 to-teal-500" />
        <StatTile icon={Calendar} label="Today" value={totals.today.toLocaleString()} accent="from-amber-500 to-orange-500" />
      </div>

      {/* Chart */}
      <div className="relative mt-6 h-44 w-full rounded-2xl bg-white/60 p-3 ring-1 ring-border">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="vsViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(124, 58, 237)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="rgb(124, 58, 237)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="vsUniques" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(100,116,139,0.12)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(99,102,241,0.4)",
                borderRadius: 10,
                color: "#fff",
                fontSize: 12,
              }}
              labelStyle={{ color: "#cbd5e1" }}
            />
            <Area
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="rgb(124, 58, 237)"
              strokeWidth={2}
              fill="url(#vsViews)"
            />
            <Area
              type="monotone"
              dataKey="uniques"
              name="Unique"
              stroke="rgb(6, 182, 212)"
              strokeWidth={2}
              fill="url(#vsUniques)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Traffic sources — SEO vs AEO vs social vs direct */}
      <div className="relative mt-6 rounded-2xl bg-white/60 p-4 ring-1 ring-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <PieChart className="h-3.5 w-3.5" /> Traffic sources
          </span>
          <span className="text-[10px] text-muted-foreground">
            share of {totalSourceViews.toLocaleString()} acquisition visits · internal navigation excluded
          </span>
        </div>
        <div className="mt-3 space-y-2.5">
          {sources.map((s) => {
            const meta = CHANNEL_META[s.channel];
            const percent = pct(s.views);
            const isAI = s.channel === "ai";
            return (
              <div key={s.channel} className="flex items-center gap-3">
                <div className="flex w-32 shrink-0 items-center gap-2 sm:w-44">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                  <span className="truncate text-sm font-semibold">{meta.label}</span>
                  {meta.sub && (
                    <span
                      className={`shrink-0 rounded px-1 text-[9px] font-bold uppercase tracking-wide ${
                        isAI ? "bg-fuchsia-100 text-fuchsia-700" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {meta.sub}
                    </span>
                  )}
                </div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${meta.bar}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-sm tabular-nums">
                  <span className="font-bold">{s.views.toLocaleString()}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
        {aiViews === 0 && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            No AI-engine (AEO) referrals detected yet. ChatGPT, Perplexity, Gemini & co. often
            strip the referrer, so this reads low even when AI sends real traffic — treat it as a floor.
          </p>
        )}
      </div>

      {/* Top pages + top referrers */}
      <div className="relative mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/60 p-4 ring-1 ring-border">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> Top pages
          </div>
          <div className="mt-3 space-y-1.5">
            {topPages.map((p) => (
              <div key={p.path} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium" title={p.path}>{p.path}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-bold">{p.views.toLocaleString()}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{p.uniques.toLocaleString()} uniq</span>
                </span>
              </div>
            ))}
            {topPages.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white/60 p-4 ring-1 ring-border">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" /> Top referrers
          </div>
          <div className="mt-3 space-y-1.5">
            {topReferrers.map((r) => {
              const meta = CHANNEL_META[r.channel];
              return (
                <div key={r.host} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                    <span className="truncate font-medium" title={r.host}>{r.host}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{meta.label}</span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">{r.views.toLocaleString()}</span>
                </div>
              );
            })}
            {topReferrers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No external referrers yet — visits are direct or internal.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Countries — fills in going forward from the Cloudflare CF-IPCountry header */}
      {countries.length > 0 && (
        <div className="relative mt-4 rounded-2xl bg-white/60 p-4 ring-1 ring-border">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <Globe className="h-3.5 w-3.5" /> Top countries
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {countries.map((c) => (
              <span
                key={c.country}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs ring-1 ring-border"
              >
                <span className="font-bold">{c.country}</span>
                <span className="tabular-nums text-muted-foreground">{c.views.toLocaleString()}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="relative mt-4 text-[11px] leading-relaxed text-muted-foreground">
        First-party counts — every real page navigation, from every source, not just Google. This is
        your true traffic number, so it runs higher than Google Search Console (which only counts
        Google-indexed impressions) and won&rsquo;t match it. Aggregated daily in UTC. Admins only.
      </p>
    </section>
  );
}

function StatTile({
  icon: Icon, label, value, accent,
}: { icon: typeof Eye; label: string; value: string; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-white/80 p-4 shadow-soft">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center gap-2">
        <div className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${accent} text-white`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
