"use client";

import { useState } from "react";

export default function BoutonCopierLien({ url }: { url: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    await navigator.clipboard.writeText(url);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={copier}
        className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
      >
        {copie ? "✓ Lien copié !" : "Copier le lien d'évaluation"}
      </button>
      <p className="text-xs text-slate-400 break-all font-mono">{url}</p>
    </div>
  );
}
