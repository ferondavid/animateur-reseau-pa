"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * « Retour » contextuel depuis les actualités (route partagée /news).
 * Renvoie le membre sur SA fiche, l'animateur sur le dashboard,
 * en lisant le rôle/magasin mémorisé par PersistRole (localStorage).
 */
export default function BoutonRetourNews() {
  const [href, setHref] = useState("/");

  useEffect(() => {
    try {
      const role = localStorage.getItem("pa_role");
      const mag = localStorage.getItem("pa_magasin_id");
      if (role === "membre" && mag) setHref(`/membre/${mag}`);
      else if (role === "animateur") setHref("/animateur");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm transition-colors"
      style={{ color: "var(--pa-muted)" }}
    >
      <ArrowLeft size={15} strokeWidth={2.5} />
      Retour
    </Link>
  );
}
