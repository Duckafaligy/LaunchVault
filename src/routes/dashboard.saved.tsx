// =====================================================================
// /dashboard/saved — Personal Saved Vault
//
// All content the user has bookmarked. Live updates on save/unsave via
// React Query invalidation triggered from SaveButton.
// Filters by content type + tier. Empty-state guides to the library.
// =====================================================================

import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark, ArrowRight, Search,
  MessageSquareCode, GraduationCap, Workflow as WorkflowIcon, Bot, Briefcase,
  Lightbulb, Wrench, ScrollText, Target, FileText, BookOpen, Pencil,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { SaveButton } from "@/components/saved/SaveButton";

export const Route = createFileRoute("/dashboard/saved")({
  component: SavedVaultPage,
});

// Map content type → icon + gradient
const TYPE_META: Record<string, { icon: LucideIcon; label: string; gradient: string }> = {
  prompt:          { icon: MessageSquareCode, label: "Prompts",     gradient: "from-violet-600 to-fuchsia-500" },
  course:          { icon: GraduationCap,     label: "Courses",     gradient: "from-indigo-600 to-cyan-500" },
  workflow:        { icon: WorkflowIcon,      label: "Workflows",   gradient: "from-sky-500 to-indigo-600" },
  agent:           { icon: Bot,               label: "Agents",      gradient: "from-fuchsia-600 to-pink-500" },
  business_lesson: { icon: Briefcase,         label: "Business",    gradient: "from-emerald-600 to-teal-500" },
  insight:         { icon: Lightbulb,         label: "Insights",    gradient: "from-amber-500 to-orange-500" },
  tool_guide:      { icon: Wrench,            label: "Tool guides", gradient: "from-zinc-700 to-slate-700" },
  playbook:        { icon: ScrollText,        label: "Playbooks",   gradient: "from-rose-600 to-fuchsia-600" },
  challenge:       { icon: Target,            label: "Challenges",  gradient: "from-red-600 to-orange-500" },
  cheatsheet:      { icon: FileText,          label: "Cheatsheets", gradient: "from-indigo-500 to-cyan-500" },
  glossary:        { icon: BookOpen,          label: "Glossary",    gradient: "from-cyan-500 to-sky-600" },
  essay:           { icon: Pencil,            label: "Essays",      gradient: "from-amber-500 to-fuchsia-500" },
};

type SavedItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  short_description: string | null;
  category: string;
  domain: string | null;
  tier_required: string;
  slug: string | null;
  estimated_minutes: number | null;
  savedAt: string;
};

function SavedVaultPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: items, isLoading } = useQuery({
    queryKey: ["saved-items", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<SavedItem[]> => {
      const { data: saved } = await supabase
        .from("saved_items")
        .select("content_id, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (!saved || saved.length === 0) return [];
      const ids = saved.map((s) => s.content_id);
      const { data: content } = await supabase
        .from("content_items")
        .select("id, type, title, description, short_description, category, domain, tier_required, slug, estimated_minutes")
        .in("id", ids);
      const byId = new Map((content ?? []).map((c) => [c.id, c]));
      return saved
        .map((s) => {
          const c = byId.get(s.content_id);
          if (!c) return null;
          return { ...c, savedAt: s.created_at } as SavedItem;
        })
        .filter((x): x is SavedItem => x !== null);
    },
  });

  // Per-type counts for the filter chips
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (items ?? []).forEach((it) => { map[it.type] = (map[it.type] ?? 0) + 1; });
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items ?? [];
    if (filter !== "all") list = list.filter((it) => it.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) =>
        it.title.toLowerCase().includes(q) ||
        (it.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [items, filter, search]);

  const total = items?.length ?? 0;
  const typesPresent = Object.keys(typeCounts).sort((a, b) => (typeCounts[b] ?? 0) - (typeCounts[a] ?? 0));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 p-8 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
            <Bookmark className="h-3.5 w-3.5" /> Saved Vault
          </p>
          <h1 className="font-display mt-4 text-balance text-3xl font-bold leading-tight tracking-tight md:text-[2.5rem]">
            Your personal collection
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Everything you've saved across the library — ready to revisit, copy, or finish. Total:{" "}
            <strong className="text-foreground tabular-nums">{total}</strong>{" "}
            {total === 1 ? "item" : "items"}.
          </p>
        </div>
      </header>

      {/* Controls — search + type filter chips */}
      {total > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your saved items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                filter === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              All <span className="tabular-nums">{total}</span>
            </button>
            {typesPresent.map((t) => {
              const meta = TYPE_META[t];
              if (!meta) return null;
              const Icon = meta.icon;
              const active = filter === t;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? `border-transparent bg-gradient-to-r ${meta.gradient} text-white shadow-soft`
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label} <span className="tabular-nums">{typeCounts[t]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Items grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <p className="text-muted-foreground">No saved items match those filters.</p>
          <button onClick={() => { setFilter("all"); setSearch(""); }} className="mt-3 text-sm font-bold text-primary hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((it) => <SavedCard key={it.id} item={it} />)}
        </div>
      )}
    </div>
  );
}

function SavedCard({ item }: { item: SavedItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.prompt;
  const Icon = meta.icon;
  const savedAgo = timeAgo(item.savedAt);

  return (
    <Link
      to="/dashboard/content/$id"
      params={{ id: item.id }}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${meta.gradient}`} />
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shadow-soft`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{meta.label}</span>
          <SaveButton contentId={item.id} variant="icon" className="!h-7 !w-7" />
        </div>
      </div>
      <h3 className="font-display mt-3.5 line-clamp-2 text-[1rem] font-bold leading-snug tracking-tight">{item.title}</h3>
      {(item.short_description || item.description) && (
        <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
          {item.short_description ?? item.description}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-muted-foreground">
        <span>Saved {savedAgo}</span>
        <span className="inline-flex items-center gap-0.5 font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-glow">
        <Bookmark className="h-6 w-6" />
      </div>
      <h3 className="font-display mt-4 text-xl font-bold">Nothing saved yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Tap the bookmark on any article, prompt, course, or glossary term to keep it here for quick access.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline">
          <Link to="/dashboard/prompts">Prompts</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard/courses">Courses</Link>
        </Button>
        <Button asChild className="bg-gradient-primary">
          <Link to="/dashboard">Back to dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
