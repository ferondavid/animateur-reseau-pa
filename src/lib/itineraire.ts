export type Point = { lat: number; lng: number };

export type TypeEtape = "depart" | "magasin" | "recharge" | "arrivee";

export type EtapeParcours = {
  type: TypeEtape;
  id: string;
  label: string;
  sousLabel?: string;
  lat: number;
  lng: number;
  distanceDepuisPrec: number; // km
  autonomieRestanteAvant?: number; // km avant d'arriver
  autonomieRestanteApres?: number; // km après recharge si applicable
  tempsArretMin?: number; // 0 pour magasins, N pour borne
};

export type Parcours = {
  etapes: EtapeParcours[];
  distanceTotale: number;
  dureeRouteMinutes: number;   // basée sur 60 km/h
  dureeArretsMinutes: number;  // somme tempsArretMin
  dureeTotaleMinutes: number;
};

/** Distance grand-cercle (Haversine) en km */
export function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

type MagasinInput = {
  id: string;
  nom: string;
  enseigne?: string | null;
  ville?: string | null;
  lat: number;
  lng: number;
};

/** Nearest-neighbor depuis un point de départ. Retourne les étapes ordonnées (sans le départ). */
export function calculerParcoursDeBase(
  depart: Point,
  magasins: MagasinInput[]
): EtapeParcours[] {
  if (magasins.length === 0) return [];

  const restants = magasins.map((m) => ({ ...m }));
  const etapes: EtapeParcours[] = [];
  let current: Point = depart;

  while (restants.length > 0) {
    let bestIdx = 0;
    let bestDist = haversineKm(current, restants[0]);
    for (let i = 1; i < restants.length; i++) {
      const d = haversineKm(current, restants[i]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const m = restants.splice(bestIdx, 1)[0];
    etapes.push({
      type: "magasin",
      id: m.id,
      label: m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom,
      sousLabel: m.ville ?? undefined,
      lat: m.lat,
      lng: m.lng,
      distanceDepuisPrec: bestDist,
    });
    current = m;
  }
  return etapes;
}

/** Construit le Parcours final depuis les étapes (après éventuels arrêts recharge). */
export function construireParcours(etapes: EtapeParcours[]): Parcours {
  const distanceTotale = etapes.reduce((s, e) => s + e.distanceDepuisPrec, 0);
  const dureeRouteMinutes = Math.round((distanceTotale / 60) * 60);
  const dureeArretsMinutes = etapes.reduce((s, e) => s + (e.tempsArretMin ?? 0), 0);
  return {
    etapes,
    distanceTotale,
    dureeRouteMinutes,
    dureeArretsMinutes,
    dureeTotaleMinutes: dureeRouteMinutes + dureeArretsMinutes,
  };
}
