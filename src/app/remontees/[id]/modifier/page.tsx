import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateRemontee } from "../actions";

export default async function ModifierRemonteePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: r }, { data: magasins }] = await Promise.all([
    supabase
      .from("remontees")
      .select("id, magasin_id, type, titre, description, gravite")
      .eq("id", id)
      .single(),
    supabase.from("magasins").select("id, nom, enseigne, ville").order("nom"),
  ]);

  if (!r) notFound();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/remontees/${id}`}
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            ← Retour à la remontée
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Modifier la remontée
          </h1>
        </div>

        <form action={updateRemontee} className="space-y-4">
          <input type="hidden" name="id" value={r.id} />

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
                defaultValue={r.magasin_id ?? ""}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                defaultValue={r.type ?? ""}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
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
                defaultValue={r.titre ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                defaultValue={r.description ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
              />
            </div>
          </div>

          {/* Gravité */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Niveau de gravité
            </h2>
            <select
              name="gravite"
              defaultValue={r.gravite ?? "normale"}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="normale">Normale</option>
              <option value="attention">Attention</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/remontees/${id}`}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
