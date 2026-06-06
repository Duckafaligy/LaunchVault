import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin role required");
}

export const wipeLibrary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    // Use admin client (bypasses RLS) to delete in dependency order.
    await supabaseAdmin.from("content_payloads").delete().neq("content_id", "__never__");
    await supabaseAdmin.from("user_content_unlocks").delete().neq("content_id", "__never__");
    await supabaseAdmin.from("saved_items").delete().neq("content_id", "__never__");
    await supabaseAdmin.from("course_progress").delete().neq("content_id", "__never__");
    await supabaseAdmin.from("content_interactions").delete().neq("content_id", "__never__");
    const { error } = await supabaseAdmin.from("content_items").delete().neq("id", "__never__");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLibraryStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { count: totalItems } = await supabaseAdmin
      .from("content_items")
      .select("*", { count: "exact", head: true });
    const { data: byType } = await supabaseAdmin
      .from("content_items")
      .select("type")
      .limit(10000);
    const counts: Record<string, number> = {};
    (byType ?? []).forEach((r: any) => {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
    });
    const { data: recentRuns } = await supabaseAdmin
      .from("content_generation_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);
    return {
      totalItems: totalItems ?? 0,
      counts,
      recentRuns: recentRuns ?? [],
    };
  });

export const checkIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });
