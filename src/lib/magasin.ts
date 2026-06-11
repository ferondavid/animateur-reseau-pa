/**
 * Titre d'affichage d'un magasin, sans doublon.
 *
 * Certains magasins ont une `enseigne` qui contient déjà le `nom`
 * (ex. enseigne "Rapid'eau Piscine — Piscinistes associés ." + nom "Rapid'eau Piscine").
 * Dans ce cas on n'affiche qu'une seule fois. Sinon « Enseigne — Nom ».
 *
 * Filet de sécurité côté affichage : même si la donnée est mal saisie,
 * le nom n'apparaît jamais en double.
 */
export function titreMagasin(
  enseigne: string | null | undefined,
  nom: string | null | undefined,
): string {
  const n = (nom ?? "").trim();
  const e = (enseigne ?? "").trim();
  if (!e) return n;
  if (!n) return e;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  if (norm(e) === norm(n) || norm(e).includes(norm(n))) return e;
  if (norm(n).includes(norm(e))) return n;
  return `${e} — ${n}`;
}
