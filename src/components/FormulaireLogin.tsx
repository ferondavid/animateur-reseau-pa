"use client";

import { useActionState, useState } from "react";
import { loginMembre, loginAnimateur } from "@/app/login/actions";

const INPUT_CLASS =
  "w-full bg-white border border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors";

export default function FormulaireLogin() {
  const [tab, setTab] = useState<"membre" | "animateur">("membre");
  const [stateM, actionM, pendingM] = useActionState(loginMembre, null);
  const [stateA, actionA, pendingA] = useActionState(loginAnimateur, null);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("membre")}
          className={`py-4 text-sm font-semibold transition-colors ${
            tab === "membre"
              ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          🏪 Membre PA
        </button>
        <button
          type="button"
          onClick={() => setTab("animateur")}
          className={`py-4 text-sm font-semibold transition-colors ${
            tab === "animateur"
              ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          🎛️ Animateur
        </button>
      </div>

      {/* Form Membre */}
      {tab === "membre" && (
        <form action={actionM} className="p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Identifiant
            </label>
            <input
              name="login"
              type="text"
              required
              autoComplete="username"
              className={`${INPUT_CLASS} focus:border-emerald-500 focus:ring-emerald-500/30`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mot de passe
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={`${INPUT_CLASS} focus:border-emerald-500 focus:ring-emerald-500/30`}
            />
          </div>
          {stateM?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {stateM.error}
            </div>
          )}
          <button
            type="submit"
            disabled={pendingM}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {pendingM ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      )}

      {/* Form Animateur */}
      {tab === "animateur" && (
        <form action={actionA} className="p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Identifiant
            </label>
            <input
              name="login"
              type="text"
              required
              autoComplete="username"
              className={`${INPUT_CLASS} focus:border-blue-500 focus:ring-blue-500/30`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Mot de passe
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={`${INPUT_CLASS} focus:border-blue-500 focus:ring-blue-500/30`}
            />
          </div>
          {stateA?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {stateA.error}
            </div>
          )}
          <button
            type="submit"
            disabled={pendingA}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {pendingA ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      )}
    </div>
  );
}
