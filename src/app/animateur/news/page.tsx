export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import BoutonAccueil from "@/components/BoutonAccueil";
import type { NewsItem } from "@/components/CardNews";
import { getParametreNumber } from "@/lib/parametres";
import SelectNbNewsFiche from "@/components/SelectNbNewsFiche";
import NewsManager from "@/components/NewsManager";
import { guardBureau } from "@/lib/visibilite";

export default async function AdminNewsPage() {
  await guardBureau("bureau_news");
  const supabase = await createClient();
  const [{ data: newsList }, nbNewsActuel] = await Promise.all([
    supabase
      .from("news")
      .select("*")
      .order("epinglee", { ascending: false })
      .order("date_publication", { ascending: false }),
    getParametreNumber("nb_news_fiche_membre", 1),
  ]);

  const liste = (newsList ?? []) as NewsItem[];

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <BoutonAccueil />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
              Actualités du réseau
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
              Gérez et publiez les actualités vues par les membres
            </p>
          </div>
          <Link href="/animateur/news/nouvelle"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 pa-btn-primary rounded-xl text-sm font-semibold">
            <Plus size={16} strokeWidth={2.5} />
            Nouvelle news
          </Link>
        </div>

        {/* Réglage d'affichage sur les fiches membre */}
        <div className="pa-card p-4">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--pa-ink)" }}>
            <Settings2 size={14} style={{ color: "var(--pa-muted)" }} />
            Nombre de news affichées sur les fiches membre
          </p>
          <SelectNbNewsFiche valeurInitiale={nbNewsActuel} />
        </div>

        {liste.length === 0 ? (
          <div className="pa-card p-12 text-center space-y-4">
            <p className="text-sm" style={{ color: "var(--pa-muted)" }}>Aucune news pour l&apos;instant.</p>
            <Link href="/animateur/news/nouvelle"
                  className="inline-flex items-center gap-1.5 px-6 py-3 pa-btn-primary rounded-xl text-sm font-semibold">
              <Plus size={15} strokeWidth={2.5} />
              Créer la première news
            </Link>
          </div>
        ) : (
          <NewsManager liste={liste} />
        )}
      </div>
    </main>
  );
}
