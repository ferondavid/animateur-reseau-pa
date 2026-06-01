"use client";

import { useState } from "react";

type Tab = "actions" | "rdv" | "remontees" | "visites";

export type ActionItem = {
  id: string;
  titre: string;
  niveau_urgence: number;
  statut: string;
  deadline: string | null;
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
};

export type RemonteeItem = {
  id: string;
  titre: string;
  gravite: string;
  statut: string;
  description?: string | null;
  photo_url?: string | null;
  created_at?: string;
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

type Props = {
  actions: ActionItem[];
  rdvs: RDVItem[];
  remontees: RemonteeItem[];
  visites: VisiteItem[];
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function dateLongue(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function TabsMembre({ actions, rdvs, remontees, visites }: Props) {
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
    { id: "actions",   label: "Actions",   icon: "📋", count: actions.length },
    { id: "rdv",       label: "RDV",       icon: "📅", count: rdvs.length },
    { id: "remontees", label: "Remontées", icon: "📢", count: remontees.length },
    { id: "visites",   label: "Visites",   icon: "🚗", count: visites.length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                active ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
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
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/50"
                    >
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCE_COLOR[a.niveau_urgence] ?? "bg-slate-100 text-slate-600"}`}>
                        {URGENCE_LABEL[a.niveau_urgence] ?? "—"}
                      </span>
                      <span className="flex-1 text-sm text-slate-800 truncate">{a.titre}</span>
                      {a.deadline && (
                        <span className="shrink-0 text-xs text-slate-400">
                          {new Date(a.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <p className="leading-relaxed"><strong className="font-semibold">{a.titre}</strong></p>
                        <Detail label="Urgence" value={URGENCE_LABEL[a.niveau_urgence] ?? "—"} />
                        <Detail label="Statut" value={a.statut} />
                        {a.deadline && <Detail label="Échéance" value={dateLongue(a.deadline)} />}
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
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/50"
                    >
                      <span className="text-xl shrink-0">{RDV_TYPE_ICON[r.type] ?? "📅"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.objet}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(r.date_souhaitee).toLocaleDateString("fr-FR")}
                          {r.heure_souhaitee ? ` à ${r.heure_souhaitee.slice(0, 5)}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${RDV_STATUT_BADGE[r.statut] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.statut.charAt(0).toUpperCase() + r.statut.slice(1)}
                      </span>
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <p className="leading-relaxed"><strong className="font-semibold">{r.objet}</strong></p>
                        <Detail label="Type" value={RDV_TYPE_LABEL[r.type] ?? r.type} />
                        <Detail label="Quand" value={`${dateLongue(r.date_souhaitee)}${r.heure_souhaitee ? ` à ${r.heure_souhaitee.slice(0, 5)}` : ""}`} />
                        {r.lieu && <Detail label="Lieu" value={r.lieu} />}
                        {r.message && (
                          <div className="pt-1">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Message</div>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-200 rounded-lg p-2">{r.message}</p>
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
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50/50"
                    >
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${GRAVITE_BADGE[r.gravite] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.gravite.charAt(0).toUpperCase() + r.gravite.slice(1)}
                      </span>
                      <span className="flex-1 text-sm text-slate-800 truncate">{r.titre}</span>
                      <span className="shrink-0 text-xs text-slate-400">{STATUT_REMONTEE_LABEL[r.statut] ?? r.statut}</span>
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <p className="leading-relaxed"><strong className="font-semibold">{r.titre}</strong></p>
                        <Detail label="Gravité" value={r.gravite} />
                        <Detail label="Statut" value={STATUT_REMONTEE_LABEL[r.statut] ?? r.statut} />
                        {r.created_at && <Detail label="Créée le" value={dateLongue(r.created_at)} />}
                        {r.description && (
                          <div className="pt-1">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Description</div>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-200 rounded-lg p-2">{r.description}</p>
                          </div>
                        )}
                        {r.photo_url && (
                          <div className="pt-1">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Pièce jointe</div>
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
          visites.length === 0 ? <Empty msg="Aucune visite enregistrée" />
          : (
            <div className="space-y-2">
              {visites.map((v) => {
                const key = `visite-${v.id}`;
                const open = expanded.has(key);
                return (
                  <div key={v.id} className={`rounded-xl border ${open ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-white"} overflow-hidden transition-colors`}>
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="w-full px-3 py-2.5 flex items-start gap-3 text-left hover:bg-slate-50/50"
                    >
                      <div className="shrink-0 text-slate-400 text-xs w-20 pt-0.5">
                        {v.date_realisee ? new Date(v.date_realisee).toLocaleDateString("fr-FR") : "—"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{v.objectif ?? "Pas d'objectif renseigné"}</p>
                      </div>
                      <div className="shrink-0 flex gap-3 text-xs text-slate-500 pt-0.5">
                        {v.note_confiance != null && <span>C. <strong className="text-slate-700">{v.note_confiance}</strong></span>}
                        {v.note_business != null && <span>B. <strong className="text-slate-700">{v.note_business}</strong></span>}
                      </div>
                      <Chevron open={open} />
                    </button>
                    {open && (
                      <div className="px-3 pb-3 pt-1 text-sm text-slate-700 space-y-1.5 border-t border-blue-200/50">
                        <Detail label="Date" value={dateLongue(v.date_realisee)} />
                        <Detail label="Objectif" value={v.objectif ?? "—"} />
                        {v.note_confiance != null && <Detail label="Note confiance" value={`${v.note_confiance}/5`} />}
                        {v.note_business != null && <Detail label="Note business" value={`${v.note_business}/5`} />}
                        {v.points_cles && (
                          <div className="pt-1">
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">Points clés</div>
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-slate-200 rounded-lg p-2">{v.points_cles}</p>
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
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-center text-slate-400 text-sm py-10">{msg}</p>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold shrink-0 w-20">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}
