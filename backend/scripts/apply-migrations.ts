/**
 * Applies backend/supabase/migrations/*.sql to the database in filename order.
 * Tracks applied migrations in public._migrations so re-runs are no-ops.
 *
 * Usage:
 *   DIRECT_URL=postgresql://... npx tsx scripts/apply-migrations.ts
 * (DIRECT_URL must be the session-mode / direct connection, not the
 *  transaction pooler, since migrations run DDL.)
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Set DIRECT_URL to the direct Postgres connection string.");
  process.exit(1);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");

async function main() {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(
      `create table if not exists public._migrations (
         name text primary key,
         applied_at timestamptz not null default now()
       )`,
    );
    const applied = new Set(
      (await client.query("select name from public._migrations")).rows.map((r) => r.name),
    );

    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`↷ ${file} (already applied)`);
        continue;
      }
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      console.log(`→ applying ${file}...`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into public._migrations (name) values ($1)", [file]);
        await client.query("commit");
        console.log(`  ✓ ${file}`);
      } catch (e) {
        await client.query("rollback");
        throw new Error(`${file} failed: ${(e as Error).message}`);
      }
    }
    console.log("✅ migrations up to date");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
