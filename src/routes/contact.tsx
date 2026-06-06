import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageSquare, ShieldQuestion, Briefcase, Sparkles } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: buildSeoMeta({
      title: `Contact — ${brand.brandName}`,
      description: `Talk to the team at ${brand.brandName}. Support, billing, partnerships, privacy requests.`,
      path: "/contact",
    }),
    links: buildSeoLinks("/contact"),
  }),
  component: ContactPage,
});

const CHANNELS = [
  {
    icon: MessageSquare,
    title: "Support",
    blurb: "Account, billing, content questions, refunds — anything that needs a human.",
    cta: brand.supportEmail,
    accent: "from-indigo-500 to-violet-600",
  },
  {
    icon: Briefcase,
    title: "Partnerships",
    blurb: "Bulk seats, agencies, content collaborations, sponsorship.",
    cta: brand.supportEmail,
    accent: "from-emerald-500 to-teal-600",
  },
  {
    icon: ShieldQuestion,
    title: "Privacy & DPA",
    blurb: "GDPR / CCPA requests, DPA signing, sub-processor questions.",
    cta: brand.supportEmail,
    accent: "from-rose-500 to-fuchsia-600",
  },
  {
    icon: Sparkles,
    title: "Press / quotes",
    blurb: "Want a quote about the autonomous content engine? We'll respond fast.",
    cta: brand.supportEmail,
    accent: "from-amber-500 to-orange-500",
  },
];

function ContactPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-16 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Mail className="h-3 w-3" /> Get in touch
          </span>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-[-0.02em] md:text-[4rem]">
            Talk to us.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            One inbox, one team, real humans. We reply within one business day — usually within a few hours.
          </p>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-mono">
            <Mail className="h-4 w-4 text-indigo-300" />
            <a href={`mailto:${brand.supportEmail}`} className="font-bold text-white hover:underline">
              {brand.supportEmail}
            </a>
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">By topic</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">Pick the right channel</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            All routes go to the same address — the topic just helps us route your email to the right person faster.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {CHANNELS.map((c) => (
            <a
              key={c.title}
              href={`mailto:${c.cta}?subject=${encodeURIComponent("[" + c.title + "] ")}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} />
              <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-soft`}>
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display mt-4 text-xl font-bold tracking-tight">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.blurb}</p>
              <p className="mt-4 text-[12.5px] font-semibold text-primary">{c.cta} →</p>
            </a>
          ))}
        </div>
      </section>

      {/* SLA / response box */}
      <section className="border-t border-border bg-gradient-surface">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Response time</p>
              <p className="font-display mt-2 text-3xl font-bold">&lt; 24h</p>
              <p className="mt-1.5 text-sm text-muted-foreground">Monday – Friday, often much faster.</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Cancel any time</p>
              <p className="font-display mt-2 text-3xl font-bold">1 click</p>
              <p className="mt-1.5 text-sm text-muted-foreground">From the dashboard or Stripe portal. No phone calls. No retention loop.</p>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Privacy SLA</p>
              <p className="font-display mt-2 text-3xl font-bold">30 days</p>
              <p className="mt-1.5 text-sm text-muted-foreground">GDPR / CCPA data-subject requests fulfilled.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
