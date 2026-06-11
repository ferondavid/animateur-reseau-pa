"use client";

import dynamic from "next/dynamic";

const CarteParcours = dynamic(() => import("./CarteParcours"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "500px", background: "#EDEBF6", color: "var(--pa-muted)" }}
      className="w-full rounded-2xl flex items-center justify-center text-sm"
    >
      Chargement de la carte…
    </div>
  ),
});

export default CarteParcours;
