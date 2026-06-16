export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BoutonAccueil from "@/components/BoutonAccueil";
import Navigation from "@/components/Navigation";
import SelecteurDateTournee from "@/components/SelecteurDateTournee";
import ActionsVisiteTournee from "@/components/ActionsVisiteTournee";
import { titreMagasin } from "@/lib/magasin";
import {
  Navigation as NavIcon, Phone, ClipboardCheck, Check,
  Mic, AlertTriangle, MapPin, CalendarDays,
} from "lucide-react";

type Magasin = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  contact_telephone: string | null;
  latitude: number | null;
  longitude: number | null;
  niveau: string | null;
};
type Visite = {
  id: string;
  statut: string;
  date_prevue: string | null;
  heure_prevue: string | null;
  confirmee: boolean | null;
  objectif: string | null;
  created_at: string;
  magasins: Magasin | null;
};

const NIVEAU: Record<string, { label: string; bg: string; fg: string }> = {
  strategique: { label: "Stratégique", bg: "#FBF1D8", fg: "#B07D14" },
  observation: { label: "Observation", bg: "#E4F0FB", fg: "#2D6FD0" },
  standard:    { label: "Standard",    bg: "#ECEAF3", fg: "#6F6982" },
};

function telHref(tel: string | null): string | null {
  if (!tel) return null;
  const clean = tel.replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : null;
}
function mapsHref(m: Magasin): string {
  if (m.latitude != null && m.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`;
  }
  const q = encodeURIComponent([m.nom, m.ville].filter(Boolean).join(" "));
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
function dateLisible(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export default async function TourneePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const aujourdhui = new Date(Date.now() + 2 * 3600_000).toISOString().slice(0, 10); // ~France
  const date = dateParam ?? aujourdhui;

  const supabase = await createClient();
  const { data } = await supabase
    .from("visites")
    .select("id, statut, date_prevue, heure_prevue, confirmee, objectif, created_at, magasins(id, nom, enseigne, ville, contact_telephone, latitude, longitude, niveau)")
    .eq("date_prevue", date)
    .order("heure_prevue", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  const visites = (data ?? []) as unknown as Visite[];
  const total = visites.length;
  const faites = visites.filter((v) => v.statut === "realisee").length;
  const pct = total ? Math.round((faites / total) * 100) : 0;
  let prochaineTrouvee = false;

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <BoutonAccueil />

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              <MapPin size={22} style={{ color: "#6B4FD8" }} /> Ma tournée
            </h1>
            <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--pa-muted)" }}>
              {dateLisible(date)}
            </p>
          </div>
          <SelecteurDateTournee date={date} />
        </div>

        <Navigation />

        {/* Progression */}
        {total > 0 && (
          <div className="pa-card p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: "var(--pa-muted)" }}>Progression</span>
              <span className="font-semibold" style={{ color: "var(--pa-ink)" }}>{faites} / {total} visite{total > 1 ? "s" : ""}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--pa-line)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#6B4FD8" }} />
            </div>
          </div>
        )}

        {/* Liste des étapes */}
        {total === 0 ? (
          <div className="pa-card p-10 text-center space-y-4">
            <CalendarDays size={32} style={{ color: "var(--pa-muted)" }} className="mx-auto" />
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
              Aucune visite planifiée ce jour-là.
            </p>
            <Link href="/animateur/parcours"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 pa-btn-primary rounded-xl text-sm font-semibold">
              Préparer une tournée
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {visites.map((v, i) => {
              const m = v.magasins;
              const faite = v.statut === "realisee";
              const estProchaine = !faite && !prochaineTrouvee;
              if (estProchaine) prochaineTrouvee = true;
              const niv = m?.niveau ? NIVEAU[m.niveau] : null;
              const nom = m ? titreMagasin(m.enseigne, m.nom) : "Magasin";
              const tel = telHref(m?.contact_telephone ?? null);
              const heure = v.heure_prevue ? v.heure_prevue.slice(0, 5) : null;
              const conf = !!v.confirmee;

              if (faite) {
                return (
                  <div key={v.id} className="pa-card p-3 flex items-center gap-3" style={{ opacity: 0.6 }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#0F8C68", color: "#fff" }}>
                      <Check size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)", textDecoration: "line-through" }}>{nom}</p>
                      <p className="text-xs" style={{ color: "var(--pa-muted)" }}>Visite réalisée{m?.ville ? ` · ${m.ville}` : ""}</p>
                    </div>
                    <Link href={`/visites/${v.id}`} className="text-xs font-semibold shrink-0" style={{ color: "#6B4FD8" }}>Voir</Link>
                  </div>
                );
              }

              return (
                <div key={v.id} className="pa-card p-4"
                     style={estProchaine ? { boxShadow: "inset 0 0 0 2px #6B4FD8" } : undefined}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                         style={{ background: estProchaine ? "#6B4FD8" : "var(--pa-card)", color: estProchaine ? "#fff" : "var(--pa-muted)", boxShadow: estProchaine ? undefined : "inset 0 0 0 1px var(--pa-line)" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {heure && <span className="text-sm font-bold shrink-0" style={{ color: "#6B4FD8" }}>{heure}</span>}
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>{nom}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={conf ? { background: "#D2F2E7", color: "#0F8C68" } : { background: "#FBF1D8", color: "#B07D14" }}>
                          {conf ? "Confirmée" : "À confirmer"}
                        </span>
                        {niv && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: niv.bg, color: niv.fg }}>{niv.label}</span>}
                        {m?.ville && <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{m.ville}</span>}
                        {estProchaine && <span className="text-xs font-semibold" style={{ color: "#6B4FD8" }}>· prochaine</span>}
                      </div>
                    </div>
                  </div>

                  {/* Itinéraire + Appeler */}
                  <div className="grid grid-cols-2 gap-2">
                    {m && (
                      <a href={mapsHref(m)} target="_blank" rel="noreferrer"
                         className="pa-btn-secondary inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold">
                        <NavIcon size={15} /> Itinéraire
                      </a>
                    )}
                    {tel ? (
                      <a href={tel} className="pa-btn-secondary inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold">
                        <Phone size={15} /> Appeler
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold" style={{ color: "var(--pa-muted)", border: "1px solid var(--pa-line)" }}>
                        <Phone size={15} /> —
                      </span>
                    )}
                  </div>

                  {/* Conduire la visite */}
                  <Link href={`/visites/${v.id}/modifier`}
                        className="mt-2 pa-btn-primary inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold">
                    <ClipboardCheck size={15} /> Conduire la visite
                  </Link>

                  {/* Raccourcis terrain */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "var(--pa-line)" }}>
                    <Link href="/animateur/notes" className="text-xs inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
                      <Mic size={14} /> Note vocale
                    </Link>
                    {m && (
                      <Link href={`/remontees/nouvelle?magasin_id=${m.id}`} className="text-xs inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
                        <AlertTriangle size={14} /> Remontée + photo
                      </Link>
                    )}
                  </div>

                  <ActionsVisiteTournee id={v.id} confirmee={conf} date={v.date_prevue ?? date} heure={v.heure_prevue} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
