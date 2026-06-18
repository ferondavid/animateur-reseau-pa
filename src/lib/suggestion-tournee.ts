import { haversineKm, calculerParcoursDeBase } from "./itineraire";
import type { NiveauRisque, RisqueMagasin } from "./risque";

export type MagasinPourSuggestion = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  region: string | null;
  lat: number;
  lng: number;
  niveau: string | null;
};

export type MagasinSuggere = MagasinPourSuggestion & {
  ordre: number;
  scorePriorite: number;
  niveauRisque: NiveauRisque;
  distanceDepuisPrec: number; // km depuis l'étape précédente (ou le départ)
  raisons: string[];
};

export type SuggestionTournee = {
  magasins: MagasinSuggere[];
  distanceTotaleKm: number;
  dureeEstimeeMin: number; // route à 60 km/h
  raisonGroupe: string;
};

const POIDS_RISQUE: Record<NiveauRisque, number> = {
  eleve: 100,
  modere: 50,
  ok: 0,
};

/**
 * Score de priorité d'un magasin pour la suggestion de tournée.
 * Combine le niveau de risque (poids fort), l'ancienneté de la dernière visite
 * (jusqu'à +40) et le score brut de risque (+5 par critère déclenché).
 */
function scorePriorite(r: RisqueMagasin | undefined): number {
  if (!r) return 0;
  const base = POIDS_RISQUE[r.niveau];
  const anciennete =
    r.joursSansVisite === null ? 40 : Math.min(40, Math.floor(r.joursSansVisite / 10));
  return base + anciennete + r.score * 5;
}

/**
 * Propose une tournée intelligente : sélectionne les magasins les plus prioritaires
 * (risque + ancienneté), puis les regroupe géographiquement autour du plus urgent
 * pour éviter un parcours éclaté, et les ordonne en nearest-neighbor depuis le départ.
 *
 * Fonction pure — aucun appel réseau / Supabase. Réutilise risque.ts et itineraire.ts.
 */
export function suggererTournee(params: {
  magasins: MagasinPourSuggestion[];
  risqueMap: Map<string, RisqueMagasin>;
  magasinsDejaPlanifies: Set<string>;
  depart: { lat: number; lng: number } | null;
  taille?: number;
}): SuggestionTournee {
  const taille = params.taille ?? 6;
  const { magasins, risqueMap, magasinsDejaPlanifies, depart } = params;

  const candidats = magasins
    .filter((m) => !magasinsDejaPlanifies.has(m.id))
    .map((m) => ({ m, r: risqueMap.get(m.id), score: scorePriorite(risqueMap.get(m.id)) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidats.length === 0) {
    return {
      magasins: [],
      distanceTotaleKm: 0,
      dureeEstimeeMin: 0,
      raisonGroupe: "Aucun magasin prioritaire à visiter pour le moment 👍",
    };
  }

  // Pool des plus prioritaires (large) parmi lequel on resserre géographiquement.
  const pool = candidats.slice(0, Math.max(taille, Math.min(candidats.length, taille * 3)));
  const ancre = pool[0];

  // Sélection groupée : les plus proches de l'ancre (le magasin le plus urgent).
  const selection = pool
    .map((c) => ({
      ...c,
      dAncre: haversineKm(
        { lat: ancre.m.lat, lng: ancre.m.lng },
        { lat: c.m.lat, lng: c.m.lng }
      ),
    }))
    .sort((a, b) => a.dAncre - b.dAncre)
    .slice(0, Math.min(taille, pool.length));

  // Ordonnancement : nearest-neighbor depuis le départ habituel, sinon depuis l'ancre.
  const origine = depart ?? { lat: ancre.m.lat, lng: ancre.m.lng };
  const etapes = calculerParcoursDeBase(
    origine,
    selection.map((c) => ({
      id: c.m.id,
      nom: c.m.nom,
      enseigne: c.m.enseigne,
      ville: c.m.ville,
      lat: c.m.lat,
      lng: c.m.lng,
    }))
  );

  const byId = new Map(selection.map((c) => [c.m.id, c]));
  const magasinsSuggere: MagasinSuggere[] = etapes.map((e, i) => {
    const c = byId.get(e.id)!;
    const raisons = c.r ? [...c.r.raisons] : [];
    const niv = c.m.niveau ?? "standard";
    if (niv === "strategique") raisons.unshift("Magasin stratégique");
    else if (niv === "observation") raisons.unshift("Sous observation");
    return {
      ...c.m,
      ordre: i + 1,
      scorePriorite: c.score,
      niveauRisque: c.r?.niveau ?? "ok",
      distanceDepuisPrec: e.distanceDepuisPrec,
      raisons,
    };
  });

  const distanceTotaleKm = etapes.reduce((s, e) => s + e.distanceDepuisPrec, 0);
  const dureeEstimeeMin = Math.round((distanceTotaleKm / 60) * 60);

  const zone = ancre.m.region ?? ancre.m.ville ?? null;
  const raisonGroupe = zone
    ? `Tournée groupée autour de ${zone}`
    : "Tournée groupée par priorité";

  return { magasins: magasinsSuggere, distanceTotaleKm, dureeEstimeeMin, raisonGroupe };
}
