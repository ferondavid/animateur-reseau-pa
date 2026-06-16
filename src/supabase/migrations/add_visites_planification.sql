-- Planification fine des visites de tournée (heure précise + confirmation animateur). Idempotent.
-- À coller dans Supabase Studio → SQL Editor → Run.
ALTER TABLE visites ADD COLUMN IF NOT EXISTS heure_prevue time;
ALTER TABLE visites ADD COLUMN IF NOT EXISTS confirmee boolean NOT NULL DEFAULT false;
