"use client";

import { useState } from "react";
import Link from "next/link";

type Magasin = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string;
  region: string | null;
};

export default function RechercheMagasin({ magasins }: { magasins: Magasin[] }) {
  const [q, setQ] = useState("");

  const filtres = q.trim()
    ? magasins.filter((m) => {
        const hay = `${m.nom} ${m.enseigne ?? ""} ${m.ville} ${m.region ?? ""}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
    : magasins;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un magasin, une ville…"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
      />

      {filtres.length === 0 ? (
        <p className="text-center text-slate-400 py-8 text-sm">
          Aucun magasin ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtres.map((m) => (
            <Link
              key={m.id}
              href={`/membre/${m.id}`}
              className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {m.ville}
                {m.region ? ` · ${m.region}` : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
