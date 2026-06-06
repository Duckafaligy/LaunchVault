#!/usr/bin/env node
// Quick read-only query helper. Loads .env.local, connects via pooler,
// runs the SQL passed as argv[2..] joined.
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

const query = process.argv.slice(2).join(" ");
if (!query) {
  console.error("Usage: node scripts/query-db.mjs '<SQL>'");
  process.exit(1);
}
const rows = await sql.unsafe(query);
console.log(JSON.stringify(rows, null, 2));
await sql.end();
