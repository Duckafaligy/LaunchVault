import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Copy, Check, Lock, Sparkles, Clock, BookOpen, Zap,
  Eye, Code2, FileText, ListChecks, Target, Lightbulb, Wrench,
  ChevronRight, ChevronLeft, CheckCircle2, XCircle, Trophy, Flame, Rocket,
  Workflow as WorkflowIcon, Bot, Briefcase, ScrollText, CalendarDays,
} from "lucide-react";
import { formatDateTime } from "@/lib/format-date";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getContentPayload } from "@/utils/content.functions";
import { recordSectionProgress } from "@/utils/learning.functions";
import {
  WorkflowView, AgentView, BusinessView, InsightView, ToolView,
  PlaybookView, ChallengeView, CheatsheetView, ArticleBody,
} from "@/components/content-views/NewTypeViews";
import { SaveButton } from "@/components/saved/SaveButton";
import { useUpgrade } from "@/components/dashboard/UpgradeDialog";
import { CoursePlayer } from "@/components/content-views/CoursePlayer";
import { MeteredReveal } from "@/components/content-views/MeteredReveal";
import { domainLabel } from "@/config/domains";
import { brand } from "@/config/brand";

export const Route = createFileRoute("/dashboard/content/$id")({
  component: ContentDetailPage,
});

