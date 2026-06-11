"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Trash2, X } from "lucide-react";
import { supprimerVisitesEnLot } from "@/app/visites/[id]/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisiteItem = {
  id: string;
  magasin_id: string;
  date_prevue: string | null;
  date_realisee: string | null;
  statut: string;
  note_confiance: number | null;
  note_business: number | null;
  magasins: unknown;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT: Record<string, { label: string; bg: string; fg: string }> = {
  planifiee: { label: "Planifiée", bg: "#E4F0FB", fg: "#2D6FD0" },
  realisee:  { label: "Réalisée",  bg: "#D2F2E7", fg: "#0F8C68" },
  annulee:   { label: "Annulée",   bg: "#ECEAF3", fg: "#6F6982" },
  reportee:  { label: "Reportée",  bg: "#FBF1D8", fg: "#B07D14" },
};

function StatutPill({ statut }: { statut: string }) {
  const m = STATUT[statut] ?? { label: statut, bg: "#ECEAF3", fg: "#6F6982" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

function Etoiles({ note }: { note: number | null }) {
  if (!note) return <span style={{ color: "#D3D1C7" }}>—</span>;
  return (
    <span className="text-base" style={{ color: "#EF9F27" }}>
      {"★".repeat(note)}
      <span style={{ color: "#E5E2EC" }}>{"★".repeat(5 - note)}</span>
    </span>
  );
}

function nomMagasin(magasins: unknown): string {
  const m = magasins as { nom: string; enseigne: string | null } | null;
  if (!m) return "—";
  return m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function ListeVisitesSelectionnable({
  visites,
}: {
  visites: VisiteItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const headerCheckRef = useRef<HTMLInputElement>(null);

  // Indeterminate state on the "select all" checkbox
  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate =
        selected.size > 0 && selected.size < visites.length;
    }
  }, [selected.size, visites.length]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === visites.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visites.map((v) => v.id)));
    }
  }

  function handleDelete() {
    const n = selected.size;
    if (!confirm(`Supprimer ${n} visite${n > 1 ? "s" : ""} définitivement ?`)) return;

    const ids = Array.from(selected);
    const magasinIds = [
      ...new Set(
        ids
          .map((id) => visites.find((v) => v.id === id)?.magasin_id)
          .filter((mid): mid is string => Boolean(mid))
      ),
    ];

    startTransition(async () => {
      await supprimerVisitesEnLot(ids, magasinIds);
      setSelected(new Set());
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Barre d'action (sélection active) ── */}
      {selected.size > 0 && (
        <div
          className="sticky top-2 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "#FBE0E8",
            border: "1px solid rgba(192,71,110,0.22)",
            boxShadow: "0 4px 16px -6px rgba(192,71,110,0.35)",
          }}
        >
          <span className="text-sm font-semibold" style={{ color: "#C0476E" }}>
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-opacity"
            style={{
              background: "#C0476E",
              color: "#fff",
              opacity: isPending ? 0.65 : 1,
            }}
          >
            <Trash2 size={14} strokeWidth={2.5} />
            {isPending ? "Suppression…" : "Supprimer la sélection"}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="inline-flex items-center gap-1 text-sm font-semibold ml-auto"
            style={{ color: "#C0476E" }}
          >
            <X size={14} strokeWidth={2.5} />
            Annuler
          </button>
        </div>
      )}

      {/* ── Vue desktop : tableau ── */}
      <div className="hidden md:block pa-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
              <th className="px-4 py-3.5 w-10">
                <input
                  ref={headerCheckRef}
                  type="checkbox"
                  checked={selected.size === visites.length && visites.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 cursor-pointer accent-violet-600 rounded"
                />
              </th>
              <th className="text-left px-4 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Date</th>
              <th className="text-left px-4 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Magasin</th>
              <th className="text-left px-4 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Statut</th>
              <th className="text-left px-4 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Confiance</th>
              <th className="text-left px-4 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Business</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {visites.map((v) => {
              const date = v.date_realisee ?? v.date_prevue;
              const isSelected = selected.has(v.id);
              return (
                <tr
                  key={v.id}
                  className="border-b last:border-0 transition-colors hover:bg-white/40 cursor-pointer"
                  style={{
                    borderColor: "var(--pa-line)",
                    background: isSelected ? "rgba(107,79,216,0.06)" : undefined,
                  }}
                  onClick={() => router.push(`/visites/${v.id}`)}
                >
                  {/* Checkbox — stop navigation */}
                  <td
                    className="px-4 py-4 w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOne(v.id)}
                      className="w-4 h-4 cursor-pointer accent-violet-600 rounded"
                    />
                  </td>
                  <td className="px-4 py-4" style={{ color: "var(--pa-ink)" }}>
                    {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-4 font-semibold" style={{ color: "var(--pa-ink)" }}>
                    {nomMagasin(v.magasins)}
                  </td>
                  <td className="px-4 py-4">
                    <StatutPill statut={v.statut} />
                  </td>
                  <td className="px-4 py-4">
                    <Etoiles note={v.note_confiance} />
                  </td>
                  <td className="px-4 py-4">
                    <Etoiles note={v.note_business} />
                  </td>
                  {/* Lien "Voir" — stop propagation pour éviter double navigation */}
                  <td
                    className="px-4 py-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/visites/${v.id}`}
                      className="inline-flex items-center gap-1 font-semibold"
                      style={{ color: "#6B4FD8", textDecoration: "none" }}
                    >
                      Voir <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Vue mobile : cartes ── */}
      <div className="md:hidden space-y-3">
        {visites.map((v) => {
          const date = v.date_realisee ?? v.date_prevue;
          const isSelected = selected.has(v.id);
          return (
            <div key={v.id} className="relative">
              {/* Checkbox overlay — stopPropagation pour ne pas déclencher le Link */}
              <div
                className="absolute left-3 top-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(v.id)}
                  className="w-4 h-4 cursor-pointer accent-violet-600 rounded"
                />
              </div>
              <Link
                href={`/visites/${v.id}`}
                className="block pa-card p-4 pl-10 transition-all active:scale-[.99]"
                style={{
                  background: isSelected ? "rgba(107,79,216,0.07)" : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: "var(--pa-ink)" }}>
                    {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
                  </span>
                  <StatutPill statut={v.statut} />
                </div>
                <p className="font-bold mb-1.5 leading-snug" style={{ color: "var(--pa-ink)" }}>
                  {nomMagasin(v.magasins)}
                </p>
                {(v.note_confiance || v.note_business) && (
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--pa-muted)" }}>
                    {v.note_confiance && (
                      <span>C&nbsp;<span style={{ color: "#EF9F27" }}>{"★".repeat(v.note_confiance)}</span></span>
                    )}
                    {v.note_business && (
                      <span>B&nbsp;<span style={{ color: "#EF9F27" }}>{"★".repeat(v.note_business)}</span></span>
                    )}
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
