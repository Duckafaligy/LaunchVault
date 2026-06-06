import { Link } from "@tanstack/react-router";
import {
  Sparkles, MessageSquareCode, GraduationCap, Bot, Workflow as WorkflowIcon,
  Lightbulb, Copy, CheckCircle2, Clock, ChevronRight, Flame, Zap, Crown, Target,
  ArrowRight, ShieldCheck, Layers, BookOpen,
} from "lucide-react";

export function ProductPreview() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-indigo-600/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> A live look inside
          </span>
          <h2 className="mt-4 text-balance text-4xl font-extrabold tracking-tight md:text-5xl">
            Not another prompt list.
            <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">A working AI mastery dashboard.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            Every account ships with a personalized feed, interactive prompt labs, Codecademy-style courses,
            agent blueprint studios, and execution-ready workflows — all updated automatically every two hours.
          </p>
        </div>

        {/* Grid of mocks */}
        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          <DashboardMock className="lg:col-span-7" />
          <PromptLabMock className="lg:col-span-5" />
          <AgentBlueprintMock className="lg:col-span-5" />
          <CourseMock className="lg:col-span-7" />
        </div>

        <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)] transition-all hover:scale-[1.02]"
          >
            Open your free account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/10"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===================================================================== */
/* DASHBOARD MOCK — looks like the real /dashboard                          */
/* ===================================================================== */

