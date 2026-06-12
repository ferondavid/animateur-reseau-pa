-- =====================================================
-- Module Notes vocales
-- À jouer dans Supabase SQL Editor
-- =====================================================

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notes_vocales (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titre      text,
  audio_url  text        NOT NULL,
  duree_sec  int,
  magasin_id uuid        REFERENCES magasins(id) ON DELETE SET NULL,
  statut     text        NOT NULL DEFAULT 'active',  -- 'active' | 'archivee'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS notes_vocales_statut_idx    ON notes_vocales(statut);
CREATE INDEX IF NOT EXISTS notes_vocales_created_idx   ON notes_vocales(created_at DESC);

-- RLS
ALTER TABLE notes_vocales ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "notes_vocales_auth_all"
  ON notes_vocales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Storage bucket notes-vocales ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notes-vocales',
  'notes-vocales',
  true,
  52428800,  -- 50 MB
  ARRAY['audio/webm','audio/mp4','audio/ogg','audio/mpeg','audio/wav','audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Lecture publique (URL partageable éventuelle)
CREATE POLICY IF NOT EXISTS "notes_vocales_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'notes-vocales');

-- Upload par authentifié
CREATE POLICY IF NOT EXISTS "notes_vocales_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notes-vocales');

-- Suppression par authentifié
CREATE POLICY IF NOT EXISTS "notes_vocales_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notes-vocales');
