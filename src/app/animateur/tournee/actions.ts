"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function confirmerVisite(
  id: string,
  valeur: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };

  const supabase = await createClient();
  const { error } = await supabase.from("visites").update({ confirmee: valeur }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/animateur/tournee");
  revalidatePath("/animateur/tournee/semaine");
  return { ok: true };
}

export async function reporterVisite(
  id: string,
  date: string,
  heure: string | null
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };
  if (!date) return { ok: false, error: "Date manquante" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("visites")
    .update({ date_prevue: date, heure_prevue: heure || null, confirmee: false })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/animateur/tournee");
  revalidatePath("/animateur/tournee/semaine");
  return { ok: true };
}
