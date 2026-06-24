export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { Plus, CircleDot, Moon, Archive, ArrowRight, type LucideIcon } from "lucide-react";
import { guardBureau } from "@/lib/visibilite";

const STATUT_META: Record<string, { label: string; icon: LucideIcon; bg: string; fg: string }> = {
  actif:   { label: "Actif",      icon: CircleDot, bg: "#D2F2E7", fg: "#0F8C68" },
  pause:   { label: "En sommeil", icon: Moon,      bg: "#FBF1D8", fg: "#B07D14" },
  inactif: { label: "Archivé",    icon: Archive,   bg: "#ECEAF3", fg: "#6F6982" },
};

const CHIPS = [
  { key: "actif",    label: "Actifs",     sel: "#1FA98A", selBg: "#D2F2E7", fg: "#0F8C68" },
  { key: "pause",    label: "En sommeil", sel: "#B07D14", selBg: "#FBF1D8", fg: "#B07D14" },
  { key: "inactif",  label: "Archivés",   sel: "#6F6982", selBg: "#ECEAF3", fg: "#6F6982" },
  { key: "tous",     label: "Tous",       sel: "#7C6BE8", selBg: "#EDEBFB", fg: "#6B4FD8" },
] as const;

function StatutBadge({ statut }: { statut: string }) {
  const meta = STATUT_META[statut] ?? STATUT_META.inactif;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

export default async function MagasinsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut: statutFilter = "actif" } = await searchParams;
  await guardBureau("bureau_magasins");
  const supabase = await createClient();

  const baseQuery = supabase
    .from("magasins")
    .select("id, nom, enseigne, ville, region, statut")
    .order("nom");

  const [
    { data: magasins },
    { count: nbActifs },
    { count: nbPause },
    { count: nbInactifs },
  ] = await Promise.all([
    statutFilter === "tous" ? baseQuery : baseQuery.eq("statut", statutFilter),
    supabase.from("magasins").select("*", { count: "exact", head: true }).eq("statut", "actif"),
    supabase.from("magasins").select("*", { count: "exact", head: true }).eq("statut", "pause"),
    supabase.from("magasins").select("*", { count: "exact", head: true }).eq("statut", "inactif"),
  ]);

  const counts: Record<string, number> = {
    actif: nbActifs ?? 0,
    pause: nbPause ?? 0,
    inactif: nbInactifs ?? 0,
    tous: (nbActifs ?? 0) + (nbPause ?? 0) + (nbInactifs ?? 0),
  };

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-4 mb-6 sm:mb-8">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              Magasins du réseau
            </h1>
            <Link
              href="/magasins/nouveau"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 pa-btn-primary rounded-xl text-sm font-semibold"
            >
              <Plus size={16} strokeWidth={2.5} />
              Ajouter un magasin
            </Link>
          </div>

          <Navigation />

          {/* Chips filtre statut */}
          <div className="flex items-center gap-2 flex-wrap" style={{ paddingTop: "12px" }}>
            {CHIPS.map(({ key, label, sel, selBg, fg }) => {
              const actif = statutFilter === key;
              return (
                <Link
                  key={key}
                  href={`/magasins?statut=${key}`}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
                  style={
                    actif
                      ? { background: sel, color: "#fff", boxShadow: `0 4px 12px -4px ${sel}` }
                      : { background: selBg, color: fg }
                  }
                >
                  {label} ({counts[key] ?? 0})
                </Link>
              );
            })}
          </div>
        </div>

        {/* État vide */}
        {(magasins?.length ?? 0) === 0 && (
          <div className="pa-card p-16 text-center space-y-4">
            <p style={{ color: "var(--pa-muted)" }}>Aucun magasin pour ce filtre.</p>
            <Link
              href="/magasins/nouveau"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "#6B4FD8" }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Ajouter un magasin
            </Link>
          </div>
        )}

        {(magasins?.length ?? 0) > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block pa-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Enseigne</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Nom</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Ville</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Région</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Statut</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {(magasins ?? []).map((m) => (
                    <tr key={m.id} className="border-b last:border-0 transition-colors hover:bg-white/40" style={{ borderColor: "var(--pa-line)" }}>
                      <td className="px-6 py-4 font-semibold" style={{ color: "var(--pa-ink)" }}>{m.enseigne ?? "—"}</td>
                      <td className="px-6 py-4" style={{ color: "var(--pa-ink)" }}>{m.nom}</td>
                      <td className="px-6 py-4" style={{ color: "var(--pa-ink)" }}>{m.ville}</td>
                      <td className="px-6 py-4" style={{ color: "var(--pa-muted)" }}>{m.region ?? "—"}</td>
                      <td className="px-6 py-4"><StatutBadge statut={m.statut} /></td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/magasins/${m.id}`} className="inline-flex items-center gap-1 font-semibold" style={{ color: "#6B4FD8", textDecoration: "none" }}>
                          Voir <ArrowRight size={14} strokeWidth={2.5} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {(magasins ?? []).map((m) => (
                <Link
                  key={m.id}
                  href={`/magasins/${m.id}`}
                  className="block pa-card p-4 transition-all active:scale-[.99]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
                      {m.enseigne ?? "—"}
                    </span>
                    <StatutBadge statut={m.statut} />
                  </div>
                  <p className="font-bold mb-1.5 leading-snug" style={{ color: "var(--pa-ink)" }}>{m.nom}</p>
                  {(m.ville || m.region) && (
                    <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                      {[m.ville, m.region].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
