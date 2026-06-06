// =====================================================================
// /glossary/$slug — Individual AI term definition page.
// Emits DefinedTerm schema (the AEO schema LLMs use to cite definitions).
// Full content always SSR'd — Google + Claude + ChatGPT + Perplexity
// can all crawl + cite.
// =====================================================================

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, type LucideIcon } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { getPublicContentBySlug } from "@/utils/public-content.functions";
import { buildSeoMeta, buildSeoLinks, jsonLdScript, definedTermJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { brand } from "@/config/brand";
import { DateStamp } from "@/components/DateStamp";

export const Route = createFileRoute("/glossary/$slug")({
  loader: async ({ params }) => {
    const data = await getPublicContentBySlug({ data: { slug: params.slug } });
    if (!data || data.item.type !== "glossary") throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-4xl font-bold">Term not found</h1>
        <Link to="/glossary" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          Back to glossary <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </PublicLayout>
  ),
  head: ({ loaderData }) => {
    const item = loaderData?.item;
    const payload = loaderData?.payload;
    if (!item) {
      return { meta: buildSeoMeta({ title: "Term not found", description: "Not available.", path: "/glossary" }) };
    }
    const extra = (payload?.extra as any) ?? {};
    const desc = extra.short_definition || item.description || `Definition of "${item.title}" on ${brand.brandName}.`;

    return {
      meta: buildSeoMeta({
        title: `${item.title} — AI Glossary | ${brand.brandName}`,
        description: desc,
        path: `/glossary/${item.slug}`,
        type: "article",
      }),
      links: buildSeoLinks(`/glossary/${item.slug}`),
      scripts: [
        // DefinedTerm — the schema LLMs use to cite "what is X" definitions
        jsonLdScript(definedTermJsonLd({
          term: item.title,
          definition: desc,
          slug: item.slug ?? "",
          related: Array.isArray(extra.related_terms) ? extra.related_terms : undefined,
        })),
        jsonLdScript(breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Glossary", path: "/glossary" },
          { name: item.title, path: `/glossary/${item.slug}` },
        ])),
      ],
    };
  },
  component: GlossaryEntryPage,
});

function GlossaryEntryPage() {
  const { item, payload } = Route.useLoaderData();
  const extra = (payload?.extra as any) ?? {};

  return (
    <PublicLayout>
      <article className="mx-auto max-w-[680px] px-4 pt-10 pb-20">
        <Link to="/glossary" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> AI Glossary
        </Link>

        <p className="mt-8 text-[10.5px] font-bold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">
          <BookOpen className="-mt-0.5 mr-1.5 inline h-3 w-3" />
          AI Term
          {extra.first_use_year && <span className="ml-2 text-muted-foreground">circa {extra.first_use_year}</span>}
          {item.created_at && <DateStamp iso={item.created_at} withTime prefix="· Added " className="ml-2 font-medium normal-case tracking-normal text-muted-foreground" />}
        </p>

        <h1 className="font-display mt-3 text-balance text-[3.25rem] font-bold leading-[1.02] tracking-[-0.02em] md:text-[4.25rem]">
          {item.title}
        </h1>

        {/* THE definition — the one sentence Claude/ChatGPT/Perplexity will quote */}
        {extra.short_definition && (
          <p className="font-display mt-7 border-l-2 border-cyan-500/60 pl-5 text-[1.35rem] italic leading-[1.45] text-foreground/85 md:text-[1.5rem]">
            {extra.short_definition}
          </p>
        )}

        {/* Long-form explanation */}
        {extra.long_definition && (
          <div className="mt-10 space-y-5 text-[1.05rem] leading-[1.8] text-foreground/85">
            {String(extra.long_definition).split(/\n\n+/).map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* Examples */}
        {Array.isArray(extra.examples) && extra.examples.length > 0 && (
          <section className="mt-12">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Examples</p>
            <ul className="mt-4 space-y-2.5">
              {extra.examples.map((ex: string, i: number) => (
                <li key={i} className="flex gap-3 text-[15.5px] leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Common misconceptions */}
        {Array.isArray(extra.common_misconceptions) && extra.common_misconceptions.length > 0 && (
          <section className="mt-12">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-300">
              Common misconceptions
            </p>
            <ul className="mt-4 space-y-3">
              {extra.common_misconceptions.map((m: string, i: number) => (
                <li key={i} className="rounded-xl border border-amber-500/20 bg-amber-50/40 px-4 py-3 text-[14.5px] leading-relaxed dark:bg-amber-950/20">
                  {m}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Synonyms */}
        {Array.isArray(extra.synonyms) && extra.synonyms.length > 0 && (
          <p className="mt-10 text-[13px] text-muted-foreground">
            <span className="font-bold text-foreground">Also known as:</span>{" "}
            {extra.synonyms.join(", ")}
          </p>
        )}

        {/* Related terms */}
        {Array.isArray(extra.related_terms) && extra.related_terms.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-muted-foreground">Related terms</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {extra.related_terms.map((slug: string, i: number) => (
                <Link
                  key={i}
                  to="/glossary/$slug"
                  params={{ slug }}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground/80 transition-colors hover:border-cyan-500/40 hover:text-cyan-700 dark:hover:text-cyan-300"
                >
                  {String(slug).replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-3xl border border-border bg-gradient-surface p-8 text-center shadow-soft">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary">Want more like this?</p>
          <h3 className="font-display mt-2 text-2xl font-bold tracking-tight">Open the full library</h3>
          <p className="mt-2 text-muted-foreground">Fresh AI mastery content every 2 hours.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link to="/signup" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-primary px-6 text-sm font-bold text-primary-foreground shadow-glow">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/library" className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-6 text-sm font-bold">
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
