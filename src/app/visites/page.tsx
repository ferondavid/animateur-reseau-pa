import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { Plus, ArrowRight } from "lucide-react";

const STATUT: Record<string, { label: string; bg: string; fg: string }> = {
  planifiee: { label: "Planifiée", bg: "#E4F0FB", fg: "#2D6FD0" },
  realisee:  { label: "Réalisée",  bg: "#D2F2E7", fg: "#0F8C68" },
  annulee:   { label: "Annulée",   bg: "#ECEAF3", fg: "#6F6982" },
  reportee:  { label: "Reportée",  bg: "#FBF1D8", fg: "#B07D14" },
};

function StatutPill({ statut }: { statut: string }) {
  const m = STATUT[statut] ?? { label: statut, bg: "#ECEAF3", fg: "#6F6982" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: m.bg, color: m.fg }}>
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

function EtoilesInline({ note }: { note: number | null }) {
  if (!note) return null;
  return <span className="text-sm" style={{ color: "#EF9F27" }}>{"★".repeat(note)}</span>;
}

export default async function VisitesPage() {
  const supabase = await createClient();
  const { data: visites } = await supabase
    .from("visites")
    .select(
      "id, date_prevue, date_realisee, statut, note_confiance, note_business, magasins(nom, enseigne, ville)"
    )
    .order("date_realisee", { ascending: false, nullsFirst: false })
    .order("date_prevue", { ascending: false });

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>Visites</h1>
              <span className="text-sm" style={{ color: "var(--pa-muted)" }}>
                {visites?.length ?? 0} visite
                {(visites?.length ?? 0) > 1 ? "s" : ""}
              </span>
            </div>
            <Link
              href="/visites/nouvelle"
              className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold shrink-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              Nouvelle visite
            </Link>
          </div>
          <Navigation />
        </div>

        {/* État vide */}
        {(visites?.length ?? 0) === 0 && (
          <div className="pa-card p-16 text-center" style={{ marginTop: "12px" }}>
            <p style={{ color: "var(--pa-muted)" }}>Aucune visite enregistrée.</p>
          </div>
        )}

        {(visites?.length ?? 0) > 0 && (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block pa-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Date</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Magasin</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Statut</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Confiance</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Business</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {(visites ?? []).map((v) => {
                    const date = v.date_realisee ?? v.date_prevue;
                    const magasin = v.magasins as unknown as {
                      nom: string;
                      enseigne: string | null;
                      ville: string | null;
                    } | null;
                    return (
                      <tr
                        key={v.id}
                        className="border-b last:border-0 transition-colors hover:bg-white/40"
                        style={{ borderColor: "var(--pa-line)" }}
                      >
                        <td className="px-6 py-4" style={{ color: "var(--pa-ink)" }}>
                          {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="px-6 py-4 font-semibold" style={{ color: "var(--pa-ink)" }}>
                          {magasin
                            ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                            : "—"}
                        </td>
                        <td className="px-6 py-4"><StatutPill statut={v.statut} /></td>
                        <td className="px-6 py-4"><Etoiles note={v.note_confiance} /></td>
                        <td className="px-6 py-4"><Etoiles note={v.note_business} /></td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/visites/${v.id}`} className="inline-flex items-center gap-1 font-semibold" style={{ color: "#6B4FD8", textDecoration: "none" }}>
                            Voir <ArrowRight size={14} strokeWidth={2.5} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vue mobile : cartes empilées */}
            <div className="md:hidden space-y-3">
              {(visites ?? []).map((v) => {
                const date = v.date_realisee ?? v.date_prevue;
                const magasin = v.magasins as unknown as {
                  nom: string;
                  enseigne: string | null;
                  ville: string | null;
                } | null;
                return (
                  <Link
                    key={v.id}
                    href={`/visites/${v.id}`}
                    className="block pa-card p-4 transition-all active:scale-[.99]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: "var(--pa-ink)" }}>
                        {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
                      </span>
                      <StatutPill statut={v.statut} />
                    </div>
                    <p className="font-bold mb-1.5 leading-snug" style={{ color: "var(--pa-ink)" }}>
                      {magasin
                        ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                        : "—"}
                    </p>
                    {(v.note_confiance || v.note_business) && (
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--pa-muted)" }}>
                        {v.note_confiance && (
                          <span>C&nbsp;<EtoilesInline note={v.note_confiance} /></span>
                        )}
                        {v.note_business && (
                          <span>B&nbsp;<EtoilesInline note={v.note_business} /></span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
