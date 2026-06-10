"use client";

import { useState, useEffect } from "react";

interface Props {
  visiteId: string;
}

// navigator.share / canShare ne sont pas toujours inclus dans les types DOM par défaut
type NavigatorWithShare = Navigator & {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  canShare?: (data?: { url?: string }) => boolean;
};

export default function PartageEvaluation({ visiteId }: Props) {
  const [url, setUrl] = useState("");
  const [statut, setStatut] = useState<"idle" | "copie" | "erreur">("idle");

  // Construit l'URL côté client pour que ça marche en local ET en prod Vercel
  useEffect(() => {
    setUrl(window.location.origin + "/evaluation/" + visiteId);
  }, [visiteId]);

  async function handleClick() {
    if (!url) return;

    const nav = navigator as NavigatorWithShare;

    // Tente Web Share (mobile : feuille SMS / WhatsApp / mail / …)
    if (typeof nav.share === "function") {
      try {
        await nav.share({
          title: "Évaluation de votre visite",
          text: "Bonjour, merci de prendre 30 secondes pour évaluer notre visite : ",
          url,
        });
        return; // L'utilisateur a partagé (ou annulé — les deux sont OK)
      } catch (err) {
        // AbortError = annulation volontaire → pas d'erreur
        if ((err as Error)?.name === "AbortError") return;
        // Autre erreur → on tombe sur le fallback copie
      }
    }

    // Fallback 1 : Clipboard API moderne
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setStatut("copie");
        setTimeout(() => setStatut("idle"), 2000);
        return;
      } catch {
        // Peut échouer hors HTTPS ou si la permission est refusée
      }
    }

    // Fallback 2 : execCommand (obsolète mais universellement supporté)
    try {
      const input = document.createElement("input");
      input.value = url;
      input.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // mobile
      document.execCommand("copy");
      document.body.removeChild(input);
      setStatut("copie");
      setTimeout(() => setStatut("idle"), 2000);
    } catch {
      // Tous les fallbacks ont échoué
      setStatut("erreur");
      setTimeout(() => setStatut("idle"), 4000);
    }
  }

  const labelBouton =
    statut === "copie"
      ? "✓ Lien copié !"
      : statut === "erreur"
        ? "Impossible de copier"
        : "Partager le lien d'évaluation";

  const styleBouton =
    statut === "copie"
      ? "bg-green-700 hover:bg-green-800"
      : statut === "erreur"
        ? "bg-red-700 hover:bg-red-800"
        : "pa-btn-primary";

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${styleBouton}`}
      >
        {labelBouton}
      </button>

      {statut === "erreur" && (
        <p className="text-xs text-red-600">
          Copiez le lien manuellement ci-dessous.
        </p>
      )}

      {/* URL toujours visible et sélectionnable pour copie manuelle ou test */}
      {url && (
        <p className="text-xs text-slate-400 font-mono break-all select-all leading-relaxed">
          {url}
        </p>
      )}
    </div>
  );
}
