"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff } from "lucide-react";
import {
  enregistrerAbonnementPush,
  supprimerAbonnementPush,
  envoyerPushTest,
} from "@/actions/push";

type Etat = "inconnu" | "non-supporte" | "refuse" | "inactif" | "actif" | "busy";

function base64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function BoutonActiverNotifs() {
  const [etat, setEtat] = useState<Etat>("inconnu");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setEtat("non-supporte");
      return;
    }
    if (Notification.permission === "denied") {
      setEtat("refuse");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEtat(sub ? "actif" : "inactif"))
      .catch(() => setEtat("inactif"));
  }, []);

  async function activer() {
    setEtat("busy");
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setEtat(perm === "denied" ? "refuse" : "inactif");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC ?? ""),
      });
      const j = sub.toJSON();
      const res = await enregistrerAbonnementPush(
        { endpoint: j.endpoint ?? "", keys: { p256dh: j.keys?.p256dh ?? "", auth: j.keys?.auth ?? "" } },
        navigator.userAgent.slice(0, 120)
      );
      if (!res.ok) {
        setMsg(res.error ?? "Erreur");
        setEtat("inactif");
        return;
      }
      setEtat("actif");
      await envoyerPushTest();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
      setEtat("inactif");
    }
  }

  async function desactiver() {
    setEtat("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supprimerAbonnementPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setEtat("inactif");
    } catch {
      setEtat("actif");
    }
  }

  if (etat === "inconnu") return null;

  if (etat === "non-supporte") {
    return (
      <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
        <BellOff size={13} /> Notifications non disponibles sur cet appareil.
      </p>
    );
  }

  if (etat === "refuse") {
    return (
      <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "#C0476E" }}>
        <BellOff size={13} /> Notifications bloquées — autorisez-les dans les réglages du navigateur.
      </p>
    );
  }

  if (etat === "actif") {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#0F8C68" }}>
          <BellRing size={15} /> Notifications activées
        </span>
        <button onClick={() => envoyerPushTest()} className="text-xs font-semibold" style={{ color: "#6B4FD8" }}>
          Tester
        </button>
        <button onClick={desactiver} className="text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>
          Désactiver
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={activer}
        disabled={etat === "busy"}
        className="inline-flex items-center gap-1.5 px-4 py-2 pa-btn-primary rounded-xl text-sm font-semibold disabled:opacity-60"
      >
        <Bell size={15} />
        {etat === "busy" ? "Activation…" : "Activer les notifications"}
      </button>
      {msg && <span className="text-xs" style={{ color: "#C0476E" }}>{msg}</span>}
    </div>
  );
}
