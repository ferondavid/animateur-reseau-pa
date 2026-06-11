import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              Évaluations qualité
            </h1>
            <p className="mt-1" style={{ color: "var(--pa-muted)" }}>
              {liste.length} évaluation{liste.length !== 1 ? "s" : ""} reçue
              {liste.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Navigation />

        {/* Scores agrégés */}
        {liste.length > 0 && (
          <div className="space-y-4" style={{ paddingTop: "12px" }}>
            {/* Moyenne globale */}
            <div className="pa-card p-6 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#FBF1D8,#F7E6B8)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#B07D14" }}>
                  Satisfaction globale moyenne
                </p>
                <p className="text-xs" style={{ color: "#A8843E" }}>
                  Toutes questions · {liste.length} évaluation
                  {liste.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-4xl font-bold" style={{ color: "#EF9F27" }}>
                {moyGlobale !== null ? moyGlobale.toFixed(1) : "—"}
                <span className="text-lg font-medium" style={{ color: "#E0B970" }}>/5</span>
              </span>
            </div>

            {/* Grille des 6 questions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {QUESTIONS_EVAL.map((q) => {
                const moy = moyQ(q.key);
                return (
                  <div
                    key={q.key}
                    className="pa-card p-4"
                  >
                    <p className="text-xs leading-snug mb-2" style={{ color: "var(--pa-muted)" }}>
                      {q.label}
                    </p>
                    <p className="text-xl font-bold" style={{ color: "var(--pa-ink)" }}>
                      {moy !== null ? moy.toFixed(1) : "—"}
                      <span className="text-sm font-normal" style={{ color: "var(--pa-muted)" }}>
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
          <div className="pa-card p-16 text-center" style={{ marginTop: "12px" }}>
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
              Aucune évaluation reçue pour l&apos;instant.
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--pa-muted)" }}>
              Les évaluations apparaissent ici une fois qu&apos;un magasin a rempli
              le formulaire.
            </p>
          </div>
        )}

        {/* Liste des évaluations */}
        {liste.length > 0 && (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block pa-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Date</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Magasin</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Satisfaction</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Moyenne</th>
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
                        className="border-b last:border-0 transition-colors hover:bg-white/40"
                        style={{ borderColor: "var(--pa-line)" }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: "var(--pa-ink)" }}>
                          {new Date(e.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 font-semibold" style={{ color: "var(--pa-ink)" }}>
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
                        <td className="px-6 py-4 font-bold" style={{ color: "#EF9F27" }}>
                          {moy !== null ? moy.toFixed(1) + "/5" : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/evaluations/${e.id}`}
                            className="inline-flex items-center gap-1 font-semibold"
                            style={{ color: "#6B4FD8", textDecoration: "none" }}
                          >
                            Voir <ArrowRight size={14} strokeWidth={2.5} />
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
                    className="block pa-card p-4 transition-all active:scale-[.99]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: "var(--pa-ink)" }}>
                        {new Date(e.created_at).toLocaleDateString("fr-FR")}
                      </span>
                      {moy !== null && (
                        <span className="text-sm font-bold" style={{ color: "#EF9F27" }}>
                          {moy.toFixed(1)}/5
                        </span>
                      )}
                    </div>
                    <p className="font-bold mb-1.5 leading-snug" style={{ color: "var(--pa-ink)" }}>
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
