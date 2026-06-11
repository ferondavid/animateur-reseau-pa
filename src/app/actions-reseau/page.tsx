import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";

type Badge = { label: string; bg: string; fg: string };

const urgenceConfig: Record<number, Badge> = {
  1: { label: "Info",      bg: "#ECEAF3", fg: "#6F6982" },
  2: { label: "Important", bg: "#FBF1D8", fg: "#B07D14" },
  3: { label: "Urgent",    bg: "#FBE0E8", fg: "#C0476E" },
};

const statutConfig: Record<string, Badge> = {
  ouverte:  { label: "Ouverte",  bg: "#E4F0FB", fg: "#2D6FD0" },
  en_cours: { label: "En cours", bg: "#FBF1D8", fg: "#B07D14" },
  realisee: { label: "Réalisée", bg: "#D2F2E7", fg: "#0F8C68" },
  annulee:  { label: "Annulée",  bg: "#ECEAF3", fg: "#6F6982" },
};

function Pill({ b }: { b: Badge | undefined }) {
  const m = b ?? { label: "—", bg: "#ECEAF3", fg: "#6F6982" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

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
            <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>Actions</h1>
            <p className="mt-1" style={{ color: "var(--pa-muted)" }}>
              {triees.length} action{triees.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/actions-reseau/nouvelle"
            className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nouvelle action
          </Link>
        </div>

        <Navigation />

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap" style={{ paddingTop: "12px" }}>
          {filtres.map((f) => {
            const href = f.key ? `/actions-reseau?filtre=${f.key}` : "/actions-reseau";
            const actif = filtre === f.key || (!filtre && !f.key);
            return (
              <Link
                key={f.label}
                href={href}
                className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={
                  actif
                    ? { background: "#7C6BE8", color: "#fff", boxShadow: "0 4px 12px -4px #7C6BE8" }
                    : { background: "#EDEBFB", color: "#6B4FD8" }
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* État vide */}
        {triees.length === 0 && (
          <div className="pa-card p-16 text-center">
            <p className="mb-3 text-sm" style={{ color: "var(--pa-muted)" }}>Aucune action trouvée</p>
            <Link
              href="/actions-reseau/nouvelle"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "#6B4FD8" }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Créer une nouvelle action
            </Link>
          </div>
        )}

        {triees.length > 0 && (
          <>
            {/* Vue desktop : tableau */}
            <div className="hidden md:block pa-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Urgence</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Titre</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Portée</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Deadline</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Statut</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {triees.map((action) => {
                    const magasin = action.magasins as unknown as { nom: string } | null;
                    const deadlineDepasse =
                      action.deadline &&
                      action.deadline < today &&
                      !["realisee", "annulee"].includes(action.statut);
                    return (
                      <tr
                        key={action.id}
                        className="border-b last:border-0 transition-colors hover:bg-white/40"
                        style={{ borderColor: "var(--pa-line)" }}
                      >
                        <td className="px-6 py-4"><Pill b={urgenceConfig[action.niveau_urgence]} /></td>
                        <td className="px-6 py-4 font-semibold max-w-xs truncate" style={{ color: "var(--pa-ink)" }}>
                          {action.titre}
                        </td>
                        <td className="px-6 py-4">
                          {action.portee === "reseau" ? (
                            <Pill b={{ label: "Réseau", bg: "#EDEBFB", fg: "#6B4FD8" }} />
                          ) : magasin ? (
                            <Pill b={{ label: magasin.nom, bg: "#ECEAF3", fg: "#6F6982" }} />
                          ) : (
                            <span className="text-xs" style={{ color: "var(--pa-muted)" }}>—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium" style={{ color: deadlineDepasse ? "#C0476E" : "var(--pa-ink)" }}>
                          {action.deadline
                            ? new Date(action.deadline).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="px-6 py-4"><Pill b={statutConfig[action.statut]} /></td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/actions-reseau/${action.id}`} className="inline-flex items-center gap-1 font-semibold" style={{ color: "#6B4FD8", textDecoration: "none" }}>
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
              {triees.map((action) => {
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
                    <div className="flex items-center justify-between mb-2">
                      <Pill b={urgenceConfig[action.niveau_urgence]} />
                      <Pill b={statutConfig[action.statut]} />
                    </div>
                    <p className="font-bold mb-1.5 leading-snug" style={{ color: "var(--pa-ink)" }}>
                      {action.titre}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {action.portee === "reseau" ? (
                        <Pill b={{ label: "Réseau", bg: "#EDEBFB", fg: "#6B4FD8" }} />
                      ) : magasin ? (
                        <Pill b={{ label: magasin.nom, bg: "#ECEAF3", fg: "#6F6982" }} />
                      ) : null}
                      {action.deadline && (
                        <span className="text-xs font-medium" style={{ color: deadlineDepasse ? "#C0476E" : "var(--pa-muted)" }}>
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
