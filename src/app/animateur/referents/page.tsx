export const dynamic = "force-dynamic";

import Navigation from "@/components/Navigation";
import BoutonAccueil from "@/components/BoutonAccueil";
import { Users, Building2 } from "lucide-react";

type Referent = {
  nom: string;
  domaines: string[];
  aide?: string;
};

const REFERENTS: Referent[] = [
  {
    nom: "Remy ALLEGRE",
    domaines: ["Chimie", "Pièces détachées"],
  },
  {
    nom: "Carole ANDRE",
    domaines: ["Coffret électrique", "Eclairage", "Traitement automatique + domotique"],
  },
  {
    nom: "Jérôme AUVIGNE",
    domaines: ["Filtre à cartouche", "Filtre à sable", "PAC"],
    aide: "Florian PASCAL (aide PAC)",
  },
  {
    nom: "Philipe COCHET",
    domaines: ["Bloc polyester", "Coque", "Volet"],
  },
  {
    nom: "Franck DESCOINS",
    domaines: ["Bâche et couverture", "Liner / PVC et membrane armé"],
  },
  {
    nom: "Michel HOUEL",
    domaines: [
      "Abris", "Alarme", "Balnéo / NCC", "Barrière de sécurité",
      "Bloc filtrant", "Colle", "Douche", "Electricité",
      "Innovation verte", "Kit accessoire", "PVC (souple / rigide)",
      "Sable / sel / verre", "Solaire", "Terrasse bois",
    ],
  },
  {
    nom: "José A. MUNOZ",
    domaines: ["Robots", "SPAS"],
  },
  {
    nom: "Roch PERRIN",
    domaines: ["Pièce à sceller", "Pompe de filtration"],
  },
  {
    nom: "Florian PASCAL",
    domaines: ["Aide PAC"],
  },
];

const COULEURS = [
  { bg: "#E4DDFB", color: "#6B4FD8" },
  { bg: "#D2F2E7", color: "#0F8C68" },
  { bg: "#FBF1D8", color: "#B07D14" },
  { bg: "#D9EAFB", color: "#2D6FD0" },
  { bg: "#FBE0E8", color: "#C0476E" },
  { bg: "#EDEBFB", color: "#6B4FD8" },
  { bg: "#D9FBE8", color: "#0A8C40" },
  { bg: "#FBD9D9", color: "#B82020" },
  { bg: "#F0DFFB", color: "#8B3FC8" },
];

const CA: string[] = [
  "Rémy ALLEGRE",
  "Carole ANDRÉ",
  "Philippe COCHET",
  "Fabien DUPRÉ",
  "Stéphane LANGEREAU",
  "Anthony GARNIER",
  "Michel HOUEL",
  "Jean-Louis MOURA",
  "José-Alexandre MUNOZ",
  "Benoit NEVEUR",
  "Roch PERRIN",
];

const COULEURS_CA = [
  { bg: "#FBF1D8", color: "#B07D14" },
  { bg: "#D9EAFB", color: "#2D6FD0" },
  { bg: "#D2F2E7", color: "#0F8C68" },
  { bg: "#FBE0E8", color: "#C0476E" },
  { bg: "#EDEBFB", color: "#6B4FD8" },
  { bg: "#D9FBE8", color: "#0A8C40" },
  { bg: "#FBD9D9", color: "#B82020" },
  { bg: "#F0DFFB", color: "#8B3FC8" },
  { bg: "#E4DDFB", color: "#6B4FD8" },
  { bg: "#FBF1D8", color: "#B07D14" },
  { bg: "#D9EAFB", color: "#2D6FD0" },
];

function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter((p) => p.length > 1 && p === p.toUpperCase())
    .slice(0, 2)
    .map((p) => p[0])
    .join("") || nom[0];
}

export default function ReferentsPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <BoutonAccueil />

        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
          >
            <Users size={22} style={{ color: "#6B4FD8" }} />
            Référents produits
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Liste 2026 — {REFERENTS.length} référents, {REFERENTS.reduce((s, r) => s + r.domaines.length, 0)} domaines
          </p>
        </div>

        <Navigation />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REFERENTS.map((r, i) => {
            const c = COULEURS[i % COULEURS.length];
            return (
              <div key={r.nom} className="pa-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: c.bg, color: c.color }}
                  >
                    {initiales(r.nom)}
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--pa-ink)" }}>
                      {r.nom}
                    </p>
                    {r.aide && (
                      <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
                        + {r.aide}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.domaines.map((d) => (
                    <span
                      key={d}
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: c.bg, color: c.color }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Conseil d'Administration */}
        <div>
          <h2
            className="text-lg font-bold flex items-center gap-2 mt-2"
            style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
          >
            <Building2 size={18} style={{ color: "#B07D14" }} />
            Conseil d&apos;Administration
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            {CA.length} membres
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CA.map((nom, i) => {
            const c = COULEURS_CA[i % COULEURS_CA.length];
            return (
              <div key={nom} className="pa-card p-3 flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: c.bg, color: c.color }}
                >
                  {initiales(nom)}
                </span>
                <p className="text-xs font-semibold leading-tight" style={{ color: "var(--pa-ink)" }}>
                  {nom}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
