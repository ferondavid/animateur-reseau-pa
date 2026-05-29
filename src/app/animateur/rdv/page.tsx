export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import CardRDVDemande from "@/components/CardRDVDemande";
import type { RDVDemande } from "@/components/CardRDVDemande";
import Link from "next/link";

const TABS = [
  { key: "attente",  label: "En attente", statuts: ["demande", "reporte"] },
  { key: "confirme", label: "Confirmés",  statuts: ["confirme"] },
  { key: "passe",    label: "Passés",     statuts: ["fait"] },
  { key: "tout",     label: "Tout",       statuts: ["demande", "reporte", "confirme", "annule", "fait"] },
];

// FK explicite pour éviter PGRST201 (rendez_vous_invites crée un 2e chemin vers magasins)
const RDV_SELECT = `id, type, statut, date_souhaitee, heure_souhaitee, objet, message, lieu, lien_visio, created_at,
  magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville),
  rendez_vous_invites(magasin_id, magasins(nom, enseigne))`;

export default async function RDVAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; magasin?: string }>;
}) {
  const { tab = "attente", magasin } = await searchParams;
  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0];
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("rendez_vous")
    .select(RDV_SELECT)
    .order("date_souhaitee", { ascending: true });

  if (activeTab.key === "passe") {
    query = query.or(`statut.eq.fait,date_souhaitee.lt.${today}`);
  } else {
    query = query.in("statut", activeTab.statuts);
  }

  if (magasin) query = query.eq("magasin_id", magasin);

  const { data: rdvs, error } = await query;

  if (error) console.error("[RDV PAGE] erreur:", error);

  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, nom, enseigne")
    .eq("statut", "actif")
    .order("nom");

  const nbAttente = (rdvs ?? []).filter((r) =>
    ["demande", "reporte"].includes(r.statut)
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Rendez-vous</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {nbAttente > 0
                ? `${nbAttente} demande${nbAttente > 1 ? "s" : ""} en attente`
                : "Aucune demande en attente"}
            </p>
          </div>
          <Link
            href="/animateur/rdv/nouvelle"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm"
          >
            + Nouvelle demande
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/animateur/rdv?tab=${t.key}${magasin ? `&magasin=${magasin}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  tab === t.key
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <form method="get" action="/animateur/rdv" className="flex gap-2">
            <input type="hidden" name="tab" value={tab} />
            <select
              name="magasin"
              defaultValue={magasin ?? ""}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">Tous les magasins</option>
              {(magasins ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Filtrer
            </button>
          </form>
        </div>

        {(rdvs ?? []).length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
            <p className="text-emerald-700 font-medium">Aucun RDV dans cette catégorie 👍</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(rdvs as unknown as RDVDemande[]).map((r) => (
              <CardRDVDemande key={r.id} rdv={r} />
            ))}
          </div>
        )}

        <Link
          href="/animateur"
          className="inline-block text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Retour tableau de bord
        </Link>
      </div>
    </main>
  );
}
