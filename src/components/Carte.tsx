"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Phone, ArrowRight } from "lucide-react";
import { titreMagasin } from "@/lib/magasin";
import type { NiveauRisque, NiveauMagasin } from "@/lib/risque";

type MagasinPin = {
  id: string;
  nom: string;
  ville: string;
  enseigne?: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  contact_telephone?: string | null;
  niveau?: NiveauMagasin | string | null;
  sous_enseigne?: boolean | null;
  membre_ca?: boolean | null;
  risque?: {
    niveau: NiveauRisque;
    raisons: string[];
    joursSansVisite: number | null;
  };
};

const NIVEAU_LABEL: Record<string, string> = {
  strategique: "Stratégique",
  standard: "Standard",
  observation: "Observation",
};
const NIVEAU_BADGE: Record<string, { bg: string; fg: string }> = {
  strategique: { bg: "#FBF1D8", fg: "#B07D14" },
  standard: { bg: "#ECEAF3", fg: "#6F6982" },
  observation: { bg: "#E4F0FB", fg: "#2D6FD0" },
};
const NIVEAU_EMOJI: Record<string, string> = {
  strategique: "★",
  standard: "",
  observation: "◎",
};

function normalizeTel(tel: string | null | undefined): string | null {
  if (!tel) return null;
  const digits = tel.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return "+33" + digits.slice(1);
  return digits;
}

function formatTel(tel: string | null | undefined): string {
  if (!tel) return "";
  const digits = tel.replace(/[\s.\-()]/g, "").replace(/^\+33/, "0");
  return digits.match(/.{1,2}/g)?.join(" ") ?? digits;
}

const COULEURS: Record<NiveauRisque, string> = {
  ok: "#3DA877",
  modere: "#E8943A",
  eleve: "#D85C5C",
};

// Teinte claire (haut du dégradé) pour l'effet glossy des puces
const COULEURS_CLAIR: Record<NiveauRisque, string> = {
  ok: "#79D3A4",
  modere: "#F6B870",
  eleve: "#EE9090",
};

const LIBELLES: Record<NiveauRisque, string> = {
  ok: "OK",
  modere: "Modéré",
  eleve: "Élevé",
};

