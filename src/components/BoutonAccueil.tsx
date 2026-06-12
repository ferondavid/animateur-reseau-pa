import Link from "next/link";
import { Home } from "lucide-react";

/**
 * Bouton retour à l'accueil animateur — icône maison, en haut à gauche.
 * Remplace les anciens liens « Retour dashboard » placés de façon incohérente.
 */
export default function BoutonAccueil() {
  return (
    <Link
      href="/animateur"
      aria-label="Accueil"
      title="Accueil"
      className="pa-home-btn inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all"
      style={{
        background: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(124,107,232,0.2)",
        color: "#6B4FD8",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 4px 12px -6px rgba(80,60,140,0.25)",
      }}
    >
      <Home size={17} strokeWidth={2.3} />
    </Link>
  );
}
