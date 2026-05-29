"use client";

import { useState } from "react";
import { reporterRDV } from "@/app/animateur/rdv/actions";

type Props = { rdvId: string; onClose: () => void };

export default function ModaleReporterRDV({ rdvId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await reporterRDV(
      rdvId,
      form.get("date") as string,
      (form.get("heure") as string) || undefined,
      (form.get("raison") as string) || undefined
    );
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">↻ Reporter le RDV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nouvelle date *</label>
              <input name="date" required type="date" min={today}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Heure (optionnel)</label>
              <input name="heure" type="time"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Raison du report (optionnel)</label>
            <textarea name="raison" rows={2} placeholder="Ex : Indisponibilité, agenda chargé…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {loading ? "Envoi…" : "Confirmer le report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
