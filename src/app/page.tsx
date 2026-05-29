import { createClient } from "@/lib/supabase/server";
import BoundaryRedirect from "@/components/BoundaryRedirect";
import LandingCards from "@/components/LandingCards";
import HeroNews from "@/components/HeroNews";
import CardNews from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";

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

        {/* 1. Header + choix de rôle */}
        <div className="max-w-4xl mx-auto px-6 md:px-10 pt-16 pb-4 flex flex-col items-center gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Animateur Réseau PA</h1>
            <p className="text-lg text-slate-500">Choisissez votre profil</p>
          </div>
          <LandingCards />
        </div>

        {/* 2. Hero news — contenu intégral, pleine largeur */}
        {newsPrincipale && (
          <div className="w-full max-w-5xl mx-auto px-6 md:px-10 mt-16 mb-12">
            <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
              Actualités du réseau
            </p>
            <HeroNews news={newsPrincipale} />
            {newsSecondaires.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {newsSecondaires.map((n) => (
                  <CardNews key={n.id} news={n} />
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </>
  );
}
