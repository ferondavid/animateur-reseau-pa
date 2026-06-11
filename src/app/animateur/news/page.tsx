export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Pin, Pencil, ArrowLeft } from "lucide-react";
import { togglePublication, toggleEpingle } from "./actions";
import BoutonSupprimerNews from "@/components/BoutonSupprimerNews";
import { getGradient } from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import { getParametreNumber } from "@/lib/parametres";
import SelectNbNewsFiche from "@/components/SelectNbNewsFiche";

const TYPE_BADGE: Record<string, { bg: string; fg: string }> = {
  info:       { bg: "#E4F0FB", fg: "#2D6FD0" },
  evenement:  { bg: "#EDEBFB", fg: "#6B4FD8" },
  alerte:     { bg: "#FBE0E8", fg: "#C0476E" },
  temoignage: { bg: "#D2F2E7", fg: "#0F8C68" },
};
const TYPE_LABEL: Record<string, string> = {
  info: "Info", evenement: "Événement", alerte: "Alerte", temoignage: "Témoignage",
};

function TypePill({ type }: { type: string }) {
  const m = TYPE_BADGE[type] ?? { bg: "#ECEAF3", fg: "#6F6982" };
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.fg }}>
      {TYPE_LABEL[type] ?? type}
    </span>
  );
}

export default async function AdminNewsPage() {
  const supabase = await createClient();
  const [{ data: newsList }, nbNewsActuel] = await Promise.all([
    supabase
      .from("news")
      .select("*")
      .order("epinglee", { ascending: false })
      .order("date_publication", { ascending: false }),
    getParametreNumber("nb_news_fiche_membre", 1),
  ]);

  const liste = (newsList ?? []) as NewsItem[];

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>Actualités du réseau</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>{liste.length} news</p>
          </div>
          <Link
            href="/animateur/news/nouvelle"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 pa-btn-primary rounded-xl text-sm font-semibold"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nouvelle news
          </Link>
        </div>

        {/* Paramètres d'affichage */}
        <div className="pa-card p-4">
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--pa-ink)" }}>Nombre de news affichées sur les fiches membre</p>
          <SelectNbNewsFiche valeurInitiale={nbNewsActuel} />
        </div>

        {liste.length === 0 ? (
          <div className="pa-card p-12 text-center space-y-4">
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>Aucune news pour l&apos;instant.</p>
            <Link
              href="/animateur/news/nouvelle"
              className="inline-flex items-center gap-1.5 px-6 py-3 pa-btn-primary rounded-xl text-sm font-semibold"
            >
              <Plus size={15} strokeWidth={2.5} />
              Créer la première news
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block pa-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="px-4 py-3 w-16" />
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--pa-muted)" }}>Titre</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--pa-muted)" }}>Type</th>
                    <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--pa-muted)" }}>Date</th>
                    <th className="text-center px-3 py-3 font-semibold" style={{ color: "var(--pa-muted)" }}>Épinglée</th>
                    <th className="text-center px-3 py-3 font-semibold" style={{ color: "var(--pa-muted)" }}>Pub.</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {liste.map((n) => (
                    <tr key={n.id} className="border-b last:border-0 transition-colors hover:bg-white/40" style={{ borderColor: "var(--pa-line)" }}>
                      <td className="px-4 py-3">
                        {n.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.image_url} alt="" className="w-14 h-10 object-cover rounded-lg" style={{ border: "1px solid var(--pa-line)" }} />
                        ) : (
                          <div className={`w-14 h-10 rounded-lg ${getGradient(n.type)}`} />
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold max-w-xs" style={{ color: "var(--pa-ink)" }}>
                        <Link href={`/news/${n.id}`} target="_blank" className="hover:underline truncate block">
                          {n.titre}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><TypePill type={n.type} /></td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--pa-muted)" }}>
                        {new Date(n.date_publication).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <form action={toggleEpingle.bind(null, n.id, !n.epinglee)}>
                          <button type="submit" aria-label={n.epinglee ? "Désépingler" : "Épingler"} className="inline-flex transition-colors" style={{ color: n.epinglee ? "#7C6BE8" : "#C8C4D6" }}>
                            <Pin size={18} strokeWidth={2.2} fill={n.epinglee ? "#7C6BE8" : "none"} />
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <form action={togglePublication.bind(null, n.id, !n.publie)}>
                          <button type="submit"
                            className="w-10 h-5 rounded-full transition-colors inline-block"
                            style={{ background: n.publie ? "#1FA98A" : "#D3D1C7" }}
                            title={n.publie ? "Dépublier" : "Publier"}
                          />
                        </form>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <Link href={`/animateur/news/${n.id}/modifier`} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#6B4FD8" }}>
                            <Pencil size={13} strokeWidth={2.5} /> Modifier
                          </Link>
                          <BoutonSupprimerNews id={n.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile : cards */}
            <div className="md:hidden space-y-3">
              {liste.map((n) => (
                <div key={n.id} className="pa-card p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {n.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.image_url} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className={`w-14 h-14 rounded-lg shrink-0 ${getGradient(n.type)}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "var(--pa-ink)" }}>{n.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <TypePill type={n.type} />
                        <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{new Date(n.date_publication).toLocaleDateString("fr-FR")}</span>
                        {n.epinglee && <Pin size={13} strokeWidth={2.2} fill="#7C6BE8" style={{ color: "#7C6BE8" }} />}
                        {!n.publie && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#ECEAF3", color: "#6F6982" }}>Non publié</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: "var(--pa-line)" }}>
                    <form action={toggleEpingle.bind(null, n.id, !n.epinglee)} className="flex-1">
                      <button type="submit" className="text-xs w-full text-center font-semibold" style={{ color: "var(--pa-muted)" }}>
                        {n.epinglee ? "Désépingler" : "Épingler"}
                      </button>
                    </form>
                    <form action={togglePublication.bind(null, n.id, !n.publie)} className="flex-1">
                      <button type="submit" className="text-xs w-full text-center font-semibold" style={{ color: n.publie ? "#0F8C68" : "var(--pa-muted)" }}>
                        {n.publie ? "Dépublier" : "Publier"}
                      </button>
                    </form>
                    <Link href={`/animateur/news/${n.id}/modifier`} className="flex-1 text-xs text-center font-semibold" style={{ color: "#6B4FD8" }}>Modifier</Link>
                    <div className="flex-1 text-center"><BoutonSupprimerNews id={n.id} /></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Link href="/animateur" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--pa-muted)" }}>
          <ArrowLeft size={15} strokeWidth={2.5} />
          Retour tableau de bord
        </Link>
      </div>
    </main>
  );
}
