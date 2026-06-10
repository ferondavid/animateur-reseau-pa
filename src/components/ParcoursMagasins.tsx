"use client";

import { useState, useEffect, useTransition } from "react";
import type { Point, EtapeParcours, Parcours } from "@/lib/itineraire";
import { calculerParcoursDeBase, construireParcours, haversineKm } from "@/lib/itineraire";
import CarteParcoursWrapper from "./CarteParcoursWrapper";
import {
  creerVisitesPlanifieesParcours,
  calculerArretsRecharge,
} from "@/app/animateur/parcours/actions";

type Magasin = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  niveau: string | null;
};

export type ConfigVE = {
  active: boolean;
  autonomieKm: number;
  seuilPct: number;
  ciblePct: number;
  chargeDepartPct: number;
  tempsRechargeMin: number;
};

const NIVEAU_FILTRE = [
  { key: "tous",         label: "Tous" },
  { key: "strategique", label: "⭐ Stratégique" },
  { key: "standard",    label: "Standard" },
  { key: "observation", label: "🔍 Observation" },
] as const;

const NIVEAU_BADGE: Record<string, { label: string; cls: string }> = {
  strategique: { label: "⭐ Stratégique", cls: "bg-amber-100 text-amber-800" },
  standard:    { label: "Standard",       cls: "bg-slate-100 text-slate-600" },
  observation: { label: "🔍 Observation", cls: "bg-blue-100 text-blue-700" },
};

function formatDist(km: number): string {
  if (km >= 1000) return Math.round(km).toLocaleString("fr-FR") + " km";
  return Math.round(km) + " km";
}

function formatDuree(min: number): string {
  if (min < 60) return `${min} min`;
  if (min < 1440) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
  }
  const j = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  return h === 0 ? `${j}j` : `${j}j ${h}h`;
}

function batterieIcon(km: number, maxKm: number): { emoji: string; cls: string } {
  const pct = (km / maxKm) * 100;
  if (pct > 60) return { emoji: "🔋", cls: "text-emerald-600" };
  if (pct > 30) return { emoji: "🔋", cls: "text-amber-500" };
  return { emoji: "🪫", cls: "text-red-500" };
}

function genGoogleMapsUrl(
  depart: Point,
  etapes: EtapeParcours[],
  retour: boolean
): string {
  const magasins = etapes.filter((e) => e.type === "magasin");
  const origin = `${depart.lat},${depart.lng}`;
  let destination: string;
  let waypts: EtapeParcours[];

  if (retour) {
    destination = origin;
    waypts = magasins;
  } else {
    const last = magasins[magasins.length - 1];
    destination = `${last.lat},${last.lng}`;
    waypts = magasins.slice(0, -1);
  }

  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  if (waypts.length > 0) {
    const wp = waypts.map((e) => `${e.lat},${e.lng}`).join("|");
    url += `&waypoints=${encodeURIComponent(wp)}`;
  }
  return url;
}

