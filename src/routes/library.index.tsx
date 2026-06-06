// =====================================================================
// /library — PUBLIC library index. Indexable browse page that lists
// every published item with its type, domain, tier, and short hook.
// Each card links to /library/$slug for the full SSR'd article.
// =====================================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, RefreshCw, ArrowRight, type LucideIcon } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { listPublicLibrary } from "@/utils/public-content.functions";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";
import { brand } from "@/config/brand";
import { domainLabel } from "@/config/domains";
import { DateStamp } from "@/components/DateStamp";

export const Route = createFileRoute("/library/")({
  loader: async () => {
    // Public library shows FREE items only. Paid items remain reachable via
    // direct /library/$slug URLs (+ sitemap) with the paywall, for SEO.
    const items = await listPublicLibrary({ data: { limit: 60, freeOnly: true } });
    return { items };
  },
  head: () => ({
    meta: buildSeoMeta({
      title: "AI Prompt Library & Courses — Learn AI Free | LaunchVault",
      description: "Browse LaunchVault's AI learning library — free AI insights, a 50-term AI glossary and founder essays, plus prompts, courses, workflows and AI agent blueprints across 10 content types and 50 AI domains, refreshed every 2 hours. Learn AI by example.",
      path: "/library",
    }),
    links: buildSeoLinks("/library"),
  }),
  component: LibraryIndexPage,
});

const TYPE_LABEL: Record<string, string> = {
  prompt: "Prompt",
  course: "Course",
  workflow: "Workflow",
  agent: "Agent",
  business_lesson: "Business",
  insight: "Insight",
  tool_guide: "Tool",
  playbook: "Playbook",
  challenge: "Challenge",
  cheatsheet: "Cheatsheet",
};

const TYPE_GRADIENT: Record<string, string> = {
  prompt: "from-violet-600 to-fuchsia-500",
  course: "from-indigo-600 to-cyan-500",
  workflow: "from-sky-500 to-indigo-600",
  agent: "from-fuchsia-600 to-pink-500",
  business_lesson: "from-emerald-600 to-teal-500",
  insight: "from-amber-500 to-orange-500",
  tool_guide: "from-zinc-700 to-slate-700",
  playbook: "from-rose-600 to-fuchsia-600",
  challenge: "from-red-600 to-orange-500",
  cheatsheet: "from-indigo-500 to-cyan-500",
};

function LibraryIndexPage() {
  const { items } = Route.useLoaderData();
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-16 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center text-white md:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> Public library
          </span>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-[-0.02em] md:text-[4rem]">
            Every article we've ever
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              published.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Browse {items.length}+ articles across 10 content types and 50 AI mastery domains. New work appears every two hours — quality-validated by the autonomous engine.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Auto-publishing every 2 hours
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it: any) => <LibraryCard key={it.id} item={it} />)}
          </div>
        )}
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-16 text-center md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-[120px]" />
            <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-fuchsia-600/25 blur-[120px]" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
            Read it all.
            <span className="block">Free tier never expires.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Start free in 30 seconds. Upgrade only when you're ready.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link to="/signup" className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-white px-8 text-sm font-bold text-slate-950 hover:bg-indigo-50">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pricing" className="inline-flex h-12 items-center rounded-xl border border-white/15 bg-white/5 px-8 text-sm font-bold text-white backdrop-blur hover:bg-white/10">
              See plans
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function LibraryCard({ item }: { item: any }) {
  const grad = TYPE_GRADIENT[item.type] ?? TYPE_GRADIENT.prompt;
  // Glossary + essays have their own dedicated public readers.
  const to =
    item.type === "glossary" ? "/glossary/$slug"
      : item.type === "essay" ? "/blog/$slug"
        : "/library/$slug";
  return (
    <Link
      to={to as any}
      params={{ slug: item.slug ?? item.id } as any}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${grad}`} />
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex rounded-full bg-gradient-to-r ${grad} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-soft`}>
          {TYPE_LABEL[item.type] ?? item.type}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {item.tier_required === "free" ? "Free" : item.tier_required}
        </span>
      </div>
      <h3 className="font-display mt-4 text-balance text-[1.25rem] font-bold leading-[1.2] tracking-[-0.005em] text-foreground">
        {item.title}
      </h3>
      {(item.short_description || item.description) && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {item.short_description ?? item.description}
        </p>
      )}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
        <span>{item.domain ? domainLabel(item.domain) : "General"}</span>
        <span className="inline-flex items-center gap-1.5">
          {item.created_at && <DateStamp iso={item.created_at} withTime />}
          {item.estimated_minutes && <span>· {item.estimated_minutes} min</span>}
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
      <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground/60" />
      <h2 className="font-display mt-4 text-2xl font-bold">The engine is warming up</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        The autonomous engine generates new articles every 2 hours. The first batch will land here within the cycle.
      </p>
      <Link to="/" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
        Back to home <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

const _ = null as unknown as LucideIcon;
void _;
