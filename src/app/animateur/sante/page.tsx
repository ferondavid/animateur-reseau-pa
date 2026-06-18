export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import BoutonAccueil from "@/components/BoutonAccueil";
import { calculerRisqueMagasins } from "@/lib/risque";
import ScorecardReseau, { type LigneScorecard } from "@/components/ScorecardReseau";
import { Activity } from "lucide-react";

type MagasinRow = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  region: string | null;
  niveau: string | null;
};
type VisiteRow = {
  magasin_id: string;
  date_realisee: string | null;
  note_confiance: number | null;
  note_business: number | null;
};
type EvalRow = { magasin_id: string; q6_satisfaction_globale: number | null };
type CaRow = { magasin_id: string; annee: number; montant: number | string };

export default async function SanteReseauPage() {
  const supabase = await createClient();
  const anneeCourante = new Date().getFullYear();
  const anneePrecedente = anneeCourante - 1;

  const [
    { data: magasinsData },
    { data: visitesData },
    { data: remonteesUrgentesData },
    { data: remonteesOuvertesData },
    { data: actionsOuvertesData },
    { data: evalsData },
    { data: caData },
  ] = await Promise.all([
    supabase
      .from("magasins")
      .select("id, nom, enseigne, ville, region, niveau")
      .eq("statut", "actif")
      .order("nom"),
    supabase
      .from("visites")
      .select("magasin_id, date_realisee, note_confiance, note_business")
      .eq("statut", "realisee"),
    supabase
      .from("remontees")
      .select("magasin_id")
      .eq("gravite", "urgente")
      .not("statut", "in", "(traitee,archivee)"),
    supabase
      .from("remontees")
      .select("magasin_id")
      .in("statut", ["nouvelle", "en_cours"]),
    supabase
      .from("actions")
      .select("magasin_id")
      .in("statut", ["ouverte", "en_cours"])
      .not("magasin_id", "is", null),
    supabase
      .from("evaluations_visite")
      .select("magasin_id, q6_satisfaction_globale"),
    supabase
      .from("ca_mensuel")
      .select("magasin_id, annee, montant")
      .eq("segment", "global")
      .in("annee", [anneePrecedente, anneeCourante]),
  ]);

  const magasins = (magasinsData ?? []) as unknown as MagasinRow[];
  const visites = (visitesData ?? []) as unknown as VisiteRow[];
  const remonteesUrgentes = (remonteesUrgentesData ?? []) as unknown as { magasin_id: string }[];
  const remonteesOuvertes = (remonteesOuvertesData ?? []) as unknown as { magasin_id: string }[];
  const actionsOuvertes = (actionsOuvertesData ?? []) as unknown as { magasin_id: string }[];
  const evals = (evalsData ?? []) as unknown as EvalRow[];
  const ca = (caData ?? []) as unknown as CaRow[];

  // Risque (logique canonique)
  const risqueMap = calculerRisqueMagasins(
    magasins.map((m) => ({ id: m.id, niveau: m.niveau ?? "standard" })),
    visites,
    remonteesUrgentes
  );

  // Dernière visite par magasin (notes)
  const derniereVisite = new Map<string, VisiteRow>();
  for (const v of visites) {
    const ex = derniereVisite.get(v.magasin_id);
    if (!ex || (v.date_realisee && v.date_realisee > (ex.date_realisee ?? ""))) {
      derniereVisite.set(v.magasin_id, v);
    }
  }

  // Satisfaction moyenne (q6) par magasin
  const satAgg = new Map<string, { sum: number; n: number }>();
  for (const e of evals) {
    const q = e.q6_satisfaction_globale;
    if (q !== null && q > 0) {
      const ex = satAgg.get(e.magasin_id) ?? { sum: 0, n: 0 };
      ex.sum += q; ex.n++;
      satAgg.set(e.magasin_id, ex);
    }
  }

  // Comptes remontées ouvertes / actions ouvertes
  const remCount = new Map<string, number>();
  for (const r of remonteesOuvertes) remCount.set(r.magasin_id, (remCount.get(r.magasin_id) ?? 0) + 1);
  const actCount = new Map<string, number>();
  for (const a of actionsOuvertes) actCount.set(a.magasin_id, (actCount.get(a.magasin_id) ?? 0) + 1);

  // CA par magasin et année (segment global)
  const caAgg = new Map<string, { [annee: number]: number }>();
  for (const row of ca) {
    const e = caAgg.get(row.magasin_id) ?? {};
    e[row.annee] = (e[row.annee] ?? 0) + Number(row.montant);
    caAgg.set(row.magasin_id, e);
  }

  const lignes: LigneScorecard[] = magasins.map((m) => {
    const r = risqueMap.get(m.id);
    const der = derniereVisite.get(m.id);
    const sat = satAgg.get(m.id);
    const caM = caAgg.get(m.id);
    const caAct = caM?.[anneeCourante] ?? 0;
    const caPrec = caM?.[anneePrecedente] ?? 0;
    const caTrendPct = caPrec > 0 ? ((caAct - caPrec) / caPrec) * 100 : null;

    return {
      id: m.id,
      nom: m.nom,
      enseigne: m.enseigne,
      ville: m.ville,
      region: m.region,
      niveau: m.niveau ?? "standard",
      niveauRisque: r?.niveau ?? "ok",
      joursSansVisite: r?.joursSansVisite ?? null,
      noteConfiance: der?.note_confiance ?? null,
      noteBusiness: der?.note_business ?? null,
      satisfaction: sat ? sat.sum / sat.n : null,
      caTrendPct,
      nbRemontees: remCount.get(m.id) ?? 0,
      nbActions: actCount.get(m.id) ?? 0,
    };
  });

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <BoutonAccueil />

        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
          >
            <Activity size={22} style={{ color: "#6B4FD8" }} /> Santé réseau 360
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Tous les indicateurs des {magasins.length} magasins, en un coup d&apos;œil. Trie et filtre comme tu veux.
          </p>
        </div>

        <Navigation />

        <ScorecardReseau lignes={lignes} />
      </div>
    </main>
  );
}
