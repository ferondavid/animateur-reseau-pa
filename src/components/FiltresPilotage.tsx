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

  const segWrap = "flex items-center gap-1 p-1 rounded-[14px]";
  const segWrapStyle = { background: "rgba(255,255,255,0.65)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.7)" } as const;

  return (
    <div className="space-y-2">
      {/* Filtres prioritaires */}
      <div className="flex flex-wrap gap-2">
        {/* Période */}
        <div className={segWrap} style={segWrapStyle}>
          {PERIODES.map((p) => {
            const actif = periode === p.key;
            return (
              <button
                key={p.key}
                onClick={() => update({ periode: p.key })}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                style={actif ? { background: "#fff", color: "#534AB7", boxShadow: "0 2px 8px -2px rgba(80,60,140,0.18)" } : { color: "var(--pa-muted)" }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Niveau */}
        <div className={segWrap} style={segWrapStyle}>
          {NIVEAUX.map((n) => {
            const actif = niveau === n.key;
            return (
              <button
                key={n.key}
                onClick={() => update({ niveau: n.key })}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                style={actif ? { background: "#fff", color: "#534AB7", boxShadow: "0 2px 8px -2px rgba(80,60,140,0.18)" } : { color: "var(--pa-muted)" }}
              >
                {n.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres secondaires */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Région */}
        {regions.length > 0 && (
          <select
            value={region}
            onChange={(e) => update({ region: e.target.value, magasin_id: "" })}
            className="pa-input"
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
          className="pa-input max-w-xs truncate"
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
            className="text-xs underline transition-colors"
            style={{ color: "var(--pa-muted)" }}
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
