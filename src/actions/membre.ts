"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { notifierRemonteeUrgente, notifierNouveauRDVMagasin } from "@/lib/notifs";

// ─── Créer une remontée terrain (membre) ────────────────────────────────────

export async function creerRemontee(
  formData: FormData
): Promise<{ ok: boolean; remonteeId?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non authentifié" };

  const supabase = await createClient();
  const magasinId = formData.get("magasin_id") as string;
  const gravite = formData.get("gravite") as string;

  // Upload photo si présente
  let photoUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.name.split(".").pop() ?? "bin";
    const path = `magasin_${magasinId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("photos-remontees")
      .upload(path, photo, { upsert: false, contentType: photo.type });
    if (upErr) return { ok: false, error: `Upload : ${upErr.message}` };
    const { data: pub } = supabase.storage.from("photos-remontees").getPublicUrl(path);
    photoUrl = pub.publicUrl;
  }

  const { data, error } = await supabase
    .from("remontees")
    .insert({
      magasin_id:  magasinId,
      type:        formData.get("type") as string,
      titre:       formData.get("titre") as string,
      description: formData.get("description") as string,
      gravite,
      statut:      "nouvelle",
      source:      "membre",
      photo_url:   photoUrl,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: `Insert : ${error.message}` };

  if (gravite === "urgente" && data?.id) {
    notifierRemonteeUrgente(data.id).catch(() => {});
  }

  return { ok: true, remonteeId: data.id };
}

// ─── Créer une demande de RDV (membre) ──────────────────────────────────────

export async function creerRDV(
  formData: FormData,
  type: string,
  invites: string[]
): Promise<{ ok: boolean; rdvId?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Non authentifié" };

  const supabase = await createClient();
  const magasinId = formData.get("magasin_id") as string;

  const { data: rdv, error } = await supabase
    .from("rendez_vous")
    .insert({
      magasin_id:     magasinId,
      type,
      date_souhaitee: formData.get("date_souhaitee") as string,
      heure_souhaitee: (formData.get("heure_souhaitee") as string) || null,
      objet:           formData.get("objet") as string,
      message:         (formData.get("message") as string) || null,
      lieu:
        type === "physique"
          ? (formData.get("lieu") as string) || "Au magasin"
          : null,
      statut:          "demande",
      demandeur_type:  "magasin",
    })
    .select("id")
    .single();

  if (error || !rdv) {
    return { ok: false, error: error?.message ?? "Erreur inconnue" };
  }

  if (invites.length > 0) {
    await supabase.from("rendez_vous_invites").insert(
      invites.map((mid) => ({ rendez_vous_id: rdv.id, magasin_id: mid }))
    );
  }

  notifierNouveauRDVMagasin(rdv.id).catch(() => {});

  return { ok: true, rdvId: rdv.id };
}
