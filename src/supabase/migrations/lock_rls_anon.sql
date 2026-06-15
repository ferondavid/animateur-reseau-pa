-- ═══════════════════════════════════════════════════════════════════════
-- SECURITY LOCKDOWN — RLS deny-by-default
-- Idempotent : re-jouable sans erreur.
-- À coller dans Supabase Studio → SQL Editor → Run.
-- service_role (clé serveur) bypass RLS → le serveur continue de tout lire/écrire.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. Activer RLS sur toutes les tables métier ─────────────────────────────

ALTER TABLE IF EXISTS magasins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS visites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evaluations_visite ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS actions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS remontees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rendez_vous       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rendez_vous_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ca_mensuel        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS parametres        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes_vocales     ENABLE ROW LEVEL SECURITY;

-- ─── 2. Supprimer toutes les policies permissives existantes ─────────────────

-- rendez_vous (fix_rls_anon_access.sql)
DROP POLICY IF EXISTS "anon_insert_rdv"         ON rendez_vous;
DROP POLICY IF EXISTS "anon_select_rdv"         ON rendez_vous;
DROP POLICY IF EXISTS "anon_update_rdv"         ON rendez_vous;

-- rendez_vous_invites
DROP POLICY IF EXISTS "anon_insert_rdv_invites" ON rendez_vous_invites;
DROP POLICY IF EXISTS "anon_select_rdv_invites" ON rendez_vous_invites;

-- remontees
DROP POLICY IF EXISTS "anon_insert_remontees"   ON remontees;

-- news
DROP POLICY IF EXISTS "anon_select_news"        ON news;

-- notes_vocales (add_notes_vocales.sql)
DROP POLICY IF EXISTS "notes_vocales_auth_all"  ON notes_vocales;

-- Nettoyage défensif d'autres policies qui auraient pu exister
DROP POLICY IF EXISTS "public_read_remontees"   ON remontees;
DROP POLICY IF EXISTS "public_read_magasins"    ON magasins;
DROP POLICY IF EXISTS "public_read_visites"     ON visites;
DROP POLICY IF EXISTS "anon_all_magasins"       ON magasins;
DROP POLICY IF EXISTS "anon_select_magasins"    ON magasins;
DROP POLICY IF EXISTS "authenticated_all"       ON magasins;
DROP POLICY IF EXISTS "authenticated_all"       ON visites;
DROP POLICY IF EXISTS "authenticated_all"       ON remontees;
DROP POLICY IF EXISTS "authenticated_all"       ON news;

-- ─── 3. Résultat : aucune policy → deny par défaut pour anon/authenticated ──
-- service_role bypass RLS → 0 impact côté serveur.

-- ─── 4. Storage : garder lecture publique, supprimer uploads anon/auth ────────

-- photos-remontees : GARDE la lecture publique (affichage des images)
DROP POLICY IF EXISTS "photos_remontees_anon_insert"    ON storage.objects;
DROP POLICY IF EXISTS "photos_remontees_auth_insert"    ON storage.objects;
DROP POLICY IF EXISTS "photos_remontees_auth_delete"    ON storage.objects;
DROP POLICY IF EXISTS "photos_remontees_anon_delete"    ON storage.objects;

-- news-images : GARDE la lecture publique
DROP POLICY IF EXISTS "news_images_auth_insert"         ON storage.objects;
DROP POLICY IF EXISTS "news_images_anon_insert"         ON storage.objects;
DROP POLICY IF EXISTS "news_images_auth_delete"         ON storage.objects;

-- notes-vocales : GARDE la lecture publique (lecture du fichier audio)
DROP POLICY IF EXISTS "notes_vocales_auth_insert"       ON storage.objects;
DROP POLICY IF EXISTS "notes_vocales_anon_insert"       ON storage.objects;
DROP POLICY IF EXISTS "notes_vocales_auth_delete"       ON storage.objects;
DROP POLICY IF EXISTS "notes_vocales_anon_delete"       ON storage.objects;

-- ─── Vérification (optionnelle) ───────────────────────────────────────────────
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
