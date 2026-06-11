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
        className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
        style={{ background: "#D2F2E7", color: "#0F8C68" }}
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
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--pa-ink)" }}>
          Commentaire de réalisation{" "}
          <span className="font-normal" style={{ color: "var(--pa-muted)" }}>(optionnel)</span>
        </label>
        <textarea
          name="commentaire_realisation"
          rows={3}
          autoFocus
          className="pa-input resize-y"
          placeholder="Que s'est-il passé ?"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-transform active:scale-95"
          style={{ background: "linear-gradient(135deg,#34C9A3,#1FA98A)", boxShadow: "0 4px 10px -4px rgba(31,169,138,.5)" }}
        >
          Confirmer la réalisation
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
          style={{ background: "#ECEAF3", color: "#6F6982" }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
