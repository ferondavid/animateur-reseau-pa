import { createClient } from "@/lib/supabase/server";

function formatMontant(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} M€`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} K€`;
  return `${Math.round(v)} €`;
}

function SparklineCA({ vals }: { vals: number[] }) {
  if (vals.length < 2) return null;
  const W = 300, H = 40, pad = 4;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const points = vals.map((v, i) => [
    pad + (i / (vals.length - 1)) * (W - 2 * pad),
    H - pad - ((v - min) / range) * (H - 2 * pad),
  ] as [number, number]);
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="h-10 overflow-visible">
      <path d={d} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SEGMENTS = [
  { key: "chimie", label: "Chimie", icon: "🧪", color: "bg-blue-500" },
  { key: "materiel", label: "Matériel", icon: "🔧", color: "bg-amber-500" },
  { key: "piscine_coque", label: "Piscine", icon: "🏊", color: "bg-cyan-500" },
  { key: "spa", label: "Spa", icon: "🛁", color: "bg-purple-500" },
] as const;

type Props = { magasinId: string; anneeCourante: number };

export default async function CAEvolution({ magasinId, anneeCourante }: Props) {
  const supabase = await createClient();
  const anneePrecedente = anneeCourante - 1;

  const [{ data: annuelData }, { data: segmentsData }, { data: sparkData }] = await Promise.all([
    supabase
      .from("ca_mensuel")
      .select("annee, montant")
      .eq("magasin_id", magasinId)
      .eq("segment", "global")
      .in("annee", [anneePrecedente, anneeCourante]),
    supabase
      .from("ca_mensuel")
      .select("annee, segment, montant")
      .eq("magasin_id", magasinId)
      .in("segment", ["chimie", "materiel", "piscine_coque", "spa"])
      .in("annee", [anneePrecedente, anneeCourante]),
    supabase
      .from("ca_mensuel")
      .select("annee, mois, montant")
      .eq("magasin_id", magasinId)
      .eq("segment", "global")
      .in("annee", [anneePrecedente, anneeCourante])
      .order("annee")
      .order("mois"),
  ]);

  if (!annuelData || annuelData.length === 0) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chiffre d&apos;affaires</h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-sm text-slate-400">Aucune donnée CA disponible.</p>
        </div>
      </div>
    );
  }

  const caParAnnee = (annuelData ?? []).reduce((acc, row) => {
    acc[row.annee] = (acc[row.annee] ?? 0) + Number(row.montant);
    return acc;
  }, {} as Record<number, number>);

  const caActuel = caParAnnee[anneeCourante] ?? 0;
  const caPrecedent = caParAnnee[anneePrecedente] ?? 0;
  const evolution = caPrecedent > 0 ? ((caActuel - caPrecedent) / caPrecedent) * 100 : 0;
  const evolutionStr = (evolution >= 0 ? "+" : "") + evolution.toFixed(1).replace(".", ",") + " %";
  const evolutionColor = evolution >= 0 ? "text-emerald-600" : "text-red-600";

  const segParAnnee: Record<string, Record<number, number>> = {};
  for (const row of segmentsData ?? []) {
    if (!segParAnnee[row.segment]) segParAnnee[row.segment] = {};
    segParAnnee[row.segment][row.annee] = (segParAnnee[row.segment][row.annee] ?? 0) + Number(row.montant);
  }

  const maxSegment = Math.max(
    ...SEGMENTS.map(({ key }) => segParAnnee[key]?.[anneeCourante] ?? 0),
    1
  );

  const sparkVals = (sparkData ?? []).map((r) => Number(r.montant));

  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Chiffre d&apos;affaires</h2>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">

        {/* Ligne 1 : CA, évolution, vs N-1 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-slate-900">{formatMontant(caActuel)}</div>
            <div className="text-xs text-slate-400 mt-0.5">CA {anneeCourante}</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold ${evolutionColor}`}>{evolutionStr}</div>
            <div className="text-xs text-slate-400 mt-0.5">Évolution</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-slate-500">{formatMontant(caPrecedent)}</div>
            <div className="text-xs text-slate-400 mt-0.5">vs {anneePrecedente}</div>
          </div>
        </div>

        {/* Sparkline 24 mois */}
        {sparkVals.length >= 2 && (
          <div className="pt-1 border-t border-slate-100">
            <SparklineCA vals={sparkVals} />
          </div>
        )}

        {/* Mini-cards 4 segments */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SEGMENTS.map(({ key, label, icon, color }) => {
            const montantActuel = segParAnnee[key]?.[anneeCourante] ?? 0;
            const montantPrecedent = segParAnnee[key]?.[anneePrecedente] ?? 0;
            const delta = montantPrecedent > 0 ? ((montantActuel - montantPrecedent) / montantPrecedent) * 100 : 0;
            const progress = Math.round((montantActuel / maxSegment) * 100);

            return (
              <div key={key} className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{icon}</span>
                  <span className="text-xs font-medium text-slate-600 truncate">{label}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{formatMontant(montantActuel)}</div>
                <div className={`text-xs font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {delta >= 0 ? "+" : ""}{delta.toFixed(1).replace(".", ",")} %
                </div>
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
