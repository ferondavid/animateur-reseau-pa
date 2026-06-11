import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import FiltresPilotage from "@/components/FiltresPilotage";
import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avg(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function fmt1(n: number | null): string {
  return n !== null ? n.toFixed(1) : "—";
}

/** Couleur texte (hex) selon la note (1-5) */
function couleurNote(n: number | null): string {
  if (n === null) return "#9A93AC";
  if (n >= 4) return "#0F8C68";
  if (n >= 3) return "#B07D14";
  return "#C0476E";
}

/** Bg + border (inline style) selon la note */
function bgNote(n: number | null): { background: string; border: string } {
  if (n === null) return { background: "#F4F3F9", border: "1px solid #E6E3F0" };
  if (n >= 4) return { background: "#D2F2E7", border: "1px solid rgba(31,169,138,.25)" };
  if (n >= 3) return { background: "#FBF1D8", border: "1px solid rgba(176,125,20,.25)" };
  return { background: "#FBE0E8", border: "1px solid rgba(192,71,110,.25)" };
}

// Badges pastel pour la timeline d'activité
const BADGE_VISITE = { bg: "#D2F2E7", fg: "#0F8C68" };
const BADGE_REMONTEE = { bg: "#FBF1D8", fg: "#B07D14" };
const BADGE_EVAL = { bg: "#FBF3D8", fg: "#A88A1E" };
const BADGE_ACTION = { bg: "#E4F0FB", fg: "#2D6FD0" };

/** Calcule la date de début selon la période choisie */
function computeDateFrom(periode: string): string | null {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (periode === "mois")
    return fmt(new Date(now.getFullYear(), now.getMonth(), 1));
  if (periode === "trimestre")
    return fmt(
      new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    );
  if (periode === "annee") return fmt(new Date(now.getFullYear(), 0, 1));
  return null; // 'tout' → pas de filtre date
}

function libelleperiode(p: string): string {
  const m: Record<string, string> = {
    mois: "ce mois",
    trimestre: "les 3 derniers mois",
    annee: "cette année",
    tout: "toutes les données",
  };
  return m[p] ?? p;
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default async function PilotagePage({
  searchParams,
}: {
  searchParams: Promise<{
    periode?: string;
    niveau?: string;
    region?: string;
    magasin_id?: string;
  }>;
}) {
  const { periode = "trimestre", niveau = "tous", region = "toutes", magasin_id = "" } =
    await searchParams;

  const supabase = await createClient();
  const dateFrom = computeDateFrom(periode);
  const today = new Date().toISOString().split("T")[0];

  // ── Phase 1 : données pour les sélecteurs (régions + liste magasins) ──────
  const [{ data: toutesRegionsRaw }, { data: tousMagasins }] =
    await Promise.all([
      supabase
        .from("magasins")
        .select("region")
        .in("statut", ["actif", "pause"])
        .not("region", "is", null),
      supabase
        .from("magasins")
        .select("id, nom, enseigne")
        .in("statut", ["actif", "pause"])
        .order("nom"),
    ]);

  const regions = [
    ...new Set(
      (toutesRegionsRaw ?? [])
        .map((m) => m.region as string)
        .filter(Boolean)
    ),
  ].sort();

  // ── Phase 2 : scope magasins (filtré par niveau/région/magasin) ──────────
  // Note : le filtre 'niveau' requiert une colonne 'niveau' dans la table magasins
  // (valeurs : 'strategique', 'standard', 'observation'). Ignoré si la colonne n'existe pas.
  let qScope = supabase
    .from("magasins")
    .select("id, nom, enseigne, ville, region, statut")
    .in("statut", ["actif", "pause"]);

  if (niveau !== "tous") qScope = qScope.eq("niveau" as "statut", niveau);
  if (region !== "toutes") qScope = qScope.eq("region", region);
  if (magasin_id) qScope = qScope.eq("id", magasin_id);

  const { data: magasinsScope, error: errScope } = await qScope;

  // Si filtre niveau échoue (colonne inexistante), on refetch sans ce filtre
  const scopeData =
    errScope && niveau !== "tous"
      ? (await supabase
          .from("magasins")
          .select("id, nom, enseigne, ville, region, statut")
          .in("statut", ["actif", "pause"])
          .then((r) => r.data)) ?? []
      : (magasinsScope ?? []);

  const scopeIds = scopeData.map((m) => m.id);
  const nbMagasinsScope = scopeIds.length;

  // ── Phase 3 : données agrégées en parallèle ──────────────────────────────
  // Optimisation future possible : utiliser des vues SQL pour last_visit_per_magasin
  // et risk_score_per_magasin afin d'éviter de rapatrier toutes les visites en JS.

  const qVisitesTout = (() => {
    // Toutes les visites réalisées du scope (all-time) : pour le score risque
    return supabase
      .from("visites")
      .select("id, date_realisee, magasin_id, note_confiance, note_business")
      .in("magasin_id", scopeIds.length > 0 ? scopeIds : ["_vide_"])
      .eq("statut", "realisee")
      .order("date_realisee", { ascending: false });
  })();

  const qVisitesPlan = (() => {
    return supabase
      .from("visites")
      .select("id, date_prevue, magasin_id")
      .in("magasin_id", scopeIds.length > 0 ? scopeIds : ["_vide_"])
      .eq("statut", "planifiee")
      .gte("date_prevue", today);
  })();

  const qRemontees = (() => {
    let q = supabase
      .from("remontees")
      .select("id, titre, gravite, statut, created_at, magasin_id")
      .in("magasin_id", scopeIds.length > 0 ? scopeIds : ["_vide_"]);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    return q;
  })();

  const qRemonteesUrgentes = (() => {
    // Urgentes non traitées (all-time) pour le score risque
    return supabase
      .from("remontees")
      .select("id, magasin_id, titre, created_at")
      .in("magasin_id", scopeIds.length > 0 ? scopeIds : ["_vide_"])
      .eq("gravite", "urgente")
      .not("statut", "in", "(traitee,archivee)");
  })();

  const qActionsOuvertes = (() => {
    return supabase
      .from("actions")
      .select("id, titre, statut, niveau_urgence, magasin_id, portee")
      .in("magasin_id", scopeIds.length > 0 ? scopeIds : ["_vide_"])
      .in("statut", ["ouverte", "en_cours"]);
  })();

  const qActionsReseauOuvertes = (() => {
    // Actions réseau (sans magasin) ouvertes — incluses dans le total
    return supabase
      .from("actions")
      .select("id, niveau_urgence, statut, portee")
      .eq("portee", "reseau")
      .in("statut", ["ouverte", "en_cours"]);
  })();

  const qEvals = (() => {
    let q = supabase
      .from("evaluations_visite")
      .select(
        "id, q6_satisfaction_globale, created_at, magasin_id, visite_id"
      )
      .in("magasin_id", scopeIds.length > 0 ? scopeIds : ["_vide_"]);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    return q;
  })();

  const qActionsRecentes = (() => {
    // Actions créées dans la période — pour la timeline d'activité
    let q = supabase
      .from("actions")
      .select("id, titre, statut, created_at, magasin_id, portee")
      .in("magasin_id", scopeIds.length > 0 ? scopeIds : ["_vide_"]);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    return q.order("created_at", { ascending: false }).limit(20);
  })();

  const [
    { data: visitesAllTime },
    { data: visitesPlanifiees },
    { data: remonteesScope },
    { data: remonteesUrgentes },
    { data: actionsOuvertesMagasins },
    { data: actionsOuvertesReseau },
    { data: evaluationsScope },
    { data: actionsRecentes },
  ] = await Promise.all([
    qVisitesTout,
    qVisitesPlan,
    qRemontees,
    qRemonteesUrgentes,
    qActionsOuvertes,
    qActionsReseauOuvertes,
    qEvals,
    qActionsRecentes,
  ]);

  // ── Agrégations ──────────────────────────────────────────────────────────

  // Filtre période sur les visites (pour métriques)
  const visitesRealisees = (visitesAllTime ?? []).filter(
    (v) => !dateFrom || (v.date_realisee && v.date_realisee >= dateFrom)
  );

  // Santé réseau : moyennes sur la période
  const moyConfiance = avg(
    visitesRealisees
      .map((v) => v.note_confiance)
      .filter((n): n is number => n !== null && n > 0)
  );
  const moyBusiness = avg(
    visitesRealisees
      .map((v) => v.note_business)
      .filter((n): n is number => n !== null && n > 0)
  );
  const moySatisfaction = avg(
    (evaluationsScope ?? [])
      .map((e) => e.q6_satisfaction_globale)
      .filter((n): n is number => n !== null && n > 0)
  );

  // Métriques clés
  const nbVisitesRealisees = visitesRealisees.length;
  const nbVisitesPlanifiees = (visitesPlanifiees ?? []).length;
  const magasinsVisitesSurPeriode = new Set(
    visitesRealisees.map((v) => v.magasin_id)
  ).size;
  const pctVisites =
    nbMagasinsScope > 0
      ? Math.round((magasinsVisitesSurPeriode / nbMagasinsScope) * 100)
      : 0;
  const nbRemontees = (remonteesScope ?? []).length;
  const nbUrgentesNonTraitees = (remonteesUrgentes ?? []).length;
  const actionsOuvertesTot = [
    ...(actionsOuvertesMagasins ?? []),
    ...(actionsOuvertesReseau ?? []),
  ];
  const nbActionsOuvertes = actionsOuvertesTot.length;
  const nbActionsUrgentes = actionsOuvertesTot.filter(
    (a) => a.niveau_urgence === 3
  ).length;
  const nbEvaluations = (evaluationsScope ?? []).length;

  // ── Score risque par magasin ──────────────────────────────────────────────

  // Map magasin_id → visite la plus récente (all time)
  const derniereVisiteMap = new Map<
    string,
    { date_realisee: string; note_confiance: number | null; note_business: number | null }
  >();
  for (const v of visitesAllTime ?? []) {
    const ex = derniereVisiteMap.get(v.magasin_id);
    if (!ex || (v.date_realisee && v.date_realisee > (ex.date_realisee ?? ""))) {
      derniereVisiteMap.set(v.magasin_id, v);
    }
  }

  // Map magasin_id → nb remontées urgentes non traitées
  const urgentesParMagasin = new Map<string, number>();
  for (const r of remonteesUrgentes ?? []) {
    urgentesParMagasin.set(r.magasin_id, (urgentesParMagasin.get(r.magasin_id) ?? 0) + 1);
  }

  type RisqueMagasin = {
    magasin: (typeof scopeData)[0];
    score: number;
    niveauRisque: "eleve" | "modere";
    raisons: string[];
    joursSansVisite: number | null;
  };

  const maintenant = Date.now();
  const magasinsRisque: RisqueMagasin[] = [];

  for (const magasin of scopeData) {
    const derVisite = derniereVisiteMap.get(magasin.id);
    const nbUrg = urgentesParMagasin.get(magasin.id) ?? 0;
    const raisons: string[] = [];
    let score = 0;
    let joursSansVisite: number | null = null;

    // Critère a — Pas visité depuis > 90 jours (ou jamais)
    if (!derVisite || !derVisite.date_realisee) {
      raisons.push("Jamais visité");
      score++;
    } else {
      const jours = Math.floor(
        (maintenant - new Date(derVisite.date_realisee).getTime()) / 86_400_000
      );
      joursSansVisite = jours;
      if (jours > 90) {
        raisons.push(`Non visité depuis ${jours} jours`);
        score++;
      }
    }

    // Critère b — Note basse sur la dernière visite
    if (derVisite) {
      const conf = derVisite.note_confiance;
      const biz = derVisite.note_business;
      const notesBasses = (conf !== null && conf < 3) || (biz !== null && biz < 3);
      if (notesBasses) {
        const notes = [conf, biz].filter((n): n is number => n !== null);
        const moy = avg(notes) ?? 0;
        raisons.push(`Note faible (${moy.toFixed(1)}/5)`);
        score++;
      }
    }

    // Critère c — Remontée(s) urgente(s) non traitée(s)
    if (nbUrg > 0) {
      raisons.push(
        `${nbUrg} remontée${nbUrg > 1 ? "s" : ""} urgente${nbUrg > 1 ? "s" : ""} non traitée${nbUrg > 1 ? "s" : ""}`
      );
      score++;
    }

    if (score >= 1) {
      magasinsRisque.push({
        magasin,
        score,
        niveauRisque: score >= 2 ? "eleve" : "modere",
        raisons,
        joursSansVisite,
      });
    }
  }

  // Tri : risque décroissant, puis jours sans visite décroissant
  magasinsRisque.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ja = a.joursSansVisite ?? Infinity;
    const jb = b.joursSansVisite ?? Infinity;
    return jb - ja;
  });

  // ── Timeline d'activité ───────────────────────────────────────────────────

  const magasinMap = Object.fromEntries(scopeData.map((m) => [m.id, m]));

  type Evt = {
    id: string;
    date: string;
    label: string;
    sousTitre: string;
    href: string;
    badgeLabel: string;
    badge: { bg: string; fg: string };
  };

  const evenements: Evt[] = [
    ...visitesRealisees.map((v) => ({
      id: `v-${v.id}`,
      date: v.date_realisee ?? "",
      label: "Visite réalisée",
      sousTitre:
        `${magasinMap[v.magasin_id]?.enseigne ? magasinMap[v.magasin_id].enseigne + " — " : ""}${magasinMap[v.magasin_id]?.nom ?? "—"}`,
      href: `/visites/${v.id}`,
      badgeLabel: "Visite",
      badge: BADGE_VISITE,
    })),
    ...(remonteesScope ?? []).map((r) => ({
      id: `r-${r.id}`,
      date: r.created_at,
      label: r.titre,
      sousTitre:
        `${magasinMap[r.magasin_id]?.enseigne ? magasinMap[r.magasin_id].enseigne + " — " : ""}${magasinMap[r.magasin_id]?.nom ?? "—"}`,
      href: `/remontees/${r.id}`,
      badgeLabel: "Remontée",
      badge: BADGE_REMONTEE,
    })),
    ...(evaluationsScope ?? []).map((e) => ({
      id: `e-${e.id}`,
      date: e.created_at,
      label: `Évaluation${e.q6_satisfaction_globale ? ` · ${e.q6_satisfaction_globale}/5` : ""}`,
      sousTitre:
        `${magasinMap[e.magasin_id]?.enseigne ? magasinMap[e.magasin_id].enseigne + " — " : ""}${magasinMap[e.magasin_id]?.nom ?? "—"}`,
      href: `/evaluations/${e.visite_id ?? e.id}`,
      badgeLabel: "Évaluation",
      badge: BADGE_EVAL,
    })),
    ...(actionsRecentes ?? []).map((a) => ({
      id: `a-${a.id}`,
      date: a.created_at,
      label: a.titre,
      sousTitre: a.magasin_id
        ? `${magasinMap[a.magasin_id]?.enseigne ? magasinMap[a.magasin_id].enseigne + " — " : ""}${magasinMap[a.magasin_id]?.nom ?? "—"}`
        : "Réseau",
      href: `/actions-reseau/${a.id}`,
      badgeLabel: "Action",
      badge: BADGE_ACTION,
    })),
  ]
    .filter((e) => e.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  // ── Top 3 / Flop 3 par note de confiance ─────────────────────────────────

  const confianceParMagasin = new Map<string, { sum: number; n: number }>();
  for (const v of visitesRealisees) {
    if (v.note_confiance !== null && v.note_confiance > 0) {
      const ex = confianceParMagasin.get(v.magasin_id) ?? { sum: 0, n: 0 };
      ex.sum += v.note_confiance;
      ex.n++;
      confianceParMagasin.set(v.magasin_id, ex);
    }
  }

  const classementConfiance = scopeData
    .filter((m) => confianceParMagasin.has(m.id))
    .map((m) => {
      const { sum, n } = confianceParMagasin.get(m.id)!;
      return { magasin: m, moy: sum / n };
    })
    .sort((a, b) => b.moy - a.moy);

  const top3 = classementConfiance.slice(0, 3);
  const flop3 = [...classementConfiance].reverse().slice(0, 3);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* En-tête */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
                Pilotage réseau
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
                {nbMagasinsScope} magasin{nbMagasinsScope !== 1 ? "s" : ""} ·{" "}
                {libelleperiode(periode)}
              </p>
            </div>
          </div>
          <Navigation />
          {/* FiltresPilotage utilise useSearchParams → Suspense recommandé */}
          <Suspense
            fallback={
              <div className="h-16 rounded-xl pa-card animate-pulse" />
            }
          >
            <FiltresPilotage
              regions={regions}
              magasins={tousMagasins ?? []}
            />
          </Suspense>
        </div>

        {/* ── Bandeau Santé réseau ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--pa-muted)" }}>
            Santé réseau
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <CardSante
              label="Confiance"
              valeur={fmt1(moyConfiance)}
              note={moyConfiance}
            />
            <CardSante
              label="Business"
              valeur={fmt1(moyBusiness)}
              note={moyBusiness}
            />
            <CardSante
              label="Satisfaction"
              valeur={fmt1(moySatisfaction)}
              note={moySatisfaction}
            />
          </div>
        </section>

        {/* ── Métriques clés ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--pa-muted)" }}>
            Métriques clés
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <CardKpi
              label="Visites réalisées"
              valeur={String(nbVisitesRealisees)}
              sub={
                nbVisitesPlanifiees > 0
                  ? `+ ${nbVisitesPlanifiees} planifiée${nbVisitesPlanifiees > 1 ? "s" : ""}`
                  : undefined
              }
              href="/visites"
            />
            <CardKpi
              label="Magasins visités"
              valeur={`${pctVisites} %`}
              sub={`${magasinsVisitesSurPeriode} / ${nbMagasinsScope}`}
              href="/magasins"
            />
            <CardKpi
              label="Remontées"
              valeur={String(nbRemontees)}
              sub={
                nbUrgentesNonTraitees > 0
                  ? `⚠️ ${nbUrgentesNonTraitees} urgente${nbUrgentesNonTraitees > 1 ? "s" : ""} non traitée${nbUrgentesNonTraitees > 1 ? "s" : ""}`
                  : "Aucune urgente"
              }
              subRouge={nbUrgentesNonTraitees > 0}
              href="/remontees"
            />
            <CardKpi
              label="Actions ouvertes"
              valeur={String(nbActionsOuvertes)}
              sub={
                nbActionsUrgentes > 0
                  ? `dont ${nbActionsUrgentes} urgente${nbActionsUrgentes > 1 ? "s" : ""}`
                  : "Aucune urgente"
              }
              subRouge={nbActionsUrgentes > 0}
              href="/actions-reseau"
            />
            <CardKpi
              label="Évaluations reçues"
              valeur={String(nbEvaluations)}
              href="/evaluations"
            />
          </div>
        </section>

        {/* ── Magasins à risque ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
            <AlertTriangle size={13} strokeWidth={2.5} style={{ color: "#C0476E" }} /> Magasins à risque
          </h2>

          {magasinsRisque.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "#D2F2E7", border: "1px solid rgba(31,169,138,.25)" }}>
              <p className="font-semibold" style={{ color: "#0F8C68" }}>
                Aucun magasin à risque sur ce périmètre 👍
              </p>
              <p className="text-sm mt-1" style={{ color: "#1A9E78" }}>
                Tous les indicateurs sont au vert.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {magasinsRisque.map(({ magasin, niveauRisque, raisons }) => (
                <div
                  key={magasin.id}
                  className="pa-card p-4 flex items-start justify-between gap-4"
                  style={{ borderLeft: `4px solid ${niveauRisque === "eleve" ? "#E8809C" : "#E8B43A"}` }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
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
                      <span className="font-semibold text-sm truncate" style={{ color: "var(--pa-ink)" }}>
                        {magasin.enseigne
                          ? `${magasin.enseigne} — ${magasin.nom}`
                          : magasin.nom}
                      </span>
                      {magasin.ville && (
                        <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
                          {magasin.ville}
                        </span>
                      )}
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {raisons.map((r, i) => (
                        <li key={i} className="text-xs flex items-center gap-1" style={{ color: "var(--pa-muted)" }}>
                          <span style={{ color: "#C8C4D6" }}>•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={`/magasins/${magasin.id}`}
                    className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold transition-colors"
                    style={{ color: "#6B4FD8" }}
                  >
                    Voir <ArrowRight size={13} strokeWidth={2.5} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Activité récente ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--pa-muted)" }}>
            Activité récente
          </h2>

          {evenements.length === 0 ? (
            <div className="pa-card p-10 text-center">
              <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                Aucune activité sur cette période.
              </p>
            </div>
          ) : (
            <div className="pa-card divide-y" style={{ borderColor: "var(--pa-line)" }}>
              {evenements.map((evt) => (
                <div key={evt.id} className="flex items-start gap-3 px-4 py-3" style={{ borderColor: "var(--pa-line)" }}>
                  <span className="text-xs whitespace-nowrap mt-0.5 w-16 shrink-0" style={{ color: "var(--pa-muted)" }}>
                    {new Date(evt.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span
                    className="shrink-0 mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: evt.badge.bg, color: evt.badge.fg }}
                  >
                    {evt.badgeLabel}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>
                      {evt.label}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--pa-muted)" }}>
                      {evt.sousTitre}
                    </p>
                  </div>
                  <Link
                    href={evt.href}
                    className="shrink-0 transition-colors mt-0.5"
                    style={{ color: "#9A93AC" }}
                  >
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Top 3 / Flop 3 ── */}
        {classementConfiance.length >= 2 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--pa-muted)" }}>
              Classement confiance (note moyenne)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top 3 */}
              {top3.length > 0 && (
                <div className="pa-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#0F8C68" }}>
                    Top {top3.length}
                  </p>
                  <ol className="space-y-2">
                    {top3.map((item, i) => (
                      <li key={item.magasin.id} className="flex items-center gap-3">
                        <span className="text-sm font-bold w-4" style={{ color: "#C8C4D6" }}>
                          {i + 1}.
                        </span>
                        <Link
                          href={`/magasins/${item.magasin.id}`}
                          className="flex-1 text-sm font-semibold hover:underline truncate"
                          style={{ color: "var(--pa-ink)" }}
                        >
                          {item.magasin.enseigne
                            ? `${item.magasin.enseigne} — ${item.magasin.nom}`
                            : item.magasin.nom}
                        </Link>
                        <span className="text-sm font-bold shrink-0" style={{ color: "#0F8C68" }}>
                          {item.moy.toFixed(1)}/5
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Flop 3 */}
              {flop3.length > 0 && (
                <div className="pa-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#C0476E" }}>
                    Flop {flop3.length}
                  </p>
                  <ol className="space-y-2">
                    {flop3.map((item, i) => (
                      <li key={item.magasin.id} className="flex items-center gap-3">
                        <span className="text-sm font-bold w-4" style={{ color: "#C8C4D6" }}>
                          {i + 1}.
                        </span>
                        <Link
                          href={`/magasins/${item.magasin.id}`}
                          className="flex-1 text-sm font-semibold hover:underline truncate"
                          style={{ color: "var(--pa-ink)" }}
                        >
                          {item.magasin.enseigne
                            ? `${item.magasin.enseigne} — ${item.magasin.nom}`
                            : item.magasin.nom}
                        </Link>
                        <span className="text-sm font-bold shrink-0" style={{ color: "#C0476E" }}>
                          {item.moy.toFixed(1)}/5
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

// ─── Composants locaux ────────────────────────────────────────────────────────

function CardSante({
  label,
  valeur,
  note,
}: {
  label: string;
  valeur: string;
  note: number | null;
}) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 text-center"
      style={bgNote(note)}
    >
      <p className="text-xs font-semibold mb-1" style={{ color: "var(--pa-muted)" }}>{label}</p>
      <p className="text-3xl sm:text-4xl font-bold leading-none" style={{ color: couleurNote(note) }}>
        {valeur}
      </p>
      {note !== null && (
        <p className="text-xs mt-1" style={{ color: "var(--pa-muted)" }}>/5</p>
      )}
    </div>
  );
}

function CardKpi({
  label,
  valeur,
  sub,
  subRouge,
  href,
}: {
  label: string;
  valeur: string;
  sub?: string;
  subRouge?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="pa-card p-4 flex flex-col gap-1 transition-transform hover:-translate-y-0.5"
    >
      <span className="text-xs font-bold uppercase tracking-wide leading-snug" style={{ color: "var(--pa-muted)" }}>
        {label}
      </span>
      <span className="text-3xl font-bold leading-none" style={{ color: "var(--pa-ink)" }}>
        {valeur}
      </span>
      {sub && (
        <span
          className="text-xs font-semibold"
          style={{ color: subRouge ? "#C0476E" : "var(--pa-muted)" }}
        >
          {sub}
        </span>
      )}
    </Link>
  );
}
