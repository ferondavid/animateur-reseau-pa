"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function revalid() {
  revalidatePath("/animateur/tournee");
  revalidatePath("/animateur/tournee/semaine");
  revalidatePath("/visites");
  revalidatePath("/animateur");
}

export async function confirmerVisite(
  id: string,
  valeur: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };

  const supabase = await createClient();
  const { error } = await supabase.from("visites").update({ confirmee: valeur }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalid();
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
  revalid();
  return { ok: true };
}

// Change le statut (réalisée / annulée / planifiée). Pour "réalisée", pose la date du jour.
export async function changerStatutVisite(
  id: string,
  statut: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };
  if (!["planifiee", "realisee", "annulee", "reportee"].includes(statut))
    return { ok: false, error: "Statut invalide" };

  const supabase = await createClient();
  const patch: Record<string, unknown> = { statut };
  if (statut === "realisee") patch.date_realisee = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("visites").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalid();
  return { ok: true };
}
