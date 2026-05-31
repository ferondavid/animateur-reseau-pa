-- Seed CA mensuel : 2 ans × 12 mois × 4 segments + global
-- Montants ajustés pour que le CA annuel global par magasin tombe entre 250K et 700K.
-- Valeurs mensuelles par segment :
--   chimie        4K–10K  → annuel ~84K
--   materiel      6K–14K  → annuel ~120K
--   piscine_coque 10K–20K (avr-août) / 4K–12K (autres) → annuel ~145K
--   spa           9K–17K  (sep-déc) / 4K–12K (autres)  → annuel ~132K
--   global        = somme des 4 → annuel ~481K (range 250K–700K)

WITH segments AS (
  SELECT unnest(ARRAY['chimie', 'materiel', 'piscine_coque', 'spa']) AS seg
),
annees AS (
  SELECT unnest(ARRAY[2024, 2025]) AS a
),
mois AS (
  SELECT generate_series(1, 12) AS m
),
magasins_actifs AS (
  SELECT id FROM magasins WHERE statut = 'actif'
)
INSERT INTO ca_mensuel (magasin_id, annee, mois, segment, montant)
SELECT
  ma.id,
  an.a,
  mo.m,
  se.seg,
  ROUND(
    (CASE
      WHEN se.seg = 'piscine_coque' AND mo.m BETWEEN 4 AND 8 THEN 10000 + random() * 10000
      WHEN se.seg = 'spa'           AND mo.m BETWEEN 9 AND 12 THEN 9000  + random() * 8000
      WHEN se.seg = 'chimie'                                   THEN 4000  + random() * 6000
      WHEN se.seg = 'materiel'                                 THEN 6000  + random() * 8000
      ELSE                                                          4000  + random() * 8000
    END)::numeric,
    2
  )
FROM magasins_actifs ma
CROSS JOIN annees an
CROSS JOIN mois mo
CROSS JOIN segments se
ON CONFLICT (magasin_id, annee, mois, segment) DO NOTHING;

-- Calcule le segment 'global' = somme des 4 segments par mois
INSERT INTO ca_mensuel (magasin_id, annee, mois, segment, montant)
SELECT magasin_id, annee, mois, 'global', SUM(montant)
FROM ca_mensuel
WHERE segment IN ('chimie', 'materiel', 'piscine_coque', 'spa')
GROUP BY magasin_id, annee, mois
ON CONFLICT (magasin_id, annee, mois, segment)
DO UPDATE SET montant = EXCLUDED.montant;
