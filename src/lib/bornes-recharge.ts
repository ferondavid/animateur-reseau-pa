import { haversineKm } from "./itineraire";
import type { Point, EtapeParcours } from "./itineraire";

export type Borne = {
  id: string;
  titre: string;
  operateur?: string;
  adresse?: string;
  lat: number;
  lng: number;
  puissanceKW?: number;
  nbConnecteurs?: number;
};

// Cache mémoire pour la session (évite les appels répétés sur le même point)
const cache = new Map<string, Borne[]>();

function cacheKey(centre: Point, rayon: number): string {
  return `${centre.lat.toFixed(3)}_${centre.lng.toFixed(3)}_${rayon}`;
}

/** Cherche les bornes dans un rayon autour d'un point via OpenChargeMap */
export async function chercherBornes(centre: Point, rayonKm: number): Promise<Borne[]> {
  const key = cacheKey(centre, rayonKm);
  if (cache.has(key)) return cache.get(key)!;

  const apiKey = process.env.OPENCHARGEMAP_API_KEY ?? "";
  const url =
    `https://api.openchargemap.io/v3/poi/?output=json` +
    `&latitude=${centre.lat}&longitude=${centre.lng}` +
    `&distance=${rayonKm}&distanceunit=KM&maxresults=15&compact=true&verbose=false` +
    (apiKey ? `&key=${apiKey}` : "");

  console.log("[BORNES] requête:", {
    centre: `${centre.lat.toFixed(3)},${centre.lng.toFixed(3)}`,
    rayonKm,
    apiKey: apiKey ? "✓" : "❌ absente",
  });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "AnimationReseauPA/1.0 (https://animateur-reseau-pa.vercel.app)",
      },
    });

    if (!res.ok) {
      console.warn("[BORNES] HTTP", res.status, res.statusText);
      cache.set(key, []);
      return [];
    }

    const raw = (await res.json()) as Array<{
      ID: number;
      AddressInfo?: {
        Title?: string;
        AddressLine1?: string;
        Latitude?: number;
        Longitude?: number;
      };
      OperatorInfo?: { Title?: string };
      Connections?: Array<{ PowerKW?: number; Quantity?: number }>;
    }>;

    console.log("[BORNES] reçu:", raw.length, "bornes brutes");

    const bornes: Borne[] = raw
      .filter(
        (d) =>
          typeof d.AddressInfo?.Latitude === "number" &&
          typeof d.AddressInfo?.Longitude === "number" &&
          d.Connections && d.Connections.length > 0
      )
      .map((d) => ({
        id: String(d.ID),
        titre: d.AddressInfo!.Title ?? "Borne de recharge",
        operateur: d.OperatorInfo?.Title,
        adresse: d.AddressInfo?.AddressLine1,
        lat: d.AddressInfo!.Latitude!,
        lng: d.AddressInfo!.Longitude!,
        puissanceKW: d.Connections?.[0]?.PowerKW ?? undefined,
        nbConnecteurs: d.Connections?.reduce((s, c) => s + (c.Quantity ?? 1), 0),
      }));

    cache.set(key, bornes);
    return bornes;
  } catch (err) {
    console.warn("[BORNES] erreur fetch:", err);
    cache.set(key, []);
    return [];
  }
}

export type ConfigVE = {
  autonomieKm: number;
  seuilPct: number;
  ciblePct: number;
  chargeDepartPct: number;
  tempsRechargeMin: number;
};

/**
 * Parcourt les étapes et insère automatiquement des arrêts de recharge
 * avant que l'autonomie tombe sous le seuil.
 */
export async function insererArretsRecharge(
  depart: Point,
  etapes: EtapeParcours[],
  config: ConfigVE
): Promise<EtapeParcours[]> {
  const seuilKm = config.autonomieKm * (config.seuilPct / 100);
  const cibleKm = config.autonomieKm * (config.ciblePct / 100);
  let autonomie = config.autonomieKm * (config.chargeDepartPct / 100);
  let prevPoint: Point = depart;

  console.log("[VE] début parcours, autonomie:", autonomie.toFixed(0), "km, seuil:", seuilKm.toFixed(0), "km");

  const result: EtapeParcours[] = [];

  for (const etape of etapes) {
    const dist = etape.distanceDepuisPrec;

    if (autonomie - dist < seuilKm) {
      // Besoin de recharger avant cette étape
      const midpoint: Point = {
        lat: (prevPoint.lat + etape.lat) / 2,
        lng: (prevPoint.lng + etape.lng) / 2,
      };

      let borne: Borne | null = null;
      for (const rayon of [25, 50, 80]) {
        const bornes = await chercherBornes(midpoint, rayon);
        if (bornes.length > 0) {
          borne = bornes.sort(
            (a, b) => haversineKm(midpoint, a) - haversineKm(midpoint, b)
          )[0];
          break;
        }
      }

      if (borne) {
        const distToBorne = haversineKm(prevPoint, borne);
        const distFromBorne = haversineKm(borne, etape);
        console.log("[VE] borne insérée:", borne.titre, "à", distToBorne.toFixed(1), "km");

        result.push({
          type: "recharge",
          id: `borne-${borne.id}`,
          label: borne.titre,
          sousLabel: [
            borne.operateur,
            borne.puissanceKW ? `${borne.puissanceKW} kW` : undefined,
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
          lat: borne.lat,
          lng: borne.lng,
          distanceDepuisPrec: distToBorne,
          autonomieRestanteAvant: Math.max(0, autonomie - distToBorne),
          autonomieRestanteApres: cibleKm,
          tempsArretMin: config.tempsRechargeMin,
        });

        autonomie = cibleKm;
        prevPoint = borne;

        result.push({
          ...etape,
          distanceDepuisPrec: distFromBorne,
          autonomieRestanteAvant: Math.max(0, autonomie - distFromBorne),
        });
        autonomie = Math.max(0, autonomie - distFromBorne);
      } else {
        // Aucune borne trouvée
        console.warn("[VE] AUCUNE borne trouvée dans 80 km autour de", `${midpoint.lat.toFixed(3)},${midpoint.lng.toFixed(3)}`);
        result.push({
          type: "recharge",
          id: `no-borne-${etape.id}`,
          label: "⚠️ Aucune borne trouvée",
          sousLabel: "Vérifiez manuellement",
          lat: midpoint.lat,
          lng: midpoint.lng,
          distanceDepuisPrec: dist / 2,
          autonomieRestanteAvant: Math.max(0, autonomie - dist / 2),
          tempsArretMin: 0,
        });
        result.push({
          ...etape,
          distanceDepuisPrec: dist / 2,
          autonomieRestanteAvant: Math.max(0, autonomie - dist),
        });
        autonomie = Math.max(0, autonomie - dist);
      }
    } else {
      result.push({
        ...etape,
        autonomieRestanteAvant: Math.max(0, autonomie - dist),
      });
      autonomie = Math.max(0, autonomie - dist);
    }

    prevPoint = { lat: etape.lat, lng: etape.lng };
  }

  return result;
}
