export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { QUESTIONS_EVAL, moyenneNotes } from "@/lib/evaluations";
import EtoilesNote from "@/components/EtoilesNote";
import PartageEvaluation from "@/components/PartageEvaluation";
import { titreMagasin } from "@/lib/magasin";

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // id = ID de la VISITE
  const supabase = await createClient();

  // Charger la visite + magasin en parallèle avec l'éval reçue
  const [{ data: visite }, { data: evalRecue }] = await Promise.all([
    supabase
      .from("visites")
      .select("*, magasins(id, nom, enseigne, ville)")
      .eq("id", id)
      .single(),
    supabase
      .from("evaluations_visite")
      .select(
        "id, q1_ecoute, q2_pertinence, q3_solutions, q4_suivi, q5_disponibilite, q6_satisfaction_globale, commentaire_texte, created_at"
      )
      .eq("visite_id", id)
      .maybeSingle(),
  ]);

  if (!visite) notFound();

  const magasin = visite.magasins as {
    id: string;
    nom: string;
    enseigne: string | null;
    ville: string | null;
  } | null;

  const nomMagasin = magasin
    ? titreMagasin(magasin.enseigne, magasin.nom)
    : "Visite";

  const dateVisite = visite.date_realisee ?? visite.date_prevue;

  const moyAnim = (() => {
    const nc = visite.note_confiance;
    const nb = visite.note_business;
    const vals = [nc, nb].filter((n): n is number => n !== null && n > 0);
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  })();

  const moyMagasin = evalRecue
    ? moyenneNotes(evalRecue as unknown as Record<string, number | null>)
    : null;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* En-tête */}
        <div>
          <Link
            href="/evaluations"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--pa-muted)" }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Évaluations
          </Link>
          <h1
            className="mt-2 text-2xl font-bold"
            style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
          >
            {nomMagasin}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Visite du{" "}
            {dateVisite
              ? new Date(dateVisite).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
            {magasin?.ville ? ` · ${magasin.ville}` : ""}
          </p>
        </div>

        {/* Navigation (2 blocs + lien visite) */}
        <div className="space-y-4">

          {/* ── Bloc 1 : Mon évaluation (animateur) ── */}
          <div
            className="pa-card p-5 sm:p-6 space-y-4"
            style={{
              background: "#F4F2FC",
              border: "1px solid rgba(107,79,216,0.18)",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            }}
          >
            <h2
              className="text-sm font-bold uppercase tracking-wide"
              style={{ color: "#6B4FD8" }}
            >
              Mon évaluation (animateur)
            </h2>

            {moyAnim === null && (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                  Cette visite n&apos;a pas encore été notée.
                </p>
                <Link
                  href={`/visites/${id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: "#6B4FD8" }}
                >
                  Compléter la visite <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
              </div>
            )}

            {moyAnim !== null && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Confiance */}
                  <NoteBloc
                    label="Confiance"
                    note={visite.note_confiance}
                    commentaire={visite.commentaire_confiance as string | null}
                  />
                  {/* Business */}
                  <NoteBloc
                    label="Business"
                    note={visite.note_business}
                    commentaire={visite.commentaire_business as string | null}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>
                    Moyenne animateur
                  </span>
                  <span className="text-2xl font-bold" style={{ color: "#6B4FD8" }}>
                    {moyAnim.toFixed(1)}
                    <span className="text-sm font-normal" style={{ color: "#A898E8" }}>/5</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ── Bloc 2 : Évaluation reçue (magasin) ── */}
          <div
            className="pa-card p-5 sm:p-6 space-y-4"
            style={{
              background: "#FBF8EC",
              border: "1px solid rgba(176,125,20,0.18)",
              backdropFilter: "none",
              WebkitBackdropFilter: "none",
            }}
          >
            <h2
              className="text-sm font-bold uppercase tracking-wide"
              style={{ color: "#B07D14" }}
            >
              Évaluation reçue (magasin)
            </h2>

            {evalRecue ? (
              <>
                {/* 6 questions */}
                <div className="divide-y" style={{ borderColor: "var(--pa-line)" }}>
                  {QUESTIONS_EVAL.map((q) => {
                    const note = (evalRecue as unknown as Record<string, number | null>)[
                      q.key
                    ];
                    return (
                      <div
                        key={q.key}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <span className="text-sm" style={{ color: "var(--pa-ink)" }}>
                          {q.label}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <EtoilesNote note={note} mode="display" taille="sm" />
                          {note && (
                            <span
                              className="text-sm font-bold w-5 text-right"
                              style={{ color: "#B07D14" }}
                            >
                              {note}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Moyenne */}
                {moyMagasin !== null && (
                  <div
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: "#FBF1D8" }}
                  >
                    <span className="text-sm font-semibold" style={{ color: "#B07D14" }}>
                      Moyenne satisfaction
                    </span>
                    <span className="text-2xl font-bold" style={{ color: "#E8B43A" }}>
                      {moyMagasin.toFixed(1)}
                      <span className="text-sm font-normal" style={{ color: "#EAD9A8" }}>/5</span>
                    </span>
                  </div>
                )}

                {/* Commentaire */}
                {evalRecue.commentaire_texte && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.65)" }}
                  >
                    <p
                      className="text-xs font-semibold mb-2"
                      style={{ color: "var(--pa-muted)" }}
                    >
                      COMMENTAIRE
                    </p>
                    <p
                      className="text-sm leading-relaxed whitespace-pre-wrap"
                      style={{ color: "var(--pa-ink)" }}
                    >
                      {evalRecue.commentaire_texte}
                    </p>
                  </div>
                )}

                <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
                  Reçue le{" "}
                  {new Date(evalRecue.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                  Cette visite n&apos;a pas encore été évaluée par le magasin.
                </p>
                <PartageEvaluation visiteId={id} />
              </div>
            )}
          </div>

          {/* Lien vers la fiche visite */}
          <div className="pt-1">
            <Link
              href={`/visites/${id}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: "#6B4FD8" }}
            >
              Voir la fiche visite <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Composant local ─────────────────────────────────────────────────────────

function NoteBloc({
  label,
  note,
  commentaire,
}: {
  label: string;
  note: number | null;
  commentaire: string | null;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(107,79,216,0.1)" }}
    >
      <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#6B4FD8" }}>
        {label}
      </p>
      {note !== null ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <EtoilesNote note={note} mode="display" taille="sm" />
            <span className="font-bold text-sm" style={{ color: "var(--pa-ink)" }}>
              {note}/5
            </span>
          </div>
          {commentaire && (
            <p className="text-sm leading-relaxed mt-2" style={{ color: "var(--pa-muted)" }}>
              {commentaire}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
          Non noté
        </p>
      )}
    </div>
  );
}
