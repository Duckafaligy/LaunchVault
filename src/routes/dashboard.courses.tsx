import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  GraduationCap, Lock, CheckCircle2, Play, Flame, Zap, Trophy, Sparkles,
  BookOpen, Clock, ArrowRight, Layers, Search, CalendarDays,
  MessageSquareCode, Brain, PenLine, Megaphone, Briefcase, Workflow, Bot, Code2,
} from "lucide-react";
import { listLibrary, type LibraryItem } from "@/utils/library.functions";
import { useUpgrade } from "@/components/dashboard/UpgradeDialog";
import { formatDateTime } from "@/lib/format-date";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/courses")({
  component: CoursesPage,
});

/* ---------------- Category registry (mirrors skill map) ---------------- */
const CATEGORIES: Array<{
  key: string;
  label: string;
  tagline: string;
  icon: typeof BookOpen;
  gradient: string;
  ring: string;
  match: string[];
}> = [
  { key: "prompting",       label: "Prompt Craft",     tagline: "The core skill",         icon: MessageSquareCode, gradient: "from-emerald-500 to-teal-600",    ring: "ring-emerald-500/30",  match: ["prompt"] },
  { key: "ai_fundamentals", label: "AI Foundations",   tagline: "Know the machine",       icon: Brain,             gradient: "from-violet-500 to-indigo-600",   ring: "ring-violet-500/30",   match: ["ai_fundamentals", "fundamentals", "llm"] },
  { key: "writing",         label: "Writing with AI",  tagline: "Voice & clarity",        icon: PenLine,           gradient: "from-blue-500 to-cyan-500",       ring: "ring-blue-500/30",     match: ["writing", "content"] },
  { key: "marketing",       label: "Marketing",        tagline: "Reach & convert",        icon: Megaphone,         gradient: "from-pink-500 to-rose-600",       ring: "ring-pink-500/30",     match: ["marketing", "growth"] },
  { key: "business",        label: "Business",         tagline: "Run the company",        icon: Briefcase,         gradient: "from-amber-500 to-orange-600",    ring: "ring-amber-500/30",    match: ["business", "ops"] },
  { key: "workflows",       label: "Workflows",        tagline: "Automate the boring",    icon: Workflow,          gradient: "from-sky-500 to-indigo-500",      ring: "ring-sky-500/30",      match: ["workflow", "automation"] },
  { key: "agents",          label: "Agents",           tagline: "AI that takes action",   icon: Bot,               gradient: "from-fuchsia-600 to-pink-600",    ring: "ring-fuchsia-500/30",  match: ["agent"] },
  { key: "coding",          label: "Coding with AI",   tagline: "Ship faster",            icon: Code2,             gradient: "from-slate-700 to-zinc-900",      ring: "ring-slate-500/30",    match: ["coding", "code", "dev"] },
];

function categoryFor(item: LibraryItem) {
  const hay = `${item.category ?? ""}`.toLowerCase();
  return CATEGORIES.find((c) => c.match.some((m) => hay.includes(m))) ?? CATEGORIES[CATEGORIES.length - 1];
}

type Enriched = {
  item: LibraryItem;
  cat: (typeof CATEGORIES)[number];
  pct: number;
  done: number;
  total: number;
  status: "available" | "in_progress" | "complete" | "locked";
};

