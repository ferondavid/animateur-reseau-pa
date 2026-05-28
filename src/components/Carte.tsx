"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icônes Leaflet par défaut (pb classique avec Webpack/Next)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Magasin = {
  id: string;
  nom: string;
  ville: string;
  region: string | null;
  latitude: number;
  longitude: number;
};

export default function Carte({ magasins }: { magasins: Magasin[] }) {
  return (
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
      {magasins.map((m) => (
        <Marker
          key={m.id}
          position={[m.latitude, m.longitude]}
          icon={icon}
        >
          <Popup>
            <strong>{m.nom}</strong>
            <br />
            {m.ville}
            <br />
            <span className="text-slate-500">{m.region}</span>
            <br />
            <a
              href={`/magasins/${m.id}`}
              className="text-blue-600 hover:underline text-sm"
            >
              Voir la fiche →
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}