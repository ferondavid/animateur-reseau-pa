"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateVisite(formData: FormData) {
  const id = formData.get("id") as string;
  const magasin_id = formData.get("magasin_id") as string;

  const supabase = await createClient();
  await supabase
    .from("visites")
    .update({
      magasin_id,
      date_prevue: formData.get("date_prevue") || null,
      date_realisee: formData.get("date_realisee") || null,
      statut: formData.get("statut"),
      duree_minutes: formData.get("duree_minutes")
        ? Number(formData.get("duree_minutes"))
        : null,
      objectif: formData.get("objectif") || null,
      compte_rendu: formData.get("compte_rendu") || null,
      points_positifs: formData.get("points_positifs") || null,
      points_attention: formData.get("points_attention") || null,
      actions_decidees: formData.get("actions_decidees") || null,
      prochaine_etape: formData.get("prochaine_etape") || null,
      note_confiance: formData.get("note_confiance")
        ? Number(formData.get("note_confiance"))
        : null,
      commentaire_confiance: formData.get("commentaire_confiance") || null,
      note_business: formData.get("note_business")
        ? Number(formData.get("note_business"))
        : null,
      commentaire_business: formData.get("commentaire_business") || null,
    })
    .eq("id", id);

  revalidatePath(`/visites/${id}`);
  revalidatePath("/visites");
  revalidatePath(`/magasins/${magasin_id}`);
  redirect(`/visites/${id}`);
}

export async function deleteVisite(formData: FormData) {
  const id = formData.get("id") as string;
  const magasin_id = formData.get("magasin_id") as string;

  const supabase = await createClient();
  await supabase.from("visites").delete().eq("id", id);

  revalidatePath("/visites");
  if (magasin_id) revalidatePath(`/magasins/${magasin_id}`);
  redirect("/visites");
}
