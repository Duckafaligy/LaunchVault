// =====================================================================
// /blog/$slug — Individual essay page. Long-form founder voice.
// Article schema with full author byline. Free for SEO + AEO citations.
// =====================================================================

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles, Clock, type LucideIcon } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { getPublicContentBySlug } from "@/utils/public-content.functions";
import { buildSeoMeta, buildSeoLinks, jsonLdScript, articleWithAuthorJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { brand } from "@/config/brand";
import { DateStamp } from "@/components/DateStamp";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicContentBySlug({ data: { slug: params.slug } });
    if (!data || data.item.type !== "essay") throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl font-bold">Essay not found</h1>
        <Link to="/blog" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          Back to blog <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PublicLayout>
  ),
  head: ({ loaderData }) => {
    const item = loaderData?.item;
    if (!item) {
      return { meta: buildSeoMeta({ title: "Essay not found", description: "Not available.", path: "/blog" }) };
    }
    const desc = item.short_description || item.description;
    return {
      meta: buildSeoMeta({
        title: `${item.title} — ${brand.brandName}`,
        description: desc,
        path: `/blog/${item.slug}`,
        type: "article",
      }),
      links: buildSeoLinks(`/blog/${item.slug}`),
      scripts: [
        jsonLdScript(articleWithAuthorJsonLd({
          title: item.title,
          description: desc,
          slug: item.slug ?? "",
          basePath: "/blog",
          datePublished: item.created_at,
          dateModified: item.updated_at ?? item.created_at,
          isPaywalled: false, // essays are always free
          authorName: brand.founder.name,
          keywords: Array.isArray(item.tags) ? item.tags : undefined,
          timeRequired: item.estimated_minutes ? `PT${item.estimated_minutes}M` : undefined,
        })),
        jsonLdScript(breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: item.title, path: `/blog/${item.slug}` },
        ])),
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { item, payload } = Route.useLoaderData();
  const extra = (payload?.extra as any) ?? {};

  return (
    <PublicLayout>
      <article className="mx-auto max-w-[680px] px-4 pt-10 pb-20">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Founder's notebook
        </Link>

        {/* Eyebrow */}
        <p className="mt-8 flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
          <span className="bg-gradient-to-r from-amber-500 to-fuchsia-500 bg-clip-text text-transparent">Essay</span>
          {item.category && (
            <>
              <span className="h-px w-6 bg-border" />
              <span>{String(item.category).replace(/-/g, " ")}</span>
            </>
          )}
        </p>

        {/* Headline — Fraunces, dramatic */}
        <h1 className="font-display mt-5 text-balance text-[3rem] font-bold leading-[1.04] tracking-[-0.02em] md:text-[4rem]">
          {item.title}
        </h1>

        {/* Standfirst — extra.tldr is the dek */}
        {extra.tldr && (
          <p className="font-display mt-6 max-w-[58ch] text-balance text-[1.3rem] italic leading-[1.5] text-foreground/75 md:text-[1.4rem]">
            {extra.tldr}
          </p>
        )}

        {/* Byline */}
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-4 text-[12.5px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-fuchsia-500 text-[12px] font-bold text-white shadow-soft">
              {brand.founder.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-foreground">{brand.founder.name}</p>
              <p className="text-[11px]">{brand.founder.role} · {brand.brandName}</p>
            </div>
          </div>
          <span className="hidden h-4 w-px bg-border md:block" />
          <DateStamp iso={item.created_at} withTime className="font-medium" />
          {item.estimated_minutes && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5" /> {item.estimated_minutes} min read
            </span>
          )}
        </div>

        {/* Hook — drop cap on first letter of opening paragraph */}
        {extra.hook && (
          <p className="mt-10 text-[1.18rem] leading-[1.85] text-foreground/90 first-letter:font-display first-letter:text-[3.5rem] first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85] first-letter:text-amber-500 dark:first-letter:text-amber-400">
            {extra.hook}
          </p>
        )}

        {/* Body sections */}
        {Array.isArray(extra.sections) && extra.sections.length > 0 && (
          <div className="mt-12 space-y-12">
            {extra.sections.map((s: any, i: number) => (
              <section key={i}>
                <h2 className="font-display text-balance text-[1.8rem] font-bold leading-[1.15] tracking-[-0.01em] text-foreground md:text-[2.1rem]">
                  {s.heading}
                </h2>
                {s.body && (
                  <p className="mt-5 whitespace-pre-wrap text-[1.05rem] leading-[1.8] text-foreground/85">
                    {s.body}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Pull quotes — tweetable lines */}
        {Array.isArray(extra.key_quotes) && extra.key_quotes.length > 0 && (
          <div className="mt-14 space-y-8">
            {extra.key_quotes.map((q: string, i: number) => (
              <figure key={i} className="relative">
                <span aria-hidden className="font-display absolute -left-1 -top-6 select-none text-[6.5rem] leading-none text-amber-500/25">&ldquo;</span>
                <blockquote className="font-display relative pl-7 text-[1.3rem] italic leading-[1.5] text-foreground/85 md:text-[1.4rem]">
                  {q}
                </blockquote>
              </figure>
            ))}
          </div>
        )}

        {/* Closing */}
        {extra.closing && (
          <p className="mt-14 border-t border-border pt-10 text-[1.1rem] font-medium leading-[1.7] text-foreground">
            {extra.closing}
          </p>
        )}

        {/* Sign-off */}
        <p className="mt-10 font-display text-[1.1rem] italic text-muted-foreground">
          — {brand.founder.name}
        </p>

        {/* What to read next */}
        {Array.isArray(extra.next_to_read) && extra.next_to_read.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Read next</p>
            <ul className="mt-4 space-y-3">
              {extra.next_to_read.map((t: string, i: number) => (
                <li key={i} className="font-display text-[1.1rem] font-medium leading-snug">
                  → {t}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-3xl border border-border bg-slate-950 p-8 text-center text-white shadow-elevated">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-amber-200">
            <Sparkles className="h-3 w-3" /> The product
          </span>
          <h3 className="font-display mt-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            See what the engine has shipped today.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Fresh AI mastery content every 2 hours. Start free.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Link to="/signup" className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-white px-8 text-sm font-bold text-slate-950 hover:bg-amber-50">
              Open the vault <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/library" className="inline-flex h-12 items-center rounded-xl border border-white/15 bg-white/5 px-8 text-sm font-bold text-white backdrop-blur hover:bg-white/10">
              Browse library
            </Link>
          </div>
        </div>
      </article>
    </PublicLayout>
  );
}

const _ = null as unknown as LucideIcon;
void _;
