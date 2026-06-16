"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { envoyerPush } from "@/lib/push";

type SubInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function enregistrerAbonnementPush(
  sub: SubInput,
  label?: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      label: label ?? null,
      role: "animateur",
    },
    { onConflict: "endpoint" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function supprimerAbonnementPush(endpoint: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: true };
}

export async function envoyerPushTest(): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (session?.role !== "animateur") return { ok: false, error: "Non autorisé" };
  await envoyerPush({
    title: "Notifications activées ✅",
    body: "Vous recevrez ici les remontées urgentes et les demandes de RDV.",
    url: "/animateur",
    tag: "test",
  });
  return { ok: true };
}
