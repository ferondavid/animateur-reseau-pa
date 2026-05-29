"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { NiveauRisque } from "@/lib/risque";

type MagasinPin = {
  id: string;
  nom: string;
  ville: string;
  enseigne?: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  risque?: {
    niveau: NiveauRisque;
    raisons: string[];
    joursSansVisite: number | null;
  };
};

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

function pinIcon(niveau: NiveauRisque): L.DivIcon {
  const color = COULEURS[niveau];
  const pulse =
    niveau === "eleve"
      ? `<span style="position:absolute;top:14px;left:14px;width:28px;height:28px;border-radius:50%;background:${color};transform:translate(-50%,-50%);animation:pin-pulse 1.5s ease-out infinite;pointer-events:none;"></span>`
      : "";
  const html = `
    <div style="position:relative;width:28px;height:42px;">
      ${pulse}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.35));position:relative;z-index:1;">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    </div>`;
  return L.divIcon({
    html,
    className: "pin-magasin",
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -38],
  });
}

const ICONES: Record<NiveauRisque, L.DivIcon> = {
  ok: pinIcon("ok"),
  modere: pinIcon("modere"),
  eleve: pinIcon("eleve"),
};

export default function Carte({ magasins }: { magasins: MagasinPin[] }) {
  // Compte par niveau pour la légende
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
          return (
            <Marker
              key={m.id}
              position={[m.latitude, m.longitude]}
              icon={ICONES[niveau]}
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
                    className="inline-block pt-1 text-blue-600 hover:underline text-sm"
                  >
                    Voir la fiche →
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-600">
        <span className="font-medium text-slate-500 uppercase tracking-wide">
          Légende :
        </span>
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
    </div>
  );
}
