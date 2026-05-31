"use client";

import { useState, useTransition } from "react";
import { updateParametreNbNews } from "@/app/animateur/news/actions";

export default function SelectNbNewsFiche({ valeurInitiale }: { valeurInitiale: number }) {
  const [valeur, setValeur] = useState(valeurInitiale);
  const [confirme, setConfirme] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const n = parseInt(e.target.value, 10);
    setValeur(n);
    startTransition(async () => {
      await updateParametreNbNews(n);
      setConfirme(true);
      setTimeout(() => setConfirme(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={valeur}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n} news{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>
      {isPending && <span className="text-xs text-slate-400">Enregistrement…</span>}
      {!isPending && confirme && <span className="text-xs text-emerald-600 font-medium">✓ Enregistré</span>}
    </div>
  );
}
