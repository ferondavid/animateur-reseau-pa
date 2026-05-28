"use client";

import dynamic from "next/dynamic";

const Carte = dynamic(() => import("./Carte"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
      Chargement de la carte…
    </div>
  ),
});

export default Carte;