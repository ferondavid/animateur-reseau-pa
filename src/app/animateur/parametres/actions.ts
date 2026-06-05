"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sync as icalSync } from "node-ical";
import { getParametre, updateParametre } from "@/lib/parametres";
import { envoyerEmail } from "@/lib/email";

export async function regenererTokenExport(): Promise<{ ok: boolean; token?: string }> {
  const supabase = await createClient();
  const nouveauToken = crypto.randomUUID();
  await supabase.from("parametres").upsert(
    { cle: "gcal_export_token", valeur: nouveauToken, updated_at: new Date().toISOString() },
    { onConflict: "cle" }
  );
  revalidatePath("/animateur/parametres");
  return { ok: true, token: nouveauToken };
}

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

// ── Notifications email ──────────────────────────────────────────────────────

export async function updateParametreEmail(formData: FormData) {
  const email = String(formData.get("animateur_email") ?? "").trim();
  await updateParametre("animateur_email", email);
  revalidatePath("/animateur/parametres");
}

export async function toggleNotif(cle: string, valeur: boolean) {
  await updateParametre(cle, valeur ? "true" : "false");
  revalidatePath("/animateur/parametres");
}

export async function testerEmailNotif(): Promise<{ ok: boolean; error?: string; id?: string }> {
  const email = await getParametre("animateur_email", "");
  if (!email) return { ok: false, error: "Aucun email configuré dans les paramètres" };
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY manquant dans Vercel" };

  const result = await envoyerEmail({
    destinataires: [email],
    sujet: "✓ Test notification — Animation Réseau PA",
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:540px;padding:24px;color:#1e293b">
      <h2 style="margin:0 0 12px">✓ Test réussi</h2>
      <p style="color:#475569">Si vous recevez ce message, vos notifications email fonctionnent correctement.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Animation Réseau PA</p>
    </div>`,
  });

  if (result.ok) return { ok: true, id: result.id };
  const errMsg = result.error instanceof Error ? result.error.message : String(result.error ?? "Erreur inconnue");
  return { ok: false, error: errMsg };
}
