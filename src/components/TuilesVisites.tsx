"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown, CalendarDays, Clock, MapPin, Phone, Target,
  CheckCircle2, Pencil, ArrowRight, Navigation as NavIcon,
} from "lucide-react";
import ActionsStatutVisite from "@/components/ActionsStatutVisite";

export type VisiteTuile = {
  id: string;
  date_prevue: string | null;
  date_realisee: string | null;
  heure_prevue: string | null;
  confirmee: boolean | null;
  statut: string;
  objectif: string | null;
  note_confiance: number | null;
  note_business: number | null;
  magasins: {
    nom: string;
    enseigne: string | null;
    ville: string | null;
    adresse: string | null;
    code_postal: string | null;
    contact_telephone: string | null;
  } | null;
};

const STATUT: Record<string, { label: string; bg: string; fg: string }> = {
  planifiee: { label: "Planifiée", bg: "#E4F0FB", fg: "#2D6FD0" },
  realisee:  { label: "Réalisée",  bg: "#D2F2E7", fg: "#0F8C68" },
  annulee:   { label: "Annulée",   bg: "#ECEAF3", fg: "#6F6982" },
  reportee:  { label: "Reportée",  bg: "#FBF1D8", fg: "#B07D14" },
};

function nomMagasin(m: VisiteTuile["magasins"]): string {
  if (!m) return "—";
  return m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom;
}
function dateFr(d: string | null): string | null {
  return d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null;
}
function telClean(tel: string | null): string | null {
  if (!tel) return null;
  const c = tel.replace(/[^\d+]/g, "");
  return c || null;
}

function Ligne({ Icon, label, children }: { Icon: typeof Clock; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} style={{ color: "var(--pa-muted)", marginTop: 2 }} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-xs" style={{ color: "var(--pa-muted)" }}>{label}</p>
        <div className="text-sm" style={{ color: "var(--pa-ink)" }}>{children}</div>
      </div>
    </div>
  );
}

export default function TuilesVisites({ visites }: { visites: VisiteTuile[] }) {
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOuverts((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="grid sm:grid-cols-2 gap-3 items-start">
      {visites.map((v) => {
        const m = v.magasins;
        const st = STATUT[v.statut] ?? { label: v.statut, bg: "#ECEAF3", fg: "#6F6982" };
        const ouvert = ouverts.has(v.id);
        const heure = v.heure_prevue ? v.heure_prevue.slice(0, 5) : null;
        const tel = telClean(m?.contact_telephone ?? null);
        const adresse = [m?.adresse, [m?.code_postal, m?.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        const dateAff = dateFr(v.date_prevue) ?? dateFr(v.date_realisee);

        return (
          <div key={v.id} className="pa-card overflow-hidden">
            {/* En-tête cliquable */}
            <button type="button" onClick={() => toggle(v.id)} className="w-full text-left p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-medium inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
                  <CalendarDays size={13} /> {dateAff ?? "Sans date"}{heure ? ` · ${heure}` : ""}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0" style={{ background: st.bg, color: st.fg }}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold leading-snug truncate" style={{ color: "var(--pa-ink)" }}>{nomMagasin(m)}</p>
                <ChevronDown size={17} className="shrink-0 transition-transform" style={{ color: "var(--pa-muted)", transform: ouvert ? "rotate(180deg)" : "none" }} />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={v.confirmee ? { background: "#D2F2E7", color: "#0F8C68" } : { background: "#FBF1D8", color: "#B07D14" }}>
                  {v.confirmee ? "Confirmée" : "À confirmer"}
                </span>
                {m?.ville && <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{m.ville}</span>}
              </div>
            </button>

            {/* Détails dépliés */}
            {ouvert && (
              <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: "var(--pa-line)" }}>
                <div className="grid grid-cols-1 gap-3 pt-3">
                  {dateFr(v.date_prevue) && (
                    <Ligne Icon={CalendarDays} label="Date programmée">{dateFr(v.date_prevue)}{heure ? ` à ${heure}` : ""}</Ligne>
                  )}
                  <Ligne Icon={CheckCircle2} label="Validation">
                    {v.confirmee ? "Confirmée par l'animateur" : "En attente de confirmation"}
                  </Ligne>
                  {dateFr(v.date_realisee) && (
                    <Ligne Icon={Clock} label="Réalisée le">{dateFr(v.date_realisee)}</Ligne>
                  )}
                  {adresse && (
                    <Ligne Icon={MapPin} label="Adresse">
                      {adresse}
                      {(m?.adresse || m?.ville) && (
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(adresse)}`}
                           target="_blank" rel="noreferrer"
                           className="ml-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#6B4FD8" }}>
                          <NavIcon size={12} /> Itinéraire
                        </a>
                      )}
                    </Ligne>
                  )}
                  {tel && (
                    <Ligne Icon={Phone} label="Téléphone">
                      <a href={`tel:${tel}`} style={{ color: "#6B4FD8" }}>{m?.contact_telephone}</a>
                    </Ligne>
                  )}
                  {v.objectif && <Ligne Icon={Target} label="Objectif">{v.objectif}</Ligne>}
                </div>

                <ActionsStatutVisite id={v.id} statut={v.statut} confirmee={!!v.confirmee}
                  date={v.date_prevue ?? v.date_realisee ?? ""} heure={v.heure_prevue} />

                <div className="flex gap-2 pt-1">
                  <Link href={`/visites/${v.id}`} className="pa-btn-secondary flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold">
                    Voir <ArrowRight size={14} />
                  </Link>
                  <Link href={`/visites/${v.id}/modifier`} className="pa-btn-primary flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold">
                    <Pencil size={14} /> Modifier
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
