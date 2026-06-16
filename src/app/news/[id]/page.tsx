import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BoutonRetourNews from "@/components/BoutonRetourNews";
import { getGradient } from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import MarkdownContenu from "@/components/MarkdownContenu";
import { styleImageNews, fondImageNews, hauteurNews } from "@/lib/news-image";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .eq("publie", true)
    .single();

  if (!news) notFound();

  const n = news as NewsItem;

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <BoutonRetourNews href="/news" label="Retour aux actualités" />

        {/* Image / dégradé */}
        <div className="rounded-2xl overflow-hidden" style={{ background: fondImageNews(n) }}>
          {n.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.image_url} alt={n.titre} style={styleImageNews(n)} />
          ) : (
            <div className={getGradient(n.type)} style={{ height: hauteurNews(n) }} />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{n.auteur ?? "Animateur"}</span>
            <span>·</span>
            <span>{new Date(n.date_publication).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            {n.epinglee && <span className="ml-1">📌 Épinglée</span>}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{n.titre}</h1>
          <MarkdownContenu source={n.contenu} className="pt-1" />
        </div>
      </div>
    </main>
  );
}
