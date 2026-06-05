"use client";

import { useMemo, useState } from "react";

type Periode = "mois" | "trimestre" | "annee" | "tout";
type TypeFiltre = "tous" | "visites" | "rdv" | "remontees" | "actions";

export type EvtHistorique = {
  id: string;
  type: "visite" | "rdv" | "remontee" | "action";
  date: string;       // ISO
  titre: string;      // ligne principale
  detail?: string | null; // sous-ligne contextuelle
  meta?: string | null;   // badge / statut court
  metaTon?: "ok" | "amber" | "red" | "blue" | "slate"; // couleur du badge
};

const TYPE_META: Record<EvtHistorique["type"], { icon: string; label: string; ring: string; bg: string }> = {
  visite:   { icon: "🚗", label: "Visite",    ring: "ring-emerald-200", bg: "bg-emerald-50" },
  rdv:      { icon: "📅", label: "RDV",       ring: "ring-blue-200",    bg: "bg-blue-50" },
  remontee: { icon: "📢", label: "Remontée",  ring: "ring-orange-200",  bg: "bg-orange-50" },
  action:   { icon: "📋", label: "Action",    ring: "ring-purple-200",  bg: "bg-purple-50" },
};

const META_TON: Record<NonNullable<EvtHistorique["metaTon"]>, string> = {
  ok:    "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red:   "bg-red-100 text-red-700",
  blue:  "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
};

const PERIODES: { key: Periode; label: string }[] = [
  { key: "mois",       label: "Ce mois" },
  { key: "trimestre",  label: "3 mois" },
  { key: "annee",      label: "Cette année" },
  { key: "tout",       label: "Tout" },
];

const TYPES: { key: TypeFiltre; label: string; icon?: string }[] = [
  { key: "tous",       label: "Tous" },
  { key: "visites",    label: "Visites",   icon: "🚗" },
  { key: "rdv",        label: "RDV",       icon: "📅" },
  { key: "remontees",  label: "Remontées", icon: "📢" },
  { key: "actions",    label: "Actions",   icon: "📋" },
];

function debutPeriode(p: Periode): number {
  const now = new Date();
  if (p === "mois") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (p === "trimestre") return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).getTime();
  if (p === "annee") return new Date(now.getFullYear(), 0, 1).getTime();
  return 0; // tout
}

function dateLisible(s: string): string {
  return new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function moisLabel(s: string): string {
  return new Date(s).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function HistoriqueMembre({ evts, embedded = false }: { evts: EvtHistorique[]; embedded?: boolean }) {
  const [ouvert, setOuvert] = useState<boolean>(embedded);
  const [periode, setPeriode] = useState<Periode>("trimestre");
  const [type, setType] = useState<TypeFiltre>("tous");

  const debut = useMemo(() => debutPeriode(periode), [periode]);

  const filtres = useMemo(() => {
    return evts
      .filter((e) => new Date(e.date).getTime() >= debut)
      .filter((e) => {
        if (type === "tous") return true;
        if (type === "visites")   return e.type === "visite";
        if (type === "rdv")       return e.type === "rdv";
        if (type === "remontees") return e.type === "remontee";
        if (type === "actions")   return e.type === "action";
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [evts, debut, type]);

  // Comptage global pour les badges des chips type
  const countByType = useMemo(() => {
    const c = { tous: 0, visites: 0, rdv: 0, remontees: 0, actions: 0 };
    for (const e of evts) {
      if (new Date(e.date).getTime() < debut) continue;
      c.tous++;
      if (e.type === "visite")   c.visites++;
      if (e.type === "rdv")      c.rdv++;
      if (e.type === "remontee") c.remontees++;
      if (e.type === "action")   c.actions++;
    }
    return c;
  }, [evts, debut]);

  // Regroupement par mois
  const groupes = useMemo(() => {
    const map = new Map<string, EvtHistorique[]>();
    for (const e of filtres) {
      const key = e.date.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtres]);

  return (
    <div className={embedded ? "" : "space-y-3"}>
      {/* Header cliquable : ouvre/ferme l'historique (caché en mode embedded) */}
      {!embedded && (
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          className="w-full flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors shadow-sm"
          aria-expanded={ouvert}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg">📜</span>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                Historique d&apos;activité
              </p>
              <p className="text-xs text-slate-500 leading-tight">
                {evts.length} événement{evts.length > 1 ? "s" : ""} sur 12 mois
                {!ouvert && " · cliquer pour ouvrir"}
              </p>
            </div>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-slate-400 transition-transform ${ouvert ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {!ouvert ? null : (
      <div className="space-y-4">
      {/* Filtres */}
      <div className="space-y-2">
        {/* Chips période */}
        <div className="flex flex-wrap gap-1.5">
          {PERIODES.map((p) => {
            const actif = periode === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriode(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  actif
                    ? "bg-slate-900 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {/* Chips type */}
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => {
            const actif = type === t.key;
            const n = countByType[t.key];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  actif
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.icon && <span>{t.icon}</span>}
                <span>{t.label}</span>
                <span className={`inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[10px] font-bold ${
                  actif ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      {filtres.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-400">Aucune activité sur cette période</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupes.map(([moisKey, items]) => (
            <div key={moisKey}>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {moisLabel(items[0].date)}
              </p>
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {items.map((e) => {
                  const meta = TYPE_META[e.type];
                  return (
                    <div key={`${e.type}-${e.id}`} className="flex items-start gap-3 p-3">
                      {/* Date courte */}
                      <div className="shrink-0 w-12 text-right">
                        <p className="text-xs font-semibold text-slate-700">
                          {new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric" })}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase">
                          {new Date(e.date).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
                        </p>
                      </div>
                      {/* Icône type */}
                      <div className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg ${meta.bg} ring-1 ${meta.ring}`}>
                        <span className="text-base leading-none">{meta.icon}</span>
                      </div>
                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{meta.label}</span>
                          {e.meta && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${META_TON[e.metaTon ?? "slate"]}`}>
                              {e.meta}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 leading-snug mt-0.5 truncate">{e.titre}</p>
                        {e.detail && <p className="text-xs text-slate-500 truncate">{e.detail}</p>}
                      </div>
                      {/* Date complète tooltip */}
                      <span className="shrink-0 text-[10px] text-slate-400 mt-1" title={dateLisible(e.date)}>
                        {dateLisible(e.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      )}
    </div>
  );
}
