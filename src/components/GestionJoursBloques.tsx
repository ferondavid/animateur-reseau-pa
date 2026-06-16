"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Home, Palmtree, Building2, Trash2, Plus } from "lucide-react";
import { ajouterJourBloque, supprimerJourBloque } from "@/app/animateur/disponibilites/actions";
import { TYPE_BLOC, type JourBloque } from "@/lib/jours-bloques";

const TYPES: { value: string; label: string; Icon: typeof Home }[] = [
  { value: "home_office", label: "Home office", Icon: Home },
  { value: "conges", label: "Congés", Icon: Palmtree },
  { value: "bureau", label: "Journée bureau", Icon: Building2 },
];

function dateFr(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export default function GestionJoursBloques({ initial }: { initial: JourBloque[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [type, setType] = useState("home_office");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function ajouter() {
    setErreur(null);
    start(async () => {
      const r = await ajouterJourBloque(dateDebut, dateFin, type, note);
      if (!r.ok) { setErreur(r.error ?? "Erreur"); return; }
      setDateDebut(""); setDateFin(""); setNote("");
      router.refresh();
    });
  }
  function supprimer(id: string) {
    start(async () => { await supprimerJourBloque(id); router.refresh(); });
  }

  return (
    <div className="space-y-5">
      {/* Formulaire */}
      <div className="pa-card p-5 space-y-4">
        <div>
          <label className="pa-label">Type</label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {TYPES.map(({ value, label, Icon }) => {
              const actif = type === value;
              const c = TYPE_BLOC[value];
              return (
                <button key={value} type="button" onClick={() => setType(value)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={actif
                    ? { background: c.bg, color: c.fg, boxShadow: `inset 0 0 0 1.5px ${c.fg}` }
                    : { background: "var(--pa-card)", color: "var(--pa-muted)", boxShadow: "inset 0 0 0 1px var(--pa-line)" }}>
                  <Icon size={16} /> {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="pa-label">Du</label>
            <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="pa-input" />
          </div>
          <div>
            <label className="pa-label">Au (optionnel)</label>
            <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="pa-input" />
          </div>
        </div>
        <div>
          <label className="pa-label">Note (optionnel)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. RTT, formation…" className="pa-input" />
        </div>
        {erreur && (
          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "#FBE0E8", color: "#C0476E" }}>{erreur}</div>
        )}
        <button onClick={ajouter} disabled={pending || !dateDebut}
          className="pa-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
          <Plus size={15} /> {pending ? "…" : "Bloquer ces jours"}
        </button>
      </div>

      {/* Liste */}
      {initial.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--pa-muted)" }}>Aucun jour bloqué à venir.</p>
      ) : (
        <div className="space-y-2">
          {initial.map((j) => {
            const c = TYPE_BLOC[j.type] ?? TYPE_BLOC.home_office;
            const meme = j.date_debut === j.date_fin;
            return (
              <div key={j.id} className="pa-card p-3 flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0" style={{ background: c.bg, color: c.fg }}>{c.label}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>
                    {meme ? dateFr(j.date_debut) : `${dateFr(j.date_debut)} → ${dateFr(j.date_fin)}`}
                  </p>
                  {j.note && <p className="text-xs truncate" style={{ color: "var(--pa-muted)" }}>{j.note}</p>}
                </div>
                <button onClick={() => supprimer(j.id)} disabled={pending} aria-label="Supprimer"
                  className="inline-flex p-1.5 shrink-0" style={{ color: "#C0476E" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
