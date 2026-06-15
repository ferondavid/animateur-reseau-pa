"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mic, MicOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Etat = "idle" | "recording" | "uploading" | "done" | "error";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTimer(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function titreAuto(): string {
  const now = new Date();
  const date = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const heure = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `Note du ${date} à ${heure}`;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR";
  u.rate = 1.0;
  window.speechSynthesis.speak(u);
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function EnregistreurNote({ autoStart }: { autoStart?: boolean }) {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat>("idle");
  const [erreurMsg, setErreurMsg] = useState("");
  const [seconds, setSeconds] = useState(0);

  const streamRef      = useRef<MediaStream | null>(null);
  const recorderRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);
  const mimeTypeRef    = useRef("audio/webm");
  const startTimeRef   = useRef(0);

  // Chronomètre pendant l'enregistrement
  useEffect(() => {
    if (etat !== "recording") return;
    setSeconds(0);
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [etat]);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErreurMsg("Votre navigateur ne supporte pas l'enregistrement audio.");
      setEtat("error");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setErreurMsg("Votre navigateur ne supporte pas MediaRecorder.");
      setEtat("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        // Couper le micro APRÈS la capture (le faire avant tronque/vide l'audio)
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const actualType = recorderRef.current?.mimeType || mimeTypeRef.current || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualType });
        const dureeSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

        if (blob.size === 0) {
          setErreurMsg("Enregistrement vide — vérifiez l'accès au micro et réessayez.");
          setEtat("error");
          return;
        }
        uploadNote(blob, dureeSec);
      };

      startTimeRef.current = Date.now();
      recorder.start(250);
      setEtat("recording");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setErreurMsg("Accès au microphone refusé. Activez-le dans les réglages du navigateur.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setErreurMsg("Aucun microphone détecté sur cet appareil.");
      } else {
        setErreurMsg("Impossible d'accéder au microphone. Réessayez.");
      }
      setEtat("error");
    }
  }, []);

  function stopRecording() {
    setEtat("uploading");
    // Déclenche onstop → coupe le micro, construit le blob et lance l'upload
    try { recorderRef.current?.stop(); } catch { /* déjà arrêté */ }
  }

  async function uploadNote(blob: Blob, dureeSec: number) {
    setEtat("uploading");
    try {
      const baseType = (blob.type || "audio/webm").split(";")[0];
      const ext = baseType.includes("mp4") ? "m4a" : baseType.includes("ogg") ? "ogg" : "webm";

      const fd = new FormData();
      fd.append("audio", blob, `note.${ext}`);
      fd.append("titre", titreAuto());
      fd.append("duree_sec", String(dureeSec));

      const res = await fetch("/api/notes/upload", { method: "POST", body: fd });
      const json = await res.json() as { ok?: boolean; id?: string; error?: string };

      if (!res.ok || !json.ok) throw new Error(json.error ?? "Erreur upload");

      speak("Note enregistrée.");
      setEtat("done");
    } catch (err) {
      setErreurMsg(err instanceof Error ? err.message : "Erreur inconnue.");
      setEtat("error");
    }
  }

  function reset() {
    setEtat("idle");
    setErreurMsg("");
    setSeconds(0);
    chunksRef.current = [];
  }

  // Auto-démarrage si ?record=1
  useEffect(() => {
    if (!autoStart) return;
    const timer = setTimeout(() => { startRecording(); }, 350);
    return () => clearTimeout(timer);
  }, [autoStart, startRecording]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="pa-card p-6 space-y-4"
      style={{ background: "rgba(255,255,255,0.6)" }}
    >
      <p
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: "var(--pa-muted)" }}
      >
        Mode voiture — enregistrement mains-libres
      </p>

      {/* IDLE */}
      {etat === "idle" && (
        <div className="space-y-3">
          {autoStart && (
            <p className="text-sm text-center" style={{ color: "var(--pa-muted)" }}>
              Lancement de l&apos;enregistrement…
            </p>
          )}
          <button
            type="button"
            onClick={startRecording}
            className="w-full py-8 rounded-2xl flex flex-col items-center gap-3 font-bold text-white text-xl transition-transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7C6BE8, #6B4FD8)",
              boxShadow: "0 8px 28px -8px rgba(107,79,216,0.65)",
            }}
          >
            {/* Reflet glossy */}
            <span
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,.35), transparent 60%)",
              }}
            />
            <Mic size={52} strokeWidth={1.8} />
            Enregistrer une note
          </button>
          <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>
            Appuyez une fois pour démarrer, une fois pour arrêter
          </p>
        </div>
      )}

      {/* RECORDING */}
      {etat === "recording" && (
        <div className="space-y-4">
          {/* Gros chronomètre */}
          <div className="text-center">
            <span
              className="text-7xl font-mono font-black tabular-nums"
              style={{ color: "#6B4FD8", letterSpacing: "-2px" }}
            >
              {fmtTimer(seconds)}
            </span>
            <p className="text-sm mt-1 font-semibold" style={{ color: "#534AB7" }}>
              Enregistrement en cours…
            </p>
          </div>
          {/* Bouton stop */}
          <button
            type="button"
            onClick={stopRecording}
            className="pa-record-pulse w-full py-7 rounded-2xl flex flex-col items-center gap-3 font-bold text-white text-lg transition-transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #E8684A, #C0476E)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,.3), transparent 60%)",
              }}
            />
            <MicOff size={44} strokeWidth={1.8} />
            Appuyez pour arrêter
          </button>
        </div>
      )}

      {/* UPLOADING */}
      {etat === "uploading" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 size={52} className="animate-spin" style={{ color: "#6B4FD8" }} />
          <p className="text-lg font-semibold" style={{ color: "var(--pa-ink)" }}>
            Enregistrement de la note…
          </p>
        </div>
      )}

      {/* DONE */}
      {etat === "done" && (
        <div className="flex flex-col items-center gap-5 py-4">
          <CheckCircle2 size={60} style={{ color: "#0F8C68" }} />
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "#0F8C68" }}>
              Note enregistrée !
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Votre mémo audio est sauvegardé.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={reset}
              className="flex-1 py-4 rounded-2xl font-semibold text-base transition-transform active:scale-95 pa-btn-primary"
            >
              <Mic size={18} className="inline mr-2" />
              Nouvelle note
            </button>
            <Link
              href="/animateur/notes"
              onClick={() => router.refresh()}
              className="flex-1 py-4 rounded-2xl font-semibold text-base text-center transition-transform active:scale-95"
              style={{
                background: "#EDEBFB",
                color: "#6B4FD8",
              }}
            >
              Voir mes notes
            </Link>
          </div>
        </div>
      )}

      {/* ERROR */}
      {etat === "error" && (
        <div
          className="rounded-2xl p-5 space-y-4 text-center"
          style={{ background: "#FBE0E8" }}
        >
          <AlertCircle size={40} style={{ color: "#C0476E", margin: "0 auto" }} />
          <p className="text-sm font-semibold" style={{ color: "#C0476E" }}>
            {erreurMsg}
          </p>
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#C0476E", color: "#fff" }}
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  );
}
