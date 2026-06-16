"use client";

import { useState, useTransition } from "react";
import { Check, CalendarClock, X } from "lucide-react";
import { confirmerVisite, reporterVisite } from "@/app/animateur/tournee/actions";

export default function ActionsVisiteTournee({
  id, confirmee, date, heure,
}: {
  id: string;
  confirmee: boolean;
  date: string;
  heure: string | null;
}) {
  const [pending, start] = useTransition();
  const [reporter, setReporter] = useState(false);
  const [nvDate, setNvDate] = useState(date);
  const [nvHeure, setNvHeure] = useState(heure ?? "");

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
          <button
            disabled={pending || !nvDate}
            onClick={() => start(async () => { await reporterVisite(id, nvDate, nvHeure || null); setReporter(false); })}
            className="pa-btn-primary flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-60">
            {pending ? "…" : "Déplacer"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "var(--pa-line)" }}>
      <button
        disabled={pending}
        onClick={() => start(async () => { await confirmerVisite(id, !confirmee); })}
        className="text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-60"
        style={{ color: confirmee ? "#0F8C68" : "#6B4FD8" }}>
        <Check size={14} /> {confirmee ? "Confirmée ✓ (annuler)" : "Marquer confirmée"}
      </button>
      <button onClick={() => setReporter(true)} className="text-xs font-semibold inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
        <CalendarClock size={14} /> Reporter
      </button>
    </div>
  );
}
