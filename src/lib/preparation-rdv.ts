import { haversineKm } from "./itineraire";

export type PreparationRDV = {
  distanceKm: number;
  dureeRouteMinutes: number;
  heureDepart: string | null;   // "HH:MM" ou null si heure RDV inconnue
  heureDepartVeille: boolean;   // vrai si le départ est la veille au soir
  chargeNecessairePct: number;  // si VE (0 si VE désactivé)
  chargeRecommandeePct: number; // avec marge de sécurité
  arretsRechargeNecessaires: boolean;
  nbArretsEstime: number;
  alertes: string[];
};

export type ConfigCalcul = {
  vitesseMoyenneKmh: number;
  coefRoute: number;
  bufferMin: number;
  margeChargePct: number;
  autonomieKm?: number;   // undefined si VE désactivé
  seuilPct?: number;
};

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.abs(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calculerPreparation(
  departLat: number,
  departLng: number,
  arriveeLat: number,
  arriveeLng: number,
  heureRDV: string | null,
  config: ConfigCalcul
): PreparationRDV {
  const distanceKm =
    haversineKm({ lat: departLat, lng: departLng }, { lat: arriveeLat, lng: arriveeLng }) *
    config.coefRoute;

  const dureeRouteMinutes = Math.round((distanceKm / config.vitesseMoyenneKmh) * 60);

  // ── Heure de départ ────────────────────────────────────────────────────────
  let heureDepart: string | null = null;
  let heureDepartVeille = false;

  if (heureRDV) {
    const [h, m] = heureRDV.slice(0, 5).split(":").map(Number);
    const rdvMin = h * 60 + m;
    const depMin = rdvMin - dureeRouteMinutes - config.bufferMin;

    if (depMin < 0) {
      heureDepart = minutesToHHMM(depMin + 24 * 60);
      heureDepartVeille = true;
    } else {
      heureDepart = minutesToHHMM(depMin);
    }
  }

  // ── Charge batterie (VE) ───────────────────────────────────────────────────
  const autonomieKm = config.autonomieKm ?? 0;
  let chargeNecessairePct = 0;
  let chargeRecommandeePct = 0;
  let arretsRechargeNecessaires = false;
  let nbArretsEstime = 0;

  if (autonomieKm > 0) {
    chargeNecessairePct = Math.round((distanceKm / autonomieKm) * 100);
    chargeRecommandeePct = Math.min(100, chargeNecessairePct + config.margeChargePct);

    if (distanceKm > autonomieKm) {
      arretsRechargeNecessaires = true;
      const seuilPct = config.seuilPct ?? 20;
      // Distance utilisable avant premier stop + range récupéré par charge (seuil→80%)
      const seuilKm = autonomieKm * (seuilPct / 100);
      const rangeParCharge = autonomieKm * 0.6;
      nbArretsEstime = Math.max(
        0,
        Math.ceil((distanceKm - (autonomieKm - seuilKm)) / rangeParCharge)
      );
    }
  }

  // ── Alertes ────────────────────────────────────────────────────────────────
  const alertes: string[] = [];

  if (distanceKm > 600) alertes.push("Tournée longue — prévoir une étape sommeil");
  if (autonomieKm > 0 && nbArretsEstime > 0)
    alertes.push(`${nbArretsEstime} arrêt${nbArretsEstime > 1 ? "s" : ""} recharge à prévoir`);
  if (heureDepartVeille) alertes.push("Départ la veille au soir");
  else if (heureDepart) {
    const hh = parseInt(heureDepart.split(":")[0], 10);
    if (hh < 6) alertes.push("Départ très tôt (avant 6h)");
  }
  if (chargeRecommandeePct > 90) alertes.push("Charger à fond ce soir");

  return {
    distanceKm,
    dureeRouteMinutes,
    heureDepart,
    heureDepartVeille,
    chargeNecessairePct,
    chargeRecommandeePct,
    arretsRechargeNecessaires,
    nbArretsEstime,
    alertes,
  };
}
