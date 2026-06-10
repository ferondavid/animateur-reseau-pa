"use client";

import { useState } from "react";
import { createAction } from "../[id]/actions";

interface Magasin {
  id: string;
  nom: string;
  enseigne: string | null;
}

interface Props {
  magasins: Magasin[];
  magasinIdInitial?: string;
  descriptionInitiale?: string;
}

export default function FormulaireNouvelleAction({
  magasins,
  magasinIdInitial,
  descriptionInitiale,
}: Props) {
  const [portee, setPortee] = useState<"reseau" | "magasin">(
    magasinIdInitial ? "magasin" : "reseau"
  );

  return (
    <form action={createAction} className="space-y-4">
      {/* Informations */}
      <div className="pa-card p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Informations
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Titre <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="titre"
              required
              autoFocus
              className="pa-input"
              placeholder="Titre de l'action"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={descriptionInitiale ?? ""}
              className="pa-input resize-y"
              placeholder="Description détaillée de l'action..."
            />
          </div>
        </div>
      </div>

      {/* Paramètres */}
      <div className="pa-card p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Paramètres
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Niveau d'urgence
            </label>
            <select
              name="niveau_urgence"
              defaultValue="2"
              className="pa-input"
            >
              <option value="1">1 — Info</option>
              <option value="2">2 — Important</option>
              <option value="3">3 — Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Portée <span className="text-red-400 ml-0.5">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="portee"
                  value="reseau"
                  checked={portee === "reseau"}
                  onChange={() => setPortee("reseau")}
                  className="accent-slate-900"
                />
                <span className="text-sm text-slate-700">Réseau</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="portee"
                  value="magasin"
                  checked={portee === "magasin"}
                  onChange={() => setPortee("magasin")}
                  className="accent-slate-900"
                />
                <span className="text-sm text-slate-700">Magasin</span>
              </label>
            </div>
          </div>

          {portee === "magasin" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Magasin <span className="text-red-400 ml-0.5">*</span>
              </label>
              <select
                name="magasin_id"
                defaultValue={magasinIdInitial ?? ""}
                className="pa-input"
              >
                <option value="">— Sélectionner un magasin —</option>
                {magasins.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.enseigne ? `${m.enseigne} — ` : ""}
                    {m.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Deadline
            </label>
            <input
              type="date"
              name="deadline"
              className="pa-input"
            />
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex items-center justify-end gap-3">
        <a
          href="/actions-reseau"
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Annuler
        </a>
        <button
          type="submit"
          className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
        >
          Créer l'action
        </button>
      </div>
    </form>
  );
}
