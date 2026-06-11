import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";

type Badge = { label: string; bg: string; fg: string };

export const graviteConfig: Record<string, Badge> = {
  normale:   { label: "Normale",   bg: "#ECEAF3", fg: "#6F6982" },
  attention: { label: "Attention", bg: "#FBF1D8", fg: "#B07D14" },
  urgente:   { label: "Urgente",   bg: "#FBE0E8", fg: "#C0476E" },
};

export const typeLabels: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Technique",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};

export const statutConfig: Record<string, Badge> = {
  nouvelle:  { label: "Nouvelle", bg: "#E4F0FB", fg: "#2D6FD0" },
  en_cours:  { label: "En cours", bg: "#FBF1D8", fg: "#B07D14" },
  traitee:   { label: "Traitée",  bg: "#D2F2E7", fg: "#0F8C68" },
  archivee:  { label: "Archivée", bg: "#ECEAF3", fg: "#6F6982" },
};

const NEUTRAL: Badge = { label: "—", bg: "#ECEAF3", fg: "#6F6982" };

function Pill({ b }: { b: Badge | undefined }) {
  const m = b ?? NEUTRAL;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

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
              <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
                Remontées terrain
              </h1>
              <p className="mt-1" style={{ color: "var(--pa-muted)" }}>
                {triees.length} remontée{triees.length !== 1 ? "s" : ""}
              </p>
            </div>
            {(nbNouvelles ?? 0) > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#FBE0E8", color: "#C0476E" }}>
                {nbNouvelles} nouvelle{(nbNouvelles ?? 0) > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <Link
            href="/remontees/nouvelle"
            className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nouvelle remontée
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
            <p className="mb-3 text-sm" style={{ color: "var(--pa-muted)" }}>
              Aucune remontée trouvée
            </p>
            <Link
              href="/remontees/nouvelle"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "#6B4FD8" }}
            >
              <Plus size={15} strokeWidth={2.5} />
              Créer une nouvelle remontée
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
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Gravité</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Type</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Titre</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Magasin</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Statut</th>
                    <th className="text-left px-6 py-3.5 font-semibold" style={{ color: "var(--pa-muted)" }}>Date</th>
                    <th className="px-6 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {triees.map((r) => {
                    const magasin = r.magasins as unknown as {
                      nom: string;
                      enseigne: string | null;
                    } | null;
                    return (
                      <tr
                        key={r.id}
                        className="border-b last:border-0 transition-colors hover:bg-white/40"
                        style={{ borderColor: "var(--pa-line)" }}
                      >
                        <td className="px-6 py-4"><Pill b={graviteConfig[r.gravite]} /></td>
                        <td className="px-6 py-4">
                          <Pill b={{ label: typeLabels[r.type] ?? r.type, bg: "#ECEAF3", fg: "#6F6982" }} />
                        </td>
                        <td className="px-6 py-4 font-semibold max-w-xs truncate" style={{ color: "var(--pa-ink)" }}>
                          {r.titre}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: "var(--pa-ink)" }}>
                          {magasin
                            ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                            : "—"}
                        </td>
                        <td className="px-6 py-4"><Pill b={statutConfig[r.statut]} /></td>
                        <td className="px-6 py-4 text-xs whitespace-nowrap" style={{ color: "var(--pa-muted)" }}>
                          {new Date(r.created_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/remontees/${r.id}`} className="inline-flex items-center gap-1 font-semibold" style={{ color: "#6B4FD8", textDecoration: "none" }}>
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
              {triees.map((r) => {
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
                    <div className="flex items-center justify-between mb-2">
                      <Pill b={graviteConfig[r.gravite]} />
                      <Pill b={statutConfig[r.statut]} />
                    </div>
                    <p className="font-bold mb-1.5 leading-snug" style={{ color: "var(--pa-ink)" }}>
                      {r.titre}
                    </p>
                    <p className="text-sm mb-3 flex items-center flex-wrap gap-2" style={{ color: "var(--pa-muted)" }}>
                      <Pill b={{ label: typeLabels[r.type] ?? r.type, bg: "#ECEAF3", fg: "#6F6982" }} />
                      {magasin
                        ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
                        : ""}
                    </p>
                    <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
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
