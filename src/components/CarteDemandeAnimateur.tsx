"use client";

import { useState, useTransition } from "react";
import {
  accepterRDVMembre,
  refuserRDVMembre,
  proposerAutreCreneauRDV,
  accepterVisite,
  refuserVisite,
} from "@/app/membre/[id]/actions";

const TYPE_ICON: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻" };
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

function fmtDate(dateStr: string, heure: string | null = null): string {
  const d = new Date(dateStr + "T12:00:00");
  const base = `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
  return heure ? `${base} · ${heure.slice(0, 5)}` : base;
}

export type RDVEnAttente = {
  kind: "rdv";
  id: string;
  type: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  objet: string;
  message: string | null;
};

export type VisiteEnAttente = {
  kind: "visite";
  id: string;
  date_prevue: string;
  objectif: string | null;
};

type Mode = "idle" | "contre" | "refus";

export default function CarteDemandeAnimateur({
  demande,
  magasinId,
}: {
  demande: RDVEnAttente | VisiteEnAttente;
  magasinId: string;
}) {
  const [mode, setMode] = useState<Mode>("idle");
  const [newDate, setNewDate] = useState("");
  const [newHeure, setNewHeure] = useState("");
  const [raison, setRaison] = useState("");
  const [isPending, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0];

  const label =
    demande.kind === "rdv"
      ? `${TYPE_ICON[demande.type] ?? "📅"} ${fmtDate(demande.date_souhaitee, demande.heure_souhaitee)}`
      : `🚗 ${fmtDate(demande.date_prevue)}`;

  const titre =
    demande.kind === "rdv" ? demande.objet : demande.objectif ?? "Visite planifiée par l'animateur";

  const message = demande.kind === "rdv" ? demande.message : null;

  function handleAccepter() {
    startTransition(async () => {
      if (demande.kind === "rdv") {
        await accepterRDVMembre(demande.id, magasinId);
      } else {
        await accepterVisite(demande.id, magasinId);
      }
    });
  }

  function handleContreProposeSubmit() {
    if (!newDate) return;
    startTransition(async () => {
      await proposerAutreCreneauRDV(demande.id, magasinId, newDate, newHeure || undefined);
      setMode("idle");
    });
  }

  function handleRefusSubmit() {
    startTransition(async () => {
      if (demande.kind === "rdv") {
        await refuserRDVMembre(demande.id, magasinId, raison || undefined);
      } else {
        await refuserVisite(demande.id, magasinId);
      }
      setMode("idle");
    });
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden flex shadow-sm border border-amber-200">
      <div className="w-1.5 shrink-0 bg-amber-400" />
      <div className="flex-1 p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-amber-700 mb-0.5">{label}</p>
          <p className="font-semibold text-sm text-slate-900">{titre}</p>
          {message && (
            <p className="text-xs text-slate-500 italic mt-0.5">&ldquo;{message}&rdquo;</p>
          )}
        </div>

        {mode === "idle" && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleAccepter}
              disabled={isPending}
              className="flex-1 min-w-0 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              {isPending ? "…" : "✅ Accepter"}
            </button>
            {demande.kind === "rdv" && (
              <button
                onClick={() => setMode("contre")}
                disabled={isPending}
                className="flex-1 min-w-0 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                🔄 Autre créneau
              </button>
            )}
            <button
              onClick={() => setMode("refus")}
              disabled={isPending}
              className="py-1.5 px-3 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 text-xs font-semibold transition-colors"
            >
              ❌
            </button>
          </div>
        )}

        {mode === "contre" && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Proposer un autre créneau :</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={newDate}
                min={today}
                onChange={(e) => setNewDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <input
                type="time"
                value={newHeure}
                onChange={(e) => setNewHeure(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleContreProposeSubmit}
                disabled={!newDate || isPending}
                className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                {isPending ? "…" : "Envoyer"}
              </button>
              <button
                onClick={() => setMode("idle")}
                className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {mode === "refus" && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Motif du refus (optionnel) :</p>
            <textarea
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              rows={2}
              placeholder="Ex : Je suis absent ce jour-là…"
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleRefusSubmit}
                disabled={isPending}
                className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                {isPending ? "…" : "Confirmer le refus"}
              </button>
              <button
                onClick={() => setMode("idle")}
                className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
