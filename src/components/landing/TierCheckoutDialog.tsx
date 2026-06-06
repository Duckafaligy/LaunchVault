import { Link } from "@tanstack/react-router";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, ArrowRight, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useAuth } from "@/hooks/use-auth";
import { brand } from "@/config/brand";
import { useEffect } from "react";
import type { TierKey } from "@/components/landing/PricingCard";

// Pull current price IDs from brand config so this stays in sync if pricing
// is rotated again. brand.pricing.{tier}.priceId is the SOLE source of truth.
const priceIdForTier = (tier: Exclude<TierKey, "free">): string => {
  return brand.pricing[tier].priceId;
};

interface Props {
  tierKey: TierKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Pricing modal that handles two flows in-place on the pricing page:
 *  - Logged-out user → sign up CTA (preserves ?upgrade= intent)
 *  - Logged-in user  → Stripe embedded checkout right inside the dialog
 *
 * No navigation away from the page they're on.
 */
export function TierCheckoutDialog({ tierKey, open, onOpenChange }: Props) {
  const { user, loading } = useAuth();
  const { openCheckout, closeCheckout, checkoutElement } = useStripeCheckout();

  const tierInfo = tierKey && tierKey !== "free" ? brand.pricing[tierKey] : null;

  // When dialog opens for a logged-in user, kick the Stripe checkout.
  useEffect(() => {
    if (!open) return;
    if (!user || !tierKey || tierKey === "free") return;
    const priceId = priceIdForTier(tierKey);
    if (!priceId) return;
    openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    // intentionally only on open transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id, tierKey]);

  // When dialog closes, also close any active checkout state.
  useEffect(() => {
    if (!open) closeCheckout();
  }, [open, closeCheckout]);

  if (!tierKey || tierKey === "free") return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-border bg-card p-0
          sm:max-h-[92dvh]
          max-sm:!fixed max-sm:!inset-0 max-sm:!translate-x-0 max-sm:!translate-y-0
          max-sm:!h-[100dvh] max-sm:!max-h-[100dvh] max-sm:!w-full max-sm:!max-w-none max-sm:!rounded-none
        "
      >
        {/* Header strip with tier color — compact on mobile */}
        <div className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-900 px-5 py-5 text-white sm:px-6 sm:py-7 pt-[max(env(safe-area-inset-top),1.25rem)]">
          <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur ring-1 ring-white/25">
              <Crown className="h-3 w-3" /> {tierInfo?.name}
            </span>
            <DialogHeader className="mt-3 space-y-1 sm:mt-4">
              <DialogTitle className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                Upgrade to {tierInfo?.name}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-indigo-100/85 sm:text-sm">
                {tierInfo?.tagline}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 flex items-baseline gap-2 sm:mt-4">
              <span className="font-display bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200 bg-clip-text text-3xl font-bold tabular-nums tracking-tight text-transparent sm:text-4xl">
                {tierInfo?.priceLabel}
              </span>
              {tierInfo && "originalPriceLabel" in tierInfo && tierInfo.originalPriceLabel && (
                <span className="text-lg font-semibold text-indigo-200/60 line-through decoration-rose-300/70 decoration-2">{tierInfo.originalPriceLabel}</span>
              )}
              <span className="text-sm text-indigo-100/70">/ {tierInfo?.period}</span>
              {tierInfo && "discountPercent" in tierInfo && tierInfo.discountPercent ? (
                <span className="ml-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200 ring-1 ring-emerald-300/40">
                  {tierInfo.discountPercent}% off
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Body — scrolls independently, fills remaining height */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !user ? (
            <SignupCTA tierKey={tierKey} />
          ) : (
            <EmbeddedCheckoutShell checkoutElement={checkoutElement} />
          )}
        </div>

        {/* Trust footer — compact, respects iPhone home indicator safe area */}
        <div className="shrink-0 border-t border-border bg-muted/30 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure Stripe checkout
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Cancel any time · One click
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SignupCTA({ tierKey }: { tierKey: TierKey }) {
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-glow">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-lg font-bold tracking-tight">Create an account to continue</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Takes 30 seconds. After signup, we'll bring you right back to checkout for this tier — no need to click around.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild className="bg-gradient-primary">
          <Link to="/signup" search={{ upgrade: tierKey } as any}>
            Sign up & continue <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/login" search={{ upgrade: tierKey } as any}>
            I already have an account
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmbeddedCheckoutShell({ checkoutElement }: { checkoutElement: React.ReactNode | null }) {
  if (!checkoutElement) {
    return (
      <div className="grid place-items-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <div className="-m-2 rounded-xl">{checkoutElement}</div>;
}
