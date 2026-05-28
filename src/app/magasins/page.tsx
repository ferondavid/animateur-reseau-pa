import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const statutStyles: Record<string, string> = {
  actif: "bg-green-100 text-green-800",
  pause: "bg-yellow-100 text-yellow-800",
  inactif: "bg-slate-100 text-slate-600",
};

const statutLabels: Record<string, string> = {
  actif: "Actif",
  pause: "En pause",
  inactif: "Inactif",
};

export default async function MagasinsPage() {
  const supabase = await createClient();
  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, nom, enseigne, ville, region, statut")
    .order("nom");

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">
              Magasins du réseau
            </h1>
            <span className="text-sm text-slate-400">
              {magasins?.length ?? 0} magasin
              {(magasins?.length ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
          <Navigation />
        </div>

        {/* État vide */}
        {(magasins?.length ?? 0) === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
            <p className="text-slate-400">Aucun magasin trouvé.</p>
          </div>
        )}

        {(magasins?.length ?? 0) > 0 && (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Enseigne</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Nom</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Ville</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Région</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Statut</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {(magasins ?? []).map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {m.enseigne ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{m.nom}</td>
                      <td className="px-6 py-4 text-slate-700">{m.ville}</td>
                      <td className="px-6 py-4 text-slate-500">{m.region ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[m.statut] ?? "bg-slate-100 text-slate-600"}`}>
                          {statutLabels[m.statut] ?? m.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/magasins/${m.id}`} className="text-slate-900 hover:underline font-medium">
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vue mobile : cartes empilées */}
            <div className="md:hidden space-y-3">
              {(magasins ?? []).map((m) => (
                <Link
                  key={m.id}
                  href={`/magasins/${m.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm active:bg-slate-50 transition-colors"
                >
                  {/* Enseigne (si présente) + statut */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {m.enseigne ?? "—"}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[m.statut] ?? "bg-slate-100 text-slate-600"}`}>
                      {statutLabels[m.statut] ?? m.statut}
                    </span>
                  </div>
                  {/* Nom */}
                  <p className="font-semibold text-slate-900 mb-1.5 leading-snug">
                    {m.nom}
                  </p>
                  {/* Ville + région */}
                  {(m.ville || m.region) && (
                    <p className="text-sm text-slate-500">
                      {[m.ville, m.region].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
