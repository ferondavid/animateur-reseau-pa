"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, List, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { EvtAgenda } from "@/lib/agenda-unifie";

const SOURCE: Record<string, { label: string; bg: string; fg: string }> = {
  rdv:    { label: "RDV", bg: "#EDEBFB", fg: "#6B4FD8" },
  visite: { label: "Visite", bg: "#D2F2E7", fg: "#0F8C68" },
  google: { label: "Agenda", bg: "#E4F0FB", fg: "#2D6FD0" },
};
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function lundi(d: Date): Date {
  const x = new Date(d); x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function heure(e: EvtAgenda): string {
  if (e.journeeEntiere) return "Journée";
  const d = new Date(e.debut);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function libelle(e: EvtAgenda): string {
  return e.magasinEnseigne || e.magasinNom || e.titre;
}

export default function AgendaSemaine({ events, gcalLabel, gcalError }: {
  events: EvtAgenda[]; gcalLabel?: string; gcalError?: string;
}) {
  const router = useRouter();
  const [vue, setVue] = useState<"semaine" | "liste">("semaine");
  const [curseur, setCurseur] = useState(() => new Date());
  const today = ymd(new Date());

  const parJour = useMemo(() => {
    const m = new Map<string, EvtAgenda[]>();
    for (const e of events) {
      const k = ymd(new Date(e.debut));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    for (const arr of m.values()) arr.sort((a, b) => +new Date(a.debut) - +new Date(b.debut));
    return m;
  }, [events]);

  const ouvrir = (e: EvtAgenda) => { if (e.urlDetail) router.push(e.urlDetail); };

  const segStyle = (actif: boolean): React.CSSProperties =>
    actif ? { background: "#fff", color: "#6B4FD8", boxShadow: "0 1px 3px rgba(80,60,140,.12)" }
          : { background: "transparent", color: "var(--pa-muted)" };

  const debut = lundi(curseur);
  const jours = Array.from({ length: 7 }, (_, i) => addDays(debut, i));
  const fin = addDays(debut, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex p-1 rounded-xl" style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)" }}>
          {([["semaine", "Semaine", CalendarRange], ["liste", "Liste", List]] as const).map(([v, label, Icon]) => (
            <button key={v} onClick={() => setVue(v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all" style={segStyle(vue === v)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        {vue === "semaine" && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
              {debut.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → {fin.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </span>
            <button onClick={() => setCurseur(new Date())} className="pa-btn-secondary px-2.5 py-1 rounded-lg text-xs font-semibold">Auj.</button>
            <button onClick={() => setCurseur((d) => addDays(d, -7))} aria-label="Précédent"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg" style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}><ChevronLeft size={15} /></button>
            <button onClick={() => setCurseur((d) => addDays(d, 7))} aria-label="Suivant"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg" style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}><ChevronRight size={15} /></button>
          </div>
        )}
      </div>

      {gcalError && (
        <p className="text-[11px]" style={{ color: "#B45309" }}>{gcalLabel} : {gcalError}</p>
      )}

      {/* Légende sources */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.values(SOURCE).map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--pa-muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.bg, boxShadow: `inset 0 0 0 1px ${s.fg}55` }} />{s.label}
          </span>
        ))}
      </div>

      {vue === "semaine" ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2" style={{ minWidth: 780 }}>
            {jours.map((d, i) => {
              const k = ymd(d);
              const estToday = k === today;
              const evs = parJour.get(k) ?? [];
              return (
                <div key={i} className="pa-card p-2 space-y-1.5" style={estToday ? { boxShadow: "inset 0 0 0 2px #6B4FD8" } : undefined}>
                  <div className="text-center pb-1" style={{ borderBottom: "1px solid var(--pa-line)" }}>
                    <p className="text-[11px] font-semibold" style={{ color: "var(--pa-muted)" }}>{JOURS[i]}</p>
                    <p className="text-sm font-bold" style={{ color: estToday ? "#6B4FD8" : "var(--pa-ink)" }}>{d.getDate()}</p>
                  </div>
                  {evs.length === 0 ? (
                    <p className="text-[11px] text-center py-1.5" style={{ color: "var(--pa-line)" }}>—</p>
                  ) : evs.map((e) => {
                    const s = SOURCE[e.source] ?? SOURCE.google;
                    return (
                      <button key={e.id} onClick={() => ouvrir(e)} disabled={!e.urlDetail}
                        className="w-full text-left rounded-lg p-1.5" style={{ background: s.bg, cursor: e.urlDetail ? "pointer" : "default" }}>
                        <p className="text-[11px] font-bold" style={{ color: s.fg }}>{heure(e)}</p>
                        <p className="text-xs font-semibold leading-snug" style={{ color: s.fg }}>{libelle(e)}</p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {events.map((e) => {
            const s = SOURCE[e.source] ?? SOURCE.google;
            return (
              <button key={e.id} onClick={() => ouvrir(e)} disabled={!e.urlDetail}
                className="pa-card p-3 text-left flex items-start gap-3" style={{ cursor: e.urlDetail ? "pointer" : "default" }}>
                <div className="text-center shrink-0">
                  <p className="text-[11px] font-semibold" style={{ color: "var(--pa-muted)" }}>
                    {new Date(e.debut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs font-bold" style={{ color: s.fg }}>{heure(e)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>{libelle(e)}</p>
                  {e.lieu && <p className="text-xs truncate inline-flex items-center gap-1" style={{ color: "var(--pa-muted)" }}><MapPin size={11} />{e.lieu}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