function pinIcon(niveauRisque: NiveauRisque, niveauMagasin?: string | null, souEnseigne?: boolean | null, membreCa?: boolean | null): L.DivIcon {
  const color = COULEURS[niveauRisque];
  const clair = COULEURS_CLAIR[niveauRisque];
  const gid = `pin-${niveauRisque}`;
  const pulse =
    niveauRisque === "eleve"
      ? `<span style="position:absolute;top:15px;left:15px;width:30px;height:30px;border-radius:50%;background:${color};transform:translate(-50%,-50%);animation:pin-pulse 1.5s ease-out infinite;pointer-events:none;"></span>`
      : "";

  // Badge niveau magasin en haut à droite (étoile dorée pour stratégique, loupe bleue pour observation)
  let badgeNiveau = "";
  if (niveauMagasin === "strategique") {
    badgeNiveau = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:-4px;right:-5px;z-index:2;filter:drop-shadow(0 1px 2px rgba(80,60,140,0.4));">
        <circle cx="12" cy="12" r="11" fill="#E8B43A" stroke="white" stroke-width="1.5"/>
        <path d="M12 5l2.39 4.84 5.34.78-3.86 3.77.91 5.31L12 17.27 7.22 19.7l.91-5.31L4.27 10.62l5.34-.78L12 5z" fill="white"/>
      </svg>`;
  } else if (niveauMagasin === "observation") {
    badgeNiveau = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:-4px;right:-5px;z-index:2;filter:drop-shadow(0 1px 2px rgba(80,60,140,0.4));">
        <circle cx="12" cy="12" r="11" fill="#5BA8F5" stroke="white" stroke-width="1.5"/>
        <circle cx="11" cy="11" r="3" fill="none" stroke="white" stroke-width="2"/>
        <line x1="13.2" y1="13.2" x2="16" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }

  const badgePA = souEnseigne
    ? `<span style="position:absolute;top:-8px;left:-6px;background:#1475A8;color:white;font-size:9px;font-weight:700;padding:1px 3px;border-radius:3px;line-height:1.4;z-index:3;box-shadow:0 1px 2px rgba(0,0,0,.3)">PA</span>`
    : "";

  const badgeCA = membreCa
    ? `<span style="position:absolute;bottom:-8px;left:-6px;background:#6B4FD8;color:white;font-size:9px;font-weight:700;padding:1px 3px;border-radius:3px;line-height:1.4;z-index:3;box-shadow:0 1px 2px rgba(0,0,0,.3)">CA</span>`
    : "";

  const html = `
    <div style="position:relative;width:30px;height:44px;">
      ${pulse}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="30" height="44" style="filter: drop-shadow(0 3px 4px rgba(60,40,110,0.38));position:relative;z-index:1;overflow:visible;">
        <defs>
          <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="${clair}"/>
            <stop offset="1" stop-color="${color}"/>
          </linearGradient>
          <radialGradient id="${gid}-gloss" cx="0.34" cy="0.28" r="0.62">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
            <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.18"/>
            <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="url(#${gid})" stroke="white" stroke-width="2"/>
        <ellipse cx="8.6" cy="8" rx="5.4" ry="3.4" fill="url(#${gid}-gloss)"/>
        <circle cx="12" cy="12" r="3.7" fill="white"/>
      </svg>
      ${badgeNiveau}
      ${badgePA}
      ${badgeCA}
    </div>`;
  return L.divIcon({
    html,
    className: "pin-magasin",
    iconSize: [30, 44],
    iconAnchor: [15, 44],
    popupAnchor: [0, -40],
  });
}

export default function Carte({ magasins }: { magasins: MagasinPin[] }) {
  const compteur: Record<NiveauRisque, number> = { ok: 0, modere: 0, eleve: 0 };
  for (const m of magasins) {
    const n = m.risque?.niveau ?? "ok";
    compteur[n]++;
  }

  return (
    <div className="space-y-2">
      <style>{`
        @keyframes pin-pulse {
          0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.55; }
          100% { transform: translate(-50%, -50%) scale(1.9); opacity: 0; }
        }
        /* Bulles pastel premium */
        .leaflet-popup-content-wrapper {
          border-radius: 18px !important;
          background: rgba(255,255,255,0.97) !important;
          box-shadow: 0 18px 44px -14px rgba(80,60,140,0.34) !important;
          border: 1px solid rgba(255,255,255,0.75) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .leaflet-popup-content { margin: 13px 15px !important; }
        .leaflet-popup-tip {
          background: rgba(255,255,255,0.97) !important;
          box-shadow: 0 18px 44px -14px rgba(80,60,140,0.34) !important;
        }
        .leaflet-popup-close-button {
          color: #9A93AC !important;
          font-size: 20px !important;
          padding: 8px 9px 0 0 !important;
        }
        .leaflet-popup-close-button:hover { color: #6B4FD8 !important; background: transparent !important; }
      `}</style>
      <MapContainer
        center={[46.5, 2.5]}
        zoom={6}
        style={{ height: "600px", width: "100%", borderRadius: "16px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {magasins.map((m) => {
          const niveau = m.risque?.niveau ?? "ok";
          const niveauMag = (m.niveau ?? "standard") as string;
          return (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={pinIcon(niveau, niveauMag, m.sous_enseigne, m.membre_ca)}
            >
              <Popup>
                <div className="space-y-1.5">
                  <strong style={{ color: "#241F33", fontSize: "14px", fontWeight: 600, letterSpacing: "-0.2px" }}>
                    {titreMagasin(m.enseigne, m.nom)}
                  </strong>
                  <div style={{ color: "#8B8699", fontSize: "12px" }}>
                    {m.ville}
                    {m.region ? ` · ${m.region}` : ""}
                  </div>

                  {niveauMag && niveauMag !== "standard" && (
                    <div className="pt-0.5">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: (NIVEAU_BADGE[niveauMag] ?? NIVEAU_BADGE.standard).bg,
                          color: (NIVEAU_BADGE[niveauMag] ?? NIVEAU_BADGE.standard).fg,
                        }}
                      >
                        {NIVEAU_EMOJI[niveauMag]} {NIVEAU_LABEL[niveauMag] ?? niveauMag}
                      </span>
                    </div>
                  )}

                  {m.contact_telephone && (
                    <div className="flex items-center gap-2 pt-1.5">
                      <span className="tabular-nums" style={{ color: "#241F33", fontSize: "13px" }}>
                        {formatTel(m.contact_telephone)}
                      </span>
                      <a
                        href={`tel:${normalizeTel(m.contact_telephone)}`}
                        className="inline-flex items-center gap-1.5 text-white rounded-full px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95"
                        style={{ background: "linear-gradient(135deg,#34C9A3,#1FA98A)", boxShadow: "0 4px 10px -4px rgba(31,169,138,.5)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={13} strokeWidth={2.5} />
                        Appel
                      </a>
                    </div>
                  )}

                  <div className="pt-0.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${COULEURS[niveau]}22`,
                        color: COULEURS[niveau],
                      }}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: COULEURS[niveau] }}
                      />
                      Risque {LIBELLES[niveau].toLowerCase()}
                    </span>
                  </div>

                  {m.risque?.raisons && m.risque.raisons.length > 0 && (
                    <ul className="pt-1 text-xs list-disc list-inside" style={{ color: "#8B8699" }}>
                      {m.risque.raisons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}

                  <a
                    href={`/magasins/${m.id}`}
                    className="inline-flex items-center gap-1 pt-2 text-sm font-semibold hover:underline"
                    style={{ color: "#6B4FD8" }}
                  >
                    Voir la fiche <ArrowRight size={13} strokeWidth={2.5} />
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Légende risque + niveau magasin */}
      <div className="space-y-1.5 px-1 text-xs" style={{ color: "var(--pa-ink)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>Risque :</span>
          {(Object.keys(COULEURS) as NiveauRisque[]).map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: `linear-gradient(135deg, ${COULEURS_CLAIR[n]}, ${COULEURS[n]})`, border: "1.5px solid #fff", boxShadow: "0 1px 3px -1px rgba(80,60,140,.4)" }}
              />
              <span>
                {LIBELLES[n]}{" "}
                <span style={{ color: "var(--pa-muted)" }}>({compteur[n]})</span>
              </span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>Badge :</span>
            <span className="inline-flex items-center gap-1.5">
              <span style={{ background: "#1475A8", color: "white", fontSize: "9px", fontWeight: 700, padding: "1px 3px", borderRadius: "3px", lineHeight: 1.4 }}>PA</span>
              <span>Sous enseigne PA</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span style={{ background: "#6B4FD8", color: "white", fontSize: "9px", fontWeight: 700, padding: "1px 3px", borderRadius: "3px", lineHeight: 1.4 }}>CA</span>
              <span>Conseil d&apos;Administration</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>Niveau :</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[8px]" style={{ background: "#E8B43A" }}>★</span>
            <span>Stratégique <span className="italic" style={{ color: "var(--pa-muted)" }}>(visite seuil 60j)</span></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded-full" style={{ background: "#C8C4D6", border: "1.5px solid #fff", boxShadow: "0 1px 3px -1px rgba(80,60,140,.3)" }} />
            <span>Standard <span className="italic" style={{ color: "var(--pa-muted)" }}>(seuil 90j)</span></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[8px]" style={{ background: "#5BA8F5" }}>◎</span>
            <span>Observation <span className="italic" style={{ color: "var(--pa-muted)" }}>(seuil 30j)</span></span>
          </span>
        </div>
      </div>
    </div>
  );
}
