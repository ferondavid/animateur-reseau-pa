"use client";

import { useState, useRef, useEffect } from "react";

type Etat = "idle" | "ecoute" | "traitement" | "reponse" | "erreur";

interface VocalAction {
  type: "navigate";
  url: string;
}

interface VocalResponse {
  reponse?: string;
  action?: VocalAction;
}

// Types Web Speech API — pas inclus dans lib.dom.d.ts par défaut
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike> & { length: number };
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export default function BoutonMicroVocal() {
  const [etat, setEtat] = useState<Etat>("idle");
  const [ouverte, setOuverte] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [reponse, setReponse] = useState("");
  const reconRef = useRef<SpeechRecognitionLike | null>(null);
  const voixFRRef = useRef<SpeechSynthesisVoice | null>(null);
  const deverroulleeMobileRef = useRef(false);

  // Précharge les voix disponibles (Android Chrome les charge async)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    function choisirVoixFR() {
      const voix = window.speechSynthesis.getVoices();
      // Priorité : voix Google fr-FR > toute voix fr-FR > toute voix fr-*
      const meilleure =
        voix.find(v => v.lang === "fr-FR" && /google/i.test(v.name)) ??
        voix.find(v => v.lang === "fr-FR") ??
        voix.find(v => v.lang.startsWith("fr"));
      if (meilleure) voixFRRef.current = meilleure;
    }
    choisirVoixFR();
    window.speechSynthesis.onvoiceschanged = choisirVoixFR;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /** Déverrouille l'audio sur mobile (iOS Safari notamment) avec une utterance vide */
  function deverrouillerAudioMobile() {
    if (deverroulleeMobileRef.current) return;
    if (!("speechSynthesis" in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      u.rate = 1;
      window.speechSynthesis.speak(u);
      deverroulleeMobileRef.current = true;
    } catch {
      // ignore
    }
  }

  function parler(texte: string) {
    if (!("speechSynthesis" in window)) return;
    // Ne PAS cancel() avant : iOS coupe parfois la nouvelle utterance
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = "fr-FR";
    u.rate = 1.05;
    u.volume = 1;
    if (voixFRRef.current) u.voice = voixFRRef.current;
    window.speechSynthesis.speak(u);
  }

  async function envoyerCommande(texte: string) {
    setEtat("traitement");
    try {
      const res = await fetch("/api/vocal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte }),
      });
      const data = (await res.json()) as VocalResponse;
      const rep = data.reponse ?? "Je n'ai pas compris.";
      setReponse(rep);
      setEtat("reponse");
      parler(rep);
      if (data.action?.type === "navigate" && data.action.url) {
        setTimeout(() => {
          window.location.href = data.action!.url;
        }, 2000);
      }
    } catch {
      setEtat("erreur");
      setReponse("Erreur lors du traitement. Vérifiez votre connexion.");
    }
  }

  function demarrerEcoute() {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setReponse("Reconnaissance vocale non supportée. Utilisez Chrome ou Edge.");
      setEtat("erreur");
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.lang = "fr-FR";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let texte = "";
      for (let i = 0; i < e.results.length; i++) {
        texte += e.results[i][0].transcript;
      }
      setTranscription(texte);
      if (e.results[e.results.length - 1].isFinal) {
        envoyerCommande(texte);
        reconRef.current?.stop();
      }
    };

    rec.onerror = () => {
      setEtat("erreur");
      setReponse("Erreur de reconnaissance vocale. Autorisez le microphone.");
    };

    rec.onend = () => {
      setEtat((prev) => (prev === "ecoute" ? "idle" : prev));
    };

    reconRef.current = rec;
    setEtat("ecoute");
    setTranscription("");
    setReponse("");
    rec.start();
  }

  function ouvrirEtEcouter() {
    // Déverrouille l'audio mobile dès l'interaction utilisateur
    deverrouillerAudioMobile();
    setOuverte(true);
    demarrerEcoute();
  }

  function fermer() {
    reconRef.current?.stop();
    window.speechSynthesis?.cancel();
    setOuverte(false);
    setEtat("idle");
    setTranscription("");
    setReponse("");
  }

  function arreter() {
    reconRef.current?.stop();
    setEtat("idle");
  }

  const etatsLabel: Record<Etat, string> = {
    idle: "Prêt",
    ecoute: "Écoute…",
    traitement: "Traitement…",
    reponse: "Réponse reçue",
    erreur: "Erreur",
  };

  const couleurEtat: Record<Etat, string> = {
    idle: "bg-slate-300",
    ecoute: "bg-red-500 animate-pulse",
    traitement: "bg-amber-500 animate-pulse",
    reponse: "bg-emerald-500",
    erreur: "bg-red-400",
  };

  return (
    <>
      {/* FAB — gradient violet animé */}
      <button
        onClick={ouvrirEtEcouter}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
        style={{
          background: "linear-gradient(140deg, #7C6BE8, #C98BD9)",
          boxShadow: "0 8px 25px -8px rgba(124,107,232,0.7)",
          transform: "scale(1)",
          transition: "transform .22s cubic-bezier(.2,.8,.3,1), box-shadow .22s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 16px 35px -10px rgba(124,107,232,0.85)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 25px -8px rgba(124,107,232,0.7)";
        }}
        aria-label="Assistant vocal"
        title="Assistant vocal — parlez pour piloter"
      >
        <MicIcon size="md" />
      </button>

      {/* Modale — glassmorphism */}
      {ouverte && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "rgba(36,31,51,0.45)" }}
            onClick={fermer}
          />
          <div
            className="relative w-full max-w-sm p-6 space-y-4"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(24px) saturate(160%)",
              WebkitBackdropFilter: "blur(24px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.75)",
              borderRadius: "26px",
              boxShadow: "0 24px 60px -20px rgba(80,60,140,0.45)",
            }}
          >
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${couleurEtat[etat]}`} />
                <span className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>
                  {etatsLabel[etat]}
                </span>
              </div>
              <button
                onClick={fermer}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xl leading-none transition-colors"
                style={{ color: "var(--pa-muted)" }}
              >
                ×
              </button>
            </div>

            {/* Transcription */}
            {transcription && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(124,107,232,0.07)", color: "var(--pa-ink)" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--pa-muted)" }}>
                  Vous
                </p>
                <p>{transcription}</p>
              </div>
            )}

            {/* Indicateur traitement */}
            {etat === "traitement" && (
              <div className="flex items-center justify-center gap-1.5 py-1">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "#9B7BE8", animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Réponse */}
            {reponse && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "linear-gradient(135deg, rgba(124,107,232,0.10), rgba(201,139,217,0.10))",
                  border: "1px solid rgba(124,107,232,0.2)",
                  color: "var(--pa-ink)",
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#7C6BE8" }}>
                    Assistant
                  </p>
                  <button
                    type="button"
                    onClick={() => parler(reponse)}
                    title="Réécouter"
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
                    style={{ background: "rgba(124,107,232,0.12)", color: "#7C6BE8", border: "1px solid rgba(124,107,232,0.2)" }}
                  >
                    🔊 Réécouter
                  </button>
                </div>
                <p>{reponse}</p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-3 pt-1">
              {etat === "ecoute" ? (
                <button
                  onClick={arreter}
                  className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                  style={{ background: "linear-gradient(140deg,#F79B72,#EC6B4E)", boxShadow: "0 6px 16px -6px rgba(236,107,78,.6)" }}
                >
                  Arrêter
                </button>
              ) : etat === "idle" ||
                etat === "reponse" ||
                etat === "erreur" ? (
                <button
                  onClick={demarrerEcoute}
                  className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-xl py-2.5 transition-all"
                  style={{ background: "linear-gradient(140deg,#7C6BE8,#C98BD9)", boxShadow: "0 6px 16px -6px rgba(124,107,232,.65)" }}
                >
                  <MicIcon size="sm" />
                  Parler
                </button>
              ) : null}
              <button
                onClick={fermer}
                className="px-4 text-sm rounded-xl transition-colors"
                style={{ color: "var(--pa-muted)" }}
              >
                Fermer
              </button>
            </div>

            <p className="text-[11px] text-center leading-relaxed" style={{ color: "var(--pa-muted)" }}>
              Essayez : &quot;Prochain RDV&quot; · &quot;Remontées urgentes&quot; · &quot;Ouvre [magasin]&quot;
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function MicIcon({ size }: { size: "sm" | "md" }) {
  const s = size === "sm" ? 16 : 24;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
