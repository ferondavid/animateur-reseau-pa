CREATE TABLE IF NOT EXISTS parametres (
  cle text PRIMARY KEY,
  valeur text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE parametres DISABLE ROW LEVEL SECURITY;

INSERT INTO parametres (cle, valeur, description) VALUES
  ('nb_news_fiche_membre', '1', 'Nombre de news affichées en hero sur la fiche membre')
ON CONFLICT (cle) DO NOTHING;
