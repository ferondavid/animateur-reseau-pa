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
    .upsert({ key: cle, value: valeur ? "true" : "false" });
  if (error) return { error: "Échec de l'enregistrement." };
  revalidatePath("/animateur/notifs");
  return { ok: true };
}
