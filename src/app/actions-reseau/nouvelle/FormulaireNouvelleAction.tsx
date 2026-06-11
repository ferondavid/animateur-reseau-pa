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
        <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
          Informations
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--pa-ink)" }}>
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
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--pa-ink)" }}>
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
        <h2 className="text-sm font-bold uppercase tracking-wide mb-4" style={{ color: "var(--pa-muted)" }}>
          Paramètres
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--pa-ink)" }}>
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
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--pa-ink)" }}>
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
                  className="accent-[#7C6BE8]"
                />
                <span className="text-sm" style={{ color: "var(--pa-ink)" }}>Réseau</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="portee"
                  value="magasin"
                  checked={portee === "magasin"}
                  onChange={() => setPortee("magasin")}
                  className="accent-[#7C6BE8]"
                />
                <span className="text-sm" style={{ color: "var(--pa-ink)" }}>Magasin</span>
              </label>
            </div>
          </div>

          {portee === "magasin" && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--pa-ink)" }}>
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
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--pa-ink)" }}>
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
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
          style={{ background: "#ECEAF3", color: "#6F6982" }}
        >
          Annuler
        </a>
        <button
          type="submit"
          className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold"
        >
          Créer l'action
        </button>
      </div>
    </form>
  );
}
