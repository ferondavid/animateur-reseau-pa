"use server";

// Server Action publique — accessible sans authentification.
// Utilise la clé anon ; les RLS Supabase doivent autoriser l'insert anon sur evaluations_visite.

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifierNouvelleEvaluation } from "@/lib/notifs";

export async function submitEvaluation(formData: FormData) {
  const visite_id = formData.get("visite_id") as string;
  const magasin_id = formData.get("magasin_id") as string;
  const supabase = await createClient();

  const { error } = await supabase.from("evaluations_visite").insert({
    visite_id,
    magasin_id,
    q1_ecoute: parseInt(formData.get("q1_ecoute") as string),
    q2_pertinence: parseInt(formData.get("q2_pertinence") as string),
    q3_solutions: parseInt(formData.get("q3_solutions") as string),
    q4_suivi: parseInt(formData.get("q4_suivi") as string),
    q5_disponibilite: parseInt(formData.get("q5_disponibilite") as string),
    q6_satisfaction_globale: parseInt(
      formData.get("q6_satisfaction_globale") as string
    ),
    commentaire_texte:
      (formData.get("commentaire_texte") as string) || null,
  });

  // Contrainte unique violée → une éval existe déjà (rare race condition)
  if (error?.code === "23505") {
    redirect(`/evaluation/${visite_id}`);
  }

  if (error) throw error;

  revalidatePath(`/visites/${visite_id}`);
  revalidatePath("/evaluations");
  revalidatePath("/");
  try { await notifierNouvelleEvaluation(visite_id, magasin_id); } catch {}

  // ?merci=1 permet à la page de distinguer "vient de soumettre" vs "déjà évalué"
  redirect(`/evaluation/${visite_id}?merci=1`);
}
