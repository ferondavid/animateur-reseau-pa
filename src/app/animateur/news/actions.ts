"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidAll(id?: string) {
  revalidatePath("/animateur/news");
  revalidatePath("/");
  if (id) revalidatePath(`/news/${id}`);
}

export async function updateParametreNbNews(nouvelleValeur: number) {
  const supabase = await createClient();
  await supabase
    .from("parametres")
    .upsert({ cle: "nb_news_fiche_membre", valeur: String(nouvelleValeur), updated_at: new Date().toISOString() });
  revalidatePath("/membre/[id]", "page");
  revalidatePath("/animateur/news");
}

export async function supprimerNews(id: string) {
  const supabase = await createClient();
  await supabase.from("news").delete().eq("id", id);
  revalidAll(id);
}

export async function togglePublication(id: string, valeur: boolean) {
  const supabase = await createClient();
  await supabase.from("news").update({ publie: valeur }).eq("id", id);
  revalidAll(id);
}

export async function toggleEpingle(id: string, valeur: boolean) {
  const supabase = await createClient();
  await supabase.from("news").update({ epinglee: valeur }).eq("id", id);
  revalidAll(id);
}
