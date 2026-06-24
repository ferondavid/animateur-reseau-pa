"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { majVisibilite, majVisibiliteBulk } from "@/app/animateur/visibilite/actions";

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

  // Sync local state when parent receives fresh data (ex: after bulk toggle)
  useEffect(() => {
    setOn(role === "bureau" ? l.bureau : l.associe);
  }, [l.bureau, l.associe, role]);

  function change(v: boolean) {
    setOn(v);
    start(async () => {
      const r = await majVisibilite(l.cle, role, v);
      if (r.error) setOn(!v);
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

function BulkBtn({
  categorie,
  role,
  valeur,
}: {
  categorie: string;
  role: "associe" | "bureau";
  valeur: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function handle() {
    start(async () => {
      await majVisibiliteBulk(categorie, role, valeur);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all shrink-0"
      style={{
        background: valeur ? "#D2F2E7" : "#FBE0E8",
        color: valeur ? "#0F8C68" : "#C04B72",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "…" : valeur ? "Tout activer" : "Tout masquer"}
    </button>
  );
}

export default function GestionVisibilite({ lignes }: { lignes: LigneVis[] }) {
  const groupes = ["Bureau", "Associé"] as const;

  return (
    <div className="space-y-5">
      {groupes.map((g) => {
        const rows = lignes.filter((l) => l.categorie === g).sort((a, b) => a.libelle.localeCompare(b.libelle, "fr"));
        if (rows.length === 0) return null;
        const role: "associe" | "bureau" = g === "Bureau" ? "bureau" : "associe";
        const nbVisible = rows.filter((l) => (role === "bureau" ? l.bureau : l.associe)).length;
        const total = rows.length;

        return (
          <div key={g} className="pa-card p-0 overflow-hidden">
            <div
              className="px-4 py-3 flex items-start justify-between gap-3"
              style={{ background: "rgba(244,241,251,0.6)" }}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: "var(--pa-ink)" }}>
                  {g === "Bureau" ? "🏛️ Visible par le Bureau" : "👤 Visible par les Associés (sur leur fiche)"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                  <span
                    className="font-semibold"
                    style={{ color: nbVisible === total ? "#0F8C68" : nbVisible === 0 ? "#C04B72" : "#B07D14" }}
                  >
                    {nbVisible}/{total} visible{nbVisible > 1 ? "s" : ""}
                  </span>
                  {" — "}
                  {g === "Bureau"
                    ? "Accès en lecture aux tableaux de pilotage."
                    : "Sections affichées sur l'espace de chaque associé."}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <BulkBtn categorie={g} role={role} valeur={true} />
                <BulkBtn categorie={g} role={role} valeur={false} />
              </div>
            </div>
            {rows.map((l) => <Row key={l.cle} l={l} />)}
          </div>
        );
      })}
    </div>
  );
}
