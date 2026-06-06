import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, RefreshCw, Cpu, Layers, BookOpen, ShieldCheck, Zap,
  ArrowRight, Clock, CheckCircle2, Lightbulb, Target,
} from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: buildSeoMeta({
      title: "How to Learn AI with LaunchVault — How It Works",
      description: "How LaunchVault works as an AI learning platform: pick your goals, get a personalized feed, and learn AI through Q/A-gated courses, prompts and AI agents across 50 domains — with fresh content every 2 hours.",
      path: "/how-it-works",
    }),
    links: buildSeoLinks("/how-it-works"),
  }),
  component: HowItWorksPage,
});

const PROCESS = [
  {
    step: "01",
    title: "Choose your goals",
    body: "Onboarding asks what you want to master: prompting, automation, agents, AI business, content, coding, ML basics. Pick a persona (founder, creator, freelancer, marketer, dev) and a level (beginner → advanced). Takes 30 seconds.",
    accent: "from-indigo-500 to-violet-600",
  },
  {
    step: "02",
    title: "Get a personalised feed",
    body: "Your dashboard shows a daily AI feed — one fresh insight, prompt, workflow, agent blueprint, course, and business lesson per day, picked by your goals and progress. The feed updates as the autonomous engine drops new items.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    step: "03",
    title: "Learn with Q/A gates",
    body: "Open any course. Each lesson is broken into Read → Example → Practice → Check. Wrong quiz answer loses a heart. Three wrong and the lesson restarts. Correct unlocks the next lesson with a celebration.",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    step: "04",
    title: "Copy & apply",
    body: "One-click copy any prompt, system instruction, workflow step, or starter code. Bring it to your favourite AI tool. Use it in your business. The license is yours — commercial use included.",
    accent: "from-pink-500 to-rose-500",
  },
  {
    step: "05",
    title: "Return as it grows",
    body: "Every 2 hours an autonomous cron triggers OpenAI to generate ~12 new items across the 10 content types. Each is JSON-schema validated, quality-scored 0–100, and only published if it passes. The library never stops growing.",
    accent: "from-rose-500 to-orange-500",
  },
];

const STACK = [
  { name: "OpenAI", role: "Content generation (large language models)" },
  { name: "Cloudflare Workers", role: "Edge runtime + cron triggers" },
  { name: "Supabase", role: "Postgres + auth + realtime" },
  { name: "Stripe", role: "Subscriptions + checkout" },
  { name: "TanStack Start", role: "React framework + SSR" },
];

function HowItWorksPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-16 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <RefreshCw className="h-3 w-3" /> The system, end to end
          </span>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-[-0.02em] md:text-[4.5rem]">
            How
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              LaunchVault works.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            A self-growing AI mastery platform. Five steps for you, one autonomous engine running underneath. No marketing fluff — here&rsquo;s exactly what happens.
          </p>
        </div>
      </section>

      {/* The 5-step process */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">The daily loop</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">Five steps. One growing vault.</h2>
        </div>

        <ol className="mt-16 space-y-16">
          {PROCESS.map((p) => (
            <li key={p.step} className="relative">
              <div className="flex items-baseline gap-6">
                <span className={`font-display bg-gradient-to-br ${p.accent} bg-clip-text text-[4rem] font-bold leading-none tracking-tight text-transparent`}>
                  {p.step}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight md:text-[2rem]">
                    {p.title}
                  </h3>
                  <p className="mt-4 max-w-2xl text-[1.05rem] leading-[1.7] text-foreground/85">
                    {p.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Autonomous engine — visual */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/15 blur-[120px]" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-500/15 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                <Sparkles className="h-3 w-3" /> Under the hood
              </span>
              <h2 className="font-display mt-4 text-balance text-4xl font-bold leading-tight md:text-[3rem]">
                The autonomous engine, briefly.
              </h2>
              <p className="mt-5 text-[1.05rem] leading-[1.7] text-slate-300">
                Every 2 hours, a Cloudflare cron fires our content engine in-process. It works through the content types one batch at a time — each asks gpt-4o for items in one of the 10 content types, with a strict JSON schema and a written quality bar.
              </p>
              <p className="mt-4 text-[1.05rem] leading-[1.7] text-slate-300">
                Each generated item is normalized (we self-heal common deviations), validated against the schema, scored 0–100 on quality, and only published when it passes. Failed items are logged for review.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <Stat icon={Clock}      label="Run cadence"   value="2 hours" />
                <Stat icon={Layers}     label="Domains"       value="50"     />
                <Stat icon={Cpu}        label="Types"         value="10"     />
                <Stat icon={ShieldCheck} label="Quality gate"  value="0–100"  />
              </div>
            </div>

            {/* Right-side visual */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  <RefreshCw className="h-3 w-3" /> Every 2h
                </span>
                <p className="font-display mt-5 text-[5rem] font-bold leading-none">14</p>
                <p className="mt-1 text-sm text-slate-400">items generated · validated · scored</p>
              </div>

              <ul className="mt-8 space-y-2.5 text-[13.5px]">
                {[
                  { label: "5 AI prompts",       grad: "from-violet-500 to-fuchsia-500" },
                  { label: "1 micro-course",     grad: "from-indigo-500 to-cyan-400"    },
                  { label: "2 workflows",        grad: "from-sky-500 to-indigo-500"     },
                  { label: "1 agent blueprint",  grad: "from-fuchsia-500 to-pink-500"   },
                  { label: "2 business lessons", grad: "from-emerald-500 to-teal-500"   },
                  { label: "3 daily insights",   grad: "from-amber-500 to-orange-500"   },
                ].map((r) => (
                  <li key={r.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${r.grad}`} />
                    <span className="font-semibold text-slate-100">{r.label}</span>
                    <span className="ml-auto text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-500">auto</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">The stack</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">No mystery boxes.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Every piece is best-in-class and named openly. Your data flows through these services and nowhere else.
          </p>
        </div>
        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">What it does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[15px]">
              {STACK.map((s) => (
                <tr key={s.name}>
                  <td className="px-5 py-4 font-bold">{s.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{s.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          See our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and{" "}
          <Link to="/dpa" className="text-primary hover:underline">DPA</Link> for the full data-flow detail.
        </p>
      </section>

      {/* What you get per tier — micro pricing */}
      <section className="border-y border-border bg-gradient-surface">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">For users</p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">What unlocks at each tier</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <TierCard
              label="Free"
              price="$0"
              accent="from-zinc-400 to-zinc-600"
              icon={Lightbulb}
              items={["Daily AI insights", "Selected prompts", "Beginner lessons", "Save limited items"]}
            />
            <TierCard
              label="Starter"
              price={brand.pricing.tier1.priceLabel}
              accent="from-indigo-500 to-violet-600"
              icon={Sparkles}
              items={["Full prompt library", "All workflows", "Beginner + intermediate courses", "Save unlimited"]}
            />
            <TierCard
              label="Creator"
              price={brand.pricing.tier2.priceLabel}
              accent="from-violet-500 to-fuchsia-600"
              icon={Target}
              highlighted
              items={["Everything in Starter", "Full micro-courses", "Agent blueprints", "Business lessons"]}
            />
            <TierCard
              label="Pro"
              price={brand.pricing.tier3.priceLabel}
              accent="from-fuchsia-500 to-pink-600"
              icon={Zap}
              items={["Everything in Creator", "Advanced blueprints", "Premium categories", "Early-access drops"]}
            />
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            See full pricing on <Link to="/pricing" className="text-primary hover:underline">the pricing page</Link>.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-20 text-center md:py-24">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-[120px]" />
            <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-[120px]" />
          </div>
          <h2 className="font-display text-balance text-4xl font-bold leading-tight text-white md:text-5xl">
            Open the vault.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Start free in 30 seconds. Upgrade when you&rsquo;re ready. Cancel any time.</p>
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

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="font-display mt-1.5 text-2xl font-bold">{value}</p>
    </div>
  );
}

function TierCard({
  label, price, accent, items, highlighted, icon: Icon,
}: { label: string; price: string; accent: string; items: string[]; highlighted?: boolean; icon: any }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated ${
      highlighted ? "border-primary" : "border-border"
    }`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-soft`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-display mt-4 text-xl font-bold tracking-tight">{label}</h3>
      <p className="font-display mt-1 text-2xl font-bold">{price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
      <ul className="mt-4 space-y-2 text-[13.5px]">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-foreground/85">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
