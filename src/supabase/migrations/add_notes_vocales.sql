-- =====================================================
-- Module Notes vocales
-- À JOUER dans Supabase → SQL Editor (idempotent, rejouable)
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

CREATE INDEX IF NOT EXISTS notes_vocales_statut_idx  ON notes_vocales(statut);
CREATE INDEX IF NOT EXISTS notes_vocales_created_idx ON notes_vocales(created_at DESC);

-- ─── RLS table (rôle anon, comme le reste de l'app) ──────────────────────────
-- NB : Postgres ne supporte PAS "CREATE POLICY IF NOT EXISTS" → on DROP puis CREATE.

ALTER TABLE notes_vocales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_vocales_all" ON notes_vocales;
CREATE POLICY "notes_vocales_all"
  ON notes_vocales FOR ALL
  TO anon, authenticated
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
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lecture publique (lecteur audio <audio src>)
DROP POLICY IF EXISTS "notes_vocales_public_read" ON storage.objects;
CREATE POLICY "notes_vocales_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'notes-vocales');

-- Upload
DROP POLICY IF EXISTS "notes_vocales_insert" ON storage.objects;
CREATE POLICY "notes_vocales_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'notes-vocales');

-- Suppression
DROP POLICY IF EXISTS "notes_vocales_delete" ON storage.objects;
CREATE POLICY "notes_vocales_delete"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'notes-vocales');
