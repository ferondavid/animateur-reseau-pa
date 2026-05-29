"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRemontee(formData: FormData) {
  const supabase = await createClient();
  const magasin_id = formData.get("magasin_id") as string;

  const { data, error } = await supabase
    .from("remontees")
    .insert({
      magasin_id,
      type: formData.get("type") as string,
      titre: formData.get("titre") as string,
      description: formData.get("description") as string,
      gravite: (formData.get("gravite") as string) || "normale",
      statut: "nouvelle",
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/remontees");
  revalidatePath(`/magasins/${magasin_id}`);
  revalidatePath("/");
  redirect(`/remontees/${data.id}`);
}

export async function updateRemontee(formData: FormData) {
  const id = formData.get("id") as string;
  const magasin_id = formData.get("magasin_id") as string;
  const supabase = await createClient();

  await supabase
    .from("remontees")
    .update({
      magasin_id,
      type: formData.get("type") as string,
      titre: formData.get("titre") as string,
      description: formData.get("description") as string,
      gravite: formData.get("gravite") as string,
    })
    .eq("id", id);

  revalidatePath(`/remontees/${id}`);
  revalidatePath("/remontees");
  redirect(`/remontees/${id}`);
}

export async function deleteRemontee(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();

  await supabase.from("remontees").delete().eq("id", id);

  revalidatePath("/remontees");
  revalidatePath("/");
  redirect("/remontees");
}

export async function repondreRemontee(formData: FormData) {
  const id = formData.get("id") as string;
  const reponse = formData.get("reponse_animateur") as string;
  const supabase = await createClient();

  await supabase
    .from("remontees")
    .update({
      reponse_animateur: reponse,
      statut: "traitee",
      date_traitement: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/remontees/${id}`);
  revalidatePath("/remontees");
  revalidatePath("/");
  redirect(`/remontees/${id}`);
}

export async function supprimerPhotoRemontee(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("remontees").update({ photo_url: null }).eq("id", id);
  revalidatePath(`/remontees/${id}`);
  revalidatePath(`/remontees/${id}/modifier`);
  redirect(`/remontees/${id}/modifier`);
}

export async function changeStatutRemontee(formData: FormData) {
  const id = formData.get("id") as string;
  const nouveau_statut = formData.get("statut") as string;
  const supabase = await createClient();

  await supabase
    .from("remontees")
    .update({ statut: nouveau_statut })
    .eq("id", id);

  revalidatePath(`/remontees/${id}`);
  revalidatePath("/remontees");
  revalidatePath("/");
  redirect(`/remontees/${id}`);
}
