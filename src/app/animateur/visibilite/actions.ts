"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function majVisibilite(
  cle: string,
  role: "associe" | "bureau",
  valeur: boolean
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("visibilite")
    .update({ [role]: valeur, updated_at: new Date().toISOString() })
    .eq("cle", cle);
  if (error) return { error: "Échec de l'enregistrement." };
  revalidatePath("/animateur/visibilite");
  revalidatePath("/bureau");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function majVisibiliteBulk(
  categorie: string,
  role: "associe" | "bureau",
  valeur: boolean
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("visibilite")
    .update({ [role]: valeur, updated_at: new Date().toISOString() })
    .eq("categorie", categorie);
  if (error) return { error: "Échec de l'enregistrement." };
  revalidatePath("/animateur/visibilite");
  revalidatePath("/bureau");
  revalidatePath("/", "layout");
  return { ok: true };
}
