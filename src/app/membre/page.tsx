import { createClient } from "@/lib/supabase/server";
import RechercheMagasin from "@/components/RechercheMagasin";
import BoutonChangerRole from "@/components/BoutonChangerRole";

export default async function MembrePage() {
  const supabase = await createClient();
  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, nom, enseigne, ville, region")
    .eq("statut", "actif")
    .order("nom");

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Quel est votre magasin ?
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Sélectionnez votre magasin pour accéder à votre tableau de bord
            </p>
          </div>
          <BoutonChangerRole />
        </div>

        <RechercheMagasin magasins={magasins ?? []} />
      </div>
    </main>
  );
}
