"use client";

import { useState } from "react";
import { repondreRemontee } from "./actions";

export default function FormulaireReponse({ id }: { id: string }) {
  const [ouvert, setOuvert] = useState(false);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors"
      >
        Répondre et marquer traitée
      </button>
    );
  }

  return (
    <form action={repondreRemontee} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Réponse de l'animateur
        </label>
        <textarea
          name="reponse_animateur"
          required
          rows={4}
          autoFocus
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
          placeholder="Décrivez les actions prises ou la réponse apportée…"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors"
        >
          Enregistrer et marquer traitée
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
