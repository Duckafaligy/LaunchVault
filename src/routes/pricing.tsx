import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Zap,
  CreditCard,
  ArrowRight,
  X,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { PricingCard } from "@/components/landing/PricingCard";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks, jsonLdScript, faqPageJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: buildSeoMeta({
      title: "Pricing — AI Learning Platform Plans to Learn AI | LaunchVault",
      description:
        "Learn AI free, or go further from $5/mo. LaunchVault's AI learning platform unlocks prompts, courses, AI agents and business plays across 50 AI domains. Cancel anytime — one click, no questions.",
      path: "/pricing",
    }),
    links: buildSeoLinks("/pricing"),
    // FAQPage schema — LLMs (Claude/ChatGPT/Perplexity) cite these answers directly
    // when users ask billing questions about LaunchVault.
    scripts: [
      jsonLdScript(faqPageJsonLd(PRICING_FAQS.map((f) => ({ question: f.q, answer: f.a })))),
    ],
  }),
  component: PricingPage,
});

// ---- Comparison table data ----
type Row = { label: string; free: string | boolean; tier1: string | boolean; tier2: string | boolean; tier3: string | boolean };
const COMPARISON: { group: string; rows: Row[] }[] = [
  {
    group: "Content access",
    rows: [
      { label: "Daily insights",         free: true,            tier1: true,        tier2: true,        tier3: true },
      { label: "Prompt library",         free: "Preview",       tier1: "Full",      tier2: "Full",      tier3: "Full" },
      { label: "Workflows",              free: "Preview",       tier1: "Full",      tier2: "Full",      tier3: "Full" },
      { label: "Tool guides",            free: false,           tier1: true,        tier2: true,        tier3: true },
      { label: "Cheatsheets",            free: "Preview",       tier1: true,        tier2: true,        tier3: true },
      { label: "Micro-courses",          free: "Preview",       tier1: "Beginner+", tier2: "Full",      tier3: "Full" },
      { label: "Agent blueprints",       free: false,           tier1: false,       tier2: true,        tier3: "Advanced" },
      { label: "Business lessons",       free: false,           tier1: false,       tier2: true,        tier3: "Advanced" },
      { label: "Playbooks & challenges", free: false,           tier1: false,       tier2: true,        tier3: true },
      { label: "Premium AI categories",  free: false,           tier1: false,       tier2: false,       tier3: true },
      { label: "Full archive access",    free: false,           tier1: false,       tier2: false,       tier3: true },
    ],
  },
  {
    group: "Experience",
    rows: [
      { label: "Personalized feed",      free: "Basic",         tier1: true,        tier2: "Advanced",  tier3: "Priority" },
      { label: "Q/A-gated learning",     free: true,            tier1: true,        tier2: true,        tier3: true },
      { label: "Save items",             free: "Limited",       tier1: "Unlimited", tier2: "Unlimited", tier3: "Unlimited" },
      { label: "XP & streaks",           free: true,            tier1: true,        tier2: true,        tier3: true },
      { label: "Early access to drops",  free: false,           tier1: false,       tier2: false,       tier3: true },
    ],
  },
  {
    group: "Support & extras",
    rows: [
      { label: "Email support",          free: "Community",     tier1: "Standard",  tier2: "Standard",  tier3: "Priority" },
      { label: "Cancel anytime",         free: true,            tier1: true,        tier2: true,        tier3: true },
    ],
  },
];

