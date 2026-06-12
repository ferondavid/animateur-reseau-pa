"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function titreAuto(): string {
  const now = new Date();
  const date = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const heure = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `Note du ${date} à ${heure}`;
}

function extractFilePath(audioUrl: string): string | null {
  const marker = "/notes-vocales/";
  const idx = audioUrl.indexOf(marker);
  return idx !== -1 ? audioUrl.slice(idx + marker.length) : null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function creerNote(params: {
  audioUrl: string;
  dureeSec?: number;
  titre?: string;
  magasinId?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes_vocales")
    .insert({
      audio_url:  params.audioUrl,
      duree_sec:  params.dureeSec ?? null,
      titre:      params.titre ?? titreAuto(),
      magasin_id: params.magasinId ?? null,
      statut:     "active",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/animateur/notes");
  return { ok: true, id: data.id };
}

export async function renommerNote(id: string, titre: string) {
  const supabase = await createClient();
  await supabase.from("notes_vocales").update({ titre }).eq("id", id);
  revalidatePath("/animateur/notes");
}

export async function archiverNote(id: string) {
  const supabase = await createClient();
  await supabase.from("notes_vocales").update({ statut: "archivee" }).eq("id", id);
  revalidatePath("/animateur/notes");
}

export async function desarchiverNote(id: string) {
  const supabase = await createClient();
  await supabase.from("notes_vocales").update({ statut: "active" }).eq("id", id);
  revalidatePath("/animateur/notes");
}

export async function supprimerNote(id: string) {
  const supabase = await createClient();

  const { data: note } = await supabase
    .from("notes_vocales")
    .select("audio_url")
    .eq("id", id)
    .single();

  if (note?.audio_url) {
    const path = extractFilePath(note.audio_url);
    if (path) {
      await supabase.storage.from("notes-vocales").remove([path]);
    }
  }

  await supabase.from("notes_vocales").delete().eq("id", id);
  revalidatePath("/animateur/notes");
}

export async function supprimerNotesEnLot(ids: string[]) {
  if (!ids.length) return;
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("notes_vocales")
    .select("audio_url")
    .in("id", ids);

  const paths = (notes ?? [])
    .map((n) => extractFilePath(n.audio_url))
    .filter((p): p is string => p !== null);

  if (paths.length > 0) {
    await supabase.storage.from("notes-vocales").remove(paths);
  }

  await supabase.from("notes_vocales").delete().in("id", ids);
  revalidatePath("/animateur/notes");
}
