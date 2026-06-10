"use client";

import { useState, useTransition } from "react";
import { Store, Phone, Laptop, Car, Calendar, Check, X, CalendarClock, Send } from "lucide-react";
import {
  accepterRDVMembre,
  refuserRDVMembre,
  proposerAutreCreneauRDV,
  accepterVisite,
  refuserVisite,
} from "@/app/membre/[id]/actions";

const TYPE_ICON: Record<string, typeof Store> = {
  physique: Store,
  tel: Phone,
  visio: Laptop,
};
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

  const Icon = demande.kind === "rdv" ? (TYPE_ICON[demande.type] ?? Calendar) : Car;
  const dateLabel =
    demande.kind === "rdv"
      ? fmtDate(demande.date_souhaitee, demande.heure_souhaitee)
      : fmtDate(demande.date_prevue);

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
    <div
      className="rounded-2xl overflow-hidden p-3.5 space-y-3"
      style={{
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(124,107,232,0.16)",
        boxShadow: "0 6px 18px -10px rgba(80,60,140,0.25)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(124,107,232,0.12)", color: "#5B4FCB" }}
        >
          <Icon size={19} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold" style={{ color: "#7A72A8" }}>
            {dateLabel}
          </p>
          <p className="text-sm font-semibold leading-snug" style={{ color: "#3B3470" }}>
            {titre}
          </p>
          {message && (
            <p className="text-xs italic mt-0.5" style={{ color: "#8B8699" }}>
              &ldquo;{message}&rdquo;
            </p>
          )}
        </div>
      </div>

      {mode === "idle" && (
        <div className="flex gap-2">
          <button
            onClick={handleAccepter}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-white text-xs font-semibold transition-transform active:scale-95 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#3FCBA0,#1FA98A)",
              boxShadow: "0 4px 12px -4px rgba(63,203,160,0.7)",
            }}
          >
            <Check size={15} strokeWidth={2.5} />
            {isPending ? "…" : "Accepter"}
          </button>
          {demande.kind === "rdv" && (
            <button
              onClick={() => setMode("contre")}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-white text-xs font-semibold transition-transform active:scale-95 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#B08BF0,#8A5FE0)",
                boxShadow: "0 4px 12px -4px rgba(138,95,224,0.6)",
              }}
            >
              <CalendarClock size={15} strokeWidth={2.5} />
              Autre créneau
            </button>
          )}
          <button
            onClick={() => setMode("refus")}
            disabled={isPending}
            aria-label="Refuser"
            className="shrink-0 w-9 inline-flex items-center justify-center rounded-xl text-xs font-semibold transition-transform active:scale-95 disabled:opacity-60"
            style={{ background: "rgba(124,107,232,0.08)", color: "#8B8699" }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {mode === "contre" && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: "#5B5470" }}>Proposer un autre créneau :</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={newDate}
              min={today}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2"
              style={{ borderColor: "rgba(124,107,232,0.3)" }}
            />
            <input
              type="time"
              value={newHeure}
              onChange={(e) => setNewHeure(e.target.value)}
              className="rounded-lg border px-2 py-1.5 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2"
              style={{ borderColor: "rgba(124,107,232,0.3)" }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleContreProposeSubmit}
              disabled={!newDate || isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-white text-xs font-semibold active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#B08BF0,#8A5FE0)" }}
            >
              <Send size={14} strokeWidth={2.5} />
              {isPending ? "…" : "Envoyer"}
            </button>
            <button
              onClick={() => setMode("idle")}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(124,107,232,0.08)", color: "#5B5470" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {mode === "refus" && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: "#5B5470" }}>Motif du refus (optionnel) :</p>
          <textarea
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            rows={2}
            placeholder="Ex : Je suis absent ce jour-là…"
            className="w-full rounded-lg border px-2 py-1.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-none"
            style={{ borderColor: "rgba(212,83,126,0.35)" }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleRefusSubmit}
              disabled={isPending}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-white text-xs font-semibold active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#F2A0B8,#D4537E)" }}
            >
              <X size={14} strokeWidth={2.5} />
              {isPending ? "…" : "Confirmer le refus"}
            </button>
            <button
              onClick={() => setMode("idle")}
              className="py-1.5 px-3 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(124,107,232,0.08)", color: "#5B5470" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
