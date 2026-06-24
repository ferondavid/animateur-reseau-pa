import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PersistRole from "@/components/PersistRole";
import BoutonChangerMagasin from "@/components/BoutonChangerMagasin";
import BoutonChangerRole from "@/components/BoutonChangerRole";
import ActionsMembre from "@/components/ActionsMembre";
import Link from "next/link";
import CardNews from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import CAEvolution from "@/components/CAEvolution";
import { getParametreNumber } from "@/lib/parametres";
import { getVisibilite, peutVoir } from "@/lib/visibilite";
import BoutonInstallerPWA from "@/components/BoutonInstallerPWA";
import BoutonActiverNotifsAssoc from "@/components/BoutonActiverNotifsAssoc";
import CarteDemandeAnimateur, { type RDVEnAttente, type VisiteEnAttente } from "@/components/CarteDemandeAnimateur";
import TabsMembre from "@/components/TabsMembre";
import { type EvtHistorique } from "@/components/HistoriqueMembre";
import HeroMembre from "@/components/ui/HeroMembre";
import Tuile from "@/components/ui/Tuile";
import CountUp from "@/components/ui/CountUp";
import {
  Inbox, Activity, BarChart3, Coins, Newspaper,
} from "lucide-react";

// ─── Météo ────────────────────────────────────────────────────────────────────

type MeteoData = { temp: number; emoji: string; libelle: string };

function codeVersMeteo(code: number): { emoji: string; libelle: string } {
  if (code === 0) return { emoji: "☀️", libelle: "Ensoleillé" };
  if (code <= 3) return { emoji: "⛅", libelle: "Peu nuageux" };
  if (code <= 48) return { emoji: "🌫️", libelle: "Brouillard" };
  if (code <= 67) return { emoji: "🌧️", libelle: "Pluvieux" };
  if (code <= 77) return { emoji: "❄️", libelle: "Neigeux" };
  if (code <= 82) return { emoji: "🌦️", libelle: "Averses" };
  return { emoji: "⛈️", libelle: "Orageux" };
}

async function fetchMeteo(lat: number, lng: number): Promise<MeteoData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const json = await res.json();
    const temp = Math.round(json.current.temperature_2m);
    const { emoji, libelle } = codeVersMeteo(json.current.weather_code);
    return { temp, emoji, libelle };
  } catch { return null; }
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ notes }: { notes: number[] }) {
  if (notes.length < 2) return null;
  const W = 140, H = 40, pad = 4;
  const points = notes.map((n, i) => [
    pad + (i / (notes.length - 1)) * (W - 2 * pad),
    H - pad - ((n - 1) / 4) * (H - 2 * pad),
  ] as [number, number]);
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="h-10 overflow-visible">
      <path d={d} fill="none" stroke="#7C6BE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#7C6BE8" />)}
    </svg>
  );
}

// ─── Icon box helper ──────────────────────────────────────────────────────────

