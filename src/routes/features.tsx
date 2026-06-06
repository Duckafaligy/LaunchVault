import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquareCode, GraduationCap, Workflow as WorkflowIcon, Bot, Briefcase,
  Lightbulb, Wrench, ScrollText, Target, FileText, Sparkles, ShieldCheck,
  Clock, Zap, ArrowRight, Layers, BookOpen, Eye, Lock, Cpu, RefreshCw,
  CheckCircle2, type LucideIcon,
} from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: buildSeoMeta({
      title: "AI Learning Platform Features — Prompts, Courses & AI Agents | LaunchVault",
      description: "See how LaunchVault helps you learn AI: 10 content types across 50 AI domains — copy-ready prompts, Q/A-gated courses, AI agent blueprints, and guides, refreshed every 2 hours. The complete AI learning platform.",
      path: "/features",
    }),
    links: buildSeoLinks("/features"),
  }),
  component: FeaturesPage,
});

type ContentTypeRow = { icon: LucideIcon; name: string; tagline: string; example: string; gradient: string; };

const CONTENT_TYPES: ContentTypeRow[] = [
  { icon: MessageSquareCode, name: "AI Prompts",        tagline: "Copy-ready, with inputs, usage steps, and a quality checklist.", example: "“Investor-ready monthly update generator”", gradient: "from-violet-600 to-fuchsia-500" },
  { icon: GraduationCap,      name: "Micro-Courses",    tagline: "Codecademy-style, mandatory quizzes, hands-on practice tasks.",   example: "“The 7-part anatomy of a prompt”",     gradient: "from-indigo-600 to-cyan-500"  },
  { icon: WorkflowIcon,       name: "Workflows",        tagline: "Step-by-step execution guides with tools, inputs, and outputs.",  example: "“Ship a lead-magnet in 7 steps”",      gradient: "from-sky-500 to-indigo-600"   },
  { icon: Bot,                name: "Agent Blueprints", tagline: "Goal, tools, memory, system instructions, safety. Ready to ship.",example: "“Inbox-triage agent — 4 tools, 6 steps”",gradient: "from-fuchsia-600 to-pink-500" },
  { icon: Briefcase,          name: "Business Lessons", tagline: "Monetization-focused plays for founders, agencies, freelancers.",  example: "“Charge $5k/mo with one AI service”",  gradient: "from-emerald-600 to-teal-500" },
  { icon: Lightbulb,          name: "Daily Insights",   tagline: "Short, opinionated takes on what changed in AI today.",            example: "“Why long-context models change RAG”", gradient: "from-amber-500 to-orange-500" },
  { icon: Wrench,             name: "Tool Guides",      tagline: "Honest breakdowns: what a tool does, who it's for, what to avoid.",example: "“n8n + GPT-4o for sales automation”",  gradient: "from-zinc-700 to-zinc-900"    },
  { icon: ScrollText,         name: "Playbooks",        tagline: "Multi-phase plans with checklists and success metrics.",           example: "“Build & ship an AI side-product in 30d”",gradient: "from-rose-600 to-fuchsia-600" },
  { icon: Target,             name: "Challenges",       tagline: "Practice tasks with starter material and an example solution.",    example: "“Rewrite this prompt for a 10× output”",gradient: "from-red-600 to-orange-500"   },
  { icon: FileText,           name: "Cheatsheets",      tagline: "One-page references: frameworks, patterns, do's and don'ts.",      example: "“The prompt-design framework, in one page”", gradient: "from-indigo-500 to-cyan-500"  },
];

const PILLARS = [
  { icon: RefreshCw,  title: "Self-growing every 2 hours", body: "An autonomous OpenAI worker generates, validates, and quality-scores fresh items every run. You don't refresh a static library — you return to a living one." },
  { icon: Cpu,        title: "10 content types, one feed", body: "Every type — prompts, courses, workflows, agents, business plays, insights, tool guides, playbooks, challenges, cheatsheets — flows into one personalized feed tuned to your goals." },
  { icon: Layers,     title: "50 AI mastery domains",      body: "From prompting fundamentals to multi-agent systems, AI-for-SaaS, ML basics, ethics, image/video/voice — sorted across 14 thematic groups." },
  { icon: BookOpen,   title: "Q/A-driven learning",        body: "Courses lock the next lesson until you answer the checkpoint quiz correctly. Retries with feedback. Real practice tasks. Real progress." },
  { icon: ShieldCheck,title: "Server-gated content",       body: "Premium content never reaches the browser without a verified access check. Free, Starter, Creator, and Pro tiers all enforced server-side." },
  { icon: Zap,        title: "Embedded Stripe checkout",   body: "One click to upgrade. Real Stripe, real subscriptions, real customer portal. No redirects, no surprises." },
];

const COMPARISON = [
  { you: "Static prompt library on Notion",  vs: "A library that grows on its own, 24/7" },
  { you: "Hunting through Twitter for prompts", vs: "Quality-scored prompts, organized by domain" },
  { you: "30-min YouTube AI tutorials", vs: "5-minute lessons with mandatory quizzes" },
  { you: "Vague 'use AI for business' advice", vs: "Specific business plays with monetization angles" },
  { you: "Building agents from scratch",  vs: "Ready-to-ship blueprints with safety notes" },
];

function FeaturesPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute -top-32 -left-16 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 -right-20 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-fuchsia-600/25 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> Every feature, end-to-end
          </span>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.04] tracking-[-0.025em] md:text-[5rem]">
            An AI academy that
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              keeps growing on its own.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Ten content types, 50 domains, two-hour content cycles, Q/A-gated learning, and an embedded checkout that just works. LaunchVault is the only AI platform that finishes what static libraries can't.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)] transition-all hover:scale-[1.03]">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white/10">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* The 6 pillars */}
      <section className="border-y border-border bg-gradient-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The pillars</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight md:text-4xl">What makes LaunchVault different</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Six properties no other AI library has. Together they're the whole product.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <article key={p.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-soft">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold leading-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                <span className="absolute right-4 top-4 text-[10px] font-bold text-muted-foreground/40">0{i + 1}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* The 10 content types */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Ten content types</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Every format you need, ready to use</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Built for how you actually work — copy a prompt, follow a workflow, run an agent, ship a business play, read an insight.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {CONTENT_TYPES.map((t) => (
            <article key={t.name} className="group flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-soft`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold leading-tight">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
                <p className="mt-2 line-clamp-1 text-xs italic text-muted-foreground/80">Example: {t.example}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Daily Q/A learning */}
      <section className="border-y border-border bg-gradient-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Q/A learning</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight md:text-4xl">Quiz-gated lessons. Real practice.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Reading isn't learning. Every course lesson ends with a mandatory checkpoint quiz — answer correctly to unlock the next lesson. Retries with feedback. No fast-forwarding through fluff.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Concept → Example → Quiz → Practice task → Recap",
                  "Continue button locks until the quiz is correct",
                  "Try-it task with starter snippet + success criteria",
                  "XP awarded per lesson, streaks for daily consistency",
                  "Progress saves to your profile, picks up where you left off",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Mock course UI */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-slate-950 p-6 text-white shadow-elevated">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
              <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]">
                <BookOpen className="h-3 w-3" /> Lesson 3 of 5
              </p>
              <h3 className="mt-3 text-xl font-bold">Force a structured output</h3>
              <div className="mt-3 rounded-lg border-l-4 border-cyan-400 bg-cyan-400/10 px-3 py-2 text-xs">
                <span className="font-bold text-cyan-200">Objective: </span>
                tell the model exactly what shape the response must take.
              </div>
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]">
                  Required check
                </p>
                <p className="mt-2 text-sm">Which line forces structure most reliably?</p>
                <div className="mt-3 space-y-2 text-xs">
                  {[
                    "Output: a JSON object with keys topic / insight / action.",
                    "Reply nicely.",
                    "Make it short.",
                    "Be creative.",
                  ].map((o, i) => (
                    <div key={i} className={`rounded-lg border-2 px-3 py-2 ${i === 0 ? "border-emerald-500/60 bg-emerald-500/15" : "border-white/10 bg-white/5"}`}>
                      <span className={`mr-2 inline-grid h-5 w-5 place-items-center rounded text-[10px] font-bold ${i === 0 ? "bg-emerald-500 text-white" : "bg-white/15 text-slate-300"}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {o}
                      {i === 0 && <span className="ml-2 text-emerald-300">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-between text-[11px] text-slate-400">
                <span>+25 XP on complete</span>
                <span className="font-bold text-emerald-400">Continue unlocked →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The difference</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Why people switch to LaunchVault</h2>
        </div>
        <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">What you've been doing</th>
                <th className="px-5 py-3">What LaunchVault gives you</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-5 py-4 text-muted-foreground">{row.you}</td>
                  <td className="px-5 py-4 font-medium text-foreground">
                    <span className="inline-flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {row.vs}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Privacy + access */}
      <section className="border-t border-border bg-gradient-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Trust + access</p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight md:text-4xl">Premium content, served safely</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Stat title="Server-side gating" body="Locked content never reaches your browser without a verified tier check. RLS on every table." icon={Lock} />
            <Stat title="No data resale" body="Your prompts, your saves, your progress — yours. We don't sell or share, ever." icon={ShieldCheck} />
            <Stat title="Live updates" body="New content appears in the library within seconds of being generated. No page refresh. Webflow-like." icon={Eye} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-20 text-center md:py-24">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-[120px]" />
            <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-[120px]" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200 ring-1 ring-white/15">
            <Sparkles className="h-3 w-3" /> Open the vault
          </span>
          <h2 className="font-display mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Stop chasing AI tutorials.
            <span className="block">Get the engine that builds them for you.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Start free. Upgrade when you're ready. Cancel any time.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-8 py-4 text-base font-bold text-slate-950 hover:bg-indigo-50">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur hover:bg-white/10">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function Stat({ title, body, icon: Icon }: { title: string; body: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-soft">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

// Suppress unused-warning while the variable is in scope (Clock used elsewhere if extended)
void Clock;
