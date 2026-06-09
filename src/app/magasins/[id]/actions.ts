"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateMagasin(formData: FormData) {
  const id = formData.get("id") as string;

  // Infos animateur (uniquement visibles côté animateur)
  const dateCreation = formData.get("date_creation_entreprise") as string;
  const nbCollab = formData.get("nb_collaborateurs") as string;
  const typeActivite = formData.get("type_activite") as string;
  const tagsRaw = formData.get("tags_animateur") as string;
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  const scoreRaw = formData.get("score_potentiel") as string;
  const score = scoreRaw ? parseInt(scoreRaw, 10) : null;

  const supabase = await createClient();
  await supabase
    .from("magasins")
    .update({
      nom: formData.get("nom"),
      enseigne: formData.get("enseigne"),
      adresse: formData.get("adresse"),
      code_postal: formData.get("code_postal"),
      ville: formData.get("ville"),
      region: formData.get("region"),
      contact_nom: formData.get("contact_nom"),
      contact_telephone: formData.get("contact_telephone"),
      contact_email: formData.get("contact_email"),
      statut: formData.get("statut"),
      niveau: formData.get("niveau"),
      notes: formData.get("notes") || null,
      // Infos animateur
      date_creation_entreprise: dateCreation || null,
      nb_collaborateurs: nbCollab ? parseInt(nbCollab, 10) : null,
      type_activite: typeActivite || null,
      tags_animateur: tags,
      notes_animateur: formData.get("notes_animateur") || null,
      score_potentiel: score && score >= 1 && score <= 5 ? score : null,
    })
    .eq("id", id);

  revalidatePath(`/magasins/${id}`);
  revalidatePath("/magasins");
  redirect(`/magasins/${id}`);
}

export async function deleteMagasin(formData: FormData) {
  const id = formData.get("id") as string;

  const supabase = await createClient();
  await supabase.from("magasins").delete().eq("id", id);

  revalidatePath("/magasins");
  revalidatePath("/animateur");
  redirect("/magasins");
}

export async function updateStatutMagasin(id: string, statut: "actif" | "pause" | "inactif") {
  const supabase = await createClient();
  await supabase.from("magasins").update({ statut }).eq("id", id);
  revalidatePath("/magasins");
  revalidatePath(`/magasins/${id}`);
  revalidatePath("/animateur");
}

export async function archiverMagasin(id: string) {
  const supabase = await createClient();
  await supabase.from("magasins").update({ statut: "inactif" }).eq("id", id);
  revalidatePath("/magasins");
  revalidatePath(`/magasins/${id}`);
  revalidatePath("/animateur");
  redirect("/magasins");
}
