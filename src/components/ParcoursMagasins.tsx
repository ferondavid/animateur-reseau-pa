"use client";

import { useState, useEffect, useTransition } from "react";
import type { Point, EtapeParcours, Parcours } from "@/lib/itineraire";
import { calculerParcoursDeBase, construireParcours, haversineKm } from "@/lib/itineraire";
import CarteParcoursWrapper from "./CarteParcoursWrapper";
import {
  creerVisitesPlanifieesParcours,
  calculerArretsRecharge,
} from "@/app/animateur/parcours/actions";
import {
  MapPin, Map as MapIcon, CalendarPlus, RefreshCw, Zap,
  Save, X,
} from "lucide-react";
import { titreMagasin } from "@/lib/magasin";

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
  { key: "strategique", label: "Stratégique" },
  { key: "standard",    label: "Standard" },
  { key: "observation", label: "Observation" },
] as const;

const NIVEAU_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  strategique: { label: "Stratégique", bg: "#FBF1D8", fg: "#B07D14" },
  standard:    { label: "Standard",    bg: "#ECEAF3", fg: "#6F6982" },
  observation: { label: "Observation", bg: "#E4F0FB", fg: "#2D6FD0" },
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

function batterieIcon(km: number, maxKm: number): { emoji: string; color: string } {
  const pct = (km / maxKm) * 100;
  if (pct > 60) return { emoji: "🔋", color: "#0F8C68" };
  if (pct > 30) return { emoji: "🔋", color: "#B07D14" };
  return { emoji: "🪫", color: "#C0476E" };
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
  const [filtreRegion, setFiltreRegion] = useState("toutes");
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

  // Régions disponibles (pour le filtre par zone)
  const regions = [...new Set(magasins.map((m) => m.region).filter((r): r is string => !!r))].sort((a, b) =>
    a.localeCompare(b, "fr")
  );

  const magasinsFiltres = magasins.filter((m) => {
    if (filtreNiveau !== "tous" && (m.niveau ?? "standard") !== filtreNiveau) return false;
    if (filtreRegion !== "toutes" && (m.region ?? "") !== filtreRegion) return false;
    if (!filtreTexte.trim()) return true;
    const hay = `${m.enseigne ?? ""} ${m.nom} ${m.ville ?? ""} ${m.region ?? ""}`.toLowerCase();
    return hay.includes(filtreTexte.toLowerCase());
  });

  // Regroupement par région (zones) pour l'affichage de la liste
  const groupesParRegion = (() => {
    const map = new Map<string, Magasin[]>();
    for (const m of magasinsFiltres) {
      const r = m.region ?? "Sans région";
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(m);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === "Sans région") return 1;
      if (b[0] === "Sans région") return -1;
      return a[0].localeCompare(b[0], "fr");
    });
  })();

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
    <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-5 items-start" style={{ paddingTop: "12px" }}>

      {/* ─── COL GAUCHE ──────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Départ */}
        <div className="pa-card p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "var(--pa-ink)" }}><MapPin size={14} style={{ color: "#7C6BE8" }} />Point de départ</h2>
          <input
            type="text"
            value={departTexte}
            onChange={(e) => { setDepartTexte(e.target.value); setDepartCoords(null); setParcours(null); setGeocodeErr(null); }}
            onKeyDown={(e) => e.key === "Enter" && geocoder()}
            placeholder="12 rue de la République, 69002 Lyon"
            className="pa-input"
          />
          <div className="flex gap-2 flex-wrap">
            <button onClick={geocoder} disabled={geocoding || !departTexte.trim()}
              className="pa-btn-primary px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
              {geocoding ? "Recherche…" : <><MapPin size={11} /> Géocoder</>}
            </button>
            <button onClick={utiliserPosition}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1"
              style={{ borderColor: "rgba(124,107,232,0.25)", color: "var(--pa-muted)", background: "#fff" }}>
              <MapPin size={11} /> Ma position
            </button>
            {departTexte && (
              <button onClick={() => { try { localStorage.setItem(LS_DEPART, departTexte); } catch { /* */ } }}
                className="px-3 py-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1"
                style={{ borderColor: "rgba(124,107,232,0.25)", color: "var(--pa-muted)", background: "#fff" }}>
                <Save size={11} /> Mémoriser
              </button>
            )}
          </div>
          {geocodeErr && <p className="text-xs font-medium" style={{ color: "#C0476E" }}>{geocodeErr}</p>}
          {departCoords && !geocodeErr && (
            <p className="text-xs font-medium" style={{ color: "#0F8C68" }}>
              ✓ Position trouvée ({departCoords.lat.toFixed(4)}, {departCoords.lng.toFixed(4)})
            </p>
          )}
        </div>

        {/* Banner clé manquante */}
        {configVE.active && !openChargeMapOk && (
          <div className="rounded-2xl p-4" style={{ background: "#FBF1D8", border: "1px solid rgba(176,125,20,.25)" }}>
            <p className="text-sm font-semibold" style={{ color: "#B07D14" }}>⚠️ Clé OpenChargeMap manquante</p>
            <p className="text-xs mt-1" style={{ color: "#9A7416" }}>
              Les bornes de recharge ne pourront pas être trouvées automatiquement.
              Ajoutez <code className="font-mono px-1 rounded" style={{ background: "rgba(176,125,20,.15)" }}>OPENCHARGEMAP_API_KEY</code> dans les variables d&apos;environnement Vercel.
            </p>
          </div>
        )}

        {/* Banner VE */}
        {configVE.active && (
          <div className="rounded-2xl p-4 space-y-3" style={{ background: "#FBF7EA", border: "1px solid rgba(176,125,20,.22)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "#B07D14" }}><Zap size={13} />Véhicule électrique</p>
              <a href="/animateur/parametres" className="text-xs hover:underline font-semibold" style={{ color: "#B07D14" }}>
                Modifier →
              </a>
            </div>
            <p className="text-xs" style={{ color: "#9A7416" }}>
              Autonomie {configVE.autonomieKm} km · Seuil {configVE.seuilPct}% · Cible {configVE.ciblePct}%
            </p>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#9A7416" }}>
                Charge au départ : <strong>{chargeDepart}%</strong> ({Math.round(configVE.autonomieKm * chargeDepart / 100)} km)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={chargeDepart}
                onChange={(e) => { setChargeDepart(Number(e.target.value)); setParcours(null); }}
                className="w-full accent-[#E8B43A]"
              />
            </div>
          </div>
        )}

        {/* Filtres + liste */}
        <div className="pa-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: "var(--pa-ink)" }}>Magasins à visiter</h2>
            <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
              {nbSel > 0
                ? <span className="font-bold" style={{ color: "#6B4FD8" }}>{nbSel} sélectionné{nbSel > 1 ? "s" : ""}</span>
                : "0 sélectionné"}
            </span>
          </div>

          <input
            type="text"
            value={filtreTexte}
            onChange={(e) => setFiltreTexte(e.target.value)}
            placeholder="Rechercher…"
            className="pa-input"
          />

          {/* Filtre par zone / région */}
          {regions.length > 0 && (
            <select
              value={filtreRegion}
              onChange={(e) => setFiltreRegion(e.target.value)}
              className="pa-input"
            >
              <option value="toutes">Toutes les régions ({magasins.filter((m) => m.region).length})</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r} ({magasins.filter((m) => m.region === r).length})
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-1.5 flex-wrap">
            {NIVEAU_FILTRE.map(({ key, label }) => {
              const actif = filtreNiveau === key;
              return (
                <button key={key} onClick={() => setFiltreNiveau(key)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                  style={actif
                    ? { background: "#6B4FD8", color: "#fff", boxShadow: "0 2px 8px -3px rgba(107,79,216,.6)" }
                    : { background: "#ECEAF3", color: "#6F6982" }}>
                  {label}
                </button>
              );
            })}
          </div>

          <button onClick={selectionnerTout} className="text-xs font-semibold hover:underline" style={{ color: "#6B4FD8" }}>
            {magasinsFiltres.length > 0 && magasinsFiltres.every((m) => selectionIds.has(m.id))
              ? "Tout désélectionner" : "Tout sélectionner"}
          </button>

          <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
            {magasinsFiltres.length === 0 && (
              <p className="text-sm py-2 text-center" style={{ color: "var(--pa-muted)" }}>Aucun magasin sur ce filtre</p>
            )}
            {groupesParRegion.map(([region, mags]) => {
              const idsZone = mags.map((m) => m.id);
              const tousSel = idsZone.every((id) => selectionIds.has(id));
              return (
                <div key={region} className="space-y-1">
                  {/* En-tête de zone */}
                  <div className="flex items-center justify-between px-1 sticky top-0 z-10" style={{ background: "linear-gradient(rgba(255,255,255,0.92),rgba(255,255,255,0.92))", backdropFilter: "blur(6px)" }}>
                    <span className="text-[11px] font-bold uppercase tracking-wide inline-flex items-center gap-1" style={{ color: "var(--pa-muted)" }}>
                      <MapPin size={11} style={{ color: "#7C6BE8" }} /> {region} <span style={{ color: "#C8C4D6" }}>({mags.length})</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectionIds((prev) => {
                          const next = new Set(prev);
                          if (tousSel) idsZone.forEach((id) => next.delete(id));
                          else idsZone.forEach((id) => next.add(id));
                          try { localStorage.setItem(LS_SELECTION, JSON.stringify([...next])); } catch { /* */ }
                          return next;
                        });
                        setParcours(null);
                      }}
                      className="text-[11px] font-semibold hover:underline shrink-0"
                      style={{ color: "#6B4FD8" }}
                    >
                      {tousSel ? "Retirer la zone" : "Toute la zone"}
                    </button>
                  </div>

                  {mags.map((m) => {
                    const sel = selectionIds.has(m.id);
                    const niv = m.niveau ?? "standard";
                    const badge = NIVEAU_BADGE[niv];
                    return (
                      <div key={m.id} onClick={() => toggleSel(m.id)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                        style={sel
                          ? { background: "#EDEBFB", borderLeft: "3px solid #7C6BE8" }
                          : { borderLeft: "3px solid transparent" }}>
                        <input type="checkbox" checked={sel} onChange={() => toggleSel(m.id)}
                          onClick={(e) => e.stopPropagation()} className="accent-[#7C6BE8] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                            {titreMagasin(m.enseigne, m.nom)}
                          </p>
                          {m.ville && <p className="text-xs truncate" style={{ color: "var(--pa-muted)" }}>{m.ville}</p>}
                        </div>
                        {badge && niv !== "standard" && (
                          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.fg }}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
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
              className="accent-[#7C6BE8]" />
            <span className="text-sm" style={{ color: "var(--pa-ink)" }}>Retour au point de départ</span>
          </label>

          <button onClick={calculer} disabled={!peutCalculer || calculating}
            className="pa-btn-primary w-full py-3 rounded-xl text-sm font-semibold">
            {calculating
              ? configVE.active ? "Calcul + bornes…" : "Calcul en cours…"
              : "Calculer l'itinéraire"}
          </button>

          {!departCoords && <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>Géocode un point de départ d&apos;abord</p>}
          {departCoords && nbSel === 0 && <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>Sélectionne au moins un magasin</p>}
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
                <p className="text-2xl font-bold" style={{ color: "var(--pa-ink)" }}>{distAffichee}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>Distance</p>
              </div>
              <div className="text-center" style={{ borderLeft: "1px solid var(--pa-line)", borderRight: "1px solid var(--pa-line)" }}>
                <p className="text-2xl font-bold" style={{ color: "var(--pa-ink)" }}>{dureeRouteAffichee}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>Temps route</p>
              </div>
              {configVE.active && nbBornes > 0 && (
                <div className="text-center" style={{ borderRight: "1px solid var(--pa-line)" }}>
                  <p className="text-2xl font-bold" style={{ color: "#B07D14" }}>
                    {formatDuree(parcours.dureeArretsMinutes)}
                  </p>
                  <p className="text-xs mt-0.5 flex items-center justify-center gap-0.5" style={{ color: "var(--pa-muted)" }}><Zap size={10} />Arrêts</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--pa-ink)" }}>
                  {parcours.etapes.filter((e) => e.type === "magasin").length}
                </p>
                <p className="text-xs mt-0.5 flex items-center justify-center gap-0.5" style={{ color: "var(--pa-muted)" }}><MapPin size={10} />Magasins</p>
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>
              Estimation à vol d&apos;oiseau · 60 km/h{retourDepart ? " · retour inclus" : ""}
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
                        <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#3D7BE8" }}>
                          {idx}
                        </span>
                        <span className="truncate flex-1" style={{ color: "var(--pa-ink)" }}>
                          {e.label}{e.sousLabel ? ` · ${e.sousLabel}` : ""}
                        </span>
                        {batIcon && (
                          <span className="text-xs shrink-0 font-semibold" style={{ color: batIcon.color }}>
                            {batIcon.emoji} {Math.round(e.autonomieRestanteAvant!)} km
                          </span>
                        )}
                        <span className="text-xs shrink-0" style={{ color: "var(--pa-muted)" }}>
                          {e.distanceDepuisPrec.toFixed(1)} km
                        </span>
                      </div>
                    );
                  }

                  if (e.type === "recharge") {
                    const estWarning = e.label.startsWith("⚠️");
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm pl-1" style={{ color: estWarning ? "#C0476E" : "#6B4FD8" }}>
                        <span className="text-base shrink-0">{estWarning ? "⚠️" : "⚡"}</span>
                        <span className="truncate flex-1 text-xs">
                          {e.label}
                          {e.tempsArretMin ? ` · ${e.tempsArretMin} min` : ""}
                          {e.sousLabel ? ` · ${e.sousLabel}` : ""}
                        </span>
                        <span className="text-xs shrink-0" style={{ color: "var(--pa-muted)" }}>
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
                  <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "#1FA98A" }}>D</span>
                  <span className="italic" style={{ color: "var(--pa-muted)" }}>Retour au départ</span>
                  <span className="text-xs shrink-0" style={{ color: "var(--pa-muted)" }}>{formatDist(retourKm)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 border-t" style={{ borderColor: "var(--pa-line)" }}>
              {departCoords && (
                <a href={genGoogleMapsUrl(departCoords, parcours.etapes, retourDepart)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors"
                  style={{ background: "linear-gradient(135deg,#34C9A3,#1FA98A)", boxShadow: "0 6px 16px -6px rgba(31,169,138,.5)" }}>
                  <MapIcon size={14} /> Ouvrir dans Maps
                </a>
              )}
              <button onClick={() => { setModalPlanif(true); setPlanifResult(null); }}
                className="pa-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
                <CalendarPlus size={14} /> Planifier les visites
              </button>
              <button onClick={() => setParcours(null)}
                className="pa-btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
                <RefreshCw size={14} /> Recalculer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALE PLANIFIER ──────────────────────────────────────── */}
      {modalPlanif && parcours && (
        <div className="pa-modal-overlay">
          <div className="pa-modal-content max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "var(--pa-ink)" }}><CalendarPlus size={16} style={{ color: "#7C6BE8" }} />Planifier les visites</h3>
              <button onClick={() => setModalPlanif(false)} style={{ color: "var(--pa-muted)" }} aria-label="Fermer"><X size={16} /></button>
            </div>
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
              {parcours.etapes.filter((e) => e.type === "magasin").length} visite{parcours.etapes.filter((e) => e.type === "magasin").length > 1 ? "s" : ""} créées, 1 par jour.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--pa-ink)" }}>Premier jour</label>
                <input type="date" value={datePlanif} onChange={(e) => setDatePlanif(e.target.value)}
                  className="pa-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--pa-ink)" }}>Objectif</label>
                <input type="text" value={objectifPlanif} onChange={(e) => setObjectifPlanif(e.target.value)}
                  className="pa-input" />
              </div>
            </div>
            {planifResult && (
              planifResult.ok
                ? <div className="rounded-xl px-4 py-2 text-sm font-medium" style={{ background: "#D2F2E7", border: "1px solid rgba(31,169,138,.25)", color: "#0F8C68" }}>
                    {planifResult.nb} visite{(planifResult.nb ?? 0) > 1 ? "s" : ""} créée{(planifResult.nb ?? 0) > 1 ? "s" : ""}
                  </div>
                : <div className="rounded-xl px-4 py-2 text-sm" style={{ background: "#FBE0E8", border: "1px solid rgba(192,71,110,.25)", color: "#C0476E" }}>{planifResult.error}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalPlanif(false)}
                className="pa-btn-secondary flex-1 py-2.5 rounded-xl text-sm">
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
                className="pa-btn-primary flex-1 py-2.5 rounded-xl text-sm">
                {isPlanif ? "Création…" : "Créer les visites"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
