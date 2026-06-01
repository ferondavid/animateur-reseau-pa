"use client";

import { useState, useTransition } from "react";
import { regenererTokenExport } from "./actions";

const BASE_URL = "https://animateur-reseau-pa.vercel.app";

export default function ExportCalendar({ tokenInitial }: { tokenInitial: string }) {
  const [token, setToken] = useState(tokenInitial);
  const [copied, setCopied] = useState(false);
  const [aideVisible, setAideVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const url = `${BASE_URL}/api/calendar/animateur.ics?token=${token}`;

  function copier() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function regenerer() {
    if (
      !confirm(
        "⚠️ Régénérer le token ?\n\nL'ancienne URL ne fonctionnera plus. Vous devrez retirer l'agenda de Google Calendar et le ré-abonner avec la nouvelle URL."
      )
    )
      return;
    startTransition(async () => {
      const r = await regenererTokenExport();
      if (r.ok && r.token) setToken(r.token);
    });
  }

  if (!token) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Token non configuré. Exécutez le SQL fourni dans Supabase Studio pour générer le token initial.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* URL d'abonnement */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">URL d&apos;abonnement</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none cursor-text"
          />
          <button
            onClick={copier}
            className="shrink-0 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? "✓ Copié !" : "Copier"}
          </button>
        </div>
      </div>

      {/* Délai de synchro */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        🕐 <strong>Délai de synchro Google Calendar : 12 à 24h</strong> pour les nouveaux événements.
        Google ne polle pas les feeds iCal en temps réel — c&apos;est une limitation de Google, pas de l&apos;app.
        Pour un push immédiat il faudrait l&apos;API OAuth Google (à faire plus tard).
      </div>

      {/* Aide abonnement */}
      <div>
        <button
          onClick={() => setAideVisible((v) => !v)}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {aideVisible ? "▲ Masquer l'aide" : "▼ Comment abonner dans Google Calendar ?"}
        </button>
        {aideVisible && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-1">
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Ouvrez <strong>Google Calendar</strong></li>
              <li>
                Dans la colonne de gauche, à droite de <strong>&ldquo;Autres agendas&rdquo;</strong>, cliquez sur <strong>+</strong>
              </li>
              <li>Choisissez <strong>&ldquo;À partir de l&apos;URL&rdquo;</strong></li>
              <li>Collez l&apos;URL ci-dessus et cliquez <strong>Ajouter un agenda</strong></li>
              <li>⏳ Attendez 12 à 24h pour la première synchro</li>
            </ol>
            <p className="mt-2 text-xs text-slate-400">
              Pour forcer un rafraîchissement : retirez et ré-ajoutez l&apos;agenda depuis Google Calendar.
            </p>
          </div>
        )}
      </div>

      {/* Régénérer token */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={regenerer}
          disabled={isPending}
          className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50 transition-colors"
        >
          {isPending ? "Régénération…" : "🔄 Régénérer le token (l'ancienne URL ne marchera plus)"}
        </button>
      </div>
    </div>
  );
}
