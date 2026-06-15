import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function titreAuto(): string {
  const now = new Date();
  const date = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const heure = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `Note du ${date} à ${heure}`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "animateur") {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio");
  const titre     = (formData.get("titre") as string | null) || titreAuto();
  const dureeSec  = Number(formData.get("duree_sec")) || null;

  if (!(audioFile instanceof File) || audioFile.size === 0) {
    return Response.json({ error: "Fichier audio manquant" }, { status: 400 });
  }

  const supabase   = await createClient();
  const baseType   = (audioFile.type || "audio/webm").split(";")[0];
  const ext        = baseType.includes("mp4") ? "m4a" : baseType.includes("ogg") ? "ogg" : "webm";
  const path       = `note-${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("notes-vocales")
    .upload(path, audioFile, { contentType: baseType, upsert: false });

  if (upErr) {
    return Response.json({ error: `Upload : ${upErr.message}` }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("notes-vocales").getPublicUrl(path);

  const { data, error } = await supabase
    .from("notes_vocales")
    .insert({ audio_url: pub.publicUrl, duree_sec: dureeSec, titre, statut: "active" })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/animateur/notes");
  return Response.json({ ok: true, id: data.id });
}
