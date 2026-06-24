"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function majNotif(
  cle: string,
  valeur: boolean
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("parametres")
    .upsert({ cle, valeur: valeur ? "true" : "false" }, { onConflict: "cle" });
  if (error) return { error: "Échec de l'enregistrement." };
  revalidatePath("/animateur/notifs");
  return { ok: true };
}
