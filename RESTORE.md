# 🔄 Sauvegarde & réinstallation du projet (portabilité)

Ce projet peut être **entièrement reconstruit sur un autre hébergeur**. Il est composé de 4 briques :

| Brique | Où c'est | Sauvegardé par |
|---|---|---|
| **Code** | Repo Git (`animateur-reseau-pa`) | `git` (déjà) |
| **Schéma de base** | `src/supabase/migrations/*.sql` | `git` (déjà) |
| **Données de la base** | Postgres Supabase | `scripts/backup.mjs` → `database.sql` |
| **Fichiers** | Supabase Storage (buckets) | `scripts/backup.mjs` → `storage/` |
| **Variables d'env** | Hébergeur (Vercel) | à reporter à la main (liste plus bas) |

Stack : **Next.js 16** (Node ≥ 20) + **Supabase** (Postgres + Storage). Auth maison par cookie (pas Supabase Auth → rien à migrer). APIs tierces : Resend (emails), OpenChargeMap (bornes), Nominatim + tuiles OSM (gratuits, sans compte).

---

## 1. Faire une sauvegarde

```bash
cp .env.backup.example .env.backup     # puis remplis DATABASE_URL + service_role
npm run backup                          # → backups/AAAA-MM-JJ-HH-MM-SS/
```

Produit un dossier daté avec : `database.sql`, `storage/<bucket>/…`, `migrations/`, `ENV_REQUISES.txt`.
Pré-requis pour le dump base : **`pg_dump`** (PostgreSQL client tools) dans le PATH.
*Sans pg_dump* → alternative avec la Supabase CLI :
```bash
supabase db dump --db-url "$DATABASE_URL" -f backups/database.sql
```

> 💡 À faire régulièrement (ex. 1×/semaine et avant toute grosse modif). Garde les dossiers `backups/` ailleurs que sur ce seul PC (disque externe / cloud perso).

---

## 2. Réinstaller le projet ailleurs

### a) Le code
```bash
git clone <url-du-repo> animateur-pa && cd animateur-pa
npm install
```

### b) La base de données
Crée un Postgres (un **nouveau projet Supabase**, ou tout autre Postgres : Neon, Railway, VPS…).

- **Repartir du backup** (schéma + données) :
  ```bash
  psql "<NOUVELLE_DATABASE_URL>" -f backups/<date>/database.sql
  ```
- **Ou** repartir du schéma vierge puis ré-importer les données :
  applique chaque fichier de `src/supabase/migrations/*.sql` dans l'éditeur SQL, puis importe les données du dump.

### c) Les fichiers (Storage)
Recrée les **buckets** puis ré-uploade les fichiers de `backups/<date>/storage/` :

- Buckets utilisés : **`photos-remontees`**, **`news-images`**, **`notes-vocales`** (publics).
- Les policies/buckets sont décrits dans `src/supabase/migrations/` (ex. `add_notes_vocales.sql`). Crée les autres buckets en public + policies équivalentes.
- Ré-upload : via le dashboard Storage (glisser-déposer) ou un petit script `supabase-js` (service_role) qui parcourt le dossier `storage/`.

### d) Les variables d'environnement
Configure ces **9 variables** sur le nouvel hébergeur (cf. `ENV_REQUISES.txt`) :
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
OPENCHARGEMAP_API_KEY
RESEND_API_KEY
RESEND_FROM
NEXT_PUBLIC_ANIMATEUR_EMAIL
NEXT_PUBLIC_ANIMATEUR_TEL
NEXT_PUBLIC_APP_URL          # = l'URL publique du nouvel hébergeur
CRON_SECRET
```
> Les `NEXT_PUBLIC_*` sont intégrées **au build** → toujours redéployer après modif.
> Pense aussi au paramètre **`animateur_email`** dans la page Paramètres (destinataire des emails) — il est en base, donc restauré avec le dump.

### e) Build & run (n'importe quel host Node)
```bash
npm run build
npm start            # sert sur le port 3000
```
Compatible **Netlify, Railway, Render, Fly.io, un VPS, ou Docker** — tout ce qui exécute Node/Next.js. (Sur Vercel : connecter le repo, c'est tout.)

### f) Tâche planifiée (cron « Préparation J-1 »)
La route `src/app/api/cron/preparation-j1/route.ts` est protégée par `CRON_SECRET`. Sur le nouvel hébergeur, planifie un appel quotidien :
```
POST /api/cron/preparation-j1   header: Authorization: Bearer <CRON_SECRET>
```
(Sur Vercel : `vercel.json` → section `crons`. Ailleurs : cron du host, GitHub Action planifiée, ou un service type cron-job.org.)

---

## 3. À adapter si tu quittes Vercel
- `vercel.json` (crons, headers) → équivalent du nouvel hébergeur.
- L'auto-déploiement Git → à reconfigurer côté nouvel host.
- Rien d'autre n'est verrouillé à Vercel (pas d'Edge Config, KV, etc. spécifiques).

---

✅ Avec un dossier `backups/<date>/` récent + ce guide, le projet est **100 % reconstructible** sur une autre infra.
