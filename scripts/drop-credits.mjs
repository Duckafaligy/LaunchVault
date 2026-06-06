#!/usr/bin/env node
// =====================================================================
// LaunchVault — drop the credit system from the database.
//
// Removes (atomically, in one transaction):
//   • RPCs           consume_credits, unlock_content
//   • Tables         credit_transactions, user_pack_unlocks, pack_items, packs
//   • content_items  columns credit_cost, credit_type
//   • profiles       columns prompt_credits, mini_course_credits, main_course_credits
//   • Enums          credit_bucket, credit_txn_type
//   • unlock_type    enum recreated without the 'credit' value (admin | purchase)
//   • Repairs the protect_profile_fields trigger fn (drops credit-column guards)
//
// Pre-verified safe: all credit-pack tables and user_content_unlocks are empty,
// no views/policies reference the credit columns, and the only function that
// mentions credits is protect_profile_fields (rewritten below).
//
// Idempotent: every drop uses IF EXISTS; the unlock_type rebuild is guarded on
// the 'credit' label still existing. Wrapped in BEGIN/COMMIT — any failure
// rolls the whole thing back, leaving the DB untouched.
//
// Usage:  node scripts/drop-credits.mjs
// =====================================================================
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const text = readFileSync(resolve(ROOT, ".env.local"), "utf8");
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (!m || m[1].startsWith("#")) continue;
  if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const ref = process.env.SUPABASE_PROJECT_REF;
const password = process.env.SUPABASE_DB_PASSWORD;
const host = process.env.SUPABASE_POOLER_HOST;
const sql = postgres({
  host, port: 5432,
  user: `postgres.${ref}`,
  database: "postgres",
  password,
  ssl: "require",
  connect_timeout: 10,
  max: 1,
  prepare: false,
});

const MIGRATION = `
BEGIN;

-- 1) Drop credit RPCs (robust against any overload signature)
DO $mig$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'public.' || quote_ident(p.proname) || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN ('consume_credits','unlock_content')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
  END LOOP;
END
$mig$;

-- 2) Drop the credit-pack subsystem tables (CASCADE clears FKs + RLS policies)
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.user_pack_unlocks CASCADE;
DROP TABLE IF EXISTS public.pack_items CASCADE;
DROP TABLE IF EXISTS public.packs CASCADE;

-- 3) Drop credit columns from content_items (credit_type uses the credit_bucket enum)
ALTER TABLE public.content_items DROP COLUMN IF EXISTS credit_cost;
ALTER TABLE public.content_items DROP COLUMN IF EXISTS credit_type;

-- 4) Repair the profiles guard trigger BEFORE dropping the columns it pins.
--    (A plpgsql function body is not dependency-tracked, so a stale reference
--     would only fail at the next profile UPDATE — fix it up front.)
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $fn$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier        := OLD.subscription_tier;
  NEW.subscription_status      := OLD.subscription_status;
  NEW.stripe_customer_id       := OLD.stripe_customer_id;
  NEW.stripe_subscription_id   := OLD.stripe_subscription_id;
  NEW.current_period_end       := OLD.current_period_end;
  NEW.current_streak           := OLD.current_streak;
  NEW.longest_streak           := OLD.longest_streak;
  NEW.last_active_date         := OLD.last_active_date;
  NEW.xp_points                := OLD.xp_points;
  RETURN NEW;
END;
$fn$;

-- 5) Drop credit columns from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS prompt_credits;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS mini_course_credits;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS main_course_credits;

-- 6) Drop the now-orphaned credit enums
DROP TYPE IF EXISTS public.credit_bucket;
DROP TYPE IF EXISTS public.credit_txn_type;

-- 7) Remove the 'credit' value from unlock_type by recreating the enum.
--    user_content_unlocks is the only remaining consumer (empty, no default).
DO $ut$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'public.unlock_type'::regtype AND enumlabel = 'credit'
  ) THEN
    UPDATE public.user_content_unlocks SET unlock_type = 'admin' WHERE unlock_type = 'credit';
    ALTER TYPE public.unlock_type RENAME TO unlock_type__old;
    CREATE TYPE public.unlock_type AS ENUM ('admin','purchase');
    ALTER TABLE public.user_content_unlocks
      ALTER COLUMN unlock_type TYPE public.unlock_type
      USING unlock_type::text::public.unlock_type;
    DROP TYPE public.unlock_type__old;
  END IF;
END
$ut$;

COMMIT;
`;

console.log("Connecting…");
const who = await sql`select current_user as usr, current_database() as db`;
console.log(`  ✓ ${who[0].usr}@${who[0].db}`);

console.log("Applying credit-removal migration (transactional)…");
try {
  await sql.unsafe(MIGRATION);
  console.log("  ✓ migration committed");
} catch (err) {
  console.error("  ✗ migration failed — transaction rolled back, DB unchanged:");
  console.error("   ", err.message);
  await sql.end();
  process.exit(1);
}

// ---- Verify ----
const tables = await sql`
  select table_name from information_schema.tables
  where table_schema='public'
    and table_name in ('packs','pack_items','user_pack_unlocks','credit_transactions')`;
const cols = await sql`
  select table_name, column_name from information_schema.columns
  where table_schema='public'
    and ((table_name='content_items' and column_name in ('credit_cost','credit_type'))
      or (table_name='profiles' and column_name in ('prompt_credits','mini_course_credits','main_course_credits')))`;
const fns = await sql`
  select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and proname in ('consume_credits','unlock_content')`;
const enums = await sql`
  select typname from pg_type where typname in ('credit_bucket','credit_txn_type')`;
const unlockLabels = await sql`
  select enumlabel from pg_enum where enumtypid='public.unlock_type'::regtype order by enumsortorder`;
const guardHasCredit = await sql`
  select pg_get_functiondef('public.protect_profile_fields'::regproc) ilike '%credit%' as has_credit`;

console.log("\nVerification:");
console.log(`  credit-pack tables remaining : ${tables.map(r=>r.table_name).join(', ') || '(none) ✓'}`);
console.log(`  credit columns remaining     : ${cols.map(r=>r.table_name+'.'+r.column_name).join(', ') || '(none) ✓'}`);
console.log(`  credit RPCs remaining        : ${fns.map(r=>r.proname).join(', ') || '(none) ✓'}`);
console.log(`  credit enums remaining       : ${enums.map(r=>r.typname).join(', ') || '(none) ✓'}`);
console.log(`  unlock_type labels           : ${unlockLabels.map(r=>r.enumlabel).join(', ')}`);
console.log(`  guard fn still mentions credit: ${guardHasCredit[0].has_credit ? 'YES ✗' : 'no ✓'}`);

await sql.end();
console.log("\nDone.");
