import Link from "next/link";
import type { GCalEvent } from "@/lib/gcal";

const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

function fmtHeure(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function CardGCalEvent({ event }: { event: GCalEvent }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex shadow-sm">
      <div className="w-1 shrink-0 bg-slate-400" />
      <div className="p-3 flex gap-3 flex-1 min-w-0">
        <div className="shrink-0 text-center w-12">
          <div className="text-lg font-bold text-slate-900 leading-none">{event.debut.getDate()}</div>
          <div className="text-xs text-slate-500 mt-0.5">{MOIS[event.debut.getMonth()]}</div>
          <div className="text-xs text-slate-400">{JOURS[event.debut.getDay()]}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-slate-900 truncate">{event.titre}</div>
          {!event.journeeEntiere ? (
            <div className="text-xs text-slate-500 mt-0.5">
              {fmtHeure(event.debut)} — {fmtHeure(event.fin)}
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-0.5">Journée entière</div>
          )}
          {event.lieu && (
            <div className="text-xs text-slate-400 mt-1 truncate">📍 {event.lieu}</div>
          )}
        </div>
        {event.url && (
          <Link
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-slate-400 hover:text-slate-700 text-sm mt-0.5 transition-colors"
          >
            ↗
          </Link>
        )}
      </div>
    </div>
  );
}
