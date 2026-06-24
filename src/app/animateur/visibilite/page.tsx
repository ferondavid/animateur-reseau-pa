export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import BoutonAccueil from "@/components/BoutonAccueil";
import GestionVisibilite, { type LigneVis } from "@/components/GestionVisibilite";
import { Eye } from "lucide-react";

export default async function VisibilitePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visibilite")
    .select("cle, libelle, categorie, associe, bureau, ordre")
    .order("categorie")
    .order("ordre");

  const lignes = (data ?? []) as unknown as LigneVis[];

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <BoutonAccueil />

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
            <Eye size={22} style={{ color: "#6B4FD8" }} /> Visibilité
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Choisis ce que voient le Bureau et les Associés. L&apos;animateur voit toujours tout.
          </p>
        </div>

        <Navigation />

        {lignes.length === 0 ? (
          <div className="pa-card p-10 text-center">
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
              Aucune règle. Lance d&apos;abord le script SQL <code>visibilite</code>.
            </p>
          </div>
        ) : (
          <GestionVisibilite lignes={lignes} />
        )}
      </div>
    </main>
  );
}
