"use client";

import { useState, useTransition } from "react";
import { updateAdresseDepart } from "./actions";

async function geocoder(texte: string): Promise<{ lat: number; lng: number } | null> {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texte)}&format=json&limit=1&accept-language=fr`,
      { headers: { "User-Agent": "AnimationReseauPA/1.0" } }
    );
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export default function AdresseDepart({
  adresseInitiale,
  latInitiale,
  lngInitiale,
}: {
  adresseInitiale: string;
  latInitiale: string;
  lngInitiale: string;
}) {
  const [adresse, setAdresse] = useState(adresseInitiale);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latInitiale && lngInitiale
      ? { lat: parseFloat(latInitiale), lng: parseFloat(lngInitiale) }
      : null
  );
  const [geocoding, setGeocoding] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [isPending, start] = useTransition();

  const handleGeocode = async () => {
    if (!adresse.trim()) return;
    setGeocoding(true);
    setErreur(null);
    const c = await geocoder(adresse);
    setGeocoding(false);
    if (!c) { setErreur("Adresse introuvable — essaie d'être plus précis"); return; }
    setCoords(c);
  };

  const handleSave = () => {
    if (!coords) return;
    start(async () => {
      await updateAdresseDepart(adresse, String(coords.lat), String(coords.lng));
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
        <input
          type="text"
          value={adresse}
          onChange={(e) => { setAdresse(e.target.value); setCoords(null); setErreur(null); setSaveOk(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
          placeholder="123 rue de la Paix, 75002 Paris"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGeocode}
          disabled={geocoding || !adresse.trim()}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {geocoding ? "Recherche…" : "📍 Géocoder"}
        </button>
        {coords && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="pa-btn-primary px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        )}
        {coords && !saveOk && (
          <span className="text-sm text-emerald-600 font-medium">
            ✓ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        )}
        {saveOk && (
          <span className="text-sm text-emerald-600 font-medium">✓ Adresse enregistrée</span>
        )}
        {erreur && <span className="text-sm text-red-600">{erreur}</span>}
      </div>

      {!coords && latInitiale && lngInitiale && (
        <p className="text-xs text-slate-500">
          Adresse actuelle : {adresseInitiale || "non renseignée"} ({parseFloat(latInitiale).toFixed(4)}, {parseFloat(lngInitiale).toFixed(4)})
        </p>
      )}

      <p className="text-xs text-slate-500">
        Cette adresse sera utilisée pour calculer l&apos;heure de départ recommandée et la charge batterie nécessaire pour tes prochains RDV.
      </p>
    </div>
  );
}
