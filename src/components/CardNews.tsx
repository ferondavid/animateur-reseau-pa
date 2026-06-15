import Link from "next/link";
import { stripMarkdown } from "@/lib/markdown";

export type NewsItem = {
  id: string;
  titre: string;
  contenu: string;
  image_url: string | null;
  type: "info" | "evenement" | "alerte" | "temoignage";
  auteur: string | null;
  epinglee: boolean;
  publie?: boolean;
  date_publication: string;
};

const TYPE_BADGE: Record<NewsItem["type"], string> = {
  info: "bg-blue-100 text-blue-700",
  evenement: "bg-purple-100 text-purple-700",
  alerte: "bg-red-100 text-red-700",
  temoignage: "bg-emerald-100 text-emerald-700",
};

const TYPE_LABEL: Record<NewsItem["type"], string> = {
  info: "Info",
  evenement: "Événement",
  alerte: "Alerte",
  temoignage: "Témoignage",
};

export function getGradient(type: NewsItem["type"]): string {
  const map: Record<NewsItem["type"], string> = {
    info: "bg-gradient-to-br from-blue-400 to-blue-600",
    evenement: "bg-gradient-to-br from-purple-400 to-purple-600",
    alerte: "bg-gradient-to-br from-red-400 to-red-600",
    temoignage: "bg-gradient-to-br from-emerald-400 to-emerald-600",
  };
  return map[type];
}

function tempsRelatif(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const j = Math.floor(diff / 86400000);
  if (j === 0) return "Aujourd'hui";
  if (j === 1) return "Hier";
  if (j < 7) return `Il y a ${j} jours`;
  if (j < 30) return `Il y a ${Math.floor(j / 7)} sem.`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function CardNews({ news, compact = false }: { news: NewsItem; compact?: boolean }) {
  if (compact) {
    // Variante horizontale mini : image carrée 80x80 à gauche + texte à droite
    return (
      <Link
        href={`/news/${news.id}`}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex gap-3 hover:border-slate-300 transition-colors p-2"
      >
        <div className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden">
          {news.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={news.image_url} alt={news.titre} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${getGradient(news.type)}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_BADGE[news.type]}`}>
                {TYPE_LABEL[news.type]}
              </span>
              <span className="text-[10px] text-slate-400">{tempsRelatif(news.date_publication)}</span>
              {news.epinglee && <span className="text-[10px]">📌</span>}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{news.titre}</h3>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1">{stripMarkdown(news.contenu)}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Image ou dégradé */}
      <div className="relative h-36">
        {news.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={news.image_url} alt={news.titre} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full ${getGradient(news.type)}`} />
        )}
        {news.epinglee && (
          <span className="absolute top-2 left-2 bg-white/90 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
            📌 Épinglée
          </span>
        )}
        <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[news.type]}`}>
          {TYPE_LABEL[news.type]}
        </span>
      </div>

      {/* Contenu */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="text-xs text-slate-400">{tempsRelatif(news.date_publication)}</div>
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{news.titre}</h3>
        <p className="text-sm text-slate-600 line-clamp-3 flex-1">{stripMarkdown(news.contenu)}</p>
        <Link
          href={`/news/${news.id}`}
          className="text-sm font-medium text-blue-600 hover:underline mt-auto"
        >
          Lire la suite →
        </Link>
      </div>
    </div>
  );
}
