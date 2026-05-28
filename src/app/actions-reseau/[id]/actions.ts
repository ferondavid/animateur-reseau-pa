"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAction(formData: FormData) {
  const supabase = await createClient();
  const portee = formData.get("portee") as string;
  const magasin_id =
    portee === "magasin"
      ? ((formData.get("magasin_id") as string) || null)
      : null;

  const { data, error } = await supabase
    .from("actions")
    .insert({
      titre: formData.get("titre") as string,
      description: (formData.get("description") as string) || null,
      niveau_urgence: Number(formData.get("niveau_urgence") ?? 2),
      portee,
      magasin_id,
      deadline: (formData.get("deadline") as string) || null,
      statut: "ouverte",
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/actions-reseau");
  revalidatePath("/");
  if (magasin_id) revalidatePath(`/magasins/${magasin_id}`);
  redirect(`/actions-reseau/${data.id}`);
}

export async function updateAction(formData: FormData) {
  const id = formData.get("id") as string;
  const portee = formData.get("portee") as string;
  const magasin_id =
    portee === "magasin"
      ? ((formData.get("magasin_id") as string) || null)
      : null;

  const supabase = await createClient();

  await supabase
    .from("actions")
    .update({
      titre: formData.get("titre") as string,
      description: (formData.get("description") as string) || null,
      niveau_urgence: Number(formData.get("niveau_urgence")),
      portee,
      magasin_id,
      deadline: (formData.get("deadline") as string) || null,
    })
    .eq("id", id);

  revalidatePath(`/actions-reseau/${id}`);
  revalidatePath("/actions-reseau");
  revalidatePath("/");
  redirect(`/actions-reseau/${id}`);
}

export async function deleteAction(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("actions").delete().eq("id", id);

  revalidatePath("/actions-reseau");
  revalidatePath("/");
  redirect("/actions-reseau");
}

export async function changeStatutAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nouveau_statut = formData.get("statut") as string;
  const commentaire =
    (formData.get("commentaire_realisation") as string) || null;

  const supabase = await createClient();

  const updates: Record<string, unknown> = { statut: nouveau_statut };
  if (nouveau_statut === "realisee") {
    updates.realise_le = new Date().toISOString();
    if (commentaire) updates.commentaire_realisation = commentaire;
  }

  await supabase.from("actions").update(updates).eq("id", id);

  revalidatePath(`/actions-reseau/${id}`);
  revalidatePath("/actions-reseau");
  revalidatePath("/");
  redirect(`/actions-reseau/${id}`);
}
