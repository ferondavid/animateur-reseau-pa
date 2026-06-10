"use client";

import { useState } from "react";
import Link from "next/link";
import { confirmerRDV, annulerRDV } from "@/app/animateur/rdv/actions";
import ModaleReporterRDV from "./ModaleReporterRDV";
import { Store, Phone, Monitor, Zap, Clock, RefreshCw, Check, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export type RDVDemande = {
  id: string;
  type: "physique" | "tel" | "visio";
  statut: string;
  demandeur_type?: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  objet: string;
  message: string | null;
  lieu: string | null;
  magasins: { id: string; nom: string; enseigne: string | null; ville: string } | null;
  rendez_vous_invites: { magasin_id: string; magasins: { nom: string; enseigne: string | null } | null }[];
};

const TYPE_CONFIG: Record<string, { label: string; Icon: React.ComponentType<{ size?: number }>; bg: string; text: string }> = {
  physique: { label: "Physique",   Icon: Store,   bg: "rgba(93,130,245,0.1)",  text: "#3D5BD3" },
  tel:      { label: "Téléphone",  Icon: Phone,   bg: "rgba(52,201,163,0.1)",  text: "#0F8C68" },
  visio:    { label: "Visio",      Icon: Monitor, bg: "rgba(176,139,240,0.1)", text: "#6B4FD8" },
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

  const typeConf = TYPE_CONFIG[rdv.type] ?? { label: rdv.type, Icon: Clock, bg: "rgba(100,100,100,0.1)", text: "#666" };
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
      <div className="pa-card flex flex-col overflow-hidden">
        {/* Header badges */}
        <div className="flex items-center gap-1.5 px-4 pt-4 pb-2 flex-wrap">
          {/* Type */}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: typeConf.bg, color: typeConf.text }}
          >
            <typeConf.Icon size={10} />
            {typeConf.label}
          </span>

          {/* Statut */}
          {rdv.demandeur_type === "animateur" && rdv.statut === "demande" ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "#FBF1D8", color: "#B07D14" }}>
              <Clock size={10} /> En attente du magasin
            </span>
          ) : rdv.statut === "reporte" ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(93,130,245,0.1)", color: "#3D5BD3" }}>
              <RefreshCw size={10} /> Contre-proposition
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#FBF1D8", color: "#B07D14" }}>
              Demandé
            </span>
          )}

          {/* Origine */}
          {rdv.demandeur_type === "animateur" ? (
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(139,134,153,0.1)", color: "var(--pa-muted)" }}>
              <ArrowUpRight size={10} /> De vous
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(93,130,245,0.1)", color: "#3D5BD3" }}>
              <ArrowDownLeft size={10} /> Du magasin
            </span>
          )}

          {/* Urgent */}
          {urgent && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "#FBE0E8", color: "#C0476E" }}>
              <Zap size={10} /> Urgent
            </span>
          )}
        </div>

        {/* Corps */}
        <div className="px-4 pb-3 flex-1 space-y-1.5">
          <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
            {nomsMagasin}{rdv.magasins?.ville ? ` · ${rdv.magasins.ville}` : ""}
          </p>
          <p className="font-semibold text-sm leading-snug" style={{ color: "var(--pa-ink)" }}>{rdv.objet}</p>
          <p className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
            {formatDateRDV(rdv.date_souhaitee, rdv.heure_souhaitee)}
          </p>

          {invites.length > 0 && (
            <p className="text-xs" style={{ color: "var(--pa-muted)" }}
               title={invites.map(i => i.magasins?.enseigne ?? i.magasins?.nom ?? "?").join(", ")}>
              +{invites.length} invité{invites.length > 1 ? "s" : ""}
            </p>
          )}

          {rdv.message && (
            <p className="text-xs line-clamp-3 italic" style={{ color: "#5b5470" }}>&quot;{rdv.message}&quot;</p>
          )}
        </div>

        {/* Footer boutons */}
        <div className="px-3 pb-3 flex flex-col gap-2">
          <div className="flex gap-2">
            {!(rdv.demandeur_type === "animateur" && rdv.statut === "demande") && (
              <button
                onClick={handleConfirmer}
                disabled={loading !== null}
                className="flex-1 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                style={{ background: "linear-gradient(135deg,#34C9A3,#1FA98A)", boxShadow: "0 4px 10px -4px rgba(31,169,138,.5)" }}
              >
                {loading === "confirmer" ? "…" : <><Check size={11} /> Confirmer</>}
              </button>
            )}
            {!(rdv.demandeur_type === "animateur" && rdv.statut === "demande") && (
              <button
                onClick={() => setReporter(true)}
                disabled={loading !== null}
                className="pa-btn-primary flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1"
              >
                <RefreshCw size={11} /> Reporter
              </button>
            )}
            <button
              onClick={handleAnnuler}
              disabled={loading !== null}
              className="pa-btn-secondary flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1"
            >
              {loading === "annuler" ? "…" : <><X size={11} /> Annuler</>}
            </button>
          </div>
          <Link
            href={`/animateur/rdv/${rdv.id}`}
            className="text-center text-xs font-medium py-1 hover:underline"
            style={{ color: "#7C6BE8" }}
          >
            Voir détail →
          </Link>
        </div>
      </div>

      {reporter && <ModaleReporterRDV rdvId={rdv.id} onClose={() => setReporter(false)} />}
    </>
  );
}
