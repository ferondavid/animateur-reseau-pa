import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PersistRole from "@/components/PersistRole";
import BoutonChangerMagasin from "@/components/BoutonChangerMagasin";
import BoutonChangerRole from "@/components/BoutonChangerRole";
import ActionsMembre from "@/components/ActionsMembre";
import Link from "next/link";
import HeroNews from "@/components/HeroNews";
import CardNews from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import CAEvolution from "@/components/CAEvolution";
import { getParametreNumber } from "@/lib/parametres";
import BoutonInstallerPWA from "@/components/BoutonInstallerPWA";

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
  const W = 140, H = 48, pad = 6;
  const points = notes.map((n, i) => [
    pad + (i / (notes.length - 1)) * (W - 2 * pad),
    H - pad - ((n - 1) / 4) * (H - 2 * pad),
  ] as [number, number]);
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />)}
    </svg>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const RDV_TYPE_ICON: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻" };
const RDV_STATUT_BADGE: Record<string, string> = {
  demande: "bg-amber-100 text-amber-700",
  confirme: "bg-emerald-100 text-emerald-700",
  reporte: "bg-slate-100 text-slate-600",
  annule: "bg-red-100 text-red-600",
};
const URGENCE_COLOR: Record<number, string> = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-amber-100 text-amber-700",
  3: "bg-red-100 text-red-700",
};
const URGENCE_LABEL: Record<number, string> = { 1: "Info", 2: "Important", 3: "Urgent" };
const GRAVITE_BADGE: Record<string, string> = {
  normale: "bg-slate-100 text-slate-600",
  attention: "bg-amber-100 text-amber-700",
  urgente: "bg-red-100 text-red-700",
};

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
  ] = await Promise.all([
    supabase.from("magasins").select("id, nom, enseigne, ville, region, latitude, longitude, contact_telephone").eq("id", id).single(),
    supabase.from("visites").select("id, date_realisee, note_confiance, note_business, objectif, points_cles").eq("magasin_id", id).eq("statut", "realisee").order("date_realisee", { ascending: false }).limit(10),
    supabase.from("actions").select("id, titre, niveau_urgence, statut, deadline").eq("magasin_id", id).in("statut", ["ouverte", "en_cours"]).order("niveau_urgence", { ascending: false }),
    supabase.from("evaluations_visite").select("q6_satisfaction_globale, created_at").eq("magasin_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("remontees").select("id, titre, gravite, statut, created_at").eq("magasin_id", id).not("statut", "in", "(traitee,archivee)").order("created_at", { ascending: false }).limit(5),
    supabase.from("magasins").select("id, nom, enseigne").eq("statut", "actif").neq("id", id).order("nom"),
    supabase.from("rendez_vous").select("id, type, date_souhaitee, heure_souhaitee, objet, statut").eq("magasin_id", id).neq("statut", "fait").gte("date_souhaitee", today).order("date_souhaitee", { ascending: true }).limit(5).then(r => ({ data: r.data, error: r.error })),
    supabase.from("news").select("id, titre, contenu, image_url, type, auteur, epinglee, publie, date_publication").eq("publie", true).order("epinglee", { ascending: false }).order("date_publication", { ascending: false }).limit(nbNews).then(r => ({ data: r.data, error: r.error })),
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

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 pb-24">
      <PersistRole role="membre" magasinId={id} />
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header météo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {meteo ? `${meteo.emoji} ` : ""}Bonne journée à {nomAffiche}&nbsp;!
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {magasin.nom !== nomAffiche ? `${magasin.nom} · ` : ""}
            {magasin.ville}{magasin.region ? ` · ${magasin.region}` : ""}
          </p>
          {meteo && (
            <p className="mt-1.5 text-slate-700 text-sm font-medium">{meteo.temp}°C — {meteo.libelle}</p>
          )}
        </div>

        {/* CA annuel — juste sous la météo */}
        <CAEvolution magasinId={id} anneeCourante={new Date().getFullYear()} />

        {/* News réseau */}
        {(newsData ?? []).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Actualité du réseau</h2>
              <Link href="/news" className="text-xs font-medium text-blue-600 hover:underline">
                Toutes →
              </Link>
            </div>
            <HeroNews news={(newsData as NewsItem[])[0]} />
            {nbNews > 1 && (newsData as NewsItem[]).length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {(newsData as NewsItem[]).slice(1).map((n) => (
                  <CardNews key={n.id} news={n} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions rapides */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Actions rapides</h2>
          <ActionsMembre
            magasinId={id}
            animateurTel={animateurTel}
            animateurEmail={animateurEmail}
            magasinNom={nomAffiche}
            autresMagasins={(autresMagasins ?? []) as { id: string; nom: string; enseigne: string | null }[]}
          />
        </div>

        {/* Indicateurs */}
        <div id="indicateurs">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vos indicateurs</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Confiance moy.", val: moyCfn, sub: "3 dernières visites" },
              { label: "Business moy.", val: moyBiz, sub: "3 dernières visites" },
              { label: "Satisfaction", val: moySat, sub: "évaluations reçues" },
            ].map(({ label, val, sub }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-center">
                <div className="text-2xl font-bold text-slate-900">{val ? `${val}/5` : "—"}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
                <div className="text-xs text-slate-400">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières visites */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vos dernières visites</h2>
          {trois.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm shadow-sm">Aucune visite enregistrée.</div>
          ) : (
            <div className="space-y-3">
              {trois.map((v) => (
                <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-4">
                  <div className="shrink-0 text-slate-400 text-sm w-24">
                    {v.date_realisee ? new Date(v.date_realisee).toLocaleDateString("fr-FR") : "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{v.objectif ?? "Pas d'objectif renseigné"}</p>
                    {v.points_cles && <p className="text-xs text-slate-400 mt-0.5 truncate">{v.points_cles}</p>}
                  </div>
                  <div className="shrink-0 flex gap-3 text-xs text-slate-500">
                    {v.note_confiance != null && <span>Conf. <strong className="text-slate-700">{v.note_confiance}/5</strong></span>}
                    {v.note_business != null && <span>Biz. <strong className="text-slate-700">{v.note_business}/5</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions en cours */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vos actions en cours</h2>
          {(actions ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
              <p className="text-slate-400 text-sm">Rien en cours — tout est à jour ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(actions ?? []).map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${URGENCE_COLOR[a.niveau_urgence] ?? "bg-slate-100 text-slate-600"}`}>
                    {URGENCE_LABEL[a.niveau_urgence] ?? "—"}
                  </span>
                  <span className="flex-1 text-sm text-slate-800">{a.titre}</span>
                  {a.deadline && <span className="shrink-0 text-xs text-slate-400">{new Date(a.deadline).toLocaleDateString("fr-FR")}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Remontées actives */}
        {(remontees ?? []).length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vos remontées en cours</h2>
            <div className="space-y-2">
              {(remontees ?? []).map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${GRAVITE_BADGE[r.gravite] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.gravite.charAt(0).toUpperCase() + r.gravite.slice(1)}
                  </span>
                  <span className="flex-1 text-sm text-slate-800 truncate">{r.titre}</span>
                  <span className="shrink-0 text-xs text-slate-400">{r.statut}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prochains RDV */}
        <div>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vos prochains RDV</h2>
          {(rdvData ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
              <p className="text-slate-400 text-sm">Aucun RDV programmé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(rdvData ?? []).map((r: { id: string; type: string; date_souhaitee: string; heure_souhaitee: string | null; objet: string; statut: string }) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                  <span className="text-xl shrink-0">{RDV_TYPE_ICON[r.type] ?? "📅"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.objet}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.date_souhaitee).toLocaleDateString("fr-FR")}
                      {r.heure_souhaitee ? ` à ${r.heure_souhaitee.slice(0, 5)}` : ""}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${RDV_STATUT_BADGE[r.statut] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.statut.charAt(0).toUpperCase() + r.statut.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Évolution sparkline */}
        {sparkNotes.length >= 2 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Évolution — Confiance</h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-6">
              <Sparkline notes={sparkNotes} />
              <div className="text-xs text-slate-400 space-y-1">
                <div>Min : <strong className="text-slate-700">{Math.min(...sparkNotes)}/5</strong></div>
                <div>Max : <strong className="text-slate-700">{Math.max(...sparkNotes)}/5</strong></div>
                <div>{sparkNotes.length} visite{sparkNotes.length > 1 ? "s" : ""}</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Barre de nav sticky */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center z-40 px-4">
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-slate-200 px-5 py-3">
          <BoutonInstallerPWA />
          <BoutonChangerMagasin />
          <BoutonChangerRole />
        </div>
      </div>
    </main>
  );
}
