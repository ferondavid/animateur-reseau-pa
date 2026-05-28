"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Props {
  regions: string[];
  magasins: { id: string; nom: string; enseigne: string | null }[];
}

const PERIODES = [
  { key: "mois", label: "Ce mois" },
  { key: "trimestre", label: "3 mois" },
  { key: "annee", label: "Cette année" },
  { key: "tout", label: "Tout" },
];

const NIVEAUX = [
  { key: "tous", label: "Tous" },
  { key: "strategique", label: "Stratégique" },
  { key: "standard", label: "Standard" },
  { key: "observation", label: "Observation" },
];

// Valeurs par défaut : absentes de l'URL = valeur par défaut
const DEFAUTS: Record<string, string> = {
  periode: "trimestre",
  niveau: "tous",
  region: "toutes",
  magasin_id: "",
};

export default function FiltresPilotage({ regions, magasins }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const periode = searchParams.get("periode") ?? DEFAUTS.periode;
  const niveau = searchParams.get("niveau") ?? DEFAUTS.niveau;
  const region = searchParams.get("region") ?? DEFAUTS.region;
  const magasin_id = searchParams.get("magasin_id") ?? DEFAUTS.magasin_id;

  const aClesFiltres =
    periode !== DEFAUTS.periode ||
    niveau !== DEFAUTS.niveau ||
    region !== DEFAUTS.region ||
    magasin_id !== DEFAUTS.magasin_id;

  function update(mises_a_jour: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(mises_a_jour)) {
      if (val === DEFAUTS[key] || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? "?" + qs : ""}`);
  }

  const btnActif = "bg-slate-900 text-white";
  const btnInactif = "text-slate-600 hover:bg-slate-100";

  const btnActifViolet = "bg-violet-800 text-white";
  const btnInactifViolet = "text-slate-600 hover:bg-slate-100";

  return (
    <div className="space-y-2">
      {/* Filtres prioritaires */}
      <div className="flex flex-wrap gap-2">
        {/* Période */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm text-sm">
          {PERIODES.map((p) => (
            <button
              key={p.key}
              onClick={() => update({ periode: p.key })}
              className={`px-3 py-1.5 font-medium transition-colors ${
                periode === p.key ? btnActif : btnInactif
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Niveau */}
        <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm text-sm">
          {NIVEAUX.map((n) => (
            <button
              key={n.key}
              onClick={() => update({ niveau: n.key })}
              className={`px-3 py-1.5 font-medium transition-colors ${
                niveau === n.key ? btnActifViolet : btnInactifViolet
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres secondaires */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Région */}
        {regions.length > 0 && (
          <select
            value={region}
            onChange={(e) => update({ region: e.target.value, magasin_id: "" })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="toutes">Toutes les régions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}

        {/* Magasin précis */}
        <select
          value={magasin_id}
          onChange={(e) => update({ magasin_id: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 max-w-xs truncate"
        >
          <option value="">Tous les magasins</option>
          {magasins.map((m) => (
            <option key={m.id} value={m.id}>
              {m.enseigne ? `${m.enseigne} — ` : ""}
              {m.nom}
            </option>
          ))}
        </select>

        {/* Réinitialiser */}
        {aClesFiltres && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-slate-400 hover:text-slate-700 underline transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
