export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import EtoilesNote from "@/components/EtoilesNote";
import { QUESTIONS_EVAL, moyenneNotes } from "@/lib/evaluations";
import { titreMagasin } from "@/lib/magasin";
import { guardBureau } from "@/lib/visibilite";

// Moyenne des notes animateur (confiance + business)
function moyAnim(nc: number | null, nb: number | null): number | null {
  const vals = [nc, nb].filter((n): n is number => n !== null && n > 0);
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export default async function EvaluationsPage() {
  await guardBureau("bureau_evaluations");
  const supabase = await createClient();

  // Requêtes parallèles : visites réalisées + toutes les évaluations reçues
  const [{ data: visitesData }, { data: evalsData }] = await Promise.all([
    supabase
      .from("visites")
      .select("id, date_realisee, note_confiance, note_business, magasins(id, nom, enseigne, ville)")
      .eq("statut", "realisee")
      .order("date_realisee", { ascending: false }),
    supabase
      .from("evaluations_visite")
      .select(
        "id, visite_id, q1_ecoute, q2_pertinence, q3_solutions, q4_suivi, q5_disponibilite, q6_satisfaction_globale, commentaire_texte, created_at"
      ),
  ]);

  const visites = visitesData ?? [];
  const evalsArr = evalsData ?? [];

  // Index visite_id → eval reçue
  type EvalItem = (typeof evalsArr)[number];
  const evalParVisite = new Map<string, EvalItem>();
  for (const ev of evalsArr) {
    if (ev.visite_id) evalParVisite.set(ev.visite_id, ev);
  }

  // Garder uniquement les visites avec au moins une note (animateur OU magasin)
  const liste = visites.filter(
    (v) =>
      v.note_confiance !== null ||
      v.note_business !== null ||
      evalParVisite.has(v.id)
  );

  // Évals reçues correspondant à la liste filtrée (pour l'agrégat)
  const evalsRecues = liste
    .map((v) => evalParVisite.get(v.id))
    .filter((e): e is EvalItem => e !== undefined);

  // Moyennes par question (évals reçues seulement)
  function moyQ(key: string): number | null {
    const vals = evalsRecues
      .map((e) => (e as unknown as Record<string, number | null>)[key])
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  const toutesNotes = evalsRecues.flatMap((e) =>
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
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
            >
              Évaluations qualité
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--pa-muted)" }}>
              {liste.length} visite{liste.length !== 1 ? "s" : ""} avec évaluation
              {evalsRecues.length > 0
                ? ` · ${evalsRecues.length} retour${evalsRecues.length !== 1 ? "s" : ""} magasin`
                : ""}
            </p>
          </div>
        </div>

        <Navigation />

        {/* Scores agrégés (évals reçues seulement) */}
        {evalsRecues.length > 0 && (
          <div className="space-y-4" style={{ paddingTop: "12px" }}>
            {/* Satisfaction globale moyenne */}
            <div
              className="pa-card p-6 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg,#FBF1D8,#F7E6B8)" }}
            >
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-wide mb-1"
                  style={{ color: "#B07D14" }}
                >
                  Satisfaction globale moyenne
                </p>
                <p className="text-xs" style={{ color: "#A8843E" }}>
                  {evalsRecues.length} évaluation{evalsRecues.length !== 1 ? "s" : ""} magasin reçue{evalsRecues.length !== 1 ? "s" : ""}
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
                  <div key={q.key} className="pa-card p-4">
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
            <p className="text-sm font-medium" style={{ color: "var(--pa-muted)" }}>
              Aucune évaluation pour l&apos;instant.
            </p>
            <p className="text-xs mt-2" style={{ color: "var(--pa-muted)" }}>
              Cette section se remplit au fil des visites notées et des retours magasin.
            </p>
          </div>
        )}

        {/* Liste */}
        {liste.length > 0 && (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block pa-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Date</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Magasin</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Ma note</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Note reçue</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {liste.map((v) => {
                    const mag = v.magasins as unknown as {
                      nom: string;
                      enseigne: string | null;
                    } | null;
                    const ev = evalParVisite.get(v.id);
                    const mAnim = moyAnim(v.note_confiance, v.note_business);
                    const mRecue = ev
                      ? moyenneNotes(ev as unknown as Record<string, number | null>)
                      : null;
                    return (
                      <tr
                        key={v.id}
                        className="border-b last:border-0 transition-colors hover:bg-white/40"
                        style={{ borderColor: "var(--pa-line)" }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: "var(--pa-ink)" }}>
                          {v.date_realisee
                            ? new Date(v.date_realisee).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="px-6 py-4 font-semibold" style={{ color: "var(--pa-ink)" }}>
                          {mag ? titreMagasin(mag.enseigne, mag.nom) : "—"}
                        </td>
                        {/* Ma note animateur */}
                        <td className="px-6 py-4">
                          {mAnim !== null ? (
                            <div className="flex items-center gap-2">
                              <EtoilesNote note={Math.round(mAnim)} mode="display" taille="sm" />
                              <span className="text-xs font-bold" style={{ color: "#6B4FD8" }}>
                                {mAnim.toFixed(1)}/5
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: "var(--pa-muted)" }}>—</span>
                          )}
                        </td>
                        {/* Note reçue magasin */}
                        <td className="px-6 py-4">
                          {ev ? (
                            <div className="flex items-center gap-2">
                              <EtoilesNote
                                note={ev.q6_satisfaction_globale}
                                mode="display"
                                taille="sm"
                              />
                              {mRecue !== null && (
                                <span className="text-xs font-bold" style={{ color: "#EF9F27" }}>
                                  {mRecue.toFixed(1)}/5
                                </span>
                              )}
                            </div>
                          ) : (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: "#ECEAF3", color: "#6F6982" }}
                            >
                              En attente
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/evaluations/${v.id}`}
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

            {/* Mobile : cartes */}
            <div className="md:hidden space-y-3">
              {liste.map((v) => {
                const mag = v.magasins as unknown as {
                  nom: string;
                  enseigne: string | null;
                } | null;
                const ev = evalParVisite.get(v.id);
                const mAnim = moyAnim(v.note_confiance, v.note_business);
                const mRecue = ev
                  ? moyenneNotes(ev as unknown as Record<string, number | null>)
                  : null;
                return (
                  <Link
                    key={v.id}
                    href={`/evaluations/${v.id}`}
                    className="block pa-card p-4 transition-all active:scale-[.99]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium" style={{ color: "var(--pa-muted)" }}>
                        {v.date_realisee
                          ? new Date(v.date_realisee).toLocaleDateString("fr-FR")
                          : "—"}
                      </span>
                      <div className="flex items-center gap-2">
                        {mAnim !== null && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "#EDEBFB", color: "#6B4FD8" }}
                          >
                            {mAnim.toFixed(1)}/5
                          </span>
                        )}
                        {mRecue !== null && (
                          <span className="text-sm font-bold" style={{ color: "#EF9F27" }}>
                            {mRecue.toFixed(1)}/5
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-bold mb-1.5 leading-snug" style={{ color: "var(--pa-ink)" }}>
                      {mag ? titreMagasin(mag.enseigne, mag.nom) : "—"}
                    </p>
                    <div className="flex items-center gap-3">
                      {/* Ma note */}
                      {mAnim !== null && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs" style={{ color: "var(--pa-muted)" }}>Moi :</span>
                          <EtoilesNote note={Math.round(mAnim)} mode="display" taille="sm" />
                        </div>
                      )}
                      {/* Note reçue */}
                      {ev ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs" style={{ color: "var(--pa-muted)" }}>Magasin :</span>
                          <EtoilesNote
                            note={ev.q6_satisfaction_globale}
                            mode="display"
                            taille="sm"
                          />
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: "#ECEAF3", color: "#6F6982" }}
                        >
                          En attente
                        </span>
                      )}
                    </div>
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
