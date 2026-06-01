ALTER TABLE visites
  ADD COLUMN IF NOT EXISTS accepte_par_membre boolean NOT NULL DEFAULT false;

-- Visites déjà réalisées = acceptées implicitement
UPDATE visites SET accepte_par_membre = true WHERE statut = 'realisee';

-- Visites planifiées passées = acceptées pour ne pas spammer les membres avec des anciennes demandes
UPDATE visites SET accepte_par_membre = true WHERE statut = 'planifiee' AND date_prevue < CURRENT_DATE;
