// =====================================================================
// /library/$slug — PUBLIC, SSR'd, indexable by Google.
//
// The HTML response always contains the FULL article body so search
// engines can crawl + index everything. A client-side <PaywallGate>
// component overlays a "Get full access" UI for non-subscribers.
//
// Article schema is emitted with isAccessibleForFree:false and a
// `hasPart` selector pointing at the gated portion — this is the
// pattern Google explicitly endorses for paywalled content.
// =====================================================================

import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Lock, ArrowLeft, Sparkles, Clock, Tag, type LucideIcon, ArrowRight, Star, CalendarDays, Copy, Check } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { Button } from "@/components/ui/button";
import { getPublicContentBySlug } from "@/utils/public-content.functions";
import { buildSeoMeta, buildSeoLinks, jsonLdScript } from "@/lib/seo";
import { brand } from "@/config/brand";
import { DateStamp } from "@/components/DateStamp";
import { domainLabel } from "@/config/domains";
import {
  WorkflowView, AgentView, BusinessView, InsightView, ToolView,
  PlaybookView, ChallengeView, CheatsheetView, ArticleBody,
} from "@/components/content-views/NewTypeViews";
import { CoursePlayer } from "@/components/content-views/CoursePlayer";
import { MeteredReveal } from "@/components/content-views/MeteredReveal";
import { useAuth } from "@/hooks/use-auth";
import { track } from "@/lib/analytics";

const SITE_URL = "https://launchvault.ca";

export const Route = createFileRoute("/library/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicContentBySlug({ data: { slug: params.slug } });
    if (!data) throw notFound();
    // Glossary + essays have dedicated canonical routes. If one is reached here
    // (direct URL, stale link), redirect to its real viewer — otherwise this
    // route would render it blank, and we'd create duplicate URLs for Google.
    if (data.item?.type === "glossary" && data.item.slug) {
      throw redirect({ to: "/glossary/$slug", params: { slug: data.item.slug } });
    }
    if (data.item?.type === "essay" && data.item.slug) {
      throw redirect({ to: "/blog/$slug", params: { slug: data.item.slug } });
    }
    return data;
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight">Article not found</h1>
        <p className="mt-4 text-muted-foreground">It may have been unpublished or moved.</p>
        <Button asChild className="mt-6"><Link to="/library">Back to library</Link></Button>
      </div>
    </PublicLayout>
  ),
  head: ({ loaderData }) => {
    const item = loaderData?.item;
    if (!item) {
      return {
        meta: buildSeoMeta({ title: "Article not found", description: "This article is not available.", path: "/library" }),
      };
    }

    const path = `/library/${item.slug}`;
    const description = item.short_description || item.description || `Read "${item.title}" — published on ${brand.brandName}.`;
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      description,
      url: `${SITE_URL}${path}`,
      datePublished: item.created_at,
      dateModified: item.updated_at ?? item.created_at,
      author: { "@type": "Organization", name: brand.brandName },
      publisher: {
        "@type": "Organization",
        name: brand.brandName,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
      },
      // ✓ Google-endorsed paywall markup
      isAccessibleForFree: item.tier_required === "free",
      hasPart: item.tier_required !== "free" ? {
        "@type": "WebPageElement",
        isAccessibleForFree: false,
        cssSelector: ".paywalled-content",
      } : undefined,
      keywords: Array.isArray(item.tags) ? item.tags.join(", ") : undefined,
      articleSection: domainLabel(item.domain ?? "") || item.category,
      timeRequired: item.estimated_minutes ? `PT${item.estimated_minutes}M` : undefined,
    };

    return {
      meta: buildSeoMeta({
        title: `${item.title} — ${brand.brandName}`,
        description,
        path,
        type: "article",
      }),
      links: buildSeoLinks(path),
      scripts: [jsonLdScript(articleSchema)],
    };
  },
  component: LibraryArticlePage,
});

