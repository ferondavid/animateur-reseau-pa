import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { changeStatutAction } from "./actions";
import FormulaireRealiser from "./FormulaireRealiser";
import BoutonSupprimerAction from "./BoutonSupprimerAction";

type Badge = { label: string; bg: string; fg: string };
const GRAY = { bg: "#ECEAF3", fg: "#6F6982" };
const BLUE = { bg: "#E4F0FB", fg: "#2D6FD0" };
const GREEN = { bg: "#D2F2E7", fg: "#0F8C68" };
const AMBER = { bg: "#FBF1D8", fg: "#B07D14" };
const RED = { bg: "#FBE0E8", fg: "#C0476E" };
const VIOLET = { bg: "#EDEBFB", fg: "#6B4FD8" };

const urgenceConfig: Record<number, Badge> = {
  1: { label: "Info", ...GRAY },
  2: { label: "Important", ...AMBER },
  3: { label: "Urgent", ...RED },
};

const statutConfig: Record<string, Badge> = {
  ouverte: { label: "Ouverte", ...BLUE },
  en_cours: { label: "En cours", ...AMBER },
  realisee: { label: "Réalisée", ...GREEN },
  annulee: { label: "Annulée", ...GRAY },
};

function Pill({ b }: { b: Badge | undefined }) {
  const m = b ?? { label: "—", ...GRAY };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

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
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <Link
              href="/actions-reseau"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--pa-muted)" }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Retour aux actions
            </Link>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              {action.titre}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Link
              href={`/actions-reseau/${id}/modifier`}
              className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold"
            >
              <Pencil size={15} strokeWidth={2.5} />
              Modifier
            </Link>
            <BoutonSupprimerAction id={id} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Card : Informations */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
              Informations
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Statut</dt>
                <dd><Pill b={statut} /></dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Urgence</dt>
                <dd><Pill b={urgence} /></dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Portée</dt>
                <dd>
                  {action.portee === "reseau" ? (
                    <Pill b={{ label: "Réseau", ...VIOLET }} />
                  ) : magasin ? (
                    <Link
                      href={`/magasins/${magasin.id}`}
                      className="hover:underline text-sm font-semibold"
                      style={{ color: "#6B4FD8" }}
                    >
                      {magasin.enseigne ? `${magasin.enseigne} — ` : ""}
                      {magasin.nom}
                    </Link>
                  ) : (
                    <span style={{ color: "var(--pa-muted)" }}>—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Deadline</dt>
                <dd
                  className="text-sm font-medium"
                  style={{ color: deadlineDepasse ? "#C0476E" : "var(--pa-ink)" }}
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
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Créée le</dt>
                <dd className="text-sm" style={{ color: "var(--pa-ink)" }}>
                  {new Date(action.created_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Card : Description */}
          {action.description && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--pa-muted)" }}>
                Description
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: "var(--pa-ink)" }}>
                {action.description}
              </p>
            </div>
          )}

          {/* Card : Réalisation (si réalisée) */}
          {action.statut === "realisee" && action.realise_le && (
            <div className="pa-card p-6" style={{ background: "#D2F2E7", border: "1px solid rgba(31,169,138,0.2)" }}>
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "#0F8C68" }}>
                Réalisation
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: "#1A9E78" }}>Réalisée le</dt>
                  <dd className="text-sm" style={{ color: "#0F5C44" }}>
                    {new Date(action.realise_le).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                {action.commentaire_realisation && (
                  <div>
                    <dt className="text-xs mb-0.5" style={{ color: "#1A9E78" }}>
                      Commentaire
                    </dt>
                    <dd className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#0F5C44" }}>
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
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
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
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
                      style={{ background: "#FBF1D8", color: "#B07D14" }}
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
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
                      style={{ background: "#E4F0FB", color: "#2D6FD0" }}
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
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
                      style={{ background: "#ECEAF3", color: "#6F6982" }}
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
