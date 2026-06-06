// =====================================================================
// /glossary — Public AI glossary index, SSR'd, indexable.
// Highest-leverage AEO play — LLMs cite definitive AI term definitions.
// =====================================================================

import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, BookOpen, ArrowRight, type LucideIcon } from "lucide-react";
import { PublicLayout } from "@/components/landing/PublicLayout";
import { listPublicLibrary } from "@/utils/public-content.functions";
import { buildSeoMeta, buildSeoLinks, jsonLdScript, breadcrumbJsonLd } from "@/lib/seo";
import { brand } from "@/config/brand";
import { DateStamp } from "@/components/DateStamp";

export const Route = createFileRoute("/glossary/")({
  loader: async () => {
    const items = await listPublicLibrary({ data: { type: "glossary", limit: 200 } });
    return { items };
  },
  head: () => ({
    meta: buildSeoMeta({
      title: "AI Glossary — AI Terms & Concepts Explained Simply | LaunchVault",
      description: "Learn AI terminology the easy way. LaunchVault's AI glossary defines every term that matters — prompting, AI agents, machine learning, and AI for business — in plain English. The fastest way to understand AI concepts.",
      path: "/glossary",
    }),
    links: buildSeoLinks("/glossary"),
    scripts: [
      jsonLdScript(breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Glossary", path: "/glossary" },
      ])),
    ],
  }),
  component: GlossaryIndexPage,
});

function GlossaryIndexPage() {
  const { items } = Route.useLoaderData();

  // Group alphabetically
  const groups = items.reduce<Record<string, any[]>>((acc, it: any) => {
    const letter = String(it.title ?? "").charAt(0).toUpperCase() || "#";
    (acc[letter] ??= []).push(it);
    return acc;
  }, {});
  const letters = Object.keys(groups).sort();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-16 h-[420px] w-[420px] rounded-full bg-indigo-600/30 blur-[120px]" />
          <div className="absolute -bottom-32 -right-16 h-[420px] w-[420px] rounded-full bg-cyan-600/25 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center text-white md:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            <BookOpen className="h-3 w-3" /> AI Glossary
          </span>
          <h1 className="font-display mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-[-0.02em] md:text-[4rem]">
            Every AI term,
            <span className="block bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              defined plainly.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            From RAG to system prompts to context windows — definitive answers that get cited by ChatGPT, Claude, and Perplexity. Updated automatically.
          </p>
          <p className="mt-5 text-sm text-slate-400">{items.length} terms defined and growing</p>
        </div>
      </section>

      {/* Alphabetical jump bar */}
      {letters.length > 0 && (
        <section className="sticky top-16 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-1.5 px-4 py-3">
            {letters.map((l) => (
              <a key={l} href={`#letter-${l}`} className="grid h-7 w-7 place-items-center rounded-md text-[12px] font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
                {l}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Terms grid */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-14">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <p className="font-display text-[3rem] font-bold leading-none tracking-tight text-foreground/15">{letter}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groups[letter].map((it: any) => <GlossaryCard key={it.id} item={it} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}

function GlossaryCard({ item }: { item: any }) {
  return (
    <Link
      to="/glossary/$slug"
      params={{ slug: item.slug ?? item.id }}
      className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <h3 className="font-display text-[1.2rem] font-bold leading-tight tracking-tight">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted-foreground">
        {item.short_description ?? item.description}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        {item.created_at && <DateStamp iso={item.created_at} withTime prefix="Added " className="text-[11px] text-muted-foreground" />}
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Read definition <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
      <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="font-display mt-3 text-2xl font-bold">The glossary is being built</p>
      <p className="mt-2 text-sm text-muted-foreground">First batch of terms publishes within the next engine cycle.</p>
    </div>
  );
}

const _ = null as unknown as LucideIcon;
void _;
