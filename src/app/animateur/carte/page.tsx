import { createClient } from "@/lib/supabase/server";
import CarteWrapper from "@/components/CarteWrapper";
import Link from "next/link";
import { calculerRisqueMagasins } from "@/lib/risque";
import PersistRole from "@/components/PersistRole";

export const dynamic = "force-dynamic";

export default async function CartePleineEcran() {
  const supabase = await createClient();

  const [{ data: magasins }, { data: visitesPourRisque }, { data: remonteesUrgentesActives }] =
    await Promise.all([
      supabase
        .from("magasins")
        .select(
          "id, nom, enseigne, ville, region, latitude, longitude, contact_telephone, niveau"
        )
        .eq("statut", "actif")
        .not("latitude", "is", null)
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
    ]);

  const magasinsList = magasins ?? [];
  const risqueMap = calculerRisqueMagasins(
    magasinsList.map((m) => ({
      id: m.id,
      niveau: (m as unknown as { niveau?: string }).niveau ?? "standard",
    })),
    visitesPourRisque ?? [],
    remonteesUrgentesActives ?? []
  );
  const magasinsAvecRisque = magasinsList.map((m) => {
    const r = risqueMap.get(m.id);
    return {
      ...m,
      risque: r
        ? { niveau: r.niveau, raisons: r.raisons, joursSansVisite: r.joursSansVisite }
        : undefined,
    };
  });

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <PersistRole role="animateur" />

      {/* Header compact (sticky) */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
        <Link
          href="/animateur"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Retour
        </Link>

        <h1 className="text-sm font-semibold text-slate-800 inline-flex items-center gap-2">
          🗺️ Carte du réseau
          <span className="text-xs font-normal text-slate-400">
            · {magasinsList.length} magasins actifs
          </span>
        </h1>

        <Link
          href="/animateur"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700"
        >
          Vue dashboard →
        </Link>
      </header>

      {/* Carte qui prend tout l'espace restant */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <CarteWrapper magasins={magasinsAvecRisque} />
        </div>
      </div>
    </main>
  );
}
