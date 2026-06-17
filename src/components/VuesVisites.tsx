"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  List, CalendarDays, CalendarRange, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown,
} from "lucide-react";
import TuilesVisites from "@/components/TuilesVisites";
import type { VisiteTuile } from "@/components/TuilesVisites";
import { TYPE_BLOC } from "@/lib/jours-bloques";

// Code couleur selon l'état de validation (pas seulement le statut brut)
function etatVisite(v: VisiteTuile): { label: string; bg: string; fg: string } {
  if (v.statut === "realisee") return { label: "Réalisée", bg: "#EDEBFB", fg: "#6B4FD8" };
  if (v.statut === "annulee")  return { label: "Annulée", bg: "#ECEAF3", fg: "#6F6982" };
  if (v.statut === "reportee") return { label: "Reportée", bg: "#FBE0E8", fg: "#C0476E" };
  if (v.confirmee)    return { label: "Validée", bg: "#D2F2E7", fg: "#0F8C68" };
  if (v.heure_prevue) return { label: "À confirmer", bg: "#FBF1D8", fg: "#B07D14" };
  return { label: "Planifiée", bg: "#E4F0FB", fg: "#2D6FD0" };
}

const LEGENDE = [
  { label: "Planifiée", bg: "#E4F0FB", fg: "#2D6FD0" },
  { label: "À confirmer", bg: "#FBF1D8", fg: "#B07D14" },
  { label: "Validée", bg: "#D2F2E7", fg: "#0F8C68" },
  { label: "Réalisée", bg: "#EDEBFB", fg: "#6B4FD8" },
  { label: "Reportée", bg: "#FBE0E8", fg: "#C0476E" },
];

// Clé d'état (même logique que etatVisite) pour le filtrage
function etatKey(v: VisiteTuile): string {
  if (v.statut === "realisee") return "realisee";
  if (v.statut === "annulee") return "annulee";
  if (v.statut === "reportee") return "reportee";
  if (v.confirmee) return "validee";
  if (v.heure_prevue) return "a_confirmer";
  return "planifiee";
}
const FILTRES: { key: string; label: string; bg?: string; fg?: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "planifiee", label: "Planifiée", bg: "#E4F0FB", fg: "#2D6FD0" },
  { key: "a_confirmer", label: "À confirmer", bg: "#FBF1D8", fg: "#B07D14" },
  { key: "validee", label: "Validée", bg: "#D2F2E7", fg: "#0F8C68" },
  { key: "realisee", label: "Réalisée", bg: "#EDEBFB", fg: "#6B4FD8" },
  { key: "reportee", label: "Reportée", bg: "#FBE0E8", fg: "#C0476E" },
  { key: "annulee", label: "Annulée", bg: "#ECEAF3", fg: "#6F6982" },
];
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function lundi(d: Date): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d: Date, n: number): Date { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; }
function dateEff(v: VisiteTuile): string | null { return v.date_prevue ?? v.date_realisee; }
function nomCourt(v: VisiteTuile): string {
  const m = v.magasins;
  return m ? (m.enseigne || m.nom) : "—";
}
function heureCourte(v: VisiteTuile): string | null {
  return v.heure_prevue ? v.heure_prevue.slice(0, 5) : null;
}

