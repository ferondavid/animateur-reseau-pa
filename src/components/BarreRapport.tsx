"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";

interface Props {
  type: "semaine" | "mois";
  refDate: string; // lundi ISO pour semaine, 1er du mois pour mois
  libelle: string;
}

const SEG_WRAP: React.CSSProperties = {
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.7)",
};

function shiftDate(date: string, type: "semaine" | "mois", direction: -1 | 1): string {
  const [y, m, d] = date.split("-").map(Number);
  if (type === "semaine") {
    const dt = new Date(y, m - 1, d + direction * 7);
    return fmtLocal(dt);
  }
  const dt = new Date(y, m - 1 + direction, 1);
  return fmtLocal(dt);
}

function fmtLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BarreRapport({ type, refDate, libelle }: Props) {
  const router = useRouter();

  function navigate(direction: -1 | 1) {
    const newRef = shiftDate(refDate, type, direction);
    router.push(`/animateur/rapport?type=${type}&ref=${newRef}`);
  }

  function switchType(newType: "semaine" | "mois") {
    if (newType === type) return;
    router.push(`/animateur/rapport?type=${newType}&ref=${refDate}`);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      {/* Toggle Semaine / Mois */}
      <div className="flex items-center gap-1 p-1 rounded-[14px]" style={SEG_WRAP}>
        {(["semaine", "mois"] as const).map((t) => {
          const actif = type === t;
          return (
            <button
              key={t}
              onClick={() => switchType(t)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
              style={
                actif
                  ? { background: "#fff", color: "#534AB7", boxShadow: "0 2px 8px -2px rgba(80,60,140,0.18)" }
                  : { color: "var(--pa-muted)" }
              }
            >
              {t === "semaine" ? "Semaine" : "Mois"}
            </button>
          );
        })}
      </div>

      {/* Navigation période */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(-1)}
          className="pa-ghost-btn"
          style={{ padding: "6px 10px", gap: 0 }}
          aria-label="Période précédente"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <span
          className="text-sm font-semibold px-3"
          style={{ color: "var(--pa-ink)", minWidth: "210px", textAlign: "center", whiteSpace: "nowrap" }}
        >
          {libelle}
        </span>
        <button
          onClick={() => navigate(1)}
          className="pa-ghost-btn"
          style={{ padding: "6px 10px", gap: 0 }}
          aria-label="Période suivante"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* Bouton imprimer */}
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold pa-btn-primary"
      >
        <Printer size={15} strokeWidth={2.5} />
        Imprimer / PDF
      </button>
    </div>
  );
}
