// Public library listings + unlock action. All gating server-side.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CONTENT_TYPES = [
  "template",
  "prompt",
  "course",
  "workflow",
  "agent",
  "business_lesson",
  "insight",
  "tool_guide",
  "playbook",
  "challenge",
  "cheatsheet",
  "glossary",
  "essay",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

const ListSchema = z.object({
  type: z.enum(CONTENT_TYPES).optional(),
  types: z.array(z.enum(CONTENT_TYPES)).optional(),
  course_size: z.enum(["mini", "main"]).optional(),
  domain: z.string().min(1).max(120).optional(),
  is_daily: z.boolean().optional(),
  // Ceiling per request. Raised from 200 → 2000: the library grows ~80+/day,
  // so a 200 cap made "browse all" silently stop at 200 while the real count
  // (577+) climbed. 2000 covers the full library with weeks of runway.
  limit: z.number().int().min(1).max(2000).optional(),
});

export type LibraryItem = {
  id: string;
  slug: string | null;
  type: string;
  course_size: string | null;
  title: string;
  description: string;
  short_description: string | null;
  preview_text: string;
  tier_required: string;
  category: string;
  domain: string | null;
  difficulty: string | null;
  estimated_minutes: number | null;
  tags: string[];
  thumbnail_url: string | null;
  is_featured: boolean;
  is_daily: boolean;
  is_new: boolean;
  created_at: string;
  locked: boolean;
  unlocked_by: string | null;
};

export const listLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ListSchema.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<LibraryItem[]> => {
    const { userId } = context;

    let q = supabaseAdmin
      .from("content_items")
      .select(
        "id, slug, type, course_size, title, description, short_description, " +
          "preview_text, tier_required, category, " +
          "domain, difficulty, estimated_minutes, tags, thumbnail_url, " +
          "is_featured, is_daily, created_at",
      )
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.type) q = q.eq("type", data.type);
    if (data.types?.length) q = q.in("type", data.types);
    if (data.course_size) q = q.eq("course_size", data.course_size);
    if (data.domain) q = q.eq("domain", data.domain);
    if (data.is_daily) q = q.eq("is_daily", true);
    if (data.limit) q = q.limit(data.limit);

    const [{ data: items }, { data: profile }, { data: unlocks }, { data: roleRow }] =
      await Promise.all([
        q,
        supabaseAdmin
          .from("profiles")
          .select("subscription_tier, subscription_status")
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("user_content_unlocks")
          .select("content_id, unlock_type")
          .eq("user_id", userId),
        supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle(),
      ]);

    const unlockedMap = new Map<string, string>();
    (unlocks ?? []).forEach((u: any) =>
      unlockedMap.set(u.content_id, u.unlock_type),
    );

    const rank: Record<string, number> = {
      free: 0,
      tier1: 1,
      tier2: 2,
      tier3: 3,
      tier4: 4,
    };
    // Admins bypass all tier gating
    const isAdmin = !!roleRow;
    const userRank = isAdmin
      ? 99 // any int >= max tier rank
      : profile && profile.subscription_status === "active"
        ? (rank[profile.subscription_tier as string] ?? 0)
        : 0;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    return (items ?? []).map((it: any) => {
      const requiredRank = rank[it.tier_required] ?? 0;
      const hasTier = userRank >= requiredRank || it.tier_required === "free";
      const directUnlock = unlockedMap.get(it.id) ?? null;
      const locked = !(hasTier || !!directUnlock);
      const createdMs = new Date(it.created_at).getTime();
      return {
        id: it.id,
        slug: it.slug ?? null,
        type: it.type,
        course_size: it.course_size,
        title: it.title,
        description: it.description,
        short_description: it.short_description ?? null,
        preview_text: it.preview_text,
        tier_required: it.tier_required,
        category: it.category,
        domain: it.domain ?? null,
        difficulty: it.difficulty ?? null,
        estimated_minutes: it.estimated_minutes ?? null,
        tags: Array.isArray(it.tags) ? it.tags : [],
        thumbnail_url: it.thumbnail_url ?? null,
        is_featured: !!it.is_featured,
        is_daily: !!it.is_daily,
        is_new: !isNaN(createdMs) && createdMs > oneDayAgo,
        created_at: it.created_at,
        locked,
        unlocked_by: hasTier ? "subscription" : directUnlock,
      } as LibraryItem;
    });
  });
