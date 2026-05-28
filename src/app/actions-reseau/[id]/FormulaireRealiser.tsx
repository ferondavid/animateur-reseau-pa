"use client";

import { useState } from "react";
import { changeStatutAction } from "./actions";

export default function FormulaireRealiser({ id }: { id: string }) {
  const [ouvert, setOuvert] = useState(false);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm font-medium hover:bg-green-100 transition-colors"
      >
        Marquer réalisée
      </button>
    );
  }

  return (
    <form action={changeStatutAction} className="w-full mt-2 space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="statut" value="realisee" />
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Commentaire de réalisation{" "}
          <span className="font-normal text-slate-400">(optionnel)</span>
        </label>
        <textarea
          name="commentaire_realisation"
          rows={3}
          autoFocus
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
          placeholder="Que s'est-il passé ?"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors"
        >
          Confirmer la réalisation
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
