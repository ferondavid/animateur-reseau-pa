import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changeStatutRemontee } from "./actions";
import FormulaireReponse from "./FormulaireReponse";
import BoutonSupprimerRemontee from "./BoutonSupprimerRemontee";
import PieceJointe from "@/components/PieceJointe";

const graviteConfig: Record<string, { label: string; style: string }> = {
  normale: { label: "Normale", style: "bg-slate-100 text-slate-600" },
  attention: { label: "Attention", style: "bg-orange-100 text-orange-800" },
  urgente: { label: "Urgente", style: "bg-red-100 text-red-800" },
};

const typeLabels: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Technique",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};

const statutConfig: Record<string, { label: string; style: string }> = {
  nouvelle: { label: "Nouvelle", style: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", style: "bg-orange-100 text-orange-800" },
  traitee: { label: "Traitée", style: "bg-green-100 text-green-800" },
  archivee: { label: "Archivée", style: "bg-slate-100 text-slate-600" },
};

export default async function RemonteeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: r } = await supabase
    .from("remontees")
    .select("*, magasins(id, nom, enseigne, ville)")
    .eq("id", id)
    .single();

  if (!r) notFound();

  const magasin = r.magasins as unknown as {
    id: string;
    nom: string;
    enseigne: string | null;
    ville: string | null;
  } | null;

  const gravite = graviteConfig[r.gravite as string];
  const statut = statutConfig[r.statut as string];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link
              href="/remontees"
              className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
            >
              ← Retour aux remontées
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {r.titre}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Link
              href={`/remontees/${id}/modifier`}
              className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
            >
              Modifier
            </Link>
            <BoutonSupprimerRemontee id={id} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Card : Informations */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Informations
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Magasin</dt>
                <dd>
                  {magasin ? (
                    <Link
                      href={`/magasins/${magasin.id}`}
                      className="text-slate-900 hover:underline text-sm font-medium"
                    >
                      {magasin.enseigne ? `${magasin.enseigne} — ` : ""}
                      {magasin.nom}
                      {magasin.ville ? ` (${magasin.ville})` : ""}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Type</dt>
                <dd>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {typeLabels[r.type] ?? r.type}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Gravité</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gravite?.style ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {gravite?.label ?? r.gravite}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Statut</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {statut?.label ?? r.statut}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Reçue le</dt>
                <dd className="text-slate-900 text-sm">
                  {new Date(r.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              {r.date_traitement && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">
                    Traitée le
                  </dt>
                  <dd className="text-slate-900 text-sm">
                    {new Date(r.date_traitement).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Card : Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Description
            </h2>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
              {r.description}
            </p>
            <PieceJointe url={r.photo_url as string | null} />
          </div>

          {/* Card : Réponse animateur */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Réponse animateur
            </h2>
            {r.reponse_animateur ? (
              /* Réponse déjà enregistrée */
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                    {r.reponse_animateur}
                  </p>
                </div>
                {r.date_traitement && (
                  <p className="text-xs text-slate-400">
                    Répondu le{" "}
                    {new Date(r.date_traitement).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              /* Formulaire de réponse (composant client) */
              <FormulaireReponse id={id} />
            )}
          </div>

          {/* Card : Changer le statut (hors archivée / traitée) */}
          {!["traitee", "archivee"].includes(r.statut) && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Changer le statut
              </h2>
              <div className="flex flex-wrap gap-2">
                {/* Marquer en cours si encore nouvelle */}
                {r.statut === "nouvelle" && (
                  <form action={changeStatutRemontee}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="statut" value="en_cours" />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 text-sm font-medium hover:bg-orange-100 transition-colors"
                    >
                      Marquer en cours
                    </button>
                  </form>
                )}
                {/* Archiver */}
                <form action={changeStatutRemontee}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="statut" value="archivee" />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
                  >
                    Archiver
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Bouton rouvrir si archivée */}
          {r.statut === "archivee" && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Changer le statut
              </h2>
              <form action={changeStatutRemontee}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="statut" value="nouvelle" />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Rouvrir
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