export default function VuesVisites({ visites, joursBloques = {} }: { visites: VisiteTuile[]; joursBloques?: Record<string, string> }) {
  const router = useRouter();
  const [vue, setVue] = useState<"liste" | "mois" | "semaine">("liste");
  const [sortAsc, setSortAsc] = useState(false);
  const [filtreEtat, setFiltreEtat] = useState("tous");
  const [curseur, setCurseur] = useState(() => new Date());
  const today = ymd(new Date());

  const visitesFiltrees = useMemo(
    () => (filtreEtat === "tous" ? visites : visites.filter((v) => etatKey(v) === filtreEtat)),
    [visites, filtreEtat]
  );

  const parDate = useMemo(() => {
    const m = new Map<string, VisiteTuile[]>();
    for (const v of visitesFiltrees) {
      const k = dateEff(v);
      if (!k) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(v);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.heure_prevue ?? "").localeCompare(b.heure_prevue ?? ""));
    return m;
  }, [visitesFiltrees]);

  const listeTriee = useMemo(() => {
    return [...visitesFiltrees].sort((a, b) => {
      const da = dateEff(a) ?? "", db = dateEff(b) ?? "";
      return sortAsc ? da.localeCompare(db) : db.localeCompare(da);
    });
  }, [visitesFiltrees, sortAsc]);

  const segStyle = (actif: boolean): React.CSSProperties =>
    actif
      ? { background: "#fff", color: "#6B4FD8", boxShadow: "0 1px 3px rgba(80,60,140,.12)" }
      : { background: "transparent", color: "var(--pa-muted)" };

  return (
    <div className="space-y-4">
      {/* Barre de contrôle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 rounded-xl" style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)" }}>
          {([["liste", "Liste", List], ["mois", "Mois", CalendarDays], ["semaine", "Semaine", CalendarRange]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => setVue(v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={segStyle(vue === v)}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {vue === "liste" ? (
          <button onClick={() => setSortAsc((s) => !s)}
            className="pa-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold">
            {sortAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            Date {sortAsc ? "croissante" : "décroissante"}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setCurseur(new Date())}
              className="pa-btn-secondary px-3 py-1.5 rounded-xl text-sm font-semibold">Aujourd&apos;hui</button>
            <button onClick={() => setCurseur((d) => (vue === "mois" ? addMonths(d, -1) : addDays(d, -7)))}
              aria-label="Précédent" className="w-9 h-9 inline-flex items-center justify-center rounded-xl"
              style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCurseur((d) => (vue === "mois" ? addMonths(d, 1) : addDays(d, 7)))}
              aria-label="Suivant" className="w-9 h-9 inline-flex items-center justify-center rounded-xl"
              style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Filtres par état */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTRES.map((f) => {
          const actif = filtreEtat === f.key;
          const style: React.CSSProperties = actif
            ? (f.bg ? { background: f.bg, color: f.fg, boxShadow: `inset 0 0 0 1.5px ${f.fg}` } : { background: "#EDEBFB", color: "#6B4FD8", boxShadow: "inset 0 0 0 1.5px #6B4FD8" })
            : { background: "var(--pa-card)", color: "var(--pa-muted)", boxShadow: "inset 0 0 0 1px var(--pa-line)" };
          return (
            <button key={f.key} onClick={() => setFiltreEtat(f.key)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all" style={style}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Légende code couleur (vues calendrier) */}
      {vue !== "liste" && (
        <div className="flex items-center gap-3 flex-wrap">
          {LEGENDE.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--pa-muted)" }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: l.bg, boxShadow: `inset 0 0 0 1px ${l.fg}55` }} />
              {l.label}
            </span>
          ))}
        </div>
      )}

      {/* LISTE */}
      {vue === "liste" && <TuilesVisites visites={listeTriee} />}

      {/* MOIS */}
      {vue === "mois" && (
        <VueMois curseur={curseur} parDate={parDate} today={today} bloques={joursBloques}
          onChip={(id) => router.push(`/visites/${id}`)} />
      )}

      {/* SEMAINE */}
      {vue === "semaine" && (
        <VueSemaine curseur={curseur} parDate={parDate} today={today} bloques={joursBloques}
          onChip={(id) => router.push(`/visites/${id}`)} />
      )}
    </div>
  );

  function VueMois({ curseur, parDate, today, bloques, onChip }: {
    curseur: Date; parDate: Map<string, VisiteTuile[]>; today: string; bloques: Record<string, string>; onChip: (id: string) => void;
  }) {
    const premier = new Date(curseur.getFullYear(), curseur.getMonth(), 1);
    const debut = lundi(premier);
    const cellules = Array.from({ length: 42 }, (_, i) => addDays(debut, i));
    const titre = curseur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    return (
      <div className="pa-card overflow-hidden">
        <div className="px-4 py-3 text-center text-sm font-bold capitalize" style={{ color: "var(--pa-ink)", borderBottom: "1px solid var(--pa-line)" }}>
          {titre}
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-semibold py-2" style={{ color: "var(--pa-muted)", borderBottom: "1px solid var(--pa-line)" }}>
          {JOURS.map((j) => <div key={j}>{j}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cellules.map((d, i) => {
            const k = ymd(d);
            const horsMois = d.getMonth() !== curseur.getMonth();
            const estToday = k === today;
            const vs = parDate.get(k) ?? [];
            const bloc = bloques[k];
            const cb = bloc ? TYPE_BLOC[bloc] : null;
            return (
              <div key={i} className="min-h-[88px] p-1.5 space-y-1" style={{
                borderRight: (i % 7 !== 6) ? "1px solid var(--pa-line)" : undefined,
                borderBottom: i < 35 ? "1px solid var(--pa-line)" : undefined,
                background: cb ? `${cb.bg}66` : horsMois ? "rgba(0,0,0,0.015)" : undefined,
              }}>
                <div className="text-right">
                  <span className="inline-flex items-center justify-center text-xs font-semibold rounded-full"
                    style={estToday
                      ? { background: "#6B4FD8", color: "#fff", width: 20, height: 20 }
                      : { color: horsMois ? "var(--pa-line)" : "var(--pa-muted)", width: 20, height: 20 }}>
                    {d.getDate()}
                  </span>
                </div>
                {cb && (
                  <div className="truncate rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: cb.bg, color: cb.fg }}>
                    {cb.label}
                  </div>
                )}
                {vs.slice(0, 3).map((v) => {
                  const st = etatVisite(v);
                  const h = heureCourte(v);
                  return (
                    <button key={v.id} onClick={() => onChip(v.id)}
                      className="w-full text-left truncate rounded px-1.5 py-0.5"
                      style={{ background: st.bg, color: st.fg, fontSize: 11, lineHeight: 1.4 }}>
                      {h && <b>{h} </b>}{nomCourt(v)}
                    </button>
                  );
                })}
                {vs.length > 3 && (
                  <p className="text-[11px] px-1.5" style={{ color: "var(--pa-muted)" }}>+{vs.length - 3}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function VueSemaine({ curseur, parDate, today, bloques, onChip }: {
    curseur: Date; parDate: Map<string, VisiteTuile[]>; today: string; bloques: Record<string, string>; onChip: (id: string) => void;
  }) {
    const debut = lundi(curseur);
    const jours = Array.from({ length: 7 }, (_, i) => addDays(debut, i));
    const fin = addDays(debut, 6);
    const titre = `${debut.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → ${fin.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;

    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-center" style={{ color: "var(--pa-ink)" }}>{titre}</p>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2" style={{ minWidth: 760 }}>
            {jours.map((d, i) => {
              const k = ymd(d);
              const estToday = k === today;
              const vs = parDate.get(k) ?? [];
              const cb = bloques[k] ? TYPE_BLOC[bloques[k]] : null;
              return (
                <div key={i} className="pa-card p-2 space-y-2" style={{ boxShadow: estToday ? "inset 0 0 0 2px #6B4FD8" : undefined, background: cb ? `${cb.bg}66` : undefined }}>
                  <div className="text-center pb-1.5" style={{ borderBottom: "1px solid var(--pa-line)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>{JOURS[i]}</p>
                    <p className="text-sm font-bold" style={{ color: estToday ? "#6B4FD8" : "var(--pa-ink)" }}>{d.getDate()}</p>
                  </div>
                  {cb && (
                    <p className="text-[10px] text-center font-semibold rounded px-1 py-0.5" style={{ background: cb.bg, color: cb.fg }}>{cb.label}</p>
                  )}
                  {vs.length === 0 ? (
                    <p className="text-[11px] text-center py-2" style={{ color: "var(--pa-line)" }}>{cb ? "" : "—"}</p>
                  ) : vs.map((v) => {
                    const st = etatVisite(v);
                    const h = heureCourte(v);
                    return (
                      <button key={v.id} onClick={() => onChip(v.id)}
                        className="w-full text-left rounded-lg p-1.5" style={{ background: st.bg }}>
                        {h && <p className="text-[11px] font-bold" style={{ color: st.fg }}>{h}</p>}
                        <p className="text-xs font-semibold leading-snug" style={{ color: st.fg }}>{nomCourt(v)}</p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
