#!/usr/bin/env node
/**
 * Sauvegarde complète du projet → dossier daté backups/<horodatage>/
 *  - database.sql      : dump SQL complet de la base (pg_dump)
 *  - storage/<bucket>/ : tous les fichiers uploadés (photos, news, audios)
 *  - migrations/       : le schéma SQL versionné
 *  - ENV_REQUISES.txt  : la liste des variables d'environnement à reconfigurer
 *
 * Pré-requis :
 *  1. Un fichier .env.backup à la racine (voir .env.backup.example) — JAMAIS commité.
 *  2. `pg_dump` dans le PATH (PostgreSQL client tools) pour le dump base.
 *     Alternative sans pg_dump : `supabase db dump` (voir RESTORE.md).
 *
 * Lancement :  npm run backup   (ou:  node scripts/backup.mjs)
 */
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// ── Charge .env.backup (parsing minimal, sans dépendance) ──────────────────────
const envPath = path.resolve(process.cwd(), ".env.backup");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").replace(/\r$/, "").trim();
  }
}

const DB_URL = process.env.DATABASE_URL;
const SB_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const outDir = path.resolve(process.cwd(), "backups", stamp);
fs.mkdirSync(outDir, { recursive: true });
console.log(`\n📦 Sauvegarde → ${outDir}\n`);

// ── 1. Dump base de données ────────────────────────────────────────────────────
if (DB_URL) {
  const sqlFile = path.join(outDir, "database.sql");
  console.log("🗄️  Dump base (pg_dump)…");
  const r = spawnSync(
    "pg_dump",
    [DB_URL, "--no-owner", "--no-privileges", "--clean", "--if-exists", "-f", sqlFile],
    { stdio: "inherit", shell: true }
  );
  if (r.status === 0) console.log(`   ✅ ${sqlFile}\n`);
  else
    console.log(
      "   ⚠️  pg_dump indisponible/échec. Installe les outils PostgreSQL, ou utilise `supabase db dump` (voir RESTORE.md).\n"
    );
} else {
  console.log("⚠️  DATABASE_URL absent de .env.backup → dump base sauté.\n");
}

// ── 2. Fichiers Storage ────────────────────────────────────────────────────────
if (SB_URL && SB_KEY) {
  const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false } });
  const { data: buckets, error } = await sb.storage.listBuckets();
  if (error) {
    console.log("⚠️  Buckets illisibles :", error.message, "\n");
  } else {
    for (const b of buckets) {
      let n = 0;
      const walk = async (prefix) => {
        const { data: items } = await sb.storage.from(b.name).list(prefix, { limit: 1000 });
        for (const it of items ?? []) {
          const full = prefix ? `${prefix}/${it.name}` : it.name;
          if (it.id === null) {
            await walk(full); // dossier → récursion
            continue;
          }
          const { data: blob } = await sb.storage.from(b.name).download(full);
          if (blob) {
            const dest = path.join(outDir, "storage", b.name, full);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.writeFileSync(dest, Buffer.from(await blob.arrayBuffer()));
            n++;
          }
        }
      };
      console.log(`🖼️  Bucket "${b.name}"…`);
      await walk("");
      console.log(`   ✅ ${n} fichier(s)\n`);
    }
  }
} else {
  console.log("⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absents → fichiers Storage sautés.\n");
}

// ── 3. Schéma (migrations) + liste des variables d'env ─────────────────────────
const migSrc = path.resolve(process.cwd(), "src/supabase/migrations");
if (fs.existsSync(migSrc)) {
  fs.cpSync(migSrc, path.join(outDir, "migrations"), { recursive: true });
  console.log("📜 Migrations (schéma) copiées.\n");
}

fs.writeFileSync(
  path.join(outDir, "ENV_REQUISES.txt"),
  `Variables d'environnement à reconfigurer sur le nouvel hébergeur (valeurs à reporter à la main) :

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
OPENCHARGEMAP_API_KEY
RESEND_API_KEY
RESEND_FROM
NEXT_PUBLIC_ANIMATEUR_EMAIL
NEXT_PUBLIC_ANIMATEUR_TEL
NEXT_PUBLIC_APP_URL
CRON_SECRET
`
);

console.log("✅ Sauvegarde terminée. Voir RESTORE.md pour réinstaller ailleurs.\n");
