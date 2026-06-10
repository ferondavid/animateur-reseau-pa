import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateRemontee, supprimerPhotoRemontee } from "../actions";
import PieceJointe from "@/components/PieceJointe";

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
      .select("id, magasin_id, type, titre, description, gravite, photo_url")
      .eq("id", id)
      .single(),
    supabase.from("magasins").select("id, nom, enseigne, ville").order("nom"),
  ]);

  if (!r) notFound();

  return (
    <main className="min-h-screen p-8">
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
                defaultValue={r.type ?? ""}
                className="pa-input"
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
                className="pa-input"
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
                className="pa-input resize-y"
              />
            </div>
          </div>

          {/* Pièce jointe existante */}
          {r.photo_url && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Pièce jointe actuelle
              </h2>
              <PieceJointe url={r.photo_url as string} />
              <div className="flex gap-2 pt-1">
                <form action={supprimerPhotoRemontee}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
                  >
                    🗑 Supprimer la pièce jointe
                  </button>
                </form>
              </div>
              <p className="text-xs text-slate-400">
                Pour remplacer, supprime d&apos;abord puis enregistre avec un nouveau fichier — ou utilise le formulaire de remontée depuis la fiche membre.
              </p>
            </div>
          )}

          {/* Gravité */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Niveau de gravité
            </h2>
            <select
              name="gravite"
              defaultValue={r.gravite ?? "normale"}
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
              href={`/remontees/${id}`}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
