import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

let configured = false;
function config(): boolean {
  if (!process.env.VAPID_PUBLIC || !process.env.VAPID_PRIVATE) return false;
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:contact@animateur-reseau-pa.vercel.app",
      process.env.VAPID_PUBLIC,
      process.env.VAPID_PRIVATE
    );
    configured = true;
  }
  return true;
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

// Envoie un push à tous les appareils abonnés d'un rôle, et purge les abonnements morts.
export async function envoyerPush(payload: PushPayload, role = "animateur"): Promise<void> {
  if (!config()) return;
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("role", role);
  if (!subs?.length) return;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        );
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("[PUSH] envoi échoué :", code ?? e);
        }
      }
    })
  );
}
