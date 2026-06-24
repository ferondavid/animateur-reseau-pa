"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifierConfirmationRDV, notifierRDVConfirmeAssoc, notifierRDVReporteAssoc } from "@/lib/notifs";

function revalider() {
  revalidatePath("/animateur");
  revalidatePath("/animateur/rdv");
}

export async function confirmerRDV(id: string, lienVisio?: string) {
  const supabase = await createClient();
  await supabase
    .from("rendez_vous")
    .update({ statut: "confirme", ...(lienVisio ? { lien_visio: lienVisio } : {}) })
    .eq("id", id);
  revalider();
  try {
    await notifierConfirmationRDV(id);
    await notifierRDVConfirmeAssoc(id);
  } catch (err) {
    console.error("[NOTIF-RDV] échec confirmation :", err);
  }
}

export async function reporterRDV(id: string, nouvelleDate: string, nouvelleHeure?: string, raison?: string) {
  const supabase = await createClient();

  const { data: rdvActuel } = await supabase
    .from("rendez_vous")
    .select("statut")
    .eq("id", id)
    .single();

  const etaitConfirme = rdvActuel?.statut === "confirme";

  await supabase
    .from("rendez_vous")
    .update({
      statut: "reporte",
      date_souhaitee: nouvelleDate,
      ...(nouvelleHeure ? { heure_souhaitee: nouvelleHeure } : {}),
      ...(raison ? { message: raison } : {}),
    })
    .eq("id", id);
  revalider();

  if (etaitConfirme) {
    try {
      await notifierConfirmationRDV(id);
    } catch (err) {
      console.error("[NOTIF-RDV] échec email report :", err);
    }
  }
  try { await notifierRDVReporteAssoc(id); } catch {}
}

export async function annulerRDV(id: string) {
  const supabase = await createClient();
  await supabase.from("rendez_vous").update({ statut: "annule" }).eq("id", id);
  revalider();
  try { await notifierRDVReporteAssoc(id); } catch {}
}

export async function marquerFait(id: string) {
  const supabase = await createClient();
  await supabase.from("rendez_vous").update({ statut: "fait" }).eq("id", id);
  revalider();
}

export async function creerRDVAnimateur(formData: FormData) {
  const supabase = await createClient();
  const invitesRaw = formData.get("invites") as string;
  const invites: string[] = invitesRaw ? JSON.parse(invitesRaw) : [];

  const { data: rdv, error } = await supabase
    .from("rendez_vous")
    .insert({
      magasin_id: formData.get("magasin_id") as string,
      type: formData.get("type") as string,
      date_souhaitee: formData.get("date_souhaitee") as string,
      heure_souhaitee: (formData.get("heure_souhaitee") as string) || null,
      objet: formData.get("objet") as string,
      message: (formData.get("message") as string) || null,
      lieu: (formData.get("lieu") as string) || null,
      lien_visio: (formData.get("lien_visio") as string) || null,
      statut: "demande",
      demandeur_type: "animateur",
    })
    .select("id")
    .single();

  if (error) {
    redirect("/animateur/rdv/nouvelle?error=" + encodeURIComponent(error.message));
  }

  if (rdv && invites.length > 0) {
    await supabase.from("rendez_vous_invites").insert(
      invites.map((mid) => ({ rendez_vous_id: rdv.id, magasin_id: mid }))
    );
  }
  revalider();
  redirect("/animateur/rdv?ok=1");
}
