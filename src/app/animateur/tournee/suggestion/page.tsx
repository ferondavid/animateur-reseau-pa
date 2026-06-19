export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import BoutonAccueil from "@/components/BoutonAccueil";
import Link from "next/link";
import { calculerRisqueMagasins } from "@/lib/risque";
import { suggererTournee } from "@/lib/suggestion-tournee";
import { getParametre } from "@/lib/parametres";
import { titreMagasin } from "@/lib/magasin";
import { Sparkles, Route, Info } from "lucide-react";

type MagasinRow = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  niveau: string | null;
};

const RISQUE_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  eleve: { label: "Risque élevé", bg: "#FBE0E8", fg: "#C0476E" },
  modere: { label: "À surveiller", bg: "#FBF1D8", fg: "#B07D14" },
  ok: { label: "OK", bg: "#D2F2E7", fg: "#0F8C68" },
};

function fmtKm(km: number): string {
  return `${Math.round(km)} km`;
}
function fmtDuree(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export default async function SuggestionTourneePage({
  searchParams,
}: {
  searchParams: Promise<{ taille?: string }>;
}) {
  const { taille: tailleParam } = await searchParams;
  const taille = [4, 6, 8].includes(Number(tailleParam)) ? Number(tailleParam) : 6;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: magasinsData },
    { data: visitesRealisees },
    { data: remonteesUrgentes },
    { data: visitesPlanifiees },
    latDep,
    lngDep,
  ] = await Promise.all([
    supabase
      .from("magasins")
      .select("id, nom, enseigne, ville, region, latitude, longitude, niveau")
      .eq("statut", "actif")
      .not("latitude", "is", null)
      .not("longitude", "is", null),
    supabase
      .from("visites")
      .select("magasin_id, date_realisee, note_confiance, note_business")
      .eq("statut", "realisee"),
    supabase
      .from("remontees")
      .select("magasin_id")
      .eq("gravite", "urgente")
      .not("statut", "in", "(traitee,archivee)"),
    supabase
      .from("visites")
      .select("magasin_id")
      .eq("statut", "planifiee")
      .gte("date_prevue", today),
    getParametre("lat_depart_habituel", ""),
    getParametre("lng_depart_habituel", ""),
  ]);

  const magasins = (magasinsData ?? []) as unknown as MagasinRow[];

  const risqueMap = calculerRisqueMagasins(
    magasins.map((m) => ({ id: m.id, niveau: m.niveau ?? "standard" })),
    (visitesRealisees ?? []) as unknown as {
      magasin_id: string;
      date_realisee: string | null;
      note_confiance: number | null;
      note_business: number | null;
    }[],
    (remonteesUrgentes ?? []) as unknown as { magasin_id: string }[]
  );

  const dejaPlanifies = new Set(
    ((visitesPlanifiees ?? []) as unknown as { magasin_id: string }[]).map((v) => v.magasin_id)
  );
  const depart = latDep && lngDep ? { lat: parseFloat(latDep), lng: parseFloat(lngDep) } : null;

  const suggestion = suggererTournee({
    magasins: magasins.map((m) => ({
      id: m.id,
      nom: m.nom,
      enseigne: m.enseigne,
      ville: m.ville,
      region: m.region,
      lat: m.latitude,
      lng: m.longitude,
      niveau: m.niveau,
    })),
    risqueMap,
    magasinsDejaPlanifies: dejaPlanifies,
    depart,
    taille,
  });

  const ids = suggestion.magasins.map((m) => m.id).join(",");
  const lienParcours = `/animateur/parcours?prefill=${ids}`;
  const vide = suggestion.magasins.length === 0;

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <BoutonAccueil />

        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
          >
            <Sparkles size={22} style={{ color: "#6B4FD8" }} /> Tournée suggérée
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Les magasins à voir en priorité, regroupés intelligemment.
          </p>
        </div>

        <Navigation />

        {/* Sélecteur de taille */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>
            Taille de tournée :
          </span>
          {[4, 6, 8].map((n) => {
            const actif = n === taille;
            return (
              <Link
                key={n}
                href={`/animateur/tournee/suggestion?taille=${n}`}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={
                  actif
                    ? { background: "#6B4FD8", color: "#fff", boxShadow: "0 2px 8px -3px rgba(107,79,216,.6)" }
                    : { background: "#ECEAF3", color: "#6F6982" }
                }
              >
                {n} magasins
              </Link>
            );
          })}
        </div>

        {!depart && !vide && (
          <div
            className="rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3"
            style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}
          >
            <span>Configure ton adresse de départ pour optimiser le point de démarrage.</span>
            <Link href="/animateur/parametres" className="shrink-0 font-semibold underline">
              Configurer →
            </Link>
          </div>
        )}

        {vide ? (
          <div
            className="pa-card p-10 text-center"
            style={{ background: "#D2F2E7", border: "1px solid rgba(31,169,138,.25)" }}
          >
            <p className="font-semibold" style={{ color: "#0F8C68" }}>
              {suggestion.raisonGroupe}
            </p>
            <p className="text-sm mt-1" style={{ color: "#1A9E78" }}>
              Tous les magasins prioritaires sont déjà planifiés ou à jour.
            </p>
          </div>
        ) : (
          <>
            {/* Récap */}
            <div className="pa-card p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--pa-ink)" }}>
                    {suggestion.magasins.length}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                    Magasins
                  </p>
                </div>
                <div style={{ borderLeft: "1px solid var(--pa-line)", borderRight: "1px solid var(--pa-line)" }}>
                  <p className="text-2xl font-bold" style={{ color: "var(--pa-ink)" }}>
                    ~{fmtKm(suggestion.distanceTotaleKm)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                    Distance
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--pa-ink)" }}>
                    ~{fmtDuree(suggestion.dureeEstimeeMin)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                    Route
                  </p>
                </div>
              </div>
              <p className="text-xs text-center mt-3" style={{ color: "var(--pa-muted)" }}>
                {suggestion.raisonGroupe} · estimation à vol d&apos;oiseau (60 km/h)
              </p>
            </div>

            {/* Critères de la suggestion */}
            <div
              className="pa-card p-4"
              style={{ background: "linear-gradient(135deg,#F3F0FC,#EDEBFB)", border: "1px solid rgba(124,107,232,.25)" }}
            >
              <p className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: "#534AB7" }}>
                <Info size={16} /> Pourquoi ces magasins ?
              </p>
              <ul className="space-y-2 text-sm" style={{ color: "var(--pa-ink)" }}>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">🔴</span>
                  <span><strong>Niveau de risque</strong> — non visité hors délai, note faible (&lt; 3/5) ou remontée urgente non traitée.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">⏳</span>
                  <span><strong>Ancienneté</strong> — plus la dernière visite est lointaine, plus c&apos;est prioritaire (seuils <strong>30 / 60 / 90 j</strong> selon observation / stratégique / standard).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">📍</span>
                  <span><strong>Proximité</strong> — magasins regroupés autour du plus urgent, pour une tournée compacte.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0">🚗</span>
                  <span><strong>Itinéraire</strong> — ordonnés au plus proche depuis ton adresse de départ.</span>
                </li>
              </ul>
              <p className="text-xs mt-3" style={{ color: "var(--pa-muted)" }}>
                Les étiquettes sous chaque magasin ci-dessous indiquent la ou les raisons retenues.
              </p>
            </div>

            {/* Liste ordonnée */}
            <div className="space-y-3">
              {suggestion.magasins.map((m) => {
                const badge = RISQUE_BADGE[m.niveauRisque] ?? RISQUE_BADGE.ok;
                return (
                  <Link
                    key={m.id}
                    href={`/magasins/${m.id}`}
                    className="pa-card p-4 flex items-start gap-3 transition-all hover:-translate-y-0.5"
                    style={{ textDecoration: "none" }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{ background: "#6B4FD8" }}
                    >
                      {m.ordre}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                          {titreMagasin(m.enseigne, m.nom)}
                        </p>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: badge.bg, color: badge.fg }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                        {m.ville ? `${m.ville} · ` : ""}
                        {m.ordre === 1 ? "1ʳᵉ étape" : `+${m.distanceDepuisPrec.toFixed(0)} km`}
                      </p>
                      {m.raisons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.raisons.map((r, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "#F4F1FB", color: "#6F6982" }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* CTA */}
            <Link
              href={lienParcours}
              className="pa-btn-primary w-full py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Route size={16} /> Générer le parcours
            </Link>
            <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>
              Pré-remplit ta sélection dans le planificateur — tu ajustes le départ et tu planifies.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
