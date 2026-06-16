-- Jours bloqués pour la planification (home office / congés / journée bureau). Idempotent.
-- À coller dans Supabase Studio → SQL Editor → Run.
CREATE TABLE IF NOT EXISTS jours_bloques (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_debut  date NOT NULL,
  date_fin    date NOT NULL,
  type        text NOT NULL CHECK (type IN ('home_office', 'conges', 'bureau')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jours_bloques ENABLE ROW LEVEL SECURITY;
