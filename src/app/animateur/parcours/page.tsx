export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getParametre, getParametreNumber } from "@/lib/parametres";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import ParcoursMagasins from "@/components/ParcoursMagasins";
import type { ConfigVE } from "@/components/ParcoursMagasins";

export default async function ParcoursPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill_magasin?: string }>;
}) {
  const { prefill_magasin } = await searchParams;
  const supabase = await createClient();

  const [
    { data: magasins },
    veActif,
    autonomieKm,
    seuilPct,
    ciblePct,
    chargeDepartPct,
    tempsRechargeMin,
  ] = await Promise.all([
    supabase
      .from("magasins")
      .select("id, nom, enseigne, ville, region, latitude, longitude, niveau")
      .eq("statut", "actif")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("nom"),
    getParametre("vehicule_electrique", "false"),
    getParametreNumber("autonomie_km", 300),
    getParametreNumber("seuil_recharge_pct", 20),
    getParametreNumber("cible_recharge_pct", 80),
    getParametreNumber("charge_depart_pct", 100),
    getParametreNumber("temps_recharge_min", 25),
  ]);

  const configVE: ConfigVE = {
    active: veActif === "true",
    autonomieKm,
    seuilPct,
    ciblePct,
    chargeDepartPct,
    tempsRechargeMin,
  };

  const apiKeyOk = !!process.env.OPENCHARGEMAP_API_KEY;

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">🚗 Parcours de visite</h1>
            <p className="text-slate-500 text-sm mt-1">
              Sélectionne les magasins, optimise l&apos;itinéraire{configVE.active ? " avec arrêts recharge" : ""} et planifie ta tournée en 1 clic.
            </p>
          </div>
          <Link
            href="/animateur"
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            ← Retour dashboard
          </Link>
        </div>

        <Navigation />

        <ParcoursMagasins
          magasins={
            (magasins ?? []) as Array<{
              id: string;
              nom: string;
              enseigne: string | null;
              ville: string | null;
              region: string | null;
              latitude: number;
              longitude: number;
              niveau: string | null;
            }>
          }
          configVE={configVE}
          openChargeMapOk={apiKeyOk}
          prefillMagasinId={prefill_magasin}
        />
      </div>
    </main>
  );
}
