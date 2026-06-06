import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  MessageSquareCode, Sparkles, Lock, ArrowRight, CalendarDays,
} from "lucide-react";
import { formatDateTime } from "@/lib/format-date";
import { listLibrary, type LibraryItem } from "@/utils/library.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/saved/SaveButton";
import { useUpgrade } from "@/components/dashboard/UpgradeDialog";

export const Route = createFileRoute("/dashboard/prompts")({
  component: PromptsPage,
});

function PromptsPage() {
  const fetchList = useServerFn(listLibrary);
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["library", "prompt", user?.id ?? "anon"],
    queryFn: () => fetchList({ data: { type: "prompt" } }),
  });

  // Per-type page: no search/filter here. Use /dashboard/library to filter or
  // search across everything. This page is a clean curated prompt list.
  const items = data ?? [];
  const featured = items.find((i) => i.is_featured) ?? items[0];
  const rest = items.filter((i) => i.id !== featured?.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Magazine header */}
      <header className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <MessageSquareCode className="h-3.5 w-3.5" /> The Prompt Library
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Battle-tested prompts, read like articles
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Each prompt comes with the &ldquo;why it works,&rdquo; the inputs to fill,
          and a checklist for shipping production-quality results.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-72 animate-pulse rounded-3xl bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <Empty />
      ) : (
        <>
          {/* Featured hero article */}
          {featured && <FeaturedArticle item={featured} />}

          {/* Article list */}
          {rest.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-end justify-between border-b border-border pb-2">
                <h2 className="text-lg font-bold tracking-tight">More prompts</h2>
                <span className="text-xs text-muted-foreground">{rest.length} more</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {rest.map((it) => <ArticleCard key={it.id} item={it} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function FeaturedArticle({ item }: { item: LibraryItem }) {
  const upgrade = useUpgrade();
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all hover:shadow-elevated">
      <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
        <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 text-white md:p-10">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur ring-1 ring-white/30">
              <Sparkles className="h-3 w-3" /> Featured prompt
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight md:text-3xl">{item.title}</h2>
            <p className="mt-3 text-sm text-white/85 md:text-base">{item.description}</p>
          </div>
        </div>
        <div className="flex flex-col justify-between p-6 md:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-[10px]">
              <Badge variant="secondary" className="uppercase">{item.category}</Badge>
              <Badge variant="outline" className="uppercase">{item.tier_required}</Badge>
            </div>
            <p className="text-sm italic text-muted-foreground">&ldquo;{item.preview_text}&rdquo;</p>
          </div>
          <div className="mt-6 flex items-center gap-3">
            {item.locked ? (
              <Button className="bg-gradient-primary" onClick={() => upgrade.open(item.tier_required)}>
                <Lock className="mr-1.5 h-3.5 w-3.5" /> Unlock
              </Button>
            ) : (
              <Button asChild className="bg-gradient-primary">
                <Link to="/dashboard/content/$id" params={{ id: item.id }}>
                  Read prompt <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <SaveButton contentId={item.id} variant="icon" />
          </div>
        </div>
      </div>
    </article>
  );
}

function ArticleCard({ item }: { item: LibraryItem }) {
  return (
    <Link
      to="/dashboard/content/$id"
      params={{ id: item.id }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-elevated"
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{item.category}</span>
        <span>·</span>
        <span className="text-emerald-700">{item.tier_required === "free" ? "Free" : item.tier_required}</span>
        {item.locked && <Lock className="ml-1 h-3 w-3 text-muted-foreground" />}
      </div>
      <h3 className="mt-2 text-lg font-bold leading-tight group-hover:text-primary">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDateTime(item.created_at)}</span>
        <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Read <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function Empty() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <MessageSquareCode className="mx-auto h-6 w-6 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold">No prompts yet</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Fresh prompts ship every week — check back soon.</p>
    </div>
  );
}
