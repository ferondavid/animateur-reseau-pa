import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QUESTIONS_EVAL, moyenneNotes } from "@/lib/evaluations";
import EtoilesNote from "@/components/EtoilesNote";

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: e } = await supabase
    .from("evaluations_visite")
    .select(
      "*, magasins(id, nom, enseigne, ville), visites(id, date_realisee, date_prevue)"
    )
    .eq("id", id)
    .single();

  if (!e) notFound();

  const magasin = e.magasins as {
    id: string;
    nom: string;
    enseigne: string | null;
    ville: string | null;
  } | null;

  const visite = e.visites as {
    id: string;
    date_realisee: string | null;
    date_prevue: string | null;
  } | null;

  const nomMagasin = magasin
    ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
    : "—";

  const dateVisite = visite?.date_realisee ?? visite?.date_prevue;
  const moy = moyenneNotes(e as Record<string, number | null>);

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link
              href="/evaluations"
              className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
            >
              ← Évaluations
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {nomMagasin}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Reçue le{" "}
              {new Date(e.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          {moy !== null && (
            <div className="mt-6 text-right">
              <p className="text-xs text-slate-400 mb-1">Moyenne</p>
              <p className="text-3xl font-bold text-amber-500">
                {moy.toFixed(1)}
                <span className="text-base font-normal text-amber-300">/5</span>
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Notes par question */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Notes détaillées
            </h2>
            <div className="divide-y divide-slate-100">
              {QUESTIONS_EVAL.map((q) => {
                const note = (e as Record<string, number | null>)[q.key];
                return (
                  <div
                    key={q.key}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm text-slate-700">{q.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <EtoilesNote note={note} mode="display" taille="sm" />
                      {note && (
                        <span className="text-sm font-semibold text-slate-700 w-6 text-right">
                          {note}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commentaire */}
          {e.commentaire_texte && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Commentaire
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {e.commentaire_texte}
              </p>
            </div>
          )}

          {/* Informations liées */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Informations
            </h2>
            <dl className="space-y-3">
              {magasin && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">Magasin</dt>
                  <dd>
                    <Link
                      href={`/magasins/${magasin.id}`}
                      className="text-slate-900 hover:underline"
                    >
                      {nomMagasin}
                      {magasin.ville ? ` (${magasin.ville})` : ""}
                    </Link>
                  </dd>
                </div>
              )}
              {visite && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">
                    Visite associée
                  </dt>
                  <dd>
                    <Link
                      href={`/visites/${visite.id}`}
                      className="text-slate-900 hover:underline"
                    >
                      {dateVisite
                        ? new Date(dateVisite).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Voir la visite"}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">
                  Date de réception
                </dt>
                <dd className="text-slate-900">
                  {new Date(e.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
