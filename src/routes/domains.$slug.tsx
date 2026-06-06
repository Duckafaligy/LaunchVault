// =====================================================================
// /domains/$slug — PUBLIC domain landing page.
// One URL per AI mastery domain. Lists all published items in that
// domain and acts as a long-tail SEO entry point.
// =====================================================================

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { listPublicLibrary } from "@/utils/public-content.functions";
import { DOMAINS, DOMAIN_BY_SLUG, type DomainSlug } from "@/config/domains";
import { buildSeoMeta, buildSeoLinks } from "@/lib/seo";
import { brand } from "@/config/brand";
import { DateStamp } from "@/components/DateStamp";

export const Route = createFileRoute("/domains/$slug")({
  loader: async ({ params }) => {
    const domain = DOMAIN_BY_SLUG[params.slug as DomainSlug];
    if (!domain) throw notFound();
    const items = await listPublicLibrary({ data: { domain: params.slug, limit: 60 } });
    return { domain, items };
  },
  head: ({ loaderData }) => {
    const d = loaderData?.domain;
    if (!d) {
      return { meta: buildSeoMeta({ title: "Domain not found", description: "This domain does not exist.", path: "/domains" }) };
    }
    return {
      meta: buildSeoMeta({
        title: `${d.label} — ${brand.brandName}`,
        description: `${d.description} — explore prompts, courses, workflows, agents and business plays in the ${d.label} domain.`,
        path: `/domains/${d.slug}`,
      }),
      links: buildSeoLinks(`/domains/${d.slug}`),
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight">Domain not found</h1>
        <p className="mt-4 text-muted-foreground">Pick one from the list of 50 mastery domains.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          Back home <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PublicLayout>
  ),
  component: DomainLandingPage,
});

const TYPE_LABEL: Record<string, string> = {
  prompt: "Prompt", course: "Course", workflow: "Workflow", agent: "Agent",
  business_lesson: "Business", insight: "Insight", tool_guide: "Tool",
  playbook: "Playbook", challenge: "Challenge", cheatsheet: "Cheatsheet",
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

function DomainLandingPage() {
  const { domain, items } = Route.useLoaderData();

  // Group by type
  const groups = items.reduce<Record<string, any[]>>((acc, it: any) => {
    (acc[it.type] ??= []).push(it);
    return acc;
  }, {});

  // Sibling domains in the same group (for cross-linking SEO)
  const siblings = DOMAINS.filter((d) => d.group === domain.group && d.slug !== domain.slug).slice(0, 4);

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-16 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-white md:py-24">
          <Link to="/library" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300 hover:text-white">
            <ArrowLeft className="h-3 w-3" /> All articles
          </Link>
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-200">
            <Sparkles className="h-3 w-3" /> Mastery domain
          </span>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-[-0.02em] md:text-[4.25rem]">
            {domain.label}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            {domain.description}
          </p>
          <p className="mt-5 text-sm text-slate-400">
            {items.length} {items.length === 1 ? "article" : "articles"} published · Refreshed every 2 hours
          </p>
        </div>
      </section>

      {/* Items grouped by type */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        {items.length === 0 ? (
          <EmptyState domain={domain.label} />
        ) : (
          <div className="space-y-14">
            {Object.entries(groups).map(([type, list]) => (
              <div key={type}>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {TYPE_LABEL[type] ?? type} · {list.length}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((it: any) => (
                    <Link
                      key={it.id}
                      to="/library/$slug"
                      params={{ slug: it.slug ?? it.id }}
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
                    >
                      <div aria-hidden className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${TYPE_GRADIENT[type] ?? "from-indigo-500 to-fuchsia-500"}`} />
                      <h3 className="font-display text-[1.15rem] font-bold leading-snug tracking-tight">
                        {it.title}
                      </h3>
                      {(it.short_description || it.description) && (
                        <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground">
                          {it.short_description ?? it.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{it.tier_required === "free" ? "Free" : it.tier_required}</span>
                        <span className="inline-flex items-center gap-1.5">
                          {it.created_at && <DateStamp iso={it.created_at} withTime />}
                          {it.estimated_minutes && <span>· {it.estimated_minutes} min</span>}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related domains */}
      {siblings.length > 0 && (
        <section className="border-y border-border bg-gradient-surface">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary">Adjacent domains</p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">Keep exploring</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.map((s) => (
                <Link
                  key={s.slug}
                  to="/domains/$slug"
                  params={{ slug: s.slug }}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
                >
                  <p className="font-display text-[1.05rem] font-bold leading-snug tracking-tight">{s.label}</p>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] text-muted-foreground">{s.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-16 text-center md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-indigo-600/30 blur-[120px]" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Master {domain.label}.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Start free, unlock the full library, get new articles in this domain every 2 hours.</p>
          <Link
            to="/signup"
            className="mt-6 inline-flex h-12 items-center gap-1.5 rounded-xl bg-white px-8 text-sm font-bold text-slate-950 hover:bg-indigo-50"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

function EmptyState({ domain }: { domain: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
      <h2 className="font-display text-2xl font-bold">No published articles yet</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        The autonomous engine hasn't shipped anything tagged <strong className="text-foreground">{domain}</strong> yet. Check back within a 2-hour cycle.
      </p>
      <Link to="/library" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
        Browse other articles <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

const _ = null as unknown as LucideIcon;
void _;
