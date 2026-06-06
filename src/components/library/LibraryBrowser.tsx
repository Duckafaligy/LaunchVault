import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { LibraryItem } from "@/utils/library.functions";
import { LibraryGrid } from "@/components/library/LibraryGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Sort = "newest" | "featured" | "az";

export function LibraryBrowser({
  items,
  isLoading,
  emptyTitle,
  emptyHint,
  accent = "Items",
}: {
  items: LibraryItem[];
  isLoading: boolean;
  emptyTitle: string;
  emptyHint: string;
  accent?: string;
}) {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("featured");

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.category && s.add(i.category));
    return Array.from(s).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = items.filter((it) => {
      if (tier !== "all" && it.tier_required !== tier) return false;
      if (category !== "all" && it.category !== category) return false;
      if (!ql) return true;
      return (
        it.title.toLowerCase().includes(ql) ||
        it.description?.toLowerCase().includes(ql) ||
        it.preview_text?.toLowerCase().includes(ql) ||
        it.category?.toLowerCase().includes(ql)
      );
    });
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [items, q, tier, category, sort]);

  const hasFilters = q || tier !== "all" || category !== "all";
  const accessibleCount = items.filter((i) => !i.locked).length;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse rounded-2xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatChip label={`Total ${accent}`} value={items.length} />
        <StatChip label="Unlocked for you" value={accessibleCount} tone="emerald" />
        <StatChip label="Categories" value={categories.length} tone="violet" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-3 shadow-soft md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${accent.toLowerCase()}…`}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2 md:flex-nowrap">
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="tier1">Tier 1</SelectItem>
              <SelectItem value="tier2">Tier 2</SelectItem>
              <SelectItem value="tier3">Tier 3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="w-[140px]">
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured first</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="az">A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {items.length} shown
          </span>
          {q && (
            <Badge variant="secondary" className="gap-1">
              "{q}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => setQ("")} />
            </Badge>
          )}
          {tier !== "all" && (
            <Badge variant="secondary" className="gap-1 capitalize">
              {tier}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setTier("all")}
              />
            </Badge>
          )}
          {category !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setCategory("all")}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setQ("");
              setTier("all");
              setCategory("all");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      <LibraryGrid items={filtered} emptyTitle={emptyTitle} emptyHint={emptyHint} />
    </div>
  );
}

function StatChip({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: number;
  tone?: "primary" | "emerald" | "violet";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-600"
      : tone === "violet"
        ? "bg-violet-500/10 text-violet-600"
        : "bg-primary/10 text-primary";
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${toneClass}`}>
          live
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
