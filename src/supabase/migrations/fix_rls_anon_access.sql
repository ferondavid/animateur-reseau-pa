-- =====================================================
-- Fix RLS : accès anon pour les tables créées sans app d'auth
-- À jouer dans Supabase SQL Editor
-- =====================================================

-- rendez_vous : membres peuvent créer des demandes, lire les leurs
CREATE POLICY IF NOT EXISTS "anon_insert_rdv" ON rendez_vous
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_select_rdv" ON rendez_vous
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY IF NOT EXISTS "anon_update_rdv" ON rendez_vous
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- rendez_vous_invites
CREATE POLICY IF NOT EXISTS "anon_insert_rdv_invites" ON rendez_vous_invites
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_select_rdv_invites" ON rendez_vous_invites
  FOR SELECT TO anon, authenticated USING (true);

-- remontees : membres peuvent insérer (colonne source ajoutée par migration)
CREATE POLICY IF NOT EXISTS "anon_insert_remontees" ON remontees
  FOR INSERT TO anon WITH CHECK (true);

-- news : lecture publique (anon peut lire les news publiées)
CREATE POLICY IF NOT EXISTS "anon_select_news" ON news
  FOR SELECT TO anon USING (publie = true);
