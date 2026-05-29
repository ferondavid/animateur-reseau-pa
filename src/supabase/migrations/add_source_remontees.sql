ALTER TABLE remontees ADD COLUMN IF NOT EXISTS source text DEFAULT 'animateur' CHECK (source IN ('animateur', 'membre'));
