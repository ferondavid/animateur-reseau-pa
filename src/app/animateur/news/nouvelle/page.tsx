"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function NouvelleNewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fichier, setFichier] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    let image_url: string | null = null;
    if (fichier) {
      const chemin = `news/${Date.now()}_${fichier.name}`;
      const { data: up, error: upErr } = await supabase.storage.from("news-images").upload(chemin, fichier);
      if (!upErr && up) {
        const { data: pub } = supabase.storage.from("news-images").getPublicUrl(up.path);
        image_url = pub.publicUrl;
      }
    }

    await supabase.from("news").insert({
      titre: form.get("titre") as string,
      contenu: form.get("contenu") as string,
      type: form.get("type") as string,
      auteur: "Animateur",
      image_url,
      epinglee: form.get("epinglee") === "on",
      publie: form.get("publie") !== "off",
    });

    setLoading(false);
    router.push("/animateur/news");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/animateur/news" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Retour aux news
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Nouvelle actualité</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Titre *</label>
              <input name="titre" required type="text" placeholder="Titre de l'actualité" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type *</label>
              <select name="type" defaultValue="info" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="info">Info</option>
                <option value="evenement">Événement</option>
                <option value="alerte">Alerte</option>
                <option value="temoignage">Témoignage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Contenu *</label>
              <textarea name="contenu" required rows={8} placeholder="Tu peux écrire plusieurs paragraphes..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Image (optionnel)</label>
              <input type="file" accept="image/*" onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" name="epinglee" className="accent-slate-900 w-4 h-4" />
                Épingler
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" name="publie" defaultChecked className="accent-slate-900 w-4 h-4" />
                Publier immédiatement
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/animateur/news" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Annuler
            </Link>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {loading ? "Publication…" : "Publier"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
