import { createClient } from "@/lib/supabase/server";
import CarteWrapper from "@/components/CarteWrapper";
import Navigation from "@/components/Navigation";
import PersistRole from "@/components/PersistRole";
import MenuAnimateur from "@/components/MenuAnimateur";
import CardRDVDemande from "@/components/CardRDVDemande";
import type { RDVDemande } from "@/components/CardRDVDemande";
import AgendaSemaine from "@/components/AgendaSemaine";
import { fetchAgendaUnifie } from "@/lib/agenda-unifie";
import Link from "next/link";
import { calculerRisqueMagasins } from "@/lib/risque";
import { suggererTournee } from "@/lib/suggestion-tournee";
import { getParametre, getParametreNumber, getParametreFloat } from "@/lib/parametres";
import { calculerPreparation } from "@/lib/preparation-rdv";
import Tuile from "@/components/ui/Tuile";
import CountUp from "@/components/ui/CountUp";
import { guardBureau } from "@/lib/visibilite";
import { getSession } from "@/lib/auth";
import {
  Sun, CalendarDays, MapPin, Calendar, Eye, Star, AlertTriangle,
  BarChart3, Car, Megaphone, Zap, Activity, Sparkles,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function premierJourMois(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function dernierJourMois(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
}
function ilYATroisMois(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth() - 3, 1).toISOString().split("T")[0];
}

function IcoBox({ bg, color, Icon }: {
  bg: string; color: string;
  Icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <div
      className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0"
      style={{ background: bg, color }}
    >
      <Icon size={20} />
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function CardMetrique({
  label, valeur, href, sub, rouge,
}: {
  label: string; valeur: string; href: string; sub?: string; rouge?: boolean;
}) {
  return (
    <Link
      href={href}
      className="pa-tile flex flex-col gap-2 p-5 transition-all"
      style={{ cursor: "pointer", textDecoration: "none" }}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--pa-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-3xl font-bold leading-none"
        style={{ color: rouge ? "#C0476E" : "#6B4FD8", letterSpacing: "-0.5px" }}
      >
        {valeur}
      </span>
      {sub && (
        <span className="text-[11px]" style={{ color: "var(--pa-muted)" }}>{sub}</span>
      )}
      <span
        className="text-sm font-semibold mt-auto pt-2"
        style={{ color: rouge ? "#C0476E" : "#7C6BE8" }}
      >
        Voir →
      </span>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnimateurPage() {
  await guardBureau("bureau_accueil");
  const [session, supabase] = await Promise.all([getSession(), createClient()]);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const debutMois = premierJourMois(now);
  const finMois = dernierJourMois(now);
  const debutTrimestre = ilYATroisMois(now);
  const h = now.getHours();
  const greeting = h < 12 ? "Bonne matinée" : h < 18 ? "Bonne journée" : "Bonne soirée";

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
    supabase.from("magasins").select("*", { count: "exact", head: true }).eq("statut", "actif"),
    supabase.from("visites").select("*", { count: "exact", head: true }).gte("date_realisee", debutMois).lte("date_realisee", finMois),
    supabase.from("visites").select("note_confiance").eq("statut", "realisee").gte("date_realisee", debutTrimestre).not("note_confiance", "is", null),
    supabase.from("visites").select("note_business").eq("statut", "realisee").gte("date_realisee", debutTrimestre).not("note_business", "is", null),
    supabase.from("magasins").select("id, nom, enseigne, ville, region, latitude, longitude, contact_telephone, niveau").eq("statut", "actif").not("latitude", "is", null).order("nom"),
    supabase.from("visites").select("id, date_prevue, objectif, magasins(nom, enseigne)").eq("statut", "planifiee").gte("date_prevue", today).order("date_prevue", { ascending: true }).limit(5),
    supabase.from("actions").select("*", { count: "exact", head: true }).in("statut", ["ouverte", "en_cours"]),
    supabase.from("remontees").select("*", { count: "exact", head: true }).eq("statut", "nouvelle"),
    supabase.from("evaluations_visite").select("q6_satisfaction_globale"),
    supabase.from("visites").select("magasin_id, date_realisee, note_confiance, note_business").eq("statut", "realisee"),
    supabase.from("remontees").select("magasin_id").eq("gravite", "urgente").not("statut", "in", "(traitee,archivee)"),
  ]);

  const dans7j = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const { data: rdvsEnAttente } = await supabase
    .from("rendez_vous")
    .select(`id, type, statut, demandeur_type, date_souhaitee, heure_souhaitee, objet, message, lieu,
      magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville),
      rendez_vous_invites(magasin_id, magasins(nom, enseigne))`)
    .in("statut", ["demande", "reporte"])
    .order("date_souhaitee", { ascending: true })
    .limit(10);

  // Préparation J+1 — "demain" en fuseau France (évite le décalage UTC de Vercel),
  // toutes les sources de l'agenda qui ont une destination : RDV confirmés + visites planifiées.
  const parisYMD = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const tomorrowStr = parisYMD(new Date(Date.now() + 86_400_000));

  const [
    { data: rdvsDemain },
    { data: visitesDemain },
    latDep, lngDep, vitesseKmh, coefRoute, bufferMin, margeCharge,
    veActifJ1, autonomieKmJ1, seuilPctJ1,
  ] = await Promise.all([
    supabase.from("rendez_vous").select("id, type, objet, heure_souhaitee, magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville, latitude, longitude)").eq("statut", "confirme").eq("date_souhaitee", tomorrowStr),
    supabase.from("visites").select("id, objectif, heure_prevue, magasins(id, nom, enseigne, ville, latitude, longitude)").eq("statut", "planifiee").eq("date_prevue", tomorrowStr),
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
  const configCalcJ1 = { vitesseMoyenneKmh: vitesseKmh, coefRoute, bufferMin, margeChargePct: margeCharge, autonomieKm: veActifJ1 === "true" ? autonomieKmJ1 : undefined, seuilPct: veActifJ1 === "true" ? seuilPctJ1 : undefined };

  type MagJ1 = { id: string; nom: string; enseigne: string | null; ville: string | null; latitude: number | null; longitude: number | null };
  type ItemJ1 = { id: string; kind: "rdv" | "visite"; type: string; objet: string; heure: string | null; mag: MagJ1 | null };

  const itemsDemain: ItemJ1[] = [
    ...((rdvsDemain ?? []) as unknown as { id: string; type: string; objet: string; heure_souhaitee: string | null; magasins: MagJ1 | null }[])
      .map((r) => ({ id: r.id, kind: "rdv" as const, type: r.type, objet: r.objet, heure: r.heure_souhaitee, mag: r.magasins })),
    ...((visitesDemain ?? []) as unknown as { id: string; objectif: string | null; heure_prevue: string | null; magasins: MagJ1 | null }[])
      .map((v) => ({ id: v.id, kind: "visite" as const, type: "visite", objet: v.objectif ?? "Visite planifiée", heure: v.heure_prevue, mag: v.magasins })),
  ].sort((a, b) => (a.heure ?? "99:99").localeCompare(b.heure ?? "99:99"));

  const nbDemain = itemsDemain.length;

  const preparationsJ1 = departOk
    ? itemsDemain
        .filter((it) => it.mag?.latitude && it.mag?.longitude)
        .map((it) => ({
          item: it, mag: it.mag!,
          prep: calculerPreparation(parseFloat(latDep), parseFloat(lngDep), it.mag!.latitude!, it.mag!.longitude!, it.heure?.slice(0, 5) ?? null, configCalcJ1),
        }))
    : [];

  // Tous les magasins de demain (1er programmé puis suivants), pour préremplir le parcours en 1 clic
  const idsDemain = [...new Set(itemsDemain.filter((it) => it.mag?.id).map((it) => it.mag!.id))];
  const lienPreparerDemain = `/animateur/parcours?prefill=${idsDemain.join(",")}`;

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
    return { ...m, risque: r ? { niveau: r.niveau, raisons: r.raisons, joursSansVisite: r.joursSansVisite } : undefined };
  });

  const seuilParNiveau: Record<string, number> = { strategique: 60, observation: 30, standard: 90 };
  type MagasinDB = { id: string; nom: string; enseigne?: string | null; ville?: string | null; niveau?: string | null };
  const magasinsPrioritaires = magasinsList
    .filter((m) => {
      const niveau = (m as MagasinDB).niveau ?? "standard";
      const r = risqueMap.get(m.id);
      if (niveau === "standard") return false;
      const seuil = seuilParNiveau[niveau] ?? 90;
      return r?.joursSansVisite === null || (r?.joursSansVisite ?? 0) > seuil;
    })
    .map((m) => {
      const niveau = (m as MagasinDB).niveau ?? "standard";
      const r = risqueMap.get(m.id);
      return { id: m.id, nom: (m as MagasinDB).nom, enseigne: (m as MagasinDB).enseigne, ville: (m as MagasinDB).ville, niveau, joursSansVisite: r?.joursSansVisite ?? null };
    })
    .sort((a, b) => {
      if (a.niveau === "strategique" && b.niveau !== "strategique") return -1;
      if (b.niveau === "strategique" && a.niveau !== "strategique") return 1;
      const ja = a.joursSansVisite ?? 9999;
      const jb = b.joursSansVisite ?? 9999;
      return jb - ja;
    });

  // Suggestion de tournée intelligente (réutilise risqueMap)
  const { data: visitesPlanifieesAll } = await supabase
    .from("visites")
    .select("magasin_id")
    .eq("statut", "planifiee")
    .gte("date_prevue", today);

  const departHome = latDep && lngDep ? { lat: parseFloat(latDep), lng: parseFloat(lngDep) } : null;
  const suggestionTournee = suggererTournee({
    magasins: magasinsList.map((m) => {
      const mm = m as unknown as {
        id: string; nom: string; enseigne?: string | null; ville?: string | null;
        region?: string | null; latitude: number; longitude: number; niveau?: string | null;
      };
      return {
        id: mm.id, nom: mm.nom, enseigne: mm.enseigne ?? null, ville: mm.ville ?? null,
        region: mm.region ?? null, lat: mm.latitude, lng: mm.longitude, niveau: mm.niveau ?? null,
      };
    }),
    risqueMap,
    magasinsDejaPlanifies: new Set(
      ((visitesPlanifieesAll ?? []) as unknown as { magasin_id: string }[]).map((v) => v.magasin_id)
    ),
    depart: departHome,
    taille: 6,
  });

  const moyConfiance = notesConfiance && notesConfiance.length > 0
    ? (notesConfiance.reduce((s, v) => s + (v.note_confiance ?? 0), 0) / notesConfiance.length).toFixed(1) : null;
  const moyBusiness = notesBusiness && notesBusiness.length > 0
    ? (notesBusiness.reduce((s, v) => s + (v.note_business ?? 0), 0) / notesBusiness.length).toFixed(1) : null;
  const moySatisfaction = notesEval && notesEval.length > 0
    ? (notesEval.reduce((s, e) => s + (e.q6_satisfaction_globale ?? 0), 0) / notesEval.length).toFixed(1) : null;

  const { events: agendaUnifie, gcalLabel, gcalError } = await fetchAgendaUnifie(30);

  return (
    <main className="min-h-screen p-6">
      <PersistRole role={session?.role ?? "animateur"} />
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Hero ────────────────────────────────────────────────── */}
        <div className="pa-hero pa-reveal" style={{ animationDelay: ".04s" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "#fff", letterSpacing: "-0.3px" }}
              >
                Animation réseau PA
              </h1>
              <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                {greeting} — pilotage et suivi de votre réseau
              </p>
            </div>
            <div className="shrink-0">
              <MenuAnimateur />
            </div>
          </div>
        </div>

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div className="pa-reveal" style={{ animationDelay: ".10s" }}>
          <Navigation />
        </div>

        {/* ── Préparation J+1 ─────────────────────────────────────── */}
        <div className="pa-reveal" style={{ animationDelay: ".14s" }}>
          <Tuile
            icon={
              <IcoBox bg="linear-gradient(135deg,#FEF3C7,#FDE68A)" color="#B45309" Icon={Sun} />
            }
            titre="Préparation pour demain"
            sousTitre={
              nbDemain === 0
                ? "Rien de prévu"
                : `${nbDemain} ${nbDemain > 1 ? "rendez-vous / visites" : "rendez-vous ou visite"}`
            }
          >
            {nbDemain === 0 ? (
              <p className="text-sm py-2" style={{ color: "var(--pa-muted)" }}>
                Rien de prévu demain 😌
              </p>
            ) : !departOk ? (
              <div
                className="rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3"
                style={{ background: "#FFFBEB", color: "#92400E", border: "1px solid #FDE68A" }}
              >
                <span>
                  {nbDemain} prévu{nbDemain > 1 ? "s" : ""} demain — configure ton adresse de départ habituelle.
                </span>
                <Link href="/animateur/parametres" className="shrink-0 font-semibold underline">
                  Configurer →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {preparationsJ1.map(({ item, mag, prep }) => {
                  const typeIcon: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻", visite: "🚗" };
                  const nomMag = mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom;
                  return (
                    <div
                      key={`${item.kind}-${item.id}`}
                      className="rounded-2xl p-4 space-y-2"
                      style={{
                        background: "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(255,255,255,0.7)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>
                            {item.heure ? item.heure.slice(0, 5) + " · " : ""}
                            {typeIcon[item.type] ?? "📍"} {nomMag}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                            {item.kind === "visite" ? "Visite · " : ""}{item.objet}
                          </p>
                        </div>
                        <Link
                          href={lienPreparerDemain}
                          className="shrink-0 text-xs font-semibold hover:underline whitespace-nowrap"
                          style={{ color: "#7C6BE8" }}
                        >
                          Préparer ↗
                        </Link>
                      </div>
                      <div className="space-y-1 text-sm" style={{ color: "var(--pa-ink)" }}>
                        <p>
                          🚗 {prep.heureDepart ? `Partir à ${prep.heureDepart}${prep.heureDepartVeille ? " (veille)" : ""} · ` : "Heure non précisée · "}
                          {Math.round(prep.distanceKm)} km · {
                            prep.dureeRouteMinutes < 60
                              ? `${prep.dureeRouteMinutes} min`
                              : `${Math.floor(prep.dureeRouteMinutes / 60)}h${prep.dureeRouteMinutes % 60 > 0 ? String(prep.dureeRouteMinutes % 60).padStart(2, "0") : ""}`
                          } de route
                        </p>
                        {prep.chargeRecommandeePct > 0 && (
                          <p>🔋 Charger ce soir jusqu&apos;à {prep.chargeRecommandeePct}%{prep.nbArretsEstime > 0 && ` · ${prep.nbArretsEstime} arrêt${prep.nbArretsEstime > 1 ? "s" : ""} borne`}</p>
                        )}
                      </div>
                      {prep.alertes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {prep.alertes.map((a, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FEF3C7", color: "#92400E" }}>
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
          </Tuile>
        </div>

        {/* ── RDV en attente ──────────────────────────────────────── */}
        {rdvsTotal > 0 && (
          <div className="pa-reveal" style={{ animationDelay: ".18s" }}>
            <Tuile
              icon={
                <IcoBox bg="linear-gradient(135deg,#D9EAFB,#BFDBF7)" color="#2D6FD0" Icon={CalendarDays} />
              }
              titre="Demandes de RDV à traiter"
              sousTitre={`${rdvsTotal} demande${rdvsTotal > 1 ? "s" : ""} en attente`}
              badge={rdvsTotal}
            >
              <div className="space-y-4 pt-1">
                {rdvsDuTerrain.length > 0 && (
                  <div>
                    {rdvsAnimAttente.length > 0 && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--pa-muted)" }}>
                        Demandes du terrain
                      </p>
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
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--pa-muted)" }}>
                        ⏳ Vos demandes en attente de validation
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(rdvsAnimAttente as unknown as RDVDemande[]).map((r) => (
                        <CardRDVDemande key={r.id} rdv={r} />
                      ))}
                    </div>
                  </div>
                )}
                {rdvsTotal > 6 && (
                  <Link href="/animateur/rdv?tab=attente" className="block text-center text-sm font-semibold" style={{ color: "#7C6BE8" }}>
                    Voir tout ({rdvsTotal}) →
                  </Link>
                )}
              </div>
            </Tuile>
          </div>
        )}

        {/* ── Magasins prioritaires ────────────────────────────────── */}
        {magasinsPrioritaires.length > 0 && (
          <div className="pa-reveal" style={{ animationDelay: ".22s" }}>
            <Tuile
              icon={
                <IcoBox bg="linear-gradient(135deg,#FEE2E2,#FECACA)" color="#B91C1C" Icon={AlertTriangle} />
              }
              titre="Magasins prioritaires à revisiter"
              sousTitre={`${magasinsPrioritaires.length} magasin${magasinsPrioritaires.length > 1 ? "s" : ""} hors seuil`}
              badge={magasinsPrioritaires.length}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {magasinsPrioritaires.slice(0, 6).map((m) => {
                  const isStrategique = m.niveau === "strategique";
                  const seuil = seuilParNiveau[m.niveau] ?? 90;
                  const j = m.joursSansVisite;
                  return (
                    <Link
                      key={m.id}
                      href={`/magasins/${m.id}`}
                      className="rounded-xl p-3 flex flex-col gap-1.5 transition-all hover:-translate-y-0.5"
                      style={{
                        background: isStrategique ? "#FFFBEB" : "#EFF6FF",
                        border: `1px solid ${isStrategique ? "#FDE68A" : "#BFDBFE"}`,
                        textDecoration: "none",
                      }}
                    >
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start"
                        style={{ background: isStrategique ? "#FEF3C7" : "#DBEAFE", color: isStrategique ? "#92400E" : "#1E40AF" }}
                      >
                        {isStrategique ? "⭐ Stratégique" : "🔍 Observation"}
                      </span>
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                        {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
                      </p>
                      {m.ville && <p className="text-xs" style={{ color: "var(--pa-muted)" }}>{m.ville}</p>}
                      <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
                        {j === null ? <span className="font-medium text-red-700">⚠️ Jamais visité</span> : <><span className="font-medium" style={{ color: "var(--pa-ink)" }}>{j} jours</span> sans visite <span>(seuil {seuil}j)</span></>}
                      </p>
                    </Link>
                  );
                })}
              </div>
              {magasinsPrioritaires.length > 6 && (
                <p className="text-xs text-center mt-3" style={{ color: "var(--pa-muted)" }}>
                  + {magasinsPrioritaires.length - 6} autres magasins prioritaires
                </p>
              )}
              <div className="text-right mt-2">
                <Link href="/magasins" className="text-xs font-semibold" style={{ color: "#7C6BE8" }}>
                  Tous les magasins →
                </Link>
              </div>
            </Tuile>
          </div>
        )}

        {/* ── Tournée suggérée ─────────────────────────────────────── */}
        {suggestionTournee.magasins.length > 0 && (
          <div className="pa-reveal" style={{ animationDelay: ".24s" }}>
            <Tuile
              icon={
                <IcoBox bg="linear-gradient(135deg,#E4DDFB,#D3C7F7)" color="#6B4FD8" Icon={Sparkles} />
              }
              titre="Tournée suggérée"
              sousTitre={`${suggestionTournee.magasins.length} magasins · ~${Math.round(suggestionTournee.distanceTotaleKm)} km · ${suggestionTournee.raisonGroupe}`}
            >
              <div className="space-y-2 pt-1">
                {suggestionTournee.magasins.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                      style={{ background: "#6B4FD8" }}
                    >
                      {m.ordre}
                    </span>
                    <p className="text-sm font-semibold truncate flex-1" style={{ color: "var(--pa-ink)" }}>
                      {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
                    </p>
                    {m.ville && (
                      <span className="text-xs shrink-0" style={{ color: "var(--pa-muted)" }}>{m.ville}</span>
                    )}
                  </div>
                ))}
                {suggestionTournee.magasins.length > 3 && (
                  <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
                    + {suggestionTournee.magasins.length - 3} autres
                  </p>
                )}
                <div className="text-right pt-1">
                  <Link href="/animateur/tournee/suggestion" className="text-xs font-semibold" style={{ color: "#7C6BE8" }}>
                    Voir la tournée complète →
                  </Link>
                </div>
              </div>
            </Tuile>
          </div>
        )}

        {/* ── Métriques ───────────────────────────────────────────── */}
        <div className="pa-reveal grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" style={{ animationDelay: ".26s" }}>
          <CardMetrique label="Magasins actifs" valeur={String(nbMagasins ?? 0)} href="/magasins" />
          <CardMetrique label="Visites ce mois" valeur={String(nbVisitesMois ?? 0)} href="/visites" />
          <CardMetrique label="Confiance moy." valeur={moyConfiance ? `${moyConfiance}/5` : "—"} href="/visites" sub="3 derniers mois" />
          <CardMetrique label="Actions ouvertes" valeur={String(nbActionsOuvertes ?? 0)} href="/actions-reseau" sub="ouvertes + en cours" />
          <CardMetrique label="Remontées nouvelles" valeur={String(nbRemonteesNouvelles ?? 0)} href="/remontees" rouge={(nbRemonteesNouvelles ?? 0) > 0} />
          <CardMetrique label="Satisfaction" valeur={moySatisfaction ? `${moySatisfaction}/5` : "—"} href="/evaluations" sub="note globale moy." />
        </div>

        {/* ── Carte ───────────────────────────────────────────────── */}
        <div className="pa-reveal pa-card p-5" style={{ animationDelay: ".30s" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--pa-muted)" }}>
            Carte du réseau
          </p>
          <CarteWrapper magasins={magasinsAvecRisque} />
        </div>

        {/* ── Prochaines visites ──────────────────────────────────── */}
        <div className="pa-reveal" style={{ animationDelay: ".34s" }}>
          <Tuile
            icon={
              <IcoBox bg="linear-gradient(135deg,#D2F2E7,#B5E9D5)" color="#0F8C68" Icon={Eye} />
            }
            titre="Prochaines visites planifiées"
            sousTitre={`${(prochainesVisites ?? []).length} visite${(prochainesVisites ?? []).length !== 1 ? "s" : ""} à venir`}
          >
            {(prochainesVisites ?? []).length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm mb-2" style={{ color: "var(--pa-muted)" }}>Aucune visite planifiée</p>
                <Link href="/visites/nouvelle" className="text-sm font-semibold" style={{ color: "#7C6BE8" }}>
                  Créer une visite →
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--pa-line)" }}>
                {(prochainesVisites ?? []).map((v) => {
                  const m = v.magasins as unknown as { nom: string; enseigne: string | null } | null;
                  return (
                    <div key={v.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                          {m ? `${m.enseigne ? m.enseigne + " — " : ""}${m.nom}` : "—"}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--pa-muted)" }}>
                          {v.date_prevue ? new Date(v.date_prevue).toLocaleDateString("fr-FR") : "—"}
                          {v.objectif ? ` · ${v.objectif}` : ""}
                        </p>
                      </div>
                      <Link href={`/visites/${v.id}`} className="shrink-0 text-sm font-semibold" style={{ color: "#7C6BE8", textDecoration: "none" }}>
                        Voir →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="pt-2 text-right">
              <Link href="/visites/nouvelle" className="text-xs font-semibold" style={{ color: "#7C6BE8" }}>
                + Nouvelle visite
              </Link>
            </div>
          </Tuile>
        </div>

        {/* ── Agenda unifié ───────────────────────────────────────── */}
        <div className="pa-reveal" style={{ animationDelay: ".38s" }}>
          <Tuile
            icon={
              <IcoBox bg="linear-gradient(135deg,#E4DDFB,#D3C7F7)" color="#6B4FD8" Icon={Calendar} />
            }
            titre="Mon agenda"
            sousTitre={
              gcalError
                ? "Google indisponible"
                : `${agendaUnifie.length} évènement${agendaUnifie.length > 1 ? "s" : ""} · 30 jours`
            }
            badge={agendaUnifie.length > 0 ? agendaUnifie.length : undefined}
          >
            <div className="pt-1">
              <div className="flex items-center justify-end gap-3 mb-3">
                <Link href="/animateur/rdv?tab=confirme" className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
                  Tous les RDV →
                </Link>
                <Link href="/animateur/parametres" className="text-xs font-medium" style={{ color: "var(--pa-muted)" }}>
                  Configurer →
                </Link>
              </div>

              {agendaUnifie.length === 0 ? (
                <div className="rounded-xl p-5 text-center text-sm" style={{ background: "rgba(255,255,255,0.5)", color: "var(--pa-muted)" }}>
                  Aucun évènement à venir dans les 30 jours
                  {gcalError && <div className="text-[11px] mt-1" style={{ color: "#B45309" }}>{gcalLabel} : {gcalError}</div>}
                </div>
              ) : (
                <AgendaSemaine events={agendaUnifie} gcalLabel={gcalLabel} gcalError={gcalError} />
              )}
            </div>
          </Tuile>
        </div>

      </div>
    </main>
  );
}
