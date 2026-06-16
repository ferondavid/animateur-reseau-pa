-- Réglages d'affichage de l'image, par news (idempotent).
-- À coller dans Supabase Studio → SQL Editor → Run.
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_hauteur  text NOT NULL DEFAULT 'moyenne'; -- petite | moyenne | grande
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_cadrage  text NOT NULL DEFAULT 'remplir'; -- remplir | entiere
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_position text NOT NULL DEFAULT 'centre';  -- haut | centre | bas