async function geocoderAdresse(texte: string): Promise<Point | null> {
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

const LS_DEPART = "parcours_depart";
const LS_SELECTION = "parcours_selection";

export default function ParcoursMagasins({
  magasins,
  configVE,
  openChargeMapOk,
  prefillMagasinId,
}: {
  magasins: Magasin[];
  configVE: ConfigVE;
  openChargeMapOk: boolean;
  prefillMagasinId?: string;
}) {
  const [selectionIds, setSelectionIds] = useState<Set<string>>(new Set());
  const [departTexte, setDepartTexte] = useState("");
  const [departCoords, setDepartCoords] = useState<Point | null>(null);
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [retourDepart, setRetourDepart] = useState(false);
  const [filtreTexte, setFiltreTexte] = useState("");
  const [filtreNiveau, setFiltreNiveau] = useState("tous");
  const [chargeDepart, setChargeDepart] = useState(configVE.chargeDepartPct);
  const [geocoding, setGeocoding] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [geocodeErr, setGeocodeErr] = useState<string | null>(null);
  const [modalPlanif, setModalPlanif] = useState(false);
  const [datePlanif, setDatePlanif] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [objectifPlanif, setObjectifPlanif] = useState("Tournée animateur");
  const [planifResult, setPlanifResult] = useState<{ ok: boolean; nb?: number; error?: string } | null>(null);
  const [isPlanif, startPlanif] = useTransition();

  useEffect(() => {
    try {
      const dep = localStorage.getItem(LS_DEPART);
      if (dep) setDepartTexte(dep);
      const sel = localStorage.getItem(LS_SELECTION);
      if (sel) setSelectionIds(new Set(JSON.parse(sel) as string[]));
    } catch { /* ignore */ }
    if (prefillMagasinId) {
      setSelectionIds((prev) => {
        const next = new Set(prev);
        next.add(prefillMagasinId);
        return next;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSel = (id: string) => {
    setSelectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(LS_SELECTION, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
    setParcours(null);
  };

  const selectionnerTout = () => {
    setSelectionIds((prev) => {
      const ids = magasinsFiltres.map((m) => m.id);
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      try { localStorage.setItem(LS_SELECTION, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
    setParcours(null);
  };

  const geocoder = async () => {
    if (!departTexte.trim()) return;
    setGeocoding(true); setGeocodeErr(null);
    const coords = await geocoderAdresse(departTexte);
    setGeocoding(false);
    if (!coords) { setGeocodeErr("Adresse introuvable — essaie d'être plus précis"); return; }
    setDepartCoords(coords); setParcours(null);
  };

  const utiliserPosition = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setDepartCoords(coords);
      setDepartTexte(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
      setGeocodeErr(null); setParcours(null);
    });
  };

  const calculer = async () => {
    if (!departCoords || selectionIds.size === 0) return;
    setCalculating(true);
    try {
      const mags = magasins
        .filter((m) => selectionIds.has(m.id))
        .map((m) => ({ id: m.id, nom: m.nom, enseigne: m.enseigne, ville: m.ville, lat: m.latitude, lng: m.longitude }));

      let etapes = calculerParcoursDeBase(departCoords, mags);

      if (configVE.active) {
        etapes = await calculerArretsRecharge(departCoords, etapes, {
          ...configVE,
          chargeDepartPct: chargeDepart,
        });
      }

      setParcours(construireParcours(etapes));
    } finally {
      setCalculating(false);
    }
  };

  const magasinsFiltres = magasins.filter((m) => {
    if (filtreNiveau !== "tous" && (m.niveau ?? "standard") !== filtreNiveau) return false;
    if (!filtreTexte.trim()) return true;
    const hay = `${m.enseigne ?? ""} ${m.nom} ${m.ville ?? ""}`.toLowerCase();
    return hay.includes(filtreTexte.toLowerCase());
  });

  const nbSel = selectionIds.size;
  const peutCalculer = !!departCoords && nbSel > 0;

  // Calcul retour pour affichage
  const retourKm =
    retourDepart && parcours && departCoords && parcours.etapes.length > 0
      ? haversineKm(
          { lat: parcours.etapes[parcours.etapes.length - 1].lat, lng: parcours.etapes[parcours.etapes.length - 1].lng },
          departCoords
        )
      : 0;

  const distAffichee = parcours ? formatDist(parcours.distanceTotale + retourKm) : null;
  const dureeRouteAffichee = parcours
    ? formatDuree(parcours.dureeRouteMinutes + Math.round((retourKm / 60) * 60))
    : null;

  const nbBornes = parcours?.etapes.filter((e) => e.type === "recharge" && !e.label.startsWith("⚠️")).length ?? 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[390px_1fr] gap-6 items-start">

      {/* ─── COL GAUCHE ──────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Départ */}
        <div className="pa-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">📍 Point de départ</h2>
          <input
            type="text"
            value={departTexte}
            onChange={(e) => { setDepartTexte(e.target.value); setDepartCoords(null); setParcours(null); setGeocodeErr(null); }}
            onKeyDown={(e) => e.key === "Enter" && geocoder()}
            placeholder="12 rue de la République, 69002 Lyon"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <div className="flex gap-2 flex-wrap">
            <button onClick={geocoder} disabled={geocoding || !departTexte.trim()}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors">
              {geocoding ? "Recherche…" : "📍 Géocoder"}
            </button>
            <button onClick={utiliserPosition}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
              📍 Ma position
            </button>
            {departTexte && (
              <button onClick={() => { try { localStorage.setItem(LS_DEPART, departTexte); } catch { /* */ } }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 text-xs hover:bg-slate-50 transition-colors">
                💾 Mémoriser
              </button>
            )}
          </div>
          {geocodeErr && <p className="text-xs text-red-600">{geocodeErr}</p>}
          {departCoords && !geocodeErr && (
            <p className="text-xs text-emerald-600 font-medium">
              ✓ Position trouvée ({departCoords.lat.toFixed(4)}, {departCoords.lng.toFixed(4)})
            </p>
          )}
        </div>

        {/* Banner clé manquante */}
        {configVE.active && !openChargeMapOk && (
          <div className="bg-orange-50 border border-orange-300 rounded-2xl p-4">
            <p className="text-sm font-semibold text-orange-800">⚠️ Clé OpenChargeMap manquante</p>
            <p className="text-xs text-orange-700 mt-1">
              Les bornes de recharge ne pourront pas être trouvées automatiquement.
              Ajoutez <code className="font-mono bg-orange-100 px-1 rounded">OPENCHARGEMAP_API_KEY</code> dans les variables d&apos;environnement Vercel.
            </p>
          </div>
        )}

        {/* Banner VE */}
        {configVE.active && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-800">⚡ Véhicule électrique</p>
              <a href="/animateur/parametres" className="text-xs text-amber-600 hover:underline">
                Modifier →
              </a>
            </div>
            <p className="text-xs text-amber-700">
              Autonomie {configVE.autonomieKm} km · Seuil {configVE.seuilPct}% · Cible {configVE.ciblePct}%
            </p>
            <div>
              <label className="block text-xs font-medium text-amber-700 mb-1">
                Charge au départ : <strong>{chargeDepart}%</strong> ({Math.round(configVE.autonomieKm * chargeDepart / 100)} km)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={chargeDepart}
                onChange={(e) => { setChargeDepart(Number(e.target.value)); setParcours(null); }}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        )}

        {/* Filtres + liste */}
        <div className="pa-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Magasins à visiter</h2>
            <span className="text-xs text-slate-500">
              {nbSel > 0
                ? <span className="text-blue-600 font-semibold">{nbSel} sélectionné{nbSel > 1 ? "s" : ""}</span>
                : "0 sélectionné"}
            </span>
          </div>

          <input
            type="text"
            value={filtreTexte}
            onChange={(e) => setFiltreTexte(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />

          <div className="flex gap-1.5 flex-wrap">
            {NIVEAU_FILTRE.map(({ key, label }) => (
              <button key={key} onClick={() => setFiltreNiveau(key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filtreNiveau === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {label}
              </button>
            ))}
          </div>

          <button onClick={selectionnerTout} className="text-xs text-blue-600 hover:underline">
            {magasinsFiltres.length > 0 && magasinsFiltres.every((m) => selectionIds.has(m.id))
              ? "Tout désélectionner" : "Tout sélectionner"}
          </button>

          <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
            {magasinsFiltres.length === 0 && (
              <p className="text-sm text-slate-400 py-2 text-center">Aucun magasin géolocalisé</p>
            )}
            {magasinsFiltres.map((m) => {
              const sel = selectionIds.has(m.id);
              const niv = m.niveau ?? "standard";
              const badge = NIVEAU_BADGE[niv];
              return (
                <div key={m.id} onClick={() => toggleSel(m.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    sel ? "bg-blue-50 border-l-2 border-blue-500" : "hover:bg-slate-50 border-l-2 border-transparent"
                  }`}>
                  <input type="checkbox" checked={sel} onChange={() => toggleSel(m.id)}
                    onClick={(e) => e.stopPropagation()} className="accent-blue-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
                    </p>
                    {m.ville && <p className="text-xs text-slate-500 truncate">{m.ville}</p>}
                  </div>
                  {badge && niv !== "standard" && (
                    <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="pa-card p-4 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={retourDepart}
              onChange={(e) => { setRetourDepart(e.target.checked); setParcours(null); }}
              className="accent-slate-900" />
            <span className="text-sm text-slate-700">Retour au point de départ</span>
          </label>

          <button onClick={calculer} disabled={!peutCalculer || calculating}
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {calculating
              ? configVE.active ? "⚡ Calcul + recherche bornes…" : "Calcul en cours…"
              : "🧭 Calculer l'itinéraire"}
          </button>

          {!departCoords && <p className="text-xs text-slate-400 text-center">Géocode un point de départ d'abord</p>}
          {departCoords && nbSel === 0 && <p className="text-xs text-slate-400 text-center">Sélectionne au moins un magasin</p>}
        </div>
      </div>

      {/* ─── COL DROITE ──────────────────────────────────────────────── */}
      <div className="space-y-4">

        <CarteParcoursWrapper
          depart={departCoords}
          etapes={parcours?.etapes ?? []}
          retour={retourDepart}
        />

        {parcours && (
          <div className="pa-card p-4 space-y-4">

            {/* Stats */}
            <div className={`grid gap-4 ${configVE.active && nbBornes > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{distAffichee}</p>
                <p className="text-xs text-slate-500 mt-0.5">🛣️ Distance</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-2xl font-bold text-slate-900">{dureeRouteAffichee}</p>
                <p className="text-xs text-slate-500 mt-0.5">⏱️ Temps route</p>
              </div>
              {configVE.active && nbBornes > 0 && (
                <div className="text-center border-r border-slate-100">
                  <p className="text-2xl font-bold text-amber-600">
                    {formatDuree(parcours.dureeArretsMinutes)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">⚡ Arrêts</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {parcours.etapes.filter((e) => e.type === "magasin").length}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">📍 Magasins</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Estimation à vol d'oiseau · 60 km/h{retourDepart ? " · retour inclus" : ""}
              {configVE.active && nbBornes > 0 ? ` · ${nbBornes} borne${nbBornes > 1 ? "s" : ""} de recharge` : ""}
            </p>

            {/* Ordre des étapes */}
            <div className="space-y-2">
              {(() => {
                let magIdx = 0;
                return parcours.etapes.map((e, i) => {
                  if (e.type === "magasin") {
                    magIdx++;
                    const idx = magIdx;
                    const batIcon =
                      configVE.active && e.autonomieRestanteAvant !== undefined
                        ? batterieIcon(e.autonomieRestanteAvant, configVE.autonomieKm)
                        : null;
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx}
                        </span>
                        <span className="text-slate-700 truncate flex-1">
                          {e.label}{e.sousLabel ? ` · ${e.sousLabel}` : ""}
                        </span>
                        {batIcon && (
                          <span className={`text-xs shrink-0 ${batIcon.cls}`}>
                            {batIcon.emoji} {Math.round(e.autonomieRestanteAvant!)} km
                          </span>
                        )}
                        <span className="text-xs text-slate-400 shrink-0">
                          {e.distanceDepuisPrec.toFixed(1)} km
                        </span>
                      </div>
                    );
                  }

                  if (e.type === "recharge") {
                    const estWarning = e.label.startsWith("⚠️");
                    return (
                      <div key={i} className={`flex items-center gap-2 text-sm pl-1 ${estWarning ? "text-red-600" : "text-violet-700"}`}>
                        <span className="text-base shrink-0">{estWarning ? "⚠️" : "⚡"}</span>
                        <span className="truncate flex-1 text-xs">
                          {e.label}
                          {e.tempsArretMin ? ` · ${e.tempsArretMin} min` : ""}
                          {e.sousLabel ? ` · ${e.sousLabel}` : ""}
                        </span>
                        <span className="text-xs text-slate-400 shrink-0">
                          {e.distanceDepuisPrec.toFixed(1)} km
                        </span>
                      </div>
                    );
                  }

                  return null;
                });
              })()}
              {retourDepart && departCoords && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">D</span>
                  <span className="text-slate-500 italic">Retour au départ</span>
                  <span className="text-xs text-slate-400 shrink-0">{formatDist(retourKm)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              {departCoords && (
                <a href={genGoogleMapsUrl(departCoords, parcours.etapes, retourDepart)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
                  🗺️ Ouvrir dans Google Maps
                </a>
              )}
              <button onClick={() => { setModalPlanif(true); setPlanifResult(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                📅 Planifier les visites
              </button>
              <button onClick={() => setParcours(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                🔄 Recalculer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALE PLANIFIER ──────────────────────────────────────── */}
      {modalPlanif && parcours && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">📅 Planifier les visites</h3>
              <button onClick={() => setModalPlanif(false)} className="text-slate-400 hover:text-slate-700 text-xl">×</button>
            </div>
            <p className="text-sm text-slate-500">
              {parcours.etapes.filter((e) => e.type === "magasin").length} visite{parcours.etapes.filter((e) => e.type === "magasin").length > 1 ? "s" : ""} créées, 1 par jour.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Premier jour</label>
                <input type="date" value={datePlanif} onChange={(e) => setDatePlanif(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Objectif</label>
                <input type="text" value={objectifPlanif} onChange={(e) => setObjectifPlanif(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            {planifResult && (
              planifResult.ok
                ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700">
                    ✓ {planifResult.nb} visite{(planifResult.nb ?? 0) > 1 ? "s" : ""} créée{(planifResult.nb ?? 0) > 1 ? "s" : ""}
                  </div>
                : <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">✗ {planifResult.error}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalPlanif(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
                Annuler
              </button>
              <button
                onClick={() =>
                  startPlanif(async () => {
                    const ids = parcours.etapes.filter((e) => e.type === "magasin").map((e) => e.id);
                    const r = await creerVisitesPlanifieesParcours(ids, datePlanif, objectifPlanif);
                    setPlanifResult(r);
                    if (r.ok) setTimeout(() => setModalPlanif(false), 1800);
                  })
                }
                disabled={isPlanif || !datePlanif}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {isPlanif ? "Création…" : "Créer les visites"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
