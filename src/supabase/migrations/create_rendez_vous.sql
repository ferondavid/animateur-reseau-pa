CREATE TABLE IF NOT EXISTS rendez_vous (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  magasin_id uuid NOT NULL REFERENCES magasins(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('physique', 'tel', 'visio')),
  date_souhaitee date NOT NULL,
  heure_souhaitee time,
  objet text NOT NULL,
  message text,
  lieu text,
  lien_visio text,
  statut text NOT NULL DEFAULT 'demande' CHECK (statut IN ('demande', 'confirme', 'reporte', 'annule', 'fait')),
  demandeur_type text NOT NULL DEFAULT 'magasin' CHECK (demandeur_type IN ('magasin', 'animateur')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rendez_vous_invites (
  rendez_vous_id uuid REFERENCES rendez_vous(id) ON DELETE CASCADE,
  magasin_id uuid REFERENCES magasins(id) ON DELETE CASCADE,
  PRIMARY KEY (rendez_vous_id, magasin_id)
);

ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendez_vous_invites ENABLE ROW LEVEL SECURITY;
