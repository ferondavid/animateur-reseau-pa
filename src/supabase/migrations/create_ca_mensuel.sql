CREATE TABLE IF NOT EXISTS ca_mensuel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  magasin_id uuid NOT NULL REFERENCES magasins(id) ON DELETE CASCADE,
  annee int NOT NULL,
  mois int NOT NULL CHECK (mois BETWEEN 1 AND 12),
  segment text NOT NULL CHECK (segment IN ('global', 'chimie', 'materiel', 'piscine_coque', 'spa')),
  montant numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (magasin_id, annee, mois, segment)
);

CREATE INDEX IF NOT EXISTS idx_ca_mensuel_magasin ON ca_mensuel(magasin_id);
CREATE INDEX IF NOT EXISTS idx_ca_mensuel_periode ON ca_mensuel(annee, mois);

ALTER TABLE ca_mensuel DISABLE ROW LEVEL SECURITY;
