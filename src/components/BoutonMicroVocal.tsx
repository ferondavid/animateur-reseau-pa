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
      {/* FAB violet fixe en bas à droite */}
      <button
        onClick={ouvrirEtEcouter}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
        aria-label="Assistant vocal"
        title="Assistant vocal — parlez pour piloter"
      >
        <MicIcon size="md" />
      </button>

      {/* Modale */}
      {ouverte && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={fermer}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${couleurEtat[etat]}`} />
                <span className="text-sm font-medium text-slate-700">
                  {etatsLabel[etat]}
                </span>
              </div>
              <button
                onClick={fermer}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Transcription */}
            {transcription && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
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
                    className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Réponse */}
            {reponse && (
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-900">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide">
                    Assistant
                  </p>
                  <button
                    type="button"
                    onClick={() => parler(reponse)}
                    title="Réécouter"
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 text-[10px] font-semibold"
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
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Arrêter
                </button>
              ) : etat === "idle" ||
                etat === "reponse" ||
                etat === "erreur" ? (
                <button
                  onClick={demarrerEcoute}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                >
                  <MicIcon size="sm" />
                  Parler
                </button>
              ) : null}
              <button
                onClick={fermer}
                className="px-4 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Essayez : &quot;Prochain RDV&quot; · &quot;Remontées urgentes&quot; · &quot;Ouvre Piscine Service Lyon&quot;
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
