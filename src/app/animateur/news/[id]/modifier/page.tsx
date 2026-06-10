import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import FormulaireNews from "@/components/FormulaireNews";

export default async function ModifierNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: news } = await supabase.from("news").select("*").eq("id", id).single();

  if (!news) redirect("/animateur/news");

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/animateur/news" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Retour aux news
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Modifier l&apos;actualité</h1>
        </div>
        <FormulaireNews
          mode="modifier"
          newsInitiale={{
            id: news.id,
            titre: news.titre,
            contenu: news.contenu,
            type: news.type,
            image_url: news.image_url,
            epinglee: news.epinglee,
            publie: news.publie,
            auteur: news.auteur,
          }}
        />
      </div>
    </main>
  );
}
