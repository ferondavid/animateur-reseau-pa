"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateMagasin(formData: FormData) {
  const id = formData.get("id") as string;

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
  redirect("/magasins");
}