function IcoBox({ bg, color, Icon }: {
  bg: string;
  color: string;
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

// ─── Format CA ──────────────────────────────────────────────────────────────

function eur(v: number | null | undefined): string {
  return v == null ? "—" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function pct(v: number | null | undefined): string {
  return v == null ? "—" : `${Math.round(Number(v) * 100)}%`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FicheMembre({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const animateurTel = process.env.NEXT_PUBLIC_ANIMATEUR_TEL ?? "+33600000000";
  const animateurEmail = process.env.NEXT_PUBLIC_ANIMATEUR_EMAIL ?? "animateur@piscinistes-associes.fr";
  const nbNews = await getParametreNumber("nb_news_fiche_membre", 1);

  const [
    { data: magasin },
    { data: visites },
    { data: actions },
    { data: evaluations },
    { data: remontees },
    { data: autresMagasins },
    { data: rdvData },
    { data: newsData },
    { data: rdvDemandesAnim },
    { data: visitesEnAttente },
  ] = await Promise.all([
    supabase.from("magasins").select("id, nom, enseigne, ville, region, latitude, longitude, contact_telephone").eq("id", id).single(),
    supabase.from("visites").select("id, date_realisee, note_confiance, note_business, objectif, points_cles").eq("magasin_id", id).eq("statut", "realisee").order("date_realisee", { ascending: false }).limit(10),
    supabase.from("actions").select("id, titre, niveau_urgence, statut, deadline, created_at, description, portee").eq("magasin_id", id).in("statut", ["ouverte", "en_cours"]).order("niveau_urgence", { ascending: false }),
    supabase.from("evaluations_visite").select("q6_satisfaction_globale, created_at").eq("magasin_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("remontees").select("id, titre, gravite, statut, created_at, description, photo_url, source, type").eq("magasin_id", id).not("statut", "in", "(traitee,archivee)").order("created_at", { ascending: false }).limit(5),
    supabase.from("magasins").select("id, nom, enseigne").eq("statut", "actif").neq("id", id).order("nom"),
    supabase.from("rendez_vous").select("id, type, date_souhaitee, heure_souhaitee, objet, statut, message, lieu, demandeur_type, created_at").eq("magasin_id", id).neq("statut", "fait").gte("date_souhaitee", today).order("date_souhaitee", { ascending: true }).limit(5).then(r => ({ data: r.data, error: r.error })),
    supabase.from("news").select("id, titre, contenu, image_url, type, auteur, epinglee, publie, date_publication").eq("publie", true).order("epinglee", { ascending: false }).order("date_publication", { ascending: false }).limit(nbNews).then(r => ({ data: r.data, error: r.error })),
    supabase.from("rendez_vous").select("id, type, date_souhaitee, heure_souhaitee, objet, message").eq("magasin_id", id).eq("demandeur_type", "animateur").eq("statut", "demande").order("date_souhaitee", { ascending: true }).then(r => ({ data: r.data, error: r.error })),
    supabase.from("visites").select("id, date_prevue, objectif").eq("magasin_id", id).eq("statut", "planifiee").eq("accepte_par_membre", false).gte("date_prevue", today).order("date_prevue", { ascending: true }).then(r => ({ data: r.data, error: r.error })),
  ]);

  if (!magasin) notFound();

  // CA / BFA réel (table ca_bfa, snapshot fin mai 2026)
  const [{ data: caBfaRow }, { count: nbAssocies }] = await Promise.all([
    supabase.from("ca_bfa").select("ca_global, ca_leaders, pct_leaders, bfa_associe, rang_ca_leaders").eq("magasin_id", id).eq("periode", "fin mai 2026").maybeSingle(),
    supabase.from("ca_bfa").select("*", { count: "exact", head: true }).eq("periode", "fin mai 2026"),
  ]);
  const cb = caBfaRow as {
    ca_global: number | null; ca_leaders: number | null; pct_leaders: number | null;
    bfa_associe: number | null; rang_ca_leaders: number | null;
  } | null;

  // Règles de visibilité (sections affichées à l'associé)
  const vis = await getVisibilite();
  const voitNews = peutVoir(vis, "asso_news", "associe");
  const voitIndic = peutVoir(vis, "asso_indicateurs", "associe");
  const voitActivite = peutVoir(vis, "asso_activite", "associe");
  const voitCA = peutVoir(vis, "asso_ca", "associe");
  const voitMeteo = peutVoir(vis, "asso_meteo", "associe");
  const voitSparkline = peutVoir(vis, "asso_sparkline", "associe");
  const voitDemandes = peutVoir(vis, "asso_demandes", "associe");

  const meteo = magasin.latitude && magasin.longitude
    ? await fetchMeteo(Number(magasin.latitude), Number(magasin.longitude))
    : null;

  const dernieresVisites = visites ?? [];
  const trois = dernieresVisites.slice(0, 3);
  const moy = (arr: number[]) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
  const moyCfn = moy(trois.map(v => v.note_confiance).filter(Boolean) as number[]);
  const moyBiz = moy(trois.map(v => v.note_business).filter(Boolean) as number[]);
  const moySat = moy((evaluations ?? []).map(e => e.q6_satisfaction_globale).filter(Boolean) as number[]);
  const sparkNotes = [...dernieresVisites].reverse().map(v => v.note_confiance).filter(Boolean) as number[];
  const nomAffiche = magasin.enseigne ?? magasin.nom;
  const newsList = (newsData ?? []) as NewsItem[];

  // ── Historique complet (12 derniers mois) ──────────────────────────────────
  const il12mois = new Date(Date.now() - 365 * 86_400_000).toISOString();
  const [
    { data: histVisites },
    { data: histActions },
    { data: histRemontees },
    { data: histRDV },
    { data: visitesAVenirData },
  ] = await Promise.all([
    supabase.from("visites").select("id, statut, date_realisee, date_prevue, objectif, points_cles, note_confiance, note_business").eq("magasin_id", id).or(`date_realisee.gte.${il12mois.slice(0,10)},date_prevue.gte.${il12mois.slice(0,10)}`).order("date_realisee", { ascending: false, nullsFirst: false }),
    supabase.from("actions").select("id, titre, description, statut, niveau_urgence, deadline, created_at").eq("magasin_id", id).gte("created_at", il12mois).order("created_at", { ascending: false }),
    supabase.from("remontees").select("id, titre, description, gravite, statut, source, type, photo_url, reponse_animateur, date_traitement, created_at").eq("magasin_id", id).gte("created_at", il12mois).order("created_at", { ascending: false }),
    supabase.from("rendez_vous").select("id, type, statut, date_souhaitee, heure_souhaitee, objet, message, lieu, lien_visio, demandeur_type, created_at").eq("magasin_id", id).gte("created_at", il12mois).order("created_at", { ascending: false }),
    supabase.from("visites").select("id, date_prevue, objectif").eq("magasin_id", id).eq("statut", "planifiee").eq("accepte_par_membre", true).gte("date_prevue", today).order("date_prevue", { ascending: true }),
  ]);

  const historique: EvtHistorique[] = [];

  for (const v of histVisites ?? []) {
    const date = v.date_realisee || v.date_prevue;
    if (!date) continue;
    const visite = v as { id: string; statut: string; date_realisee: string | null; date_prevue: string | null; objectif: string | null; points_cles: string | null; note_confiance: number | null; note_business: number | null };
    const isReal = visite.statut === "realisee";
    historique.push({
      id: visite.id, type: "visite", date,
      titre: visite.objectif || (isReal ? "Visite réalisée" : "Visite planifiée"),
      detail: isReal && (visite.note_confiance != null || visite.note_business != null) ? `Notes : ${visite.note_confiance ?? "—"}/5 conf · ${visite.note_business ?? "—"}/5 biz` : null,
      meta: isReal ? "Réalisée" : visite.statut === "planifiee" ? "Planifiée" : visite.statut,
      metaTon: isReal ? "ok" : visite.statut === "planifiee" ? "blue" : "slate",
      details: { statut: isReal ? "Réalisée" : visite.statut === "planifiee" ? "Planifiée" : visite.statut, noteConfiance: visite.note_confiance, noteBusiness: visite.note_business, pointsCles: visite.points_cles },
    });
  }

  for (const a of histActions ?? []) {
    const action = a as { id: string; titre: string; description: string | null; statut: string; niveau_urgence: number; deadline: string | null; created_at: string };
    const labelStatut = action.statut === "ouverte" ? "Ouverte" : action.statut === "en_cours" ? "En cours" : action.statut === "terminee" ? "Terminée" : action.statut;
    const ton: EvtHistorique["metaTon"] = action.statut === "terminee" ? "ok" : action.niveau_urgence === 3 ? "red" : action.niveau_urgence === 2 ? "amber" : "slate";
    historique.push({ id: action.id, type: "action", date: action.created_at, titre: action.titre, detail: action.deadline ? `Échéance ${new Date(action.deadline).toLocaleDateString("fr-FR")}` : null, meta: labelStatut, metaTon: ton, details: { description: action.description, statut: labelStatut, urgence: action.niveau_urgence, deadline: action.deadline } });
  }

  for (const r of histRemontees ?? []) {
    const remontee = r as { id: string; titre: string; description: string | null; gravite: string; statut: string; source: string | null; type: string | null; photo_url: string | null; reponse_animateur: string | null; date_traitement: string | null; created_at: string };
    const ton: EvtHistorique["metaTon"] = remontee.gravite === "urgente" ? "red" : remontee.gravite === "attention" ? "amber" : "slate";
    historique.push({ id: remontee.id, type: "remontee", date: remontee.created_at, titre: remontee.titre, detail: remontee.type ? `Type ${remontee.type.replace("_", " ")}` : null, meta: remontee.gravite.charAt(0).toUpperCase() + remontee.gravite.slice(1), metaTon: ton, details: { description: remontee.description, typeRemontee: remontee.type, gravite: remontee.gravite, statut: remontee.statut, source: remontee.source, photoUrl: remontee.photo_url, reponseAnimateur: remontee.reponse_animateur, dateTraitement: remontee.date_traitement } });
  }

  for (const r of histRDV ?? []) {
    const rdv = r as { id: string; type: string; statut: string; date_souhaitee: string; heure_souhaitee: string | null; objet: string; message: string | null; lieu: string | null; lien_visio: string | null; demandeur_type: string; created_at: string };
    const typeIcons: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻" };
    const labelStatut = rdv.statut === "confirme" ? "Confirmé" : rdv.statut === "annule" ? "Annulé" : rdv.statut === "fait" ? "Fait" : rdv.statut === "reporte" ? "Reporté" : "Demandé";
    const ton: EvtHistorique["metaTon"] = rdv.statut === "confirme" || rdv.statut === "fait" ? "ok" : rdv.statut === "annule" ? "red" : rdv.statut === "reporte" ? "amber" : "blue";
    historique.push({ id: rdv.id, type: "rdv", date: rdv.date_souhaitee, titre: `${typeIcons[rdv.type] ?? "📅"} ${rdv.objet}`, detail: `${rdv.demandeur_type === "animateur" ? "Initié par animateur" : "Initié par magasin"}${rdv.heure_souhaitee ? ` · ${rdv.heure_souhaitee.slice(0, 5)}` : ""}`, meta: labelStatut, metaTon: ton, details: { typeRdv: rdv.type, statut: rdv.statut, demandeurType: rdv.demandeur_type, heureSouhaitee: rdv.heure_souhaitee, lieu: rdv.lieu, lienVisio: rdv.lien_visio, message: rdv.message } });
  }

  const nbDemandes = (rdvDemandesAnim?.length ?? 0) + (visitesEnAttente?.length ?? 0);
  const demandes = [
    ...(rdvDemandesAnim ?? []).map(r => ({ kind: "rdv" as const, ...r })),
    ...(visitesEnAttente ?? []).map(v => ({ kind: "visite" as const, ...v })),
  ];

  const kpis = [
    { label: "Confiance",     val: moyCfn, color: "#6B4FD8", bg: "linear-gradient(135deg,#E4DDFB,#D3C7F7)" },
    { label: "Business",      val: moyBiz, color: "#0F8C68", bg: "linear-gradient(135deg,#D2F2E7,#B5E9D5)" },
    { label: "Satisfaction",  val: moySat, color: "#2D6FD0", bg: "linear-gradient(135deg,#D9EAFB,#BFDBF7)" },
  ];

  return (
    <main className="min-h-screen p-4 pb-28">
      <PersistRole role="membre" magasinId={id} />
      <div className="max-w-lg mx-auto space-y-4">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="pa-reveal" style={{ animationDelay: ".06s" }}>
          <HeroMembre
            nomAffiche={nomAffiche}
            ville={magasin.ville}
            region={magasin.region}
            meteo={voitMeteo ? meteo : null}
            scoreConfiance={moyCfn ? parseFloat(moyCfn) : null}
          />
        </div>

        {/* ── Actions rapides ───────────────────────────────────────── */}
        <div className="pa-reveal" style={{ animationDelay: ".14s" }}>
          <ActionsMembre
            magasinId={id}
            animateurTel={animateurTel}
            animateurEmail={animateurEmail}
            magasinNom={nomAffiche}
            autresMagasins={(autresMagasins ?? []) as { id: string; nom: string; enseigne: string | null }[]}
          />
        </div>

        {/* ── Actualités ────────────────────────────────────────────── */}
        {voitNews && newsList.length > 0 && (
          <div className="pa-reveal" style={{ animationDelay: ".18s" }}>
            <Tuile
              icon={
                <IcoBox bg="linear-gradient(135deg,#F9DCE7,#F4C4D6)" color="#C04B72" Icon={Newspaper} />
              }
              titre="Actualités du réseau"
              sousTitre={`${newsList.length} publication${newsList.length > 1 ? "s" : ""}`}
            >
              <div className="space-y-2 pt-1">
                {newsList.map((n) => (
                  <CardNews key={n.id} news={n} compact />
                ))}
                <Link href="/news" className="block text-center text-[12px] font-semibold mt-2 py-1" style={{ color: "#6B4FD8" }}>
                  Toutes les actualités →
                </Link>
              </div>
            </Tuile>
          </div>
        )}

        {/* ── Demandes animateur ────────────────────────────────────── */}
        {voitDemandes && nbDemandes > 0 && (
          <div className="pa-reveal" style={{ animationDelay: ".22s" }}>
            <Tuile
              icon={
                <IcoBox bg="rgba(255,255,255,0.75)" color="#5B4FCB" Icon={Inbox} />
              }
              titre="Demandes de l'animateur"
              sousTitre={`${nbDemandes} en attente`}
              badge={nbDemandes}
              variantDemande
            >
              <div className="space-y-2 pt-1">
                {demandes.map((d) => (
                  <CarteDemandeAnimateur
                    key={`${d.kind}-${d.id}`}
                    demande={d as RDVEnAttente | VisiteEnAttente}
                    magasinId={id}
                  />
                ))}
              </div>
            </Tuile>
          </div>
        )}

        {/* ── Votre activité ────────────────────────────────────────── */}
        {voitActivite && (
        <div className="pa-reveal" style={{ animationDelay: ".26s" }}>
          <Tuile
            icon={
              <IcoBox bg="linear-gradient(135deg,#D9EAFB,#BFDBF7)" color="#2D6FD0" Icon={Activity} />
            }
            titre="Votre activité"
            sousTitre={`${historique.length} événements sur 12 mois`}
          >
            <TabsMembre
              actions={(actions ?? []) as { id: string; titre: string; niveau_urgence: number; statut: string; deadline: string | null; created_at: string; description: string | null; portee: string | null }[]}
              rdvs={(rdvData ?? []) as { id: string; type: string; date_souhaitee: string; heure_souhaitee: string | null; objet: string; statut: string; message: string | null; lieu: string | null; demandeur_type: string; created_at: string }[]}
              remontees={(remontees ?? []) as { id: string; titre: string; gravite: string; statut: string; created_at: string; description: string | null; photo_url: string | null; source: string | null; type: string | null }[]}
              visites={trois}
              visitesAVenir={(visitesAVenirData ?? []) as { id: string; date_prevue: string; objectif: string | null }[]}
              historique={historique}
            />
          </Tuile>
        </div>
        )}

        {/* ── Indicateurs KPI ───────────────────────────────────────── */}
        {voitIndic && (
        <div className="pa-reveal" id="indicateurs" style={{ animationDelay: ".32s" }}>
          <Tuile
            icon={
              <IcoBox bg="linear-gradient(135deg,#E4DDFB,#D3C7F7)" color="#6B4FD8" Icon={BarChart3} />
            }
            titre="Vos indicateurs"
            sousTitre="3 dernières visites"
          >
            <div className="grid grid-cols-3 gap-2 pt-2">
              {kpis.map(({ label, val, color, bg }) => (
                <div
                  key={label}
                  className="rounded-2xl p-3 text-center"
                  style={{ background: bg }}
                >
                  <div className="text-xl font-extrabold" style={{ color, letterSpacing: "-0.4px" }}>
                    {val ? <CountUp to={parseFloat(val)} decimals={1} delay={500} /> : <span style={{ color: "var(--pa-muted)" }}>—</span>}
                    {val && <small className="text-[11px] font-medium" style={{ color: "var(--pa-muted)" }}>/5</small>}
                  </div>
                  <div className="text-[11px] font-semibold mt-1" style={{ color: "var(--pa-muted)" }}>{label}</div>
                </div>
              ))}
            </div>
          </Tuile>
        </div>
        )}

        {/* ── Chiffre d'affaires ────────────────────────────────────── */}
        {voitCA && (
        <div className="pa-reveal" style={{ animationDelay: ".36s" }}>
          <Tuile
            icon={
              <IcoBox bg="linear-gradient(135deg,#D2F2E7,#B5E9D5)" color="#0F8C68" Icon={Coins} />
            }
            titre="Chiffre d'affaires"
            sousTitre={cb ? "Cumul fin mai 2026" : "Évolution annuelle"}
          >
            <div className="pt-1 space-y-3">
              {cb && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl p-3" style={{ background: "#F4F1FB" }}>
                      <p className="text-[11px]" style={{ color: "var(--pa-muted)" }}>CA global</p>
                      <p className="text-lg font-extrabold" style={{ color: "var(--pa-ink)" }}>{eur(cb.ca_global)}</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: "#EDEBFB" }}>
                      <p className="text-[11px]" style={{ color: "var(--pa-muted)" }}>CA Leaders ({pct(cb.pct_leaders)})</p>
                      <p className="text-lg font-extrabold" style={{ color: "#6B4FD8" }}>{eur(cb.ca_leaders)}</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: "#D2F2E7" }}>
                      <p className="text-[11px]" style={{ color: "var(--pa-muted)" }}>BFA</p>
                      <p className="text-lg font-extrabold" style={{ color: "#0F8C68" }}>{eur(cb.bfa_associe)}</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: "#FBF1D8" }}>
                      <p className="text-[11px]" style={{ color: "var(--pa-muted)" }}>Classement CA Leaders</p>
                      <p className="text-lg font-extrabold" style={{ color: "#B07D14" }}>
                        #{cb.rang_ca_leaders ?? "—"}
                        <span className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}> / {nbAssocies ?? 40}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
              <CAEvolution magasinId={id} anneeCourante={new Date().getFullYear()} />
            </div>
          </Tuile>
        </div>
        )}

        {/* ── Sparkline confiance ───────────────────────────────────── */}
        {voitSparkline && sparkNotes.length >= 2 && (
          <div className="pa-reveal pa-card p-4" style={{ animationDelay: ".40s" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--pa-muted)" }}>
              Évolution Confiance
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <Sparkline notes={sparkNotes} />
              </div>
              <div className="shrink-0 text-[11px] space-y-0.5 leading-tight" style={{ color: "var(--pa-muted)" }}>
                <div>Min <strong style={{ color: "var(--pa-ink)" }}>{Math.min(...sparkNotes)}</strong></div>
                <div>Max <strong style={{ color: "var(--pa-ink)" }}>{Math.max(...sparkNotes)}</strong></div>
                <div>{sparkNotes.length} visites</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Barre de nav sticky glassmorphism ──────────────────────── */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center z-40 px-4">
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 8px 30px -10px rgba(80,60,140,0.25)",
          }}
        >
          <BoutonInstallerPWA />
          <BoutonActiverNotifsAssoc magasinId={id} />
          <BoutonChangerMagasin />
          <BoutonChangerRole />
        </div>
      </div>
    </main>
  );
}
