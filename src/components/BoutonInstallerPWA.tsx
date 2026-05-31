"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function BoutonInstallerPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);
    setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || installed) return null;

  if (prompt) {
    return (
      <button
        onClick={async () => {
          await prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === "accepted") setInstalled(true);
          setPrompt(null);
        }}
        className="bg-slate-900 hover:bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
      >
        📲 Installer l&apos;app
      </button>
    );
  }

  if (isIOS) {
    return (
      <p className="text-xs text-slate-500 text-center">
        Pour installer : <strong>Partager</strong> → <strong>Sur l&apos;écran d&apos;accueil</strong>
      </p>
    );
  }

  return null;
}
