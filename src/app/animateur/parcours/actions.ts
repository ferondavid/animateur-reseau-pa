"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Point, EtapeParcours } from "@/lib/itineraire";
import type { ConfigVE } from "@/lib/bornes-recharge";
import { insererArretsRecharge } from "@/lib/bornes-recharge";
import { titreMagasin } from "@/lib/magasin";
import { SELECT_JOURS_BLOQUES, mapJoursBloques, type JourBloque } from "@/lib/jours-bloques";

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
  forcer?: boolean;               // passer outre les avertissements (chevauchement / visite récente)
};

// Jours hors tournée = samedi + dimanche (tournée lun→ven soir, retour le week-end)
function estWeekend(d: Date): boolean {
  const j = d.getDay();
  return j === 0 || j === 6;
}
// Renvoie le n-ième jour disponible à partir de `start` (saute le week-end si demandé,
// et toujours les jours bloqués : home office / congés / journée bureau)
function jourOuvre(start: Date, n: number, sauterWeekend: boolean, bloques: Set<string>): Date {
  const d = new Date(start);
  const indispo = (x: Date) => (sauterWeekend && estWeekend(x)) || bloques.has(x.toISOString().slice(0, 10));
  while (indispo(d)) d.setDate(d.getDate() + 1);
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (!indispo(d)) count++;
  }
  return d;
}

