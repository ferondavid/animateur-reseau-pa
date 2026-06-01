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
};

export type RemonteeItem = {
  id: string;
  titre: string;
  gravite: string;
  statut: string;
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

type Props = {
  actions: ActionItem[];
  rdvs: RDVItem[];
  remontees: RemonteeItem[];
  visites: VisiteItem[];
};

export default function TabsMembre({ actions, rdvs, remontees, visites }: Props) {
  // Tab par défaut : le premier qui a du contenu
  const defaultTab: Tab =
    actions.length > 0 ? "actions" :
    rdvs.length > 0 ? "rdv" :
    remontees.length > 0 ? "remontees" :
    "visites";

  const [tab, setTab] = useState<Tab>(defaultTab);

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: "actions",   label: "Actions",   icon: "📋", count: actions.length },
    { id: "rdv",       label: "RDV",       icon: "📅", count: rdvs.length },
    { id: "remontees", label: "Remontées", icon: "📢", count: remontees.length },
    { id: "visites",   label: "Visites",   icon: "🚗", count: visites.length },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-fit px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
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

      {/* Tab content */}
      <div className="p-4 max-h-[420px] overflow-y-auto">
        {tab === "actions" && (
          actions.length === 0 ? <Empty msg="Rien en cours — tout est à jour ✓" />
          : (
            <div className="space-y-2">
              {actions.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 p-3 flex items-center gap-3 bg-white">
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCE_COLOR[a.niveau_urgence] ?? "bg-slate-100 text-slate-600"}`}>
                    {URGENCE_LABEL[a.niveau_urgence] ?? "—"}
                  </span>
                  <span className="flex-1 text-sm text-slate-800">{a.titre}</span>
                  {a.deadline && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(a.deadline).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === "rdv" && (
          rdvs.length === 0 ? <Empty msg="Aucun RDV programmé" />
          : (
            <div className="space-y-2">
              {rdvs.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-3 flex items-center gap-3 bg-white">
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
                </div>
              ))}
            </div>
          )
        )}

        {tab === "remontees" && (
          remontees.length === 0 ? <Empty msg="Aucune remontée en cours" />
          : (
            <div className="space-y-2">
              {remontees.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-3 flex items-center gap-3 bg-white">
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${GRAVITE_BADGE[r.gravite] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.gravite.charAt(0).toUpperCase() + r.gravite.slice(1)}
                  </span>
                  <span className="flex-1 text-sm text-slate-800 truncate">{r.titre}</span>
                  <span className="shrink-0 text-xs text-slate-400">{r.statut}</span>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "visites" && (
          visites.length === 0 ? <Empty msg="Aucune visite enregistrée" />
          : (
            <div className="space-y-2">
              {visites.map((v) => (
                <div key={v.id} className="rounded-xl border border-slate-200 p-3 flex items-start gap-3 bg-white">
                  <div className="shrink-0 text-slate-400 text-xs w-20 pt-0.5">
                    {v.date_realisee ? new Date(v.date_realisee).toLocaleDateString("fr-FR") : "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{v.objectif ?? "Pas d'objectif renseigné"}</p>
                    {v.points_cles && <p className="text-xs text-slate-400 mt-0.5 truncate">{v.points_cles}</p>}
                  </div>
                  <div className="shrink-0 flex gap-3 text-xs text-slate-500 pt-0.5">
                    {v.note_confiance != null && <span>Conf. <strong className="text-slate-700">{v.note_confiance}/5</strong></span>}
                    {v.note_business != null && <span>Biz. <strong className="text-slate-700">{v.note_business}/5</strong></span>}
                  </div>
                </div>
              ))}
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
