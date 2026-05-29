CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  contenu text NOT NULL,
  image_url text,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'evenement', 'alerte', 'temoignage')),
  auteur text DEFAULT 'Animateur',
  publie boolean NOT NULL DEFAULT true,
  epinglee boolean NOT NULL DEFAULT false,
  date_publication timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_publication ON news(publie, date_publication DESC);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lecture_news_publiees" ON news FOR SELECT USING (publie = true);
CREATE POLICY "animateur_all_news" ON news FOR ALL USING (get_user_role() = 'animateur');
