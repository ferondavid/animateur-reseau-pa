import Link from "next/link";
import type { NewsItem } from "@/components/CardNews";

function iconType(t: string) {
  return { info: "📢", evenement: "🎉", alerte: "⚠️", temoignage: "💬" }[t] ?? "📰";
}
function libelleType(t: string) {
  return { info: "Info", evenement: "Événement", alerte: "Alerte", temoignage: "Témoignage" }[t] ?? t;
}
function badgeBg(t: string) {
  return { info: "bg-blue-100", evenement: "bg-purple-100", alerte: "bg-red-100", temoignage: "bg-emerald-100" }[t] ?? "bg-slate-100";
}
function badgeText(t: string) {
  return { info: "text-blue-800", evenement: "text-purple-800", alerte: "text-red-800", temoignage: "text-emerald-800" }[t] ?? "text-slate-700";
}
function gradient(t: string) {
  return {
    info:       "bg-gradient-to-br from-blue-400 to-blue-600",
    evenement:  "bg-gradient-to-br from-purple-400 to-purple-600",
    alerte:     "bg-gradient-to-br from-red-400 to-red-600",
    temoignage: "bg-gradient-to-br from-emerald-400 to-emerald-600",
  }[t] ?? "bg-gradient-to-br from-slate-400 to-slate-600";
}

function dateFR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function HeroNews({ news }: { news: NewsItem }) {
  return (
    <Link href={`/news/${news.id}`} className="block group w-full">
      <article className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden min-h-[400px] grid grid-cols-1 md:grid-cols-2 hover:shadow-xl transition-shadow">

        {/* Image / dégradé */}
        <div className="relative aspect-[16/10] md:aspect-auto md:h-full min-h-[220px]">
          {news.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={news.image_url}
              alt={news.titre}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`absolute inset-0 w-full h-full ${gradient(news.type)}`} />
          )}
          {news.epinglee && (
            <div className="absolute top-4 left-4 bg-amber-400 text-amber-950 px-3 py-1.5 rounded-full text-xs font-bold shadow-md inline-flex items-center gap-1.5">
              📌 Épinglée
            </div>
          )}
          <div className={`absolute top-4 right-4 ${badgeBg(news.type)} ${badgeText(news.type)} px-3 py-1.5 rounded-full text-xs font-bold shadow-md`}>
            {iconType(news.type)} {libelleType(news.type)}
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 md:p-10 flex flex-col">
          <p className="text-sm text-slate-500">
            {dateFR(news.date_publication)}
            {news.auteur ? ` · par ${news.auteur}` : ""}
          </p>

          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
            {news.titre}
          </h2>

          <div className="mt-5 mb-5 h-px bg-slate-100" />

          <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap flex-1">
            {news.contenu}
          </p>

          <p className="mt-6 text-xs text-slate-400">
            Publiée le {new Date(news.date_publication).toLocaleDateString("fr-FR")}
          </p>
        </div>

      </article>
    </Link>
  );
}
