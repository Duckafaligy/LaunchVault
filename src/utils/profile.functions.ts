// =====================================================================
// Profile self-service server functions
//
// Why server functions instead of direct browser calls? RLS + session
// edge cases. Server fns use supabaseAdmin which bypasses RLS, and
// auth middleware guarantees we know who the caller is. Errors come
// back as clean strings instead of opaque Supabase codes.
// =====================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const NameSchema = z.object({
  name: z.string().trim().max(80),
});

const EmailSchema = z.object({
  email: z.string().email().max(200),
});

const PasswordSchema = z.object({
  password: z.string().min(8).max(200),
});

/** Update the caller's display name. Writes to profiles.full_name (the source
 *  of truth everything in the dashboard reads from) AND mirrors it onto the
 *  auth user_metadata so the two never drift. */
export const updateProfileName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => NameSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const name = data.name || null;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: name, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);

    // Mirror onto auth metadata (best-effort — non-fatal if it fails).
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: name },
      });
    } catch {/* non-fatal */}

    return { ok: true as const, name: data.name };
  });

/** Update the auth email for the caller. Uses the admin API which doesn't
 *  require email confirmation if SMTP isn't configured. */
export const updateAuthEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => EmailSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const cleaned = data.email.trim().toLowerCase();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: cleaned,
      email_confirm: true, // immediate change — skip confirmation while SMTP isn't fully wired
    });
    if (error) throw new Error(error.message);

    // Keep profiles.email in sync with the auth email (best-effort).
    try {
      await supabaseAdmin
        .from("profiles")
        .update({ email: cleaned, updated_at: new Date().toISOString() })
        .eq("id", userId);
    } catch {/* non-fatal */}

    return { ok: true as const, email: cleaned };
  });

/** Update the auth password for the caller. */
export const updateAuthPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PasswordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * Verified password change — requires the user's CURRENT password before
 * accepting a new one. Prevents account hijacks via stolen sessions.
 *
 * Flow: signInWithPassword(current_password) → if ok → updateUserById(new).
 */
const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export const changePasswordVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PasswordChangeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Look up the caller's email from the auth tables
    const { data: userRow, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getErr || !userRow?.user?.email) {
      throw new Error("Could not find your account email");
    }
    const email = userRow.user.email;

    // Verify the current password by trying to sign in with it.
    // Use a throwaway client so we don't touch the user's existing session.
    const probeClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: probeErr } = await probeClient.auth.signInWithPassword({
      email,
      password: data.currentPassword,
    });
    if (probeErr) {
      throw new Error("Current password is incorrect");
    }

    // Verified — now update password via admin API
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.newPassword,
    });
    if (updateErr) throw new Error(updateErr.message);
    return { ok: true as const };
  });

/**
 * Permanently delete the caller's account + all their data.
 *
 * Requires:
 *  - Their email typed into a confirm input
 *  - Acknowledgement of the data-deletion notice
 *
 * Steps:
 *  1. Cancel any active Stripe subscriptions
 *  2. Delete app rows tied to the user (cascade does most of it)
 *  3. Delete the auth.users record (kicks all sessions)
 */
const DeleteAccountSchema = z.object({
  confirmEmail: z.string().email().max(200),
  acknowledgedTerms: z.literal(true),
});

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DeleteAccountSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Step 0: verify the typed email matches the account's email
    const { data: userRow, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getErr || !userRow?.user?.email) throw new Error("Could not find your account");
    const accountEmail = userRow.user.email.toLowerCase();
    if (data.confirmEmail.trim().toLowerCase() !== accountEmail) {
      throw new Error("Confirmation email doesn't match your account email");
    }

    // Step 1: cancel any active Stripe subscriptions
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.stripe_subscription_id) {
      try {
        const stripeKey = process.env.STRIPE_LIVE_SECRET_KEY;
        if (stripeKey) {
          await fetch(
            `https://api.stripe.com/v1/subscriptions/${profile.stripe_subscription_id}`,
            { method: "DELETE", headers: { Authorization: `Bearer ${stripeKey}` } },
          );
        }
      } catch {/* best-effort */}
    }

    // Step 2: delete all user-scoped rows. Most tables have ON DELETE CASCADE
    // from profiles.id → auth.users.id but we hit them explicitly to be safe.
    const tables = [
      "saved_items", "user_content_unlocks",
      "course_progress", "content_interactions",
      "user_preferences", "user_roles", "payment_events", "page_views",
    ];
    for (const t of tables) {
      await supabaseAdmin.from(t as any).delete().eq("user_id", userId);
    }
    // profiles uses `id` as the FK to auth.users, not `user_id`
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Step 3: delete the auth user (kicks all sessions, frees the email)
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw new Error(delErr.message);

    return { ok: true as const };
  });
