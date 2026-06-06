import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierCheckoutDialog } from "@/components/landing/TierCheckoutDialog";
import { track } from "@/lib/analytics";

export type TierKey = "free" | "tier1" | "tier2" | "tier3";

interface Props {
  name: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  period: string;
  tagline: string;
  features: readonly string[];
  ctaLabel: string;
  ctaTo: string;
  tierKey?: TierKey;
  highlighted?: boolean;
}

export function PricingCard({
  name, price, originalPrice, discountPercent, period, tagline, features, ctaLabel, ctaTo, tierKey, highlighted,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Free tier or no tierKey → fall through to the regular <Link>
    if (!tierKey || tierKey === "free") {
      void track.signupStarted({ from: "pricing_free_cta" });
      return;
    }
    e.preventDefault();
    void track.checkoutOpened({ tier: tierKey, from: "pricing_card" });
    setDialogOpen(true);
  };

  return (
    <>
      <div
        className={`relative flex flex-col rounded-3xl border p-6 transition-all xl:p-7 ${
          highlighted
            ? "border-2 border-primary bg-card shadow-[0_24px_60px_-12px_oklch(0.52_0.26_280/0.35)] xl:-translate-y-2 xl:scale-[1.02]"
            : "border-border bg-card shadow-soft hover:-translate-y-0.5 hover:shadow-elevated"
        }`}
      >
        {highlighted && (
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-primary px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
            Most popular
          </span>
        )}
        <h3 className="text-lg font-bold">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
        <div className="mt-6 flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold tracking-tight xl:text-5xl ${highlighted ? "bg-gradient-primary bg-clip-text text-transparent" : ""}`}>{price}</span>
          {originalPrice && (
            <span className="text-lg font-semibold text-muted-foreground line-through decoration-rose-400/80 decoration-2">{originalPrice}</span>
          )}
          <span className="text-xs text-muted-foreground xl:text-sm">/ {period}</span>
        </div>
        {discountPercent && originalPrice ? (
          <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
            Save {discountPercent}% · launch offer
          </p>
        ) : null}
        <ul className="mt-7 flex-1 space-y-3 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${highlighted ? "bg-primary/15" : "bg-muted"}`}>
                <Check className={`h-3 w-3 ${highlighted ? "text-primary" : "text-muted-foreground"}`} strokeWidth={3} />
              </span>
              <span className={highlighted ? "font-medium text-foreground" : "text-muted-foreground"}>{f}</span>
            </li>
          ))}
        </ul>
        <Button
          asChild
          size="lg"
          className={`mt-8 w-full font-bold ${highlighted ? "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95" : ""}`}
          variant={highlighted ? "default" : "outline"}
        >
          <Link to={ctaTo} onClick={handleClick}>{ctaLabel}</Link>
        </Button>
      </div>

      {/* Modal handles both logged-in (Stripe embedded) + logged-out (signup CTA) flows */}
      <TierCheckoutDialog
        tierKey={tierKey ?? null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
