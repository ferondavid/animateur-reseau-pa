"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { notifierNewsPubliee } from "@/lib/notifs";

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
  if (valeur) try { await notifierNewsPubliee(id); } catch {}
}

export async function toggleEpingle(id: string, valeur: boolean) {
  const supabase = await createClient();
  await supabase.from("news").update({ epinglee: valeur }).eq("id", id);
  revalidAll(id);
}

// ─── Créer ou modifier une news (animateur) ──────────────────────────────────

export async function enregistrerNews(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };

  const supabase = await createClient();
  const mode   = formData.get("mode") as "creer" | "modifier";
  const newsId = formData.get("news_id") as string | null;

  let imageUrl = (formData.get("image_actuelle") as string | null) ?? null;
  const fichier = formData.get("image");
  if (fichier instanceof File && fichier.size > 0) {
    const ext = fichier.name.split(".").pop() ?? "bin";
    const path = `news_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("news-images")
      .upload(path, fichier, { upsert: false, contentType: fichier.type });
    if (upErr) return { ok: false, error: `Upload image : ${upErr.message}` };
    const { data: pub } = supabase.storage.from("news-images").getPublicUrl(path);
    imageUrl = pub.publicUrl;
  }

  const payload = {
    titre:            formData.get("titre") as string,
    contenu:          formData.get("contenu") as string,
    type:             formData.get("type") as string,
    auteur:           (formData.get("auteur") as string) || "Animateur",
    image_url:        imageUrl,
    image_hauteur:    (formData.get("image_hauteur") as string) || "moyenne",
    image_cadrage:    (formData.get("image_cadrage") as string) || "remplir",
    image_position:   (formData.get("image_position") as string) || "centre",
    epinglee:         formData.get("epinglee") === "on",
    publie:           formData.get("publie") === "on",
    date_publication: (formData.get("date_publication") as string) || new Date().toISOString(),
  };

  if (mode === "creer") {
    const { data: created, error } = await supabase.from("news").insert(payload).select("id").single();
    if (error) return { ok: false, error: `Création : ${error.message}` };
    if (payload.publie && created?.id) try { await notifierNewsPubliee(created.id as string); } catch {}
  } else {
    if (!newsId) return { ok: false, error: "ID news manquant" };
    const { error } = await supabase.from("news").update(payload).eq("id", newsId);
    if (error) return { ok: false, error: `Mise à jour : ${error.message}` };
  }

  revalidAll(newsId ?? undefined);
  redirect("/animateur/news");
}
