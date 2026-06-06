import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageSquareCode,
  Search,
  Lock,
  Copy,
  Rocket,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingCard } from "@/components/landing/PricingCard";
import { FAQSection, HOMEPAGE_FAQS } from "@/components/landing/FAQSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { DomainGrid } from "@/components/landing/DomainGrid";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { AutoEngineSection } from "@/components/landing/AutoEngineSection";
import { WhyChooseSection } from "@/components/landing/WhyChooseSection";
import { LiveContentTypes } from "@/components/landing/LiveContentTypes";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { buildSeoMeta, buildSeoLinks, jsonLdScript, faqPageJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: buildSeoMeta({
      title: brand.seo.homeTitle,
      description: brand.seo.homeDescription,
      path: "/",
    }),
    links: buildSeoLinks("/"),
    // FAQPage schema mirrors the visible <FAQSection /> below — earns rich
    // results in Google and makes the homepage citable by AI answer engines.
    scripts: [
      jsonLdScript(faqPageJsonLd(HOMEPAGE_FAQS.map((f) => ({ question: f.q, answer: f.a })))),
    ],
  }),
  component: HomePage,
});

// MasteryType grid replaced by <LiveContentTypes /> with live counts.

function HomePage() {
  return (
    <PublicLayout>
      <HeroSection />

      <LiveContentTypes />

      <ProductPreview />

      <AutoEngineSection />

      <WhyChooseSection />

      <DomainGrid />

      {/* How it works — numbered, polished, connecting line */}
      <section className="relative border-y border-border bg-gradient-surface">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            eyebrow="How it works"
            title="A daily AI mastery loop"
            subtitle="Pick a goal, get a personalized feed, learn the why, apply the prompt, ship something real — and watch the vault grow underneath you."
          />
          <div className="relative mt-14">
            {/* Connecting line behind the steps (desktop only) */}
            <div aria-hidden className="pointer-events-none absolute left-[6%] right-[6%] top-7 hidden h-px bg-gradient-to-r from-indigo-500/0 via-indigo-500/30 to-fuchsia-500/0 md:block" />
            <div className="grid gap-6 md:grid-cols-5">
              <HowStep n="1" title="Choose your goals" body="Onboarding asks what you want to master: prompting, agents, business, automation, ML basics, content creation, or coding." gradient="from-indigo-500 to-violet-500" icon={Search} />
              <HowStep n="2" title="Get your daily feed" body="A fresh insight, prompt, workflow, agent blueprint, course, and business lesson — picked for your domains and level, every day." gradient="from-violet-500 to-fuchsia-500" icon={Sparkles} />
              <HowStep n="3" title="Learn with Q/A gates" body="Course quizzes lock the next lesson until you answer correctly. Practice tasks give you starter material and success criteria." gradient="from-fuchsia-500 to-pink-500" icon={Lock} />
              <HowStep n="4" title="Copy & apply" body="One-click copy any prompt, system instructions, or workflow. Bring it to your favourite AI tool. Ship better output today." gradient="from-pink-500 to-rose-500" icon={Copy} />
              <HowStep n="5" title="Return as it grows" body="Every 2 hours the autonomous engine adds ~12 new quality-scored items. Your dashboard refreshes in realtime — no work from you." gradient="from-rose-500 to-orange-500" icon={Rocket} />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading eyebrow="Pricing" title="Simple, fair pricing" subtitle="Subscribe to unlock the full vault. Higher tiers include everything below. Cancel anytime." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <PricingCard {...toPricingProps("free")} />
          <PricingCard {...toPricingProps("tier1")} />
          <PricingCard {...toPricingProps("tier2")} highlighted />
        </div>
        <div className="mt-6 text-center">
          <Button asChild variant="link"><Link to="/pricing">See full pricing & plan comparison →</Link></Button>
        </div>
      </section>

      {/* Proof is the product — live numbers instead of testimonials */}
      <section className="border-t border-border bg-gradient-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">The proof is the product</p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Numbers you can check, in real time.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            The full library is open to read on the Free tier, and every figure below is pulled live from our
            production database. Keep scrolling — what you see is the real, current state of the vault, growing
            every two hours.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-gradient-primary font-bold">
              <Link to="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold">
              <Link to="/library">Browse the live library</Link>
            </Button>
          </div>
        </div>
      </section>

      <StatsSection />

      <FAQSection />

      {/* Get in touch */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <ContactCard
            icon={MessageSquareCode}
            title="Email support"
            body="Questions, billing, or partnerships."
            cta={brand.supportEmail}
            href={`mailto:${brand.supportEmail}`}
            accent="from-indigo-500 to-violet-600"
          />
          <ContactCard
            icon={Sparkles}
            title="How it works"
            body="How the engine drafts, scores, and publishes a fresh batch across 50 AI domains every two hours."
            cta="Read our story →"
            href="/about"
            internal
            accent="from-fuchsia-500 to-pink-600"
          />
          <ContactCard
            icon={Rocket}
            title="Join the community"
            body="Daily AI drops, tips, and member wins."
            cta="Follow on Instagram →"
            href={brand.social.instagram}
            external
            accent="from-emerald-500 to-teal-500"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-20 text-center">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-600/30 blur-[120px]" />
            <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-fuchsia-600/25 blur-[120px]" />
          </div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200 ring-1 ring-white/10">
            <Sparkles className="h-3.5 w-3.5" /> Ready when you are
          </p>
          <h2 className="font-display mt-6 text-4xl font-bold tracking-tight text-white md:text-6xl">Ready to build faster?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Start free in 30 seconds. Upgrade whenever you&apos;re ready.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 rounded-xl bg-white px-10 font-bold text-slate-950 hover:bg-indigo-50">
              <Link to="/signup">Start Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-xl border-white/15 bg-white/5 px-10 font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function HowStep({
  n, title, body, gradient, icon: Icon,
}: { n: string; title: string; body: string; gradient: string; icon: LucideIcon }) {
  return (
    <div className="group relative flex flex-col items-center text-center">
      <div className="relative">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-glow ring-4 ring-background transition-transform group-hover:scale-105`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br ${gradient} text-[10px] font-extrabold text-white ring-2 ring-background`}>
          {n}
        </span>
      </div>
      <h3 className="mt-5 text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function toPricingProps(key: "free" | "tier1" | "tier2") {
  const p = brand.pricing[key];
  return {
    name: p.name,
    price: p.priceLabel,
    originalPrice: "originalPriceLabel" in p ? p.originalPriceLabel : undefined,
    discountPercent: "discountPercent" in p ? p.discountPercent : undefined,
    period: p.period,
    tagline: p.tagline,
    features: p.features,
    ctaLabel: p.cta.label,
    ctaTo: p.cta.to,
    tierKey: key,
  };
}

function ContactCard({
  icon: Icon, title, body, cta, href, accent, internal, external,
}: {
  icon: LucideIcon; title: string; body: string; cta: string; href: string; accent: string;
  internal?: boolean; external?: boolean;
}) {
  const inner = (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elevated">
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      <p className={`mt-4 text-sm font-semibold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>{cta}</p>
    </div>
  );
  if (internal) return <Link to={href}>{inner}</Link>;
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  return <a href={href}>{inner}</a>;
}
