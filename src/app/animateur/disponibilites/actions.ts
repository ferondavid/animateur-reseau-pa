"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function ajouterJourBloque(
  dateDebut: string,
  dateFin: string,
  type: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };
  if (!dateDebut) return { ok: false, error: "Date manquante" };
  if (!["home_office", "conges", "bureau"].includes(type)) return { ok: false, error: "Type invalide" };

  const fin = dateFin && dateFin >= dateDebut ? dateFin : dateDebut;
  const supabase = await createClient();
  const { error } = await supabase.from("jours_bloques").insert({
    date_debut: dateDebut,
    date_fin: fin,
    type,
    note: note || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/animateur/disponibilites");
  revalidatePath("/visites");
  return { ok: true };
}

export async function supprimerJourBloque(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  await supabase.from("jours_bloques").delete().eq("id", id);
  revalidatePath("/animateur/disponibilites");
  revalidatePath("/visites");
  return { ok: true };
}
