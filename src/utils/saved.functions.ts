// =====================================================================
// Save to Vault — server functions
//
// toggleSavedItem  — flip the saved state for the caller (auth required)
// getSavedStatus   — check whether the caller has saved one content_id
// removeSavedItem  — explicit unsave (used by the vault page bulk actions)
// =====================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const IdInput = z.object({
  contentId: z.string().min(1).max(255).regex(/^[a-zA-Z0-9_-]+$/),
});

/**
 * Toggle saved state. Returns { saved: boolean } reflecting the NEW state.
 * Idempotent — calling twice cycles save → unsave → save.
 */
export const toggleSavedItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { contentId } = data;

    // First check if it's already saved
    const { data: existing } = await supabaseAdmin
      .from("saved_items")
      .select("id")
      .eq("user_id", userId)
      .eq("content_id", contentId)
      .maybeSingle();

    if (existing) {
      // Unsave
      await supabaseAdmin.from("saved_items").delete().eq("id", existing.id);
      return { saved: false as const };
    }

    // Save
    const { error } = await supabaseAdmin
      .from("saved_items")
      .insert({ user_id: userId, content_id: contentId });
    if (error) {
      // PG23505 = unique violation: already saved → treat as success
      if ((error as any).code === "23505") return { saved: true as const };
      throw new Error(error.message);
    }
    return { saved: true as const };
  });

/**
 * Check whether one content item is saved by the caller.
 * Lightweight — single row query, used to render the save button state.
 */
export const getSavedStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: row } = await supabaseAdmin
      .from("saved_items")
      .select("id")
      .eq("user_id", userId)
      .eq("content_id", data.contentId)
      .maybeSingle();
    return { saved: !!row };
  });

/**
 * Explicit unsave — used by the vault page's bulk-remove flow.
 */
export const removeSavedItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await supabaseAdmin
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .eq("content_id", data.contentId);
    return { ok: true as const };
  });

/**
 * Batch-fetch all saved content_ids for the caller. Used by list views
 * to render the saved-state on every card without N+1 queries.
 */
export const getAllSavedIds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("saved_items")
      .select("content_id")
      .eq("user_id", userId);
    return { ids: (data ?? []).map((r: any) => r.content_id) };
  });
