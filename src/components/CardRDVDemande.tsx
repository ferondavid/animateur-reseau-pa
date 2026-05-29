"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmerRDV, annulerRDV } from "@/app/animateur/rdv/actions";
import ModaleReporterRDV from "./ModaleReporterRDV";

export type RDVDemande = {
  id: string;
  type: "physique" | "tel" | "visio";
  statut: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  objet: string;
  message: string | null;
  lieu: string | null;
  magasins: { id: string; nom: string; enseigne: string | null; ville: string } | null;
  rendez_vous_invites: { magasin_id: string; magasins: { nom: string; enseigne: string | null } | null }[];
};

const TYPE_BADGE: Record<string, { label: string; emoji: string; cls: string }> = {
  physique: { label: "Physique", emoji: "🏪", cls: "bg-blue-100 text-blue-800" },
  tel:      { label: "Téléphone", emoji: "📞", cls: "bg-emerald-100 text-emerald-800" },
  visio:    { label: "Visio", emoji: "💻", cls: "bg-purple-100 text-purple-800" },
};

const JOURS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS_FR = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

function formatDateRDV(dateStr: string, heure: string | null): string {
  const d = new Date(dateStr + "T12:00:00");
  const j = `${JOURS_FR[d.getDay()]} ${d.getDate()} ${MOIS_FR[d.getMonth()]}`;
  return heure ? `${j} · ${heure.slice(0, 5)}` : j;
}

function isUrgent(dateStr: string): boolean {
  const diff = new Date(dateStr + "T23:59:59").getTime() - Date.now();
  return diff > 0 && diff < 3 * 86400000;
}

export default function CardRDVDemande({ rdv }: { rdv: RDVDemande }) {
  const [reporter, setReporter] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const type = TYPE_BADGE[rdv.type] ?? { label: rdv.type, emoji: "📅", cls: "bg-slate-100 text-slate-700" };
  const urgent = isUrgent(rdv.date_souhaitee);
  const invites = rdv.rendez_vous_invites ?? [];
  const nomsMagasin = rdv.magasins
    ? (rdv.magasins.enseigne ? `${rdv.magasins.enseigne} — ${rdv.magasins.nom}` : rdv.magasins.nom)
    : "—";

  async function handleConfirmer() {
    setLoading("confirmer");
    await confirmerRDV(rdv.id);
    setLoading(null);
  }

  async function handleAnnuler() {
    if (!confirm("Annuler ce RDV ?")) return;
    setLoading("annuler");
    await annulerRDV(rdv.id);
    setLoading(null);
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header badges */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${type.cls}`}>
            {type.emoji} {type.label}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rdv.statut === "reporte" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
            {rdv.statut === "reporte" ? "🔵 Reporté" : "🟡 Demandé"}
          </span>
          {urgent && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚡ Urgent</span>
          )}
        </div>

        {/* Corps */}
        <div className="px-4 pb-3 flex-1 space-y-1.5">
          <p className="text-xs text-slate-500">{nomsMagasin}{rdv.magasins?.ville ? ` · ${rdv.magasins.ville}` : ""}</p>
          <p className="font-semibold text-slate-900 text-sm leading-snug">{rdv.objet}</p>
          <p className="text-xs text-slate-500 font-medium">{formatDateRDV(rdv.date_souhaitee, rdv.heure_souhaitee)}</p>

          {invites.length > 0 && (
            <p className="text-xs text-slate-400" title={invites.map(i => i.magasins?.enseigne ?? i.magasins?.nom ?? "?").join(", ")}>
              +{invites.length} invité{invites.length > 1 ? "s" : ""}
            </p>
          )}

          {rdv.message && (
            <p className="text-xs text-slate-600 line-clamp-3 italic">&quot;{rdv.message}&quot;</p>
          )}
        </div>

        {/* Footer boutons */}
        <div className="px-3 pb-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleConfirmer}
              disabled={loading !== null}
              className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              {loading === "confirmer" ? "…" : "✓ Confirmer"}
            </button>
            <button
              onClick={() => setReporter(true)}
              disabled={loading !== null}
              className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              ↻ Reporter
            </button>
            <button
              onClick={handleAnnuler}
              disabled={loading !== null}
              className="flex-1 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 text-xs font-semibold transition-colors"
            >
              {loading === "annuler" ? "…" : "✕"}
            </button>
          </div>
          <Link
            href={`/animateur/rdv/${rdv.id}`}
            className="text-center text-xs text-blue-600 hover:underline font-medium py-1"
          >
            Voir détail →
          </Link>
        </div>
      </div>

      {reporter && <ModaleReporterRDV rdvId={rdv.id} onClose={() => setReporter(false)} />}
    </>
  );
}
