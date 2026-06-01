"use client";

import { useTransition } from "react";
import { updateStatutMagasin } from "@/app/magasins/[id]/actions";

type Statut = "actif" | "pause" | "inactif";

const CONFIG: Record<Statut, { cible: Statut; label: string; confirm: string; className: string }> = {
  actif: {
    cible: "pause",
    label: "🌙 Mettre en sommeil",
    confirm: "Mettre ce magasin en sommeil ?\nIl sera masqué de la carte et exclu des KPIs actifs.\nSon historique est conservé.",
    className: "bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
  },
  pause: {
    cible: "actif",
    label: "☀️ Réactiver",
    confirm: "Réactiver ce magasin ? Il réapparaîtra sur la carte et dans les KPIs.",
    className: "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
  },
  inactif: {
    cible: "actif",
    label: "♻️ Réactiver",
    confirm: "Réactiver ce magasin archivé ?",
    className: "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
  },
};

export default function BoutonStatutMagasin({ id, statut }: { id: string; statut: string }) {
  const [isPending, startTransition] = useTransition();
  const config = CONFIG[statut as Statut];
  if (!config) return null;

  function handleClick() {
    if (!confirm(config.confirm)) return;
    startTransition(async () => {
      await updateStatutMagasin(id, config.cible);
    });
  }

  return (
    <button onClick={handleClick} disabled={isPending} className={`${config.className} disabled:opacity-50`}>
      {isPending ? "…" : config.label}
    </button>
  );
}
