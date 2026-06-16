"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Point, EtapeParcours } from "@/lib/itineraire";
import type { ConfigVE } from "@/lib/bornes-recharge";
import { insererArretsRecharge } from "@/lib/bornes-recharge";

/**
 * Server action : calcule les arrêts de recharge côté serveur
 * (nécessaire pour accéder à process.env.OPENCHARGEMAP_API_KEY)
 */
export async function calculerArretsRecharge(
  depart: Point,
  etapes: EtapeParcours[],
  config: ConfigVE
): Promise<EtapeParcours[]> {
  return insererArretsRecharge(depart, etapes, config);
}

export type OptionsPlanif = {
  visitesParJour?: number;
  heureDebut?: string;   // "HH:MM"
  intervalleMin?: number;
  sauterWeekend?: boolean;
  autoriserDebordement?: boolean; // RDV en début de semaine suivante si ça ne rentre pas
};

function estWeekend(d: Date): boolean {
  const j = d.getDay();
  return j === 0 || j === 6;
}
// Renvoie le n-ième jour ouvré à partir de `start` (n=0 → start, en sautant les week-ends si demandé)
function jourOuvre(start: Date, n: number, sauterWeekend: boolean): Date {
  const d = new Date(start);
  if (!sauterWeekend) {
    d.setDate(d.getDate() + n);
    return d;
  }
  while (estWeekend(d)) d.setDate(d.getDate() + 1);
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (!estWeekend(d)) count++;
  }
  return d;
}

// Lundi de la semaine contenant `dateStr`
function snapLundi(dateStr: string): Date {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export async function creerVisitesPlanifieesParcours(
  magasinIds: string[],
  dateDebut: string,
  objectif: string,
  options?: OptionsPlanif
): Promise<{ ok: boolean; nb?: number; error?: string; debordement?: number; nonPlanifies?: number }> {
  if (!magasinIds.length) return { ok: false, error: "Aucun magasin sélectionné" };
  if (!dateDebut) return { ok: false, error: "Date de début manquante" };

  const supabase = await createClient();
  const vpj = Math.max(1, Math.min(6, options?.visitesParJour ?? 2));
  const intervalle = Math.max(15, options?.intervalleMin ?? 90);
  const sauterWeekend = options?.sauterWeekend ?? true;
  const autoriserDebordement = options?.autoriserDebordement ?? false;
  const [h0, m0] = (options?.heureDebut ?? "09:00").split(":").map(Number);
  const baseMin = (h0 || 9) * 60 + (m0 || 0);

  // Capacité d'une semaine (lun→ven si on saute les week-ends, sinon 7 jours)
  const joursParSemaine = sauterWeekend ? 5 : 7;
  const capaciteSemaine = joursParSemaine * vpj;
  const debordement = Math.max(0, magasinIds.length - capaciteSemaine);

  // Si débordement non autorisé : on ne planifie que ce qui rentre dans la semaine
  let aPlanifier = magasinIds;
  let nonPlanifies = 0;
  if (debordement > 0 && !autoriserDebordement) {
    aPlanifier = magasinIds.slice(0, capaciteSemaine);
    nonPlanifies = debordement;
  }

  // La tournée démarre le lundi (quand on saute les week-ends)
  const debut = sauterWeekend ? snapLundi(dateDebut) : new Date(dateDebut + "T12:00:00");

  const rows = aPlanifier.map((mid, i) => {
    const jourIndex = Math.floor(i / vpj);
    const pos = i % vpj;
    const d = jourOuvre(debut, jourIndex, sauterWeekend);
    const totalMin = baseMin + pos * intervalle;
    const hh = String(Math.floor(totalMin / 60) % 24).padStart(2, "0");
    const mm = String(totalMin % 60).padStart(2, "0");
    return {
      magasin_id: mid,
      statut: "planifiee",
      date_prevue: d.toISOString().slice(0, 10),
      heure_prevue: `${hh}:${mm}`,
      objectif: objectif || "Tournée animateur",
      accepte_par_membre: false,
      confirmee: false,
    };
  });

  const { error, data } = await supabase.from("visites").insert(rows).select("id");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/animateur");
  revalidatePath("/visites");
  for (const mid of aPlanifier) revalidatePath(`/magasins/${mid}`);

  return {
    ok: true,
    nb: data?.length ?? 0,
    debordement: autoriserDebordement ? debordement : 0,
    nonPlanifies,
  };
}
