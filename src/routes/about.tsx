import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ShieldCheck,
  Gauge,
  RefreshCw,
  Bot,
  Database,
  Lock,
  Check,
  ArrowRight,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { StatsSection } from "@/components/landing/StatsSection";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: buildSeoMeta({
      title: "About LaunchVault — How Our AI Learning Platform Works",
      description:
        "How LaunchVault works: fresh prompts, courses, and AI agent blueprints across 50 AI domains every two hours, each scored 0–100 against a strict quality bar so only the best reaches you. Start free and explore the full library.",
      path: "/about",
      type: "article",
    }),
    links: buildSeoLinks("/about"),
  }),
  component: AboutPage,
});

// How the engine actually works — every claim maps to real product behavior.
const STEPS: { icon: LucideIcon; title: string; body: string; accent: string }[] = [
  {
    icon: Bot,
    title: "An AI drafts",
    body: "Every two hours a Cloudflare Worker wakes up and asks our OpenAI integration for a fresh batch — roughly a dozen items across 10 content types and 50 AI domains.",
    accent: "from-indigo-500 to-violet-600",
  },
  {
    icon: Gauge,
    title: "A quality gate scores",
    body: "Each draft is validated against a strict schema and scored 0–100 on specificity, usefulness and structure. The bar is high on purpose.",
    accent: "from-violet-500 to-fuchsia-600",
  },
  {
    icon: ShieldCheck,
    title: "Only the best publish",
    body: "Anything under the threshold never reaches you. Borderline items sit in a review buffer instead of cluttering the feed. Most drafts don't make it — that's the point.",
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    icon: RefreshCw,
    title: "The vault grows",
    body: "What passes goes live instantly and your feed updates in real time. You start from the good stuff, not a blank prompt box — and there's always something new.",
    accent: "from-pink-500 to-rose-600",
  },
];

// What you can count on — confident, product-forward commitments.
const PROMISES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Gauge,
    title: "A quality bar, not a firehose",
    body: "Every item is scored 0–100 on specificity, usefulness, and structure before it can publish. The ones that don't clear the bar never reach your feed — you only ever see work that passed.",
  },
  {
    icon: RefreshCw,
    title: "Fresh every two hours",
    body: "A new batch lands across the 50 domains around the clock. The library you join today is bigger tomorrow, and bigger again the day after — without you lifting a finger.",
  },
  {
    icon: Database,
    title: "Real numbers, in real time",
    body: "The counts across this site are read straight from our production database and refresh by the minute. What you see is the live state of the library — current, never cached or padded.",
  },
  {
    icon: Lock,
    title: "Cancel in one click",
    body: "No phone calls, no retention maze. Your tier runs out the cycle you paid for, then downgrades cleanly to Free — and the Free tier itself never expires.",
  },
];

function AboutPage() {
  return (
    <PublicLayout>
      {/* ===== HERO ===== */}
      <section className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/3 h-96 w-96 rounded-full bg-indigo-600/30 blur-[140px]" />
          <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-fuchsia-600/25 blur-[140px]" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-24 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5" /> Inside LaunchVault
          </p>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-white md:text-[4.25rem]">
            A self-growing engine for{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              learning AI.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            {brand.brandName} turns the firehose of AI into a ranked, always-fresh library. New prompts, courses,
            and agent blueprints are drafted, scored against a strict quality bar, and published every two hours —
            so you start from the good stuff, not a blank prompt box. Here's exactly how it works.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 bg-white px-9 font-bold text-slate-950 hover:bg-indigo-50">
              <Link to="/signup">Start free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 border-white/15 bg-white/5 px-9 font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white">
              <Link to="/library">Browse the live library</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Why we built it</p>
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          The model was never the hard part.
        </h2>
        <p className="mx-auto mt-4 text-lg leading-relaxed text-muted-foreground">
          Anyone can open a chatbot and ask for a prompt. The hard part is knowing which answers are actually any
          good, keeping the useful ones organized, and showing up to practice every day. The AI is a commodity now.
          The judgment, the structure, and the discipline around it are not. That gap is the product.
        </p>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="border-y border-border bg-gradient-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">How it works</p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">Draft, score, gate, repeat</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              A self-running loop on a two-hour clock — always fresh, always filtered. A strict quality bar stands
              between you and the slop, so everything in the library stays worth your time.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated">
                <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.accent}`} />
                <div className="flex items-center justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-3xl font-bold text-muted-foreground/25">{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHAT YOU CAN COUNT ON ===== */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">What you can count on</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            The standards behind the vault
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Four things that stay true no matter how big the library gets.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PROMISES.map((p) => (
            <div key={p.title} className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-soft">
                <p.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold tracking-tight">
                  <Check className="h-4 w-4 text-emerald-500" /> {p.title}
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== LIVE PROOF — real numbers, not claims ===== */}
      <StatsSection />

      {/* ===== WHO'S BEHIND IT ===== */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-glow">
          <Layers className="h-6 w-6" />
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Who's behind it</p>
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">{brand.founder.name}</h2>
        <p className="mx-auto mt-4 text-lg leading-relaxed text-muted-foreground">{brand.founder.bio}</p>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground/80">
          We publish as a team, not a personality — what matters is the library and the bar every item clears, not a
          founder origin story. Questions, feedback, or found a bug?{" "}
          <a href={`mailto:${brand.supportEmail}`} className="font-semibold text-primary hover:underline">
            {brand.supportEmail}
          </a>
        </p>
      </section>

      {/* ===== CTA ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft md:p-14">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">See it for yourself</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            The Free tier needs no card and never expires. Open the vault, explore the full library, and see what's
            inside.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-primary font-bold"><Link to="/signup">Start Free</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/pricing">View Pricing</Link></Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
