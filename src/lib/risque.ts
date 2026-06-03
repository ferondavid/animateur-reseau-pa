export type NiveauRisque = "eleve" | "modere" | "ok";
export type NiveauMagasin = "strategique" | "standard" | "observation";

export type RisqueMagasin = {
  niveau: NiveauRisque;
  score: number;
  raisons: string[];
  joursSansVisite: number | null;
};

type VisiteRealisee = {
  magasin_id: string;
  date_realisee: string | null;
  note_confiance: number | null;
  note_business: number | null;
};

type RemonteeUrgente = {
  magasin_id: string;
};

type MagasinInput = {
  id: string;
  niveau?: NiveauMagasin | string | null;
};

/**
 * Seuil de jours sans visite selon le niveau de criticité du magasin.
 * - stratégique : on attend pas, alerte à 60 jours
 * - standard    : seuil classique 90 jours
 * - observation : suivi rapproché, alerte à 30 jours
 */
export const SEUIL_VISITE: Record<NiveauMagasin, number> = {
  strategique: 60,
  standard: 90,
  observation: 30,
};

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function normaliserNiveau(n: string | null | undefined): NiveauMagasin {
  if (n === "strategique" || n === "observation") return n;
  return "standard";
}

/**
 * Calcule le niveau de risque par magasin, selon 3 critères :
 *   a — Non visité depuis trop longtemps (seuil dynamique selon niveau magasin)
 *   b — Note basse (confiance ou business < 3) sur la dernière visite
 *   c — Remontée urgente non traitée
 *
 * Score ≥ 2 → eleve, score = 1 → modere, score = 0 → ok.
 *
 * Accepte indifféremment :
 * - Un Array d'ids (rétrocompatibilité, considère tous les magasins comme "standard")
 * - Un Array d'objets MagasinInput (avec niveau pour appliquer le bon seuil)
 */
export function calculerRisqueMagasins(
  magasins: string[] | MagasinInput[],
  visitesRealisees: VisiteRealisee[],
  remonteesUrgentes: RemonteeUrgente[]
): Map<string, RisqueMagasin> {
  // Normalise l'entrée : objets {id, niveau} avec fallback "standard"
  const inputs: MagasinInput[] = (magasins as Array<string | MagasinInput>).map((m) =>
    typeof m === "string" ? { id: m, niveau: "standard" } : m
  );

  // Dernière visite par magasin (all-time)
  const derniereVisiteMap = new Map<string, VisiteRealisee>();
  for (const v of visitesRealisees) {
    const ex = derniereVisiteMap.get(v.magasin_id);
    if (!ex || (v.date_realisee && v.date_realisee > (ex.date_realisee ?? ""))) {
      derniereVisiteMap.set(v.magasin_id, v);
    }
  }

  // Nb remontées urgentes par magasin
  const urgentesParMagasin = new Map<string, number>();
  for (const r of remonteesUrgentes) {
    urgentesParMagasin.set(
      r.magasin_id,
      (urgentesParMagasin.get(r.magasin_id) ?? 0) + 1
    );
  }

  const maintenant = Date.now();
  const result = new Map<string, RisqueMagasin>();

  for (const m of inputs) {
    const id = m.id;
    const niveauMag = normaliserNiveau(m.niveau ?? null);
    const seuil = SEUIL_VISITE[niveauMag];
    const derVisite = derniereVisiteMap.get(id);
    const nbUrg = urgentesParMagasin.get(id) ?? 0;
    const raisons: string[] = [];
    let score = 0;
    let joursSansVisite: number | null = null;

    // Critère a — Pas visité depuis > seuil (ou jamais)
    if (!derVisite || !derVisite.date_realisee) {
      raisons.push("Jamais visité");
      score++;
    } else {
      const jours = Math.floor(
        (maintenant - new Date(derVisite.date_realisee).getTime()) / 86_400_000
      );
      joursSansVisite = jours;
      if (jours > seuil) {
        raisons.push(
          `Non visité depuis ${jours} jours (seuil ${niveauMag} : ${seuil}j)`
        );
        score++;
      }
    }

    // Critère b — Note basse sur la dernière visite
    if (derVisite) {
      const conf = derVisite.note_confiance;
      const biz = derVisite.note_business;
      const notesBasses =
        (conf !== null && conf < 3) || (biz !== null && biz < 3);
      if (notesBasses) {
        const notes = [conf, biz].filter((n): n is number => n !== null);
        const moy = avg(notes) ?? 0;
        raisons.push(`Note faible (${moy.toFixed(1)}/5)`);
        score++;
      }
    }

    // Critère c — Remontée(s) urgente(s) non traitée(s)
    if (nbUrg > 0) {
      const s = nbUrg > 1 ? "s" : "";
      raisons.push(`${nbUrg} remontée${s} urgente${s} non traitée${s}`);
      score++;
    }

    const niveau: NiveauRisque =
      score >= 2 ? "eleve" : score === 1 ? "modere" : "ok";

    result.set(id, { niveau, score, raisons, joursSansVisite });
  }

  return result;
}
