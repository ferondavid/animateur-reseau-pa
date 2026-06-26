"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function archiverProgramme(formData: FormData) {
  const semaine_debut  = formData.get("semaine_debut") as string;
  const semaine_fin    = formData.get("semaine_fin") as string;
  const contenu_texte  = formData.get("contenu_texte") as string | null;
  const contenu_json   = formData.get("contenu_json") as string | null;
  const note           = formData.get("note") as string | null;

  const supabase = await createClient();
  const { error } = await supabase.from("programmes_semaine").insert({
    semaine_debut,
    semaine_fin,
    contenu_texte: contenu_texte || null,
    contenu_json:  contenu_json ? JSON.parse(contenu_json) : null,
    note:          note || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/animateur/programme");
  return { success: true };
}
