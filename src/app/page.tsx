import { createClient } from "@/lib/supabase/server";
import BoundaryRedirect from "@/components/BoundaryRedirect";
import LandingCards from "@/components/LandingCards";
import CardNews from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";

export default async function Landing() {
  const supabase = await createClient();
  let newsData = null;
  try {
    const { data } = await supabase
      .from("news")
      .select("id, titre, contenu, image_url, type, auteur, epinglee, date_publication")
      .eq("publie", true)
      .order("epinglee", { ascending: false })
      .order("date_publication", { ascending: false })
      .limit(3);
    newsData = data;
  } catch { /* table inexistante — ignore */ }

  return (
    <>
      <BoundaryRedirect />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-12">
          {/* Titre + cartes */}
          <div className="flex flex-col items-center gap-8 w-full pt-16">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-3">Animateur Réseau PA</h1>
              <p className="text-lg text-slate-500">Choisissez votre profil</p>
            </div>
            <LandingCards />
          </div>

          {/* Actualités */}
          {(newsData ?? []).length > 0 && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Actualités du réseau
                </h2>
                <Link href="/news" className="text-sm font-medium text-blue-600 hover:underline">
                  Toutes les actualités →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(newsData as NewsItem[]).map((n) => (
                  <CardNews key={n.id} news={n} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
