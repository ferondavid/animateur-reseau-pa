export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getParametre, getParametreNumber } from "@/lib/parametres";
import Navigation from "@/components/Navigation";
import ParcoursMagasins from "@/components/ParcoursMagasins";
import type { ConfigVE } from "@/components/ParcoursMagasins";
import BoutonAccueil from "@/components/BoutonAccueil";
import { guardBureau } from "@/lib/visibilite";

export default async function ParcoursPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill_magasin?: string; prefill?: string }>;
}) {
  const { prefill_magasin, prefill } = await searchParams;
  const prefillMagasinIds = prefill
    ? prefill.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  await guardBureau("bureau_parcours");
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
        <BoutonAccueil />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>🚗 Parcours de visite</h1>
          <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
            Sélectionne les magasins, optimise l&apos;itinéraire{configVE.active ? " avec arrêts recharge" : ""} et planifie ta tournée en 1 clic.
          </p>
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
          prefillMagasinIds={prefillMagasinIds}
        />
      </div>
    </main>
  );
}
