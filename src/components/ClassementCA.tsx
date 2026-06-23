"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { titreMagasin } from "@/lib/magasin";
import { ChevronUp, ChevronDown, Search } from "lucide-react";

export type LigneClassement = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  ca_global: number | null;
  ca_leaders: number | null;
  pct_leaders: number | null;
  bfa_associe: number | null;
  rang_ca_leaders: number | null;
};

function eur(v: number | null): string {
  return v == null ? "—" : Number(v).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function pct(v: number | null): string {
  return v == null ? "—" : `${Math.round(Number(v) * 100)}%`;
}

type SortKey = "rang" | "ca_global" | "ca_leaders" | "pct_leaders" | "bfa_associe" | "nom";

const COLS: { key: SortKey; label: string; align: "left" | "right" | "center" }[] = [
  { key: "rang", label: "Rang", align: "center" },
  { key: "nom", label: "Associé", align: "left" },
  { key: "ca_global", label: "CA global", align: "right" },
  { key: "ca_leaders", label: "CA Leaders", align: "right" },
  { key: "pct_leaders", label: "% Leaders", align: "center" },
  { key: "bfa_associe", label: "BFA", align: "right" },
];

function val(l: LigneClassement, k: SortKey): number | string {
  switch (k) {
    case "nom": return titreMagasin(l.enseigne, l.nom).toLowerCase();
    case "rang": return l.rang_ca_leaders ?? 9999;
    case "ca_global": return l.ca_global ?? -1;
    case "ca_leaders": return l.ca_leaders ?? -1;
    case "pct_leaders": return l.pct_leaders ?? -1;
    case "bfa_associe": return l.bfa_associe ?? -1;
  }
}

export default function ClassementCA({ lignes }: { lignes: LigneClassement[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ca_leaders");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const affichees = useMemo(() => {
    const f = lignes.filter((l) => {
      if (!search.trim()) return true;
      const hay = `${l.enseigne ?? ""} ${l.nom} ${l.ville ?? ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return f.sort((a, b) => {
      const va = val(a, sortKey), vb = val(b, sortKey);
      const cmp = typeof va === "string" && typeof vb === "string"
        ? va.localeCompare(vb, "fr")
        : (va as number) - (vb as number);
      return cmp * dir;
    });
  }, [lignes, search, sortKey, sortDir]);

  function trier(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "nom" || k === "rang" ? "asc" : "desc"); }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={14} style={{ color: "var(--pa-muted)", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un associé…" className="pa-input" style={{ paddingLeft: 34 }}
        />
      </div>

      <div className="pa-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(244,241,251,0.6)" }}>
                {COLS.map((c) => {
                  const actif = sortKey === c.key;
                  return (
                    <th key={c.key} onClick={() => trier(c.key)}
                      className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
                      style={{ color: actif ? "#6B4FD8" : "var(--pa-muted)", textAlign: c.align, borderBottom: "1px solid var(--pa-line)" }}>
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {actif && (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {affichees.map((l, idx) => (
                <tr key={l.id}
                  onClick={() => router.push(`/magasins/${l.id}`)}
                  className="cursor-pointer transition-colors hover:bg-[rgba(124,107,232,0.06)]"
                  style={{ background: idx % 2 === 0 ? "transparent" : "rgba(244,241,251,0.3)" }}>
                  <td className="px-3 py-2.5 text-center" style={{ borderBottom: "1px solid var(--pa-line)" }}>
                    <span className="inline-flex items-center justify-center min-w-[26px] h-[26px] rounded-full text-xs font-bold"
                      style={{
                        background: (l.rang_ca_leaders ?? 99) <= 3 ? "#EDEBFB" : "transparent",
                        color: (l.rang_ca_leaders ?? 99) <= 3 ? "#6B4FD8" : "var(--pa-muted)",
                      }}>
                      {l.rang_ca_leaders ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--pa-line)" }}>
                    <p className="font-semibold truncate max-w-[230px]" style={{ color: "var(--pa-ink)" }}>{titreMagasin(l.enseigne, l.nom)}</p>
                    {l.ville && <p className="text-xs" style={{ color: "var(--pa-muted)" }}>{l.ville}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ color: "var(--pa-ink)", borderBottom: "1px solid var(--pa-line)" }}>{eur(l.ca_global)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap font-semibold" style={{ color: "var(--pa-ink)", borderBottom: "1px solid var(--pa-line)" }}>{eur(l.ca_leaders)}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: "var(--pa-muted)", borderBottom: "1px solid var(--pa-line)" }}>{pct(l.pct_leaders)}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap" style={{ color: "#0F8C68", borderBottom: "1px solid var(--pa-line)" }}>{eur(l.bfa_associe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>
        {affichees.length} associés · clique une ligne pour ouvrir la fiche · tri par colonne
      </p>
    </div>
  );
}
