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
import BoutonInstallerPWA from "@/components/BoutonInstallerPWA";
import CarteDemandeAnimateur, { type RDVEnAttente, type VisiteEnAttente } from "@/components/CarteDemandeAnimateur";
import TabsMembre from "@/components/TabsMembre";
import { type EvtHistorique } from "@/components/HistoriqueMembre";

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
      <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#3b82f6" />)}
    </svg>
  );
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

  // ── Historique complet (12 derniers mois, toutes activités) ───
  const il12mois = new Date(Date.now() - 365 * 86_400_000).toISOString();
  const [
    { data: histVisites },
    { data: histActions },
    { data: histRemontees },
    { data: histRDV },
  ] = await Promise.all([
    supabase.from("visites")
      .select("id, statut, date_realisee, date_prevue, objectif, points_cles, note_confiance, note_business")
      .eq("magasin_id", id)
      .or(`date_realisee.gte.${il12mois.slice(0,10)},date_prevue.gte.${il12mois.slice(0,10)}`)
      .order("date_realisee", { ascending: false, nullsFirst: false }),
    supabase.from("actions")
      .select("id, titre, description, statut, niveau_urgence, deadline, created_at")
      .eq("magasin_id", id)
      .gte("created_at", il12mois)
      .order("created_at", { ascending: false }),
    supabase.from("remontees")
      .select("id, titre, description, gravite, statut, source, type, photo_url, reponse_animateur, date_traitement, created_at")
      .eq("magasin_id", id)
      .gte("created_at", il12mois)
      .order("created_at", { ascending: false }),
    supabase.from("rendez_vous")
      .select("id, type, statut, date_souhaitee, heure_souhaitee, objet, message, lieu, lien_visio, demandeur_type, created_at")
      .eq("magasin_id", id)
      .gte("created_at", il12mois)
      .order("created_at", { ascending: false }),
  ]);

  const historique: EvtHistorique[] = [];

  for (const v of histVisites ?? []) {
    const date = v.date_realisee || v.date_prevue;
    if (!date) continue;
    const visite = v as { id: string; statut: string; date_realisee: string | null; date_prevue: string | null; objectif: string | null; points_cles: string | null; note_confiance: number | null; note_business: number | null };
    const isReal = visite.statut === "realisee";
    historique.push({
      id: visite.id,
      type: "visite",
      date,
      titre: visite.objectif || (isReal ? "Visite réalisée" : "Visite planifiée"),
      detail: isReal && (visite.note_confiance != null || visite.note_business != null)
        ? `Notes : ${visite.note_confiance ?? "—"}/5 conf · ${visite.note_business ?? "—"}/5 biz`
        : null,
      meta: isReal ? "Réalisée" : visite.statut === "planifiee" ? "Planifiée" : visite.statut,
      metaTon: isReal ? "ok" : visite.statut === "planifiee" ? "blue" : "slate",
      details: {
        statut: isReal ? "Réalisée" : visite.statut === "planifiee" ? "Planifiée" : visite.statut,
        noteConfiance: visite.note_confiance,
        noteBusiness: visite.note_business,
        pointsCles: visite.points_cles,
      },
    });
  }

  for (const a of histActions ?? []) {
    const action = a as { id: string; titre: string; description: string | null; statut: string; niveau_urgence: number; deadline: string | null; created_at: string };
    const labelStatut = action.statut === "ouverte" ? "Ouverte" : action.statut === "en_cours" ? "En cours" : action.statut === "terminee" ? "Terminée" : action.statut;
    const ton: EvtHistorique["metaTon"] = action.statut === "terminee" ? "ok" : action.niveau_urgence === 3 ? "red" : action.niveau_urgence === 2 ? "amber" : "slate";
    historique.push({
      id: action.id,
      type: "action",
      date: action.created_at,
      titre: action.titre,
      detail: action.deadline ? `Échéance ${new Date(action.deadline).toLocaleDateString("fr-FR")}` : null,
      meta: labelStatut,
      metaTon: ton,
      details: {
        description: action.description,
        statut: labelStatut,
        urgence: action.niveau_urgence,
        deadline: action.deadline,
      },
    });
  }

  for (const r of histRemontees ?? []) {
    const remontee = r as { id: string; titre: string; description: string | null; gravite: string; statut: string; source: string | null; type: string | null; photo_url: string | null; reponse_animateur: string | null; date_traitement: string | null; created_at: string };
    const ton: EvtHistorique["metaTon"] = remontee.gravite === "urgente" ? "red" : remontee.gravite === "attention" ? "amber" : "slate";
    historique.push({
      id: remontee.id,
      type: "remontee",
      date: remontee.created_at,
      titre: remontee.titre,
      detail: remontee.type ? `Type ${remontee.type.replace("_", " ")}` : null,
      meta: remontee.gravite.charAt(0).toUpperCase() + remontee.gravite.slice(1),
      metaTon: ton,
      details: {
        description: remontee.description,
        typeRemontee: remontee.type,
        gravite: remontee.gravite,
        statut: remontee.statut,
        source: remontee.source,
        photoUrl: remontee.photo_url,
        reponseAnimateur: remontee.reponse_animateur,
        dateTraitement: remontee.date_traitement,
      },
    });
  }

  for (const r of histRDV ?? []) {
    const rdv = r as { id: string; type: string; statut: string; date_souhaitee: string; heure_souhaitee: string | null; objet: string; message: string | null; lieu: string | null; lien_visio: string | null; demandeur_type: string; created_at: string };
    const typeIcons: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻" };
    const dateRDV = rdv.date_souhaitee;
    const labelStatut = rdv.statut === "confirme" ? "Confirmé" : rdv.statut === "annule" ? "Annulé" : rdv.statut === "fait" ? "Fait" : rdv.statut === "reporte" ? "Reporté" : "Demandé";
    const ton: EvtHistorique["metaTon"] = rdv.statut === "confirme" || rdv.statut === "fait" ? "ok" : rdv.statut === "annule" ? "red" : rdv.statut === "reporte" ? "amber" : "blue";
    historique.push({
      id: rdv.id,
      type: "rdv",
      date: dateRDV,
      titre: `${typeIcons[rdv.type] ?? "📅"} ${rdv.objet}`,
      detail: `${rdv.demandeur_type === "animateur" ? "Initié par animateur" : "Initié par magasin"}${rdv.heure_souhaitee ? ` · ${rdv.heure_souhaitee.slice(0, 5)}` : ""}`,
      meta: labelStatut,
      metaTon: ton,
      details: {
        typeRdv: rdv.type,
        statut: rdv.statut,
        demandeurType: rdv.demandeur_type,
        heureSouhaitee: rdv.heure_souhaitee,
        lieu: rdv.lieu,
        lienVisio: rdv.lien_visio,
        message: rdv.message,
      },
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 pb-28">
      <PersistRole role="membre" magasinId={id} />
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── HEADER COMPACT ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
          {meteo && (
            <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-center leading-tight">
                <div className="text-2xl leading-none">{meteo.emoji}</div>
                <div className="text-[10px] font-semibold text-slate-600 mt-0.5">{meteo.temp}°C</div>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">
              Bonne journée à {nomAffiche}&nbsp;!
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {magasin.ville}{magasin.region ? ` · ${magasin.region}` : ""}
              {meteo ? ` · ${meteo.libelle}` : ""}
            </p>
          </div>
        </div>

        {/* ── 1. ACTIONS RAPIDES (les 4 fonctions principales) ──── */}
        <ActionsMembre
          magasinId={id}
          animateurTel={animateurTel}
          animateurEmail={animateurEmail}
          magasinNom={nomAffiche}
          autresMagasins={(autresMagasins ?? []) as { id: string; nom: string; enseigne: string | null }[]}
        />

        {/* ── 2. VOTRE ACTIVITÉ (tabs unifiés juste après) ─────── */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Votre activité</h2>
          <TabsMembre
            actions={(actions ?? []) as { id: string; titre: string; niveau_urgence: number; statut: string; deadline: string | null; created_at: string; description: string | null; portee: string | null }[]}
            rdvs={(rdvData ?? []) as { id: string; type: string; date_souhaitee: string; heure_souhaitee: string | null; objet: string; statut: string; message: string | null; lieu: string | null; demandeur_type: string; created_at: string }[]}
            remontees={(remontees ?? []) as { id: string; titre: string; gravite: string; statut: string; created_at: string; description: string | null; photo_url: string | null; source: string | null; type: string | null }[]}
            visites={trois}
            historique={historique}
          />
        </div>

        {/* ── 3. DEMANDES DE L'ANIMATEUR (si présent) ──────────── */}
        {((rdvDemandesAnim ?? []).length > 0 || (visitesEnAttente ?? []).length > 0) && (() => {
          const nbTotal = (rdvDemandesAnim ?? []).length + (visitesEnAttente ?? []).length;
          const demandes = [
            ...(rdvDemandesAnim ?? []).map(r => ({ kind: "rdv" as const, ...r })),
            ...(visitesEnAttente ?? []).map(v => ({ kind: "visite" as const, ...v })),
          ];
          return (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-2xl border border-amber-200 p-4 space-y-3">
              <h2 className="text-xs font-semibold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                📥 Demandes de l&apos;animateur
                <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[10px] font-bold">{nbTotal}</span>
              </h2>
              <div className="space-y-2">
                {demandes.map((d) => (
                  <CarteDemandeAnimateur
                    key={`${d.kind}-${d.id}`}
                    demande={d as RDVEnAttente | VisiteEnAttente}
                    magasinId={id}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── 4. INDICATEURS (3 KPIs en row compacte) ──────────── */}
        <div id="indicateurs">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Vos indicateurs</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Confiance", val: moyCfn, color: "text-blue-600" },
              { label: "Business", val: moyBiz, color: "text-emerald-600" },
              { label: "Satisfaction", val: moySat, color: "text-purple-600" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 text-center">
                <div className={`text-xl font-bold ${val ? color : "text-slate-400"}`}>{val ? `${val}` : "—"}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">/ 5</div>
                <div className="text-[11px] font-medium text-slate-600 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. CHIFFRE D'AFFAIRES ────────────────────────────── */}
        <CAEvolution magasinId={id} anneeCourante={new Date().getFullYear()} />

        {/* ── 6. ÉVOLUTION SPARKLINE ──────────────────────────── */}
        {sparkNotes.length >= 2 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Évolution Confiance</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <Sparkline notes={sparkNotes} />
              </div>
              <div className="shrink-0 text-[11px] text-slate-400 space-y-0.5 leading-tight">
                <div>Min <strong className="text-slate-700">{Math.min(...sparkNotes)}</strong></div>
                <div>Max <strong className="text-slate-700">{Math.max(...sparkNotes)}</strong></div>
                <div>{sparkNotes.length} visites</div>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. ACTUALITÉS (mini cards horizontales) ────────── */}
        {newsList.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Actualités du réseau</h2>
              <Link href="/news" className="text-xs font-medium text-blue-600 hover:underline">
                Toutes →
              </Link>
            </div>
            <div className="space-y-2">
              {newsList.map((n) => (
                <CardNews key={n.id} news={n} compact />
              ))}
            </div>
          </div>
        )}

        {/* L'historique est désormais intégré dans le tab "Historique" de Votre activité ci-dessus */}

      </div>

      {/* ── BARRE DE NAV STICKY ─────────────────────────────────── */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center z-40 px-4">
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-xl border border-slate-200 px-4 py-2.5">
          <BoutonInstallerPWA />
          <BoutonChangerMagasin />
          <BoutonChangerRole />
        </div>
      </div>
    </main>
  );
}