const TYPE_THEME: Record<string, { grad: string; label: string }> = {
  prompt:          { grad: "from-violet-600 via-fuchsia-500 to-pink-500",  label: "Prompt Lab" },
  course:          { grad: "from-indigo-600 via-blue-500 to-cyan-400",     label: "Mini Course" },
  workflow:        { grad: "from-sky-500 via-blue-500 to-indigo-600",      label: "Workflow" },
  agent:           { grad: "from-fuchsia-600 via-pink-500 to-rose-500",    label: "Agent Blueprint" },
  business_lesson: { grad: "from-emerald-600 via-teal-500 to-cyan-500",    label: "Business Lesson" },
  insight:         { grad: "from-amber-500 via-orange-500 to-red-500",     label: "Daily Insight" },
  tool_guide:      { grad: "from-zinc-700 via-slate-700 to-zinc-900",      label: "Tool Guide" },
  playbook:        { grad: "from-rose-600 via-pink-500 to-fuchsia-600",    label: "Playbook" },
  challenge:       { grad: "from-red-600 via-orange-500 to-yellow-500",    label: "Challenge" },
  cheatsheet:      { grad: "from-indigo-500 via-blue-500 to-cyan-500",     label: "Cheatsheet" },
};

function LibraryArticlePage() {
  const { item, payload } = Route.useLoaderData();
  const theme = TYPE_THEME[item.type] ?? TYPE_THEME.prompt;
  const isFree = item.tier_required === "free";
  const { user } = useAuth();

  // Client-side subscription check — fades the paywall in for non-subscribers.
  // Subscribers see no overlay. (Tier check happens via the dashboard hook;
  // for the public route we keep it simple — logged-in = no paywall on free,
  // and we soft-prompt upgrade for paid tiers.)
  const [isSubscriber, setIsSubscriber] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) { setIsSubscriber(false); return; }
    // Auth'd user — treat as soft-subscriber for the visual paywall. The hard
    // gating still happens on /dashboard/content/$id via getContentPayload.
    setIsSubscriber(true);
  }, [user]);

  // Track article view exactly once per mount — fires for anonymous + logged-in.
  useEffect(() => {
    if (item?.slug) {
      void track.libraryArticleViewed({ slug: item.slug, type: item.type });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const shouldGate = !isFree && isSubscriber === false;

  // payload could be null if no payloads row was inserted
  const safePayload = payload ?? {};

  // Courses get a wider shell so the lesson player isn't cramped.
  const shellWidth = item.type === "course" ? "max-w-5xl" : "max-w-[680px]";

  return (
    <PublicLayout>
      <article className={`relative mx-auto ${shellWidth} px-4 pt-10 pb-20`}>
        {/* Back nav */}
        <Link to="/library" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All articles
        </Link>

        {/* Category line */}
        <div className="mt-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          <span className={`bg-gradient-to-r ${theme.grad} bg-clip-text text-transparent`}>
            {theme.label}
          </span>
          {item.domain && (
            <>
              <span className="h-px w-6 bg-border" />
              <Link to="/domains/$slug" params={{ slug: item.domain }} className="hover:text-foreground">
                {domainLabel(item.domain)}
              </Link>
            </>
          )}
        </div>

        {/* Title — serif headline */}
        <h1 className="font-display mt-6 text-balance text-[2.5rem] font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[3.5rem]">
          {item.title}
        </h1>

        {/* Standfirst */}
        {item.description && (
          <p className="font-display mt-6 max-w-[58ch] text-balance text-[1.25rem] italic leading-[1.55] text-foreground/75 md:text-[1.35rem]">
            {item.description}
          </p>
        )}

        {/* Byline strip */}
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-4 text-[12.5px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${theme.grad} text-[10px] font-bold text-white shadow-soft`}>
              LV
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-foreground">The LaunchVault Intelligence Team</p>
              <p className="text-[11px]">Quality-scored · Auto-published · Updated every 2h</p>
            </div>
          </div>
          {item.created_at && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-3.5 w-3.5" /> Published <DateStamp iso={item.created_at} withTime />
            </span>
          )}
          {item.estimated_minutes && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" /> {item.estimated_minutes} min read
            </span>
          )}
          <span className="ml-auto inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-foreground/70 ring-1 ring-foreground/10">
            {item.tier_required === "free" ? "Free" : item.tier_required}
          </span>
        </div>

        {/* === ARTICLE BODY (metered) ===
            Non-subscribers on paid tiers get a METERED preview: only ~10% of the
            article is revealed (measured client-side), the remaining ~90% stays
            private behind the upgrade gate. Subscribers + free items render full.
            The full HTML is still emitted server-side; the .paywalled-content
            wrapper + Article schema tell Google this portion is intentionally
            gated (Google's endorsed paywall pattern). */}
        <div className="relative mt-10">
          {shouldGate ? (
            <>
              <div className="paywalled-content">
                <MeteredReveal>
                  <ContentBody type={item.type} payload={safePayload} item={item} />
                </MeteredReveal>
              </div>
              <PaywallOverlay tier={item.tier_required} type={item.type} />
            </>
          ) : (
            <ContentBody type={item.type} payload={safePayload} item={item} />
          )}
        </div>

        {/* Tags */}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <Tag className="h-3 w-3" /> Tagged
            </span>
            {item.tags.map((t: string, i: number) => (
              <span key={i} className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-medium text-foreground/80">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Footer CTA — always present, even for subscribers (cross-link) */}
        <FooterCTA isSubscriber={!!isSubscriber} />
      </article>
    </PublicLayout>
  );
}

/* ============================ CONTENT BODY (typed) ============================ */

const ARTICLE_TYPE_VIEWS: Record<string, (p: any) => ReactNode> = {
  workflow: (payload) => <WorkflowView payload={payload} />,
  agent: (payload) => <AgentView payload={payload} />,
  business_lesson: (payload) => <BusinessView payload={payload} />,
  insight: (payload) => <InsightView payload={payload} />,
  tool_guide: (payload) => <ToolView payload={payload} />,
  playbook: (payload) => <PlaybookView payload={payload} />,
  challenge: (payload) => <ChallengeView payload={payload} />,
  cheatsheet: (payload) => <CheatsheetView payload={payload} />,
};

function ContentBody({ type, payload, item }: { type: string; payload: any; item: any }) {
  // The 8 article-types render their OWN <ArticleBody> inside their per-type
  // view (see NewTypeViews.tsx). Rendering one here too caused the article to
  // appear twice — which read as "broken/empty". So:
  //   • article-types  → render only the per-type view (it includes the article)
  //   • prompt / course → no internal ArticleBody, and their long-form article
  //                       lives in extra.article — so we render it once, here.
  const typeView = ARTICLE_TYPE_VIEWS[type];
  if (typeView) {
    return <div className="space-y-14">{typeView(payload)}</div>;
  }

  const standaloneArticle = payload?.extra?.article ?? null;

  return (
    <div className="space-y-14">
      {standaloneArticle && <ArticleBody article={standaloneArticle} />}

      {type === "prompt" && <PublicPromptView prompt={payload?.prompt} extra={payload?.extra} />}
      {type === "course" && (
        Array.isArray(payload?.course_sections) && payload.course_sections.length > 0
          ? <CoursePlayer contentId={item.id} sections={payload.course_sections} extra={payload?.extra} guest />
          : <PublicCoursePreview sections={payload?.course_sections} extra={payload?.extra} item={item} />
      )}
    </div>
  );
}

/* ============================ PROMPT (public) ============================ */

function PublicPromptView({ prompt, extra }: { prompt?: string | null; extra: any }) {
  const [copied, setCopied] = useState(false);
  if (!prompt && !extra) return null;
  const copy = () => {
    try {
      navigator.clipboard.writeText(prompt ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {/* clipboard blocked — no-op */}
  };
  return (
    <div className="space-y-8">
      {extra?.prompt_summary && (
        <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.04] to-fuchsia-500/[0.04] p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-fuchsia-700 dark:text-fuchsia-300">Why it works</p>
          <p className="mt-2 text-[15px] leading-relaxed">{extra.prompt_summary}</p>
        </div>
      )}

      {prompt && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-elevated">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-300">Copy-ready prompt</p>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition-colors hover:bg-white/10"
            >
              {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <pre className="max-h-[60vh] overflow-auto p-5 text-[13px] leading-relaxed text-slate-100">
            <code className="whitespace-pre-wrap break-words font-mono">{prompt}</code>
          </pre>
        </div>
      )}

      {Array.isArray(extra?.usage_steps) && extra.usage_steps.length > 0 && (
        <section>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">How to use it</p>
          <ol className="mt-3 space-y-2">
            {extra.usage_steps.map((s: string, i: number) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-[11px] font-bold text-white">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {extra?.example_use_case && (
        <section className="rounded-2xl border-l-4 border-emerald-500 bg-emerald-500/5 p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">In practice</p>
          <p className="mt-2 text-[15px] italic leading-relaxed">{extra.example_use_case}</p>
        </section>
      )}
    </div>
  );
}

/* ============================ COURSE (public preview) ============================ */

function PublicCoursePreview({ sections, extra, item }: { sections?: any[]; extra: any; item: any }) {
  const lessons = Array.isArray(sections) ? sections : [];
  return (
    <div className="space-y-8">
      {extra?.final_outcome && (
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-indigo-500/[0.04] to-cyan-500/[0.04] p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">By the end</p>
          <p className="mt-2 text-[15px] leading-relaxed">{extra.final_outcome}</p>
        </div>
      )}
      {lessons.length > 0 && (
        <section>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{lessons.length}-lesson series</p>
          <ol className="mt-4 space-y-3">
            {lessons.map((l: any, i: number) => (
              <li key={i} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-[1.3rem] font-bold text-foreground/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[1.15rem] font-bold leading-snug">{l.title ?? `Lesson ${i + 1}`}</h3>
                    {l.objective && <p className="mt-1 text-[13.5px] text-muted-foreground">{l.objective}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className="text-sm text-muted-foreground italic">
        Sign up to take the full {item.estimated_minutes ?? 20}-minute course with Q/A-gated lessons, practice tasks, and progress tracking.
      </p>
    </div>
  );
}

/* ============================ PAYWALL OVERLAY ============================ */

function PaywallOverlay({ tier, type }: { tier: string; type: string }) {
  const tierLabel: Record<string, string> = {
    tier1: `${brand.pricing.tier1.name} (${brand.pricing.tier1.priceLabel}/mo)`,
    tier2: `${brand.pricing.tier2.name} (${brand.pricing.tier2.priceLabel}/mo)`,
    tier3: `${brand.pricing.tier3.name} (${brand.pricing.tier3.priceLabel}/mo)`,
  };
  return (
    <div className="relative z-10 -mt-24 flex flex-col items-center">
      <div className="w-full max-w-xl rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-card via-card to-indigo-50/40 p-7 shadow-elevated backdrop-blur dark:to-indigo-950/30">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-glow">
            <Lock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-300">
              {tierLabel[tier] ?? "Paid tier"} required
            </p>
            <h3 className="font-display mt-1 text-[1.3rem] font-bold leading-snug tracking-tight md:text-[1.5rem]">
              You've previewed this {humanType(type)} — unlock the rest
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              That's about 10% of the piece. The remaining 90% — plus the full library,
              daily insights, Q/A-gated courses and agent blueprints — unlocks with any
              paid plan. Fresh work every 2 hours.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-glow hover:opacity-95">
                <Link to="/signup">Start free <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">See plans</Link>
              </Button>
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              Cancel anytime · No refunds · No credit card on Free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function humanType(type: string): string {
  return {
    prompt: "prompt", course: "course", workflow: "workflow", agent: "agent blueprint",
    business_lesson: "business lesson", insight: "insight", tool_guide: "tool guide",
    playbook: "playbook", challenge: "challenge", cheatsheet: "cheatsheet",
  }[type] ?? "article";
}

/* ============================ FOOTER CTA ============================ */

function FooterCTA({ isSubscriber }: { isSubscriber: boolean }) {
  if (isSubscriber) {
    return (
      <div className="mt-16 rounded-3xl border border-border bg-gradient-surface p-8 shadow-soft text-center">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary">In your dashboard</p>
        <h3 className="font-display mt-2 text-2xl font-bold tracking-tight">Want the interactive version?</h3>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">Saved items, progress tracking, quiz-gated lessons, XP — all live in the dashboard.</p>
        <Button asChild className="mt-5 bg-gradient-primary">
          <Link to="/dashboard">Go to dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="mt-16 rounded-3xl border border-border bg-slate-950 p-10 text-center text-white shadow-elevated">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-indigo-200">
        <Sparkles className="h-3 w-3" /> Open the vault
      </span>
      <h3 className="font-display mt-5 text-balance text-3xl font-bold tracking-tight md:text-4xl">
        Get fresh articles every <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">two hours.</span>
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-slate-300">
        Across 50 AI mastery domains — auto-validated, quality-scored, ready to read. Start free in 30 seconds.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Button asChild size="lg" className="h-12 bg-white px-8 font-bold text-slate-950 hover:bg-indigo-50">
          <Link to="/signup">Start free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 border-white/15 bg-white/5 px-8 font-bold text-white backdrop-blur hover:bg-white/10 hover:text-white">
          <Link to="/pricing">See plans</Link>
        </Button>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-xs text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
        New articles every 2 hours · No credit card · Cancel anytime
      </div>
    </div>
  );
}

// Suppress unused-import warning while keeping the icon refs available
void Sparkles;
void Star;
const _unused: LucideIcon | null = null;
void _unused;
