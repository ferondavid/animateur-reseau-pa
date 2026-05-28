"use client";

import { useState } from "react";
import { QUESTIONS_EVAL, type QuestionKey } from "@/lib/evaluations";
import EtoilesNote from "@/components/EtoilesNote";
import { submitEvaluation } from "./actions";

type Notes = Record<QuestionKey, number | null>;

const notesInitiales: Notes = {
  q1_ecoute: null,
  q2_pertinence: null,
  q3_solutions: null,
  q4_suivi: null,
  q5_disponibilite: null,
  q6_satisfaction_globale: null,
};

interface Props {
  visiteId: string;
  magasinId: string;
  nomMagasin: string;
  dateVisite: string;
}

export default function FormulaireEvaluation({
  visiteId,
  magasinId,
  nomMagasin,
  dateVisite,
}: Props) {
  const [notes, setNotes] = useState<Notes>(notesInitiales);
  const [erreur, setErreur] = useState("");

  function setNote(key: QuestionKey, val: number) {
    setNotes((prev) => ({ ...prev, [key]: val }));
    setErreur("");
  }

  function handleSubmit(e: React.FormEvent) {
    const manquantes = QUESTIONS_EVAL.filter((q) => !notes[q.key]);
    if (manquantes.length > 0) {
      e.preventDefault();
      setErreur("Veuillez noter toutes les questions avant d'envoyer.");
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4 sm:p-8 flex flex-col items-center">
      {/* En-tête */}
      <div className="w-full max-w-lg mb-8 text-center">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">
          Évaluation de visite
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{nomMagasin}</h1>
        <p className="text-slate-500 text-sm">{dateVisite}</p>
      </div>

      <form
        action={submitEvaluation}
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4"
      >
        {/* Champs cachés */}
        <input type="hidden" name="visite_id" value={visiteId} />
        <input type="hidden" name="magasin_id" value={magasinId} />

        {/* Questions */}
        {QUESTIONS_EVAL.map((q) => (
          <div
            key={q.key}
            className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm"
          >
            <p className="text-slate-800 font-medium mb-4 leading-snug">
              {q.label}
            </p>
            <div className="flex items-center gap-1">
              <EtoilesNote
                mode="input"
                note={notes[q.key]}
                onChange={(val) => setNote(q.key, val)}
                taille="lg"
              />
              {notes[q.key] && (
                <span className="ml-2 text-sm text-slate-400 font-medium">
                  {notes[q.key]}/5
                </span>
              )}
            </div>
            {/* Valeur cachée pour FormData */}
            <input
              type="hidden"
              name={q.key}
              value={notes[q.key] ?? ""}
            />
          </div>
        ))}

        {/* Commentaire */}
        <div className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
          <label
            htmlFor="commentaire"
            className="text-slate-800 font-medium block mb-3"
          >
            Commentaire libre{" "}
            <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            id="commentaire"
            name="commentaire_texte"
            rows={4}
            placeholder="Un retour, une suggestion, un point à améliorer…"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>

        {/* Erreur de validation */}
        {erreur && (
          <p className="text-sm text-red-600 font-medium text-center bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {erreur}
          </p>
        )}

        {/* Bouton */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-base transition-colors shadow-sm"
        >
          Envoyer mon évaluation
        </button>
      </form>

      <p className="mt-8 text-xs text-slate-400 text-center max-w-xs">
        Vos réponses sont transmises directement à votre animateur réseau.
      </p>
    </div>
  );
}
