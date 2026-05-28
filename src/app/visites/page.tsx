import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const statutStyles: Record<string, string> = {
  planifiee: "bg-blue-100 text-blue-800",
  realisee: "bg-green-100 text-green-800",
  annulee: "bg-slate-100 text-slate-600",
  reportee: "bg-orange-100 text-orange-800",
};

const statutLabels: Record<string, string> = {
  planifiee: "Planifiée",
  realisee: "Réalisée",
  annulee: "Annulée",
  reportee: "Reportée",
};

function Etoiles({ note }: { note: number | null }) {
  if (!note) return <span className="text-slate-300">—</span>;
  return (
    <span className="text-amber-400 text-base">
      {"★".repeat(note)}
      <span className="text-slate-200">{"★".repeat(5 - note)}</span>
    </span>
  );
}

export default async function VisitesPage() {
  const supabase = await createClient();
  const { data: visites } = await supabase
    .from("visites")
    .select(
      "id, date_prevue, date_realisee, statut, note_confiance, note_business, magasins(nom, enseigne, ville)"
    )
    .order("date_realisee", { ascending: false, nullsFirst: false })
    .order("date_prevue", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-slate-900">Visites</h1>
              <span className="text-sm text-slate-400">
                {visites?.length ?? 0} visite
                {(visites?.length ?? 0) > 1 ? "s" : ""}
              </span>
            </div>
            <Link
              href="/visites/nouvelle"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              + Nouvelle visite
            </Link>
          </div>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Date
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Magasin
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Statut
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Confiance
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Business
                </th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {(visites ?? []).map((v) => {
                const date = v.date_realisee ?? v.date_prevue;
                const magasin = v.magasins as unknown as {
                  nom: string;
                  enseigne: string | null;
                  ville: string | null;
                } | null;
                return (
                  <tr
                    key={v.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-700">
                      {date
                        ? new Date(date).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {magasin
                        ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[v.statut] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {statutLabels[v.statut] ?? v.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Etoiles note={v.note_confiance} />
                    </td>
                    <td className="px-6 py-4">
                      <Etoiles note={v.note_business} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/visites/${v.id}`}
                        className="text-slate-900 hover:underline font-medium"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(visites?.length ?? 0) === 0 && (
            <div className="text-center py-16 text-slate-400">
              Aucune visite enregistrée.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
