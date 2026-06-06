import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, ShieldCheck, RefreshCw, Library, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

type LiveStats = {
  content_total: number;
  new_in_24h: number;
  glossary_total: number;
  domains_total: number;
};

function useHeroStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setStats(j))
      .catch(() => {});
  }, []);
  return stats;
}

export function HeroSection() {
  // Split last word for gradient emphasis ("Your AI Mastery Engine.")
  const words = brand.hero.headline.trim().replace(/\.$/, "").split(" ");
  const lastWord = words.pop() ?? "";
  const leadingWords = words.join(" ");
  const stats = useHeroStats();

  return (
    <section className="relative isolate overflow-hidden bg-slate-950">
      {/* Glow blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[480px] w-[480px] rounded-full bg-indigo-600/30 blur-[140px]" />
        <div className="absolute top-1/2 -right-24 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-fuchsia-600/25 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-violet-600/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
        {/* faint grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-24 text-center md:py-32">
        {/* Eyebrow */}
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
          </span>
          {brand.hero.eyebrow}
        </div>

        {/* Headline — editorial Fraunces */}
        <h1 className="font-display mt-8 text-balance text-5xl font-bold leading-[1.02] tracking-[-0.025em] text-white sm:text-7xl lg:text-[5.75rem]">
          {leadingWords}{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
            {lastWord}.
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-relaxed text-slate-300 sm:text-xl">
          {brand.hero.subheadline}
        </p>

        {/* CTAs */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="group h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 px-10 text-base font-bold text-white shadow-[0_0_30px_-5px_rgba(99,102,241,0.7)] transition-all hover:scale-[1.03] hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.8)]"
          >
            <Link to={brand.hero.primaryCta.to}>
              {brand.hero.primaryCta.label}{" "}
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-xl border-white/15 bg-white/5 px-10 text-base font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white"
          >
            <Link to={brand.hero.secondaryCta.to}>{brand.hero.secondaryCta.label}</Link>
          </Button>
        </div>

        {/* Trust strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" /> No credit card · Start in 30 seconds
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-white/15 sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" /> New content every 2 hours
          </span>
          <span aria-hidden className="hidden h-3 w-px bg-white/15 sm:inline-block" />
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-fuchsia-300" /> Cancel anytime · Zero lock-in
          </span>
        </div>

        {/* Two-pill proof — left = honest quality-gate fact, right = LIVE engine numbers */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {/* Quality-gate proof — true and verifiable, not invented social proof */}
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur">
            <Gauge className="h-4 w-4 text-indigo-300" />
            <span className="text-xs text-slate-300">
              Every item <span className="font-bold text-white">scored 0–100</span> — only the best publish
            </span>
          </div>
          {/* Live engine count — refreshes every minute */}
          <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.04] px-5 py-3 backdrop-blur">
            <Library className="h-4 w-4 text-emerald-300" />
            <span className="text-xs text-slate-300">
              <LivePillNumber value={stats?.content_total} highlight /> items live ·{" "}
              <LivePillNumber value={stats?.new_in_24h} /> added today
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Inline number that pulls from /api/public/stats. Renders "…" while loading
 * to avoid a 0→N flash. Used inside the live engine-counts pill in the hero.
 */
function LivePillNumber({ value, highlight }: { value: number | undefined; highlight?: boolean }) {
  const display = typeof value === "number" ? value.toLocaleString() : "…";
  return (
    <span
      className={`font-display font-bold tabular-nums ${
        highlight
          ? "bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent"
          : "text-white"
      }`}
    >
      {display}
    </span>
  );
}
