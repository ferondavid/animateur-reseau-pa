import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export type VisRole = "associe" | "bureau";
export type VisMap = Record<string, { associe: boolean; bureau: boolean }>;

/** Lit toutes les règles de visibilité. Renvoie {} si la table n'existe pas encore. */
export async function getVisibilite(): Promise<VisMap> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("visibilite").select("cle, associe, bureau");
    const map: VisMap = {};
    for (const r of (data ?? []) as unknown as { cle: string; associe: boolean; bureau: boolean }[]) {
      map[r.cle] = { associe: r.associe, bureau: r.bureau };
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Une fonctionnalité est-elle visible pour ce rôle ?
 * Par défaut (clé absente / table absente) → true : on garde le comportement actuel
 * tant que les règles ne sont pas posées.
 */
export function peutVoir(map: VisMap, cle: string, role: VisRole, defaut = false): boolean {
  const r = map[cle];
  if (!r) return defaut;
  return role === "associe" ? r.associe : r.bureau;
}

/**
 * Garde pour une page accessible au bureau : si le rôle est bureau et que la
 * fonctionnalité est masquée pour lui, on le renvoie sur son accueil.
 * Sans effet pour l'animateur (qui voit tout).
 */
export async function guardBureau(cle: string): Promise<void> {
  const session = await getSession();
  if (session?.role === "bureau") {
    const vis = await getVisibilite();
    if (!peutVoir(vis, cle, "bureau")) redirect("/bureau");
  }
}
