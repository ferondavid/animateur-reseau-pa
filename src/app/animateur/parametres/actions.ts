"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sync as icalSync } from "node-ical";

export async function updateGCalParametres(url: string, label: string) {
  const supabase = await createClient();
  await supabase.from("parametres").upsert(
    [
      { cle: "gcal_ical_url", valeur: url, updated_at: new Date().toISOString() },
      { cle: "gcal_label", valeur: label || "Mon agenda Google", updated_at: new Date().toISOString() },
    ],
    { onConflict: "cle" }
  );
  revalidatePath("/animateur");
  revalidatePath("/animateur/parametres");
  return { ok: true };
}

export async function testGCal(url: string): Promise<{ ok: boolean; nbEvents?: number; error?: string }> {
  if (!url) return { ok: false, error: "URL manquante" };
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, error: `Erreur HTTP ${res.status}` };
    const text = await res.text();
    const parsed = icalSync.parseICS(text);
    const nbEvents = Object.values(parsed).filter((e) => e?.type === "VEVENT").length;
    return { ok: true, nbEvents };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
