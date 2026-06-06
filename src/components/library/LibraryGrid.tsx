import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Crown, CheckCircle2, Eye, ExternalLink } from "lucide-react";
import type { LibraryItem } from "@/utils/library.functions";
import { Button } from "@/components/ui/button";
import { TIER_LABEL } from "@/config/brand";
import { ContentViewDialog } from "@/components/library/ContentViewDialog";
import { CoverArt } from "@/components/library/CoverArt";

const TIER_BADGE: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  tier1: "bg-sky-500/10 text-sky-600",
  tier2: "bg-violet-500/10 text-violet-600",
  tier3: "bg-amber-500/10 text-amber-600",
  tier4: "bg-gradient-primary text-primary-foreground",
};

export function LibraryGrid({
  items,
  emptyTitle,
  emptyHint,
}: {
  items: LibraryItem[];
  emptyTitle: string;
  emptyHint: string;
}) {
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">{emptyTitle}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <LibraryCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function LibraryCard({ item }: { item: LibraryItem }) {
  const [open, setOpen] = useState(false);
  const isCourse = item.type === "course";

  return (
    <>
      <div
        className={`group relative overflow-hidden rounded-2xl border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated ${
          item.is_featured ? "border-primary/40" : "border-border"
        }`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-card">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
              <CoverArt id={item.id} type={item.type} category={item.category} title={item.title} />
            </div>
          )}
          {item.is_featured && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-glow">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
          <span
            className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              TIER_BADGE[item.tier_required] ?? TIER_BADGE.free
            }`}
          >
            <Crown className="h-3 w-3" />
            {TIER_LABEL[item.tier_required as keyof typeof TIER_LABEL] ?? "Free"}
          </span>

          {item.locked && (
            <div className="absolute inset-0 grid place-items-center bg-foreground/55 backdrop-blur-[2px]">
              <div className="rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold shadow-elevated">
                <Lock className="mr-1 inline h-3 w-3" /> Locked
              </div>
            </div>
          )}
          {!item.locked && (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-semibold text-white">
              <CheckCircle2 className="h-3 w-3" /> Unlocked
            </div>
          )}
        </div>

        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {item.category}
          </p>
          <h3 className="mt-1 line-clamp-1 text-base font-semibold">{item.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            {item.locked ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/pricing">Upgrade to unlock</Link>
              </Button>
            ) : (
              <div className="flex w-full items-center gap-2">
                {isCourse ? (
                  <Button asChild size="sm" className="flex-1 bg-gradient-primary">
                    <Link to="/dashboard/content/$id" params={{ id: item.id }}>
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open course
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setOpen(true)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Quick view
                    </Button>
                    <Button asChild size="sm" className="flex-1 bg-gradient-primary">
                      <Link to="/dashboard/content/$id" params={{ id: item.id }}>
                        Open
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {!isCourse && <ContentViewDialog contentId={item.id} open={open} onOpenChange={setOpen} />}
    </>
  );
}
