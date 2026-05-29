import { createClient } from "@/lib/supabase/server";
import BoundaryRedirect from "@/components/BoundaryRedirect";
import LandingCards from "@/components/LandingCards";
import HeroNews from "@/components/HeroNews";
import CardNews from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import Link from "next/link";

export default async function Landing() {
  const supabase = await createClient();

  let newsPrincipale: NewsItem | null = null;
  let newsSecondaires: NewsItem[] = [];

  try {
    const { data: principale } = await supabase
      .from("news")
      .select("id, titre, contenu, image_url, type, auteur, epinglee, publie, date_publication")
      .eq("publie", true)
      .order("epinglee", { ascending: false })
      .order("date_publication", { ascending: false })
      .limit(1)
      .single();
    newsPrincipale = principale as NewsItem | null;

    const { data: secondaires } = await supabase
      .from("news")
      .select("id, titre, contenu, image_url, type, auteur, epinglee, publie, date_publication")
      .eq("publie", true)
      .order("epinglee", { ascending: false })
      .order("date_publication", { ascending: false })
      .range(1, 2);
    newsSecondaires = (secondaires ?? []) as NewsItem[];
  } catch { /* table absente — ignore */ }

  return (
    <>
      <BoundaryRedirect />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 p-6 md:p-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-12">

          {/* 1. Titre + choix de rôle */}
          <div className="flex flex-col items-center gap-8 pt-10">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-3">Animateur Réseau PA</h1>
              <p className="text-lg text-slate-500">Choisissez votre profil</p>
            </div>
            <LandingCards />
          </div>

          {/* 2. Hero news principal */}
          {newsPrincipale && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Actualité du réseau
                </h2>
                <Link href="/news" className="text-sm font-medium text-blue-600 hover:underline">
                  Toutes les actualités →
                </Link>
              </div>
              <HeroNews news={newsPrincipale} />
            </section>
          )}

          {/* 3. Mini-cards secondaires */}
          {newsSecondaires.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Autres actualités
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {newsSecondaires.map((n) => (
                  <CardNews key={n.id} news={n} />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </>
  );
}
