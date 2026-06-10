export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { togglePublication, toggleEpingle } from "./actions";
import BoutonSupprimerNews from "@/components/BoutonSupprimerNews";
import { getGradient } from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import { getParametreNumber } from "@/lib/parametres";
import SelectNbNewsFiche from "@/components/SelectNbNewsFiche";

const TYPE_BADGE: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  evenement: "bg-purple-100 text-purple-700",
  alerte: "bg-red-100 text-red-700",
  temoignage: "bg-emerald-100 text-emerald-700",
};
const TYPE_LABEL: Record<string, string> = {
  info: "Info", evenement: "Événement", alerte: "Alerte", temoignage: "Témoignage",
};

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
            <h1 className="text-2xl font-semibold text-slate-900">📰 Actualités du réseau</h1>
            <p className="text-slate-500 text-sm mt-0.5">{liste.length} news</p>
          </div>
          <Link
            href="/animateur/news/nouvelle"
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm"
          >
            + Nouvelle news
          </Link>
        </div>

        {/* Paramètres d'affichage */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Nombre de news affichées sur les fiches membre</p>
          <SelectNbNewsFiche valeurInitiale={nbNewsActuel} />
        </div>

        {liste.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
            <p className="text-slate-400 text-sm">Aucune news pour l&apos;instant.</p>
            <Link
              href="/animateur/news/nouvelle"
              className="inline-block px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
            >
              Créer la première news →
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--pa-line)" }}>
                    <th className="px-4 py-3 w-16" />
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Titre</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                    <th className="text-center px-3 py-3 font-medium text-slate-600">📌</th>
                    <th className="text-center px-3 py-3 font-medium text-slate-600">Pub.</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {liste.map((n) => (
                    <tr key={n.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        {n.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.image_url} alt="" className="w-14 h-10 object-cover rounded-lg border border-slate-200" />
                        ) : (
                          <div className={`w-14 h-10 rounded-lg ${getGradient(n.type)}`} />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                        <Link href={`/news/${n.id}`} target="_blank" className="hover:underline truncate block">
                          {n.titre}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[n.type] ?? "bg-slate-100 text-slate-600"}`}>
                          {TYPE_LABEL[n.type] ?? n.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {new Date(n.date_publication).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <form action={toggleEpingle.bind(null, n.id, !n.epinglee)}>
                          <button type="submit" className={`text-lg transition-opacity ${n.epinglee ? "opacity-100" : "opacity-25 hover:opacity-60"}`}>📌</button>
                        </form>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <form action={togglePublication.bind(null, n.id, !n.publie)}>
                          <button type="submit"
                            className={`w-10 h-5 rounded-full transition-colors ${n.publie ? "bg-emerald-500" : "bg-slate-300"}`}
                            title={n.publie ? "Dépublier" : "Publier"}
                          />
                        </form>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <Link href={`/animateur/news/${n.id}/modifier`} className="text-blue-600 hover:underline text-xs font-medium">
                            ✏️ Modifier
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
                <div key={n.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {n.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.image_url} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className={`w-14 h-14 rounded-lg shrink-0 ${getGradient(n.type)}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{n.titre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[n.type] ?? "bg-slate-100 text-slate-600"}`}>
                          {TYPE_LABEL[n.type] ?? n.type}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(n.date_publication).toLocaleDateString("fr-FR")}</span>
                        {n.epinglee && <span className="text-xs">📌</span>}
                        {!n.publie && <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">Non publié</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                    <form action={toggleEpingle.bind(null, n.id, !n.epinglee)} className="flex-1">
                      <button type="submit" className="text-xs text-slate-500 hover:text-slate-900 w-full text-center">
                        {n.epinglee ? "📌 Désépingler" : "📌 Épingler"}
                      </button>
                    </form>
                    <form action={togglePublication.bind(null, n.id, !n.publie)} className="flex-1">
                      <button type="submit" className={`text-xs w-full text-center ${n.publie ? "text-emerald-600" : "text-slate-400"}`}>
                        {n.publie ? "👁 Dépublier" : "👁 Publier"}
                      </button>
                    </form>
                    <Link href={`/animateur/news/${n.id}/modifier`} className="flex-1 text-xs text-blue-600 text-center">✏️ Modifier</Link>
                    <div className="flex-1 text-center"><BoutonSupprimerNews id={n.id} /></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Link href="/animateur" className="inline-block text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← Retour tableau de bord
        </Link>
      </div>
    </main>
  );
}
