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

// Version compacte pour les cartes mobile
function EtoilesInline({ note }: { note: number | null }) {
  if (!note) return null;
  return (
    <span className="text-amber-400 text-sm">{"★".repeat(note)}</span>
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
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-4 mb-6 sm:mb-8">
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
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors shrink-0"
            >
              + Nouvelle visite
            </Link>
          </div>
          <Navigation />
        </div>

        {/* État vide */}
        {(visites?.length ?? 0) === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
            <p className="text-slate-400">Aucune visite enregistrée.</p>
          </div>
        )}

        {(visites?.length ?? 0) > 0 && (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Date</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Magasin</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Statut</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Confiance</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Business</th>
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
                          {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {magasin
                            ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[v.statut] ?? "bg-slate-100 text-slate-600"}`}>
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
                          <Link href={`/visites/${v.id}`} className="text-slate-900 hover:underline font-medium">
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vue mobile : cartes empilées */}
            <div className="md:hidden space-y-3">
              {(visites ?? []).map((v) => {
                const date = v.date_realisee ?? v.date_prevue;
                const magasin = v.magasins as unknown as {
                  nom: string;
                  enseigne: string | null;
                  ville: string | null;
                } | null;
                return (
                  <Link
                    key={v.id}
                    href={`/visites/${v.id}`}
                    className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm active:bg-slate-50 transition-colors"
                  >
                    {/* Date + statut */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[v.statut] ?? "bg-slate-100 text-slate-600"}`}>
                        {statutLabels[v.statut] ?? v.statut}
                      </span>
                    </div>
                    {/* Magasin */}
                    <p className="font-semibold text-slate-900 mb-1.5 leading-snug">
                      {magasin
                        ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                        : "—"}
                    </p>
                    {/* Notes (si présentes) */}
                    {(v.note_confiance || v.note_business) && (
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {v.note_confiance && (
                          <span>
                            C&nbsp;<EtoilesInline note={v.note_confiance} />
                          </span>
                        )}
                        {v.note_business && (
                          <span>
                            B&nbsp;<EtoilesInline note={v.note_business} />
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
