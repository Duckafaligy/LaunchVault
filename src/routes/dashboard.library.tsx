// =====================================================================
// /dashboard/library — unified library browse inside the dashboard.
//
// Mirrors the public /library experience but lives inside the dashboard
// layout (sidebar, topbar, search). Lets logged-in users browse ALL types
// in one grid instead of clicking through per-type pages.
//
// Tier gating: items the user has paid for show as unlocked; locked items
// still appear but with a visible lock badge. Free items are ALWAYS
// unlocked for anyone logged in.
// =====================================================================

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Library as LibraryIcon, Search, Filter, Lock, ArrowRight, Sparkles, Clock,
  MessageSquareCode, GraduationCap, Workflow as WorkflowIcon, Bot, Briefcase,
  Lightbulb, Wrench, ScrollText, Target, FileText, BookOpen, Pencil, CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/format-date";
import { listLibrary } from "@/utils/library.functions";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { domainLabel } from "@/config/domains";
import { SaveButton } from "@/components/saved/SaveButton";
import { useUpgrade } from "@/components/dashboard/UpgradeDialog";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/library")({
  component: DashboardLibraryPage,
});

// Map type → label + icon + gradient. Glossary + essay rendered too — they're
// FREE for everyone and route to the public /glossary or /blog pages.
const TYPE_META: Record<string, { label: string; icon: LucideIcon; gradient: string; route: string }> = {
  prompt:          { label: "Prompt",     icon: MessageSquareCode, gradient: "from-violet-600 to-fuchsia-500", route: "/dashboard/content/$id" },
  course:          { label: "Course",     icon: GraduationCap,     gradient: "from-indigo-600 to-cyan-500",    route: "/dashboard/content/$id" },
  workflow:        { label: "Workflow",   icon: WorkflowIcon,      gradient: "from-sky-500 to-indigo-600",     route: "/dashboard/content/$id" },
  agent:           { label: "Agent",      icon: Bot,               gradient: "from-fuchsia-600 to-pink-500",   route: "/dashboard/content/$id" },
  business_lesson: { label: "Business",   icon: Briefcase,         gradient: "from-emerald-600 to-teal-500",   route: "/dashboard/content/$id" },
  insight:         { label: "Insight",    icon: Lightbulb,         gradient: "from-amber-500 to-orange-500",   route: "/dashboard/content/$id" },
  tool_guide:      { label: "Tool guide", icon: Wrench,            gradient: "from-zinc-700 to-slate-700",     route: "/dashboard/content/$id" },
  playbook:        { label: "Playbook",   icon: ScrollText,        gradient: "from-rose-600 to-fuchsia-600",   route: "/dashboard/content/$id" },
  challenge:       { label: "Challenge",  icon: Target,            gradient: "from-red-600 to-orange-500",     route: "/dashboard/content/$id" },
  cheatsheet:      { label: "Cheatsheet", icon: FileText,          gradient: "from-indigo-500 to-cyan-500",    route: "/dashboard/content/$id" },
  glossary:        { label: "Glossary",   icon: BookOpen,          gradient: "from-cyan-500 to-sky-600",       route: "/glossary/$slug" },
  essay:           { label: "Essay",      icon: Pencil,            gradient: "from-amber-500 to-fuchsia-500",  route: "/blog/$slug" },
};

const ALL_TYPES = Object.keys(TYPE_META);

function DashboardLibraryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchList = useServerFn(listLibrary);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [lockedFilter, setLockedFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  // Fetch ALL items in one shot (listLibrary accepts a types[] filter).
  // limit: 2000 so the full library loads — a 200 cap previously stopped this
  // grid at 200 items even though 577+ are published.
  const { data: items, isLoading } = useQuery({
    queryKey: ["dashboard-library", user?.id],
    enabled: !!user,
    queryFn: () => fetchList({ data: { types: ALL_TYPES as any, limit: 2000 } }),
  });

  // Realtime: refresh when any content_items row is added
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-library-all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "content_items" }, () => {
        qc.invalidateQueries({ queryKey: ["dashboard-library"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  // Per-type counts (live)
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    (items ?? []).forEach((it: any) => { c[it.type] = (c[it.type] ?? 0) + 1; });
    return c;
  }, [items]);

  // Domains actually present in the library (for the domain filter dropdown)
  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    (items ?? []).forEach((it: any) => { if (it.domain) set.add(it.domain); });
    return Array.from(set).sort((a, b) => domainLabel(a).localeCompare(domainLabel(b)));
  }, [items]);

  const total = items?.length ?? 0;
  const unlockedTotal = (items ?? []).filter((i: any) => !i.locked).length;

  const filtered = useMemo(() => {
    let list = items ?? [];
    if (typeFilter !== "all") list = list.filter((i: any) => i.type === typeFilter);
    if (domainFilter !== "all") list = list.filter((i: any) => i.domain === domainFilter);
    if (lockedFilter === "unlocked") list = list.filter((i: any) => !i.locked);
    if (lockedFilter === "locked")   list = list.filter((i: any) => i.locked);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((i: any) =>
        i.title.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q) ||
        (i.short_description ?? "").toLowerCase().includes(q) ||
        (i.tags ?? []).some((t: string) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [items, typeFilter, domainFilter, lockedFilter, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero strip */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-slate-950 p-8 text-white shadow-elevated">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-indigo-600/30 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-200">
              <LibraryIcon className="h-3 w-3" /> Full library
            </span>
            <h1 className="font-display mt-4 text-balance text-3xl font-bold leading-tight tracking-tight md:text-[2.5rem]">
              Browse every article, all types
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
              The same articles that live on the public site — just inside your dashboard with one-click open + Save to Vault. Type counts update live.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <Stat value={total} label="items" />
            <Stat value={unlockedTotal} label="unlocked" accent />
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search across all titles, descriptions, and tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11"
          />
        </div>

        {/* Lock/unlock filter + domain dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(["all", "unlocked", "locked"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setLockedFilter(opt)}
                className={`rounded-full px-3 py-1.5 font-bold uppercase tracking-[0.18em] transition-colors ${
                  lockedFilter === opt
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {availableDomains.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs">
              <span className="font-bold uppercase tracking-[0.18em] text-muted-foreground">Domain</span>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">All domains</option>
                {availableDomains.map((d) => (
                  <option key={d} value={d}>{domainLabel(d)}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
              typeFilter === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            All types <span className="tabular-nums">{total}</span>
          </button>
          {ALL_TYPES.map((t) => {
            const m = TYPE_META[t];
            const n = typeCounts[t] ?? 0;
            if (n === 0) return null;
            const Icon = m.icon;
            const active = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                  active
                    ? `border-transparent bg-gradient-to-r ${m.gradient} text-white shadow-soft`
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label} <span className="tabular-nums">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center shadow-soft">
          <Sparkles className="mx-auto h-7 w-7 text-muted-foreground" />
          <p className="font-display mt-3 text-xl font-bold">No items match those filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try clearing search + lock filter, or wait for the engine cycle to add more.</p>
          <button onClick={() => { setSearch(""); setTypeFilter("all"); setLockedFilter("all"); setDomainFilter("all"); }} className="mt-4 text-sm font-bold text-primary hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it: any) => <LibraryCard key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-2 backdrop-blur ${accent ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/15 bg-white/[0.04]"}`}>
      <p className={`font-display text-2xl font-bold tabular-nums leading-none ${accent ? "text-emerald-300" : "text-white"}`}>{value.toLocaleString()}</p>
      <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-300">{label}</p>
    </div>
  );
}

function LibraryCard({ item }: { item: any }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.prompt;
  const Icon = meta.icon;
  const isFree = item.tier_required === "free";
  const locked = item.locked && !isFree;
  const upgrade = useUpgrade();

  const cardClass =
    "group relative flex w-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated";

  // FREE / unlocked items link to the content view or public route.
  // LOCKED items open the in-dashboard upgrade popup (no redirect to /pricing).
  const linkProps =
    meta.route === "/glossary/$slug"
      ? ({ to: "/glossary/$slug" as const, params: { slug: item.slug ?? item.id } } as const)
      : meta.route === "/blog/$slug"
        ? ({ to: "/blog/$slug" as const, params: { slug: item.slug ?? item.id } } as const)
        : ({ to: "/dashboard/content/$id" as const, params: { id: item.id } } as const);

  // Use a clickable div (not <button>) for locked cards so the nested
  // SaveButton stays valid HTML.
  const Wrapper = locked
    ? (props: any) => (
        <div
          role="button"
          tabIndex={0}
          onClick={() => upgrade.open(item.tier_required)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); upgrade.open(item.tier_required); }
          }}
          {...props}
        />
      )
    : (props: any) => <Link {...(linkProps as any)} {...props} />;

  return (
    <Wrapper className={cardClass}>
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${meta.gradient}`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shadow-soft`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex items-center gap-1.5">
          {/* Status pill: free = green, paid+unlocked = neutral, paid+locked = lock */}
          {isFree ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
              Free
            </span>
          ) : item.locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/70 ring-1 ring-foreground/10">
              <Lock className="h-3 w-3" /> {item.tier_required}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary ring-1 ring-primary/25">
              {item.tier_required}
            </span>
          )}
          <SaveButton contentId={item.id} variant="icon" className="!h-7 !w-7" />
        </div>
      </div>

      <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {meta.label}{item.domain ? ` · ${domainLabel(item.domain)}` : ""}
      </p>
      <h3 className="font-display mt-1.5 line-clamp-2 text-[1.05rem] font-bold leading-snug tracking-tight">
        {item.title}
      </h3>
      {(item.short_description || item.description) && (
        <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
          {item.short_description ?? item.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-2.5">
          {item.created_at && (
            <span className="inline-flex items-center gap-1" title={`Added ${timeAgo(item.created_at)}`}>
              <CalendarDays className="h-3 w-3" /> {timeAgo(item.created_at)}
            </span>
          )}
          {item.estimated_minutes != null && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {item.estimated_minutes}m</span>
          )}
        </span>
        <span className="inline-flex items-center gap-0.5 font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {locked ? "Unlock" : "Open"} <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Wrapper>
  );
}
