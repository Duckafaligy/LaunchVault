import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Crown, ExternalLink, Loader2, Flame, Zap, Trophy, Sparkles, ArrowRight,
  Star, Calendar, Clock, GraduationCap, MessageSquareCode,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { brand, TIER_LABEL } from "@/config/brand";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession, cancelSubscription } from "@/utils/payments.functions";
import { getPersonalizedFeed } from "@/utils/learning.functions";
import type { SubscriptionTier } from "@/lib/payment-products";
import { VisitorStats } from "@/components/dashboard/VisitorStats";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";

export const Route = createFileRoute("/dashboard/account")({
  validateSearch: (s: Record<string, unknown>): { upgrade?: string } => ({
    upgrade: typeof s.upgrade === "string" ? s.upgrade : undefined,
  }),
  component: AccountPage,
});

// Source of truth = brand.pricing[tier].priceId. Anything that hardcodes
// price IDs is a bug waiting to happen when prices rotate.
const PRICE_ID_BY_TIER: Record<string, string> = {
  tier1: brand.pricing.tier1.priceId,
  tier2: brand.pricing.tier2.priceId,
  tier3: brand.pricing.tier3.priceId,
};

function AccountPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const portalFn = useServerFn(createPortalSession);
  const cancelFn = useServerFn(cancelSubscription);
  const fetchFeed = useServerFn(getPersonalizedFeed);
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const { upgrade } = Route.useSearch();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: feed } = useQuery({
    queryKey: ["personalized-feed", user?.id],
    enabled: !!user,
    queryFn: () => fetchFeed(),
  });

  const { data: newReleases } = useQuery({
    queryKey: ["new-releases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("content_items")
        .select("id,type,title,description,category,tier_required,estimated_minutes")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient, refetch]);

  // Deep-link upgrade flow: when the user lands on /dashboard/account?upgrade=tierN,
  // auto-open the embedded Stripe checkout for that tier once we know the user
  // is loaded. Strip the param from the URL after firing so a refresh doesn't
  // re-trigger it.
  useEffect(() => {
    if (!upgrade || !user) return;
    const priceId = PRICE_ID_BY_TIER[upgrade];
    if (!priceId) return;
    openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    // Clear the ?upgrade= param so reload doesn't reopen
    navigate({ to: "/dashboard/account", search: {} as any, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgrade, user?.id]);

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const tierLabel = TIER_LABEL[tier];
  const firstName = (profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0]) || "Builder";
  const initial = firstName[0]?.toUpperCase() ?? "U";
  const xp = profile?.xp_points ?? 0;
  const level = Math.max(1, Math.floor(xp / 200) + 1);
  const xpIntoLevel = xp % 200;
  const streak = profile?.current_streak ?? 0;
  const longest = profile?.longest_streak ?? 0;

  const buyOrUpgrade = (priceId: string) => {
    openCheckout({
      priceId,
      customerEmail: user?.email,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const openPortal = async () => {
    try {
      const url = await portalFn({
        data: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/dashboard/account`,
        },
      });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open billing portal");
    }
  };

  const doCancel = async () => {
    setCancelling(true);
    try {
      await cancelFn({ data: { environment: getStripeEnvironment() } });
      toast.success("Subscription canceled — you're back on the Free plan.");
      setCancelOpen(false);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't cancel — try again or email support.");
    } finally {
      setCancelling(false);
    }
  };

  const dailyPicks = (feed?.items ?? []).slice(0, 3);
  const tiers = [brand.pricing.tier1, brand.pricing.tier2, brand.pricing.tier3];

  return (
    <>
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Account self-service — change name, email, password */}
        <ProfileSettings initialName={profile?.full_name} />

        {/* Admin-only visitor stats. Renders nothing for non-admins. */}
        <VisitorStats />

        {/* Overview hero */}
        <section className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-orange-500 p-6 text-white shadow-elevated md:p-8">
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-yellow-300/30 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-violet-400/30 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/20 text-3xl font-bold backdrop-blur ring-2 ring-white/30">
                {initial}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Hi {firstName}</p>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">Level {level} Builder</h1>
                <p className="mt-1 text-xs text-white/80">{user?.email}</p>
                <div className="mt-3 max-w-xs">
                  <div className="flex items-center justify-between text-[10px] text-white/80">
                    <span>{xpIntoLevel} XP</span>
                    <span>{200 - xpIntoLevel} to next level</span>
                  </div>
                  <Progress value={(xpIntoLevel / 200) * 100} className="mt-1 h-2 bg-white/20" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <BigStat icon={Flame} label="Streak" value={streak} suffix={streak === 1 ? "day" : "days"} />
              <BigStat icon={Zap} label="XP" value={xp} />
              <BigStat icon={Trophy} label="Best" value={longest} suffix={longest === 1 ? "day" : "days"} />
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur ring-1 ring-white/25">
              <Crown className="h-3.5 w-3.5" /> {tierLabel} plan
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15">
              <Calendar className="h-3.5 w-3.5" /> Active today
            </span>
          </div>
        </section>

        {/* Daily picks */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Picks for today</p>
              <h2 className="mt-1 text-xl font-bold">Your daily lessons</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Open feed <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          {dailyPicks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
              Complete onboarding to unlock your personalized picks.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {dailyPicks.map((it) => <PickCard key={it.id} item={it} />)}
            </div>
          )}
        </section>

        {/* New releases */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Just dropped</p>
              <h2 className="mt-1 text-xl font-bold">New releases</h2>
            </div>
          </div>
          {!newReleases || newReleases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
              New drops appear here weekly.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {newReleases.map((it: any) => (
                <Link
                  key={it.id}
                  to="/dashboard/content/$id"
                  params={{ id: it.id }}
                  className="group rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
                >
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {it.type === "course" ? <GraduationCap className="h-3 w-3" /> : <MessageSquareCode className="h-3 w-3" />}
                    {it.type} · {it.tier_required}
                  </div>
                  <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold group-hover:text-primary">{it.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.description}</p>
                  {it.estimated_minutes && (
                    <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {it.estimated_minutes} min
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Plans */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold">Subscriptions</h2>
              <p className="mt-1 text-xs text-muted-foreground">Upgrades & downgrades take effect immediately with proration.</p>
            </div>
            {tier !== "free" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={openPortal}>
                  Manage billing <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  className="border-rose-500/40 text-rose-700 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-300"
                >
                  Cancel subscription
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tiers.map((t) => (
              <PlanRow
                key={t.priceId}
                name={t.name}
                price={t.priceLabel}
                originalPrice={"originalPriceLabel" in t ? t.originalPriceLabel : undefined}
                discountPercent={"discountPercent" in t ? t.discountPercent : undefined}
                period="/mo"
                current={tier === t.tierKey}
                highlighted={"highlighted" in t && t.highlighted}
                onChoose={() => buyOrUpgrade(t.priceId)}
                showSwitch={tier !== "free" && tier !== t.tierKey}
              />
            ))}
          </div>
        </section>

        <div>
          <Button variant="outline" onClick={signOut}>Log out</Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent
          className="
            flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden p-0
            sm:max-h-[92dvh]
            max-sm:!fixed max-sm:!inset-0 max-sm:!translate-x-0 max-sm:!translate-y-0
            max-sm:!h-[100dvh] max-sm:!max-h-[100dvh] max-sm:!w-full max-sm:!max-w-none max-sm:!rounded-none
          "
        >
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pt-[max(env(safe-area-inset-top),1rem)]">
            <DialogTitle>Complete your purchase</DialogTitle>
          </DialogHeader>
          {/* Scrollable body so the tall Stripe iframe is fully reachable on iOS */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
            <div className="min-h-[420px]">
              {checkoutElement ?? (
                <div className="grid place-items-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel subscription confirmation */}
      <Dialog open={cancelOpen} onOpenChange={(o) => !cancelling && setCancelOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-xl font-bold tracking-tight">Cancel your {tierLabel} plan?</DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Your subscription ends <strong className="text-foreground">immediately</strong> and you'll move to the Free plan.
            You'll lose access to paid content right away. You can re-subscribe any time.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              Keep my plan
            </Button>
            <Button
              onClick={doCancel}
              disabled={cancelling}
              className="bg-gradient-to-br from-rose-600 to-red-700 text-white hover:opacity-95"
            >
              {cancelling ? (<><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Cancelling…</>) : "Cancel subscription"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BigStat({ icon: Icon, label, value, suffix }: { icon: any; label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur ring-1 ring-white/20">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-xl font-bold leading-tight">
        {value}{suffix && <span className="ml-1 text-[10px] font-medium text-white/70">{suffix}</span>}
      </div>
    </div>
  );
}

function PickCard({ item }: { item: any }) {
  return (
    <Link
      to="/dashboard/content/$id"
      params={{ id: item.id }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3 w-3" /> {item.reason ?? "for you"}
      </div>
      <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold group-hover:text-primary">{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      <div className="mt-auto flex items-center justify-between pt-3 text-[10px] text-muted-foreground">
        <span className="capitalize">{item.type}</span>
        {item.estimated_minutes && (
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {item.estimated_minutes} min</span>
        )}
      </div>
    </Link>
  );
}

function PlanRow({
  name, price, originalPrice, discountPercent, period, current, highlighted, onChoose, showSwitch,
}: {
  name: string; price: string; originalPrice?: string; discountPercent?: number; period: string; current?: boolean;
  highlighted?: boolean; onChoose: () => void; showSwitch?: boolean;
}) {
  const label = current ? "Current" : showSwitch ? "Switch" : "Choose";
  return (
    <div className={`flex items-center justify-between rounded-xl border p-4 ${highlighted ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{price}</span> {period}
          {originalPrice && <span className="ml-1.5 line-through decoration-rose-400/70">{originalPrice}</span>}
          {discountPercent ? <span className="ml-1.5 font-bold text-emerald-600 dark:text-emerald-400">−{discountPercent}%</span> : null}
        </p>
      </div>
      <Button
        size="sm"
        disabled={current}
        onClick={onChoose}
        variant={current ? "outline" : "default"}
        className={!current && highlighted ? "bg-gradient-primary" : ""}
      >
        {label}
      </Button>
    </div>
  );
}
