"use client";

import { useRouter } from "next/navigation";
import { Store } from "lucide-react";

export default function BoutonChangerMagasin() {
  const router = useRouter();
  return (
    <button onClick={() => router.push("/membre")} className="pa-ghost-btn">
      <Store size={14} />
      Choisir un autre magasin
    </button>
  );
}
