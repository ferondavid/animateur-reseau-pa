export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const STATUT_BADGE: Record<string, string> = {
  actif: "bg-green-100 text-green-800",
  pause: "bg-yellow-100 text-yellow-800",
  inactif: "bg-slate-100 text-slate-600",
};
const STATUT_EMOJI: Record<string, string> = {
  actif: "🟢",
  pause: "🌙",
  inactif: "🗄️",
};
const STATUT_LABEL: Record<string, string> = {
  actif: "Actif",
  pause: "En sommeil",
  inactif: "Archivé",
};

const CHIPS = [
  { key: "actif",    label: "Actifs",      sel: "bg-emerald-500 text-white", def: "bg-emerald-100 text-emerald-700" },
  { key: "pause",    label: "En sommeil",  sel: "bg-amber-500 text-white",   def: "bg-amber-100 text-amber-700" },
  { key: "inactif",  label: "Archivés",    sel: "bg-slate-500 text-white",   def: "bg-slate-100 text-slate-600" },
  { key: "tous",     label: "Tous",        sel: "bg-blue-500 text-white",    def: "bg-blue-100 text-blue-700" },
] as const;

export default async function MagasinsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut: statutFilter = "actif" } = await searchParams;
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
            <h1 className="text-2xl font-semibold text-slate-900">Magasins du réseau</h1>
            <Link
              href="/magasins/nouveau"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              + Ajouter un magasin
            </Link>
          </div>

          <Navigation />

          {/* Chips filtre statut */}
          <div className="flex items-center gap-2 flex-wrap">
            {CHIPS.map(({ key, label, sel, def }) => (
              <Link
                key={key}
                href={`/magasins?statut=${key}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  statutFilter === key ? sel : def
                }`}
              >
                {label} ({counts[key] ?? 0})
              </Link>
            ))}
          </div>
        </div>

        {/* État vide */}
        {(magasins?.length ?? 0) === 0 && (
          <div className="pa-card p-16 text-center space-y-4">
            <p className="text-slate-400">Aucun magasin pour ce filtre.</p>
            <Link
              href="/magasins/nouveau"
              className="inline-block text-sm text-blue-600 hover:underline font-medium"
            >
              + Ajouter un magasin →
            </Link>
          </div>
        )}

        {(magasins?.length ?? 0) > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block pa-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Enseigne</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Nom</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Ville</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Région</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Statut</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {(magasins ?? []).map((m) => (
                    <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{m.enseigne ?? "—"}</td>
                      <td className="px-6 py-4 text-slate-700">{m.nom}</td>
                      <td className="px-6 py-4 text-slate-700">{m.ville}</td>
                      <td className="px-6 py-4 text-slate-500">{m.region ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGE[m.statut] ?? "bg-slate-100 text-slate-600"}`}>
                          {STATUT_EMOJI[m.statut]} {STATUT_LABEL[m.statut] ?? m.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/magasins/${m.id}`} className="text-slate-900 hover:underline font-medium">
                          Voir →
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
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {m.enseigne ?? "—"}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_BADGE[m.statut] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUT_EMOJI[m.statut]} {STATUT_LABEL[m.statut] ?? m.statut}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 mb-1.5 leading-snug">{m.nom}</p>
                  {(m.ville || m.region) && (
                    <p className="text-sm text-slate-500">
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
