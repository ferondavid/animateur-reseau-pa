import Link from "next/link";
import type { NewsItem } from "@/components/CardNews";

function iconType(t: string) {
  return ({ info: "📢", evenement: "🎉", alerte: "⚠️", temoignage: "💬" } as Record<string, string>)[t] ?? "📰";
}
function libelleType(t: string) {
  return ({ info: "Info", evenement: "Événement", alerte: "Alerte", temoignage: "Témoignage" } as Record<string, string>)[t] ?? t;
}
function badgeBg(t: string) {
  return ({ info: "bg-blue-100", evenement: "bg-purple-100", alerte: "bg-red-100", temoignage: "bg-emerald-100" } as Record<string, string>)[t] ?? "bg-slate-100";
}
function badgeText(t: string) {
  return ({ info: "text-blue-800", evenement: "text-purple-800", alerte: "text-red-800", temoignage: "text-emerald-800" } as Record<string, string>)[t] ?? "text-slate-700";
}
function gradient(t: string) {
  return ({
    info:       "bg-gradient-to-br from-blue-400 to-blue-600",
    evenement:  "bg-gradient-to-br from-purple-400 to-purple-600",
    alerte:     "bg-gradient-to-br from-red-400 to-red-600",
    temoignage: "bg-gradient-to-br from-emerald-400 to-emerald-600",
  } as Record<string, string>)[t] ?? "bg-gradient-to-br from-slate-400 to-slate-600";
}

export default function HeroNews({ news }: { news: NewsItem }) {
  return (
    <article className="w-full bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-200">

      {/* Image pleine largeur */}
      <div className={`relative w-full h-32 md:h-40 lg:h-48 ${!news.image_url ? gradient(news.type) : ""}`}>
        {news.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={news.image_url}
            alt={news.titre}
            className="absolute inset-0 w-full h-full object-cover"
          />
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

      {/* Texte en dessous */}
      <div className="p-6 md:p-8">
        <p className="text-sm text-slate-500">
          {new Date(news.date_publication).toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric",
          })}
          {news.auteur ? ` · par ${news.auteur}` : ""}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mt-2">
          {news.titre}
        </h1>
        <div className="h-px bg-slate-100 my-3" />
        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-base">
          {news.contenu}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Publiée le {new Date(news.date_publication).toLocaleDateString("fr-FR")}
          </p>
          <Link href={`/news/${news.id}`} className="text-xs font-medium text-blue-600 hover:underline">
            Lien permanent →
          </Link>
        </div>
      </div>

    </article>
  );
}
