import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { Plus } from "lucide-react";
import TuilesVisites from "@/components/TuilesVisites";
import type { VisiteTuile } from "@/components/TuilesVisites";

export default async function VisitesPage() {
  const supabase = await createClient();
  const { data: visites } = await supabase
    .from("visites")
    .select(
      "id, magasin_id, date_prevue, date_realisee, heure_prevue, confirmee, statut, objectif, note_confiance, note_business, magasins(nom, enseigne, ville, adresse, code_postal, contact_telephone)"
    );

  const liste = (visites ?? []) as unknown as VisiteTuile[];

  // Tri « du plus proche au plus loin » : prochaines visites en premier (date croissante),
  // puis les visites passées (de la plus récente à la plus ancienne).
  const aujourdhui = new Date(Date.now() + 2 * 3600_000).toISOString().slice(0, 10);
  const dateRef = (v: VisiteTuile) => v.date_realisee ?? v.date_prevue ?? "";
  liste.sort((a, b) => {
    const da = dateRef(a), db = dateRef(b);
    if (!da) return 1;
    if (!db) return -1;
    const aFutur = da >= aujourdhui, bFutur = db >= aujourdhui;
    if (aFutur !== bFutur) return aFutur ? -1 : 1;
    return aFutur ? da.localeCompare(db) : db.localeCompare(da);
  });

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
              >
                Visites
              </h1>
              <span className="text-sm" style={{ color: "var(--pa-muted)" }}>
                {liste.length} visite{liste.length > 1 ? "s" : ""}
              </span>
            </div>
            <Link
              href="/visites/nouvelle"
              className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              Nouvelle visite
            </Link>
          </div>
          <Navigation />
        </div>

        {liste.length === 0 ? (
          <div className="pa-card p-16 text-center" style={{ marginTop: "12px" }}>
            <p style={{ color: "var(--pa-muted)" }}>Aucune visite enregistrée.</p>
          </div>
        ) : (
          <TuilesVisites visites={liste} />
        )}
      </div>
    </main>
  );
}
