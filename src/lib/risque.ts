export type NiveauRisque = "eleve" | "modere" | "ok";

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

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/**
 * Calcule le niveau de risque par magasin, selon les 3 critères du pilotage :
 *   a — Non visité depuis > 90 jours (ou jamais)
 *   b — Note basse (confiance ou business < 3) sur la dernière visite
 *   c — Remontée urgente non traitée
 *
 * Score ≥ 2 → eleve, score = 1 → modere, score = 0 → ok.
 */
export function calculerRisqueMagasins(
  magasinIds: string[],
  visitesRealisees: VisiteRealisee[],
  remonteesUrgentes: RemonteeUrgente[]
): Map<string, RisqueMagasin> {
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

  for (const id of magasinIds) {
    const derVisite = derniereVisiteMap.get(id);
    const nbUrg = urgentesParMagasin.get(id) ?? 0;
    const raisons: string[] = [];
    let score = 0;
    let joursSansVisite: number | null = null;

    // Critère a — Pas visité depuis > 90 jours (ou jamais)
    if (!derVisite || !derVisite.date_realisee) {
      raisons.push("Jamais visité");
      score++;
    } else {
      const jours = Math.floor(
        (maintenant - new Date(derVisite.date_realisee).getTime()) / 86_400_000
      );
      joursSansVisite = jours;
      if (jours > 90) {
        raisons.push(`Non visité depuis ${jours} jours`);
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
