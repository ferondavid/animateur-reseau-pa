import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import EtoilesNote from "@/components/EtoilesNote";
import { QUESTIONS_EVAL, moyenneNotes } from "@/lib/evaluations";

export default async function EvaluationsPage() {
  const supabase = await createClient();

  const { data: evaluations } = await supabase
    .from("evaluations_visite")
    .select(
      "id, visite_id, q1_ecoute, q2_pertinence, q3_solutions, q4_suivi, q5_disponibilite, q6_satisfaction_globale, commentaire_texte, created_at, magasins(nom, enseigne)"
    )
    .order("created_at", { ascending: false });

  const liste = evaluations ?? [];

  // Moyennes par question sur toutes les évaluations
  function moyQ(key: string): number | null {
    const vals = liste
      .map((e) => (e as unknown as Record<string, number | null>)[key])
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  // Moyenne globale (toutes questions, toutes évaluations)
  const toutesNotes = liste.flatMap((e) =>
    QUESTIONS_EVAL.map(
      (q) => (e as unknown as Record<string, number | null>)[q.key]
    ).filter((v): v is number => typeof v === "number" && v > 0)
  );
  const moyGlobale =
    toutesNotes.length > 0
      ? toutesNotes.reduce((s, v) => s + v, 0) / toutesNotes.length
      : null;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Évaluations qualité
            </h1>
            <p className="text-slate-500 mt-1">
              {liste.length} évaluation{liste.length !== 1 ? "s" : ""} reçue
              {liste.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Navigation />

        {/* Scores agrégés */}
        {liste.length > 0 && (
          <div className="space-y-4">
            {/* Moyenne globale */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                  Satisfaction globale moyenne
                </p>
                <p className="text-xs text-slate-500">
                  Toutes questions · {liste.length} évaluation
                  {liste.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-4xl font-bold text-amber-500">
                {moyGlobale !== null ? moyGlobale.toFixed(1) : "—"}
                <span className="text-lg font-medium text-amber-300">/5</span>
              </span>
            </div>

            {/* Grille des 6 questions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {QUESTIONS_EVAL.map((q) => {
                const moy = moyQ(q.key);
                return (
                  <div
                    key={q.key}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                  >
                    <p className="text-xs text-slate-500 leading-snug mb-2">
                      {q.label}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {moy !== null ? moy.toFixed(1) : "—"}
                      <span className="text-sm font-normal text-slate-400">
                        /5
                      </span>
                    </p>
                    <EtoilesNote
                      note={moy !== null ? Math.round(moy) : null}
                      mode="display"
                      taille="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* État vide */}
        {liste.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
            <p className="text-slate-400 text-sm">
              Aucune évaluation reçue pour l'instant.
            </p>
            <p className="text-slate-400 text-xs mt-2">
              Les évaluations apparaissent ici une fois qu'un magasin a rempli
              le formulaire.
            </p>
          </div>
        )}

        {/* Liste des évaluations */}
        {liste.length > 0 && (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                      Date
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                      Magasin
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                      Satisfaction
                    </th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">
                      Moyenne
                    </th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {liste.map((e) => {
                    const magasin = e.magasins as unknown as {
                      nom: string;
                      enseigne: string | null;
                    } | null;
                    const moy = moyenneNotes(
                      e as unknown as Record<string, number | null>
                    );
                    return (
                      <tr
                        key={e.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {magasin
                            ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <EtoilesNote
                            note={e.q6_satisfaction_globale}
                            mode="display"
                            taille="sm"
                          />
                        </td>
                        <td className="px-6 py-4 font-semibold text-amber-600">
                          {moy !== null ? moy.toFixed(1) + "/5" : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/evaluations/${e.id}`}
                            className="text-slate-900 hover:underline font-medium"
                          >
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vue mobile : cartes */}
            <div className="md:hidden space-y-3">
              {liste.map((e) => {
                const magasin = e.magasins as unknown as {
                  nom: string;
                  enseigne: string | null;
                } | null;
                const moy = moyenneNotes(e as unknown as Record<string, number | null>);
                return (
                  <Link
                    key={e.id}
                    href={`/evaluations/${e.id}`}
                    className="block bg-white rounded-xl border border-slate-200 p-4 shadow-sm active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        {new Date(e.created_at).toLocaleDateString("fr-FR")}
                      </span>
                      {moy !== null && (
                        <span className="text-sm font-bold text-amber-500">
                          {moy.toFixed(1)}/5
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 mb-1.5 leading-snug">
                      {magasin
                        ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                        : "—"}
                    </p>
                    <EtoilesNote
                      note={e.q6_satisfaction_globale}
                      mode="display"
                      taille="sm"
                    />
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
