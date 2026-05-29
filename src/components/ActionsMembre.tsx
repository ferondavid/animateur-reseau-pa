"use client";

import { useState } from "react";
import ModaleNouvelleRemontee from "./ModaleNouvelleRemontee";
import ModaleNouveauRDV from "./ModaleNouveauRDV";

type Magasin = { id: string; nom: string; enseigne: string | null };
type Modale = "remontee" | "rdv" | null;

type Props = {
  magasinId: string;
  animateurTel: string;
  autresMagasins: Magasin[];
};

const cardBase = "rounded-2xl p-5 shadow-sm flex flex-col items-start gap-2 cursor-pointer transition-colors";

export default function ActionsMembre({ magasinId, animateurTel, autresMagasins }: Props) {
  const [modale, setModale] = useState<Modale>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Appeler animateur */}
        <a
          href={`tel:${animateurTel}`}
          className={`${cardBase} bg-emerald-500 hover:bg-emerald-600 text-white`}
        >
          <span className="text-2xl">📞</span>
          <span className="text-sm font-semibold leading-tight">Appeler l&apos;animateur</span>
        </a>

        {/* Demander un RDV */}
        <button
          type="button"
          onClick={() => setModale("rdv")}
          className={`${cardBase} bg-blue-500 hover:bg-blue-600 text-white text-left`}
        >
          <span className="text-2xl">📅</span>
          <span className="text-sm font-semibold leading-tight">Demander un RDV</span>
        </button>

        {/* Faire remonter */}
        <button
          type="button"
          onClick={() => setModale("remontee")}
          className={`${cardBase} bg-orange-500 hover:bg-orange-600 text-white text-left`}
        >
          <span className="text-2xl">📢</span>
          <span className="text-sm font-semibold leading-tight">Faire remonter une info</span>
        </button>

        {/* Voir mes notes */}
        <a
          href="#indicateurs"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("indicateurs")?.scrollIntoView({ behavior: "smooth" });
          }}
          className={`${cardBase} bg-slate-700 hover:bg-slate-900 text-white`}
        >
          <span className="text-2xl">📊</span>
          <span className="text-sm font-semibold leading-tight">Voir mes notes</span>
        </a>
      </div>

      {modale === "remontee" && (
        <ModaleNouvelleRemontee magasinId={magasinId} onClose={() => setModale(null)} />
      )}
      {modale === "rdv" && (
        <ModaleNouveauRDV
          magasinId={magasinId}
          autresMagasins={autresMagasins}
          onClose={() => setModale(null)}
        />
      )}
    </>
  );
}
