"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = { magasinId: string; onClose: () => void };

export default function ModaleNouvelleRemontee({ magasinId, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    let photo_url: string | null = null;

    if (fichier) {
      const chemin = `magasin_${magasinId}/${Date.now()}_${fichier.name}`;
      const { data: uploaded, error: upErr } = await supabase.storage
        .from("photos-remontees")
        .upload(chemin, fichier, { upsert: false });
      if (!upErr && uploaded) {
        const { data: pub } = supabase.storage
          .from("photos-remontees")
          .getPublicUrl(uploaded.path);
        photo_url = pub.publicUrl;
      }
    }

    const { error } = await supabase.from("remontees").insert({
      magasin_id: magasinId,
      titre: form.get("titre") as string,
      description: form.get("description") as string,
      type: form.get("type") as string,
      gravite: form.get("gravite") as string,
      statut: "nouvelle",
      source: "membre",
      photo_url,
    });

    setLoading(false);
    if (error) {
      setToast("Erreur lors de l'envoi. Réessaie.");
      return;
    }
    setToast("Remontée envoyée !");
    setTimeout(() => {
      onClose();
      router.refresh();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">📢 Faire remonter une info</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        {toast && (
          <div className={`rounded-xl px-4 py-2 text-sm font-medium ${toast.includes("Erreur") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {toast}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
            <select name="type" required defaultValue="" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="" disabled>— Choisir —</option>
              <option value="commerciale">Commerciale</option>
              <option value="sav_technique">SAV / Technique</option>
              <option value="concurrence">Concurrence</option>
              <option value="opportunite">Opportunité</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Titre *</label>
            <input name="titre" required type="text" placeholder="Résumé en une ligne" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description *</label>
            <textarea name="description" required rows={3} placeholder="Décrivez la situation…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Gravité</label>
            <select name="gravite" defaultValue="normale" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="normale">Normale</option>
              <option value="attention">Attention</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Photo ou document (optionnel)</label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {loading ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
