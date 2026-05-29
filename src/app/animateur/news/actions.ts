"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function creerNews(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("news").insert({
    titre: formData.get("titre") as string,
    contenu: formData.get("contenu") as string,
    type: formData.get("type") as string,
    auteur: "Animateur",
    image_url: (formData.get("image_url") as string) || null,
    epinglee: formData.get("epinglee") === "on",
    publie: formData.get("publie") === "on",
  });
  revalidatePath("/animateur/news");
  revalidatePath("/");
  redirect("/animateur/news");
}

export async function modifierNews(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("news")
    .update({
      titre: formData.get("titre") as string,
      contenu: formData.get("contenu") as string,
      type: formData.get("type") as string,
      image_url: (formData.get("image_url") as string) || null,
      epinglee: formData.get("epinglee") === "on",
      publie: formData.get("publie") === "on",
    })
    .eq("id", id);
  revalidatePath("/animateur/news");
  revalidatePath("/");
  revalidatePath(`/news/${id}`);
  redirect("/animateur/news");
}

export async function supprimerNews(id: string) {
  const supabase = await createClient();
  await supabase.from("news").delete().eq("id", id);
  revalidatePath("/animateur/news");
  revalidatePath("/");
}

export async function togglePublication(id: string, valeur: boolean) {
  const supabase = await createClient();
  await supabase.from("news").update({ publie: valeur }).eq("id", id);
  revalidatePath("/animateur/news");
  revalidatePath("/");
}

export async function toggleEpingle(id: string, valeur: boolean) {
  const supabase = await createClient();
  await supabase.from("news").update({ epinglee: valeur }).eq("id", id);
  revalidatePath("/animateur/news");
  revalidatePath("/");
}
