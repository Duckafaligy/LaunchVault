import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight, Crown, Sparkles, Flame, Zap, Trophy, Star, Clock, Lock, Play,
  MessageSquareCode, Brain, PenLine, Megaphone, Briefcase, Workflow, Bot, Code2,
  CheckCircle2, Target, GraduationCap, BookOpen, Wand2, Copy, Rocket,
  RotateCw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useUpgrade } from "@/components/dashboard/UpgradeDialog";
import { supabase } from "@/integrations/supabase/client";
import { TIER_LABEL } from "@/config/brand";
import type { SubscriptionTier } from "@/lib/payment-products";
import { getDashboardOverview, pingActivity, getOnboardingState } from "@/utils/learning.functions";
import { DailyAIFeed } from "@/components/dashboard/DailyAIFeed";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

const SKILL_ICONS: Record<string, LucideIcon> = {
  MessageSquareCode, Brain, PenLine, Megaphone, Briefcase, Workflow, Bot, Code2,
};
const BADGE_ICONS: Record<string, LucideIcon> = { Sparkles, Flame, Zap, Trophy, Star };

const LEVEL_XP = 200;

function DashboardHome() {
  const { user } = useAuth();
  const upgrade = useUpgrade();
  const navigate = useNavigate();

  const fetchOverview = useServerFn(getDashboardOverview);
  const fetchOnboarding = useServerFn(getOnboardingState);
  const pingFn = useServerFn(pingActivity);

  const { data: onboardingState, isLoading: obLoading } = useQuery({
    queryKey: ["onboarding-state"],
    queryFn: () => fetchOnboarding(),
    enabled: !!user,
  });

  useEffect(() => {
    if (onboardingState && !onboardingState.completed) navigate({ to: "/onboarding" });
  }, [onboardingState, navigate]);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const ping = useMutation({
    mutationFn: () => pingFn(),
    onSuccess: (res) => { if (res?.changed) refetchProfile(); },
  });
  useEffect(() => {
    if (user && onboardingState?.completed) ping.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, onboardingState?.completed]);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["dashboard-overview", user?.id],
    enabled: !!user && !!onboardingState?.completed,
    queryFn: () => fetchOverview(),
  });

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const tierLabel = TIER_LABEL[tier];
  const firstName = (profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0]) || "Builder";
  const streak = profile?.current_streak ?? 0;
  const xp = profile?.xp_points ?? 0;
  const longest = profile?.longest_streak ?? 0;
  const level = Math.max(1, Math.floor(xp / LEVEL_XP) + 1);
  const xpIntoLevel = xp % LEVEL_XP;
  const levelPct = (xpIntoLevel / LEVEL_XP) * 100;

  if (obLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-44 animate-pulse rounded-3xl bg-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Hero — editorial, Fraunces serif, premium feel */}
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-7 text-white shadow-elevated md:p-10">
        {/* Aurora background */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-[120px]" />
          <div className="absolute -bottom-24 -left-16 h-96 w-96 rounded-full bg-indigo-500/30 blur-[140px]" />
          <div className="absolute top-1/2 left-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-violet-500/20 blur-[120px]" />
        </div>
        {/* Subtle grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-200 backdrop-blur">
                <Crown className="h-3 w-3 text-amber-300" /> {tierLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-slate-300 backdrop-blur">
                Level {level}
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-amber-200 backdrop-blur">
                  <Flame className="h-3 w-3" /> {streak}-day streak
                </span>
              )}
            </div>
            <h1 className="font-display mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.025em] md:text-[3.25rem]">
              Welcome back,
              <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                {firstName}.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-300 md:text-base">
              The engine published new work while you were away. Pick up a quest, finish a course in progress, or just read something fresh.
            </p>
            <div className="mt-7 max-w-md">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span>Level {level}</span>
                <span>{LEVEL_XP - xpIntoLevel} XP to Level {level + 1}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 shadow-[0_0_18px_-2px_rgba(251,191,36,0.6)] transition-[width] duration-700" style={{ width: `${levelPct}%` }} />
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {overview?.dailyQuest && (
                <Button asChild size="lg" className="h-12 rounded-xl bg-white px-7 font-bold text-slate-950 shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)] hover:bg-indigo-50">
                  <Link to="/dashboard/content/$id" params={{ id: overview.dailyQuest.id }}>
                    <Play className="mr-1.5 h-4 w-4 fill-current" /> Start today&apos;s quest
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="h-12 rounded-xl border-white/15 bg-white/5 px-7 font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white">
                <Link to="/dashboard/prompts">Browse library</Link>
              </Button>
            </div>
          </div>
          {/* Stat chips — three vertical pills */}
          <div className="grid grid-cols-3 gap-2 md:flex md:flex-col md:gap-3">
            <StatChip icon={Flame} label="Streak" value={streak} suffix={streak === 1 ? "day" : "days"} />
            <StatChip icon={Zap} label="XP" value={xp} />
            <StatChip icon={Trophy} label="Best" value={longest} suffix={longest === 1 ? "day" : "days"} />
          </div>
        </div>
      </section>

      {/* Live-from-the-engine rail — shows the freshest items autonomous gen produced */}
      <FreshFromEngine />


      {/* Daily Quest */}
      <DailyQuestCard quest={overview?.dailyQuest} loading={overviewLoading} />

      {/* Daily AI feed — fresh content per type */}
      <DailyAIFeed />

      {/* Continue learning */}
      {overview?.inProgress && overview.inProgress.length > 0 && (
        <section className="space-y-3">
          <SectionTitle kicker="Pick up where you left off" title="Continue learning" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.inProgress.map((it) => (
              <Link
                key={it.id}
                to="/dashboard/content/$id"
                params={{ id: it.id }}
                className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{it.type}</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{it.title}</h3>
                <Progress value={it.pct} className="mt-3 h-1.5" />
                <p className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{it.doneCount} / {it.total} sections</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Resume <ArrowRight className="h-3 w-3" />
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Skill Map */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <SectionTitle kicker="Your skill tree" title="The LaunchVault map" />
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/courses">All lessons <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>

        {overviewLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(overview?.skills ?? []).map((sk) => (
              <SkillNodeCard key={sk.key} skill={sk} />
            ))}
          </div>
        )}
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <SectionTitle kicker="Achievements" title="Badges" />
        {overviewLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(overview?.badges ?? []).map((b) => (
              <BadgeChip key={b.key} badge={b} />
            ))}
          </div>
        )}
      </section>

      {/* Prompt Mode — signature feature */}
      <PromptModeCard featuredId={overview?.dailyQuest?.id ?? overview?.inProgress?.[0]?.id} />

      {/* Featured Courses + Recommended Packs */}
      <FeaturedCourses />

      {/* Upgrade CTA */}
      {tier !== "tier3" && (
        <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-slate-950 p-8 text-white shadow-elevated md:p-12">
          <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-[120px]" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 ring-white/15">
                <Crown className="h-3 w-3 text-amber-300" /> {tier === "free" ? "Go Pro" : "Upgrade"}
              </span>
              <h3 className="font-display mt-4 text-balance text-3xl font-bold leading-tight tracking-tight md:text-[2.5rem]">
                Unlock the full library.
              </h3>
              <p className="mt-2 text-sm text-white/75 md:text-base">
                Get premium prompts, advanced courses, prompt packs, and guided practice labs designed
                to help you launch faster with AI.
              </p>
              <ul className="mt-4 grid gap-1.5 text-sm text-white/80 sm:grid-cols-2">
                {["All premium prompts", "Full course library", "Exclusive prompt packs", "Priority new drops"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" className="h-12 rounded-xl bg-white px-8 font-bold text-slate-950 hover:bg-indigo-50" onClick={() => upgrade.open()}>
                {tier === "free" ? "Upgrade to Pro" : "Upgrade plan"} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="h-12 rounded-xl border-white/20 bg-white/5 px-8 font-bold text-white hover:bg-white/10 hover:text-white" onClick={() => upgrade.open()}>
                Compare Plans
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* -------------------- pieces -------------------- */

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary">{kicker}</p>
      <h2 className="font-display mt-1 text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
    </div>
  );
}

function StatChip({ icon: Icon, label, value, suffix }: { icon: LucideIcon; label: string; value: string | number; suffix?: string }) {
  return (
    <div className="min-w-[100px] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur transition-colors hover:border-white/25 hover:bg-white/[0.06]">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display mt-1 text-2xl font-bold leading-none tracking-tight text-white">
        {value}
        {suffix && <span className="ml-1 text-[10px] font-medium text-white/50">{suffix}</span>}
      </div>
    </div>
  );
}

/* -------------------- Fresh from the engine -------------------- */
function FreshFromEngine() {
  const qc = useQueryClient();
  const { data: fresh, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["fresh-from-engine"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_items")
        .select("id, slug, title, type, domain, tier_required, estimated_minutes, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
    refetchInterval: 30_000,        // refresh every 30s — more aggressive
    refetchOnWindowFocus: true,      // refresh when user returns to the tab
    staleTime: 0,                    // always considered stale (force fetch on mount)
  });

  // Live INSERT listener — invalidates the moment the engine publishes a new item
  useEffect(() => {
    const channel = supabase
      .channel("fresh-from-engine")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "content_items" }, () => {
        qc.invalidateQueries({ queryKey: ["fresh-from-engine"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const lastUpdated = dataUpdatedAt ? Math.round((Date.now() - dataUpdatedAt) / 1000) : null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle kicker="Live from the engine" title="Fresh this cycle" />
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">
            {lastUpdated != null ? `Updated ${lastUpdated}s ago` : "Live"}
          </span>
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="ml-1 rounded-full border border-border bg-card px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
            title="Force refresh"
          >
            <RotateCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : fresh && fresh.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fresh.map((it: any) => <FreshCard key={it.id} item={it} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center shadow-soft">
          <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="font-display mt-3 text-lg font-bold">The engine is warming up</p>
          <p className="mt-1 text-sm text-muted-foreground">First items publish within the next cycle — auto-refreshes every minute.</p>
        </div>
      )}
    </section>
  );
}

function FreshCard({ item }: { item: any }) {
  const grad: Record<string, string> = {
    prompt: "from-violet-600 to-fuchsia-500",
    course: "from-indigo-600 to-cyan-500",
    workflow: "from-sky-500 to-indigo-600",
    agent: "from-fuchsia-600 to-pink-500",
    business_lesson: "from-emerald-600 to-teal-500",
    insight: "from-amber-500 to-orange-500",
    tool_guide: "from-zinc-700 to-slate-700",
    playbook: "from-rose-600 to-fuchsia-600",
    challenge: "from-red-600 to-orange-500",
    cheatsheet: "from-indigo-500 to-cyan-500",
  };
  const typeLabel: Record<string, string> = {
    prompt: "Prompt", course: "Course", workflow: "Workflow", agent: "Agent",
    business_lesson: "Business", insight: "Insight", tool_guide: "Tool",
    playbook: "Playbook", challenge: "Challenge", cheatsheet: "Cheatsheet",
  };
  const g = grad[item.type] ?? grad.prompt;
  const minutesAgo = Math.max(1, Math.round((Date.now() - new Date(item.created_at).getTime()) / 60_000));
  const ago = minutesAgo < 60 ? `${minutesAgo}m ago` : minutesAgo < 1440 ? `${Math.round(minutesAgo / 60)}h ago` : `${Math.round(minutesAgo / 1440)}d ago`;

  return (
    <Link
      to="/dashboard/content/$id"
      params={{ id: item.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div aria-hidden className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${g}`} />
      <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.18em]">
        <span className={`bg-gradient-to-r ${g} bg-clip-text text-transparent`}>{typeLabel[item.type] ?? item.type}</span>
        <span className="text-muted-foreground">{ago}</span>
      </div>
      <h3 className="font-display mt-3 line-clamp-2 text-[1.05rem] font-bold leading-snug tracking-tight">
        {item.title}
      </h3>
      <div className="mt-auto flex items-center justify-between pt-4 text-[11px] text-muted-foreground">
        <span>{item.tier_required === "free" ? "Free" : item.tier_required}</span>
        {item.estimated_minutes && <span>{item.estimated_minutes} min</span>}
      </div>
    </Link>
  );
}

function DailyQuestCard({
  quest, loading,
}: {
  quest: NonNullable<Awaited<ReturnType<typeof getDashboardOverview>>>["dailyQuest"] | undefined;
  loading: boolean;
}) {
  if (loading) {
    return <div className="h-44 animate-pulse rounded-3xl bg-muted" />;
  }
  if (!quest) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center">
        <Target className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">No quest available right now</p>
        <p className="mt-1 text-xs text-muted-foreground">New drops arrive daily.</p>
      </div>
    );
  }
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
      {/* Tasteful amber accent bar */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-white shadow-soft">
              <Target className="h-3 w-3" /> Today&apos;s quest
            </span>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              {quest.reason}
            </span>
          </div>
          <h2 className="font-display mt-4 text-balance text-2xl font-bold leading-tight tracking-tight md:text-[2rem]">
            {quest.title}
          </h2>
          {quest.description && (
            <p className="font-display mt-3 line-clamp-2 text-[1.05rem] italic leading-snug text-muted-foreground md:text-[1.15rem]">
              {quest.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> +{quest.xp_reward} XP
            </span>
            {quest.estimated_minutes && (
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Clock className="h-3.5 w-3.5" /> {quest.estimated_minutes} min
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 font-semibold capitalize">{quest.type.replace(/_/g, " ")}</span>
          </div>
        </div>
        <Button asChild size="lg" className="h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 px-7 font-bold text-white shadow-[0_0_30px_-5px_rgba(251,146,60,0.6)] hover:opacity-95">
          <Link to="/dashboard/content/$id" params={{ id: quest.id }}>
            <Play className="mr-1.5 h-4 w-4 fill-current" /> Start quest
          </Link>
        </Button>
      </div>
    </section>
  );
}

function SkillNodeCard({ skill }: { skill: NonNullable<Awaited<ReturnType<typeof getDashboardOverview>>>["skills"][number] }) {
  const Icon = SKILL_ICONS[skill.iconKey] ?? Star;
  const empty = skill.total === 0;
  const done = !empty && skill.pct === 100;
  const locked = skill.locked;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all ${
        locked ? "opacity-60" : "hover:-translate-y-0.5 hover:shadow-elevated"
      } ${done ? "border-emerald-500/40" : "border-border"}`}
    >
      <div className={`mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${skill.color} text-white shadow-md ring-4 ring-background`}>
        {locked ? <Lock className="h-6 w-6" /> : done ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold leading-tight">{skill.label}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{skill.tagline}</p>
        </div>
        {done && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">Mastered</span>}
      </div>

      {empty ? (
        <p className="mt-4 text-[11px] italic text-muted-foreground">Lessons coming soon</p>
      ) : (
        <>
          <Progress value={skill.pct} className="mt-3 h-1.5" />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {skill.completed} / {skill.total} complete · {skill.pct}%
          </p>
        </>
      )}

      {locked ? (
        <p className="mt-3 text-[11px] font-medium text-muted-foreground">
          <Lock className="mr-1 inline h-3 w-3" /> Progress earlier skills to unlock
        </p>
      ) : skill.nextItem ? (
        <Button asChild size="sm" variant={done ? "outline" : "default"} className={`mt-4 w-full ${!done ? "bg-gradient-primary" : ""}`}>
          <Link to="/dashboard/content/$id" params={{ id: skill.nextItem.id }}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {done ? "Review" : skill.completed > 0 ? "Next lesson" : "Begin"}
          </Link>
        </Button>
      ) : !empty ? (
        <p className="mt-3 text-[11px] italic text-muted-foreground">All done — nice work.</p>
      ) : null}
    </div>
  );
}

function BadgeChip({ badge }: { badge: NonNullable<Awaited<ReturnType<typeof getDashboardOverview>>>["badges"][number] }) {
  const Icon = BADGE_ICONS[badge.iconKey] ?? Star;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-soft ${
        badge.earned
          ? "border-amber-400/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
            badge.earned
              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="truncate text-sm font-bold">{badge.label}</h4>
            {badge.earned && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Earned</span>}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{badge.description}</p>
          {!badge.earned && (
            <div className="mt-2">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${badge.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Prompt Mode (signature feature) -------------------- */

function PromptModeCard({ featuredId }: { featuredId?: string }) {
  const steps = [
    { icon: BookOpen, title: "Learn", desc: "Read the concept and why it works." },
    { icon: Brain, title: "Study anatomy", desc: "Break the prompt into parts." },
    { icon: Copy, title: "Copy or unlock", desc: "Grab the battle-tested prompt." },
    { icon: Wand2, title: "Customize", desc: "Tune it to your exact goal." },
    { icon: Rocket, title: "Apply", desc: "Ship it and mark as applied." },
  ];
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-glow">
            <Wand2 className="h-3 w-3" /> Prompt Mode
          </span>
          <h2 className="font-display mt-4 text-balance text-2xl font-bold leading-tight tracking-tight md:text-[2rem]">Master one useful prompt today.</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            A 5-step guided workflow that turns a single prompt into real, repeatable skill.
          </p>
        </div>
        {featuredId && (
          <Button asChild size="lg" className="bg-gradient-primary shadow-glow hover:opacity-95">
            <Link to="/dashboard/content/$id" params={{ id: featuredId }}>
              Enter Prompt Mode <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <ol className="relative mt-8 grid gap-3 md:grid-cols-5">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="group relative rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-[11px] font-bold text-primary-foreground shadow-md">
                {i + 1}
              </span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2.5 text-sm font-bold leading-tight">{s.title}</p>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* -------------------- Featured Courses + Recommended Packs -------------------- */

function FeaturedCourses() {
  const { data: courses, isLoading: cLoading } = useQuery({
    queryKey: ["featured-courses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_items")
        .select("id, title, description, category, tier_required, estimated_minutes, xp_reward, course_size")
        .eq("type", "course")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  return (
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <SectionTitle kicker="Pick a path" title="Featured courses" />
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/courses">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        {cLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : courses && courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                to="/dashboard/content/$id"
                params={{ id: c.id }}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold">{c.title}</h3>
                    {c.tier_required !== "free" && (
                      <span className="rounded-full bg-gradient-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">Pro</span>
                    )}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.estimated_minutes && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.estimated_minutes}m</span>}
                    <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> +{c.xp_reward} XP</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">More courses dropping soon.</p>
        )}
      </section>
  );
}
