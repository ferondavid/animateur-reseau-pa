"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TrendBadge from "@/components/ui/TrendBadge";
import { titreMagasin } from "@/lib/magasin";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

export type LigneScorecard = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  region: string | null;
  niveau: string; // strategique | standard | observation
  niveauRisque: "eleve" | "modere" | "ok";
  joursSansVisite: number | null;
  noteConfiance: number | null;
  noteBusiness: number | null;
  satisfaction: number | null;
  caTrendPct: number | null;
  nbRemontees: number;
  nbActions: number;
};

const RISQUE = {
  eleve: { rang: 2, label: "Élevé", bg: "#FBE0E8", fg: "#C0476E" },
  modere: { rang: 1, label: "Surveiller", bg: "#FBF1D8", fg: "#B07D14" },
  ok: { rang: 0, label: "OK", bg: "#D2F2E7", fg: "#0F8C68" },
} as const;

const NIVEAU: Record<string, { label: string; bg: string; fg: string }> = {
  strategique: { label: "Stratégique", bg: "#FBF1D8", fg: "#B07D14" },
  standard: { label: "Standard", bg: "#ECEAF3", fg: "#6F6982" },
  observation: { label: "Observation", bg: "#E4F0FB", fg: "#2D6FD0" },
};

function couleurNote(n: number | null): string {
  if (n === null) return "#9A93AC";
  if (n >= 4) return "#0F8C68";
  if (n >= 3) return "#B07D14";
  return "#C0476E";
}

type SortKey =
  | "risque" | "jours" | "confiance" | "business"
  | "satisfaction" | "ca" | "remontees" | "actions" | "nom";

const COLONNES: { key: SortKey; label: string; align: "left" | "center" }[] = [
  { key: "nom", label: "Magasin", align: "left" },
  { key: "risque", label: "Risque", align: "center" },
  { key: "jours", label: "Sans visite", align: "center" },
  { key: "confiance", label: "Confiance", align: "center" },
  { key: "business", label: "Business", align: "center" },
  { key: "satisfaction", label: "Satisf.", align: "center" },
  { key: "ca", label: "CA an.", align: "center" },
  { key: "remontees", label: "Remontées", align: "center" },
  { key: "actions", label: "Actions", align: "center" },
];

function valTri(l: LigneScorecard, key: SortKey): number | string {
  switch (key) {
    case "nom": return titreMagasin(l.enseigne, l.nom).toLowerCase();
    case "risque": return RISQUE[l.niveauRisque].rang;
    case "jours": return l.joursSansVisite ?? Number.POSITIVE_INFINITY; // jamais visité = en haut
    case "confiance": return l.noteConfiance ?? Number.NEGATIVE_INFINITY;
    case "business": return l.noteBusiness ?? Number.NEGATIVE_INFINITY;
    case "satisfaction": return l.satisfaction ?? Number.NEGATIVE_INFINITY;
    case "ca": return l.caTrendPct ?? Number.NEGATIVE_INFINITY;
    case "remontees": return l.nbRemontees;
    case "actions": return l.nbActions;
  }
}

