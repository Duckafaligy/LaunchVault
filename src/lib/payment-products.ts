// Shared mapping for payment products — used by client UI + webhook handler.
// Stripe lookup_keys are stable; price_ids may change if prices are
// regenerated.
//
// v4 / v3 suffixes are the LIVE current keys (Jun 2026): Starter $5,
// Creator $12, Pro $30. (The tier4 "Master" $50 plan was retired from the
// lineup — its mapping is kept below for routing safety only and is no
// longer offered for purchase.) Earlier suffixes are DEACTIVATED in Stripe
// and kept only so the webhook can still route any grandfathered subscriber
// (there are none today). New sign-ups only ever use the v4/v3 keys below.

export type SubscriptionPriceId =
  // Current (v4 / v3) — what new sign-ups use
  | "tier1_monthly_v4"   // $5 / mo  (Starter)
  | "tier2_monthly_v4"   // $12 / mo (Creator)
  | "tier3_monthly_v3"   // $30 / mo (Pro)
  | "tier4_monthly_v3"   // $50 / mo (Master)
  // Legacy — deactivated in Stripe, kept for webhook routing only
  | "tier1_monthly_v3"
  | "tier2_monthly_v3"
  | "tier3_monthly_v2"
  | "tier4_monthly_v2"
  | "starter_monthly"
  | "creator_monthly"
  | "pro_monthly"
  | "tier1_monthly_v2"
  | "tier2_monthly_v2"
  | "tier3_monthly"
  | "tier4_monthly"
  | "tier1_monthly"
  | "tier2_monthly";

export type SubscriptionTier = "free" | "tier1" | "tier2" | "tier3" | "tier4";

export const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  // Current (v4 / v3) — what new sign-ups will hit
  tier1_monthly_v4: "tier1",
  tier2_monthly_v4: "tier2",
  tier3_monthly_v3: "tier3",
  tier4_monthly_v3: "tier4",
  // Legacy mappings — grandfathered subscribers keep their access
  tier1_monthly_v3: "tier1",
  tier2_monthly_v3: "tier2",
  tier3_monthly_v2: "tier3",
  tier4_monthly_v2: "tier4",
  starter_monthly: "tier1",
  creator_monthly: "tier2",
  pro_monthly: "tier3",
  tier1_monthly_v2: "tier1",
  tier2_monthly_v2: "tier2",
  tier3_monthly: "tier3",
  tier4_monthly: "tier4",
  tier1_monthly: "tier1",
  tier2_monthly: "tier2",
};


export const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  tier1: 1,
  tier2: 2,
  tier3: 3,
  tier4: 4,
};

export function hasTierAccess(
  userTier: SubscriptionTier,
  required: SubscriptionTier,
): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}
