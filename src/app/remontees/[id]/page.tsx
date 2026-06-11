import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { changeStatutRemontee } from "./actions";
import FormulaireReponse from "./FormulaireReponse";
import BoutonSupprimerRemontee from "./BoutonSupprimerRemontee";
import PieceJointe from "@/components/PieceJointe";

type Badge = { label: string; bg: string; fg: string };
const GRAY = { bg: "#ECEAF3", fg: "#6F6982" };

const graviteConfig: Record<string, Badge> = {
  normale:   { label: "Normale",   ...GRAY },
  attention: { label: "Attention", bg: "#FBF1D8", fg: "#B07D14" },
  urgente:   { label: "Urgente",   bg: "#FBE0E8", fg: "#C0476E" },
};

const typeLabels: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Technique",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};

const statutConfig: Record<string, Badge> = {
  nouvelle: { label: "Nouvelle", bg: "#E4F0FB", fg: "#2D6FD0" },
  en_cours: { label: "En cours", bg: "#FBF1D8", fg: "#B07D14" },
  traitee:  { label: "Traitée",  bg: "#D2F2E7", fg: "#0F8C68" },
  archivee: { label: "Archivée", ...GRAY },
};

function Pill({ b }: { b: Badge | undefined }) {
  const m = b ?? { label: "—", ...GRAY };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

export default async function RemonteeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: r } = await supabase
    .from("remontees")
    .select("*, magasins(id, nom, enseigne, ville)")
    .eq("id", id)
    .single();

  if (!r) notFound();

  const magasin = r.magasins as unknown as {
    id: string;
    nom: string;
    enseigne: string | null;
    ville: string | null;
  } | null;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <Link
              href="/remontees"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--pa-muted)" }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Retour aux remontées
            </Link>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              {r.titre}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Link
              href={`/remontees/${id}/modifier`}
              className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold"
            >
              <Pencil size={15} strokeWidth={2.5} />
              Modifier
            </Link>
            <BoutonSupprimerRemontee id={id} />
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
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Magasin</dt>
                <dd>
                  {magasin ? (
                    <Link
                      href={`/magasins/${magasin.id}`}
                      className="hover:underline text-sm font-semibold"
                      style={{ color: "#6B4FD8" }}
                    >
                      {magasin.enseigne ? `${magasin.enseigne} — ` : ""}
                      {magasin.nom}
                      {magasin.ville ? ` (${magasin.ville})` : ""}
                    </Link>
                  ) : (
                    <span style={{ color: "var(--pa-muted)" }}>—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Type</dt>
                <dd><Pill b={{ label: typeLabels[r.type] ?? r.type, ...GRAY }} /></dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Gravité</dt>
                <dd><Pill b={graviteConfig[r.gravite as string]} /></dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Statut</dt>
                <dd><Pill b={statutConfig[r.statut as string]} /></dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Reçue le</dt>
                <dd className="text-sm" style={{ color: "var(--pa-ink)" }}>
                  {new Date(r.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              {r.date_traitement && (
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>
                    Traitée le
                  </dt>
                  <dd className="text-sm" style={{ color: "var(--pa-ink)" }}>
                    {new Date(r.date_traitement).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Card : Description */}
          <div className="pa-card p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
              Description
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: "var(--pa-ink)" }}>
              {r.description}
            </p>
            <PieceJointe url={r.photo_url as string | null} />
          </div>

          {/* Card : Réponse animateur */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
              Réponse animateur
            </h2>
            {r.reponse_animateur ? (
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: "#D2F2E7", border: "1px solid rgba(31,169,138,0.2)" }}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm" style={{ color: "#0F5C44" }}>
                    {r.reponse_animateur}
                  </p>
                </div>
                {r.date_traitement && (
                  <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
                    Répondu le{" "}
                    {new Date(r.date_traitement).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <FormulaireReponse id={id} />
            )}
          </div>

          {/* Card : Changer le statut (hors archivée / traitée) */}
          {!["traitee", "archivee"].includes(r.statut) && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
                Changer le statut
              </h2>
              <div className="flex flex-wrap gap-2">
                {r.statut === "nouvelle" && (
                  <form action={changeStatutRemontee}>
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
                <form action={changeStatutRemontee}>
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="statut" value="archivee" />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
                    style={{ background: "#ECEAF3", color: "#6F6982" }}
                  >
                    Archiver
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Bouton rouvrir si archivée */}
          {r.statut === "archivee" && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
                Changer le statut
              </h2>
              <form action={changeStatutRemontee}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="statut" value="nouvelle" />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: "#E4F0FB", color: "#2D6FD0" }}
                >
                  Rouvrir
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
