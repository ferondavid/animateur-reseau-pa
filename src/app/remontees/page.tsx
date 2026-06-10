import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";

export const graviteConfig: Record<string, { label: string; style: string }> = {
  normale: { label: "Normale", style: "bg-slate-100 text-slate-600" },
  attention: { label: "Attention", style: "bg-orange-100 text-orange-800" },
  urgente: { label: "Urgente", style: "bg-red-100 text-red-800" },
};

export const typeLabels: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Technique",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};

export const statutConfig: Record<string, { label: string; style: string }> = {
  nouvelle: { label: "Nouvelle", style: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", style: "bg-orange-100 text-orange-800" },
  traitee: { label: "Traitée", style: "bg-green-100 text-green-800" },
  archivee: { label: "Archivée", style: "bg-slate-100 text-slate-600" },
};

const statutOrdre: Record<string, number> = {
  nouvelle: 0,
  en_cours: 1,
  traitee: 2,
  archivee: 3,
};
const graviteOrdre: Record<string, number> = {
  urgente: 0,
  attention: 1,
  normale: 2,
};

const filtres = [
  { key: undefined as string | undefined, label: "Toutes" },
  { key: "nouvelles", label: "Nouvelles" },
  { key: "en_cours", label: "En cours" },
  { key: "traitees", label: "Traitées" },
];

export default async function RemonteesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const { filtre } = await searchParams;
  const supabase = await createClient();

  // Compteur nouvelles indépendant du filtre actif
  const [remonteesFetch, { count: nbNouvelles }] = await Promise.all([
    (() => {
      let q = supabase
        .from("remontees")
        .select(
          "id, titre, type, gravite, statut, created_at, magasins(nom, enseigne)"
        );
      if (filtre === "nouvelles") q = q.eq("statut", "nouvelle");
      else if (filtre === "en_cours") q = q.eq("statut", "en_cours");
      else if (filtre === "traitees") q = q.eq("statut", "traitee");
      return q;
    })(),
    supabase
      .from("remontees")
      .select("*", { count: "exact", head: true })
      .eq("statut", "nouvelle"),
  ]);

  const { data: remontees } = remonteesFetch;

  // Tri : statut priorité, gravité DESC, created_at DESC
  const triees = [...(remontees ?? [])].sort((a, b) => {
    const sa = statutOrdre[a.statut] ?? 99;
    const sb = statutOrdre[b.statut] ?? 99;
    if (sa !== sb) return sa - sb;
    const ga = graviteOrdre[a.gravite] ?? 99;
    const gb = graviteOrdre[b.gravite] ?? 99;
    if (ga !== gb) return ga - gb;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Remontées terrain
              </h1>
              <p className="text-slate-500 mt-1">
                {triees.length} remontée{triees.length !== 1 ? "s" : ""}
              </p>
            </div>
            {(nbNouvelles ?? 0) > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                {nbNouvelles} nouvelle{(nbNouvelles ?? 0) > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Link
            href="/remontees/nouvelle"
            className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            + Nouvelle remontée
          </Link>
        </div>

        <Navigation />

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {filtres.map((f) => {
            const href = f.key ? `/remontees?filtre=${f.key}` : "/remontees";
            const actif = filtre === f.key || (!filtre && !f.key);
            return (
              <Link
                key={f.label}
                href={href}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  actif
                    ? "bg-violet-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* État vide */}
        {triees.length === 0 && (
          <div className="pa-card p-16 text-center">
            <p className="text-slate-400 mb-3 text-sm">
              Aucune remontée trouvée
            </p>
            <Link
              href="/remontees/nouvelle"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Créer une nouvelle remontée →
            </Link>
          </div>
        )}

        {triees.length > 0 && (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block pa-card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Gravité</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Type</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Titre</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Magasin</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Statut</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Date</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {triees.map((r) => {
                    const gravite = graviteConfig[r.gravite];
                    const statut = statutConfig[r.statut];
                    const magasin = r.magasins as unknown as {
                      nom: string;
                      enseigne: string | null;
                    } | null;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gravite?.style ?? "bg-slate-100 text-slate-600"}`}>
                            {gravite?.label ?? r.gravite}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {typeLabels[r.type] ?? r.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">
                          {r.titre}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {magasin
                            ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}>
                            {statut?.label ?? r.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/remontees/${r.id}`} className="text-slate-900 hover:underline font-medium">
                            Voir →
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
              {triees.map((r) => {
                const gravite = graviteConfig[r.gravite];
                const statut = statutConfig[r.statut];
                const magasin = r.magasins as unknown as {
                  nom: string;
                  enseigne: string | null;
                } | null;
                return (
                  <Link
                    key={r.id}
                    href={`/remontees/${r.id}`}
                    className="block pa-card p-4 transition-all active:scale-[.99]"
                  >
                    {/* Gravité + statut */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gravite?.style ?? "bg-slate-100 text-slate-600"}`}>
                        {gravite?.label ?? r.gravite}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}>
                        {statut?.label ?? r.statut}
                      </span>
                    </div>
                    {/* Titre */}
                    <p className="font-semibold text-slate-900 mb-1.5 leading-snug">
                      {r.titre}
                    </p>
                    {/* Type + magasin */}
                    <p className="text-sm text-slate-500 mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 mr-2">
                        {typeLabels[r.type] ?? r.type}
                      </span>
                      {magasin
                        ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                        : ""}
                    </p>
                    {/* Date */}
                    <p className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
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
