import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";

const urgenceConfig: Record<number, { label: string; style: string }> = {
  1: { label: "Info", style: "bg-slate-100 text-slate-600" },
  2: { label: "Important", style: "bg-orange-100 text-orange-800" },
  3: { label: "Urgent", style: "bg-red-100 text-red-800" },
};

const statutConfig: Record<string, { label: string; style: string }> = {
  ouverte: { label: "Ouverte", style: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", style: "bg-orange-100 text-orange-800" },
  realisee: { label: "Réalisée", style: "bg-green-100 text-green-800" },
  annulee: { label: "Annulée", style: "bg-slate-100 text-slate-600" },
};

const statutOrdre: Record<string, number> = {
  ouverte: 0,
  en_cours: 1,
  realisee: 2,
  annulee: 3,
};

const filtres = [
  { key: undefined as string | undefined, label: "Toutes" },
  { key: "ouvertes", label: "Ouvertes" },
  { key: "en_cours", label: "En cours" },
  { key: "realisees", label: "Réalisées" },
];

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const { filtre } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("actions")
    .select("id, titre, niveau_urgence, portee, magasin_id, statut, deadline, magasins(nom)");

  if (filtre === "ouvertes") query = query.eq("statut", "ouverte");
  else if (filtre === "en_cours") query = query.eq("statut", "en_cours");
  else if (filtre === "realisees") query = query.eq("statut", "realisee");

  const { data: actions } = await query;

  // Tri : statut priorité, urgence DESC, deadline ASC (null en dernier)
  const triees = [...(actions ?? [])].sort((a, b) => {
    const sa = statutOrdre[a.statut] ?? 99;
    const sb = statutOrdre[b.statut] ?? 99;
    if (sa !== sb) return sa - sb;
    if (b.niveau_urgence !== a.niveau_urgence)
      return b.niveau_urgence - a.niveau_urgence;
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Actions</h1>
            <p className="text-slate-500 mt-1">
              {triees.length} action{triees.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/actions-reseau/nouvelle"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors shrink-0"
          >
            + Nouvelle action
          </Link>
        </div>

        <Navigation />

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {filtres.map((f) => {
            const href = f.key ? `/actions-reseau?filtre=${f.key}` : "/actions-reseau";
            const actif = filtre === f.key || (!filtre && !f.key);
            return (
              <Link
                key={f.label}
                href={href}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  actif
                    ? "bg-slate-900 text-white"
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
            <p className="text-slate-400 mb-3 text-sm">Aucune action trouvée</p>
            <Link
              href="/actions-reseau/nouvelle"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Créer une nouvelle action →
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
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Urgence</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Titre</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Portée</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Deadline</th>
                    <th className="text-left px-6 py-3.5 font-medium text-slate-600">Statut</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {triees.map((action) => {
                    const urgence = urgenceConfig[action.niveau_urgence];
                    const statut = statutConfig[action.statut];
                    const magasin = action.magasins as unknown as { nom: string } | null;
                    const deadlineDepasse =
                      action.deadline &&
                      action.deadline < today &&
                      !["realisee", "annulee"].includes(action.statut);
                    return (
                      <tr
                        key={action.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgence?.style ?? "bg-slate-100 text-slate-600"}`}>
                            {urgence?.label ?? action.niveau_urgence}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 max-w-xs truncate">
                          {action.titre}
                        </td>
                        <td className="px-6 py-4">
                          {action.portee === "reseau" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                              Réseau
                            </span>
                          ) : magasin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {magasin.nom}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 ${deadlineDepasse ? "text-red-600 font-medium" : "text-slate-700"}`}>
                          {action.deadline
                            ? new Date(action.deadline).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}>
                            {statut?.label ?? action.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/actions-reseau/${action.id}`} className="text-slate-900 hover:underline font-medium">
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
              {triees.map((action) => {
                const urgence = urgenceConfig[action.niveau_urgence];
                const statut = statutConfig[action.statut];
                const magasin = action.magasins as unknown as { nom: string } | null;
                const deadlineDepasse =
                  action.deadline &&
                  action.deadline < today &&
                  !["realisee", "annulee"].includes(action.statut);
                return (
                  <Link
                    key={action.id}
                    href={`/actions-reseau/${action.id}`}
                    className="block pa-card p-4 transition-all active:scale-[.99]"
                  >
                    {/* Urgence + statut */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgence?.style ?? "bg-slate-100 text-slate-600"}`}>
                        {urgence?.label ?? action.niveau_urgence}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}>
                        {statut?.label ?? action.statut}
                      </span>
                    </div>
                    {/* Titre */}
                    <p className="font-semibold text-slate-900 mb-1.5 leading-snug">
                      {action.titre}
                    </p>
                    {/* Portée + deadline */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {action.portee === "reseau" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                          Réseau
                        </span>
                      ) : magasin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {magasin.nom}
                        </span>
                      ) : null}
                      {action.deadline && (
                        <span className={`text-xs ${deadlineDepasse ? "text-red-600 font-medium" : "text-slate-400"}`}>
                          {new Date(action.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
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
