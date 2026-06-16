export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BoutonAccueil from "@/components/BoutonAccueil";
import Navigation from "@/components/Navigation";
import ActionsVisiteTournee from "@/components/ActionsVisiteTournee";
import { titreMagasin } from "@/lib/magasin";
import { ChevronLeft, ChevronRight, Phone, CalendarRange, CalendarDays } from "lucide-react";

type Magasin = { id: string; nom: string; enseigne: string | null; ville: string | null; contact_telephone: string | null };
type Visite = {
  id: string; statut: string; date_prevue: string | null; heure_prevue: string | null; confirmee: boolean | null;
  created_at: string; magasins: Magasin | null;
};

function decale(dateStr: string, jours: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}
function telHref(tel: string | null): string | null {
  if (!tel) return null;
  const clean = tel.replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : null;
}
function jourLisible(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
function courtLisible(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default async function TourneeSemainePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from: fromParam } = await searchParams;
  const aujourdhui = new Date(Date.now() + 2 * 3600_000).toISOString().slice(0, 10);
  const from = fromParam ?? aujourdhui;
  const to = decale(from, 6);

  const supabase = await createClient();
  const { data } = await supabase
    .from("visites")
    .select("id, statut, date_prevue, heure_prevue, confirmee, created_at, magasins(id, nom, enseigne, ville, contact_telephone)")
    .eq("statut", "planifiee")
    .gte("date_prevue", from)
    .lte("date_prevue", to)
    .order("date_prevue", { ascending: true })
    .order("heure_prevue", { ascending: true, nullsFirst: true });

  const visites = (data ?? []) as unknown as Visite[];
  const total = visites.length;
  const confirmees = visites.filter((v) => v.confirmee).length;

  const parJour = new Map<string, Visite[]>();
  for (const v of visites) {
    const k = v.date_prevue ?? "?";
    if (!parJour.has(k)) parJour.set(k, []);
    parJour.get(k)!.push(v);
  }

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <BoutonAccueil />

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              <CalendarRange size={22} style={{ color: "#6B4FD8" }} /> Tournée de la semaine
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
              {courtLisible(from)} → {courtLisible(to)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/animateur/tournee/semaine?from=${decale(from, -7)}`} aria-label="Semaine précédente"
              className="w-9 h-9 inline-flex items-center justify-center rounded-xl" style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}>
              <ChevronLeft size={16} />
            </Link>
            <Link href={`/animateur/tournee/semaine?from=${decale(from, 7)}`} aria-label="Semaine suivante"
              className="w-9 h-9 inline-flex items-center justify-center rounded-xl" style={{ background: "var(--pa-card)", boxShadow: "inset 0 0 0 1px var(--pa-line)", color: "var(--pa-muted)" }}>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <Navigation />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {total > 0 ? (
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--pa-ink)" }}>{confirmees}/{total}</span> confirmée{total > 1 ? "s" : ""} · {total - confirmees} à valider
            </p>
          ) : <span />}
          <Link href="/animateur/tournee" className="text-sm font-semibold inline-flex items-center gap-1.5" style={{ color: "#6B4FD8" }}>
            <CalendarDays size={14} /> Vue jour
          </Link>
        </div>

        {total === 0 ? (
          <div className="pa-card p-10 text-center space-y-4">
            <CalendarRange size={32} style={{ color: "var(--pa-muted)" }} className="mx-auto" />
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>Aucune visite planifiée sur cette semaine.</p>
            <Link href="/animateur/parcours" className="inline-flex items-center gap-1.5 px-5 py-2.5 pa-btn-primary rounded-xl text-sm font-semibold">
              Préparer une tournée
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {[...parJour.entries()].map(([jour, vs]) => (
              <div key={jour} className="space-y-2">
                <p className="text-sm font-bold capitalize" style={{ color: "var(--pa-ink)" }}>{jourLisible(jour)}</p>
                {vs.map((v) => {
                  const m = v.magasins;
                  const nom = m ? titreMagasin(m.enseigne, m.nom) : "Magasin";
                  const heure = v.heure_prevue ? v.heure_prevue.slice(0, 5) : null;
                  const conf = !!v.confirmee;
                  const tel = telHref(m?.contact_telephone ?? null);
                  return (
                    <div key={v.id} className="pa-card p-3.5">
                      <div className="flex items-center gap-3">
                        {heure && <span className="text-sm font-bold shrink-0" style={{ color: "#6B4FD8", width: 44 }}>{heure}</span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--pa-ink)" }}>{nom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={conf ? { background: "#D2F2E7", color: "#0F8C68" } : { background: "#FBF1D8", color: "#B07D14" }}>
                              {conf ? "Confirmée" : "À confirmer"}
                            </span>
                            {m?.ville && <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{m.ville}</span>}
                          </div>
                        </div>
                        {tel && (
                          <a href={tel} aria-label="Appeler" className="w-9 h-9 inline-flex items-center justify-center rounded-xl shrink-0"
                            style={{ background: "#D2F2E7", color: "#0F8C68" }}>
                            <Phone size={16} />
                          </a>
                        )}
                      </div>
                      <ActionsVisiteTournee id={v.id} confirmee={conf} date={v.date_prevue ?? from} heure={v.heure_prevue} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
