// Markdown léger maison (sans dépendance). Le contenu des news est écrit
// uniquement par l'animateur authentifié → pas d'entrée publique, pas de risque XSS.

// Retire la syntaxe Markdown pour produire un extrait en texte brut
// (utilisé dans les cartes / aperçus tronqués).
export function stripMarkdown(md: string): string {
  return (md ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[>\-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}
