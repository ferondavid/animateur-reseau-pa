export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import BoutonAccueil from "@/components/BoutonAccueil";
import GestionComptes, { type LigneCompte } from "@/components/GestionComptes";
import { KeyRound } from "lucide-react";

type MagRow = { id: string; nom: string; enseigne: string | null; ville: string | null };
type CompteRow = { magasin_id: string | null; login: string; mot_de_passe: string; actif: boolean };

export default async function ComptesPage() {
  const supabase = await createClient();
  const [{ data: magasins }, { data: comptes }] = await Promise.all([
    supabase.from("magasins").select("id, nom, enseigne, ville").eq("statut", "actif").order("nom"),
    supabase.from("comptes").select("magasin_id, login, mot_de_passe, actif").eq("role", "membre"),
  ]);

  const byMag = new Map<string, CompteRow>();
  for (const c of (comptes ?? []) as unknown as CompteRow[]) {
    if (c.magasin_id) byMag.set(c.magasin_id, c);
  }

  const lignes: LigneCompte[] = ((magasins ?? []) as unknown as MagRow[]).map((m) => {
    const c = byMag.get(m.id);
    return {
      id: m.id, nom: m.nom, enseigne: m.enseigne, ville: m.ville,
      login: c?.login ?? "", mot_de_passe: c?.mot_de_passe ?? "",
      actif: c?.actif ?? true, aCompte: !!c,
    };
  });

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <BoutonAccueil />

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
            <KeyRound size={22} style={{ color: "#6B4FD8" }} /> Comptes des associés
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Crée, modifie ou supprime l&apos;identifiant et le mot de passe de chaque associé.
          </p>
        </div>

        <Navigation />

        <GestionComptes lignes={lignes} />
      </div>
    </main>
  );
}
