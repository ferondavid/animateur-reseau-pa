"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { getGradient } from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";

type TypeNews = NewsItem["type"];

const TYPES: { value: TypeNews; label: string; emoji: string; cls: string; active: string }[] = [
  { value: "info",       label: "Info",        emoji: "📢", cls: "border-blue-200 text-blue-700",    active: "bg-blue-50 border-blue-500 text-blue-800" },
  { value: "evenement",  label: "Événement",   emoji: "🎉", cls: "border-purple-200 text-purple-700", active: "bg-purple-50 border-purple-500 text-purple-800" },
  { value: "alerte",     label: "Alerte",      emoji: "⚠️", cls: "border-red-200 text-red-700",      active: "bg-red-50 border-red-500 text-red-800" },
  { value: "temoignage", label: "Témoignage",  emoji: "💬", cls: "border-emerald-200 text-emerald-700", active: "bg-emerald-50 border-emerald-500 text-emerald-800" },
];

type Props = {
  mode: "creer" | "modifier";
  newsInitiale?: {
    id: string;
    titre: string;
    contenu: string;
    type: string;
    image_url: string | null;
    epinglee: boolean;
    publie: boolean;
    auteur: string | null;
  };
};

const now = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function FormulaireNews({ mode, newsInitiale }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [type, setType] = useState<TypeNews>((newsInitiale?.type as TypeNews) ?? "info");
  const [fichier, setFichier] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageActuelle, setImageActuelle] = useState<string | null>(newsInitiale?.image_url ?? null);
  const [titreLen, setTitreLen] = useState(newsInitiale?.titre?.length ?? 0);
  const formRef = useRef<HTMLFormElement>(null);

  function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFichier(f);
    if (f) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setBusy(true);

    try {
      const form = new FormData(e.currentTarget);
      const supabase = createClient();
      let imageUrl = imageActuelle;

      if (fichier) {
        const ext = fichier.name.split(".").pop() ?? "bin";
        const path = `news_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("news-images")
          .upload(path, fichier, { upsert: false, contentType: fichier.type });
        if (upErr) throw new Error(`Upload image : ${upErr.message}`);
        const { data: pub } = supabase.storage.from("news-images").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      const payload = {
        titre: form.get("titre") as string,
        contenu: form.get("contenu") as string,
        type,
        auteur: (form.get("auteur") as string) || "Animateur",
        image_url: imageUrl,
        epinglee: form.get("epinglee") === "on",
        publie: form.get("publie") === "on",
        date_publication: (form.get("date_publication") as string) || new Date().toISOString(),
      };

      if (mode === "creer") {
        const { error } = await supabase.from("news").insert(payload);
        if (error) throw new Error(`Création : ${error.message}`);
      } else {
        const { error } = await supabase.from("news").update(payload).eq("id", newsInitiale!.id);
        if (error) throw new Error(`Mise à jour : ${error.message}`);
      }

      router.push("/animateur/news");
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setBusy(false);
    }
  }

  const apercu = previewUrl ?? imageActuelle;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {erreur && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-mono break-all">
          ❌ {erreur}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Titre */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-600">Titre *</label>
            <span className={`text-xs ${titreLen > 110 ? "text-red-500" : "text-slate-400"}`}>{titreLen}/120</span>
          </div>
          <input
            name="titre"
            required
            maxLength={120}
            defaultValue={newsInitiale?.titre}
            onChange={(e) => setTitreLen(e.target.value.length)}
            placeholder="Titre de l'actualité"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  type === t.value ? t.active : `bg-white ${t.cls} hover:opacity-80`
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auteur */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Auteur</label>
          <input
            name="auteur"
            defaultValue={newsInitiale?.auteur ?? "Animateur"}
            placeholder="Animateur"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Image</label>
          {apercu ? (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apercu} alt="Preview" className="h-32 w-full object-cover rounded-lg border border-slate-200" />
              <div className="flex gap-2 mt-1.5">
                {imageActuelle && !fichier && (
                  <button
                    type="button"
                    onClick={() => setImageActuelle(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    🗑 Supprimer l&apos;image
                  </button>
                )}
                {fichier && (
                  <button
                    type="button"
                    onClick={() => { setFichier(null); setPreviewUrl(null); }}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    × Annuler la sélection
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`h-20 rounded-lg mb-2 ${getGradient(type)} opacity-40`} />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFichier}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
          <p className="text-xs text-slate-400 mt-1">Si pas d&apos;image, un dégradé selon le type s&apos;affichera.</p>
        </div>

        {/* Contenu */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Contenu *</label>
          <textarea
            name="contenu"
            required
            rows={10}
            defaultValue={newsInitiale?.contenu}
            placeholder="Écrivez votre news ici. Vous pouvez utiliser plusieurs paragraphes…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y min-h-[250px]"
          />
        </div>

        {/* Date publication */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Date de publication</label>
          <input
            type="datetime-local"
            name="date_publication"
            defaultValue={now()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="publie"
              defaultChecked={newsInitiale ? newsInitiale.publie : true}
              className="accent-slate-900 w-4 h-4"
            />
            Publier immédiatement
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="epinglee"
              defaultChecked={newsInitiale?.epinglee ?? false}
              className="accent-slate-900 w-4 h-4"
            />
            📌 Épingler en tête
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Link
          href="/animateur/news"
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={busy}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
        >
          {busy ? "Envoi…" : mode === "creer" ? "Publier" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