// ---- Pricing-specific FAQ ----
const PRICING_FAQS = [
  {
    q: "How does billing work?",
    a: "Subscriptions are monthly and renew automatically through Stripe. You can cancel anytime from the in-app billing portal — your tier stays active through the end of the current billing period, then quietly downgrades to Free.",
  },
  {
    q: "Do you offer refunds?",
    a: "No. All subscription charges are final and non-refundable. The library is large and instantly accessible, so we don't run a try-it-then-keep-the-content loophole. Instead we keep prices fair, never raise rates quietly, and let you cancel any time in one click.",
  },
  {
    q: "Can I switch plans?",
    a: "Anytime. Upgrades pro-rate instantly — you only pay the difference for the remainder of the cycle. Downgrades take effect at your next renewal so you keep what you paid for.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards, Apple Pay, Google Pay, and Link — handled directly by Stripe. We never see or store your card details.",
  },
  {
    q: "Is the content really new every 2 hours?",
    a: "Yes. A scheduled cron triggers our autonomous content engine every two hours. Each run generates roughly 12 quality-validated items and pushes them live. No filler, no recycled content.",
  },
  {
    q: "What happens to my content if I cancel?",
    a: "Paid content goes back behind the paywall on the day you downgrade — though you keep a read-only history of everything you've completed, plus your XP and streaks. Re-subscribe any time to pick up exactly where you left off.",
  },
  {
    q: "Do you do team or enterprise plans?",
    a: "Pro is our most complete individual plan. For larger rollouts, agencies, or training programs — email us and we'll build a custom quote.",
  },
];

