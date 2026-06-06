#!/usr/bin/env node
// =====================================================================
// LaunchVault — apply combined migration to a fresh Supabase project.
//
// Reads connection info from .env.local. Connects directly via the
// Supabase Postgres TCP endpoint (not the pooler — we want full
// statement support including ALTER TYPE).
// =====================================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnvLocal() {
  const envFile = resolve(ROOT, ".env.local");
  const text = readFileSync(envFile, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (m[1].startsWith("#")) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

loadEnvLocal();

const ref = process.env.SUPABASE_PROJECT_REF;
const primaryPwd = process.env.SUPABASE_DB_PASSWORD;
const fallbackPwd = process.env.SUPABASE_DB_PASSWORD_FALLBACK;

if (!ref) {
  console.error("missing SUPABASE_PROJECT_REF in .env.local");
  process.exit(1);
}
if (!primaryPwd) {
  console.error("missing SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

// Supabase free tier offers direct Postgres on IPv6 only.
// We use the session-mode pooler over IPv4 instead — port 5432 supports
// prepared statements and multi-statement DDL like our migration.
//
// Username for pooler: postgres.<project-ref>
// We don't know the region, so we probe common ones.
const REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "ca-central-1",
  "eu-west-1", "eu-west-2", "eu-central-1", "eu-central-2", "eu-north-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
  "ap-south-1", "sa-east-1",
];

async function tryConnect(host, port, user, password, label) {
  process.stdout.write(`Trying ${label} (${host}:${port})… `);
  const sql = postgres({
    host, port, user, database: "postgres", password,
    ssl: "require", connect_timeout: 8, max: 1,
    prepare: false, // pooler session mode prepared-statements compat
  });
  try {
    const rows = await sql`select current_database() as db, current_user as usr`;
    console.log(`✓ ${rows[0].usr}@${rows[0].db}`);
    return sql;
  } catch (err) {
    console.log(`✗ ${err.message}`);
    await sql.end({ timeout: 1 }).catch(() => {});
    return null;
  }
}

let sql = null;

// 1. Try the standard direct host first (works if user is on IPv6)
sql = await tryConnect(`db.${ref}.supabase.co`, 5432, "postgres", primaryPwd, "direct (primary pwd)");
if (!sql && fallbackPwd) {
  sql = await tryConnect(`db.${ref}.supabase.co`, 5432, "postgres", fallbackPwd, "direct (fallback pwd)");
}

// 2. Probe pooler regions if direct fails. Supabase uses both aws-0 and aws-1
// prefixes depending on project age. Try aws-1 first (newer projects).
const PREFIXES = ["aws-1", "aws-0"];
for (const prefix of PREFIXES) {
  for (const region of REGIONS) {
    if (sql) break;
    const host = `${prefix}-${region}.pooler.supabase.com`;
    const user = `postgres.${ref}`;
    sql = await tryConnect(host, 5432, user, primaryPwd, `pooler ${prefix}/${region} (primary)`);
    if (!sql && fallbackPwd) {
      sql = await tryConnect(host, 5432, user, fallbackPwd, `pooler ${prefix}/${region} (fallback)`);
    }
  }
}
if (!sql) {
  console.error("Could not connect with either password. Reset your DB password in Supabase Settings → Database and update .env.local.");
  process.exit(2);
}

// Pre-flight: how many tables already exist?
const before = await sql`
  select count(*)::int as n
  from information_schema.tables
  where table_schema = 'public'
`;
console.log(`\nPre-migration public table count: ${before[0].n}`);

// Read combined migration
const migrationPath = resolve(ROOT, "scripts", "combined-migration.sql");
const migrationSql = readFileSync(migrationPath, "utf8");
console.log(`Read migration: ${(migrationSql.length / 1024).toFixed(1)} KB`);

// Execute. postgres.js's `.unsafe()` runs raw multi-statement SQL.
console.log("Executing migration…");
try {
  await sql.unsafe(migrationSql);
  console.log("  ✓ migration applied");
} catch (err) {
  console.error("  ✗ migration error:");
  console.error("  ", err.message);
  // Don't bail yet — show what we got. We can re-run.
}

// Verify: list expected tables
const expected = [
  "profiles", "user_roles", "content_items", "content_payloads",
  "packs", "pack_items", "user_content_unlocks", "user_pack_unlocks",
  "credit_transactions", "payment_events", "user_preferences",
  "course_progress", "content_interactions", "saved_items",
  "content_generation_runs", "test_runs", "audit_logs",
];

const tablesRes = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
  order by table_name
`;
const have = new Set(tablesRes.map((r) => r.table_name));
console.log("\nTable check:");
let missing = 0;
for (const t of expected) {
  const ok = have.has(t);
  console.log(`  ${ok ? "✓" : "✗"} ${t}`);
  if (!ok) missing++;
}
console.log(`\nFound ${have.size} public tables. Missing ${missing} expected.`);

// Verify the new columns on content_items
const colCheck = await sql`
  select column_name from information_schema.columns
  where table_schema = 'public'
    and table_name = 'content_items'
    and column_name in ('domain','slug','short_description','is_daily','quality_score','generated_by')
  order by column_name
`;
console.log(`\ncontent_items new columns present: ${colCheck.map((r) => r.column_name).join(", ") || "(none)"}`);

// Verify enum values
const enumCheck = await sql`
  select enumlabel
  from pg_enum
  where enumtypid = 'public.content_type'::regtype
  order by enumlabel
`;
console.log(`content_type enum values: ${enumCheck.map((r) => r.enumlabel).join(", ")}`);

await sql.end();
console.log("\nDone.");