// Lundi de la semaine contenant `dateStr`
function snapLundi(dateStr: string): Date {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function enMinutes(h: string): number {
  const [a, b] = h.slice(0, 5).split(":").map(Number);
  return (a || 0) * 60 + (b || 0);
}
function decaleJours(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function lundiStr(dateStr: string): string {
  return snapLundi(dateStr).toISOString().slice(0, 10);
}

export async function creerVisitesPlanifieesParcours(
  magasinIds: string[],
  dateDebut: string,
  objectif: string,
  options?: OptionsPlanif
): Promise<{
  ok: boolean; nb?: number; error?: string; debordement?: number; nonPlanifies?: number;
  besoinConfirmation?: boolean;
  recents?: { magasin: string; date: string }[];
  conflits?: { date: string; heure: string; magasin: string }[];
  semaineOccupee?: { suggestionLundi: string };
}> {
  if (!magasinIds.length) return { ok: false, error: "Aucun magasin sélectionné" };
  if (!dateDebut) return { ok: false, error: "Date de début manquante" };

  const supabase = await createClient();
  const vpj = Math.max(1, Math.min(6, options?.visitesParJour ?? 2));
  const intervalle = Math.max(15, options?.intervalleMin ?? 90);
  const sauterWeekend = options?.sauterWeekend ?? true;
  const autoriserDebordement = options?.autoriserDebordement ?? false;
  const [h0, m0] = (options?.heureDebut ?? "09:00").split(":").map(Number);
  const baseMin = (h0 || 9) * 60 + (m0 || 0);

  // Capacité d'une semaine (lun→ven si on saute le week-end, sinon 7 jours)
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

  // Jours bloqués (home office / congés / bureau) → exclus de la planification
  const debutStr = debut.toISOString().slice(0, 10);
  const horizonBloc = new Date(debut.getTime() + 120 * 86400_000).toISOString().slice(0, 10);
  const { data: blocRows } = await supabase.from("jours_bloques")
    .select(SELECT_JOURS_BLOQUES).gte("date_fin", debutStr).lte("date_debut", horizonBloc);
  const bloques = new Set(mapJoursBloques((blocRows ?? []) as JourBloque[]).keys());

  const rows = aPlanifier.map((mid, i) => {
    const jourIndex = Math.floor(i / vpj);
    const pos = i % vpj;
    const d = jourOuvre(debut, jourIndex, sauterWeekend, bloques);
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

  // ── Vérifications (sautées si forcer) : chevauchement + visite récente ───────
  if (!options?.forcer) {
    const magIds = [...new Set(rows.map((r) => r.magasin_id))];
    const newDates = [...new Set(rows.map((r) => r.date_prevue))];
    const minDate = newDates.slice().sort()[0];
    const cutoff = decaleJours(minDate, -15);

    const [{ data: existMag }, { data: existDate }] = await Promise.all([
      supabase.from("visites")
        .select("magasin_id, date_prevue, date_realisee")
        .in("magasin_id", magIds)
        .neq("statut", "annulee")
        .or(`date_realisee.gte.${cutoff},date_prevue.gte.${cutoff}`),
      supabase.from("visites")
        .select("magasin_id, date_prevue, heure_prevue")
        .in("date_prevue", newDates)
        .eq("statut", "planifiee")
        .not("heure_prevue", "is", null),
    ]);

    const idsNoms = [...new Set([...magIds, ...((existDate ?? []).map((e) => e.magasin_id as string))])];
    const { data: noms } = await supabase.from("magasins").select("id, nom, enseigne").in("id", idsNoms);
    const nomDe = (id: string) => {
      const m = (noms ?? []).find((n) => n.id === id);
      return m ? titreMagasin(m.enseigne, m.nom) : "Magasin";
    };

    // Visite récente : magasin déjà visité dans les 15 j précédant la nouvelle visite
    const recentsMap = new Map<string, string>();
    for (const r of rows) {
      const last = (existMag ?? [])
        .filter((e) => e.magasin_id === r.magasin_id)
        .map((e) => (e.date_realisee ?? e.date_prevue) as string | null)
        .filter((d): d is string => !!d && d < r.date_prevue && d >= decaleJours(r.date_prevue, -15))
        .sort()
        .pop();
      if (last && !recentsMap.has(r.magasin_id)) recentsMap.set(r.magasin_id, last);
    }
    const recents = [...recentsMap.entries()].map(([id, date]) => ({ magasin: nomDe(id), date }));

    // Chevauchement horaire avec une visite existante (même date, créneaux à < 60 min)
    const DUREE = 60;
    const conflits: { date: string; heure: string; magasin: string }[] = [];
    for (const r of rows) {
      const start = enMinutes(r.heure_prevue);
      for (const e of existDate ?? []) {
        if (e.date_prevue !== r.date_prevue || !e.heure_prevue) continue;
        if (Math.abs(start - enMinutes(e.heure_prevue as string)) < DUREE) {
          conflits.push({ date: r.date_prevue, heure: r.heure_prevue.slice(0, 5), magasin: nomDe(e.magasin_id as string) });
        }
      }
    }

    // Semaine déjà occupée par une autre tournée → suggérer la prochaine semaine libre
    const cibleTriees = [...new Set(newDates.map((d) => lundiStr(d)))].sort();
    const horizonFin = decaleJours(cibleTriees[cibleTriees.length - 1], 7 * 16);
    const { data: existPlan } = await supabase.from("visites")
      .select("date_prevue")
      .eq("statut", "planifiee")
      .gte("date_prevue", cibleTriees[0])
      .lte("date_prevue", horizonFin)
      .not("date_prevue", "is", null);
    const semainesOccupees = new Set((existPlan ?? []).map((e) => lundiStr(e.date_prevue as string)));
    const cibleOccupee = cibleTriees.some((s) => semainesOccupees.has(s));
    let suggestionLundi: string | null = null;
    if (cibleOccupee) {
      let cand = cibleTriees[0];
      for (let i = 0; i < 26; i++) {
        if (!semainesOccupees.has(cand)) { suggestionLundi = cand; break; }
        cand = decaleJours(cand, 7);
      }
    }

    if (recents.length || conflits.length || cibleOccupee) {
      return {
        ok: false, besoinConfirmation: true, recents, conflits,
        semaineOccupee: cibleOccupee ? { suggestionLundi: suggestionLundi ?? "" } : undefined,
        debordement: autoriserDebordement ? debordement : 0, nonPlanifies,
      };
    }
  }

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
