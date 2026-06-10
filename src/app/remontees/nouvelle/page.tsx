import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createRemontee } from "../[id]/actions";

export default async function NouvelleRemonteePage({
  searchParams,
}: {
  searchParams: Promise<{ magasin_id?: string }>;
}) {
  const { magasin_id } = await searchParams;
  const supabase = await createClient();

  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, nom, enseigne, ville")
    .order("nom");

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/remontees"
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            ← Retour aux remontées
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Nouvelle remontée terrain
          </h1>
        </div>

        <form action={createRemontee} className="space-y-4">
          {/* Informations principales */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Informations
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Magasin <span className="text-red-400 ml-0.5">*</span>
              </label>
              <select
                name="magasin_id"
                required
                defaultValue={magasin_id ?? ""}
                className="pa-input"
              >
                <option value="">— Sélectionner un magasin —</option>
                {(magasins ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.enseigne ? `${m.enseigne} — ` : ""}
                    {m.nom}
                    {m.ville ? ` (${m.ville})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Type <span className="text-red-400 ml-0.5">*</span>
              </label>
              <select
                name="type"
                required
                defaultValue=""
                className="pa-input"
              >
                <option value="" disabled>
                  — Choisir un type —
                </option>
                <option value="commerciale">Commerciale</option>
                <option value="sav_technique">SAV / Technique</option>
                <option value="concurrence">Concurrence</option>
                <option value="opportunite">Opportunité</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Titre <span className="text-red-400 ml-0.5">*</span>
              </label>
              <input
                type="text"
                name="titre"
                required
                autoFocus
                className="pa-input"
                placeholder="Résumé en une ligne"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Description <span className="text-red-400 ml-0.5">*</span>
              </label>
              <textarea
                name="description"
                required
                rows={4}
                className="pa-input resize-y"
                placeholder="Décrivez la situation en détail…"
              />
            </div>
          </div>

          {/* Gravité */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Niveau de gravité
            </h2>
            <select
              name="gravite"
              defaultValue="normale"
              className="pa-input"
            >
              <option value="normale">Normale</option>
              <option value="attention">Attention</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/remontees"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
            >
              Enregistrer la remontée
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
