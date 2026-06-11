"use client";

import { useState } from "react";
import HistoriqueMembre, { type EvtHistorique } from "./HistoriqueMembre";

type Tab = "actions" | "rdv" | "remontees" | "visites" | "historique";

export type ActionItem = {
  id: string;
  titre: string;
  niveau_urgence: number;
  statut: string;
  deadline: string | null;
  created_at?: string;
  description?: string | null;
  portee?: string | null;
};

export type RDVItem = {
  id: string;
  type: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  objet: string;
  statut: string;
  message?: string | null;
  lieu?: string | null;
  demandeur_type?: string;
  created_at?: string;
};

export type RemonteeItem = {
  id: string;
  titre: string;
  gravite: string;
  statut: string;
  description?: string | null;
  photo_url?: string | null;
  created_at?: string;
  source?: string | null;
  type?: string | null;
};

export type VisiteItem = {
  id: string;
  date_realisee: string | null;
  note_confiance: number | null;
  note_business: number | null;
  objectif: string | null;
  points_cles: string | null;
};

const URGENCE_COLOR: Record<number, string> = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-amber-100 text-amber-700",
  3: "bg-red-100 text-red-700",
};
const URGENCE_LABEL: Record<number, string> = { 1: "Info", 2: "Important", 3: "Urgent" };

const RDV_TYPE_ICON: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻" };
const RDV_TYPE_LABEL: Record<string, string> = { physique: "Physique", tel: "Téléphone", visio: "Visio" };
const RDV_STATUT_BADGE: Record<string, string> = {
  demande: "bg-amber-100 text-amber-700",
  confirme: "bg-emerald-100 text-emerald-700",
  reporte: "bg-slate-100 text-slate-600",
  annule: "bg-red-100 text-red-600",
};

const GRAVITE_BADGE: Record<string, string> = {
  normale: "bg-slate-100 text-slate-600",
  attention: "bg-amber-100 text-amber-700",
  urgente: "bg-red-100 text-red-700",
};

const STATUT_REMONTEE_LABEL: Record<string, string> = {
  nouvelle: "Nouvelle",
  en_cours: "En cours",
  traitee: "Traitée",
  archivee: "Archivée",
};

const TYPE_REMONTEE_LABEL: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Tech.",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};

const SOURCE_LABEL: Record<string, { icon: string; label: string }> = {
  animateur: { icon: "🎛️", label: "Animateur" },
  membre: { icon: "🏪", label: "Magasin" },
  visite: { icon: "🚗", label: "Visite terrain" },
  magasin: { icon: "🏪", label: "Magasin" },
};

// ─── HELPERS ─────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 cursor-help">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex items-center gap-1">
      {children}
      <IconInfo />
      <span className="invisible group-hover:visible absolute bottom-full left-0 mb-1 px-2.5 py-1.5 text-[11px] font-medium rounded-xl shadow-lg whitespace-nowrap z-50 pointer-events-none" style={{ background: "rgba(36,31,51,0.9)", color: "#fff" }}>
        {text}
      </span>
    </span>
  );
}

