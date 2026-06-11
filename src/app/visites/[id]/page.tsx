import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Pencil, Plus } from "lucide-react";
import BoutonSupprimerVisite from "./BoutonSupprimerVisite";
import PartageEvaluation from "@/components/PartageEvaluation";
import EtoilesNote from "@/components/EtoilesNote";
import { moyenneNotes } from "@/lib/evaluations";

type Badge = { label: string; bg: string; fg: string };
const GRAY = { bg: "#ECEAF3", fg: "#6F6982" };
const BLUE = { bg: "#E4F0FB", fg: "#2D6FD0" };
const GREEN = { bg: "#D2F2E7", fg: "#0F8C68" };
const AMBER = { bg: "#FBF1D8", fg: "#B07D14" };
const RED = { bg: "#FBE0E8", fg: "#C0476E" };

const urgenceActionConfig: Record<number, Badge> = {
  1: { label: "Info", ...GRAY },
  2: { label: "Important", ...AMBER },
  3: { label: "Urgent", ...RED },
};

const statutActionConfig: Record<string, Badge> = {
  ouverte: { label: "Ouverte", ...BLUE },
  en_cours: { label: "En cours", ...AMBER },
};

const statutConfig: Record<string, Badge> = {
  planifiee: { label: "Planifiée", ...BLUE },
  realisee: { label: "Réalisée", ...GREEN },
  annulee: { label: "Annulée", ...GRAY },
  reportee: { label: "Reportée", ...AMBER },
};

function Pill({ b }: { b: Badge | undefined }) {
  const m = b ?? { label: "—", ...GRAY };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

function Etoiles({ note }: { note: number | null }) {
  if (!note) return null;
  return (
    <span className="text-3xl leading-none" style={{ color: "#E8B43A" }}>
      {"★".repeat(note)}
      <span style={{ color: "#ECEAF3" }}>{"★".repeat(5 - note)}</span>
    </span>
  );
}

function Bloc({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs mb-1" style={{ color: "var(--pa-muted)" }}>{label}</dt>
      <dd className="whitespace-pre-wrap leading-relaxed" style={{ color: "var(--pa-ink)" }}>
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
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <Link
              href="/visites"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--pa-muted)" }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Visites
            </Link>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              {nomMagasin}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold"
            >
              <Pencil size={15} strokeWidth={2.5} />
              Modifier
            </Link>
            <BoutonSupprimerVisite id={id} magasinId={magasin?.id} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Informations */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
              Informations
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Magasin</dt>
                <dd>
                  {magasin ? (
                    <Link
                      href={`/magasins/${magasin.id}`}
                      className="hover:underline text-sm font-semibold"
                      style={{ color: "#6B4FD8" }}
                    >
                      {nomMagasin}
                      {magasin.ville ? ` (${magasin.ville})` : ""}
                    </Link>
                  ) : (
                    <span style={{ color: "var(--pa-muted)" }}>—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Statut</dt>
                <dd><Pill b={statutConfig[v.statut]} /></dd>
              </div>
              {v.date_prevue && (
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Date prévue</dt>
                  <dd className="text-sm" style={{ color: "var(--pa-ink)" }}>
                    {new Date(v.date_prevue).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
              {v.date_realisee && (
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>
                    Date réalisée
                  </dt>
                  <dd className="text-sm" style={{ color: "var(--pa-ink)" }}>
                    {new Date(v.date_realisee).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
              {v.duree_minutes && (
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Durée</dt>
                  <dd className="text-sm" style={{ color: "var(--pa-ink)" }}>{v.duree_minutes} min</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Objectif */}
          {v.objectif && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--pa-muted)" }}>
                Objectif
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed" style={{ color: "var(--pa-ink)" }}>
                {v.objectif}
              </p>
            </div>
          )}

          {/* Compte-rendu */}
          {(v.compte_rendu || v.points_positifs || v.points_attention) && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
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
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
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
                  <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
                    Actions de suivi
                  </h2>
                  <Link
                    href={urlCreer}
                    className="inline-flex items-center gap-1 pa-btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold"
                  >
                    <Plus size={13} strokeWidth={2.5} /> Créer une action
                  </Link>
                </div>

                {(actionsLiees ?? []).length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                    Aucune action ouverte pour ce magasin.
                  </p>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--pa-line)" }}>
                    {(actionsLiees ?? []).map((a) => {
                      const depasse = a.deadline && a.deadline < today;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0"><Pill b={urgenceActionConfig[a.niveau_urgence as number]} /></span>
                            <span className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                              {a.titre}
                            </span>
                            <span className="shrink-0"><Pill b={statutActionConfig[a.statut as string]} /></span>
                            {a.deadline && (
                              <span
                                className="shrink-0 text-xs font-medium"
                                style={{ color: depasse ? "#C0476E" : "var(--pa-muted)" }}
                              >
                                {new Date(a.deadline).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/actions-reseau/${a.id}`}
                            className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold transition-colors ml-3"
                            style={{ color: "#6B4FD8" }}
                          >
                            Voir <ArrowRight size={13} strokeWidth={2.5} />
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
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
                Évaluation qualité
              </h2>

              {evalExistante ? (
                // Évaluation reçue : afficher le résumé
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                      Note globale :{" "}
                      <EtoilesNote
                        note={evalExistante.q6_satisfaction_globale}
                        mode="display"
                        taille="sm"
                      />
                    </p>
                    {moyenneNotes(evalExistante as Record<string, number | null>) !== null && (
                      <span className="text-sm font-bold" style={{ color: "#B07D14" }}>
                        Moy.{" "}
                        {moyenneNotes(
                          evalExistante as Record<string, number | null>
                        )!.toFixed(1)}
                        /5
                      </span>
                    )}
                  </div>
                  {evalExistante.commentaire_texte && (
                    <p className="text-sm leading-relaxed border-t pt-3" style={{ color: "var(--pa-muted)", borderColor: "var(--pa-line)" }}>
                      {evalExistante.commentaire_texte}
                    </p>
                  )}
                  <Link
                    href={`/evaluations/${id}`}
                    className="inline-flex items-center gap-1 text-sm hover:underline font-semibold"
                    style={{ color: "#6B4FD8" }}
                  >
                    Voir le détail <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                </div>
              ) : (
                // Pas encore évaluée : proposer de copier le lien
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
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
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
                Indicateurs
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {v.note_confiance && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--pa-muted)" }}>Confiance</p>
                    <Etoiles note={v.note_confiance} />
                    <p className="text-sm font-bold mt-1" style={{ color: "var(--pa-ink)" }}>
                      {v.note_confiance}/5
                    </p>
                    {v.commentaire_confiance && (
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--pa-muted)" }}>
                        {v.commentaire_confiance}
                      </p>
                    )}
                  </div>
                )}
                {v.note_business && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--pa-muted)" }}>Business</p>
                    <Etoiles note={v.note_business} />
                    <p className="text-sm font-bold mt-1" style={{ color: "var(--pa-ink)" }}>
                      {v.note_business}/5
                    </p>
                    {v.commentaire_business && (
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--pa-muted)" }}>
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
