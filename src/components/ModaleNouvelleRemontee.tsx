"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { creerRemontee } from "@/actions/membre";
import { Megaphone, Paperclip, X } from "lucide-react";

type Props = { magasinId: string; onClose: () => void };

export default function ModaleNouvelleRemontee({ magasinId, onClose }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [fichier, setFichier] = useState<File | null>(null);
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setBusy(true);

    try {
      const fd = new FormData(e.currentTarget);
      fd.append("magasin_id", magasinId);
      if (fichier) fd.append("photo", fichier);

      const result = await creerRemontee(fd);
      if (!result.ok) throw new Error(result.error ?? "Erreur");

      setSucces(true);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1200);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      setBusy(false);
    }
  }

  if (!monte) return null;

  return createPortal(
    <div className="pa-modal-overlay">
      <div className="pa-modal-content w-full max-w-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)" }}>
            <Megaphone size={18} style={{ color: "#EC6B4E" }} />
            Faire remonter une info
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--pa-muted)" }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {succes && (
          <div className="rounded-xl px-4 py-2.5 text-sm font-medium"
               style={{ background: "#D4F3E8", color: "#0F8C68" }}>
            Remontée envoyée avec succès
          </div>
        )}
        {erreur && (
          <div className="rounded-xl px-4 py-2.5 text-xs font-mono break-all"
               style={{ background: "#FBE0E8", color: "#C0476E", border: "1px solid rgba(192,71,110,.2)" }}>
            {erreur}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="pa-label">Type *</label>
            <select name="type" required defaultValue="" className="pa-input">
              <option value="" disabled>— Choisir —</option>
              <option value="commerciale">Commerciale</option>
              <option value="sav_technique">SAV / Technique</option>
              <option value="concurrence">Concurrence</option>
              <option value="opportunite">Opportunité</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="pa-label">Titre *</label>
            <input name="titre" required type="text" placeholder="Résumé en une ligne" className="pa-input" />
          </div>

          <div>
            <label className="pa-label">Description *</label>
            <textarea name="description" required rows={3} placeholder="Décrivez la situation…"
              className="pa-input resize-y" />
          </div>

          <div>
            <label className="pa-label">Gravité</label>
            <select name="gravite" defaultValue="normale" className="pa-input">
              <option value="normale">Normale</option>
              <option value="attention">Attention</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="pa-label">Photo ou document (optionnel)</label>
            {fichier && (
              <p className="text-xs mb-1 flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
                <Paperclip size={11} />
                {fichier.name} ({(fichier.size / 1024).toFixed(0)} Ko)
              </p>
            )}
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              className="pa-input"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="pa-btn-secondary flex-1 py-2.5 rounded-xl text-sm">
              Annuler
            </button>
            <button type="submit" disabled={busy}
              className="pa-btn-primary flex-1 py-2.5 rounded-xl text-sm">
              {busy ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