function CoursesPage() {
  const { user } = useAuth();
  const fetchList = useServerFn(listLibrary);

  const { data: items, isLoading } = useQuery({
    queryKey: ["library", "course", user?.id ?? "anon"],
    queryFn: () => fetchList({ data: { type: "course" } }),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("current_streak,longest_streak,xp_points")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["course-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_progress")
        .select("content_id,total_sections,completed_sections,is_completed")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const progressMap = useMemo(
    () => new Map((progress ?? []).map((p) => [p.content_id, p])),
    [progress],
  );

  const enriched: Enriched[] = useMemo(() => {
    return (items ?? []).map((item) => {
      const p = progressMap.get(item.id);
      const total = p?.total_sections ?? 0;
      const done = Array.isArray(p?.completed_sections) ? (p!.completed_sections as number[]).length : 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      let status: Enriched["status"] = "available";
      if (item.locked) status = "locked";
      else if (p?.is_completed) status = "complete";
      else if (done > 0) status = "in_progress";
      return { item, cat: categoryFor(item), pct, done, total, status };
    });
  }, [items, progressMap]);

  // Per-type page: no filtering here. The /dashboard/library is the place to
  // filter/search across everything. This page just shows all courses.
  const filtered = enriched;

  const grouped = useMemo(() => {
    const m = new Map<string, Enriched[]>();
    filtered.forEach((e) => {
      const arr = m.get(e.cat.key) ?? [];
      arr.push(e);
      m.set(e.cat.key, arr);
    });
    return CATEGORIES.map((c) => ({ cat: c, items: m.get(c.key) ?? [] })).filter((g) => g.items.length > 0);
  }, [filtered]);

  const featured = enriched.find((e) => e.item.is_featured && !e.item.locked) ?? enriched.find((e) => !e.item.locked) ?? enriched[0];

  const xp = profile?.xp_points ?? 0;
  const level = Math.max(1, Math.floor(xp / 200) + 1);
  const xpIntoLevel = xp % 200;
  const streak = profile?.current_streak ?? 0;
  const longest = profile?.longest_streak ?? 0;
  const completedCount = enriched.filter((e) => e.status === "complete").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-elevated md:p-9">
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-yellow-300/30 blur-3xl" />
        <div className="absolute -bottom-12 -left-8 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ring-1 ring-white/25">
              <GraduationCap className="h-3.5 w-3.5" /> Learn
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Pick a course. Walk the path.
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/85">
              Each course is a guided learning path — pick what calls to you, then take it lesson by lesson.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-white/85">
              <span className="font-semibold">Level {level}</span>
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-yellow-300" style={{ width: `${(xpIntoLevel / 200) * 100}%` }} />
              </div>
              <span>{200 - xpIntoLevel} XP to next</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Pill icon={Flame} label="Streak" value={streak} />
            <Pill icon={Zap} label="XP" value={xp} />
            <Pill icon={Trophy} label="Done" value={completedCount} />
          </div>
        </div>
      </header>

      {/* Featured */}
      {featured && <FeaturedCourse e={featured} />}

      {/* Body */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-12">
          {grouped.map(({ cat, items }) => (
            <CategorySection key={cat.key} cat={cat} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur ring-1 ring-white/20">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-lg font-bold leading-tight">{value}</div>
    </div>
  );
}

function Chip({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string; icon: any }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-soft"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function FeaturedCourse({ e }: { e: Enriched }) {
  const { item, cat, pct, status } = e;
  const Icon = cat.icon;
  const upgrade = useUpgrade();
  return (
    <article className={`relative overflow-hidden rounded-3xl border border-border bg-card shadow-elevated`}>
      <div className="grid md:grid-cols-[1.05fr_1fr]">
        <div className={`relative bg-gradient-to-br ${cat.gradient} p-8 text-white md:p-10`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ring-1 ring-white/30">
              <Sparkles className="h-3 w-3" /> Featured · {cat.label}
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">{item.title}</h2>
            <p className="mt-3 text-sm text-white/90 md:text-base">{item.description}</p>
            <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/15 px-3 py-1.5 text-xs ring-1 ring-white/25">
              <Icon className="h-3.5 w-3.5" /> {cat.tagline}
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between p-7 md:p-9">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-[10px]">
              <Badge variant="secondary" className="uppercase">{item.course_size === "main" ? "Main course" : "Mini course"}</Badge>
              <Badge variant="outline" className="uppercase">{item.tier_required === "free" ? "Free" : item.tier_required}</Badge>
            </div>
            <p className="text-[15px] italic text-muted-foreground">&ldquo;{item.preview_text}&rdquo;</p>
            {pct > 0 && (
              <div>
                <Progress value={pct} className="h-1.5" />
                <p className="mt-1 text-[11px] text-muted-foreground">{pct}% complete</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center gap-3">
            {item.locked ? (
              <Button className="bg-gradient-primary" size="lg" onClick={() => upgrade.open(item.tier_required)}>
                <Lock className="mr-1.5 h-4 w-4" /> Unlock
              </Button>
            ) : (
              <Button asChild className="bg-gradient-primary" size="lg">
                <Link to="/dashboard/content/$id" params={{ id: item.id }}>
                  {status === "in_progress" ? "Continue path" : status === "complete" ? "Review path" : "Start path"}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CategorySection({ cat, items }: { cat: (typeof CATEGORIES)[number]; items: Enriched[] }) {
  const Icon = cat.icon;
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-soft`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{cat.label}</h2>
            <p className="text-xs text-muted-foreground">{cat.tagline}</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{items.length} course{items.length === 1 ? "" : "s"}</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => <CourseCard key={e.item.id} e={e} />)}
      </div>
    </section>
  );
}

function CourseCard({ e }: { e: Enriched }) {
  const { item, cat, pct, total, done, status } = e;
  const Icon = cat.icon;
  const StatusIcon = status === "complete" ? CheckCircle2 : status === "in_progress" ? Play : status === "locked" ? Lock : Sparkles;
  const cta = status === "locked" ? "Unlock" : status === "complete" ? "Review" : status === "in_progress" ? "Continue" : "Start path";

  const card = (
    <div className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated ${status === "locked" ? "opacity-80" : ""}`}>
      {/* Cover */}
      <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${cat.gradient}`}>
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)", backgroundSize: "14px 14px" }} />
        <div className="relative flex h-full items-start justify-between p-4 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ring-1 ring-white/30">
            {item.course_size === "main" ? "Main course" : "Mini course"}
          </span>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur ring-1 ring-white/30">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {status === "complete" && (
          <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-soft">
            <CheckCircle2 className="h-3 w-3" /> Complete
          </div>
        )}
        {status === "locked" && (
          <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <Lock className="h-3 w-3" /> {item.tier_required === "free" ? "Locked" : item.tier_required}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-tight group-hover:text-primary">{item.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {item.tier_required && (
            <span className="font-semibold uppercase tracking-wider text-foreground/80">{item.tier_required === "free" ? "Free" : item.tier_required}</span>
          )}
          <span className="inline-flex items-center gap-1"><BookOpen className="h-3 w-3" /> Path</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {item.course_size === "main" ? "60 min" : "15 min"}</span>
          {item.created_at && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDateTime(item.created_at)}</span>}
        </div>

        {total > 0 && (
          <div className="mt-3">
            <Progress value={pct} className="h-1.5" />
            <p className="mt-1 text-[10px] text-muted-foreground">{done} / {total} lessons · {pct}%</p>
          </div>
        )}

        <div className="mt-auto pt-5">
          <Button
            size="sm"
            variant={status === "complete" ? "outline" : "default"}
            className={status !== "complete" && status !== "locked" ? "bg-gradient-primary w-full" : "w-full"}
            disabled={status === "locked"}
          >
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" /> {cta}
          </Button>
        </div>
      </div>
    </div>
  );

  if (status === "locked") return card;
  return (
    <Link to="/dashboard/content/$id" params={{ id: item.id }} className="block h-full">
      {card}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <GraduationCap className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">No matching courses</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Try a different category or clear your search.</p>
    </div>
  );
}
