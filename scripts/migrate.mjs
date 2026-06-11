// scripts/migrate.mjs — applies SQL migrations in supabase/migrations to the
// remote Supabase Postgres, in filename order, exactly once each.
//
// Usage:  node scripts/migrate.mjs
// Needs:  SUPABASE_DB_URL in .env.local — the Postgres connection string from
//         Supabase → Project Settings → Database → Connection string (URI).
//
// Safe to run repeatedly: applied migrations are tracked in a
// `schema_migrations` table and skipped on subsequent runs.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const migrationsDir = join(root, "supabase", "migrations");

// Minimal .env.local loader (so `node scripts/migrate.mjs` just works).
function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* no .env.local — rely on real env vars */
  }
}

async function main() {
  loadEnv();
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error(
      "\n❌ SUPABASE_DB_URL manquant.\n" +
        "   Ajoute-le dans .env.local :\n" +
        "   SUPABASE_DB_URL=postgresql://postgres.<ref>:<MOT_DE_PASSE>@<host>.supabase.com:5432/postgres\n" +
        "   (Supabase → Project Settings → Database → Connection string → URI)\n",
    );
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }, // Supabase requires TLS
  });

  await client.connect();
  console.log("🔌 Connecté à la base.");

  await client.query(`
    create table if not exists public.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = new Set(
    (await client.query("select name from public.schema_migrations")).rows.map((r) => r.name),
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭️  ${file} (déjà appliquée)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    process.stdout.write(`▶️  ${file} … `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public.schema_migrations(name) values ($1)", [file]);
      await client.query("commit");
      console.log("✅");
      ran++;
    } catch (err) {
      await client.query("rollback");
      console.log("❌");
      console.error(`\nÉchec sur ${file}:\n${err.message}\n`);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log(ran ? `\n🎉 ${ran} migration(s) appliquée(s).` : "\n✨ Base déjà à jour.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
