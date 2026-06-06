// =====================================================================
// /learn-ai — SEO cornerstone landing page.
// Targets: "AI learning platform", "learn AI", "learn to use AI".
// Substantial, genuinely useful content + FAQ schema + internal links
// into the autonomous library so it isn't a thin doorway page.
// =====================================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, MessageSquareCode, GraduationCap, Bot, BookOpen,
  Zap, CheckCircle2, type LucideIcon,
} from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { Button } from "@/components/ui/button";
import { buildSeoMeta, buildSeoLinks, jsonLdScript, faqPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const FAQS = [
  {
    question: "What is the best way to learn AI in 2026?",
    answer:
      "The fastest way to learn AI is to use it on real tasks, not to watch passive video courses. Start with prompting (how to talk to models like ChatGPT and Claude), learn the core vocabulary, then build small things — an automation, an agent, a workflow. LaunchVault is built around this: copy-ready prompts, Q/A-gated courses, and agent blueprints you apply immediately.",
  },
  {
    question: "Can I learn AI for free?",
    answer:
      "Yes. LaunchVault has a free tier — a real account with daily AI insights, the full glossary, and the blog, all free. No credit card required. Paid plans (from $5/mo) unlock the full prompt library, courses, agent blueprints, workflows and business plays.",
  },
  {
    question: "Do I need to know how to code to learn AI?",
    answer:
      "No. Most of modern AI work — prompting, automation with tools like n8n and Make, using AI agents, applying AI to marketing or business — requires zero code. LaunchVault sorts content by difficulty so non-technical learners start with prompting and AI-for-business, while developers can jump to agents and ML topics.",
  },
  {
    question: "How long does it take to learn AI?",
    answer:
      "You can be productive with AI prompting in a weekend. Reaching real fluency — building agents, automating workflows, applying AI to a job or business — typically takes a few months of consistent practice. Because LaunchVault publishes fresh content every 2 hours across 50 domains, there's always a next step.",
  },
  {
    question: "What is an AI learning platform?",
    answer:
      "An AI learning platform is a single place to learn how to use artificial intelligence — covering prompting, tools, agents, automation and applied use cases — instead of piecing it together from scattered blogs and videos. LaunchVault is a self-growing AI learning platform: an autonomous engine generates and quality-scores new prompts, courses and guides continuously.",
  },
];

export const Route = createFileRoute("/learn-ai")({
  head: () => ({
    meta: buildSeoMeta({
      title: "Learn AI — Free AI Learning Platform to Master AI | LaunchVault",
      description:
        "Learn AI the practical way on LaunchVault, the AI learning platform that teaches you to actually use AI — copy-ready prompts, courses, AI agents and guides across 50 domains. Start free, no credit card.",
      path: "/learn-ai",
    }),
    links: buildSeoLinks("/learn-ai"),
    scripts: [
      jsonLdScript(faqPageJsonLd(FAQS)),
      jsonLdScript(breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Learn AI", path: "/learn-ai" },
      ])),
    ],
  }),
  component: LearnAiPage,
});

function LearnAiPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/4 h-[460px] w-[460px] rounded-full bg-indigo-600/25 blur-[140px]" />
          <div className="absolute -bottom-32 right-1/4 h-[420px] w-[420px] rounded-full bg-fuchsia-600/20 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center md:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> The AI learning platform
          </span>
          <h1 className="font-display mt-7 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-6xl">
            Learn AI — and actually{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              use it.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            LaunchVault is the AI learning platform that teaches you how to learn AI by doing — copy-ready
            prompts, Q/A-gated courses, AI agent blueprints, and plain-English guides across 50 AI domains,
            refreshed every two hours. No fluff, no passive videos.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 text-base font-bold shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)]">
              <Link to="/signup">Start learning free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-xl border-white/15 bg-white/5 px-8 text-base font-bold text-white hover:bg-white/10 hover:text-white">
              <Link to="/library">Browse the library</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-400">Free forever tier · No credit card · Start in 30 seconds</p>
        </div>
      </section>

      {/* What is an AI learning platform */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold tracking-tight">What is an AI learning platform?</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          An <strong className="text-foreground">AI learning platform</strong> is a single place to learn how to use
          artificial intelligence — from prompting and tools to agents, automation, and real-world use cases —
          instead of stitching it together from scattered YouTube videos and outdated blog posts. The best way to
          learn AI is to apply it, so a good platform gives you things you can copy, run, and adapt today.
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          LaunchVault is a <strong className="text-foreground">self-growing</strong> AI learning platform. An autonomous
          engine generates, validates and quality-scores new prompts, courses, agent blueprints and guides every two
          hours across 50 domains — so what you're learning never goes stale.
        </p>
      </section>

      {/* How to learn AI with LaunchVault */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="font-display text-center text-3xl font-bold tracking-tight">How to learn AI with LaunchVault</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] text-muted-foreground">
            Four ways to learn to use AI — pick where you are and go.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <PathCard
              icon={MessageSquareCode}
              title="Start with AI prompts"
              body="Copy-ready prompts for writing, coding, marketing, research and more. The fastest on-ramp to learning AI — see what good looks like, then adapt it."
              to="/library"
              cta="Open the prompt library"
            />
            <PathCard
              icon={GraduationCap}
              title="Take Q/A-gated courses"
              body="Codecademy-style AI courses that lock the next lesson until you pass a checkpoint. Real practice, real progress — not passive video."
              to="/pricing"
              cta="See courses & plans"
            />
            <PathCard
              icon={Bot}
              title="Build with AI agents"
              body="Production-ready agent blueprints — goal, tools, memory and safety — so you learn to build automations, not just chat with a model."
              to="/library"
              cta="Explore agent blueprints"
            />
            <PathCard
              icon={BookOpen}
              title="Learn the vocabulary"
              body="A plain-English AI glossary that defines every term that matters — prompting, agents, ML, fine-tuning — so the rest of AI finally makes sense."
              to="/glossary"
              cta="Open the AI glossary"
            />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold tracking-tight">Who learns AI here</h2>
        <ul className="mt-6 space-y-3">
          {[
            "Founders and marketers who want to use AI for real work — not just experiment",
            "Beginners learning to use AI with zero coding background",
            "Developers leveling up on agents, automation and ML basics",
            "Anyone who wants to learn AI a little every day and stay current",
          ].map((t) => (
            <li key={t} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <span className="text-[15px] text-muted-foreground">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">Learning AI — FAQ</h2>
          <div className="mt-8 space-y-6">
            {FAQS.map((f) => (
              <div key={f.question}>
                <h3 className="text-[16px] font-bold text-foreground">{f.question}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[360px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[130px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Zap className="h-3 w-3" /> Start free today
          </span>
          <h2 className="font-display mt-5 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            The easiest way to learn AI starts now.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Create a free account and get a personalized AI learning feed in 30 seconds.
          </p>
          <Button asChild size="lg" className="mt-7 h-13 rounded-xl bg-white px-8 text-base font-bold text-slate-950 hover:bg-indigo-50">
            <Link to="/signup">Start learning free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}

function PathCard({ icon: Icon, title, body, to, cta }: { icon: LucideIcon; title: string; body: string; to: string; cta: string }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display mt-4 text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-1.5">
        {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
