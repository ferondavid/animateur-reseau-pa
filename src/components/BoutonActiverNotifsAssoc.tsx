"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";
import {
  enregistrerAbonnementPushAssoc,
  supprimerAbonnementPush,
  envoyerPushTestAssoc,
} from "@/actions/push";

type Etat = "inconnu" | "non-supporte" | "refuse" | "inactif" | "actif" | "busy";

function base64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function BoutonActiverNotifsAssoc({ magasinId }: { magasinId: string }) {
  const [etat, setEtat] = useState<Etat>("inconnu");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEtat("non-supporte");
      return;
    }
    if (Notification.permission === "denied") { setEtat("refuse"); return; }
    navigator.serviceWorker.ready
      .then((r) => r.pushManager.getSubscription())
      .then((s) => setEtat(s ? "actif" : "inactif"))
      .catch(() => setEtat("inactif"));
  }, []);

  async function activer() {
    setEtat("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setEtat(perm === "denied" ? "refuse" : "inactif"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC ?? ""),
      });
      const j = sub.toJSON();
      const res = await enregistrerAbonnementPushAssoc(
        { endpoint: j.endpoint ?? "", keys: { p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" } },
        magasinId
      );
      if (!res.ok) { setEtat("inactif"); return; }
      setEtat("actif");
      await envoyerPushTestAssoc(magasinId);
    } catch { setEtat("inactif"); }
  }

  async function desactiver() {
    setEtat("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await supprimerAbonnementPush(sub.endpoint); await sub.unsubscribe(); }
      setEtat("inactif");
    } catch { setEtat("actif"); }
  }

  if (etat === "inconnu") return null;

  const title =
    etat === "non-supporte" ? "Push non supporté sur cet appareil" :
    etat === "refuse" ? "Notifications bloquées dans le navigateur" :
    etat === "actif" ? "Notifications activées — appuyer pour désactiver" :
    "Activer les notifications push";

  const Icon = etat === "actif" ? BellRing : etat === "non-supporte" || etat === "refuse" ? BellOff : Bell;
  const color = etat === "actif" ? "#0F8C68" : etat === "refuse" || etat === "non-supporte" ? "#6F6982" : "var(--pa-muted)";
  const disabled = etat === "busy" || etat === "non-supporte" || etat === "refuse";

  return (
    <button
      title={title}
      disabled={disabled}
      onClick={etat === "actif" ? desactiver : activer}
      className="flex items-center justify-center w-9 h-9 rounded-[12px] transition-all"
      style={{
        background: etat === "actif" ? "rgba(15,140,104,0.12)" : "transparent",
        color,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon size={17} />
    </button>
  );
}
