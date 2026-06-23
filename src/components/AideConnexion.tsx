"use client";

import { useActionState, useState } from "react";
import { demanderAideConnexion } from "@/app/login/actions";

const INPUT =
  "w-full bg-white border border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors";

export default function AideConnexion() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(demanderAideConnexion, null);

  if (state?.ok) {
    return (
      <div className="mt-4 rounded-2xl p-4 text-center" style={{ background: "#D2F2E7", border: "1px solid rgba(31,169,138,.25)" }}>
        <p className="text-sm font-semibold" style={{ color: "#0F8C68" }}>
          ✅ Demande envoyée !
        </p>
        <p className="text-xs mt-1" style={{ color: "#1A9E78" }}>
          L&apos;animateur a reçu ta demande et va te recontacter (email ou téléphone) avec tes accès.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold transition-colors hover:underline inline-flex items-center gap-1.5"
        style={{ color: "#6B4FD8" }}
      >
        🔑 Identifiant ou mot de passe oublié ?
      </button>

      {open && (
        <form action={action} className="pa-card p-5 mt-3 space-y-3 text-left">
          <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
            Laisse ton email — et ton <strong style={{ color: "#0F8C68" }}>06 pour un rappel immédiat</strong>. L&apos;animateur te redonne tes accès au plus vite.
          </p>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--pa-ink)" }}>
              Ton email
            </label>
            <input name="email" type="email" required placeholder="ton.email@exemple.fr" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--pa-ink)" }}>
              Ton numéro <span className="font-bold" style={{ color: "#0F8C68" }}>📞 pour être rappelé tout de suite</span>
            </label>
            <input name="telephone" type="tel" inputMode="tel" placeholder="06 12 34 56 78" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--pa-ink)" }}>
              Tu es… <span className="font-normal" style={{ color: "var(--pa-muted)" }}>(optionnel)</span>
            </label>
            <select name="profil" defaultValue="" className={INPUT}>
              <option value="">— Je préfère ne pas préciser —</option>
              <option value="Associé (magasin)">Associé (magasin)</option>
              <option value="Animateur">Animateur</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--pa-ink)" }}>
              Message <span className="font-normal" style={{ color: "var(--pa-muted)" }}>(optionnel)</span>
            </label>
            <textarea name="message" rows={2} placeholder="Nom du magasin, précisions…" className={INPUT} style={{ resize: "vertical" }} />
          </div>

          {state?.error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: "#FBE0E8", border: "1px solid rgba(192,71,110,.25)", color: "#C0476E" }}>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#7C6BE8,#6B4FD8)" }}
          >
            {pending ? "Envoi…" : "Envoyer ma demande"}
          </button>
        </form>
      )}
    </div>
  );
}
