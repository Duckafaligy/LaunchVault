// =====================================================================
// PUBLIC content access — no auth required.
//
// These functions exist so search-engine crawlers (Googlebot, Bingbot)
// AND logged-out humans can land on /library/$slug pages.
// The HTML returned always contains the FULL article body — Google
// crawls and indexes everything. A client-side <PaywallGate> component
// is what visually overlays a "Get full access" CTA on non-subscribers.
//
// This is the same "Flexible Sampling" pattern Substack / NYT / Stratechery
// use. The content is in the HTML, the paywall is a UI affordance.
// =====================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const SlugSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-zA-Z0-9_-]+$/),
});

const ListSchema = z.object({
  type: z.string().optional(),
  domain: z.string().min(1).max(120).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
  // When true, only return free-tier items (used by the public /library so
  // logged-out visitors browse free content only; paid items stay reachable
  // via direct /library/$slug URLs + sitemap, behind the paywall, for SEO).
  freeOnly: z.boolean().optional(),
});

/**
 * Fetch a single published item + full payload by slug.
 * No auth. Returns the same shape as getContentPayload but always unlocked.
 *
 * Used by SSR loaders on the public `/library/$slug` route.
 */
export const getPublicContentBySlug = createServerFn({ method: "GET" })
  .inputValidator((input) => SlugSchema.parse(input))
  .handler(async ({ data }) => {
    const { slug } = data;

    const { data: item } = await supabaseAdmin
      .from("content_items")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!item) return null;

    const { data: payload } = await supabaseAdmin
      .from("content_payloads")
      .select(
        "code, prompt, preview_html, course_sections, lesson_content, extra, workflow_payload, agent_payload, insight_payload, business_payload, tool_payload, playbook_payload, challenge_payload, cheatsheet_payload",
      )
      .eq("content_id", item.id)
      .maybeSingle();

    return { item, payload: payload ?? null };
  });

/**
 * Fetch a paginated list of published items for the public library index.
 * No auth. Returns lightweight cards (no payload — just metadata + preview).
 */
export const listPublicLibrary = createServerFn({ method: "GET" })
  .inputValidator((input) => ListSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("content_items")
      .select(
        "id, slug, type, title, description, short_description, preview_text, " +
          "tier_required, category, domain, difficulty, estimated_minutes, tags, " +
          "is_featured, is_daily, created_at",
      )
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.type) q = q.eq("type", data.type as Database["public"]["Enums"]["content_type"]);
    if (data.domain) q = q.eq("domain", data.domain);
    if (data.freeOnly) q = q.eq("tier_required", "free");
    q = q.limit(data.limit ?? 60);

    const { data: items } = await q;
    return items ?? [];
  });

/**
 * Slug lookup for sitemap generation. Returns every published item's
 * slug + updated_at so we can emit a fresh sitemap entry per content URL.
 */
export const getAllPublicSlugs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("content_items")
      .select("slug, domain, type, updated_at")
      .eq("is_published", true)
      .not("slug", "is", null);
    return data ?? [];
  });
