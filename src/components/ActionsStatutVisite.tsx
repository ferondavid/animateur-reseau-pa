"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleCheck, CalendarClock, Ban, RotateCcw, X } from "lucide-react";
import { confirmerVisite, reporterVisite, changerStatutVisite } from "@/app/animateur/tournee/actions";

export default function ActionsStatutVisite({
  id, statut, confirmee, date, heure,
}: {
  id: string;
  statut: string;
  confirmee: boolean;
  date: string;
  heure: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [reporter, setReporter] = useState(false);
  const [nvDate, setNvDate] = useState(date);
  const [nvHeure, setNvHeure] = useState(heure ?? "");

  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });

  if (reporter) {
    return (
      <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--pa-line)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--pa-ink)" }}>Reporter la visite</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={nvDate} onChange={(e) => setNvDate(e.target.value)} className="pa-input" />
          <input type="time" value={nvHeure} onChange={(e) => setNvHeure(e.target.value)} className="pa-input" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setReporter(false)} className="pa-btn-secondary flex-1 py-2 rounded-xl text-xs font-semibold">
            <X size={13} className="inline mr-1" /> Annuler
          </button>
          <button disabled={pending || !nvDate}
            onClick={() => run(async () => { await reporterVisite(id, nvDate, nvHeure || null); setReporter(false); })}
            className="pa-btn-primary flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-60">
            {pending ? "…" : "Déplacer"}
          </button>
        </div>
      </div>
    );
  }

  const btn = "text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors";
  const line = (bg: string, fg: string): React.CSSProperties => ({ background: bg, color: fg });

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap" style={{ borderColor: "var(--pa-line)" }}>
      {statut === "planifiee" && !confirmee && (
        <button disabled={pending} onClick={() => run(() => confirmerVisite(id, true))} className={btn} style={line("#D2F2E7", "#0F8C68")}>
          <Check size={13} /> Valider
        </button>
      )}
      {statut !== "realisee" && (
        <button disabled={pending} onClick={() => run(() => changerStatutVisite(id, "realisee"))} className={btn} style={line("#EDEBFB", "#6B4FD8")}>
          <CircleCheck size={13} /> Réalisée
        </button>
      )}
      <button disabled={pending} onClick={() => setReporter(true)} className={btn} style={line("#FBF1D8", "#B07D14")}>
        <CalendarClock size={13} /> Reporter
      </button>
      {statut !== "annulee" && (
        <button disabled={pending} onClick={() => run(() => changerStatutVisite(id, "annulee"))} className={btn} style={line("#FBE0E8", "#C0476E")}>
          <Ban size={13} /> Annuler
        </button>
      )}
      {(statut === "annulee" || statut === "realisee" || statut === "reportee") && (
        <button disabled={pending} onClick={() => run(() => changerStatutVisite(id, "planifiee"))} className={btn} style={line("#E4F0FB", "#2D6FD0")}>
          <RotateCcw size={13} /> Replanifier
        </button>
      )}
    </div>
  );
}
