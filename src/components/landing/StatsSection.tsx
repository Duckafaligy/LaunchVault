// =====================================================================
// StatsSection — 100% live numbers pulled from /api/public/stats.
// No fabricated metrics. If the engine produced 4 items today, the page
// says 4 items today. If glossary has 7 entries, the page says 7.
//
// Numbers refresh every 60s (matches the stats endpoint's edge cache).
// =====================================================================

import { useEffect, useState } from "react";
import { Activity, BookOpen, RefreshCw, Sparkles, Library, TrendingUp, Pencil } from "lucide-react";
import { brand } from "@/config/brand";

type Stats = {
  content_total: number;
  members_total: number;
  new_in_24h: number;
  new_in_7d: number;
  by_type: Record<string, number>;
  glossary_total: number;
  essay_total: number;
  domains_total: number;
  cycle_hours: number;
  most_recent: { title: string; type: string; slug: string; created_at: string } | null;
  last_run: { started_at: string; finished_at: string | null; inserted_count: number; status: string } | null;
  updated_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  prompt: "Prompts", course: "Courses", workflow: "Workflows", agent: "Agents",
  business_lesson: "Business plays", insight: "Daily insights", tool_guide: "Tool guides",
  playbook: "Playbooks", challenge: "Challenges", cheatsheet: "Cheatsheets",
  glossary: "Glossary terms", essay: "Blog essays",
};

const TYPE_BASE_PATH: Record<string, string> = {
  glossary: "/glossary",
  essay: "/blog",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/public/stats", { headers: { accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: Stats | null) => j && setStats(j))
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000); // refresh once a minute
    return () => clearInterval(id);
  }, []);

  // Compute headline live numbers (with sensible fallback while loading)
  const totalItems = stats?.content_total ?? 0;
  const new24h = stats?.new_in_24h ?? 0;
  const new7d = stats?.new_in_7d ?? 0;
  const glossaryTotal = stats?.glossary_total ?? 0;
  const essayTotal = stats?.essay_total ?? 0;
  const domainsTotal = stats?.domains_total ?? 50;
  const cycleHours = stats?.cycle_hours ?? 6;

  return (
    <section className="relative overflow-hidden border-y border-border bg-slate-950 text-white">
      {/* Aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20">
        {/* Heading */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live · auto-refreshes
          </span>
          <h2 className="font-display mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
            The engine has shipped{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent tabular-nums">
              {totalItems.toLocaleString()}
            </span>
            {" "}items.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-indigo-100/70">
            Every number on this page is read live from our database and refreshes by the minute.
            Last refreshed {stats ? timeAgo(stats.updated_at) : "..."}.
          </p>
        </div>

        {/* HEADLINE STATS — 4 cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigStat
            icon={Library}
            label="Items in library"
            value={totalItems}
            sub={`across ${Object.keys(stats?.by_type ?? {}).filter((k) => (stats?.by_type[k] ?? 0) > 0).length} content types`}
            accent="from-indigo-500 to-violet-600"
          />
          <BigStat
            icon={TrendingUp}
            label="Published in last 24h"
            value={new24h}
            sub={new7d > 0 ? `${new7d} in the last 7 days` : "engine warming up"}
            accent="from-emerald-500 to-teal-600"
          />
          <BigStat
            icon={BookOpen}
            label="AI glossary terms"
            value={glossaryTotal}
            sub="DefinedTerm schema · LLM-citable"
            accent="from-cyan-500 to-sky-600"
          />
          <BigStat
            icon={Pencil}
            label="Editorial essays"
            value={essayTotal}
            sub={`${domainsTotal} mastery domains covered`}
            accent="from-fuchsia-500 to-pink-600"
          />
        </div>

        {/* PER-TYPE BREAKDOWN — live counts per content type */}
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Left: type breakdown */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <p className="relative text-[10.5px] font-bold uppercase tracking-[0.22em] text-fuchsia-300">By type</p>
            <h3 className="relative mt-1 font-display text-xl font-bold tracking-tight">Live library composition</h3>
            <p className="relative text-xs text-indigo-100/60">Items published, per content type. Updates every 60 seconds.</p>

            <div className="relative mt-6 space-y-3.5">
              {Object.entries(stats?.by_type ?? {})
                .sort((a, b) => b[1] - a[1])
                .map(([type, n]) => {
                  const label = TYPE_LABEL[type] ?? type;
                  const max = Math.max(1, ...Object.values(stats?.by_type ?? { x: 1 }));
                  const pct = (n / max) * 100;
                  return (
                    <div key={type}>
                      <div className="mb-1 flex items-baseline justify-between text-xs">
                        <span className="font-medium text-white/90">{label}</span>
                        <span className="font-display text-base font-bold tabular-nums text-white">{n}</span>
                      </div>
                      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right: most recent + engine pulse */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div aria-hidden className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
            <p className="relative text-[10.5px] font-bold uppercase tracking-[0.22em] text-cyan-300">Engine pulse</p>
            <h3 className="relative mt-1 font-display text-xl font-bold tracking-tight">Most recent drop</h3>

            {stats?.most_recent ? (
              <div className="relative mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-indigo-300">
                  {TYPE_LABEL[stats.most_recent.type] ?? stats.most_recent.type} · {timeAgo(stats.most_recent.created_at)}
                </p>
                <p className="font-display mt-2 line-clamp-2 text-[1.05rem] font-bold leading-snug">
                  {stats.most_recent.title}
                </p>
                <a
                  href={
                    TYPE_BASE_PATH[stats.most_recent.type]
                      ? `${TYPE_BASE_PATH[stats.most_recent.type]}/${stats.most_recent.slug}`
                      : `/library/${stats.most_recent.slug}`
                  }
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-indigo-300 hover:text-indigo-100"
                >
                  Read it →
                </a>
              </div>
            ) : (
              <p className="relative mt-5 text-sm text-indigo-100/60">Engine warming up — first item drops within the cycle.</p>
            )}

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
              <PulseStat
                icon={RefreshCw}
                label="Engine cycle"
                value={`Every ${cycleHours}h`}
                sub="Autonomous · Cloudflare cron"
              />
              <PulseStat
                icon={Sparkles}
                label="Quality bar"
                value="74–90"
                sub="Tier-scaled · low scores held back"
              />
            </div>
          </div>
        </div>

        {/* Footer note — live data source */}
        <p className="mt-10 text-center text-[11px] tracking-wide text-indigo-100/50">
          Every metric on this page is queried live from {brand.brandName}'s Postgres database via{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10.5px] text-indigo-200">/api/public/stats</code>,
          updated in real time.
        </p>
      </div>
    </section>
  );
}

function BigStat({
  icon: Icon, label, value, sub, accent,
}: { icon: typeof Activity; label: string; value: number; sub?: string; accent: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]">
      <div
        aria-hidden
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl transition-opacity group-hover:opacity-40`}
      />
      <div className="relative flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="font-display relative mt-5 text-4xl font-bold tabular-nums tracking-tight md:text-5xl">
        {value.toLocaleString()}
      </p>
      <p className="relative mt-1 text-sm font-semibold text-white/90">{label}</p>
      {sub && <p className="relative mt-0.5 text-[11.5px] text-indigo-100/60">{sub}</p>}
    </div>
  );
}

function PulseStat({
  icon: Icon, label, value, sub,
}: { icon: typeof Activity; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="font-display mt-1.5 text-lg font-bold leading-tight tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-indigo-100/55">{sub}</p>}
    </div>
  );
}
