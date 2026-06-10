import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoutonSupprimerVisite from "./BoutonSupprimerVisite";
import PartageEvaluation from "@/components/PartageEvaluation";
import EtoilesNote from "@/components/EtoilesNote";
import { moyenneNotes } from "@/lib/evaluations";

const urgenceActionConfig: Record<number, { label: string; style: string }> = {
  1: { label: "Info", style: "bg-slate-100 text-slate-600" },
  2: { label: "Important", style: "bg-orange-100 text-orange-800" },
  3: { label: "Urgent", style: "bg-red-100 text-red-800" },
};

const statutActionConfig: Record<string, { label: string; style: string }> = {
  ouverte: { label: "Ouverte", style: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", style: "bg-orange-100 text-orange-800" },
};

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
  if (!note) return null;
  return (
    <span className="text-3xl text-amber-400 leading-none">
      {"★".repeat(note)}
      <span className="text-slate-200">{"★".repeat(5 - note)}</span>
    </span>
  );
}

function Bloc({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-slate-400 mb-1">{label}</dt>
      <dd className="text-slate-900 whitespace-pre-wrap leading-relaxed">
        {value}
      </dd>
    </div>
  );
}

export default async function VisiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: v } = await supabase
    .from("visites")
    .select("*, magasins(id, nom, enseigne, ville)")
    .eq("id", id)
    .single();

  if (!v) notFound();

  const magasin = v.magasins as {
    id: string;
    nom: string;
    enseigne: string | null;
    ville: string | null;
  } | null;

  // Fetches parallèles : actions ouvertes + évaluation existante
  const [{ data: actionsLiees }, { data: evalExistante }] = await Promise.all([
    magasin
      ? supabase
          .from("actions")
          .select("id, titre, niveau_urgence, statut, deadline")
          .eq("magasin_id", magasin.id)
          .in("statut", ["ouverte", "en_cours"])
          .order("niveau_urgence", { ascending: false })
          .order("deadline", { ascending: true, nullsFirst: false })
      : Promise.resolve({
          data: [] as {
            id: string;
            titre: string;
            niveau_urgence: number;
            statut: string;
            deadline: string | null;
          }[],
        }),
    supabase
      .from("evaluations_visite")
      .select(
        "id, q1_ecoute, q2_pertinence, q3_solutions, q4_suivi, q5_disponibilite, q6_satisfaction_globale, commentaire_texte"
      )
      .eq("visite_id", id)
      .maybeSingle(),
  ]);

  const nomMagasin = magasin
    ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
    : "Visite";

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link
              href="/visites"
              className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
            >
              ← Visites
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {nomMagasin}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {v.date_realisee
                ? `Réalisée le ${new Date(v.date_realisee).toLocaleDateString("fr-FR")}`
                : v.date_prevue
                  ? `Prévue le ${new Date(v.date_prevue).toLocaleDateString("fr-FR")}`
                  : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Link
              href={`/visites/${id}/modifier`}
              className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
            >
              Modifier
            </Link>
            <BoutonSupprimerVisite id={id} magasinId={magasin?.id} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Informations */}
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
                      className="text-slate-900 hover:underline"
                    >
                      {nomMagasin}
                      {magasin.ville ? ` (${magasin.ville})` : ""}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Statut</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[v.statut] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {statutLabels[v.statut] ?? v.statut}
                  </span>
                </dd>
              </div>
              {v.date_prevue && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">Date prévue</dt>
                  <dd className="text-slate-900">
                    {new Date(v.date_prevue).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
              {v.date_realisee && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">
                    Date réalisée
                  </dt>
                  <dd className="text-slate-900">
                    {new Date(v.date_realisee).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
              {v.duree_minutes && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">Durée</dt>
                  <dd className="text-slate-900">{v.duree_minutes} min</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Objectif */}
          {v.objectif && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Objectif
              </h2>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {v.objectif}
              </p>
            </div>
          )}

          {/* Compte-rendu */}
          {(v.compte_rendu || v.points_positifs || v.points_attention) && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Compte-rendu
              </h2>
              <dl className="space-y-4">
                <Bloc label="Compte-rendu général" value={v.compte_rendu} />
                <Bloc label="Points positifs" value={v.points_positifs} />
                <Bloc label="Points d'attention" value={v.points_attention} />
              </dl>
            </div>
          )}

          {/* Actions */}
          {(v.actions_decidees || v.prochaine_etape) && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Actions
              </h2>
              <dl className="space-y-4">
                <Bloc label="Actions décidées" value={v.actions_decidees} />
                <Bloc label="Prochaine étape" value={v.prochaine_etape} />
              </dl>
            </div>
          )}

          {/* Card : Actions de suivi (uniquement si la visite est liée à un magasin) */}
          {magasin && (() => {
            const today = new Date().toISOString().split("T")[0];
            // Lien vers la création : pré-remplit magasin + description si actions_decidees renseigné
            const urlCreer =
              `/actions-reseau/nouvelle?magasin_id=${magasin.id}` +
              (v.actions_decidees
                ? `&description=${encodeURIComponent(v.actions_decidees)}`
                : "");

            return (
              <div className="pa-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Actions de suivi
                  </h2>
                  <Link
                    href={urlCreer}
                    className="pa-btn-primary px-3 py-1.5 rounded-xl text-xs font-medium"
                  >
                    + Créer une action
                  </Link>
                </div>

                {(actionsLiees ?? []).length === 0 ? (
                  <p className="text-slate-400 text-sm">
                    Aucune action ouverte pour ce magasin.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {(actionsLiees ?? []).map((a) => {
                      const urgence =
                        urgenceActionConfig[a.niveau_urgence as number];
                      const statut =
                        statutActionConfig[a.statut as string];
                      const depasse = a.deadline && a.deadline < today;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgence?.style ?? "bg-slate-100 text-slate-600"}`}
                            >
                              {urgence?.label ?? a.niveau_urgence}
                            </span>
                            <span className="text-sm text-slate-900 font-medium truncate">
                              {a.titre}
                            </span>
                            <span
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}
                            >
                              {statut?.label ?? a.statut}
                            </span>
                            {a.deadline && (
                              <span
                                className={`shrink-0 text-xs ${depasse ? "text-red-600 font-medium" : "text-slate-400"}`}
                              >
                                {new Date(a.deadline).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/actions-reseau/${a.id}`}
                            className="shrink-0 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors ml-3"
                          >
                            Voir →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Card évaluation qualité — uniquement pour les visites réalisées */}
          {v.statut === "realisee" && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Évaluation qualité
              </h2>

              {evalExistante ? (
                // Évaluation reçue : afficher le résumé
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Note globale :{" "}
                      <EtoilesNote
                        note={evalExistante.q6_satisfaction_globale}
                        mode="display"
                        taille="sm"
                      />
                    </p>
                    {moyenneNotes(evalExistante as Record<string, number | null>) !== null && (
                      <span className="text-sm font-semibold text-amber-500">
                        Moy.{" "}
                        {moyenneNotes(
                          evalExistante as Record<string, number | null>
                        )!.toFixed(1)}
                        /5
                      </span>
                    )}
                  </div>
                  {evalExistante.commentaire_texte && (
                    <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {evalExistante.commentaire_texte}
                    </p>
                  )}
                  <Link
                    href={`/evaluations/${evalExistante.id}`}
                    className="inline-block text-sm text-blue-600 hover:underline font-medium"
                  >
                    Voir le détail →
                  </Link>
                </div>
              ) : (
                // Pas encore évaluée : proposer de copier le lien
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Cette visite n'a pas encore été évaluée. Partagez ce lien
                    au gérant pour qu'il puisse noter la visite.
                  </p>
                  <PartageEvaluation visiteId={id} />
                </div>
              )}
            </div>
          )}

          {/* Indicateurs */}
          {(v.note_confiance || v.note_business) && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Indicateurs
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {v.note_confiance && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Confiance</p>
                    <Etoiles note={v.note_confiance} />
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {v.note_confiance}/5
                    </p>
                    {v.commentaire_confiance && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {v.commentaire_confiance}
                      </p>
                    )}
                  </div>
                )}
                {v.note_business && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Business</p>
                    <Etoiles note={v.note_business} />
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {v.note_business}/5
                    </p>
                    {v.commentaire_business && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {v.commentaire_business}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
