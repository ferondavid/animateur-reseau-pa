// Route publique — accessible SANS authentification.
// Si un middleware est ajouté plus tard, /evaluation/* doit rester dans la liste des routes publiques.

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QUESTIONS_EVAL, moyenneNotes } from "@/lib/evaluations";
import EtoilesNote from "@/components/EtoilesNote";
import FormulaireEvaluation from "./FormulaireEvaluation";

export default async function EvaluationPubliquePage({
  params,
  searchParams,
}: {
  params: Promise<{ visiteId: string }>;
  searchParams: Promise<{ merci?: string }>;
}) {
  const { visiteId } = await params;
  const { merci } = await searchParams;

  const supabase = await createClient();

  const { data: visite } = await supabase
    .from("visites")
    .select("id, date_realisee, date_prevue, statut, magasins(id, nom, enseigne)")
    .eq("id", visiteId)
    .single();

  if (!visite) notFound();

  const magasin = visite.magasins as unknown as {
    id: string;
    nom: string;
    enseigne: string | null;
  } | null;

  if (!magasin) notFound();

  // Vérifie si une évaluation existe déjà pour cette visite
  const { data: evalExistante } = await supabase
    .from("evaluations_visite")
    .select(
      "id, q1_ecoute, q2_pertinence, q3_solutions, q4_suivi, q5_disponibilite, q6_satisfaction_globale, commentaire_texte, created_at"
    )
    .eq("visite_id", visiteId)
    .maybeSingle();

  const nomMagasin = magasin.enseigne
    ? `${magasin.enseigne} — ${magasin.nom}`
    : magasin.nom;

  const dateVisite = visite.date_realisee ?? visite.date_prevue;
  const dateFormatee = dateVisite
    ? new Date(dateVisite).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // Évaluation déjà soumise → afficher le récapitulatif
  if (evalExistante) {
    const moy = moyenneNotes(evalExistante as Record<string, number | null>);

    return (
      <div className="min-h-screen bg-amber-50 p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-lg">
          {/* Message principal */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{merci === "1" ? "🎉" : "✅"}</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {merci === "1"
                ? "Merci pour votre retour !"
                : "Vous avez déjà évalué cette visite"}
            </h1>
            <p className="text-slate-500 text-sm">
              {nomMagasin} · {dateFormatee}
            </p>
          </div>

          {/* Récapitulatif des notes */}
          <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm space-y-4">
            {moy !== null && (
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Moyenne générale
                </span>
                <span className="text-2xl font-bold text-amber-500">
                  {moy.toFixed(1)}/5
                </span>
              </div>
            )}
            {QUESTIONS_EVAL.map((q) => {
              const note = (evalExistante as Record<string, number | null>)[
                q.key
              ];
              return (
                <div
                  key={q.key}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-slate-700">{q.label}</span>
                  <EtoilesNote note={note} mode="display" taille="sm" />
                </div>
              );
            })}
            {evalExistante.commentaire_texte && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Commentaire</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {evalExistante.commentaire_texte}
                </p>
              </div>
            )}
          </div>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Évaluation envoyée le{" "}
            {new Date(evalExistante.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>
    );
  }

  // Pas encore évalué → afficher le formulaire
  return (
    <FormulaireEvaluation
      visiteId={visiteId}
      magasinId={magasin.id}
      nomMagasin={nomMagasin}
      dateVisite={dateFormatee}
    />
  );
}
