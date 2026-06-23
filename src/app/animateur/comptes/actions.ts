"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function enregistrerCompte(
  magasinId: string,
  login: string,
  mdp: string,
  actif: boolean
): Promise<{ ok?: boolean; error?: string }> {
  login = login.trim();
  mdp = mdp.trim();
  if (!login || !mdp) return { error: "Identifiant et mot de passe requis." };

  const supabase = await createClient();

  // Identifiant déjà pris par un AUTRE magasin ?
  const { data: dup } = await supabase
    .from("comptes")
    .select("id, magasin_id")
    .eq("login", login)
    .maybeSingle();
  const d = dup as { id: string; magasin_id: string | null } | null;
  if (d && d.magasin_id !== magasinId) {
    return { error: "Cet identifiant est déjà utilisé." };
  }

  // Compte existant pour ce magasin ?
  const { data: ex } = await supabase
    .from("comptes")
    .select("id")
    .eq("magasin_id", magasinId)
    .maybeSingle();
  const e = ex as { id: string } | null;

  if (e) {
    const { error } = await supabase
      .from("comptes")
      .update({ login, mot_de_passe: mdp, actif, updated_at: new Date().toISOString() })
      .eq("id", e.id);
    if (error) return { error: "Échec de la mise à jour." };
  } else {
    const { error } = await supabase
      .from("comptes")
      .insert({ login, mot_de_passe: mdp, role: "membre", magasin_id: magasinId, actif });
    if (error) return { error: "Échec de création (identifiant déjà pris ?)." };
  }

  revalidatePath("/animateur/comptes");
  return { ok: true };
}

export async function supprimerCompte(magasinId: string): Promise<{ ok?: boolean }> {
  const supabase = await createClient();
  await supabase.from("comptes").delete().eq("magasin_id", magasinId).eq("role", "membre");
  revalidatePath("/animateur/comptes");
  return { ok: true };
}
