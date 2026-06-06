// =====================================================================
// UpgradeDialog — in-dashboard upgrade popup.
//
// Replaces "redirect to /pricing" for locked content. Shows the tier
// options (Starter / Creator / Pro) in a popup; picking one
// swaps to the embedded Stripe checkout right inside the same dialog —
// the user never leaves the dashboard.
//
// Exposed via <UpgradeProvider> + useUpgrade() so any dashboard page can
// call open() without managing its own dialog state.
//
// Mobile-first: full-screen on phones, scrollable, safe-area aware — this
// is also what fixes the broken Stripe rendering on iPhone / iPad.
// =====================================================================

import {
  createContext, useCallback, useContext, useEffect, useState, type ReactNode,
} from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Crown, ShieldCheck, Lock, Loader2, ArrowLeft, ArrowRight, Check, Sparkles,
} from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/use-auth";
import { brand } from "@/config/brand";

type PaidTier = "tier1" | "tier2" | "tier3";
const PAID_TIERS: PaidTier[] = ["tier1", "tier2", "tier3"];

interface UpgradeContextValue {
  /** Open the upgrade popup. Pass the tier a locked item needs to highlight it. */
  open: (highlightTier?: string) => void;
}

const UpgradeContext = createContext<UpgradeContextValue>({ open: () => {} });

export function useUpgrade() {
  return useContext(UpgradeContext);
}

export function UpgradeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | undefined>(undefined);

  const openDialog = useCallback((highlightTier?: string) => {
    setHighlight(highlightTier);
    setOpen(true);
  }, []);

  return (
    <UpgradeContext.Provider value={{ open: openDialog }}>
      {children}
      <UpgradeDialog open={open} onOpenChange={setOpen} highlight={highlight} />
    </UpgradeContext.Provider>
  );
}

function UpgradeDialog({
  open, onOpenChange, highlight,
}: { open: boolean; onOpenChange: (o: boolean) => void; highlight?: string }) {
  const { user } = useAuth();
  const { openCheckout, closeCheckout, checkoutElement } = useStripeCheckout();
  const [selected, setSelected] = useState<PaidTier | null>(null);

  // Reset state whenever the dialog closes.
  useEffect(() => {
    if (!open) { setSelected(null); closeCheckout(); }
  }, [open, closeCheckout]);

  const choose = (tier: PaidTier) => {
    setSelected(tier);
    openCheckout({
      priceId: brand.pricing[tier].priceId,
      customerEmail: user?.email ?? undefined,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const backToPicker = () => { setSelected(null); closeCheckout(); };
  const selectedInfo = selected ? brand.pricing[selected] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden border-border bg-card p-0
          sm:max-h-[92dvh]
          max-sm:!fixed max-sm:!inset-0 max-sm:!translate-x-0 max-sm:!translate-y-0
          max-sm:!h-[100dvh] max-sm:!max-h-[100dvh] max-sm:!w-full max-sm:!max-w-none max-sm:!rounded-none
        "
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-900 px-5 py-5 text-white sm:px-6 sm:py-6 pt-[max(env(safe-area-inset-top),1.25rem)]">
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="relative">
            {selected ? (
              <button
                onClick={backToPicker}
                className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-100/80 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All plans
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur ring-1 ring-white/25">
                <Crown className="h-3 w-3" /> Upgrade
              </span>
            )}
            <DialogHeader className="mt-2 space-y-1">
              <DialogTitle className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                {selected ? `Upgrade to ${selectedInfo?.name}` : "Unlock the full library"}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-indigo-100/85">
                {selected
                  ? selectedInfo?.tagline
                  : "Pick a plan to unlock courses, agent blueprints, business plays and the full archive. Cancel anytime."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
          {!selected ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {PAID_TIERS.map((tier) => {
                const info = brand.pricing[tier];
                const isHighlight = highlight === tier || (!highlight && tier === "tier2");
                return (
                  <button
                    key={tier}
                    onClick={() => choose(tier)}
                    className={`group relative flex flex-col rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-elevated ${
                      isHighlight ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card"
                    }`}
                  >
                    {isHighlight && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                        {highlight === tier ? "Required" : "Popular"}
                      </span>
                    )}
                    <p className="font-display text-lg font-bold tracking-tight">{info.name}</p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-3xl font-bold tabular-nums tracking-tight">{info.priceLabel}</span>
                      {"originalPriceLabel" in info && info.originalPriceLabel && (
                        <span className="text-base font-semibold text-muted-foreground line-through decoration-rose-400/80 decoration-2">{info.originalPriceLabel}</span>
                      )}
                      <span className="text-[12px] text-muted-foreground">/ {info.period}</span>
                    </div>
                    {"discountPercent" in info && info.discountPercent ? (
                      <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
                        Save {info.discountPercent}%
                      </span>
                    ) : null}
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{info.tagline}</p>
                    <ul className="mt-3 space-y-1.5">
                      {info.features.slice(0, 3).map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[12.5px] text-foreground/80">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}
                        </li>
                      ))}
                    </ul>
                    <span className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                      isHighlight ? "bg-gradient-primary text-white" : "border border-border bg-background text-foreground group-hover:border-primary/40"
                    }`}>
                      Choose {info.name} <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="min-h-[420px] w-full">
              {checkoutElement ?? (
                <div className="grid place-items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust footer */}
        <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure Stripe checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Cancel any time · One click
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
