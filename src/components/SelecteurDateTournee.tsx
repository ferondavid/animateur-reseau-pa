"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

function decale(dateStr: string, jours: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

export default function SelecteurDateTournee({ date }: { date: string }) {
  const router = useRouter();
  const go = (d: string) => router.push(`/animateur/tournee?date=${d}`);

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => go(decale(date, -1))} aria-label="Jour précédent"
        className="w-9 h-9 inline-flex items-center justify-center rounded-xl"
        style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}>
        <ChevronLeft size={16} />
      </button>
      <input type="date" value={date} onChange={(e) => e.target.value && go(e.target.value)}
        className="pa-input" style={{ width: "auto" }} />
      <button onClick={() => go(decale(date, 1))} aria-label="Jour suivant"
        className="w-9 h-9 inline-flex items-center justify-center rounded-xl"
        style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
