"use client";

import dynamic from "next/dynamic";

const CarteParcours = dynamic(() => import("./CarteParcours"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "500px" }}
      className="w-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"
    >
      Chargement de la carte…
    </div>
  ),
});

export default CarteParcours;