function dateLongue(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function dateCourte(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function Origine({ source, date, label = "Demandé par" }: { source: string | undefined | null; date: string | undefined; label?: string }) {
  if (!source && !date) return null;
  const meta = source ? SOURCE_LABEL[source] ?? { icon: "—", label: source } : null;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 pb-1.5 mb-2 border-b border-slate-200/70">
      {meta && (
        <Tooltip text={`Personne ou source à l'origine de cette entrée (${meta.label.toLowerCase()})`}>
          <span>{label}</span>
        </Tooltip>
      )}
      {meta && (
        <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
          <span>{meta.icon}</span>
          <span>{meta.label}</span>
        </span>
      )}
      {date && (
        <>
          <span className="text-slate-300">·</span>
          <Tooltip text="Date de création de cette entrée dans l'application">
            <span>Le {dateCourte(date)}</span>
          </Tooltip>
        </>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────

export type VisiteAVenirItem = {
  id: string;
  date_prevue: string;
  objectif: string | null;
};

type Props = {
  actions: ActionItem[];
  rdvs: RDVItem[];
  remontees: RemonteeItem[];
  visites: VisiteItem[];
  visitesAVenir?: VisiteAVenirItem[];
  historique?: EvtHistorique[];
};

export default function TabsMembre({ actions, rdvs, remontees, visites, visitesAVenir = [], historique = [] }: Props) {
  const defaultTab: Tab =
    actions.length > 0 ? "actions" :
    rdvs.length > 0 ? "rdv" :
    remontees.length > 0 ? "remontees" :
    "visites";

  const [tab, setTab] = useState<Tab>(defaultTab);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: "actions",    label: "Actions",    icon: "📋", count: actions.length },
    { id: "rdv",        label: "RDV",        icon: "📅", count: rdvs.length },
    { id: "remontees",  label: "Remontées",  icon: "📢", count: remontees.length },
    { id: "visites",    label: "Visites",    icon: "🚗", count: visites.length },
    { id: "historique", label: "Historique", icon: "📜", count: historique.length },
  ];

  return (
    <div className="pa-card overflow-hidden">
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                active ? "bg-violet-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 max-h-[480px] overflow-y-auto">

        {/* ── ACTIONS ─────────────────────────────────────────── */}
        {tab === "actions" && (
          actions.length === 0 ? <Empty msg="Rien en cours — tout est à jour ✓" />
          : (
            <div className="space-y-2">
              {actions.map((a) => {
                const key = `action-${a.id}`;
                const open = expanded.has(key);
                return (
                  <div key={a.id} className={`rounded-xl border ${open ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-white"} overflow-hidden transition-colors`}>
                    <button type="button" onClick={() => toggle(key)} className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/50">
                      <span title="Niveau d'urgence : Info, Important ou Urgent" className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCE_COLOR[a.niveau_urgence] ?? "bg-slate-100 text-slate-600"}`}>
                        {URGENCE_LABEL[a.niveau_urgence] ?? "—"}
                      </span>
                      <span className="flex-1 text-sm text-slate-800 truncate">{a.titre}</span>
                      {a.deadline && (
                        <span title="Date limite pour réaliser cette action" className="shrink-0 text-xs text-slate-400">
                          {new Date(a.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <Origine source="animateur" date={a.created_at} label="Créée par" />
                        <p className="leading-relaxed pt-1"><strong className="font-semibold">{a.titre}</strong></p>
                        <DetailRow label="Urgence" tooltip="Niveau d'importance défini par l'animateur (Info / Important / Urgent)" value={URGENCE_LABEL[a.niveau_urgence] ?? "—"} />
                        <DetailRow label="Statut" tooltip="État actuel : ouverte (à faire), en cours, ou terminée" value={a.statut} />
                        {a.portee && <DetailRow label="Portée" tooltip="Action liée à un magasin précis ou au réseau entier" value={a.portee} />}
                        {a.deadline && <DetailRow label="Échéance" tooltip="Date limite pour réaliser cette action" value={dateLongue(a.deadline)} />}
                        {a.description && (
                          <BlocTexte label="Description" tooltip="Détails complets de l'action à réaliser" text={a.description} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── RDV ──────────────────────────────────────────────── */}
        {tab === "rdv" && (
          rdvs.length === 0 ? <Empty msg="Aucun RDV programmé" />
          : (
            <div className="space-y-2">
              {rdvs.map((r) => {
                const key = `rdv-${r.id}`;
                const open = expanded.has(key);
                return (
                  <div key={r.id} className={`rounded-xl border ${open ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-white"} overflow-hidden transition-colors`}>
                    <button type="button" onClick={() => toggle(key)} className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/50">
                      <span title={`RDV ${RDV_TYPE_LABEL[r.type] ?? r.type}`} className="text-xl shrink-0">{RDV_TYPE_ICON[r.type] ?? "📅"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.objet}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(r.date_souhaitee).toLocaleDateString("fr-FR")}
                          {r.heure_souhaitee ? ` à ${r.heure_souhaitee.slice(0, 5)}` : ""}
                        </p>
                      </div>
                      <span title="État de la demande : demandé, confirmé, reporté ou annulé" className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${RDV_STATUT_BADGE[r.statut] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.statut.charAt(0).toUpperCase() + r.statut.slice(1)}
                      </span>
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <Origine source={r.demandeur_type} date={r.created_at} label="Demandé par" />
                        <p className="leading-relaxed pt-1"><strong className="font-semibold">{r.objet}</strong></p>
                        <DetailRow label="Type" tooltip="Mode du rendez-vous : en magasin, par téléphone ou en visio" value={RDV_TYPE_LABEL[r.type] ?? r.type} />
                        <DetailRow label="Quand" tooltip="Date et heure proposées pour le rendez-vous" value={`${dateLongue(r.date_souhaitee)}${r.heure_souhaitee ? ` à ${r.heure_souhaitee.slice(0, 5)}` : ""}`} />
                        {r.lieu && <DetailRow label="Lieu" tooltip="Endroit où se déroulera le rendez-vous" value={r.lieu} />}
                        <DetailRow label="Statut" tooltip="État : demandé (en attente) / confirmé / reporté / annulé" value={r.statut.charAt(0).toUpperCase() + r.statut.slice(1)} />
                        {r.message && (
                          <BlocTexte label="Message" tooltip="Note ou contexte ajouté à la demande" text={r.message} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── REMONTÉES ───────────────────────────────────────── */}
        {tab === "remontees" && (
          remontees.length === 0 ? <Empty msg="Aucune remontée en cours" />
          : (
            <div className="space-y-2">
              {remontees.map((r) => {
                const key = `remontee-${r.id}`;
                const open = expanded.has(key);
                return (
                  <div key={r.id} className={`rounded-xl border ${open ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-white"} overflow-hidden transition-colors`}>
                    <button type="button" onClick={() => toggle(key)} className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/50">
                      <span title="Gravité : Normale, Attention ou Urgente" className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${GRAVITE_BADGE[r.gravite] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.gravite.charAt(0).toUpperCase() + r.gravite.slice(1)}
                      </span>
                      <span className="flex-1 text-sm text-slate-800 truncate">{r.titre}</span>
                      <span title="État de traitement par l'animateur" className="shrink-0 text-xs text-slate-400">{STATUT_REMONTEE_LABEL[r.statut] ?? r.statut}</span>
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <Origine source={r.source} date={r.created_at} label="Émise par" />
                        <p className="leading-relaxed pt-1"><strong className="font-semibold">{r.titre}</strong></p>
                        {r.type && <DetailRow label="Type" tooltip="Catégorie de la remontée (commerciale, SAV, concurrence, etc.)" value={TYPE_REMONTEE_LABEL[r.type] ?? r.type} />}
                        <DetailRow label="Gravité" tooltip="Niveau de criticité (Normale, Attention, Urgente)" value={r.gravite} />
                        <DetailRow label="Statut" tooltip="Étape de traitement par l'animateur" value={STATUT_REMONTEE_LABEL[r.statut] ?? r.statut} />
                        {r.description && (
                          <BlocTexte label="Description" tooltip="Détails complets de la remontée" text={r.description} />
                        )}
                        {r.photo_url && (
                          <div className="pt-1">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1 flex items-center gap-1">
                              <Tooltip text="Photo ou fichier joint à la remontée"><span>Pièce jointe</span></Tooltip>
                            </div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <a href={r.photo_url} target="_blank" rel="noopener noreferrer">
                              <img src={r.photo_url} alt="Pièce jointe" className="max-h-48 rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── VISITES ─────────────────────────────────────────── */}
        {tab === "visites" && (
          visites.length === 0 && visitesAVenir.length === 0 ? <Empty msg="Aucune visite enregistrée" />
          : (
            <div className="space-y-2">
              {visitesAVenir.length > 0 && (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wide px-1" style={{ color: "var(--pa-muted)" }}>À venir</p>
                  {visitesAVenir.map((v) => (
                    <div key={`avenir-${v.id}`} className="rounded-xl border px-3 py-2.5 flex items-start gap-3" style={{ borderColor: "rgba(45,111,208,.22)", background: "#EFF6FD" }}>
                      <div className="shrink-0 text-xs w-20 pt-0.5 font-medium" style={{ color: "#2D6FD0" }}>
                        {new Date(v.date_prevue).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: "var(--pa-ink)" }}>{v.objectif ?? "Visite planifiée"}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#E4F0FB", color: "#2D6FD0" }}>Planifiée</span>
                    </div>
                  ))}
                  {visites.length > 0 && (
                    <p className="text-[11px] font-bold uppercase tracking-wide px-1 pt-2" style={{ color: "var(--pa-muted)" }}>Réalisées</p>
                  )}
                </>
              )}
              {visites.map((v) => {
                const key = `visite-${v.id}`;
                const open = expanded.has(key);
                return (
                  <div key={v.id} className={`rounded-xl border ${open ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-white"} overflow-hidden transition-colors`}>
                    <button type="button" onClick={() => toggle(key)} className="w-full px-3 py-2.5 flex items-start gap-3 text-left hover:bg-slate-50/50">
                      <div title="Date de la visite" className="shrink-0 text-slate-400 text-xs w-20 pt-0.5">
                        {v.date_realisee ? new Date(v.date_realisee).toLocaleDateString("fr-FR") : "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{v.objectif ?? "Pas d'objectif renseigné"}</p>
                      </div>
                      <div className="shrink-0 flex gap-3 text-xs text-slate-500 pt-0.5">
                        {v.note_confiance != null && <span title="Note Confiance attribuée par l'animateur lors de la visite (1-5)">C. <strong className="text-slate-700">{v.note_confiance}</strong></span>}
                        {v.note_business != null && <span title="Note Business attribuée par l'animateur lors de la visite (1-5)">B. <strong className="text-slate-700">{v.note_business}</strong></span>}
                      </div>
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <Origine source="animateur" date={v.date_realisee ?? undefined} label="Effectuée par" />
                        <DetailRow label="Date" tooltip="Jour de réalisation de la visite" value={dateLongue(v.date_realisee)} />
                        <DetailRow label="Objectif" tooltip="But principal annoncé pour la visite" value={v.objectif ?? "—"} />
                        {v.note_confiance != null && <DetailRow label="Confiance" tooltip="Note de 1 à 5 sur la relation et la confiance perçue" value={`${v.note_confiance}/5`} />}
                        {v.note_business != null && <DetailRow label="Business" tooltip="Note de 1 à 5 sur la dynamique commerciale" value={`${v.note_business}/5`} />}
                        {v.points_cles && (
                          <BlocTexte label="Points clés" tooltip="Sujets abordés et conclusions de la visite" text={v.points_cles} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── HISTORIQUE ──────────────────────────────────────── */}
        {tab === "historique" && (
          historique.length === 0 ? <Empty msg="Aucune activité sur les 12 derniers mois" />
          : <HistoriqueMembre evts={historique} embedded />
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-center text-slate-400 text-sm py-10">{msg}</p>;
}

function DetailRow({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold shrink-0 w-20">
        {tooltip ? <Tooltip text={tooltip}><span>{label}</span></Tooltip> : label}
      </span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}

function BlocTexte({ label, text, tooltip }: { label: string; text: string; tooltip?: string }) {
  return (
    <div className="pt-1">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">
        {tooltip ? <Tooltip text={tooltip}><span>{label}</span></Tooltip> : label}
      </div>
      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-200 rounded-lg p-2">{text}</p>
    </div>
  );
}