function ContentDetailPage() {
  const { id } = Route.useParams();
  const fetchPayload = useServerFn(getContentPayload);
  const { data, isLoading } = useQuery({
    queryKey: ["content-payload", id],
    queryFn: () => fetchPayload({ data: { contentId: id } }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  if (!data) return null;

  // Glossary + essay have dedicated public reading pages that render their full
  // body. The dashboard viewer has no template for those types (it would show
  // an empty article shell), so send the reader to the proper page instead.
  if (!data.locked && (data as any).item?.type === "glossary" && (data as any).item?.slug) {
    return <Navigate to="/glossary/$slug" params={{ slug: (data as any).item.slug }} replace />;
  }
  if (!data.locked && (data as any).item?.type === "essay" && (data as any).item?.slug) {
    return <Navigate to="/blog/$slug" params={{ slug: (data as any).item.slug }} replace />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to dashboard
        </Link>
      </Button>
      {data.locked ? <LockedView data={data} /> : <UnlockedView data={data} />}
    </div>
  );
}

// Short, human nouns for the gate copy ("unlock the full course").
const HUMAN_TYPE: Record<string, string> = {
  prompt: "prompt", course: "course", workflow: "workflow", agent: "agent blueprint",
  business_lesson: "business lesson", insight: "insight", tool_guide: "tool guide",
  playbook: "playbook", challenge: "challenge", cheatsheet: "cheatsheet", template: "template",
};

/**
 * Metered lock. A member below the required tier sees only a ~10% taste — type
 * label, headline, standfirst and the engine's preview text — fading into the
 * upgrade gate. The other ~90% (the real payload) is never sent to the client
 * for non-entitled users, so this stays secure: we only reveal what's already
 * safe to show (title/description/preview_text).
 */
function LockedView({ data }: { data: any }) {
  const upgrade = useUpgrade();
  const item = data.item ?? {};
  const theme = TYPE_THEME[item.type as string] ?? TYPE_THEME.prompt;
  const human = HUMAN_TYPE[item.type as string] ?? "article";
  const teaser: string = item.preview_text || item.description || "";
  const tierName =
    (brand.pricing as Record<string, { name?: string }>)[item.tier_required]?.name ??
    item.tier_required;

  return (
    <article className="relative mx-auto max-w-[680px] pb-20">
      {/* Type label + members-only flag */}
      <div className="flex items-center gap-3 pt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
        <span className={`bg-gradient-to-r ${theme.grad} bg-clip-text text-transparent`}>{theme.label}</span>
        <span className="h-px w-6 bg-border" />
        <span className="inline-flex items-center gap-1 text-amber-600">
          <Lock className="h-3 w-3" /> Members-only
        </span>
      </div>

      {/* Serif headline */}
      <h1 className="font-display mt-6 text-balance text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[3.25rem]">
        {item.title ?? "Locked content"}
      </h1>

      {/* Standfirst */}
      {item.description && (
        <p className="font-display mt-6 text-balance text-[1.2rem] italic leading-[1.55] text-foreground/75">
          {item.description}
        </p>
      )}

      {/* ~10% preview — faded */}
      {teaser && teaser !== item.description && (
        <div className="relative mt-8">
          <MeteredReveal minPx={120} maxPx={320}>
            <p className="whitespace-pre-wrap text-[1.05rem] leading-[1.8] text-foreground/90">{teaser}</p>
          </MeteredReveal>
        </div>
      )}

      {/* Upgrade gate */}
      <div className="relative z-10 -mt-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-card via-card to-indigo-50/40 p-7 shadow-elevated dark:to-indigo-950/30">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-glow">
            <Lock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
              {tierName} required
            </p>
            <h3 className="font-display mt-1 text-[1.3rem] font-bold leading-snug tracking-tight">
              Unlock the full {human}
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              You're previewing about 10% of this {human}. Upgrade to read the rest —
              plus the entire library, daily insights and Q/A-gated courses, refreshed every 2 hours.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-glow hover:opacity-95"
                onClick={() => upgrade.open(item.tier_required)}
              >
                <Sparkles className="mr-1.5 h-4 w-4" /> Upgrade to unlock
              </Button>
              <Button asChild variant="outline"><Link to="/pricing">See plans</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

const TYPE_THEME: Record<string, { grad: string; ring: string; accent: string; label: string; icon: any }> = {
  prompt: { grad: "from-violet-600 via-fuchsia-500 to-pink-500", ring: "ring-fuchsia-400/40", accent: "text-fuchsia-300", label: "Prompt Lab", icon: Sparkles },
  course: { grad: "from-indigo-600 via-blue-500 to-cyan-400", ring: "ring-cyan-400/40", accent: "text-cyan-300", label: "Mini Course", icon: BookOpen },
  template: { grad: "from-emerald-500 via-teal-500 to-cyan-500", ring: "ring-emerald-400/40", accent: "text-emerald-300", label: "Template", icon: Code2 },
  workflow: { grad: "from-sky-500 via-blue-500 to-indigo-600", ring: "ring-sky-400/40", accent: "text-sky-300", label: "Workflow", icon: WorkflowIcon },
  agent: { grad: "from-fuchsia-600 via-pink-500 to-rose-500", ring: "ring-fuchsia-400/40", accent: "text-fuchsia-300", label: "Agent Blueprint", icon: Bot },
  business_lesson: { grad: "from-emerald-600 via-teal-500 to-cyan-500", ring: "ring-emerald-400/40", accent: "text-emerald-300", label: "Business Lesson", icon: Briefcase },
  insight: { grad: "from-amber-500 via-orange-500 to-red-500", ring: "ring-amber-400/40", accent: "text-amber-300", label: "Daily Insight", icon: Lightbulb },
  tool_guide: { grad: "from-zinc-700 via-slate-700 to-zinc-900", ring: "ring-zinc-400/40", accent: "text-zinc-300", label: "Tool Guide", icon: Wrench },
  playbook: { grad: "from-rose-600 via-pink-500 to-fuchsia-600", ring: "ring-rose-400/40", accent: "text-rose-300", label: "Playbook", icon: ScrollText },
  challenge: { grad: "from-red-600 via-orange-500 to-yellow-500", ring: "ring-red-400/40", accent: "text-red-300", label: "Challenge", icon: Target },
  cheatsheet: { grad: "from-indigo-500 via-blue-500 to-cyan-500", ring: "ring-indigo-400/40", accent: "text-indigo-300", label: "Cheatsheet", icon: FileText },
};

function UnlockedView({ data }: { data: any }) {
  const item = data.item;
  const payload = data.payload ?? {};
  const extra = payload.extra ?? {};
  const theme = TYPE_THEME[item.type] ?? TYPE_THEME.prompt;
  const TIcon = theme.icon;

  // Courses need a wider shell — the player has a lesson sidebar + main area
  // that gets cramped inside the 680px reading column.
  const shellWidth = item.type === "course" ? "max-w-5xl" : "max-w-[680px]";

  return (
    <article className={`relative mx-auto ${shellWidth} space-y-12 pb-20`}>
      {/* Reading progress bar — sticks under the topbar as you scroll */}
      <ReadingProgress accent={theme.grad} />

      {/* Editorial header — magazine-grade. Serif headline, byline strip. */}
      <header className="relative pt-6">
        {/* Category line — like a newspaper section header */}
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          <span className={`bg-gradient-to-r ${theme.grad} bg-clip-text text-transparent`}>
            {theme.label}
          </span>
          {item.domain && (
            <>
              <span className="h-px w-6 bg-border" />
              <span>{domainLabel(item.domain)}</span>
            </>
          )}
        </div>

        {/* Serif title — the moment that earns the page */}
        <h1 className="font-display mt-6 text-balance text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[3.5rem]">
          {item.title}
        </h1>

        {/* Standfirst — magazine dek, serif italics */}
        {item.description && (
          <p className="font-display mt-6 max-w-[58ch] text-balance text-[1.25rem] italic leading-[1.55] text-foreground/75 md:text-[1.35rem]">
            {item.description}
          </p>
        )}

        {/* Byline strip — like a NYT/Substack article */}
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-4 text-[12.5px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${theme.grad} text-[10px] font-bold text-white shadow-soft`}>
              LV
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-foreground">The LaunchVault Intelligence Team</p>
              <p className="text-[11px]">Quality-scored · Auto-published · Updated every 2h</p>
            </div>
          </div>
          <span className="hidden h-4 w-px bg-border md:block" />
          {item.created_at && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-3.5 w-3.5" /> Published {formatDateTime(item.created_at)}
            </span>
          )}
          {item.estimated_minutes && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" /> {item.estimated_minutes} min read
            </span>
          )}
          {item.difficulty && (
            <span className="inline-flex items-center gap-1.5 font-medium capitalize">
              <span className={`h-1.5 w-1.5 rounded-full ${
                item.difficulty === "beginner" ? "bg-emerald-500" :
                item.difficulty === "intermediate" ? "bg-amber-500" : "bg-rose-500"
              }`} />
              {item.difficulty}
            </span>
          )}
          <span className="ml-auto inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/70 ring-1 ring-foreground/10">
            {item.tier_required === "free" ? "Free" : item.tier_required}
          </span>
          <SaveButton contentId={item.id} variant="pill" />
        </div>
      </header>

      {item.type === "template" && <TemplateView code={payload.code} previewHtml={payload.preview_html} extra={extra} />}
      {item.type === "prompt" && (
        payload.lesson_content
          ? <PromptLabView contentId={item.id} xpReward={item.xp_reward ?? 25} prompt={payload.prompt} lesson={payload.lesson_content} extra={extra} alreadyCompleted={!!data.progress?.is_completed} />
          : <PromptView prompt={payload.prompt} extra={extra} />
      )}
      {item.type === "course" && <CoursePlayer contentId={item.id} sections={payload.course_sections ?? []} extra={extra} initialProgress={data.progress} />}
      {item.type === "workflow" && <WorkflowView payload={payload} />}
      {item.type === "agent" && <AgentView payload={payload} />}
      {item.type === "business_lesson" && <BusinessView payload={payload} />}
      {item.type === "insight" && <InsightView payload={payload} />}
      {item.type === "tool_guide" && <ToolView payload={payload} />}
      {item.type === "playbook" && <PlaybookView payload={payload} />}
      {item.type === "challenge" && <ChallengeView payload={payload} />}
      {item.type === "cheatsheet" && <CheatsheetView payload={payload} />}
    </article>
  );
}

/* ============================ TEMPLATE ============================ */

function sanitizeHtml(html: string): string {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function TemplateView({ code, previewHtml, extra }: { code?: string | null; previewHtml?: string | null; extra: any }) {
  const ui = extra?.ui_preview ?? {};
  const safeHtml = useMemo(() => sanitizeHtml(previewHtml ?? ""), [previewHtml]);
  const srcDoc = useMemo(
    () => `<!doctype html><html><head><meta charset="utf-8"/><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:#fff;color:#0f172a}</style></head><body>${safeHtml}</body></html>`,
    [safeHtml],
  );

  return (
    <Tabs defaultValue="preview" className="w-full">
      <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-grid">
        <TabsTrigger value="preview"><Eye className="mr-1.5 h-3.5 w-3.5" />Preview</TabsTrigger>
        <TabsTrigger value="about"><FileText className="mr-1.5 h-3.5 w-3.5" />Description</TabsTrigger>
        <TabsTrigger value="code"><Code2 className="mr-1.5 h-3.5 w-3.5" />Code</TabsTrigger>
        <TabsTrigger value="notes"><ListChecks className="mr-1.5 h-3.5 w-3.5" />Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="mt-4 space-y-3">
        {ui.example_title && <h2 className="text-lg font-semibold">{ui.example_title}</h2>}
        {ui.example_description && <p className="text-sm text-muted-foreground">{ui.example_description}</p>}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Live sandbox preview
            </span>
          </div>
          <iframe
            title="Template preview"
            srcDoc={srcDoc}
            sandbox=""
            className="h-[640px] w-full bg-white"
          />
        </div>
      </TabsContent>

      <TabsContent value="about" className="mt-4 space-y-5">
        {ui.visual_style && <InfoBlock label="Visual style" value={ui.visual_style} />}
        {ui.responsive_behavior && <InfoBlock label="Responsive behavior" value={ui.responsive_behavior} />}
        <ListBlock label="Best for" items={ui.best_for} />
        <ListBlock label="Accessibility notes" items={ui.accessibility_notes} />
        <ListBlock label="Customization tips" items={ui.customization_tips} />
      </TabsContent>

      <TabsContent value="code" className="mt-4">
        <CodePane title="Template code" language={extra?.code_language ?? "tsx"} code={code ?? ""} />
      </TabsContent>

      <TabsContent value="notes" className="mt-4 space-y-5">
        <ListBlock label="Implementation notes" items={extra?.implementation_notes} />
        <ListBlock label="Design quality checklist" items={extra?.design_quality_checklist} icon="check" />
      </TabsContent>
    </Tabs>
  );
}

/* ============================ PROMPT LAB (Goal/Idea/Why/Anatomy/Practice/Upgrade/Quick Check) ============================ */

function PromptLabView({
  contentId, xpReward, prompt, lesson, extra, alreadyCompleted,
}: {
  contentId: string;
  xpReward: number;
  prompt?: string | null;
  lesson: any;
  extra: any;
  alreadyCompleted: boolean;
}) {
  const steps = useMemo(() => {
    const s: { id: string; label: string; icon: any }[] = [];
    if (lesson.goal) s.push({ id: "goal", label: "Goal", icon: Target });
    if (lesson.idea) s.push({ id: "idea", label: "Idea", icon: Lightbulb });
    if (lesson.why) s.push({ id: "why", label: "Why", icon: Sparkles });
    if (lesson.anatomy) s.push({ id: "anatomy", label: "Anatomy", icon: Code2 });
    s.push({ id: "practice", label: "Practice", icon: Rocket });
    if (lesson.upgrade) s.push({ id: "upgrade", label: "Upgrade", icon: Wrench });
    if (lesson.quick_check) s.push({ id: "quick_check", label: "Quick Check", icon: ListChecks });
    return s;
  }, [lesson]);

  const [active, setActive] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set(alreadyCompleted ? steps.map((x) => x.id) : []));
  const [completed, setCompleted] = useState(alreadyCompleted);

  const saveFn = useServerFn(recordSectionProgress);
  const save = useMutation({
    mutationFn: () => saveFn({ data: { contentId, sectionIndex: 0, totalSections: 1, completedAll: true } }),
    onSuccess: (res) => {
      setCompleted(true);
      if (res?.awardedXp) toast.success(`+${res.awardedXp} XP earned`, { icon: "⚡" });
      else toast.success("Lesson complete!");
    },
  });

  const step = steps[active];
  const isLast = active === steps.length - 1;

  const markStepDone = () => {
    const next = new Set(done);
    next.add(step.id);
    setDone(next);
    if (!isLast) setActive(active + 1);
    else if (!completed) save.mutate();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Stepper rail */}
      <aside className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-violet-600/10 via-fuchsia-500/10 to-pink-500/10 p-4 shadow-soft">
          <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-bold text-foreground">{xpReward} XP</span>
              <span className="text-muted-foreground">on completion</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 shadow-glow transition-all"
                style={{ width: `${(done.size / steps.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">
              {done.size} of {steps.length} steps
            </p>
          </div>
        </div>

        <ol className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-soft">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === active;
            const isDone = done.has(s.id);
            return (
              <li key={s.id}>
                <button
                  onClick={() => setActive(i)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-glow"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-emerald-500"}`} />
                  ) : (
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-muted-foreground"}`} />
                  )}
                  <span className="font-medium">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {completed && (
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 p-4 text-center text-xs font-semibold text-emerald-700 shadow-soft">
            <Trophy className="mx-auto mb-1 h-5 w-5" />
            Lesson complete!
          </div>
        )}
      </aside>

      {/* Step body */}
      <section className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-elevated">
          <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 blur-3xl" />
          <p className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            <step.icon className="h-3 w-3" /> Step {active + 1} · {step.label}
          </p>



          {step.id === "goal" && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">What you'll accomplish</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">{lesson.goal}</p>
              {Array.isArray(lesson.outcomes) && lesson.outcomes.length > 0 && (
                <ListBlock label="By the end you'll be able to" items={lesson.outcomes} icon="check" />
              )}
            </>
          )}

          {step.id === "idea" && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">The big idea</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">{lesson.idea}</p>
              {lesson.analogy && (
                <blockquote className="mt-4 border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm italic">
                  {lesson.analogy}
                </blockquote>
              )}
            </>
          )}

          {step.id === "why" && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Why this works</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">{lesson.why}</p>
              {Array.isArray(lesson.principles) && lesson.principles.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {lesson.principles.map((p: any, i: number) => (
                    <div key={i} className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-sm font-semibold">{p.name ?? `Principle ${i + 1}`}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.description ?? p}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step.id === "anatomy" && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Anatomy of the prompt</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">{lesson.anatomy?.intro ?? lesson.anatomy}</p>
              {Array.isArray(lesson.anatomy?.parts) && (
                <ol className="mt-5 space-y-3">
                  {lesson.anatomy.parts.map((p: any, i: number) => (
                    <li key={i} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <p className="text-sm font-semibold">{p.label}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{p.explanation}</p>
                      {p.snippet && (
                        <pre className="mt-2 overflow-auto rounded-md bg-muted/60 p-3 text-xs">
                          <code className="whitespace-pre-wrap">{p.snippet}</code>
                        </pre>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}

          {step.id === "practice" && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Practice lab</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Copy the prompt below, paste it into your AI of choice, and customize the bracketed parts.
              </p>
              {prompt && (
                <div className="mt-4">
                  <CodePane title="Copy-ready prompt" language="prompt" code={prompt} />
                </div>
              )}
              {lesson.practice?.task && (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Your task</p>
                  <p className="mt-1 text-sm">{lesson.practice.task}</p>
                </div>
              )}
              <ListBlock label="Success criteria" items={lesson.practice?.success_criteria} icon="check" />
            </>
          )}

          {step.id === "upgrade" && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Level up the prompt</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">{lesson.upgrade?.intro ?? lesson.upgrade}</p>
              {Array.isArray(lesson.upgrade?.variations) && (
                <div className="mt-4 space-y-3">
                  {lesson.upgrade.variations.map((v: any, i: number) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-sm font-semibold">{v.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                      {v.snippet && (
                        <pre className="mt-2 overflow-auto rounded-md bg-muted/60 p-3 text-xs">
                          <code className="whitespace-pre-wrap">{v.snippet}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step.id === "quick_check" && (
            <>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Quick check</h2>
              <p className="mt-2 text-sm text-muted-foreground">Test what you just learned.</p>
              <div className="mt-4">
                <QuizCard quiz={lesson.quick_check} />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" disabled={active === 0} onClick={() => setActive(active - 1)}>
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
          </Button>
          {!isLast ? (
            <Button className="bg-gradient-primary" onClick={markStepDone}>
              Continue <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : completed ? (
            <Button asChild variant="outline">
              <Link to="/dashboard"><Flame className="mr-1.5 h-4 w-4" /> Back to skill map</Link>
            </Button>
          ) : (
            <Button className="bg-gradient-primary" onClick={markStepDone} disabled={save.isPending}>
              <Trophy className="mr-1.5 h-4 w-4" /> Finish lesson · +{xpReward} XP
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

/* ============================ PROMPT (long-form article — fallback) ============================ */



function PromptView({ prompt, extra }: { prompt?: string | null; extra: any }) {
  return (
    <div className="space-y-12">
      {/* Article-grade enrichment — intro, takeaways, deep-dive, stats, comparison, quote, related */}
      <ArticleBody article={extra?.article} />

    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {/* Why it works — compact */}
        {extra?.prompt_summary && (
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-700">Why it works</p>
            <p className="mt-1.5 text-[15px] leading-relaxed">{extra.prompt_summary}</p>
          </div>
        )}

        {/* The prompt — the hero */}
        {prompt && <CodePane title="Copy-ready prompt" language="prompt" code={prompt} />}

        {/* Inputs */}
        {Array.isArray(extra?.inputs) && extra.inputs.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Inputs to fill in</p>
            <ul className="mt-3 space-y-2.5">
              {extra.inputs.map((i: any, idx: number) => (
                <li key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <code className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-semibold">{i.name}</code>
                  <p className="mt-1.5 text-sm">{i.description}</p>
                  {i.example && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <span className="font-semibold">e.g. </span>{i.example}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Usage steps */}
        {Array.isArray(extra?.usage_steps) && extra.usage_steps.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">How to use</p>
            <ol className="mt-3 space-y-2">
              {extra.usage_steps.map((s: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Example */}
        {extra?.example_use_case && (
          <section className="rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/5 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">In practice</p>
            <p className="mt-1.5 text-[15px] italic leading-relaxed">{extra.example_use_case}</p>
          </section>
        )}
      </div>

      {/* Sidebar: meta + checklist */}
      <aside className="space-y-4">
        {extra?.output_format && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Output format</p>
            <p className="mt-1.5 text-sm leading-relaxed">{extra.output_format}</p>
          </div>
        )}

        {Array.isArray(extra?.quality_checklist) && extra.quality_checklist.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Before you ship</p>
            <ul className="mt-2 space-y-1.5">
              {extra.quality_checklist.map((c: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(extra?.best_for) && extra.best_for.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Best for</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {extra.best_for.map((b: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-[11px] font-normal">{b}</Badge>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(extra?.common_mistakes) && extra.common_mistakes.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Common mistakes</p>
            <ul className="mt-2 space-y-1.5">
              {extra.common_mistakes.map((m: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
    </div>
  );
}

/* ============================ COURSE ============================ */

function CourseView({
  contentId, sections, extra, initialProgress,
}: {
  contentId: string;
  sections: any[];
  extra: any;
  initialProgress?: { current_section?: number; completed_sections?: number[]; is_completed?: boolean } | null;
}) {
  const total = sections.length;
  const initialActive = Math.min(initialProgress?.current_section ?? 0, Math.max(0, total - 1));
  const [active, setActive] = useState(initialActive);
  const [done, setDone] = useState<Set<number>>(
    new Set(Array.isArray(initialProgress?.completed_sections) ? initialProgress!.completed_sections! : []),
  );
  // Tracks which sections' quizzes have been answered correctly THIS session.
  // Sections without a quiz are auto-marked correct so the gate doesn't block them.
  const [quizPassed, setQuizPassed] = useState<Set<number>>(new Set());
  const section = sections[active];

  const saveFn = useServerFn(recordSectionProgress);
  const save = useMutation({
    mutationFn: (input: { sectionIndex: number; completedAll?: boolean }) =>
      saveFn({
        data: {
          contentId,
          sectionIndex: input.sectionIndex,
          totalSections: total,
          completedAll: input.completedAll,
        },
      }),
    onSuccess: (res) => {
      if (res?.awardedXp) {
        toast.success(`+${res.awardedXp} XP`, { icon: "⚡" });
      }
      if (res?.isCompleted) {
        toast.success("Course complete! 🎉");
      }
    },
  });

  if (!section) {
    return <p className="text-sm text-muted-foreground">This course has no sections yet.</p>;
  }

  const hasQuiz = !!section.checkpoint_quiz;
  const sectionUnlocked = !hasQuiz || quizPassed.has(active) || done.has(active);

  const markDone = () => {
    if (!sectionUnlocked) return;
    const next = new Set(done);
    next.add(active);
    setDone(next);
    const isLast = active >= total - 1;
    save.mutate({ sectionIndex: active, completedAll: isLast });
    if (!isLast) setActive(active + 1);
  };

  const pct = total ? Math.round((done.size / total) * 100) : 0;

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      {/* Sidebar — ONE unified rail, sections divided by hairlines not borders */}
      <aside className="relative">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-soft">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <span>Progress</span>
              <span className="text-foreground">{pct}%</span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{done.size} of {total} lessons</p>
          </div>

          {/* Outcome — quiet pull-quote, not a card */}
          {extra?.final_outcome && (
            <div className="mt-6 border-t border-border/70 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700">By the end</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">{extra.final_outcome}</p>
            </div>
          )}

          {/* Objectives */}
          {Array.isArray(extra?.learning_objectives) && extra.learning_objectives.length > 0 && (
            <div className="mt-5 border-t border-border/70 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">You'll learn</p>
              <ul className="mt-2 space-y-1.5">
                {extra.learning_objectives.map((it: string, i: number) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-foreground/85">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prereqs */}
          {Array.isArray(extra?.prerequisites) && extra.prerequisites.length > 0 && (
            <div className="mt-5 border-t border-border/70 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Prereqs</p>
              <ul className="mt-2 space-y-1 text-[12.5px] text-muted-foreground">
                {extra.prerequisites.map((p: string, i: number) => (
                  <li key={i}>· {p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Lessons rail */}
          <div className="mt-5 border-t border-border/70 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Lessons</p>
            <ol className="mt-2 -mx-1 space-y-0.5">
              {sections.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActive(i)}
                    className={`group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all ${
                      i === active
                        ? "bg-gradient-to-r from-indigo-500/12 to-cyan-500/8 font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    {done.has(i) ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                        i === active
                          ? "bg-gradient-to-br from-indigo-500 to-cyan-400 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {i + 1}
                      </span>
                    )}
                    <span className="line-clamp-2 leading-snug">{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>

      {/* Main lesson body — magazine reading flow, serif typography */}
      <section>
        {/* Lesson chip */}
        <div className="flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-2.5 py-0.5 text-white">
            <BookOpen className="h-3 w-3" /> Lesson {active + 1} of {sections.length}
          </span>
        </div>

        {/* Lesson title — serif, dramatic */}
        <h2 className="font-display mt-4 text-balance text-[2.25rem] font-bold leading-[1.05] tracking-[-0.02em] md:text-[2.75rem]">
          {section.title}
        </h2>

        {/* Objective — serif italic lede with thin rule */}
        {section.objective && (
          <p className="font-display mt-6 border-l-2 border-cyan-500/60 pl-5 text-[1.2rem] italic leading-[1.55] text-foreground/80">
            {section.objective}
          </p>
        )}

        {/* Lesson body */}
        {section.lesson && (
          <p className="mt-8 whitespace-pre-wrap text-[1.05rem] leading-[1.75] text-foreground/90">
            {section.lesson}
          </p>
        )}

        {/* Example — premium serif blockquote */}
        {section.example && (
          <figure className="relative mt-10">
            <span
              className="font-display absolute -left-1 -top-5 select-none text-[6rem] leading-none text-fuchsia-500/25"
              aria-hidden
            >
              &ldquo;
            </span>
            <blockquote className="font-display relative pl-7 text-[1.2rem] italic leading-[1.55] text-foreground/85">
              {section.example}
            </blockquote>
            <figcaption className="mt-3 pl-7 text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
              — Example
            </figcaption>
          </figure>
        )}

        {/* Walkthrough — clean numbered list */}
        {Array.isArray(section.walkthrough_steps) && section.walkthrough_steps.length > 0 && (
          <div className="mt-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Walkthrough</p>
            <ol className="mt-3 space-y-2.5">
              {section.walkthrough_steps.map((s: string, i: number) => (
                <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Quiz — Duolingo-grade, mandatory */}
        {section.checkpoint_quiz && (
          <div className="mt-10">
            <QuizCard
              quiz={section.checkpoint_quiz}
              required
              onCorrect={() => {
                setQuizPassed((s) => {
                  const next = new Set(s);
                  next.add(active);
                  return next;
                });
              }}
            />
          </div>
        )}

        {/* Try-it */}
        {section.try_it_task && (
          <div className="mt-8">
            <TryItCard task={section.try_it_task} />
          </div>
        )}

        {/* Common mistakes — list under a hairline, not a box */}
        {Array.isArray(section.common_mistakes) && section.common_mistakes.length > 0 && (
          <div className="mt-10 border-t border-border pt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700">Common mistakes</p>
            <ul className="mt-3 space-y-2">
              {section.common_mistakes.map((m: string, i: number) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/85">
                  <XCircle className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recap + next step — two thin pull-quotes, not boxes */}
        {(section.recap || section.next_step) && (
          <div className="mt-10 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
            {section.recap && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Recap</p>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">{section.recap}</p>
              </div>
            )}
            {section.next_step && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">What's next</p>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">{section.next_step}</p>
              </div>
            )}
          </div>
        )}

        {/* Q/A gate: when the section has a quiz and it's not yet passed,
            the Continue button is locked. Tells the user clearly what to do. */}
        {hasQuiz && !sectionUnlocked && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-800">
            <span className="font-bold">Answer the checkpoint quiz above</span> to continue to the next lesson.
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="outline" disabled={active === 0} onClick={() => setActive(active - 1)}>
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
          </Button>
          {active < sections.length - 1 ? (
            <Button
              onClick={markDone}
              disabled={!sectionUnlocked}
              className={`text-white shadow-glow transition-all ${
                sectionUnlocked
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-500 hover:opacity-90"
                  : "bg-muted-foreground/60 cursor-not-allowed opacity-70"
              }`}
            >
              {sectionUnlocked ? "Continue" : "Locked"} <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              asChild={sectionUnlocked}
              onClick={sectionUnlocked ? markDone : undefined}
              disabled={!sectionUnlocked}
              className={`text-white shadow-glow ${
                sectionUnlocked
                  ? "bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 hover:opacity-90"
                  : "bg-muted-foreground/60 cursor-not-allowed opacity-70"
              }`}
            >
              {sectionUnlocked ? (
                <Link to="/dashboard/courses">
                  <Trophy className="mr-1.5 h-4 w-4" /> Finish & browse more
                </Link>
              ) : (
                <span><Trophy className="mr-1.5 inline h-4 w-4" /> Finish course</span>
              )}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function TryItCard({ task }: { task: any }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-violet-600/10 via-fuchsia-500/10 to-pink-500/5 p-6 shadow-soft">
      <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <p className="relative inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
        <Rocket className="h-3 w-3" /> Try it yourself
      </p>
      <h3 className="relative mt-3 text-xl font-bold tracking-tight">{task.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-foreground">{task.instructions}</p>
      {task.starter_prompt_or_code && (
        <pre className="relative mt-4 max-h-60 overflow-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs text-slate-100">
          <code className="whitespace-pre-wrap break-words font-mono">{task.starter_prompt_or_code}</code>
        </pre>
      )}
      <div className="relative mt-4">
        <ListBlock label="Success criteria" items={task.success_criteria} icon="check" compact />
      </div>
    </div>
  );
}

function QuizCard({
  quiz, required, onCorrect,
}: {
  quiz: any;
  required?: boolean;
  onCorrect?: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const correct = picked === quiz.correct_answer;
  // Lock-in on correct so re-renders don't drop the unlocked state
  const [solved, setSolved] = useState(false);

  const choose = (opt: string) => {
    if (solved) return; // already correct — don't change
    setPicked(opt);
    setAttempts((a) => a + 1);
    if (opt === quiz.correct_answer) {
      setSolved(true);
      onCorrect?.();
    }
  };

  const reset = () => {
    if (solved) return;
    setPicked(null);
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <ListChecks className="h-3 w-3" /> {required ? "Checkpoint quiz" : "Quick check"}
        </p>
        {solved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> {attempts > 1 ? `Passed in ${attempts} tries` : "Passed"}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-xl font-bold leading-snug tracking-tight">{quiz.question}</h3>

      <div className="mt-5 space-y-2.5">
        {(quiz.options ?? []).map((opt: string, i: number) => {
          const isPicked = picked === opt;
          const isAnswer = opt === quiz.correct_answer;
          const showFeedback = solved || (picked !== null && isPicked);
          const stateCls = !showFeedback
            ? "border-border bg-background hover:border-foreground/30 hover:bg-muted/30 cursor-pointer"
            : isAnswer
              ? "border-emerald-500/60 bg-emerald-500/8"
              : isPicked
                ? "border-rose-500/60 bg-rose-500/8"
                : "border-border bg-background opacity-50";
          const letterCls = !showFeedback
            ? "bg-muted text-foreground/70"
            : isAnswer
              ? "bg-emerald-500 text-white"
              : isPicked
                ? "bg-rose-500 text-white"
                : "bg-muted text-muted-foreground";
          return (
            <button
              key={i}
              onClick={() => choose(opt)}
              disabled={solved}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-all duration-200 ${stateCls}`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold transition-colors ${letterCls}`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {solved && isAnswer && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {!solved && isPicked && !isAnswer && <XCircle className="h-5 w-5 text-rose-600" />}
            </button>
          );
        })}
      </div>

      {picked != null && (
        <div className={`mt-5 rounded-xl border-l-2 px-4 py-3 text-[14px] leading-relaxed ${
          correct
            ? "border-emerald-500 bg-emerald-500/5 text-foreground"
            : "border-rose-500 bg-rose-500/5 text-foreground"
        }`}>
          <span className={`font-bold ${correct ? "text-emerald-700" : "text-rose-700"}`}>
            {correct ? "Correct. " : "Not quite. "}
          </span>
          {correct ? quiz.explanation : "Try a different option."}
          {!correct && (
            <button onClick={reset} className="ml-2 text-xs font-bold text-muted-foreground underline hover:text-foreground">
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================ SHARED ============================ */

/**
 * Magazine-grade reading progress bar. Sticks at the top of the viewport
 * and fills as the reader scrolls through the article. Visible only when
 * the article is in view (i.e. on content detail pages).
 */
function ReadingProgress({ accent }: { accent: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setPct(docH > 0 ? Math.min(100, Math.max(0, (y / docH) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed inset-x-0 top-16 z-30 h-[2px] bg-transparent">
      <div
        className={`h-full bg-gradient-to-r ${accent} transition-[width] duration-100`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

function ListBlock({
  label, items, numbered, icon, compact,
}: { label: string; items?: string[]; numbered?: boolean; icon?: "check"; compact?: boolean }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className={compact ? "rounded-xl border border-border bg-card p-3" : "rounded-xl border border-border bg-card p-4"}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm">
            {numbered ? (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</span>
            ) : icon === "check" ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            )}
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CodePane({ title, code, language }: { title: string; code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-elevated">
      {/* Glow accent */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 opacity-20 blur-3xl transition-opacity group-hover:opacity-40" />
      <div className="relative flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-100">{title}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-300/80">{language}</p>
          </div>
        </div>
        <Button size="sm" onClick={onCopy} className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-glow hover:opacity-90">
          {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="relative max-h-[60vh] overflow-auto p-5 text-[13px] leading-relaxed text-slate-100">
        <code className="whitespace-pre-wrap break-words font-mono">{code}</code>
      </pre>
    </div>
  );
}
