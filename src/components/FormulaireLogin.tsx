"use client";

import { useActionState } from "react";
import { loginCompte } from "@/app/login/actions";

const INPUT_CLASS =
  "w-full bg-white border border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors";

export default function FormulaireLogin() {
  const [state, action, pending] = useActionState(loginCompte, null);

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="px-8 pt-7 pb-2 text-center">
        <p className="text-base font-bold text-slate-800">Connexion</p>
        <p className="text-xs text-slate-400 mt-0.5">Associé · Bureau · Animateur</p>
      </div>
      <form action={action} className="p-8 pt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Identifiant</label>
          <input
            name="login"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={INPUT_CLASS}
          />
        </div>
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {state.error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#7C6BE8,#6B4FD8)" }}
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
