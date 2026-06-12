export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import BarreRapport from "@/components/BarreRapport";
import Link from "next/link";
import BoutonAccueil from "@/components/BoutonAccueil";
import { AlertTriangle } from "lucide-react";

// ─── Helpers date ─────────────────────────────────────────────────────────────

const MOIS_LONG = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function fmtLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function computePeriode(type: string, ref: string): {
  dateDebut: string;
  dateFin: string;
  libelle: string;
  refNormalisee: string;
} {
  const d = parseLocal(ref);

  if (type === "mois") {
    const debut = new Date(d.getFullYear(), d.getMonth(), 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const nom = MOIS_LONG[d.getMonth()];
    return {
      dateDebut: fmtLocal(debut),
      dateFin: fmtLocal(fin),
      libelle: `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ${d.getFullYear()}`,
      refNormalisee: fmtLocal(debut),
    };
  }

  // Semaine ISO : lundi → dimanche
  const dow = d.getDay(); // 0=dim
  const lundi = new Date(d);
  lundi.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  const dimanche = new Date(lundi);
  dimanche.setDate(lundi.getDate() + 6);

  let libelle: string;
  if (lundi.getMonth() === dimanche.getMonth()) {
    libelle = `Semaine du ${lundi.getDate()} au ${dimanche.getDate()} ${MOIS_LONG[dimanche.getMonth()]} ${dimanche.getFullYear()}`;
  } else {
    libelle = `Semaine du ${lundi.getDate()} ${MOIS_LONG[lundi.getMonth()]} au ${dimanche.getDate()} ${MOIS_LONG[dimanche.getMonth()]} ${dimanche.getFullYear()}`;
  }

  return {
    dateDebut: fmtLocal(lundi),
    dateFin: fmtLocal(dimanche),
    libelle,
    refNormalisee: fmtLocal(lundi),
  };
}

// ─── Helpers calcul ───────────────────────────────────────────────────────────

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function fmt1(n: number | null): string {
  return n !== null ? n.toFixed(1) : "—";
}

function couleurNote(n: number | null): string {
  if (n === null) return "#9A93AC";
  if (n >= 4) return "#0F8C68";
  if (n >= 3) return "#B07D14";
  return "#C0476E";
}

function fmtDuree(minutes: number): string {
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function fmtDate(iso: string): string {
  const d = parseLocal(iso.split("T")[0]);
  return `${d.getDate()} ${MOIS_LONG[d.getMonth()].slice(0, 4)}.`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RapportPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; ref?: string }>;
}) {
  const { type: rawType = "semaine", ref: rawRef } = await searchParams;
  const periodeType = rawType === "mois" ? "mois" : "semaine";
  const today = fmtLocal(new Date());
  const ref = rawRef ?? today;

  const { dateDebut, dateFin, libelle, refNormalisee } = computePeriode(periodeType, ref);

  const supabase = await createClient();

  // ── Magasins (scope complet) ──────────────────────────────────────────────
  const { data: magasinsData } = await supabase
    .from("magasins")
    .select("id, nom, enseigne, ville, region, statut")
    .in("statut", ["actif", "pause"])
    .order("nom");

  const magasins = magasinsData ?? [];
  const nbMagasinsActifs = magasins.length;
  const magasinMap = Object.fromEntries(magasins.map((m) => [m.id, m]));
  const safeIds = magasins.length > 0 ? magasins.map((m) => m.id) : ["_vide_"];

  // ── Requêtes parallèles ───────────────────────────────────────────────────
  const [
    r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12,
  ] = await Promise.all([
    // 1 — Visites réalisées dans la période
    supabase.from("visites")
      .select("id, date_realisee, magasin_id, note_confiance, note_business, duree_minutes")
      .in("magasin_id", safeIds).eq("statut", "realisee")
      .gte("date_realisee", dateDebut).lte("date_realisee", dateFin)
      .order("date_realisee", { ascending: false }),

    // 2 — Visites planifiées à venir
    supabase.from("visites")
      .select("id, date_prevue, magasin_id")
      .in("magasin_id", safeIds).eq("statut", "planifiee")
      .gte("date_prevue", today),

    // 3 — Visites all-time réalisées (score risque)
    supabase.from("visites")
      .select("id, date_realisee, magasin_id, note_confiance, note_business")
      .in("magasin_id", safeIds).eq("statut", "realisee")
      .order("date_realisee", { ascending: false }),

    // 4 — Remontées créées dans la période
    supabase.from("remontees")
      .select("id, titre, gravite, statut, created_at, magasin_id")
      .in("magasin_id", safeIds)
      .gte("created_at", dateDebut)
      .lte("created_at", dateFin + "T23:59:59"),

    // 5 — Remontées traitées dans la période
    supabase.from("remontees")
      .select("id, date_traitement, magasin_id")
      .in("magasin_id", safeIds)
      .gte("date_traitement" as "created_at", dateDebut)
      .lte("date_traitement" as "created_at", dateFin + "T23:59:59"),

    // 6 — Remontées urgentes non traitées (all-time)
    supabase.from("remontees")
      .select("id, titre, gravite, statut, created_at, magasin_id")
      .in("magasin_id", safeIds)
      .eq("gravite", "urgente")
      .not("statut", "in", "(traitee,archivee)"),

    // 7 — Actions créées dans la période
    supabase.from("actions")
      .select("id, titre, statut, niveau_urgence, portee, magasin_id, created_at")
      .in("magasin_id", safeIds)
      .gte("created_at", dateDebut)
      .lte("created_at", dateFin + "T23:59:59"),

    // 8 — Actions réalisées dans la période
    supabase.from("actions")
      .select("id, titre, statut, realise_le, magasin_id")
      .in("magasin_id", safeIds).eq("statut", "realisee")
      .gte("realise_le" as "created_at", dateDebut)
      .lte("realise_le" as "created_at", dateFin),

    // 9 — Actions urgentes ouvertes (scope magasins)
    supabase.from("actions")
      .select("id, titre, statut, niveau_urgence, portee, magasin_id")
      .in("magasin_id", safeIds).eq("niveau_urgence", 3)
      .in("statut", ["ouverte", "en_cours"]),

    // 10 — Actions urgentes ouvertes réseau
    supabase.from("actions")
      .select("id, titre, statut, niveau_urgence, portee")
      .eq("portee", "reseau").eq("niveau_urgence", 3)
      .in("statut", ["ouverte", "en_cours"]),

    // 11 — RDV confirmés + honorés dans la période
    supabase.from("rendez_vous")
      .select("id, type, statut, date_souhaitee, magasin_id")
      .in("magasin_id" as "statut", safeIds)
      .in("statut", ["confirme", "fait"])
      .gte("date_souhaitee" as "created_at", dateDebut)
      .lte("date_souhaitee" as "created_at", dateFin),

    // 12 — Évaluations dans la période
    supabase.from("evaluations_visite")
      .select("id, q6_satisfaction_globale, created_at, magasin_id")
      .in("magasin_id", safeIds)
      .gte("created_at", dateDebut)
      .lte("created_at", dateFin + "T23:59:59"),
  ]);

  // ── Données extraites ─────────────────────────────────────────────────────
  const visites       = r1.data  ?? [];
  const visitesPlan   = r2.data  ?? [];
  const visitesAT     = r3.data  ?? [];
  const remCreees     = r4.data  ?? [];
  const remTraitees   = r5.data  ?? [];
  const remUrgentes   = r6.data  ?? [];
  const actCreees     = r7.data  ?? [];
  const actRealisees  = r8.data  ?? [];
  const actUrgMag     = r9.data  ?? [];
  const actUrgRes     = r10.data ?? [];
  const rdvs          = r11.data ?? [];
  const evals         = r12.data ?? [];

  const actUrgentes = [...actUrgMag, ...actUrgRes];

  // ─── Section 1 : Visites ──────────────────────────────────────────────────
  const nbVisitesRealisees  = visites.length;
  const nbVisitesPlanifiees = visitesPlan.length;
  const magasinsCouverts    = new Set(visites.map((v) => v.magasin_id));
  const pctCouverture       = nbMagasinsActifs > 0
    ? Math.round((magasinsCouverts.size / nbMagasinsActifs) * 100)
    : 0;
  const dureeTotal = visites.reduce((s, v) => s + (v.duree_minutes ?? 0), 0);

  // ─── Section 2 : Remontées ────────────────────────────────────────────────
  const nbCreees          = remCreees.length;
  const nbTraitees        = remTraitees.length;
  const nbUrgentesOuvertes = remUrgentes.length;

  const gravite = { normale: 0, attention: 0, urgente: 0 };
  for (const r of remCreees) {
    if (r.gravite === "normale")   gravite.normale++;
    else if (r.gravite === "attention") gravite.attention++;
    else if (r.gravite === "urgente")   gravite.urgente++;
  }

  // ─── Section 3 : Actions & RDV ───────────────────────────────────────────
  const nbActCreees    = actCreees.length;
  const nbActRealisees = actRealisees.length;
  const nbActUrgentes  = actUrgentes.length;

  const rdvConfirmes = rdvs.filter((r) => r.statut === "confirme").length;
  const rdvHonores   = rdvs.filter((r) => r.statut === "fait").length;

  const rdvByType = { physique: 0, tel: 0, visio: 0 };
  for (const r of rdvs) {
    if      (r.type === "physique") rdvByType.physique++;
    else if (r.type === "tel")      rdvByType.tel++;
    else if (r.type === "visio")    rdvByType.visio++;
  }

  // ─── Section 4 : Satisfaction & risque ───────────────────────────────────
  const moySatisfaction = avg(
    evals.map((e) => e.q6_satisfaction_globale).filter((n): n is number => n !== null && n > 0)
  );
  const moyConfiance = avg(
    visites.map((v) => v.note_confiance).filter((n): n is number => n !== null && n > 0)
  );
  const moyBusiness = avg(
    visites.map((v) => v.note_business).filter((n): n is number => n !== null && n > 0)
  );

  // Top 3 / Flop 3 par confiance (période)
  const confianceMap = new Map<string, { sum: number; n: number }>();
  for (const v of visites) {
    if (v.note_confiance !== null && v.note_confiance > 0) {
      const ex = confianceMap.get(v.magasin_id) ?? { sum: 0, n: 0 };
      ex.sum += v.note_confiance;
      ex.n++;
      confianceMap.set(v.magasin_id, ex);
    }
  }
  const classement = magasins
    .filter((m) => confianceMap.has(m.id))
    .map((m) => {
      const { sum, n } = confianceMap.get(m.id)!;
      return { magasin: m, moy: sum / n };
    })
    .sort((a, b) => b.moy - a.moy);
  const top3  = classement.slice(0, 3);
  const flop3 = [...classement].reverse().slice(0, 3);

  // Score risque all-time (même logique que Pilotage)
  const derniereVisiteMap = new Map<
    string,
    { date_realisee: string | null; note_confiance: number | null; note_business: number | null }
  >();
  for (const v of visitesAT) {
    const ex = derniereVisiteMap.get(v.magasin_id);
    if (!ex || (v.date_realisee && v.date_realisee > (ex.date_realisee ?? ""))) {
      derniereVisiteMap.set(v.magasin_id, v);
    }
  }

  const urgentesParMagasin = new Map<string, number>();
  for (const r of remUrgentes) {
    urgentesParMagasin.set(r.magasin_id, (urgentesParMagasin.get(r.magasin_id) ?? 0) + 1);
  }

  type RisqueMagasin = {
    magasin: (typeof magasins)[0];
    score: number;
    niveauRisque: "eleve" | "modere";
    raisons: string[];
  };

  const maintenant = Date.now();
  const magasinsRisque: RisqueMagasin[] = [];

  for (const magasin of magasins) {
    const derVisite = derniereVisiteMap.get(magasin.id);
    const nbUrg = urgentesParMagasin.get(magasin.id) ?? 0;
    const raisons: string[] = [];
    let score = 0;

    if (!derVisite || !derVisite.date_realisee) {
      raisons.push("Jamais visité");
      score++;
    } else {
      const jours = Math.floor(
        (maintenant - new Date(derVisite.date_realisee).getTime()) / 86_400_000
      );
      if (jours > 90) {
        raisons.push(`Non visité depuis ${jours}j`);
        score++;
      }
    }

    if (derVisite) {
      const conf = derVisite.note_confiance;
      const biz  = derVisite.note_business;
      if ((conf !== null && conf < 3) || (biz !== null && biz < 3)) {
        const notes = [conf, biz].filter((n): n is number => n !== null);
        raisons.push(`Note faible (${(avg(notes) ?? 0).toFixed(1)}/5)`);
        score++;
      }
    }

    if (nbUrg > 0) {
      raisons.push(`${nbUrg} remontée${nbUrg > 1 ? "s" : ""} urgente${nbUrg > 1 ? "s" : ""} non traitée${nbUrg > 1 ? "s" : ""}`);
      score++;
    }

    if (score >= 1) {
      magasinsRisque.push({
        magasin,
        score,
        niveauRisque: score >= 2 ? "eleve" : "modere",
        raisons,
      });
    }
  }
  magasinsRisque.sort((a, b) => b.score - a.score);

  const dateGeneree = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

        {/* En-tête */}
        <div className="space-y-4">
          <div className="no-print"><BoutonAccueil /></div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
              >
                Rapport d&apos;activité réseau
              </h1>
              <p className="text-sm font-semibold mt-0.5" style={{ color: "#534AB7" }}>
                {libelle}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                Réseau Piscinistes Associés · {nbMagasinsActifs} magasin{nbMagasinsActifs !== 1 ? "s" : ""} actifs · généré le {dateGeneree}
              </p>
            </div>
          </div>

          <div className="no-print">
            <Navigation />
          </div>

          <BarreRapport
            type={periodeType}
            refDate={refNormalisee}
            libelle={libelle}
          />
        </div>

        {/* KPI synthèse */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Visites réalisées"
            valeur={String(nbVisitesRealisees)}
            sub={`${magasinsCouverts.size} magasin${magasinsCouverts.size !== 1 ? "s" : ""} couvert${magasinsCouverts.size !== 1 ? "s" : ""}`}
          />
          <KpiCard
            label="Couverture réseau"
            valeur={`${pctCouverture}%`}
            sub={`${magasinsCouverts.size} / ${nbMagasinsActifs}`}
          />
          <KpiCard
            label="Remontées créées"
            valeur={String(nbCreees)}
            sub={nbUrgentesOuvertes > 0 ? `${nbUrgentesOuvertes} urgente${nbUrgentesOuvertes > 1 ? "s" : ""} ouvertes` : "Aucune urgente"}
            subRouge={nbUrgentesOuvertes > 0}
          />
          <KpiCard
            label="Satisfaction moy."
            valeur={fmt1(moySatisfaction)}
            sub="/5"
          />
        </div>

        {/* ── Section 1 : Visites & tournées ── */}
        <section className="pa-card p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
            1. Visites &amp; tournées
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetriqueItem label="Visites réalisées"    valeur={String(nbVisitesRealisees)} />
            <MetriqueItem label="Planifiées à venir"   valeur={String(nbVisitesPlanifiees)} />
            <MetriqueItem label="Magasins couverts"    valeur={String(magasinsCouverts.size)} />
            <MetriqueItem label="Couverture réseau"    valeur={`${pctCouverture}%`} />
            <MetriqueItem label="Temps terrain total"  valeur={fmtDuree(dureeTotal)} />
          </div>

          {visites.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--pa-muted)" }}>
                Liste des visites réalisées
              </p>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--pa-line)" }}
              >
                {visites.map((v, idx) => {
                  const mag = magasinMap[v.magasin_id];
                  return (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                      style={{
                        background: idx % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(244,241,251,0.4)",
                        borderTop: idx > 0 ? "1px solid var(--pa-line)" : undefined,
                      }}
                    >
                      <span className="w-14 shrink-0 text-xs" style={{ color: "var(--pa-muted)" }}>
                        {v.date_realisee ? fmtDate(v.date_realisee) : "—"}
                      </span>
                      <span className="flex-1 font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                        {mag
                          ? (mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom)
                          : "—"}
                      </span>
                      {mag?.ville && (
                        <span className="text-xs shrink-0" style={{ color: "var(--pa-muted)" }}>
                          {mag.ville}
                        </span>
                      )}
                      {v.duree_minutes != null && v.duree_minutes > 0 && (
                        <span
                          className="text-xs shrink-0 px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "#E4F0FB", color: "#2D6FD0" }}
                        >
                          {v.duree_minutes}min
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {visites.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: "var(--pa-muted)" }}>
              Aucune visite réalisée sur cette période.
            </p>
          )}
        </section>

        {/* ── Section 2 : Remontées terrain ── */}
        <section className="pa-card p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
            2. Remontées terrain
          </h2>

          {nbUrgentesOuvertes > 0 && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: "#FBE0E8", border: "1px solid rgba(192,71,110,0.2)" }}
            >
              <AlertTriangle size={15} strokeWidth={2.5} style={{ color: "#C0476E", flexShrink: 0 }} />
              <span className="text-sm font-semibold" style={{ color: "#C0476E" }}>
                {nbUrgentesOuvertes} remontée{nbUrgentesOuvertes > 1 ? "s" : ""} urgente{nbUrgentesOuvertes > 1 ? "s" : ""} non traitée{nbUrgentesOuvertes > 1 ? "s" : ""} — à traiter en priorité
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetriqueItem label="Créées sur la période"   valeur={String(nbCreees)} />
            <MetriqueItem label="Traitées sur la période" valeur={String(nbTraitees)} />
            <MetriqueItem label="Urgentes ouvertes (all time)" valeur={String(nbUrgentesOuvertes)} rouge={nbUrgentesOuvertes > 0} />
          </div>

          {nbCreees > 0 && (
            <div className="flex flex-wrap gap-2">
              <BadgePill label="Normale"   count={gravite.normale}   bg="#ECEAF3" fg="#6F6982" />
              <BadgePill label="Attention" count={gravite.attention} bg="#FBF1D8" fg="#B07D14" />
              <BadgePill label="Urgente"   count={gravite.urgente}   bg="#FBE0E8" fg="#C0476E" />
            </div>
          )}

          {remUrgentes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#C0476E" }}>
                Urgentes non traitées
              </p>
              <div className="space-y-1.5">
                {remUrgentes.map((r) => {
                  const mag = magasinMap[r.magasin_id];
                  return (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ background: "#FBE0E8" }}
                    >
                      <AlertTriangle size={14} strokeWidth={2.5} style={{ color: "#C0476E", flexShrink: 0, marginTop: 2 }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "#C0476E" }}>{r.titre}</p>
                        <p className="text-xs" style={{ color: "#C0476E", opacity: 0.75 }}>
                          {mag ? (mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom) : "—"}
                          {r.created_at && ` · ${fmtDate(r.created_at)}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── Section 3 : Actions & RDV ── */}
        <section className="pa-card p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
            3. Actions &amp; rendez-vous
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetriqueItem label="Actions créées"          valeur={String(nbActCreees)} />
            <MetriqueItem label="Actions réalisées"        valeur={String(nbActRealisees)} />
            <MetriqueItem label="Actions urgentes ouvertes" valeur={String(nbActUrgentes)} rouge={nbActUrgentes > 0} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetriqueItem label="RDV confirmés" valeur={String(rdvConfirmes)} />
            <MetriqueItem label="RDV honorés"   valeur={String(rdvHonores)} />
            {rdvs.length > 0 && (
              <div
                className="rounded-xl p-3 flex flex-col gap-2"
                style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--pa-line)" }}
              >
                <p className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>Répartition RDV</p>
                <div className="flex flex-wrap gap-1.5">
                  <BadgePill label="Physique"    count={rdvByType.physique} bg="#D2F2E7" fg="#0F8C68" />
                  <BadgePill label="Tél."        count={rdvByType.tel}      bg="#E4F0FB" fg="#2D6FD0" />
                  <BadgePill label="Visio"       count={rdvByType.visio}    bg="#EDEBFB" fg="#6B4FD8" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 4 : Satisfaction & risque ── */}
        <section className="pa-card p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
            4. Satisfaction &amp; indicateurs de risque
          </h2>

          {/* Notes moyennes */}
          <div className="grid grid-cols-3 gap-3">
            <NoteCard label="Satisfaction" note={moySatisfaction} />
            <NoteCard label="Confiance"    note={moyConfiance} />
            <NoteCard label="Business"     note={moyBusiness} />
          </div>

          {/* Top 3 / Flop 3 confiance */}
          {classement.length >= 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {top3.length > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "#D2F2E7", border: "1px solid rgba(15,140,104,0.2)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#0F8C68" }}>
                    Top {top3.length} — Confiance
                  </p>
                  <ol className="space-y-2">
                    {top3.map((item, i) => (
                      <li key={item.magasin.id} className="flex items-center gap-3">
                        <span className="text-sm font-bold w-4 shrink-0" style={{ color: "#0F8C68", opacity: 0.5 }}>
                          {i + 1}.
                        </span>
                        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                          {item.magasin.enseigne
                            ? `${item.magasin.enseigne} — ${item.magasin.nom}`
                            : item.magasin.nom}
                        </span>
                        <span className="text-sm font-bold shrink-0" style={{ color: "#0F8C68" }}>
                          {item.moy.toFixed(1)}/5
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {flop3.length > 0 && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: "#FBE0E8", border: "1px solid rgba(192,71,110,0.2)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#C0476E" }}>
                    Flop {flop3.length} — Confiance
                  </p>
                  <ol className="space-y-2">
                    {flop3.map((item, i) => (
                      <li key={item.magasin.id} className="flex items-center gap-3">
                        <span className="text-sm font-bold w-4 shrink-0" style={{ color: "#C0476E", opacity: 0.5 }}>
                          {i + 1}.
                        </span>
                        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                          {item.magasin.enseigne
                            ? `${item.magasin.enseigne} — ${item.magasin.nom}`
                            : item.magasin.nom}
                        </span>
                        <span className="text-sm font-bold shrink-0" style={{ color: "#C0476E" }}>
                          {item.moy.toFixed(1)}/5
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Snapshot risque all-time */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5"
              style={{ color: "var(--pa-muted)" }}
            >
              <AlertTriangle size={13} strokeWidth={2.5} style={{ color: "#C0476E" }} />
              Snapshot magasins à risque (indicateurs all time)
            </p>
            {magasinsRisque.length === 0 ? (
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: "#D2F2E7", border: "1px solid rgba(15,140,104,0.2)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "#0F8C68" }}>
                  Aucun magasin à risque identifié.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {magasinsRisque.map(({ magasin, niveauRisque, raisons }) => (
                  <div
                    key={magasin.id}
                    className="pa-card p-3 flex items-start gap-3"
                    style={{ borderLeft: `4px solid ${niveauRisque === "eleve" ? "#E8809C" : "#E8B43A"}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                          style={
                            niveauRisque === "eleve"
                              ? { background: "#FBE0E8", color: "#C0476E" }
                              : { background: "#FBF1D8", color: "#B07D14" }
                          }
                        >
                          {niveauRisque === "eleve" ? "ÉLEVÉ" : "MODÉRÉ"}
                        </span>
                        <span className="font-semibold text-sm" style={{ color: "var(--pa-ink)" }}>
                          {magasin.enseigne ? `${magasin.enseigne} — ${magasin.nom}` : magasin.nom}
                        </span>
                        {magasin.ville && (
                          <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
                            {magasin.ville}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        {raisons.map((r, i) => (
                          <span key={i} className="text-xs" style={{ color: "var(--pa-muted)" }}>
                            · {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}

// ─── Composants locaux ────────────────────────────────────────────────────────

function KpiCard({
  label, valeur, sub, subRouge,
}: {
  label: string; valeur: string; sub?: string; subRouge?: boolean;
}) {
  return (
    <div className="pa-card p-4 flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wide leading-snug" style={{ color: "var(--pa-muted)" }}>
        {label}
      </span>
      <span className="text-3xl font-bold leading-none" style={{ color: "var(--pa-ink)" }}>
        {valeur}
      </span>
      {sub && (
        <span className="text-xs font-semibold" style={{ color: subRouge ? "#C0476E" : "var(--pa-muted)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}

function MetriqueItem({
  label, valeur, rouge,
}: {
  label: string; valeur: string; rouge?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--pa-line)" }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--pa-muted)" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: rouge ? "#C0476E" : "var(--pa-ink)" }}>
        {valeur}
      </p>
    </div>
  );
}

function NoteCard({ label, note }: { label: string; note: number | null }) {
  const bg = note === null
    ? "#F4F3F9"
    : note >= 4 ? "#D2F2E7"
    : note >= 3 ? "#FBF1D8"
    : "#FBE0E8";
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ background: bg, border: "1px solid var(--pa-line)" }}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--pa-muted)" }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color: couleurNote(note) }}>{fmt1(note)}</p>
      {note !== null && <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>/5</p>}
    </div>
  );
}

function BadgePill({
  label, count, bg, fg,
}: {
  label: string; count: number; bg: string; fg: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
      style={{ background: bg, color: fg }}
    >
      {label} <span className="font-bold">{count}</span>
    </span>
  );
}
