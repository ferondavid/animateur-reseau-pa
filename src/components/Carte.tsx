"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
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
const NIVEAU_BADGE_STYLE: Record<string, string> = {
  strategique: "bg-amber-100 text-amber-800",
  standard: "bg-slate-100 text-slate-600",
  observation: "bg-blue-100 text-blue-700",
};
const NIVEAU_EMOJI: Record<string, string> = {
  strategique: "⭐",
  standard: "",
  observation: "🔍",
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
  ok: "#4ea870",
  modere: "#e89548",
  eleve: "#d96363",
};

const LIBELLES: Record<NiveauRisque, string> = {
  ok: "OK",
  modere: "Modéré",
  eleve: "Élevé",
};

function pinIcon(niveauRisque: NiveauRisque, niveauMagasin?: string | null): L.DivIcon {
  const color = COULEURS[niveauRisque];
  const pulse =
    niveauRisque === "eleve"
      ? `<span style="position:absolute;top:14px;left:14px;width:28px;height:28px;border-radius:50%;background:${color};transform:translate(-50%,-50%);animation:pin-pulse 1.5s ease-out infinite;pointer-events:none;"></span>`
      : "";

  // Badge niveau magasin en haut à droite (étoile dorée pour stratégique, loupe bleue pour observation)
  let badgeNiveau = "";
  if (niveauMagasin === "strategique") {
    badgeNiveau = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:-4px;right:-5px;z-index:2;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
        <circle cx="12" cy="12" r="11" fill="#f59e0b" stroke="white" stroke-width="1.5"/>
        <path d="M12 5l2.39 4.84 5.34.78-3.86 3.77.91 5.31L12 17.27 7.22 19.7l.91-5.31L4.27 10.62l5.34-.78L12 5z" fill="white"/>
      </svg>`;
  } else if (niveauMagasin === "observation") {
    badgeNiveau = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" style="position:absolute;top:-4px;right:-5px;z-index:2;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
        <circle cx="12" cy="12" r="11" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
        <circle cx="11" cy="11" r="3" fill="none" stroke="white" stroke-width="2"/>
        <line x1="13.2" y1="13.2" x2="16" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
  }

  const html = `
    <div style="position:relative;width:28px;height:42px;">
      ${pulse}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));position:relative;z-index:1;">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
      ${badgeNiveau}
    </div>`;
  return L.divIcon({
    html,
    className: "pin-magasin",
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -38],
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
          0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
      `}</style>
      <MapContainer
        center={[46.5, 2.5]}
        zoom={6}
        style={{ height: "600px", width: "100%", borderRadius: "0.75rem" }}
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
              icon={pinIcon(niveau, niveauMag)}
            >
              <Popup>
                <div className="space-y-1">
                  <strong>
                    {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
                  </strong>
                  <div className="text-slate-600 text-xs">
                    {m.ville}
                    {m.region ? ` · ${m.region}` : ""}
                  </div>

                  {niveauMag && niveauMag !== "standard" && (
                    <div className="pt-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${NIVEAU_BADGE_STYLE[niveauMag] ?? "bg-slate-100 text-slate-600"}`}>
                        {NIVEAU_EMOJI[niveauMag]} {NIVEAU_LABEL[niveauMag] ?? niveauMag}
                      </span>
                    </div>
                  )}

                  {m.contact_telephone && (
                    <div className="flex items-center gap-2 pt-1.5">
                      <span className="text-sm text-slate-700 tabular-nums">
                        {formatTel(m.contact_telephone)}
                      </span>
                      <a
                        href={`tel:${normalizeTel(m.contact_telephone)}`}
                        className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        Appel
                      </a>
                    </div>
                  )}

                  <div className="pt-1">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${COULEURS[niveau]}1a`,
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
                    <ul className="pt-1 text-xs text-slate-600 list-disc list-inside">
                      {m.risque.raisons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}

                  <a
                    href={`/magasins/${m.id}`}
                    className="inline-block pt-2 text-blue-600 hover:underline text-sm"
                  >
                    Voir la fiche →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Légende risque + niveau magasin */}
      <div className="space-y-1.5 px-1 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-slate-500 uppercase tracking-wide">Risque :</span>
          {(Object.keys(COULEURS) as NiveauRisque[]).map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full border border-white shadow"
                style={{ backgroundColor: COULEURS[n] }}
              />
              <span>
                {LIBELLES[n]}{" "}
                <span className="text-slate-400">({compteur[n]})</span>
              </span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-slate-500 uppercase tracking-wide">Niveau :</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[8px]">★</span>
            <span>Stratégique <span className="text-slate-400 italic">(visite seuil 60j)</span></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded-full bg-slate-300 border border-white shadow" />
            <span>Standard <span className="text-slate-400 italic">(seuil 90j)</span></span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[8px]">🔍</span>
            <span>Observation <span className="text-slate-400 italic">(seuil 30j)</span></span>
          </span>
        </div>
      </div>
    </div>
  );
}
