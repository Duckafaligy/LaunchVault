// Server-side content access functions.
// All gating runs through here — clients never fetch payloads directly.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ContentIdSchema = z.object({
  contentId: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_-]+$/),
});

/**
 * Returns the full content payload only if the caller has access.
 * Access = published AND (admin OR tier-chain access OR already unlocked).
 * Otherwise returns preview-only data + a `locked` flag.
 */
export const getContentPayload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ContentIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { contentId } = data;

    const { data: item, error: itemErr } = await supabaseAdmin
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .eq("is_published", true)
      .maybeSingle();

    if (itemErr || !item) {
      return { locked: true as const, reason: "not_found" as const };
    }

    // Admin override
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;

    // Already unlocked?
    const { data: unlockRow } = await supabaseAdmin
      .from("user_content_unlocks")
      .select("id")
      .eq("user_id", userId)
      .eq("content_id", contentId)
      .maybeSingle();
    const unlocked = !!unlockRow;

    // Tier-chain access (server-side)
    const { data: tierOk } = await supabaseAdmin.rpc("has_tier_access", {
      _user_id: userId,
      _required: item.tier_required,
    });

    const hasAccess = isAdmin || unlocked || tierOk === true;

    if (!hasAccess) {
      return {
        locked: true as const,
        reason: "requires_unlock" as const,
        item: {
          id: item.id,
          title: item.title,
          description: item.description,
          preview_text: item.preview_text,
          tier_required: item.tier_required,
          type: item.type,
        },
      };
    }

    const [{ data: payload }, { data: progress }] = await Promise.all([
      supabaseAdmin
        .from("content_payloads")
        .select(
          "code, prompt, preview_html, course_sections, lesson_content, extra, " +
            "workflow_payload, agent_payload, insight_payload, business_payload, " +
            "tool_payload, playbook_payload, challenge_payload, cheatsheet_payload",
        )
        .eq("content_id", contentId)
        .maybeSingle(),
      supabaseAdmin
        .from("course_progress")
        .select("current_section, completed_sections, total_sections, is_completed, completed_at")
        .eq("user_id", userId)
        .eq("content_id", contentId)
        .maybeSingle(),
    ]);

    // Log a lightweight "view" interaction (best-effort, fire-and-forget)
    void supabaseAdmin.from("content_interactions").insert({
      user_id: userId,
      content_id: contentId,
      interaction_type: "view",
    });

    return {
      locked: false as const,
      item,
      payload: payload ?? null,
      progress: progress ?? null,
    };
  });