function DashboardMock({ className }: { className?: string }) {
  return (
    <Card className={className} kicker="Your personalized AI feed" title="Dashboard">
      <div className="grid h-full gap-2 md:grid-cols-[140px_1fr]">
        {/* Sidebar */}
        <div className="hidden h-full rounded-xl border border-white/10 bg-slate-900/40 p-2 md:block">
          <div className="rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider">
            LV
          </div>
          <ul className="mt-3 space-y-0.5 text-[11px]">
            {[
              { l: "Home", a: true },
              { l: "Daily Insights" },
              { l: "Prompts" },
              { l: "Courses" },
              { l: "Workflows" },
              { l: "Agents" },
              { l: "Business" },
              { l: "Tools" },
            ].map((x) => (
              <li
                key={x.l}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 ${
                  x.a ? "bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/20 font-semibold text-white" : "text-slate-400"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${x.a ? "bg-fuchsia-400" : "bg-slate-600"}`} />
                {x.l}
              </li>
            ))}
          </ul>
        </div>

        {/* Main */}
        <div className="space-y-3">
          {/* Streak strip */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 font-semibold text-orange-200">
              <Flame className="h-3 w-3" /> 7-day
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 font-semibold text-violet-200">
              <Zap className="h-3 w-3" /> 1,420 XP
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-200">
              <Crown className="h-3 w-3" /> Creator
            </span>
          </div>

          {/* Daily feed grid */}
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { i: Lightbulb, g: "from-amber-500 to-orange-500", k: "Today's insight", t: "Why long-context models change RAG strategy" },
              { i: MessageSquareCode, g: "from-violet-600 to-fuchsia-500", k: "Today's prompt", t: "Investor-ready monthly update generator" },
              { i: WorkflowIcon, g: "from-sky-500 to-indigo-600", k: "Today's workflow", t: "Ship a lead-magnet in 7 steps" },
            ].map((c) => (
              <div key={c.k} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                <div className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${c.g} text-white`}>
                  <c.i className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">{c.k}</p>
                <p className="mt-0.5 text-[11px] font-semibold leading-tight text-slate-100">{c.t}</p>
              </div>
            ))}
          </div>

          {/* Continue learning */}
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Continue learning</p>
            <div className="mt-2 space-y-1.5">
              {[
                { t: "Advanced Prompt Engineering", p: 60 },
                { t: "Build a Newsletter Agent", p: 25 },
              ].map((r) => (
                <div key={r.t} className="flex items-center gap-2 text-[11px]">
                  <BookOpen className="h-3 w-3 text-cyan-400" />
                  <span className="flex-1 truncate font-medium">{r.t}</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${r.p}%` }} />
                  </div>
                  <span className="text-slate-400">{r.p}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ===================================================================== */
/* PROMPT LAB MOCK                                                          */
/* ===================================================================== */

function PromptLabMock({ className }: { className?: string }) {
  return (
    <Card className={className} kicker="Copy-ready prompts" title="Prompt Lab" accent="from-violet-600 to-fuchsia-500">
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2 py-0.5 font-bold uppercase tracking-wider text-white">
            <Sparkles className="h-3 w-3" /> Prompt
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-slate-300">AI Marketing</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-slate-300">Intermediate</span>
          <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 font-semibold text-amber-200">tier1</span>
        </div>

        <p className="text-base font-bold leading-tight">Cold outbound that doesn't feel cold</p>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">Copy-ready prompt</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2 py-0.5 text-[10px] font-bold">
              <Copy className="h-3 w-3" /> Copy
            </span>
          </div>
          <pre className="px-3 py-2 text-[11px] leading-relaxed text-slate-100">
            <code className="block whitespace-pre-wrap font-mono">{`Role: senior B2B SDR

Context: [COMPANY], [TARGET_BUYER], [PAIN]
Task: write 3 cold emails …
Constraints: <120 words, 1 ask
Output: subject + body, ranked`}</code>
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <span className="rounded-md bg-white/5 px-2 py-1 text-slate-300">[COMPANY]</span>
          <span className="rounded-md bg-white/5 px-2 py-1 text-slate-300">[TARGET_BUYER]</span>
          <span className="rounded-md bg-white/5 px-2 py-1 text-slate-300">[PAIN]</span>
          <span className="rounded-md bg-white/5 px-2 py-1 text-slate-300">[TONE]</span>
        </div>
      </div>
    </Card>
  );
}

/* ===================================================================== */
/* AGENT BLUEPRINT MOCK                                                     */
/* ===================================================================== */

function AgentBlueprintMock({ className }: { className?: string }) {
  return (
    <Card className={className} kicker="Production-ready" title="Agent Blueprint Studio" accent="from-fuchsia-600 to-pink-500">
      <div className="space-y-2.5">
        <p className="text-base font-bold leading-tight">Inbox Triage Agent</p>
        <p className="text-[11px] leading-relaxed text-slate-300">
          Classifies and summarizes incoming customer email, drafts a reply, routes urgent threads.
        </p>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <Stat label="Tools" value="4" />
          <Stat label="Memory" value="2" />
          <Stat label="Risks" value="3" />
          <Stat label="Steps" value="6" />
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">System instructions</p>
          <p className="mt-1 line-clamp-3 text-[11px] text-slate-200">
            You are an inbox-triage agent. You read inbound emails, classify them as urgent / needs-reply / fyi, summarize…
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span className="text-slate-300">Includes safety & evaluation criteria</span>
        </div>
      </div>
    </Card>
  );
}

/* ===================================================================== */
/* COURSE MOCK                                                              */
/* ===================================================================== */

function CourseMock({ className }: { className?: string }) {
  return (
    <Card className={className} kicker="Hands-on, Codecademy-style" title="Mini-Course Viewer" accent="from-indigo-600 to-cyan-500">
      <div className="grid h-full gap-3 md:grid-cols-[140px_1fr]">
        {/* Lesson sidebar */}
        <div className="hidden rounded-xl border border-white/10 bg-slate-900/40 p-2 md:block">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Lessons · 60%</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
          </div>
          <ul className="mt-3 space-y-1 text-[11px]">
            {[
              { l: "Why prompts fail", d: true },
              { l: "The 7-part anatomy", d: true },
              { l: "Designing inputs", d: true },
              { l: "Output formatting", a: true },
              { l: "Evaluating outputs" },
            ].map((x) => (
              <li
                key={x.l}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${
                  x.a ? "bg-gradient-to-r from-indigo-500 to-cyan-400 font-semibold text-white" : x.d ? "text-emerald-300" : "text-slate-400"
                }`}
              >
                {x.d ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                {x.l}
              </li>
            ))}
          </ul>
        </div>

        {/* Lesson body */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
            <BookOpen className="h-3 w-3" /> Lesson 4 of 5
          </div>
          <p className="text-sm font-bold leading-tight">Force a structured output</p>
          <div className="rounded-md border-l-2 border-cyan-400 bg-cyan-400/10 px-2.5 py-1.5 text-[11px]">
            <span className="font-bold text-cyan-200">Objective: </span>
            tell the model exactly what shape the response must take.
          </div>
          <p className="text-[12px] leading-relaxed text-slate-300">
            Models follow instructions far better when you specify the response format up front. Use bullet structures, JSON keys, or template scaffolds…
          </p>

          <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3">
            <p className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <Target className="h-3 w-3" /> Try it
            </p>
            <p className="mt-1.5 text-[11px] text-slate-200">
              Rewrite the prompt to return a 3-row table with columns Topic / Insight / Action.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ===================================================================== */
/* shared atoms                                                              */
/* ===================================================================== */

function Card({
  className, children, kicker, title, accent = "from-indigo-500 to-fuchsia-500",
}: {
  className?: string; children: React.ReactNode; kicker: string; title: string; accent?: string;
}) {
  return (
    <article className={`relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl backdrop-blur ${className ?? ""}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="mb-3">
        <p className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${accent} bg-clip-text text-[10px] font-bold uppercase tracking-[0.16em] text-transparent`}>
          {kicker}
        </p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-white">{title}</h3>
      </div>
      {children}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
