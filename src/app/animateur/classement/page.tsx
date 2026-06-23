export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import BoutonAccueil from "@/components/BoutonAccueil";
import ClassementCA, { type LigneClassement } from "@/components/ClassementCA";
import { Trophy } from "lucide-react";

type Row = {
  magasin_id: string;
  ca_global: number | null;
  ca_leaders: number | null;
  pct_leaders: number | null;
  bfa_associe: number | null;
  rang_ca_leaders: number | null;
  magasins: { nom: string; enseigne: string | null; ville: string | null } | null;
};

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default async function ClassementPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ca_bfa")
    .select("magasin_id, ca_global, ca_leaders, pct_leaders, bfa_associe, rang_ca_leaders, magasins(nom, enseigne, ville)")
    .eq("periode", "fin mai 2026");

  const rows = (data ?? []) as unknown as Row[];
  const lignes: LigneClassement[] = rows.map((r) => ({
    id: r.magasin_id,
    nom: r.magasins?.nom ?? "—",
    enseigne: r.magasins?.enseigne ?? null,
    ville: r.magasins?.ville ?? null,
    ca_global: r.ca_global,
    ca_leaders: r.ca_leaders,
    pct_leaders: r.pct_leaders,
    bfa_associe: r.bfa_associe,
    rang_ca_leaders: r.rang_ca_leaders,
  }));

  const totalCA = rows.reduce((s, r) => s + (Number(r.ca_global) || 0), 0);
  const totalLeaders = rows.reduce((s, r) => s + (Number(r.ca_leaders) || 0), 0);
  const totalBFA = rows.reduce((s, r) => s + (Number(r.bfa_associe) || 0), 0);

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <BoutonAccueil />

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
            <Trophy size={22} style={{ color: "#6B4FD8" }} /> Classement CA Leaders
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Cumul fin mai 2026 · classé par CA réalisé avec les Leaders.
          </p>
        </div>

        <Navigation />

        {lignes.length === 0 ? (
          <div className="pa-card p-10 text-center">
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
              Aucune donnée CA / BFA. Lance d&apos;abord l&apos;import (script SQL <code>ca_bfa</code>).
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="pa-card p-4 text-center">
                <p className="text-xl font-bold" style={{ color: "var(--pa-ink)" }}>{eur(totalCA)}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>CA global réseau</p>
              </div>
              <div className="pa-card p-4 text-center">
                <p className="text-xl font-bold" style={{ color: "#6B4FD8" }}>{eur(totalLeaders)}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>CA Leaders ({totalCA > 0 ? Math.round((totalLeaders / totalCA) * 100) : 0}%)</p>
              </div>
              <div className="pa-card p-4 text-center">
                <p className="text-xl font-bold" style={{ color: "#0F8C68" }}>{eur(totalBFA)}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>BFA associés total</p>
              </div>
            </div>

            <ClassementCA lignes={lignes} />
          </>
        )}
      </div>
    </main>
  );
}
