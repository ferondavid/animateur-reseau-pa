import { createClient } from "@/lib/supabase/server";
import BoundaryRedirect from "@/components/BoundaryRedirect";
import LandingCards from "@/components/LandingCards";
import CardNews from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import Link from "next/link";

const TYPE_BADGE: Record<string, string> = {
  info: "bg-blue-100 text-blue-800", evenement: "bg-purple-100 text-purple-800",
  alerte: "bg-red-100 text-red-800", temoignage: "bg-emerald-100 text-emerald-800",
};
const TYPE_LABEL: Record<string, string> = {
  info: "📢 Info", evenement: "🎉 Événement", alerte: "⚠️ Alerte", temoignage: "💬 Témoignage",
};
const GRADIENT: Record<string, string> = {
  info: "bg-gradient-to-br from-blue-400 to-blue-600",
  evenement: "bg-gradient-to-br from-purple-400 to-purple-600",
  alerte: "bg-gradient-to-br from-red-400 to-red-600",
  temoignage: "bg-gradient-to-br from-emerald-400 to-emerald-600",
};

export default async function Landing() {
  const supabase = await createClient();

  const { data: toutesLesNews } = await supabase
    .from("news")
    .select("*")
    .eq("publie", true)
    .order("epinglee", { ascending: false })
    .order("date_publication", { ascending: false })
    .limit(5);

  const newsPrincipale = (toutesLesNews?.[0] ?? null) as NewsItem | null;
  const newsSecondaires = (toutesLesNews?.slice(1, 3) ?? []) as NewsItem[];

  return (
    <>
      <BoundaryRedirect />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 pb-16">

        {/* Choix de rôle */}
        <div className="max-w-4xl mx-auto px-6 md:px-10 pt-16 pb-4 flex flex-col items-center gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Animateur Réseau PA</h1>
            <p className="text-lg text-slate-500">Choisissez votre profil</p>
          </div>
          <LandingCards />
        </div>

        {/* Hero news — même style que la page détail /news/[id] */}
        {newsPrincipale && (
          <div className="w-full max-w-2xl mx-auto px-6 md:px-10 mt-16 mb-12">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
              Actualités du réseau
            </p>

            <div className="space-y-6">
              {/* Image / dégradé */}
              <div className="rounded-2xl overflow-hidden h-48">
                {newsPrincipale.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={newsPrincipale.image_url}
                    alt={newsPrincipale.titre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${GRADIENT[newsPrincipale.type] ?? "bg-gradient-to-br from-slate-400 to-slate-600"}`} />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{newsPrincipale.auteur ?? "Animateur"}</span>
                  <span>·</span>
                  <span>
                    {new Date(newsPrincipale.date_publication).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                  {newsPrincipale.epinglee && <span className="ml-1">📌 Épinglée</span>}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{newsPrincipale.titre}</h2>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {newsPrincipale.contenu}
                </div>
              </div>
            </div>

            {/* Mini-cards secondaires */}
            {newsSecondaires.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                {newsSecondaires.map((n) => <CardNews key={n.id} news={n} />)}
              </div>
            )}
          </div>
        )}

      </main>
    </>
  );
}
