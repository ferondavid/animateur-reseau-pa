"use client";

import { useState } from "react";
import Link from "next/link";
import { createVisite } from "./actions";

interface Magasin {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
}

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900";
const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900";
const textareaClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y";
const labelClass = "block text-xs font-medium text-slate-600 mb-1.5";

export default function FormulaireVisite({
  magasins,
  defaultMagasinId,
}: {
  magasins: Magasin[];
  defaultMagasinId?: string;
}) {
  const [statut, setStatut] = useState("planifiee");

  return (
    <form action={createVisite} className="space-y-6">
      {/* Informations générales */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Informations
        </h2>

        <div>
          <label className={labelClass}>
            Magasin <span className="text-red-400">*</span>
          </label>
          <select
            name="magasin_id"
            required
            defaultValue={defaultMagasinId ?? ""}
            className={selectClass}
          >
            <option value="">— Sélectionner un magasin —</option>
            {magasins.map((m) => (
              <option key={m.id} value={m.id}>
                {m.enseigne ? `${m.enseigne} — ` : ""}
                {m.nom}
                {m.ville ? ` (${m.ville})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Date prévue <span className="text-red-400">*</span>
            </label>
            <input type="date" name="date_prevue" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date réalisée</label>
            <input type="date" name="date_realisee" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Statut</label>
            <select
              name="statut"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className={selectClass}
            >
              <option value="planifiee">Planifiée</option>
              <option value="realisee">Réalisée</option>
              <option value="annulee">Annulée</option>
              <option value="reportee">Reportée</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Durée (minutes)</label>
            <input
              type="number"
              name="duree_minutes"
              min={0}
              placeholder="ex. 90"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Objectif */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          Objectif
        </h2>
        <textarea
          name="objectif"
          required
          rows={3}
          placeholder="Objectif de la visite…"
          className={textareaClass}
        />
      </div>

      {/* Champs conditionnels si visite réalisée */}
      {statut === "realisee" && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Compte-rendu
            </h2>
            <div>
              <label className={labelClass}>Compte-rendu général</label>
              <textarea
                name="compte_rendu"
                rows={4}
                placeholder="Résumé de la visite…"
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Points positifs</label>
              <textarea
                name="points_positifs"
                rows={3}
                placeholder="Ce qui va bien…"
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Points d'attention</label>
              <textarea
                name="points_attention"
                rows={3}
                placeholder="Points à surveiller…"
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Actions décidées</label>
              <textarea
                name="actions_decidees"
                rows={3}
                placeholder="Actions à mener…"
                className={textareaClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prochaine étape</label>
              <textarea
                name="prochaine_etape"
                rows={2}
                placeholder="Suite à donner…"
                className={textareaClass}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Indicateurs
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Note Confiance (1–5)</label>
                <select name="note_confiance" className={selectClass}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)} — {n}/5
                    </option>
                  ))}
                </select>
                <textarea
                  name="commentaire_confiance"
                  rows={2}
                  placeholder="Commentaire…"
                  className={textareaClass}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Note Business (1–5)</label>
                <select name="note_business" className={selectClass}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)} — {n}/5
                    </option>
                  ))}
                </select>
                <textarea
                  name="commentaire_business"
                  rows={2}
                  placeholder="Commentaire…"
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/visites"
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Annuler
        </Link>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Créer la visite
        </button>
      </div>
    </form>
  );
}