function PricingPage() {
  const p = brand.pricing;
  return (
    <PublicLayout>
      {/* ===== HERO ===== */}
      <section className="relative isolate overflow-hidden border-b border-border bg-slate-950 text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-16 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> Simple, transparent pricing
          </span>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-[-0.02em] md:text-[4.25rem]">
            Pick the plan that
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              matches how you ship.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Subscriptions unlock the vault while active. Higher tiers automatically include everything below. No tricks, no surprise renewals.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> No lock-in</span>
            <span className="inline-flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-indigo-300" /> Cancel anytime</span>
            <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-400" /> Embedded Stripe checkout</span>
            <span className="inline-flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-fuchsia-300" /> No card on Free</span>
          </div>
        </div>
      </section>

      {/* ===== TIER CARDS ===== */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <PricingCard tierKey="free"  name={p.free.name}  price={p.free.priceLabel}  period={p.free.period}  tagline={p.free.tagline}  features={p.free.features}  ctaLabel={p.free.cta.label}  ctaTo={p.free.cta.to} />
          <PricingCard tierKey="tier1" name={p.tier1.name} price={p.tier1.priceLabel} period={p.tier1.period} tagline={p.tier1.tagline} features={p.tier1.features} ctaLabel={p.tier1.cta.label} ctaTo={p.tier1.cta.to} />
          <PricingCard tierKey="tier2" name={p.tier2.name} price={p.tier2.priceLabel} originalPrice={p.tier2.originalPriceLabel} discountPercent={p.tier2.discountPercent} period={p.tier2.period} tagline={p.tier2.tagline} features={p.tier2.features} ctaLabel={p.tier2.cta.label} ctaTo={p.tier2.cta.to} highlighted />
          <PricingCard tierKey="tier3" name={p.tier3.name} price={p.tier3.priceLabel} originalPrice={p.tier3.originalPriceLabel} discountPercent={p.tier3.discountPercent} period={p.tier3.period} tagline={p.tier3.tagline} features={p.tier3.features} ctaLabel={p.tier3.cta.label} ctaTo={p.tier3.cta.to} />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
          Prices in USD. Higher tiers automatically include lower-tier content. Subscriptions renew monthly — cancel anytime from the billing portal.
        </p>
      </section>

      {/* ===== WHY US (vs raw chatbot / free blogs) ===== */}
      <WhyChooseSection />

      {/* ===== VALUE STRIP ===== */}
      <section className="border-y border-border bg-gradient-surface">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 md:grid-cols-4">
            <ValueStrip icon={RefreshCw}  title="Always growing" body="Library refreshes every 2 hours. Your subscription buys access to a living product, not a static archive." />
            <ValueStrip icon={ShieldCheck} title="No lock-in"     body="Cancel from the dashboard in 2 clicks. Tier downgrades cleanly to Free at the end of the cycle." />
            <ValueStrip icon={Zap}        title="One click upgrade" body="Embedded Stripe checkout opens in a modal — no redirects, no surprises, no 'where am I' moments." />
            <ValueStrip icon={CreditCard} title="Start free, no card" body="The Free tier needs no payment method. Add a card only when you decide to upgrade — and remove it any time." />
          </div>
        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Side-by-side</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">Compare every plan</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Every feature, laid bare. We'd rather lose a sale than mislead you.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Feature</th>
                  <ColHead label="Free"    sub={p.free.priceLabel} />
                  <ColHead label="Starter" sub={p.tier1.priceLabel} />
                  <ColHead label="Creator" sub={p.tier2.priceLabel} popular />
                  <ColHead label="Pro"     sub={p.tier3.priceLabel} />
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((group) => (
                  <Fragment key={group.group}>
                    <tr className="border-t border-border bg-gradient-to-r from-indigo-500/[0.04] to-fuchsia-500/[0.04]">
                      <td colSpan={5} className="px-5 py-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/70">
                        {group.group}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.label} className="border-t border-border/60 transition-colors hover:bg-muted/25">
                        <td className="px-5 py-3.5 text-[13.5px] font-medium text-foreground">{row.label}</td>
                        <Cell v={row.free} />
                        <Cell v={row.tier1} />
                        <Cell v={row.tier2} highlighted />
                        <Cell v={row.tier3} />
                      </tr>
                    ))}
                  </Fragment>
                ))}
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pick a plan</td>
                  <CtaCell tierKey="free"  to={p.free.cta.to}  label="Start free" />
                  <CtaCell tierKey="tier1" to={p.tier1.cta.to} label="Choose Starter" />
                  <CtaCell tierKey="tier2" to={p.tier2.cta.to} label="Choose Creator" highlighted />
                  <CtaCell tierKey="tier3" to={p.tier3.cta.to} label="Choose Pro" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== TRANSPARENCY / NO LOCK-IN ===== */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-400/40 bg-gradient-to-br from-indigo-50 via-card to-card p-8 shadow-soft md:p-12 dark:from-indigo-950/30">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
          <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-center">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white shadow-glow">
              <ShieldCheck className="h-9 w-9" />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">No lock-in policy</p>
              <h3 className="font-display mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">No refunds. Just no friction either.</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                All charges are final — but cancellation is one click from your{" "}
                <Link to="/dashboard/account" className="font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
                  account page
                </Link>
                . No phone calls, no retention loop, no surprise renewals. Your tier stays active through the cycle you paid for, then quietly downgrades to Free. Try the Free tier first — it's substantial and never expires.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF ===== */}
      <section className="border-t border-border bg-gradient-surface">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Live stats — pulled live from /api/public/stats */}
            <LiveSocialStat metricKey="content_total" label="Items in library" icon={Sparkles} accent="text-indigo-500" />
            <LiveSocialStat metricKey="new_in_7d" label="Published this week" icon={Star} accent="text-amber-500" />
            <SocialStat metric="2 hours" label="Between content drops" icon={RefreshCw} accent="text-emerald-500" />
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm italic text-muted-foreground">
            Every number above is queried live from our database and updates in real time. Start on Free — it
            never expires — and upgrade whenever you&apos;re ready.
          </p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">FAQ</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">Billing &amp; access questions</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Everything else is on the{" "}
            <Link to="/features" className="font-semibold text-primary hover:underline">features</Link>
            {" "}and{" "}
            <Link to="/how-it-works" className="font-semibold text-primary hover:underline">how-it-works</Link>
            {" "}pages.
          </p>
        </div>
        <div className="mt-10 rounded-3xl border border-border bg-card p-2 shadow-soft md:p-3">
          <Accordion type="single" collapsible>
            {PRICING_FAQS.map((item, i) => (
              <AccordionItem key={i} value={`pricing-${i}`} className="border-border last:border-b-0">
                <AccordionTrigger className="px-3 py-4 text-left text-base font-bold hover:no-underline md:px-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-5 text-[15px] leading-relaxed text-muted-foreground md:px-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Still got questions? Email{" "}
          <a href={`mailto:${brand.supportEmail}`} className="font-semibold text-primary hover:underline">
            {brand.supportEmail}
          </a>
        </p>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-20 text-center md:py-24">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-[120px]" />
            <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-[120px]" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200 ring-1 ring-white/15">
            <Sparkles className="h-3 w-3" /> No credit card on Free
          </span>
          <h2 className="font-display mt-6 text-4xl font-bold tracking-tight text-white md:text-5xl">
            The vault is open.
            <span className="block">Walk in for free.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Start free. Upgrade when you're ready. Cancel any time.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 rounded-xl bg-white px-10 font-bold text-slate-950 hover:bg-indigo-50">
              <Link to="/signup">Start Free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-xl border-white/15 bg-white/5 px-10 font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white">
              <Link to="/features">See features</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

// ===== sub-components =====

function ValueStrip({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-soft">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function ColHead({ label, sub, popular }: { label: string; sub: string; popular?: boolean }) {
  return (
    <th className={`px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider ${popular ? "bg-gradient-to-b from-primary/10 to-transparent text-primary" : "text-muted-foreground"}`}>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[13px] font-bold normal-case tracking-tight text-foreground">{label}</span>
        <span className="text-[11px] font-semibold text-muted-foreground">{sub}</span>
        {popular && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
            Most popular
          </span>
        )}
      </div>
    </th>
  );
}

function Cell({ v, highlighted }: { v: string | boolean; highlighted?: boolean }) {
  const cls = `px-4 py-3.5 text-center text-[13px] ${highlighted ? "bg-primary/[0.04]" : ""}`;
  if (v === true) {
    return (
      <td className={cls}>
        <Check className="mx-auto h-4 w-4 text-emerald-500" aria-label="Included" />
      </td>
    );
  }
  if (v === false) {
    return (
      <td className={cls}>
        <X className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="Not included" />
      </td>
    );
  }
  return (
    <td className={cls}>
      <span className="text-foreground/85">{v}</span>
    </td>
  );
}

function CtaCell({ tierKey, to, label, highlighted }: { tierKey: string; to: string; label: string; highlighted?: boolean }) {
  return (
    <td className={`px-3 py-4 text-center ${highlighted ? "bg-primary/[0.06]" : ""}`}>
      <Link
        to={to as any}
        search={tierKey === "free" ? undefined : ({ upgrade: tierKey } as any)}
        className={`inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-[12px] font-bold transition-colors ${
          highlighted
            ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
            : "border border-border bg-background text-foreground hover:bg-muted"
        }`}
      >
        {label}
      </Link>
    </td>
  );
}

function SocialStat({ metric, label, icon: Icon, accent }: { metric: string; label: string; icon: LucideIcon; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
      <Icon className={`mx-auto h-6 w-6 ${accent}`} />
      <p className="font-display mt-3 text-3xl font-bold tracking-tight">{metric}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Live version of SocialStat — fetches /api/public/stats once and renders
 * the requested metric. Loading state shows "…" to avoid the 0 flash.
 */
function LiveSocialStat({
  metricKey, label, icon: Icon, accent,
}: { metricKey: "content_total" | "new_in_24h" | "new_in_7d" | "glossary_total" | "essay_total" | "domains_total"; label: string; icon: LucideIcon; accent: string }) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setStats(j))
      .catch(() => {});
  }, []);
  const value = stats?.[metricKey];
  const display = typeof value === "number" ? value.toLocaleString() : "…";
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
      <Icon className={`mx-auto h-6 w-6 ${accent}`} />
      <p className="font-display mt-3 text-3xl font-bold tabular-nums tracking-tight">{display}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// Tiny inline fragment helper (avoids importing React just for Fragment in JSX).
function Fragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
