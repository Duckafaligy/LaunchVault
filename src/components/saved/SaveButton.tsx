// =====================================================================
// SaveButton — universal Save-to-Vault toggle.
//
// Variants:
//   - "icon"     small icon-only button (for cards / corners)
//   - "default"  icon + label (for content viewer header)
//   - "pill"     rounded pill for prominent placement
//
// Optimistic: flips immediately, server sync in background. If server fails,
// reverts + shows a toast.
// =====================================================================

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toggleSavedItem, getSavedStatus } from "@/utils/saved.functions";
import { capture } from "@/lib/analytics";

type Props = {
  contentId: string;
  variant?: "icon" | "default" | "pill";
  className?: string;
  // Use this when you already know the saved state (from a bulk-fetch list
  // like the library) so we don't re-query per card.
  initialSaved?: boolean;
};

export function SaveButton({ contentId, variant = "default", className, initialSaved }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const checkFn = useServerFn(getSavedStatus);
  const toggleFn = useServerFn(toggleSavedItem);

  // If parent passed an initial state, skip the fetch — pure optimistic mode
  const { data: status } = useQuery({
    queryKey: ["saved-status", contentId, user?.id],
    enabled: !!user && initialSaved === undefined,
    queryFn: () => checkFn({ data: { contentId } }),
    staleTime: 30_000,
  });

  const [saved, setSaved] = useState<boolean>(initialSaved ?? false);
  // Sync local from fetched status (initial load only)
  useEffect(() => {
    if (initialSaved === undefined && status?.saved !== undefined) {
      setSaved(status.saved);
    }
  }, [status?.saved, initialSaved]);

  // Sync local from prop if parent changes it (rare)
  useEffect(() => {
    if (initialSaved !== undefined) setSaved(initialSaved);
  }, [initialSaved]);

  const mutate = useMutation({
    mutationFn: () => toggleFn({ data: { contentId } }),
    onMutate: () => {
      // Optimistic flip
      const previous = saved;
      setSaved(!previous);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      // Revert on error
      if (ctx?.previous !== undefined) setSaved(ctx.previous);
      toast.error("Couldn't save — try again");
    },
    onSuccess: (res) => {
      setSaved(res.saved);
      toast.success(res.saved ? "Saved to your vault" : "Removed from vault");
      // Invalidate the vault list so it refreshes when the user navigates there
      qc.invalidateQueries({ queryKey: ["saved-items"] });
      qc.invalidateQueries({ queryKey: ["saved-status", contentId] });
      void capture("vault_toggled", { contentId, saved: res.saved });
    },
  });

  if (!user) return null; // hide button for unauth — they shouldn't see save UI

  const onClick = (e: React.MouseEvent) => {
    // If the SaveButton is nested inside a Link, prevent navigation
    e.preventDefault();
    e.stopPropagation();
    if (mutate.isPending) return;
    mutate.mutate();
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={saved ? "Remove from vault" : "Save to vault"}
        title={saved ? "Remove from vault" : "Save to vault"}
        className={`group/save grid h-9 w-9 place-items-center rounded-lg border transition-all ${
          saved
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        } ${className ?? ""}`}
      >
        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-all ${
          saved
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        } ${className ?? ""}`}
      >
        {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      variant="outline"
      size="sm"
      className={`gap-1.5 ${
        saved
          ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
          : ""
      } ${className ?? ""}`}
    >
      {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Saved" : "Save to Vault"}
    </Button>
  );
}
