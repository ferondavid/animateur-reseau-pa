"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function creerVisitesPlanifieesParcours(
  magasinIds: string[],
  dateDebut: string,
  objectif: string
): Promise<{ ok: boolean; nb?: number; error?: string }> {
  if (!magasinIds.length) return { ok: false, error: "Aucun magasin sélectionné" };
  if (!dateDebut) return { ok: false, error: "Date de début manquante" };

  const supabase = await createClient();
  const debut = new Date(dateDebut);

  const rows = magasinIds.map((mid, i) => {
    const d = new Date(debut);
    d.setDate(d.getDate() + i); // 1 visite par jour
    return {
      magasin_id: mid,
      statut: "planifiee",
      date_prevue: d.toISOString().slice(0, 10),
      objectif: objectif || "Tournée animateur",
      accepte_par_membre: false,
    };
  });

  const { error, data } = await supabase.from("visites").insert(rows).select("id");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/animateur");
  revalidatePath("/visites");
  for (const mid of magasinIds) revalidatePath(`/magasins/${mid}`);

  return { ok: true, nb: data?.length ?? 0 };
}
