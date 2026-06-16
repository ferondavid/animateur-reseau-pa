import type { CSSProperties } from "react";

// Réglages d'affichage de l'image d'une news (hauteur, cadrage, position).
export type NewsImgCfg = {
  image_hauteur?: string | null;
  image_cadrage?: string | null;
  image_position?: string | null;
};

const HAUTEUR: Record<string, number> = { petite: 150, moyenne: 240, grande: 360 };
const POSITION: Record<string, string> = { haut: "top", centre: "center", bas: "bottom" };

export function hauteurNews(n: NewsImgCfg): number {
  return HAUTEUR[n.image_hauteur ?? "moyenne"] ?? 240;
}

export function estEntiere(n: NewsImgCfg): boolean {
  return (n.image_cadrage ?? "remplir") === "entiere";
}

// Style à appliquer sur la balise <img>
export function styleImageNews(n: NewsImgCfg): CSSProperties {
  return {
    width: "100%",
    height: hauteurNews(n),
    objectFit: estEntiere(n) ? "contain" : "cover",
    objectPosition: POSITION[n.image_position ?? "centre"] ?? "center",
  };
}

// Fond du cadre (utile en mode "image entière" pour habiller le letterbox)
export function fondImageNews(n: NewsImgCfg): string {
  return estEntiere(n) ? "#ECEAF3" : "transparent";
}
