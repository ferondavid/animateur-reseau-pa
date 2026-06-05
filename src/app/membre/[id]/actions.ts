"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifierConfirmationRDV } from "@/lib/notifs";

function revalider(magasinId: string) {
  revalidatePath(`/membre/${magasinId}`);
  revalidatePath("/animateur");
  revalidatePath("/animateur/rdv");
}

export async function accepterRDVMembre(rdvId: string, magasinId: string) {
  const supabase = await createClient();
  await supabase.from("rendez_vous").update({ statut: "confirme" }).eq("id", rdvId);
  revalider(magasinId);
  try {
    await notifierConfirmationRDV(rdvId);
  } catch (err) {
    console.error("[NOTIF-RDV] échec email acceptation membre :", err);
  }
}

export async function refuserRDVMembre(rdvId: string, magasinId: string, raison?: string) {
  const supabase = await createClient();
  const update: Record<string, unknown> = { statut: "annule" };
  if (raison?.trim()) update.message = `[Refus membre] ${raison}`;
  await supabase.from("rendez_vous").update(update).eq("id", rdvId);
  revalider(magasinId);
}

export async function proposerAutreCreneauRDV(
  rdvId: string,
  magasinId: string,
  nouvelleDate: string,
  nouvelleHeure?: string
) {
  const supabase = await createClient();
  await supabase
    .from("rendez_vous")
    .update({
      statut: "reporte",
      date_souhaitee: nouvelleDate,
      heure_souhaitee: nouvelleHeure || null,
      demandeur_type: "magasin",
    })
    .eq("id", rdvId);
  revalider(magasinId);
}

export async function accepterVisite(visiteId: string, magasinId: string) {
  const supabase = await createClient();
  await supabase.from("visites").update({ accepte_par_membre: true }).eq("id", visiteId);
  revalider(magasinId);
}

export async function refuserVisite(visiteId: string, magasinId: string) {
  const supabase = await createClient();
  await supabase
    .from("visites")
    .update({ statut: "annulee", accepte_par_membre: false })
    .eq("id", visiteId);
  revalider(magasinId);
}
