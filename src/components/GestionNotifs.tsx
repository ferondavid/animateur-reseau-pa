"use client";

import { useState, useTransition } from "react";
import { majNotif } from "@/app/animateur/notifs/actions";

export type LigneNotif = {
  cle: string;
  libelle: string;
  description: string;
  categorie: string; // "Animateur" | "Associés"
  canaux: string[];  // ["push", "email"]
  actif: boolean;
};

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      disabled={disabled}
      aria-pressed={on}
      className="relative inline-flex items-center rounded-full transition-colors shrink-0"
      style={{
        width: 46, height: 26,
        background: on ? "#6B4FD8" : "#D6D2E6",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        className="absolute rounded-full bg-white transition-all"
        style={{ width: 20, height: 20, top: 3, left: on ? 23 : 3, boxShadow: "0 1px 3px rgba(0,0,0,.25)" }}
      />
    </button>
  );
}

const CANAL_LABEL: Record<string, { label: string; bg: string; fg: string }> = {
  push:  { label: "Push",  bg: "#E4DDFB", fg: "#6B4FD8" },
  email: { label: "Email", bg: "#D9EAFB", fg: "#2D6FD0" },
};

function Row({ l }: { l: LigneNotif }) {
  const [on, setOn] = useState(l.actif);
  const [pending, start] = useTransition();

  function change(v: boolean) {
    setOn(v);
    start(async () => {
      const r = await majNotif(l.cle, v);
      if (r.error) setOn(!v);
    });
  }

  return (
    <div className="px-4 py-3.5" style={{ borderTop: "1px solid var(--pa-line)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>{l.libelle}</span>
            {l.canaux.map((c) => {
              const m = CANAL_LABEL[c];
              return m ? (
                <span key={c} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: m.bg, color: m.fg }}>
                  {m.label}
                </span>
              ) : null;
            })}
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--pa-muted)" }}>{l.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold" style={{ color: on ? "#0F8C68" : "var(--pa-muted)", minWidth: 48, textAlign: "right" }}>
            {on ? "Actif" : "Off"}
          </span>
          <Toggle on={on} onChange={change} disabled={pending} />
        </div>
      </div>
    </div>
  );
}

export default function GestionNotifs({ lignes }: { lignes: LigneNotif[] }) {
  const groupes = ["Animateur", "Associés"] as const;

  return (
    <div className="space-y-5">
      {groupes.map((g) => {
        const rows = lignes.filter((l) => l.categorie === g);
        if (rows.length === 0) return null;
        const nbActifs = rows.filter((l) => l.actif).length;
        return (
          <div key={g} className="pa-card p-0 overflow-hidden">
            <div className="px-4 py-3" style={{ background: "rgba(244,241,251,0.6)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--pa-ink)" }}>
                {g === "Animateur" ? "🧭 Notifications animateur" : "👤 Notifications associés"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                <span className="font-semibold" style={{ color: nbActifs === rows.length ? "#0F8C68" : nbActifs === 0 ? "var(--pa-muted)" : "#B07D14" }}>
                  {nbActifs}/{rows.length} actif{nbActifs > 1 ? "s" : ""}
                </span>
                {" — "}{g === "Animateur" ? "Push et/ou email vers l'animateur." : "Push vers les appareils des associés."}
              </p>
            </div>
            {rows.map((l) => <Row key={l.cle} l={l} />)}
          </div>
        );
      })}
    </div>
  );
}