export default function ScorecardReseau({ lignes }: { lignes: LigneScorecard[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtreRisque, setFiltreRisque] = useState<"tous" | "eleve" | "modere" | "ok">("tous");
  const [filtreRegion, setFiltreRegion] = useState("toutes");
  const [filtreNiveau, setFiltreNiveau] = useState("tous");
  const [sortKey, setSortKey] = useState<SortKey>("risque");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const regions = useMemo(
    () => [...new Set(lignes.map((l) => l.region).filter((r): r is string => !!r))].sort((a, b) => a.localeCompare(b, "fr")),
    [lignes]
  );

  const compteurs = useMemo(() => {
    let eleve = 0, modere = 0, ok = 0;
    for (const l of lignes) {
      if (l.niveauRisque === "eleve") eleve++;
      else if (l.niveauRisque === "modere") modere++;
      else ok++;
    }
    return { eleve, modere, ok };
  }, [lignes]);

  const lignesAffichees = useMemo(() => {
    const filtrees = lignes.filter((l) => {
      if (filtreRisque !== "tous" && l.niveauRisque !== filtreRisque) return false;
      if (filtreRegion !== "toutes" && (l.region ?? "") !== filtreRegion) return false;
      if (filtreNiveau !== "tous" && l.niveau !== filtreNiveau) return false;
      if (search.trim()) {
        const hay = `${l.enseigne ?? ""} ${l.nom} ${l.ville ?? ""} ${l.region ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return filtrees.sort((a, b) => {
      const va = valTri(a, sortKey);
      const vb = valTri(b, sortKey);
      let cmp: number;
      if (typeof va === "string" && typeof vb === "string") cmp = va.localeCompare(vb, "fr");
      else cmp = (va as number) - (vb as number);
      if (cmp === 0) {
        // tie-break stable : risque puis jours sans visite
        cmp = RISQUE[a.niveauRisque].rang - RISQUE[b.niveauRisque].rang;
      }
      return cmp * dir;
    });
  }, [lignes, filtreRisque, filtreRegion, filtreNiveau, search, sortKey, sortDir]);

  function trierPar(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // notes/CA : descendant d'abord (mieux→pire), nom : ascendant
      setSortDir(key === "nom" ? "asc" : "desc");
    }
  }

  return (
    <div className="space-y-4">
      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-3">
        <PastilleCompteur label="Risque élevé" valeur={compteurs.eleve} bg="#FBE0E8" fg="#C0476E" />
        <PastilleCompteur label="À surveiller" valeur={compteurs.modere} bg="#FBF1D8" fg="#B07D14" />
        <PastilleCompteur label="Au vert" valeur={compteurs.ok} bg="#D2F2E7" fg="#0F8C68" />
      </div>

      {/* Filtres */}
      <div className="pa-card p-4 space-y-3">
        <div className="relative">
          <Search size={14} style={{ color: "var(--pa-muted)", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un magasin…"
            className="pa-input"
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { key: "tous", label: "Tous" },
            { key: "eleve", label: "Élevé" },
            { key: "modere", label: "À surveiller" },
            { key: "ok", label: "OK" },
          ] as const).map(({ key, label }) => {
            const actif = filtreRisque === key;
            return (
              <button
                key={key}
                onClick={() => setFiltreRisque(key)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                style={actif
                  ? { background: "#6B4FD8", color: "#fff", boxShadow: "0 2px 8px -3px rgba(107,79,216,.6)" }
                  : { background: "#ECEAF3", color: "#6F6982" }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {regions.length > 0 && (
            <select value={filtreRegion} onChange={(e) => setFiltreRegion(e.target.value)} className="pa-input" style={{ maxWidth: 220 }}>
              <option value="toutes">Toutes les régions</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          <select value={filtreNiveau} onChange={(e) => setFiltreNiveau(e.target.value)} className="pa-input" style={{ maxWidth: 200 }}>
            <option value="tous">Tous les niveaux</option>
            <option value="strategique">Stratégique</option>
            <option value="standard">Standard</option>
            <option value="observation">Observation</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="pa-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(244,241,251,0.6)" }}>
                {COLONNES.map((c) => {
                  const actif = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      onClick={() => trierPar(c.key)}
                      className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                      style={{
                        color: actif ? "#6B4FD8" : "var(--pa-muted)",
                        textAlign: c.align,
                        borderBottom: "1px solid var(--pa-line)",
                      }}
                    >
                      <span className="inline-flex items-center gap-1" style={{ justifyContent: c.align === "center" ? "center" : "flex-start" }}>
                        {c.label}
                        {actif && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {lignesAffichees.length === 0 && (
                <tr>
                  <td colSpan={COLONNES.length} className="px-4 py-8 text-center" style={{ color: "var(--pa-muted)" }}>
                    Aucun magasin sur ce filtre.
                  </td>
                </tr>
              )}
              {lignesAffichees.map((l, idx) => {
                const risque = RISQUE[l.niveauRisque];
                const niv = NIVEAU[l.niveau] ?? NIVEAU.standard;
                return (
                  <tr
                    key={l.id}
                    onClick={() => router.push(`/magasins/${l.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[rgba(124,107,232,0.06)]"
                    style={{ background: idx % 2 === 0 ? "transparent" : "rgba(244,241,251,0.3)" }}
                  >
                    <td className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--pa-line)" }}>
                      <p className="font-semibold truncate max-w-[200px]" style={{ color: "var(--pa-ink)" }}>
                        {titreMagasin(l.enseigne, l.nom)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {l.ville && <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{l.ville}</span>}
                        {l.niveau !== "standard" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: niv.bg, color: niv.fg }}>
                            {niv.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <Cell align="center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: risque.bg, color: risque.fg }}>
                        {risque.label}
                      </span>
                    </Cell>
                    <Cell align="center">
                      {l.joursSansVisite === null
                        ? <span className="text-xs font-semibold" style={{ color: "#C0476E" }}>Jamais</span>
                        : <span style={{ color: "var(--pa-ink)" }}>{l.joursSansVisite}<span className="text-xs" style={{ color: "var(--pa-muted)" }}>j</span></span>}
                    </Cell>
                    <Cell align="center"><Note n={l.noteConfiance} /></Cell>
                    <Cell align="center"><Note n={l.noteBusiness} /></Cell>
                    <Cell align="center"><Note n={l.satisfaction} /></Cell>
                    <Cell align="center">
                      {l.caTrendPct === null
                        ? <span style={{ color: "#C8C4D6" }}>—</span>
                        : <TrendBadge value={Math.round(l.caTrendPct)} />}
                    </Cell>
                    <Cell align="center">
                      <Compteur n={l.nbRemontees} couleur="#C0476E" />
                    </Cell>
                    <Cell align="center">
                      <Compteur n={l.nbActions} couleur="#2D6FD0" />
                    </Cell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>
        {lignesAffichees.length} magasin{lignesAffichees.length > 1 ? "s" : ""} affiché{lignesAffichees.length > 1 ? "s" : ""} · clique une ligne pour ouvrir la fiche
      </p>
    </div>
  );
}

function Cell({ children, align }: { children: React.ReactNode; align: "left" | "center" }) {
  return (
    <td className="px-3 py-2.5 whitespace-nowrap" style={{ textAlign: align, borderBottom: "1px solid var(--pa-line)" }}>
      {children}
    </td>
  );
}

function Note({ n }: { n: number | null }) {
  if (n === null) return <span style={{ color: "#C8C4D6" }}>—</span>;
  return <span className="font-semibold" style={{ color: couleurNote(n) }}>{n.toFixed(1)}</span>;
}

function Compteur({ n, couleur }: { n: number; couleur: string }) {
  if (n === 0) return <span style={{ color: "#C8C4D6" }}>—</span>;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${couleur}1A`, color: couleur }}>
      {n}
    </span>
  );
}

function PastilleCompteur({ label, valeur, bg, fg }: { label: string; valeur: number; bg: string; fg: string }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: bg }}>
      <p className="text-3xl font-bold leading-none" style={{ color: fg }}>{valeur}</p>
      <p className="text-xs font-semibold mt-1" style={{ color: fg }}>{label}</p>
    </div>
  );
}
