"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Bouton « Retour » depuis les actualités (route partagée /news).
 * - Sans `href` : destination intelligente (membre → sa fiche, animateur → dashboard),
 *   via le rôle/magasin mémorisé par PersistRole (localStorage).
 * - Avec `href` : destination fixe (ex. la liste /news depuis une fiche détail).
 */
export default function BoutonRetourNews({
  href,
  label = "Retour",
}: {
  href?: string;
  label?: string;
}) {
  const [computed, setComputed] = useState("/");

  useEffect(() => {
    if (href) return; // destination fixe fournie
    try {
      const role = localStorage.getItem("pa_role");
      const mag = localStorage.getItem("pa_magasin_id");
      if (role === "membre" && mag) setComputed(`/membre/${mag}`);
      else if (role === "animateur") setComputed("/animateur");
    } catch {
      /* ignore */
    }
  }, [href]);

  return (
    <Link href={href ?? computed} className="pa-ghost-btn">
      <ArrowLeft size={15} strokeWidth={2.5} />
      {label}
    </Link>
  );
}
