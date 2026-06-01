"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function creerMagasin(formData: FormData) {
  const adresse = (formData.get("adresse") as string) || "";
  const cp = (formData.get("code_postal") as string) || "";
  const ville = (formData.get("ville") as string) || "";

  const latRaw = formData.get("latitude") as string;
  const lngRaw = formData.get("longitude") as string;
  let latitude = latRaw ? parseFloat(latRaw) : null;
  let longitude = lngRaw ? parseFloat(lngRaw) : null;

  // Géocodage Nominatim si lat/lng vides
  if ((!latitude || isNaN(latitude)) && ville) {
    try {
      const q = encodeURIComponent([adresse, cp, ville, "France"].filter(Boolean).join(", "));
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        {
          headers: { "User-Agent": "AnimateurPA/1.0 (animateur-reseau-pa.vercel.app)" },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const json = await res.json();
        if (json[0]) {
          latitude = parseFloat(json[0].lat);
          longitude = parseFloat(json[0].lon);
        }
      }
    } catch { /* géocodage optionnel — on laisse null */ }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("magasins")
    .insert({
      nom: formData.get("nom"),
      enseigne: formData.get("enseigne") || null,
      adresse: adresse || null,
      code_postal: cp || null,
      ville: ville || null,
      region: formData.get("region") || null,
      contact_nom: formData.get("contact_nom") || null,
      contact_telephone: formData.get("contact_telephone") || null,
      contact_email: formData.get("contact_email") || null,
      date_entree_reseau: formData.get("date_entree_reseau") || null,
      niveau: formData.get("niveau") || "standard",
      latitude: latitude && !isNaN(latitude) ? latitude : null,
      longitude: longitude && !isNaN(longitude) ? longitude : null,
      statut: "actif",
    })
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Échec de la création");

  revalidatePath("/magasins");
  revalidatePath("/animateur");
  redirect(`/magasins/${data.id}`);
}
