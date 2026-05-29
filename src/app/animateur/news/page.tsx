import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { supprimerNews, togglePublication, toggleEpingle } from "./actions";
import type { NewsItem } from "@/components/CardNews";

const TYPE_LABEL: Record<string, string> = {
  info: "Info",
  evenement: "Événement",
  alerte: "Alerte",
  temoignage: "Témoignage",
};

export default async function AdminNewsPage() {
  const supabase = await createClient();
  const { data: newsList } = await supabase
    .from("news")
    .select("*")
    .order("epinglee", { ascending: false })
    .order("date_publication", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Actualités réseau</h1>
            <p className="text-slate-500 text-sm mt-0.5">{(newsList ?? []).length} news</p>
          </div>
          <Link
            href="/animateur/news/nouvelle"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm"
          >
            + Nouvelle news
          </Link>
        </div>

        {(newsList ?? []).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400 shadow-sm">
            Aucune news publiée.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Titre</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Type</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">📌</th>
                  <th className="text-center px-3 py-3 font-medium text-slate-600">Publié</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {(newsList as NewsItem[]).map((n) => (
                  <tr key={n.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(n.date_publication).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate">{n.titre}</td>
                    <td className="px-5 py-3 text-slate-600">{TYPE_LABEL[n.type] ?? n.type}</td>
                    <td className="px-3 py-3 text-center">
                      <form action={toggleEpingle.bind(null, n.id, !n.epinglee)}>
                        <button type="submit" className={`text-lg ${n.epinglee ? "opacity-100" : "opacity-30 hover:opacity-60"}`}>📌</button>
                      </form>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <form action={togglePublication.bind(null, n.id, !n.publie)}>
                        <button type="submit" className={`w-10 h-5 rounded-full transition-colors ${n.publie ? "bg-emerald-500" : "bg-slate-300"}`} />
                      </form>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <Link href={`/animateur/news/${n.id}/modifier`} className="text-blue-600 hover:underline text-xs font-medium">
                          Modifier
                        </Link>
                        <form action={supprimerNews.bind(null, n.id)}
                          onSubmit={(e) => { if (!confirm("Supprimer cette news ?")) e.preventDefault(); }}>
                          <button type="submit" className="text-red-400 hover:text-red-600 text-xs font-medium">
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link href="/animateur" className="inline-block text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← Retour tableau de bord
        </Link>
      </div>
    </main>
  );
}
