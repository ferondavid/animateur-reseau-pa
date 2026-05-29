import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGradient } from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";

const TYPE_BADGE: Record<string, string> = {
  info:       "bg-blue-100 text-blue-700",
  evenement:  "bg-purple-100 text-purple-700",
  alerte:     "bg-red-100 text-red-700",
  temoignage: "bg-emerald-100 text-emerald-700",
};
const TYPE_LABEL: Record<string, string> = {
  info: "Info", evenement: "Événement", alerte: "Alerte", temoignage: "Témoignage",
};

function tempsRelatif(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const j = Math.floor(diff / 86400000);
  if (j === 0) return "Aujourd'hui";
  if (j === 1) return "Hier";
  if (j < 7) return `Il y a ${j} jours`;
  if (j < 30) return `Il y a ${Math.floor(j / 7)} sem.`;
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function NewsListePage() {
  const supabase = await createClient();

  const { data: newsList } = await supabase
    .from("news")
    .select("id, titre, contenu, image_url, type, auteur, epinglee, date_publication")
    .eq("publie", true)
    .order("epinglee", { ascending: false })
    .order("date_publication", { ascending: false });

  const liste = (newsList ?? []) as NewsItem[];

  if (liste.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="max-w-2xl mx-auto space-y-6 pt-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Retour</Link>
          <h1 className="text-2xl font-bold text-slate-900">Actualités du réseau</h1>
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            Aucune actualité publiée pour le moment.
          </div>
        </div>
      </main>
    );
  }

  const epinglee = liste.find((n) => n.epinglee);
  const reste = liste.filter((n) => !n.epinglee || n.id !== epinglee?.id);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 pb-16">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Retour</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Actualités du réseau</h1>
          <p className="text-slate-500 text-sm mt-0.5">{liste.length} actualité{liste.length > 1 ? "s" : ""}</p>
        </div>

        {/* News épinglée — affichage hero */}
        {epinglee && (
          <Link href={`/news/${epinglee.id}`} className="block group">
            <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative h-56 md:h-72">
                {epinglee.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={epinglee.image_url} alt={epinglee.titre} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${getGradient(epinglee.type)}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      📌 Épinglée
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_BADGE[epinglee.type]}`}>
                      {TYPE_LABEL[epinglee.type]}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight">{epinglee.titre}</h2>
                  <p className="text-white/70 text-xs mt-1">{tempsRelatif(epinglee.date_publication)}{epinglee.auteur ? ` · ${epinglee.auteur}` : ""}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">{epinglee.contenu}</p>
                <span className="inline-block mt-3 text-sm font-medium text-blue-600 group-hover:underline">
                  Lire la suite →
                </span>
              </div>
            </article>
          </Link>
        )}

        {/* Reste des news */}
        {reste.length > 0 && (
          <div className="space-y-4">
            {epinglee && (
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Toutes les actualités
              </h2>
            )}
            {reste.map((n) => (
              <Link key={n.id} href={`/news/${n.id}`} className="block group">
                <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex gap-0">
                  {/* Image ou dégradé */}
                  <div className="relative shrink-0 w-28 md:w-40">
                    {n.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.image_url} alt={n.titre} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full min-h-[100px] ${getGradient(n.type)}`} />
                    )}
                  </div>
                  {/* Contenu */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[n.type]}`}>
                          {TYPE_LABEL[n.type]}
                        </span>
                        <span className="text-xs text-slate-400">{tempsRelatif(n.date_publication)}</span>
                        {n.auteur && <span className="text-xs text-slate-400">· {n.auteur}</span>}
                      </div>
                      <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{n.titre}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 hidden md:block">{n.contenu}</p>
                    </div>
                    <span className="text-xs font-medium text-blue-600 group-hover:underline mt-2 block">
                      Lire →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
