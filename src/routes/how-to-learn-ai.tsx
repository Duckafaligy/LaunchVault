// =====================================================================
// /how-to-learn-ai — SEO cornerstone guide page.
// Targets: "how to learn AI", "how to learn to use AI", "learn AI step by step".
// Genuine step-by-step guide + HowTo schema + FAQ schema + internal links.
// =====================================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, type LucideIcon, MessageSquareCode, BookOpen, Workflow, Bot, Repeat } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { Button } from "@/components/ui/button";
import {
  buildSeoMeta, buildSeoLinks, jsonLdScript, howToJsonLd, faqPageJsonLd, breadcrumbJsonLd,
} from "@/lib/seo";

const STEPS: Array<{ icon: LucideIcon; name: string; text: string; to: string; linkLabel: string }> = [
  {
    icon: MessageSquareCode,
    name: "Learn to prompt",
    text: "Prompting is how you talk to models like ChatGPT and Claude — and it's the single highest-leverage AI skill. Start by copying proven prompts, then change one variable at a time and watch the output shift. You'll learn faster from 20 real prompts than from 20 hours of theory.",
    to: "/library",
    linkLabel: "Copy proven AI prompts",
  },
  {
    icon: BookOpen,
    name: "Learn the vocabulary",
    text: "Tokens, context window, temperature, RAG, fine-tuning, agents — the jargon is most of what makes AI feel hard. Spend an hour with a plain-English glossary and the rest of the field suddenly reads clearly.",
    to: "/glossary",
    linkLabel: "Open the AI glossary",
  },
  {
    icon: Workflow,
    name: "Automate one real task",
    text: "Pick something you do every week — drafting replies, summarizing docs, sorting leads — and automate it with AI. Following a step-by-step workflow once teaches you more than any course, because the lesson sticks to a real outcome.",
    to: "/library",
    linkLabel: "Follow a workflow",
  },
  {
    icon: Bot,
    name: "Build an AI agent",
    text: "Once you can prompt and automate, build an agent: a system with a goal, tools, memory and guardrails. Agent blueprints show you the full anatomy so you learn to build, not just chat.",
    to: "/library",
    linkLabel: "Study agent blueprints",
  },
  {
    icon: Repeat,
    name: "Apply it and practice daily",
    text: "AI moves fast, so fluency comes from a steady drip, not a one-time binge. Read one daily insight, try one new prompt, ship one small automation. LaunchVault publishes fresh material every two hours so there's always a next rep.",
    to: "/signup",
    linkLabel: "Get a daily AI feed (free)",
  },
];

const FAQS = [
  {
    question: "Where should a complete beginner start with AI?",
    answer:
      "Start with prompting. You don't need to code or understand the math — you just need to learn how to give a model clear instructions. Copy a proven prompt, run it, then tweak it. From there, learn the core vocabulary and automate one real task you already do.",
  },
  {
    question: "Is it too late to learn AI?",
    answer:
      "No. The tools are barely a few years old and they reset the playing field every few months, so today's beginner can catch up to last year's expert quickly. What matters is consistent, applied practice — which is exactly what a daily AI learning habit gives you.",
  },
  {
    question: "Should I learn prompting or coding first?",
    answer:
      "Prompting first. The vast majority of valuable AI work — writing, research, automation, marketing, agents built on no-code tools — needs no programming. Learn to prompt and automate first; pick up code later only if your goals require it.",
  },
  {
    question: "How do I learn to use AI for my job or business?",
    answer:
      "Map your repetitive tasks, then learn the AI play for each one: prompts for the writing, workflows for the process, agents for the parts that should run on their own. LaunchVault's business lessons and playbooks are organized exactly this way — by outcome.",
  },
];

export const Route = createFileRoute("/how-to-learn-ai")({
  head: () => ({
    meta: buildSeoMeta({
      title: "How to Learn AI in 2026 — Step-by-Step Guide | LaunchVault",
      description:
        "How to learn AI, step by step: start with prompting, learn the vocabulary, automate a real task, build an AI agent, and practice daily. A practical guide to learning to use AI — no coding required.",
      path: "/how-to-learn-ai",
    }),
    links: buildSeoLinks("/how-to-learn-ai"),
    scripts: [
      jsonLdScript(howToJsonLd({
        name: "How to Learn AI in 2026",
        description: "A practical, step-by-step guide to learning how to use AI — from prompting to building agents.",
        steps: STEPS.map((s) => ({ name: s.name, text: s.text })),
      })),
      jsonLdScript(faqPageJsonLd(FAQS)),
      jsonLdScript(breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "How to Learn AI", path: "/how-to-learn-ai" },
      ])),
    ],
  }),
  component: HowToLearnAiPage,
});

function HowToLearnAiPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 right-1/4 h-[460px] w-[460px] rounded-full bg-violet-600/25 blur-[140px]" />
          <div className="absolute -bottom-32 left-1/4 h-[420px] w-[420px] rounded-full bg-indigo-600/20 blur-[140px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center md:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200">
            <Sparkles className="h-3 w-3" /> Step-by-step guide
          </span>
          <h1 className="font-display mt-7 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.02em] sm:text-6xl">
            How to learn AI{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              in 2026.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            You don't learn AI by watching — you learn it by using it. Here's the exact path we recommend:
            five steps from your first prompt to building your own AI agents. No coding required to start.
          </p>
          <Button asChild size="lg" className="mt-9 h-13 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 text-base font-bold shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)]">
            <Link to="/signup">Start step 1 free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <ol className="space-y-8">
          {STEPS.map((s, i) => (
            <li key={s.name} className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-soft">
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && <div className="mt-2 w-px flex-1 bg-border" />}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-xl font-bold tracking-tight">{s.name}</h2>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.text}</p>
                <Link to={s.to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-1.5">
                  {s.linkLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">How to learn AI — FAQ</h2>
          <div className="mt-8 space-y-6">
            {FAQS.map((f) => (
              <div key={f.question}>
                <h3 className="text-[16px] font-bold text-foreground">{f.question}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <h3 className="font-display text-xl font-bold tracking-tight">Ready to start learning AI?</h3>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-muted-foreground">
              LaunchVault is the free AI learning platform that turns these five steps into a daily habit.
            </p>
            <Button asChild size="lg" className="mt-5 h-12 rounded-xl bg-gradient-primary px-8 text-base font-bold">
              <Link to="/signup">Create a free account <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
