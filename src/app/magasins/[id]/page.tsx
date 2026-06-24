import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, Pencil, ArrowLeft, ArrowRight, Plus, Lock } from "lucide-react";
import BoutonSupprimer from "./BoutonSupprimer";
import BoutonStatutMagasin from "@/components/BoutonStatutMagasin";
import CAEvolution from "@/components/CAEvolution";
import { guardBureau } from "@/lib/visibilite";

type Badge = { label: string; bg: string; fg: string };
const NEUTRAL: Badge = { label: "—", bg: "#ECEAF3", fg: "#6F6982" };
const BLUE = { bg: "#E4F0FB", fg: "#2D6FD0" };
const GREEN = { bg: "#D2F2E7", fg: "#0F8C68" };
const AMBER = { bg: "#FBF1D8", fg: "#B07D14" };
const RED = { bg: "#FBE0E8", fg: "#C0476E" };
const GRAY = { bg: "#ECEAF3", fg: "#6F6982" };

function Pill({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: bg, color: fg }}>
      {label}
    </span>
  );
}

function eur(v: number | null | undefined): string {
  return v == null ? "—" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function pct(v: number | null | undefined): string {
  return v == null ? "—" : `${Math.round(Number(v) * 100)}%`;
}

const statutMagasin: Record<string, Badge> = {
  actif:   { label: "Actif",    ...GREEN },
  pause:   { label: "En pause", ...AMBER },
  inactif: { label: "Inactif",  ...GRAY },
};

const urgenceAction: Record<number, Badge> = {
  1: { label: "Info",      ...GRAY },
  2: { label: "Important", ...AMBER },
  3: { label: "Urgent",    ...RED },
};

const statutAction: Record<string, Badge> = {
  ouverte:  { label: "Ouverte",  ...BLUE },
  en_cours: { label: "En cours", ...AMBER },
};

const graviteRemontee: Record<string, Badge> = {
  normale:   { label: "Normale",   ...GRAY },
  attention: { label: "Attention", ...AMBER },
  urgente:   { label: "Urgente",   ...RED },
};

const typeRemonteeLabels: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Tech.",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};

const statutRemontee: Record<string, Badge> = {
  nouvelle: { label: "Nouvelle", ...BLUE },
  en_cours: { label: "En cours", ...AMBER },
  traitee:  { label: "Traitée",  ...GREEN },
};

const statutVisite: Record<string, Badge> = {
  planifiee: { label: "Planifiée", ...BLUE },
  realisee:  { label: "Réalisée",  ...GREEN },
  annulee:   { label: "Annulée",   ...GRAY },
  reportee:  { label: "Reportée",  ...AMBER },
};

const niveauLabels: Record<string, string> = {
  strategique: "Stratégique",
  standard: "Standard",
  observation: "Observation",
};

export default async function MagasinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await guardBureau("bureau_magasins");
  const today = new Date().toISOString().split("T")[0];
  const supabase = await createClient();
  const [
    { data: m },
    { data: visites },
    { data: actionsOuvertes },
    { data: remonteesActives },
    { data: visitesPlanifiees },
    { data: caBfa },
    { count: nbAssocies },
  ] = await Promise.all([
      supabase.from("magasins").select("*").eq("id", id).single(),
      supabase
        .from("visites")
        .select(
          "id, date_prevue, date_realisee, statut, note_confiance, note_business"
        )
        .eq("magasin_id", id)
        .neq("statut", "planifiee")
        .order("date_realisee", { ascending: false, nullsFirst: false })
        .order("date_prevue", { ascending: false })
        .limit(5),
      supabase
        .from("actions")
        .select("id, titre, niveau_urgence, statut, deadline")
        .eq("magasin_id", id)
        .in("statut", ["ouverte", "en_cours"])
        .order("niveau_urgence", { ascending: false })
        .order("deadline", { ascending: true, nullsFirst: false }),
      supabase
        .from("remontees")
        .select("id, titre, type, gravite, statut")
        .eq("magasin_id", id)
        .neq("statut", "archivee")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("visites")
        .select("id, date_prevue, objectif, statut")
        .eq("magasin_id", id)
        .eq("statut", "planifiee")
        .gte("date_prevue", today)
        .order("date_prevue", { ascending: true }),
      supabase
        .from("ca_bfa")
        .select("ca_global, ca_leaders, pct_leaders, bfa_3pct, bfa_associe, rang_ca_leaders")
        .eq("magasin_id", id)
        .eq("periode", "fin mai 2026")
        .maybeSingle(),
      supabase
        .from("ca_bfa")
        .select("*", { count: "exact", head: true })
        .eq("periode", "fin mai 2026"),
    ]);

  if (!m) notFound();

  const cb = caBfa as {
    ca_global: number | null; ca_leaders: number | null; pct_leaders: number | null;
    bfa_3pct: number | null; bfa_associe: number | null; rang_ca_leaders: number | null;
  } | null;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <Link
              href="/magasins"
              className="inline-flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "var(--pa-muted)" }}
            >
              <ArrowLeft size={15} strokeWidth={2.5} />
              Retour à la liste
            </Link>
            <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              {m.nom}
            </h1>
            {m.enseigne && (
              <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>{m.enseigne}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-6 flex-wrap">
            <Link
              href={`/animateur/rdv/nouvelle?magasin=${id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#5BA8F5,#3D7BE8)", boxShadow: "0 4px 12px -4px rgba(61,123,232,0.5)" }}
            >
              <CalendarPlus size={15} strokeWidth={2.5} />
              Proposer un RDV
            </Link>
            <Link
              href={`/magasins/${id}/modifier`}
              className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold"
            >
              <Pencil size={15} strokeWidth={2.5} />
              Modifier
            </Link>
            <BoutonStatutMagasin id={id} statut={m.statut} />
            <BoutonSupprimer id={id} />
          </div>
        </div>

        <div className="space-y-4">
          {/* CA & BFA — snapshot réel (fin mai 2026) */}
          {cb && (
            <div className="pa-card p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
                  CA &amp; BFA — fin mai 2026
                </h2>
                <Link href="/animateur/classement" className="text-xs font-semibold" style={{ color: "#6B4FD8" }}>
                  Classement complet →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs" style={{ color: "var(--pa-muted)" }}>CA global</p>
                  <p className="text-xl font-bold" style={{ color: "var(--pa-ink)" }}>{eur(cb.ca_global)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--pa-muted)" }}>CA Leaders</p>
                  <p className="text-xl font-bold" style={{ color: "var(--pa-ink)" }}>{eur(cb.ca_leaders)}</p>
                  <p className="text-xs" style={{ color: "var(--pa-muted)" }}>{pct(cb.pct_leaders)} du CA</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--pa-muted)" }}>BFA associé</p>
                  <p className="text-xl font-bold" style={{ color: "#0F8C68" }}>{eur(cb.bfa_associe)}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--pa-muted)" }}>Classement CA Leaders</p>
                  <p className="text-xl font-bold" style={{ color: "#6B4FD8" }}>
                    #{cb.rang_ca_leaders ?? "—"}
                    <span className="text-sm font-semibold" style={{ color: "var(--pa-muted)" }}> / {nbAssocies ?? 40}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CA — bloc CA évolution en haut */}
          <CAEvolution magasinId={id} anneeCourante={new Date().getFullYear()} />

          {/* Card : Informations générales */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
              Informations générales
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Adresse</dt>
                <dd style={{ color: "var(--pa-ink)" }}>
                  {[m.adresse, m.code_postal, m.ville]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Région</dt>
                <dd style={{ color: "var(--pa-ink)" }}>{m.region ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Statut</dt>
                <dd>
                  <Pill {...(statutMagasin[m.statut] ?? { label: m.statut, ...GRAY })} />
                </dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Niveau</dt>
                <dd style={{ color: "var(--pa-ink)" }}>
                  {niveauLabels[m.niveau] ?? m.niveau ?? "—"}
                </dd>
              </div>
              {m.date_entree_reseau && (
                <div>
                  <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>
                    Entrée réseau
                  </dt>
                  <dd style={{ color: "var(--pa-ink)" }}>
                    {new Date(m.date_entree_reseau).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Card : Contact */}
          <div className="pa-card p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
              Contact
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Nom</dt>
                <dd style={{ color: "var(--pa-ink)" }}>{m.contact_nom ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Téléphone</dt>
                <dd style={{ color: "var(--pa-ink)" }}>
                  {m.contact_telephone ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs mb-0.5" style={{ color: "var(--pa-muted)" }}>Email</dt>
                <dd style={{ color: "var(--pa-ink)" }}>
                  {m.contact_email ? (
                    <a
                      href={`mailto:${m.contact_email}`}
                      className="hover:underline"
                      style={{ color: "#6B4FD8" }}
                    >
                      {m.contact_email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Card : Notes (uniquement si présentes) */}
          {m.notes && (
            <div className="pa-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "var(--pa-muted)" }}>
                Notes
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed" style={{ color: "var(--pa-ink)" }}>
                {m.notes}
              </p>
            </div>
          )}

          {/* Card : Infos animateur (confidentielles) — affichée seulement si au moins un champ est rempli */}
          {(m.date_creation_entreprise || m.nb_collaborateurs || m.type_activite || m.score_potentiel || (Array.isArray(m.tags_animateur) && m.tags_animateur.length > 0) || m.notes_animateur) && (
            <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide inline-flex items-center gap-2">
                  <Lock size={15} strokeWidth={2.5} /> Infos animateur
                </h2>
                <span className="text-[10px] font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                  CONFIDENTIEL — Non visible côté membre
                </span>
              </div>

              {/* Tags */}
              {Array.isArray(m.tags_animateur) && m.tags_animateur.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.tags_animateur.map((tag: string, i: number) => (
                    <span key={i} className="bg-white border border-amber-300 text-amber-900 text-xs font-semibold px-2.5 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Grille d'infos */}
              <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
                {m.date_creation_entreprise && (
                  <div>
                    <dt className="text-xs text-amber-700 mb-0.5">Date de création</dt>
                    <dd className="text-slate-900">
                      {new Date(m.date_creation_entreprise).toLocaleDateString("fr-FR")}
                      {(() => {
                        const annees = Math.floor((Date.now() - new Date(m.date_creation_entreprise).getTime()) / (365.25 * 86_400_000));
                        return annees > 0 ? <span className="text-slate-400 text-sm ml-2">({annees} an{annees > 1 ? "s" : ""})</span> : null;
                      })()}
                    </dd>
                  </div>
                )}
                {m.nb_collaborateurs != null && (
                  <div>
                    <dt className="text-xs text-amber-700 mb-0.5">Collaborateurs</dt>
                    <dd className="text-slate-900">{m.nb_collaborateurs} personne{m.nb_collaborateurs > 1 ? "s" : ""}</dd>
                  </div>
                )}
                {m.type_activite && (
                  <div>
                    <dt className="text-xs text-amber-700 mb-0.5">Type d&apos;activité</dt>
                    <dd className="text-slate-900">
                      {{
                        integree: "Intégrée (atelier/SAV maison)",
                        sous_traitance: "Sous-traitance",
                        mixte: "Mixte",
                      }[m.type_activite as string] ?? m.type_activite}
                    </dd>
                  </div>
                )}
                {m.score_potentiel != null && (
                  <div>
                    <dt className="text-xs text-amber-700 mb-0.5">Score potentiel</dt>
                    <dd className="text-slate-900">
                      <span className="text-base">{"⭐".repeat(m.score_potentiel)}</span>
                      <span className="text-slate-400 text-sm ml-2">{m.score_potentiel}/5</span>
                    </dd>
                  </div>
                )}
              </dl>

              {/* Notes confidentielles */}
              {m.notes_animateur && (
                <div className="pt-3 border-t border-amber-200">
                  <dt className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-1.5">Notes confidentielles</dt>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-amber-200 rounded-lg p-3">
                    {m.notes_animateur}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Card : Visites */}
          <div className="pa-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
                Visites
              </h2>
              <Link
                href={`/visites/nouvelle?magasin_id=${id}`}
                className="inline-flex items-center gap-1 pa-btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                <Plus size={13} strokeWidth={2.5} /> Nouvelle visite
              </Link>
            </div>

            {(visites ?? []).length === 0 && (visitesPlanifiees ?? []).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                Aucune visite enregistrée.
              </p>
            ) : (
              <div className="space-y-4">
                {/* À venir — visites planifiées */}
                {(visitesPlanifiees ?? []).length > 0 && (
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-wide mb-2"
                      style={{ color: "#2D6FD0" }}
                    >
                      À venir
                    </p>
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid #C8DFF8" }}
                    >
                      {(visitesPlanifiees ?? []).map((v, idx) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between px-4 py-2.5"
                          style={{
                            background: idx % 2 === 0 ? "#EDF5FD" : "#F4F9FE",
                            borderTop: idx > 0 ? "1px solid #C8DFF8" : undefined,
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Pill label="Planifiée" {...BLUE} />
                            <span className="text-sm shrink-0" style={{ color: "var(--pa-ink)" }}>
                              {v.date_prevue
                                ? new Date(v.date_prevue).toLocaleDateString("fr-FR")
                                : "—"}
                            </span>
                            {v.objectif && (
                              <span
                                className="text-xs truncate"
                                style={{ color: "var(--pa-muted)" }}
                              >
                                {v.objectif}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/visites/${v.id}`}
                            className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold ml-3"
                            style={{ color: "#6B4FD8", textDecoration: "none" }}
                          >
                            Voir <ArrowRight size={13} strokeWidth={2.5} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historique récent */}
                {(visites ?? []).length > 0 && (
                  <div>
                    {(visitesPlanifiees ?? []).length > 0 && (
                      <p
                        className="text-xs font-bold uppercase tracking-wide mb-2"
                        style={{ color: "var(--pa-muted)" }}
                      >
                        Historique récent
                      </p>
                    )}
                    <div className="divide-y" style={{ borderColor: "var(--pa-line)" }}>
                      {(visites ?? []).map((v) => {
                        const date = v.date_realisee ?? v.date_prevue;
                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm" style={{ color: "var(--pa-ink)" }}>
                                {date
                                  ? new Date(date).toLocaleDateString("fr-FR")
                                  : "—"}
                              </span>
                              <Pill {...(statutVisite[v.statut] ?? { label: v.statut, ...GRAY })} />
                              {v.note_confiance && (
                                <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
                                  C&nbsp;<span style={{ color: "#EF9F27" }}>{"★".repeat(v.note_confiance)}</span>
                                </span>
                              )}
                              {v.note_business && (
                                <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
                                  B&nbsp;<span style={{ color: "#EF9F27" }}>{"★".repeat(v.note_business)}</span>
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/visites/${v.id}`}
                              className="inline-flex items-center gap-1 text-sm font-semibold"
                              style={{ color: "#6B4FD8", textDecoration: "none" }}
                            >
                              Voir <ArrowRight size={13} strokeWidth={2.5} />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Card : Remontées terrain */}
          <div className="pa-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
                Remontées terrain
              </h2>
              <Link
                href={`/remontees/nouvelle?magasin_id=${id}`}
                className="inline-flex items-center gap-1 pa-btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                <Plus size={13} strokeWidth={2.5} /> Nouvelle remontée
              </Link>
            </div>

            {(remonteesActives ?? []).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--pa-muted)" }}>Aucune remontée active.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--pa-line)" }}>
                {(remonteesActives ?? []).map((rem) => (
                  <div
                    key={rem.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Pill {...(graviteRemontee[rem.gravite as string] ?? { label: rem.gravite as string, ...GRAY })} />
                      <Pill label={typeRemonteeLabels[rem.type as string] ?? (rem.type as string)} {...GRAY} />
                      <span className="text-sm font-medium truncate" style={{ color: "var(--pa-ink)" }}>
                        {rem.titre}
                      </span>
                      <Pill {...(statutRemontee[rem.statut as string] ?? { label: rem.statut as string, ...GRAY })} />
                    </div>
                    <Link
                      href={`/remontees/${rem.id}`}
                      className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold ml-3"
                      style={{ color: "#6B4FD8", textDecoration: "none" }}
                    >
                      Voir <ArrowRight size={13} strokeWidth={2.5} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card : Actions ouvertes */}
          <div className="pa-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
                Actions
              </h2>
              <Link
                href={`/actions-reseau/nouvelle?magasin_id=${id}`}
                className="inline-flex items-center gap-1 pa-btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold"
              >
                <Plus size={13} strokeWidth={2.5} /> Nouvelle action
              </Link>
            </div>

            {(actionsOuvertes ?? []).length === 0 ? (
              <p className="text-sm" style={{ color: "var(--pa-muted)" }}>Aucune action en cours.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--pa-line)" }}>
                {(actionsOuvertes ?? []).map((a) => {
                  const today = new Date().toISOString().split("T")[0];
                  const depasse = a.deadline && a.deadline < today;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Pill {...(urgenceAction[a.niveau_urgence as number] ?? { label: String(a.niveau_urgence), ...GRAY })} />
                        <span className="text-sm font-medium truncate" style={{ color: "var(--pa-ink)" }}>
                          {a.titre}
                        </span>
                        <Pill {...(statutAction[a.statut as string] ?? { label: a.statut as string, ...GRAY })} />
                        {a.deadline && (
                          <span className="shrink-0 text-xs font-medium" style={{ color: depasse ? "#C0476E" : "var(--pa-muted)" }}>
                            {new Date(a.deadline).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/actions-reseau/${a.id}`}
                        className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold ml-3"
                        style={{ color: "#6B4FD8", textDecoration: "none" }}
                      >
                        Voir <ArrowRight size={13} strokeWidth={2.5} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
