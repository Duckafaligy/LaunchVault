import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search, Clock, Lock, ArrowRight, Sparkles, Layers, ShieldCheck, Flame,
  type LucideIcon,
} from "lucide-react";
import { listLibrary, type LibraryItem } from "@/utils/library.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DOMAIN_GROUPS, domainLabel, type DomainGroupSlug } from "@/config/domains";
import { TIER_LABEL } from "@/config/brand";
import { ShimmerGrid } from "@/components/ui/shimmer";
import { SaveButton } from "@/components/saved/SaveButton";

export type ContentTypeTheme = {
  type: string;                     // content_items.type
  eyebrow: string;                  // "Workflows"
  title: string;                    // "Step-by-step AI execution guides"
  blurb: string;                    // 1-2 sentence subtitle
  icon: LucideIcon;
  gradient: string;                 // "from-sky-500 to-indigo-600"
  ring: string;                     // "ring-sky-400/30"
  ctaSingular: string;              // "Open workflow"
  emptyTitle: string;
  emptyHint: string;
};

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const TIERS = ["free", "tier1", "tier2", "tier3", "tier4"] as const;

export function ContentTypeLibrary({ theme }: { theme: ContentTypeTheme }) {
  const fetchList = useServerFn(listLibrary);
  const qc = useQueryClient();
  const { user } = useAuth();
  // queryKey includes user.id — admins flipping role should bust the cache,
  // and different users see different locked/unlocked results.
  const { data, isLoading } = useQuery({
    queryKey: ["library", theme.type, user?.id ?? "anon"],
    queryFn: () => fetchList({ data: { type: theme.type as any } }),
  });

  // Webflow-style auto-refresh: subscribe to INSERTs on content_items of this
  // type. When the autonomous generator (or any admin action) inserts a new
  // row, the library refetches within a second — no page reload required.
  useEffect(() => {
    const channel = supabase
      .channel(`library-${theme.type}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "content_items", filter: `type=eq.${theme.type}` },
        () => {
          qc.invalidateQueries({ queryKey: ["library", theme.type] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [theme.type, qc]);

  const items = data ?? [];

  const [q, setQ] = useState("");
  const [group, setGroup] = useState<DomainGroupSlug | "all">("all");
  const [domain, setDomain] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [newOnly, setNewOnly] = useState(false);

  // domains present in this content type
  const presentDomains = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.domain && s.add(i.domain));
    return s;
  }, [items]);

  const visibleGroups = useMemo(() => {
    return DOMAIN_GROUPS
      .map((g) => ({
        ...g,
        domains: g.domains.filter((d) => presentDomains.has(d.slug)),
      }))
      .filter((g) => g.domains.length > 0);
  }, [presentDomains]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items.filter((it) => {
      if (group !== "all") {
        const g = DOMAIN_GROUPS.find((x) => x.slug === group);
        if (!g?.domains.some((d) => d.slug === it.domain)) return false;
      }
      if (domain !== "all" && it.domain !== domain) return false;
      if (difficulty !== "all" && it.difficulty !== difficulty) return false;
      if (tier !== "all" && it.tier_required !== tier) return false;
      if (newOnly && !it.is_new) return false;
      if (!ql) return true;
      return (
        it.title.toLowerCase().includes(ql) ||
        it.description?.toLowerCase().includes(ql) ||
        it.short_description?.toLowerCase().includes(ql) ||
        it.category?.toLowerCase().includes(ql) ||
        (it.tags ?? []).some((t) => t.toLowerCase().includes(ql)) ||
        domainLabel(it.domain).toLowerCase().includes(ql)
      );
    });
  }, [items, q, group, domain, difficulty, tier, newOnly]);

  const featured = filtered.find((i) => i.is_featured && !i.locked) ?? filtered.find((i) => !i.locked) ?? filtered[0];
  const rest = filtered.filter((i) => i.id !== featured?.id);
  const newCount = items.filter((i) => i.is_new).length;
  const unlockedCount = items.filter((i) => !i.locked).length;

  const Icon = theme.icon;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero — premium dark with aurora */}
      <header className="relative isolate overflow-hidden rounded-[1.75rem] border border-border bg-slate-950 text-white shadow-elevated">
        {/* Aurora */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className={`absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-gradient-to-br ${theme.gradient} opacity-35 blur-[110px]`} />
          <div className={`absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-gradient-to-tr ${theme.gradient} opacity-25 blur-[110px]`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(255,255,255,0.06),transparent_55%)]" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-6 p-8 md:p-10">
          <div className="flex min-w-0 flex-1 items-start gap-5">
            {/* Big floating icon */}
            <div className={`hidden h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-[0_18px_36px_-10px_rgba(99,102,241,0.55)] md:grid`}>
              <Icon className="h-7 w-7" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className={`inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur ring-1 ring-white/25`}>
                <Icon className="h-3 w-3 md:hidden" /> {theme.eyebrow}
              </p>
              <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-tight md:text-[2.25rem]">
                {theme.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75 md:text-[15px]">
                {theme.blurb}
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 md:w-auto">
            <Pill label="Total" value={items.length} />
            <Pill label="New 24h" value={newCount} accent="bg-amber-400/25" />
            <Pill label="Unlocked" value={unlockedCount} accent="bg-emerald-400/25" />
          </div>
        </div>
      </header>

      {/* Search + toggles */}
      <section className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${theme.eyebrow.toLowerCase()} by topic, domain, tag…`}
            className="h-12 pl-10 text-base"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Chip
            active={group === "all" && domain === "all"}
            onClick={() => { setGroup("all"); setDomain("all"); }}
            icon={Layers}
            label="All domains"
          />
          {visibleGroups.map((g) => (
            <Chip
              key={g.slug}
              active={group === g.slug}
              onClick={() => {
                setGroup(g.slug);
                setDomain("all");
              }}
              label={g.label}
            />
          ))}
        </div>

        {group !== "all" && (
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card/60 p-3">
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Domain</span>
            <Chip small active={domain === "all"} onClick={() => setDomain("all")} label="All" />
            {visibleGroups.find((g) => g.slug === group)?.domains.map((d) => (
              <Chip key={d.slug} small active={domain === d.slug} onClick={() => setDomain(d.slug)} label={d.label} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            value={tier}
            onChange={setTier}
            options={[{ value: "all", label: "Any tier" }, ...TIERS.map((t) => ({ value: t, label: TIER_LABEL[t] ?? t }))]}
            icon={ShieldCheck}
          />
          <FilterSelect
            value={difficulty}
            onChange={setDifficulty}
            options={[{ value: "all", label: "Any level" }, ...DIFFICULTIES.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))]}
            icon={Sparkles}
          />
          <button
            onClick={() => setNewOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              newOnly
                ? "border-amber-400 bg-amber-500/10 text-amber-700"
                : "border-border bg-card text-muted-foreground hover:border-amber-400/40 hover:text-foreground"
            }`}
          >
            <Flame className="h-3.5 w-3.5" /> New in 24h
          </button>
          {(q || group !== "all" || domain !== "all" || difficulty !== "all" || tier !== "all" || newOnly) && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-xs"
              onClick={() => {
                setQ(""); setGroup("all"); setDomain("all");
                setDifficulty("all"); setTier("all"); setNewOnly(false);
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      </section>

      {/* Body */}
      {isLoading ? (
        <ShimmerGrid count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title={theme.emptyTitle} hint={theme.emptyHint} />
      ) : (
        <div className="space-y-10">
          {featured && <FeaturedItem item={featured} theme={theme} />}
          {rest.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
                <h2 className="text-lg font-bold tracking-tight">More {theme.eyebrow.toLowerCase()}</h2>
                <span className="text-xs text-muted-foreground">{rest.length} item{rest.length === 1 ? "" : "s"}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((it) => <ContentCard key={it.id} item={it} theme={theme} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Atoms ---------------- */

function Pill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={`rounded-xl bg-white/15 px-3 py-2 backdrop-blur ring-1 ring-white/20 ${accent ?? ""}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">{label}</div>
      <div className="text-lg font-bold leading-tight">{value}</div>
    </div>
  );
}

function Chip({
  active, onClick, label, icon: Icon, small,
}: { active: boolean; onClick: () => void; label: string; icon?: LucideIcon; small?: boolean }) {
  const sizing = small ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs";
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all ${sizing} ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function FilterSelect({
  value, onChange, options, icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon: LucideIcon;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function FeaturedItem({ item, theme }: { item: LibraryItem; theme: ContentTypeTheme }) {
  const Icon = theme.icon;
  return (
    <article className="relative isolate overflow-hidden rounded-[1.75rem] border border-border bg-slate-950 text-white shadow-[0_40px_80px_-30px_rgba(99,102,241,0.5)]">
      {/* Dramatic aurora background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className={`absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-gradient-to-br ${theme.gradient} opacity-40 blur-[120px]`} />
        <div className={`absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-gradient-to-tr ${theme.gradient} opacity-30 blur-[120px]`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_55%)]" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      </div>

      <div className="relative grid gap-0 md:grid-cols-[1.15fr_1fr]">
        {/* Left half: hero copy */}
        <div className="flex flex-col justify-between p-8 md:p-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur ring-1 ring-white/30">
                <Sparkles className="h-3 w-3 text-amber-300" /> Featured
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${theme.gradient} px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white shadow-glow`}>
                <Icon className="h-3 w-3" /> {theme.eyebrow}
              </span>
              {item.is_new && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                  <Flame className="h-3 w-3" /> New today
                </span>
              )}
            </div>

            {item.domain && (
              <p className={`mt-6 bg-gradient-to-r ${theme.gradient} bg-clip-text text-[11px] font-bold uppercase tracking-[0.22em] text-transparent`}>
                {domainLabel(item.domain)}
              </p>
            )}
            <h2 className="mt-2 text-balance text-3xl font-extrabold leading-[1.05] tracking-tight md:text-[2.6rem]">
              {item.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">
              {item.description}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className={`bg-gradient-to-r ${theme.gradient} text-white shadow-glow transition-all hover:scale-[1.02] hover:opacity-95`}>
              {item.locked ? (
                <Link to="/pricing"><Lock className="mr-1.5 h-4 w-4" /> Unlock to read</Link>
              ) : (
                <Link to="/dashboard/content/$id" params={{ id: item.id }}>
                  {theme.ctaSingular} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              )}
            </Button>
            <SaveButton contentId={item.id} variant="icon" className="border-white/20 bg-white/[0.04] text-white/80 hover:border-white/40" />
            <div className="inline-flex items-center gap-3 text-xs text-white/70">
              {item.estimated_minutes != null && (
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ~{item.estimated_minutes} min</span>
              )}
              {item.difficulty && (
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    item.difficulty === "beginner" ? "bg-emerald-400" :
                    item.difficulty === "intermediate" ? "bg-amber-400" : "bg-rose-400"
                  }`} />
                  {item.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right half: stat card */}
        <div className="relative flex flex-col items-center justify-center gap-6 border-t border-white/10 p-8 md:border-l md:border-t-0 md:p-12">
          {/* Floating big icon */}
          <div className={`relative grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-to-br ${theme.gradient} text-white shadow-[0_24px_48px_-12px_rgba(99,102,241,0.5)]`}>
            <Icon className="h-12 w-12" strokeWidth={1.75} />
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/25 to-transparent" />
          </div>

          {/* Meta chip cluster */}
          <div className="grid w-full grid-cols-2 gap-2.5 text-[11px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">Tier</p>
              <p className="mt-1 text-base font-bold">
                {TIER_LABEL[item.tier_required as keyof typeof TIER_LABEL] ?? item.tier_required}
              </p>
            </div>
            {item.category && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">Category</p>
                <p className="mt-1 truncate text-sm font-bold capitalize">{item.category}</p>
              </div>
            )}
          </div>

          {item.preview_text && (
            <blockquote className="relative w-full rounded-xl border-l-2 border-white/30 bg-white/[0.03] px-4 py-3 text-sm italic leading-relaxed text-white/75 backdrop-blur">
              &ldquo;{item.preview_text}&rdquo;
            </blockquote>
          )}
        </div>
      </div>
    </article>
  );
}

function ContentCard({ item, theme }: { item: LibraryItem; theme: ContentTypeTheme }) {
  const Icon = theme.icon;
  const tierLabel = TIER_LABEL[item.tier_required as keyof typeof TIER_LABEL] ?? item.tier_required;
  const inner = (
    <article
      className={`group relative isolate flex h-full flex-col overflow-hidden rounded-3xl border bg-gradient-to-b from-card via-card to-card transition-all duration-300 ${
        item.locked
          ? "border-border/70 opacity-95"
          : "border-border hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_32px_64px_-20px_rgba(99,102,241,0.45)]"
      }`}
    >
      {/* Animated aurora-glow background tinted to the type. Subtle, fades in on hover. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${theme.gradient} opacity-[0.08] blur-3xl transition-opacity duration-500 group-hover:opacity-25`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-gradient-to-tr ${theme.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
      />
      {/* Type accent bar at top */}
      <div className={`relative h-1 bg-gradient-to-r ${theme.gradient}`} />

      {/* Top row: icon + status pills */}
      <div className="relative flex items-start justify-between gap-3 px-6 pt-6">
        <div
          className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-[0_12px_24px_-8px_rgba(99,102,241,0.55)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {item.is_new && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 ring-1 ring-amber-500/30">
              <Flame className="h-3 w-3" /> Fresh
            </span>
          )}
          {item.locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70 ring-1 ring-foreground/10">
              <Lock className="h-3 w-3" /> {tierLabel}
            </span>
          ) : item.tier_required !== "free" ? (
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/25">
              {tierLabel}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/25">
              Free
            </span>
          )}
          <SaveButton contentId={item.id} variant="icon" className="!h-7 !w-7" />
        </div>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 flex-col px-6 pb-5 pt-5">
        {item.domain && (
          <p className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-[10px] font-bold uppercase tracking-[0.2em] text-transparent`}>
            {domainLabel(item.domain)}
          </p>
        )}
        <h3 className="mt-1.5 line-clamp-2 text-[17px] font-extrabold leading-tight tracking-tight text-foreground">
          {item.title}
        </h3>
        {(item.short_description || item.description) && (
          <p className="mt-2.5 line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground">
            {item.short_description ?? item.description}
          </p>
        )}

        {/* Tags pills */}
        {item.tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        {/* Footer meta */}
        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3.5 text-[11px]">
            <div className="flex items-center gap-3 text-muted-foreground">
              {item.difficulty && (
                <span className="inline-flex items-center gap-1 font-semibold capitalize text-foreground/80">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    item.difficulty === "beginner" ? "bg-emerald-500" :
                    item.difficulty === "intermediate" ? "bg-amber-500" : "bg-rose-500"
                  }`} />
                  {item.difficulty}
                </span>
              )}
              {item.estimated_minutes != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {item.estimated_minutes}m
                </span>
              )}
            </div>
            <span className={`inline-flex items-center gap-1 rounded-lg bg-gradient-to-r ${theme.gradient} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-soft opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5`}>
              {item.locked ? "Unlock" : theme.ctaSingular} <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Locked bottom strip */}
      {item.locked && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500/60 via-orange-500/60 to-amber-500/60" />
      )}
    </article>
  );
  if (item.locked) {
    return <Link to="/pricing" className="block h-full">{inner}</Link>;
  }
  return (
    <Link to="/dashboard/content/$id" params={{ id: item.id }} className="block h-full">
      {inner}
    </Link>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-dashed border-border bg-gradient-to-br from-card to-muted/30 p-10 text-center shadow-soft">
      {/* Subtle aurora */}
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-glow">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{hint}</p>

        {/* Live engine hint */}
        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Autonomous engine generates new items every 2 hours
        </div>
      </div>
    </div>
  );
}
