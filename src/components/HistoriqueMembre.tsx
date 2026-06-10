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
  // Détails complets pour la vue dépliée
  details?: {
    description?: string | null;
    pointsCles?: string | null;
    noteConfiance?: number | null;
    noteBusiness?: number | null;
    deadline?: string | null;
    urgence?: number | null;
    statut?: string | null;
    lieu?: string | null;
    message?: string | null;
    lienVisio?: string | null;
    typeRdv?: string | null;
    demandeurType?: string | null;
    heureSouhaitee?: string | null;
    gravite?: string | null;
    typeRemontee?: string | null;
    photoUrl?: string | null;
    reponseAnimateur?: string | null;
    dateTraitement?: string | null;
    source?: string | null;
  };
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

function dateLongue(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function DetailLigne({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold shrink-0 min-w-[80px]">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}

function BlocTexte({ label, text, ton = "slate" }: { label: string; text: string; ton?: "slate" | "emerald" | "blue" }) {
  const bg = ton === "emerald" ? "bg-emerald-50 border-emerald-200" : ton === "blue" ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200";
  return (
    <div className="pt-1">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-0.5">{label}</div>
      <p className={`text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border rounded-lg p-2 ${bg}`}>{text}</p>
    </div>
  );
}

const TYPE_REMONTEE: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Technique",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};
const TYPE_RDV: Record<string, string> = { physique: "Physique", tel: "Téléphone", visio: "Visio" };
const URGENCE_LABEL: Record<number, string> = { 1: "Info", 2: "Important", 3: "Urgent" };
const DEMANDEUR_LABEL: Record<string, string> = { animateur: "🎛️ Animateur", magasin: "🏪 Magasin" };
const SOURCE_LABEL: Record<string, string> = { animateur: "🎛️ Animateur", membre: "🏪 Magasin", visite: "🚗 Visite terrain" };

function DetailEvt({ evt }: { evt: EvtHistorique }) {
  const d = evt.details;
  if (!d) return null;

  return (
    <div className="px-4 pt-2 pb-3 space-y-1.5 border-t border-slate-200 bg-slate-50/50">
      {/* VISITE */}
      {evt.type === "visite" && (
        <>
          {d.statut && <DetailLigne label="Statut" value={d.statut} />}
          {d.noteConfiance != null && <DetailLigne label="Confiance" value={`${d.noteConfiance}/5`} />}
          {d.noteBusiness != null && <DetailLigne label="Business" value={`${d.noteBusiness}/5`} />}
          {d.pointsCles && <BlocTexte label="Points clés" text={d.pointsCles} />}
        </>
      )}

      {/* RDV */}
      {evt.type === "rdv" && (
        <>
          {d.typeRdv && <DetailLigne label="Type" value={TYPE_RDV[d.typeRdv] ?? d.typeRdv} />}
          {d.statut && <DetailLigne label="Statut" value={d.statut.charAt(0).toUpperCase() + d.statut.slice(1)} />}
          {d.demandeurType && <DetailLigne label="Initié par" value={DEMANDEUR_LABEL[d.demandeurType] ?? d.demandeurType} />}
          <DetailLigne label="Date" value={`${dateLongue(evt.date)}${d.heureSouhaitee ? ` à ${d.heureSouhaitee.slice(0,5)}` : ""}`} />
          {d.lieu && <DetailLigne label="Lieu" value={d.lieu} />}
          {d.lienVisio && (
            <DetailLigne label="Lien visio" value={d.lienVisio} />
          )}
          {d.message && <BlocTexte label="Message" text={d.message} />}
        </>
      )}

      {/* REMONTÉE */}
      {evt.type === "remontee" && (
        <>
          {d.typeRemontee && <DetailLigne label="Type" value={TYPE_REMONTEE[d.typeRemontee] ?? d.typeRemontee} />}
          {d.gravite && <DetailLigne label="Gravité" value={d.gravite.charAt(0).toUpperCase() + d.gravite.slice(1)} />}
          {d.source && <DetailLigne label="Émise par" value={SOURCE_LABEL[d.source] ?? d.source} />}
          {d.statut && <DetailLigne label="Statut" value={d.statut.charAt(0).toUpperCase() + d.statut.slice(1).replace("_", " ")} />}
          {d.description && <BlocTexte label="Description" text={d.description} />}
          {d.photoUrl && (
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Pièce jointe</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <a href={d.photoUrl} target="_blank" rel="noopener noreferrer">
                <img src={d.photoUrl} alt="Pièce jointe" className="max-h-48 rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
              </a>
            </div>
          )}
          {(d.reponseAnimateur || d.dateTraitement) && (
            <div className="pt-2 mt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">📝 Réponse animateur</span>
                {d.dateTraitement && (
                  <span className="text-[10px] text-slate-500">Le {dateLongue(d.dateTraitement)}</span>
                )}
              </div>
              {d.reponseAnimateur ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-emerald-200 bg-emerald-50 rounded-lg p-2">{d.reponseAnimateur}</p>
              ) : (
                <p className="text-xs text-slate-400 italic">Traité sans réponse écrite</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ACTION */}
      {evt.type === "action" && (
        <>
          {d.urgence != null && <DetailLigne label="Urgence" value={URGENCE_LABEL[d.urgence] ?? "—"} />}
          {d.statut && <DetailLigne label="Statut" value={d.statut.replace("_", " ")} />}
          {d.deadline && <DetailLigne label="Échéance" value={dateLongue(d.deadline)} />}
          {d.description && <BlocTexte label="Description" text={d.description} />}
        </>
      )}
    </div>
  );
}

export default function HistoriqueMembre({ evts, embedded = false }: { evts: EvtHistorique[]; embedded?: boolean }) {
  const [ouvert, setOuvert] = useState<boolean>(embedded);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [periode, setPeriode] = useState<Periode>("trimestre");
  const [type, setType] = useState<TypeFiltre>("tous");

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
                    ? "bg-violet-600 text-white"
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
                  const key = `${e.type}-${e.id}`;
                  const open = expanded.has(key);
                  const hasDetails = !!e.details;
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => hasDetails && toggleExpand(key)}
                        disabled={!hasDetails}
                        className={`w-full flex items-start gap-3 p-3 text-left ${hasDetails ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"} transition-colors`}
                      >
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
                        {/* Chevron / date */}
                        {hasDetails ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-slate-400 mt-2 transition-transform ${open ? "rotate-180" : ""}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        ) : (
                          <span className="shrink-0 text-[10px] text-slate-400 mt-1" title={dateLisible(e.date)}>
                            {dateLisible(e.date)}
                          </span>
                        )}
                      </button>
                      {open && hasDetails && <DetailEvt evt={e} />}
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
