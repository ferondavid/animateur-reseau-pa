"use client";

import { useState } from "react";
import { reporterRDV } from "@/app/animateur/rdv/actions";
import { RefreshCw, X } from "lucide-react";

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
    <div className="pa-modal-overlay">
      <div className="pa-modal-content w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)" }}>
            <RefreshCw size={17} style={{ color: "#7C6BE8" }} />
            Reporter le RDV
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ color: "var(--pa-muted)" }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="pa-label">Nouvelle date *</label>
              <input name="date" required type="date" min={today} className="pa-input" />
            </div>
            <div>
              <label className="pa-label">Heure (optionnel)</label>
              <input name="heure" type="time" className="pa-input" />
            </div>
          </div>

          <div>
            <label className="pa-label">Raison du report (optionnel)</label>
            <textarea name="raison" rows={2} placeholder="Ex : Indisponibilité, agenda chargé…"
              className="pa-input resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="pa-btn-secondary flex-1 py-2.5 rounded-xl text-sm">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="pa-btn-primary flex-1 py-2.5 rounded-xl text-sm">
              {loading ? "Envoi…" : "Confirmer le report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
