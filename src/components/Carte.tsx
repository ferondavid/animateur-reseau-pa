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
  contact_telephone?: string | null;
  risque?: {
    niveau: NiveauRisque;
    raisons: string[];
    joursSansVisite: number | null;
  };
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
