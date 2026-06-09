import { createClient } from "@/lib/supabase/server";
import CarteWrapper from "@/components/CarteWrapper";
import Navigation from "@/components/Navigation";
import PersistRole from "@/components/PersistRole";
import BoutonChangerRole from "@/components/BoutonChangerRole";
import BoutonInstallerPWA from "@/components/BoutonInstallerPWA";
import CardRDVDemande from "@/components/CardRDVDemande";
import type { RDVDemande } from "@/components/CardRDVDemande";
import CardGCalEvent from "@/components/CardGCalEvent";
import Link from "next/link";
import { calculerRisqueMagasins } from "@/lib/risque";
import { fetchGCalEvents } from "@/lib/gcal";
import { getParametre, getParametreNumber, getParametreFloat } from "@/lib/parametres";
import { calculerPreparation } from "@/lib/preparation-rdv";

function premierJourMois(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function dernierJourMois(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

function ilYATroisMois(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() - 3, 1)
    .toISOString()
    .split("T")[0];
}

export default async function AnimateurPage() {
  const supabase = await createClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const debutMois = premierJourMois(now);
  const finMois = dernierJourMois(now);
  const debutTrimestre = ilYATroisMois(now);

  const [
    { count: nbMagasins },
    { count: nbVisitesMois },
    { data: notesConfiance },
    { data: notesBusiness },
    { data: magasins },
    { data: prochainesVisites },
    { count: nbActionsOuvertes },
    { count: nbRemonteesNouvelles },
    { data: notesEval },
    { data: visitesPourRisque },
    { data: remonteesUrgentesActives },
  ] = await Promise.all([
    supabase
      .from("magasins")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif"),
    supabase
      .from("visites")
      .select("*", { count: "exact", head: true })
      .gte("date_realisee", debutMois)
      .lte("date_realisee", finMois),
    supabase
      .from("visites")
      .select("note_confiance")
      .eq("statut", "realisee")
      .gte("date_realisee", debutTrimestre)
      .not("note_confiance", "is", null),
    supabase
      .from("visites")
      .select("note_business")
      .eq("statut", "realisee")
      .gte("date_realisee", debutTrimestre)
      .not("note_business", "is", null),
    supabase
      .from("magasins")
      .select("id, nom, enseigne, ville, region, latitude, longitude, contact_telephone, niveau")
      .eq("statut", "actif")
      .not("latitude", "is", null)
      .order("nom"),
    supabase
      .from("visites")
      .select("id, date_prevue, objectif, magasins(nom, enseigne)")
      .eq("statut", "planifiee")
      .gte("date_prevue", today)
      .order("date_prevue", { ascending: true })
      .limit(5),
    supabase
      .from("actions")
      .select("*", { count: "exact", head: true })
      .in("statut", ["ouverte", "en_cours"]),
    supabase
      .from("remontees")
      .select("*", { count: "exact", head: true })
      .eq("statut", "nouvelle"),
    supabase.from("evaluations_visite").select("q6_satisfaction_globale"),
    supabase
      .from("visites")
      .select("magasin_id, date_realisee, note_confiance, note_business")
      .eq("statut", "realisee"),
    supabase
      .from("remontees")
      .select("magasin_id")
      .eq("gravite", "urgente")
      .not("statut", "in", "(traitee,archivee)"),
  ]);

  // RDV en attente
  const dans7j = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const [{ data: rdvsEnAttente }, { data: rdvsConfirmes }] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select(`id, type, statut, demandeur_type, date_souhaitee, heure_souhaitee, objet, message, lieu,
        magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville),
        rendez_vous_invites(magasin_id, magasins(nom, enseigne))`)
      .in("statut", ["demande", "reporte"])
      .order("date_souhaitee", { ascending: true })
      .limit(10),
    supabase
      .from("rendez_vous")
      .select(`id, type, date_souhaitee, heure_souhaitee, objet,
        magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville),
        rendez_vous_invites(magasin_id, magasins(nom, enseigne))`)
      .eq("statut", "confirme")
      .gte("date_souhaitee", today)
      .order("date_souhaitee", { ascending: true })
      .limit(10),
  ]);

  // ── Préparation J+1 ──────────────────────────────────────────────────────
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [
    { data: rdvsDemain },
    latDep, lngDep, vitesseKmh, coefRoute, bufferMin, margeCharge,
    veActifJ1, autonomieKmJ1, seuilPctJ1,
  ] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select(
        "id, type, objet, heure_souhaitee, magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville, latitude, longitude)"
      )
      .eq("statut", "confirme")
      .eq("date_souhaitee", tomorrowStr),
    getParametre("lat_depart_habituel", ""),
    getParametre("lng_depart_habituel", ""),
    getParametreFloat("vitesse_moyenne_kmh", 70),
    getParametreFloat("coef_route_haversine", 1.3),
    getParametreNumber("buffer_arrivee_min", 30),
    getParametreNumber("marge_charge_pct", 15),
    getParametre("vehicule_electrique", "false"),
    getParametreNumber("autonomie_km", 300),
    getParametreNumber("seuil_recharge_pct", 20),
  ]);

  const departOk = !!(latDep && lngDep);
  const configCalcJ1 = {
    vitesseMoyenneKmh: vitesseKmh,
    coefRoute,
    bufferMin,
    margeChargePct: margeCharge,
    autonomieKm: veActifJ1 === "true" ? autonomieKmJ1 : undefined,
    seuilPct: veActifJ1 === "true" ? seuilPctJ1 : undefined,
  };

  type MagJ1 = { id: string; nom: string; enseigne: string | null; ville: string | null; latitude: number | null; longitude: number | null };
  type RdvJ1Row = { id: string; type: string; objet: string; heure_souhaitee: string | null; magasins: MagJ1 | null };

  const preparationsJ1 = departOk
    ? ((rdvsDemain ?? []) as unknown as RdvJ1Row[])
        .filter((r) => r.magasins?.latitude && r.magasins?.longitude)
        .map((r) => ({
          rdv: r,
          mag: r.magasins!,
          prep: calculerPreparation(
            parseFloat(latDep), parseFloat(lngDep),
            r.magasins!.latitude!, r.magasins!.longitude!,
            r.heure_souhaitee?.slice(0, 5) ?? null,
            configCalcJ1
          ),
        }))
    : [];

  // Trier : urgents (dans 7j) en premier, puis par date
  const rdvsSorted = (rdvsEnAttente ?? []).sort((a, b) => {
    const aUrgent = a.date_souhaitee <= dans7j ? 0 : 1;
    const bUrgent = b.date_souhaitee <= dans7j ? 0 : 1;
    if (aUrgent !== bUrgent) return aUrgent - bUrgent;
    return a.date_souhaitee.localeCompare(b.date_souhaitee);
  });
  const rdvsAffich = rdvsSorted.slice(0, 6);
  const rdvsTotal = rdvsSorted.length;
  const rdvsDuTerrain = rdvsAffich.filter(r => (r as unknown as { demandeur_type?: string }).demandeur_type !== "animateur");
  const rdvsAnimAttente = rdvsAffich.filter(r => (r as unknown as { demandeur_type?: string }).demandeur_type === "animateur");

  const magasinsList = magasins ?? [];
  const risqueMap = calculerRisqueMagasins(
    magasinsList.map((m) => ({ id: m.id, niveau: (m as unknown as { niveau?: string }).niveau ?? "standard" })),
    visitesPourRisque ?? [],
    remonteesUrgentesActives ?? []
  );
  const magasinsAvecRisque = magasinsList.map((m) => {
    const r = risqueMap.get(m.id);
    return {
      ...m,
      risque: r
        ? { niveau: r.niveau, raisons: r.raisons, joursSansVisite: r.joursSansVisite }
        : undefined,
    };
  });

  // Magasins prioritaires à revisiter selon leur niveau de criticité
  // Stratégique : seuil 60 jours · Observation : seuil 30 jours · Standard : 90 jours (rare)
  const seuilParNiveau: Record<string, number> = { strategique: 60, observation: 30, standard: 90 };
  type MagasinDB = { id: string; nom: string; enseigne?: string | null; ville?: string | null; niveau?: string | null };
  const magasinsPrioritaires = magasinsList
    .filter((m) => {
      const niveau = (m as MagasinDB).niveau ?? "standard";
      const r = risqueMap.get(m.id);
      if (niveau === "standard") return false; // on garde le focus sur les non-standards
      const seuil = seuilParNiveau[niveau] ?? 90;
      return r?.joursSansVisite === null || (r?.joursSansVisite ?? 0) > seuil;
    })
    .map((m) => {
      const niveau = (m as MagasinDB).niveau ?? "standard";
      const r = risqueMap.get(m.id);
      return {
        id: m.id,
        nom: (m as MagasinDB).nom,
        enseigne: (m as MagasinDB).enseigne,
        ville: (m as MagasinDB).ville,
        niveau,
        joursSansVisite: r?.joursSansVisite ?? null,
      };
    })
    .sort((a, b) => {
      // Stratégique en premier, puis observation, puis par jours décroissants
      if (a.niveau === "strategique" && b.niveau !== "strategique") return -1;
      if (b.niveau === "strategique" && a.niveau !== "strategique") return 1;
      const ja = a.joursSansVisite ?? 9999;
      const jb = b.joursSansVisite ?? 9999;
      return jb - ja;
    });

  const moyConfiance =
    notesConfiance && notesConfiance.length > 0
      ? (
          notesConfiance.reduce((s, v) => s + (v.note_confiance ?? 0), 0) /
          notesConfiance.length
        ).toFixed(1)
      : null;

  const moyBusiness =
    notesBusiness && notesBusiness.length > 0
      ? (
          notesBusiness.reduce((s, v) => s + (v.note_business ?? 0), 0) /
          notesBusiness.length
        ).toFixed(1)
      : null;

  const moySatisfaction =
    notesEval && notesEval.length > 0
      ? (
          notesEval.reduce((s, e) => s + (e.q6_satisfaction_globale ?? 0), 0) /
          notesEval.length
        ).toFixed(1)
      : null;

  const { events: gcalEvents, label: gcalLabel, error: gcalError } = await fetchGCalEvents(30);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <PersistRole role="animateur" />
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Animation réseau Piscinistes Associés
            </h1>
            <p className="text-slate-500 mt-1">
              Pilotage et suivi de votre réseau de magasins
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            <BoutonInstallerPWA />
            <BoutonChangerRole />
            <Link
              href="/animateur/parametres"
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              ⚙️ Paramètres
            </Link>
            <Link
              href="/animateur/news"
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:border-slate-400 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
            >
              📰 Gestion des news
            </Link>
            <Link
              href="/animateur/parcours"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              🚗 Préparer une tournée
            </Link>
            <Link
              href="/pilotage"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              → Pilotage complet
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* ── Préparation pour demain ─────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            🌅 Préparation pour demain
          </h2>

          {(rdvsDemain ?? []).length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-500">
              Pas de RDV confirmé prévu demain 😌
            </div>
          ) : !departOk ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-700 flex items-center justify-between gap-3">
              <span>
                {(rdvsDemain ?? []).length} RDV demain — configure ton adresse de départ habituelle pour voir la préparation détaillée.
              </span>
              <Link href="/animateur/parametres" className="shrink-0 font-semibold underline">
                Configurer →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {preparationsJ1.map(({ rdv, mag, prep }) => {
                const typeIcon: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻" };
                const nomMag = mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom;
                return (
                  <div key={rdv.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {rdv.heure_souhaitee ? rdv.heure_souhaitee.slice(0, 5) + " · " : ""}
                          {typeIcon[rdv.type]} {nomMag}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{rdv.objet}</p>
                      </div>
                      <Link
                        href={`/animateur/parcours?prefill_magasin=${mag.id}`}
                        className="shrink-0 text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Préparer ↗
                      </Link>
                    </div>

                    <div className="space-y-1 text-sm text-slate-700">
                      <p>
                        🚗 {prep.heureDepart
                          ? `Partir à ${prep.heureDepart}${prep.heureDepartVeille ? " (veille)" : ""} · `
                          : "Heure RDV non précisée · "}
                        {Math.round(prep.distanceKm)} km · {
                          prep.dureeRouteMinutes < 60
                            ? `${prep.dureeRouteMinutes} min`
                            : `${Math.floor(prep.dureeRouteMinutes / 60)}h${prep.dureeRouteMinutes % 60 > 0 ? String(prep.dureeRouteMinutes % 60).padStart(2, "0") : ""}`
                        } de route
                      </p>
                      {prep.chargeRecommandeePct > 0 && (
                        <p>
                          🔋 Charger ce soir jusqu&apos;à {prep.chargeRecommandeePct}%
                          {prep.nbArretsEstime > 0 && ` · ${prep.nbArretsEstime} arrêt${prep.nbArretsEstime > 1 ? "s" : ""} borne prévu`}
                        </p>
                      )}
                    </div>

                    {prep.alertes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {prep.alertes.map((a, i) => (
                          <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            ⚠️ {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RDV en attente */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              📅 Demandes de RDV à traiter
              {rdvsTotal > 0 && (
                <span className="ml-2 text-xs font-bold text-slate-900 bg-slate-200 rounded-full px-2 py-0.5">
                  {rdvsTotal}
                </span>
              )}
            </h2>
            {rdvsTotal > 6 && (
              <Link href="/animateur/rdv?tab=attente" className="text-sm text-blue-600 hover:underline font-medium">
                Voir tout ({rdvsTotal}) →
              </Link>
            )}
          </div>

          {rdvsTotal === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-sm text-emerald-700 font-medium">
              Aucune demande de RDV en attente 👍
            </div>
          ) : (
            <div className="space-y-4">
              {rdvsDuTerrain.length > 0 && (
                <div>
                  {rdvsAnimAttente.length > 0 && (
                    <p className="text-xs font-semibold text-slate-400 mb-2">📥 Demandes du terrain</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(rdvsDuTerrain as unknown as RDVDemande[]).map((r) => (
                      <CardRDVDemande key={r.id} rdv={r} />
                    ))}
                  </div>
                </div>
              )}
              {rdvsAnimAttente.length > 0 && (
                <div>
                  {rdvsDuTerrain.length > 0 && (
                    <p className="text-xs font-semibold text-slate-400 mb-2">⏳ Vos demandes en attente de validation</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(rdvsAnimAttente as unknown as RDVDemande[]).map((r) => (
                      <CardRDVDemande key={r.id} rdv={r} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Magasins prioritaires à revisiter (stratégiques + observation hors seuil) */}
        {magasinsPrioritaires.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                🎯 Magasins prioritaires à revisiter
                <span className="ml-2 text-xs font-bold text-slate-900 bg-slate-200 rounded-full px-2 py-0.5">
                  {magasinsPrioritaires.length}
                </span>
              </h2>
              <Link href="/magasins" className="text-sm text-blue-600 hover:underline font-medium">
                Voir tous les magasins →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {magasinsPrioritaires.slice(0, 6).map((m) => {
                const isStrategique = m.niveau === "strategique";
                const seuil = seuilParNiveau[m.niveau] ?? 90;
                const j = m.joursSansVisite;
                return (
                  <Link
                    key={m.id}
                    href={`/magasins/${m.id}`}
                    className={`block rounded-xl border-l-4 ${isStrategique ? "border-l-amber-400 bg-amber-50 border-amber-200" : "border-l-blue-400 bg-blue-50 border-blue-200"} border p-4 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isStrategique ? "bg-amber-200 text-amber-800" : "bg-blue-200 text-blue-800"}`}>
                        {isStrategique ? "⭐ Stratégique" : "🔍 Observation"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
                    </p>
                    {m.ville && <p className="text-xs text-slate-500">{m.ville}</p>}
                    <p className="text-xs text-slate-600 mt-2">
                      {j === null ? (
                        <span className="font-medium text-red-700">⚠️ Jamais visité</span>
                      ) : (
                        <>
                          <span className="font-medium text-slate-800">{j} jours</span> sans visite
                          <span className="text-slate-400"> (seuil {seuil}j)</span>
                        </>
                      )}
                    </p>
                  </Link>
                );
              })}
            </div>
            {magasinsPrioritaires.length > 6 && (
              <p className="text-xs text-slate-400 mt-2 text-center">
                + {magasinsPrioritaires.length - 6} autres magasins prioritaires
              </p>
            )}
          </div>
        )}

        {/* Métriques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <CardMetrique label="Magasins actifs" valeur={String(nbMagasins ?? 0)} href="/magasins" />
          <CardMetrique label="Visites ce mois" valeur={String(nbVisitesMois ?? 0)} href="/visites" />
          <CardMetrique
            label="Confiance moy."
            valeur={moyConfiance ? `${moyConfiance}/5` : "—"}
            href="/visites"
            sub="3 derniers mois"
          />
          <CardMetrique
            label="Actions ouvertes"
            valeur={String(nbActionsOuvertes ?? 0)}
            href="/actions-reseau"
            sub="ouvertes + en cours"
          />
          <CardMetrique
            label="Remontées nouvelles"
            valeur={String(nbRemonteesNouvelles ?? 0)}
            href="/remontees"
            rouge={(nbRemonteesNouvelles ?? 0) > 0}
          />
          <CardMetrique
            label="Satisfaction membres"
            valeur={moySatisfaction ? `${moySatisfaction}/5` : "—"}
            href="/evaluations"
            sub="note globale moy."
          />
        </div>

        {/* Carte */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Carte du réseau
          </h2>
          <CarteWrapper magasins={magasinsAvecRisque} />
        </div>

        {/* Prochaines visites planifiées */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Prochaines visites planifiées
            </h2>
            <Link
              href="/visites/nouvelle"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              + Nouvelle visite
            </Link>
          </div>

          {(prochainesVisites ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
              <p className="text-slate-400 mb-3">Aucune visite planifiée</p>
              <Link href="/visites/nouvelle" className="text-sm text-blue-600 hover:underline font-medium">
                Créer une nouvelle visite →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Date</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Magasin</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Objectif</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {(prochainesVisites ?? []).map((v) => {
                    const m = v.magasins as unknown as { nom: string; enseigne: string | null } | null;
                    return (
                      <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                          {v.date_prevue ? new Date(v.date_prevue).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {m ? `${m.enseigne ? m.enseigne + " — " : ""}${m.nom}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{v.objectif ?? "—"}</td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/visites/${v.id}`} className="text-slate-900 hover:underline font-medium">
                            Voir →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RDV confirmés à venir */}
        {(() => {
          const liste = rdvsConfirmes ?? [];
          const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
          const MOIS = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];
          const TYPE_STYLE: Record<string, { emoji: string; cls: string }> = {
            physique: { emoji: "🏪", cls: "bg-blue-100 text-blue-700" },
            tel:      { emoji: "📞", cls: "bg-emerald-100 text-emerald-700" },
            visio:    { emoji: "💻", cls: "bg-purple-100 text-purple-700" },
          };
          function fmtDate(d: string, h: string | null) {
            const dt = new Date(d + "T12:00:00");
            const base = `${JOURS[dt.getDay()]} ${dt.getDate()} ${MOIS[dt.getMonth()]}`;
            return h ? `${base} · ${h.slice(0, 5)}` : base;
          }
          return (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  ✅ Prochains RDV confirmés
                  {liste.length > 0 && (
                    <span className="ml-2 text-xs font-bold text-slate-900 bg-slate-200 rounded-full px-2 py-0.5">
                      {liste.length}
                    </span>
                  )}
                </h2>
                <Link href="/animateur/rdv?tab=confirme" className="text-sm text-blue-600 hover:underline font-medium">
                  Voir tous les RDV →
                </Link>
              </div>

              {liste.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-6 text-slate-400 text-sm text-center">
                  Aucun RDV confirmé à venir
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {liste.map((r, i) => {
                    const mag = r.magasins as unknown as { id: string; nom: string; enseigne: string | null; ville: string } | null;
                    const invites = (r.rendez_vous_invites ?? []) as unknown[];
                    const style = TYPE_STYLE[r.type] ?? { emoji: "📅", cls: "bg-slate-100 text-slate-600" };
                    const nomMag = mag ? (mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom) : "—";
                    return (
                      <div key={r.id} className={`flex items-center gap-4 px-5 py-3 ${i < liste.length - 1 ? "border-b border-slate-100" : ""}`}>
                        <span className={`shrink-0 text-base w-8 h-8 flex items-center justify-center rounded-lg ${style.cls}`}>
                          {style.emoji}
                        </span>
                        <span className="w-36 shrink-0 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {fmtDate(r.date_souhaitee, r.heure_souhaitee)}
                        </span>
                        <span className="flex-1 text-sm text-slate-900 font-medium truncate">{nomMag}</span>
                        <span className="text-xs text-slate-400 truncate max-w-[120px]">{r.objet}</span>
                        {invites.length > 0 && (
                          <span className="shrink-0 text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                            +{invites.length} invité{invites.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <Link href={`/animateur/rdv/${r.id}`} className="shrink-0 text-xs text-blue-600 hover:underline font-medium">
                          Détails →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Agenda GCal — masqué si URL non configurée ou aucun événement */}
        {!gcalError && gcalEvents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                📆 {gcalLabel}
              </h2>
              <Link
                href="/animateur/parametres"
                className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
              >
                Configurer l&apos;agenda →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {gcalEvents.slice(0, 8).map((e) => (
                <CardGCalEvent key={e.uid} event={e} />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function CardMetrique({
  label, valeur, href, sub, rouge,
}: {
  label: string; valeur: string; href: string; sub?: string; rouge?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border p-6 shadow-sm transition-colors flex flex-col gap-2 ${
        rouge
          ? "bg-red-50 border-red-200 hover:border-red-300"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-bold leading-none ${rouge ? "text-red-600" : "text-slate-900"}`}>
        {valeur}
      </span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
      <span className={`text-sm font-medium mt-auto pt-2 ${rouge ? "text-red-500" : "text-blue-600"}`}>
        Voir →
      </span>
    </Link>
  );
}
