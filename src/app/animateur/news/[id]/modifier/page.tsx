"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ModifierNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [news, setNews] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [fichier, setFichier] = useState<File | null>(null);

  useEffect(() => {
    params.then(({ id: newsId }) => {
      setId(newsId);
      const supabase = createClient();
      supabase.from("news").select("*").eq("id", newsId).single().then(({ data }) => setNews(data));
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    let image_url = news?.image_url as string | null ?? null;
    if (fichier) {
      const chemin = `news/${Date.now()}_${fichier.name}`;
      const { data: up, error: upErr } = await supabase.storage.from("news-images").upload(chemin, fichier);
      if (!upErr && up) {
        const { data: pub } = supabase.storage.from("news-images").getPublicUrl(up.path);
        image_url = pub.publicUrl;
      }
    }

    await supabase.from("news").update({
      titre: form.get("titre") as string,
      contenu: form.get("contenu") as string,
      type: form.get("type") as string,
      image_url,
      epinglee: form.get("epinglee") === "on",
      publie: form.get("publie") === "on",
    }).eq("id", id);

    setLoading(false);
    router.push("/animateur/news");
    router.refresh();
  }

  if (!news) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Chargement…</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/animateur/news" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Retour aux news</Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Modifier l&apos;actualité</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Titre *</label>
              <input name="titre" required type="text" defaultValue={news.titre as string} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type *</label>
              <select name="type" defaultValue={news.type as string} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="info">Info</option>
                <option value="evenement">Événement</option>
                <option value="alerte">Alerte</option>
                <option value="temoignage">Témoignage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Contenu *</label>
              <textarea name="contenu" required rows={8} defaultValue={news.contenu as string} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nouvelle image (optionnel)</label>
              <input type="file" accept="image/*" onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
              {(news.image_url as string | null) && !fichier && <p className="text-xs text-slate-400 mt-1">Image actuelle conservée</p>}
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" name="epinglee" defaultChecked={!!news.epinglee} className="accent-slate-900 w-4 h-4" />
                Épingler
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" name="publie" defaultChecked={!!news.publie} className="accent-slate-900 w-4 h-4" />
                Publié
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/animateur/news" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Annuler
            </Link>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {loading ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
