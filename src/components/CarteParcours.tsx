"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import type { Point, EtapeParcours } from "@/lib/itineraire";

function iconDepart(): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:34px;height:34px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:13px;line-height:1;">D</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

function iconMagasin(num: number): L.DivIcon {
  return L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#1e40af;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11px;line-height:1;">${num}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function iconRecharge(estWarning: boolean): L.DivIcon {
  const bg = estWarning ? "#dc2626" : "#7c3aed";
  const symbol = estWarning ? "⚠️" : "⚡";
  return L.divIcon({
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${bg};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">${symbol}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 12); return; }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

type Props = {
  depart: Point | null;
  etapes: EtapeParcours[];
  retour: boolean;
};

export default function CarteParcours({ depart, etapes, retour }: Props) {
  const allPoints: [number, number][] = [];
  if (depart) allPoints.push([depart.lat, depart.lng]);
  for (const e of etapes) allPoints.push([e.lat, e.lng]);

  const linePoints: [number, number][] = allPoints.slice();

  const retourLine: [number, number][] =
    retour && depart && etapes.length > 0
      ? [
          [etapes[etapes.length - 1].lat, etapes[etapes.length - 1].lng],
          [depart.lat, depart.lng],
        ]
      : [];

  const center: [number, number] =
    depart
      ? [depart.lat, depart.lng]
      : etapes.length > 0
        ? [etapes[0].lat, etapes[0].lng]
        : [46.5, 2.5];

  let magasinCount = 0;

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: "420px", width: "100%", borderRadius: "16px" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={allPoints} />

      {depart && (
        <Marker position={[depart.lat, depart.lng]} icon={iconDepart()}>
          <Popup><strong>📍 Point de départ</strong></Popup>
        </Marker>
      )}

      {etapes.map((e) => {
        if (e.type === "magasin") {
          magasinCount++;
          const num = magasinCount;
          const autPct =
            e.autonomieRestanteAvant !== undefined
              ? " · 🔋 " + Math.round(e.autonomieRestanteAvant) + " km restants"
              : "";
          return (
            <Marker key={e.id} position={[e.lat, e.lng]} icon={iconMagasin(num)}>
              <Popup>
                <div style={{ minWidth: "180px" }}>
                  <strong>Étape {num} — {e.label}</strong>
                  {e.sousLabel && <div style={{ fontSize: "12px", color: "#64748b" }}>{e.sousLabel}</div>}
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                    {e.distanceDepuisPrec.toFixed(1)} km{autPct}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }

        if (e.type === "recharge") {
          const estWarning = e.label.startsWith("⚠️");
          const info = [
            e.sousLabel,
            e.tempsArretMin ? `Arrêt : ${e.tempsArretMin} min` : undefined,
            e.autonomieRestanteApres !== undefined
              ? `Repart à ${Math.round(e.autonomieRestanteApres)} km`
              : undefined,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <Marker key={e.id} position={[e.lat, e.lng]} icon={iconRecharge(estWarning)}>
              <Popup>
                <div style={{ minWidth: "180px" }}>
                  <strong>{e.label}</strong>
                  {info && <div style={{ fontSize: "12px", color: "#64748b" }}>{info}</div>}
                </div>
              </Popup>
            </Marker>
          );
        }

        return null;
      })}

      {linePoints.length > 1 && (
        <Polyline positions={linePoints} color="#1e40af" weight={4} opacity={0.8} />
      )}

      {retourLine.length === 2 && (
        <Polyline
          positions={retourLine}
          color="#1e40af"
          weight={3}
          opacity={0.5}
          dashArray="8 6"
        />
      )}
    </MapContainer>
  );
}
