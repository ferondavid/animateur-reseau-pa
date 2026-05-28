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
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">
              Magasins du réseau
            </h1>
            <span className="text-sm text-slate-400">
              {magasins?.length ?? 0} magasin{(magasins?.length ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Enseigne
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Nom
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Ville
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Région
                </th>
                <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                  Statut
                </th>
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
                  <td className="px-6 py-4 text-slate-500">
                    {m.region ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[m.statut] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {statutLabels[m.statut] ?? m.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/magasins/${m.id}`}
                      className="text-slate-900 hover:underline font-medium"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(magasins?.length ?? 0) === 0 && (
            <div className="text-center py-16 text-slate-400">
              Aucun magasin trouvé.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
