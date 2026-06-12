import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BoutonRetourNews from "@/components/BoutonRetourNews";
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
      <main className="min-h-screen p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6 pt-8">
          <BoutonRetourNews />
          <h1 className="text-2xl font-bold text-slate-900">Actualités du réseau</h1>
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
            Aucune actualité publiée pour le moment.
          </div>
        </div>
      </main>
    );
  }

  const hero = liste[0];
  const suite = liste.slice(1);
  const lateral = suite.slice(0, 2);   // 2 news à droite du hero
  const grille = suite.slice(2);       // reste en grille 3 colonnes

  return (
    <main className="min-h-screen p-6 md:p-10 pb-16">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <BoutonRetourNews />
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Actualités du réseau</h1>
            <p className="text-slate-500 text-sm mt-0.5">{liste.length} actualité{liste.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Bloc principal : hero gauche + 2 news droite */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Hero (col 1-2) */}
          <Link href={`/news/${hero.id}`} className="lg:col-span-2 block group">
            <article className="pa-card overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="relative h-64 md:h-80">
                {hero.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero.image_url} alt={hero.titre} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${getGradient(hero.type)}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {hero.epinglee && (
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        📌 Épinglée
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_BADGE[hero.type]}`}>
                      {TYPE_LABEL[hero.type]}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{hero.titre}</h2>
                  <p className="text-white/70 text-xs mt-1">
                    {tempsRelatif(hero.date_publication)}{hero.auteur ? ` · ${hero.auteur}` : ""}
                  </p>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">{hero.contenu}</p>
                <span className="inline-block mt-3 text-sm font-medium text-blue-600 group-hover:underline">
                  Lire la suite →
                </span>
              </div>
            </article>
          </Link>

          {/* 2 news latérales (col 3) */}
          <div className="flex flex-col gap-4">
            {lateral.map((n) => (
              <Link key={n.id} href={`/news/${n.id}`} className="flex-1 block group">
                <article className="pa-card overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="relative h-36">
                    {n.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.image_url} alt={n.titre} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full ${getGradient(n.type)}`} />
                    )}
                    <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[n.type]}`}>
                      {TYPE_LABEL[n.type]}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">{tempsRelatif(n.date_publication)}</p>
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{n.titre}</h3>
                    </div>
                    <span className="text-xs font-medium text-blue-600 group-hover:underline mt-2 block">
                      Lire →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
            {/* Remplissage si < 2 news latérales */}
            {lateral.length === 0 && (
              <div className="flex-1 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-sm">
                Prochaines actualités
              </div>
            )}
          </div>
        </div>

        {/* Grille 3 colonnes pour le reste */}
        {grille.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Toutes les actualités
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {grille.map((n) => (
                <Link key={n.id} href={`/news/${n.id}`} className="block group">
                  <article className="pa-card overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="relative h-40">
                      {n.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.image_url} alt={n.titre} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${getGradient(n.type)}`} />
                      )}
                      <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[n.type]}`}>
                        {TYPE_LABEL[n.type]}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">{tempsRelatif(n.date_publication)}{n.auteur ? ` · ${n.auteur}` : ""}</p>
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">{n.titre}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2">{n.contenu}</p>
                      </div>
                      <span className="text-xs font-medium text-blue-600 group-hover:underline mt-3 block">
                        Lire →
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
