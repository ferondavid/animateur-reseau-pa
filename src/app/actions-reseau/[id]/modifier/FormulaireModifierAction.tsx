"use client";

import { useState } from "react";
import { updateAction } from "../actions";

interface Magasin {
  id: string;
  nom: string;
  enseigne: string | null;
}

interface Action {
  id: string;
  titre: string;
  description: string | null;
  niveau_urgence: number;
  portee: string;
  magasin_id: string | null;
  deadline: string | null;
}

interface Props {
  action: Action;
  magasins: Magasin[];
}

export default function FormulaireModifierAction({ action, magasins }: Props) {
  const [portee, setPortee] = useState<"reseau" | "magasin">(
    action.portee as "reseau" | "magasin"
  );

  return (
    <form action={updateAction} className="space-y-4">
      <input type="hidden" name="id" value={action.id} />

      {/* Informations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
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
              defaultValue={action.titre}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={action.description ?? ""}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Paramètres */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
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
              defaultValue={String(action.niveau_urgence)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                defaultValue={action.magasin_id ?? ""}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              defaultValue={action.deadline ?? ""}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex items-center justify-end gap-3">
        <a
          href={`/actions-reseau/${action.id}`}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Annuler
        </a>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
