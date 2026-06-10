import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { changeStatutAction } from "./actions";
import FormulaireRealiser from "./FormulaireRealiser";
import BoutonSupprimerAction from "./BoutonSupprimerAction";

const urgenceConfig: Record<number, { label: string; style: string }> = {
  1: { label: "Info", style: "bg-slate-100 text-slate-600" },
  2: { label: "Important", style: "bg-orange-100 text-orange-800" },
  3: { label: "Urgent", style: "bg-red-100 text-red-800" },
};

const statutConfig: Record<string, { label: string; style: string }> = {
  ouverte: { label: "Ouverte", style: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", style: "bg-orange-100 text-orange-800" },
  realisee: { label: "Réalisée", style: "bg-green-100 text-green-800" },
  annulee: { label: "Annulée", style: "bg-slate-100 text-slate-600" },
};

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: action } = await supabase
    .from("actions")
    .select("*, magasins(id, nom, enseigne)")
    .eq("id", id)
    .single();

  if (!action) notFound();

  const magasin = action.magasins as unknown as {
    id: string;
    nom: string;
    enseigne: string | null;
  } | null;

  const urgence = urgenceConfig[action.niveau_urgence as number];
  const statut = statutConfig[action.statut as string];
  const today = new Date().toISOString().split("T")[0];
  const deadlineDepasse =
    action.deadline &&
    action.deadline < today &&
    !["realisee", "annulee"].includes(action.statut);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link
              href="/actions-reseau"
              className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
            >
              ← Retour aux actions
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {action.titre}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Link
              href={`/actions-reseau/${id}/modifier`}
              className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
            >
              Modifier
            </Link>
            <BoutonSupprimerAction id={id} />
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
                <dt className="text-xs text-slate-400 mb-0.5">Statut</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {statut?.label ?? action.statut}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Urgence</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgence?.style ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {urgence?.label ?? action.niveau_urgence}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Portée</dt>
                <dd>
                  {action.portee === "reseau" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                      Réseau
                    </span>
                  ) : magasin ? (
                    <Link
                      href={`/magasins/${magasin.id}`}
                      className="text-slate-900 hover:underline text-sm font-medium"
                    >
                      {magasin.enseigne ? `${magasin.enseigne} — ` : ""}
                      {magasin.nom}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Deadline</dt>
                <dd
                  className={`text-sm ${deadlineDepasse ? "text-red-600 font-medium" : "text-slate-900"}`}
                >
                  {action.deadline
                    ? new Date(action.deadline).toLocaleDateString("fr-FR")
                    : "—"}
                  {deadlineDepasse && (
                    <span className="ml-1 text-xs">(dépassée)</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Créée le</dt>
                <dd className="text-slate-900 text-sm">
                  {new Date(action.created_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Card : Description */}
          {action.description && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Description
              </h2>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                {action.description}
              </p>
            </div>
          )}

          {/* Card : Réalisation (si réalisée) */}
          {action.statut === "realisee" && action.realise_le && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-4">
                Réalisation
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-green-600 mb-0.5">Réalisée le</dt>
                  <dd className="text-slate-900 text-sm">
                    {new Date(action.realise_le).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                {action.commentaire_realisation && (
                  <div>
                    <dt className="text-xs text-green-600 mb-0.5">
                      Commentaire
                    </dt>
                    <dd className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {action.commentaire_realisation}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Card : Changer le statut */}
          {action.statut !== "realisee" && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Changer le statut
              </h2>
              <div className="flex flex-wrap items-start gap-2">
                {/* Marquer en cours (si pas encore en cours ou annulée) */}
                {action.statut === "ouverte" && (
                  <form action={changeStatutAction}>
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

                {/* Rouvrir (si annulée) */}
                {action.statut === "annulee" && (
                  <form action={changeStatutAction}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="statut" value="ouverte" />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Rouvrir
                    </button>
                  </form>
                )}

                {/* Marquer réalisée (formulaire client avec commentaire optionnel) */}
                {action.statut !== "annulee" && (
                  <FormulaireRealiser id={id} />
                )}

                {/* Annuler (si pas déjà annulée) */}
                {action.statut !== "annulee" && (
                  <form action={changeStatutAction}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="statut" value="annulee" />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                      Annuler l'action
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
