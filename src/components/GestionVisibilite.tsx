"use client";

import { useState, useTransition } from "react";
import { majVisibilite } from "@/app/animateur/visibilite/actions";

export type LigneVis = {
  cle: string;
  libelle: string;
  categorie: string; // "Bureau" | "Associé"
  associe: boolean;
  bureau: boolean;
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

function Row({ l }: { l: LigneVis }) {
  const role: "associe" | "bureau" = l.categorie === "Bureau" ? "bureau" : "associe";
  const [on, setOn] = useState(role === "bureau" ? l.bureau : l.associe);
  const [pending, start] = useTransition();

  function change(v: boolean) {
    setOn(v);
    start(async () => {
      const r = await majVisibilite(l.cle, role, v);
      if (r.error) setOn(!v); // rollback en cas d'échec
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--pa-line)" }}>
      <span className="text-sm font-medium" style={{ color: "var(--pa-ink)" }}>{l.libelle}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold" style={{ color: on ? "#0F8C68" : "var(--pa-muted)", minWidth: 56, textAlign: "right" }}>
          {on ? "Visible" : "Masqué"}
        </span>
        <Toggle on={on} onChange={change} disabled={pending} />
      </div>
    </div>
  );
}

export default function GestionVisibilite({ lignes }: { lignes: LigneVis[] }) {
  const groupes = ["Bureau", "Associé"] as const;

  return (
    <div className="space-y-5">
      {groupes.map((g) => {
        const rows = lignes.filter((l) => l.categorie === g).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
        if (rows.length === 0) return null;
        return (
          <div key={g} className="pa-card p-0 overflow-hidden">
            <div className="px-4 py-3" style={{ background: "rgba(244,241,251,0.6)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--pa-ink)" }}>
                {g === "Bureau" ? "🏛️ Visible par le Bureau" : "👤 Visible par les Associés (sur leur fiche)"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                {g === "Bureau" ? "Accès en lecture aux tableaux de pilotage." : "Sections affichées sur l'espace de chaque associé."}
              </p>
            </div>
            {rows.map((l) => <Row key={l.cle} l={l} />)}
          </div>
        );
      })}
    </div>
  );
}
