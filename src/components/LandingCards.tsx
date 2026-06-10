"use client";

import { useRouter } from "next/navigation";

export default function LandingCards() {
  const router = useRouter();

  function allerAnimateur() {
    localStorage.setItem("pa_role", "animateur");
    router.push("/animateur");
  }

  function allerMembre() {
    router.push("/membre");
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
      {/* Membre PA */}
      <button
        onClick={allerMembre}
        className="pa-tile flex flex-col items-center gap-4 p-8 text-left transition-all"
        style={{ cursor: "pointer" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#34C9A3,#1FA98A)",
            boxShadow: "0 8px 20px -8px rgba(31,169,138,.5)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a3 3 0 0 0-6 0v4" />
            <path d="M2 7h20" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold mb-1" style={{ color: "var(--pa-ink)" }}>
            Je suis Membre PA
          </div>
          <div className="text-sm" style={{ color: "var(--pa-muted)" }}>
            Accédez à votre fiche magasin
          </div>
        </div>
      </button>

      {/* Animateur */}
      <button
        onClick={allerAnimateur}
        className="pa-tile flex flex-col items-center gap-4 p-8 text-left transition-all"
        style={{ cursor: "pointer" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg,#7C6BE8,#C98BD9)",
            boxShadow: "0 8px 20px -8px rgba(124,107,232,.5)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold mb-1" style={{ color: "var(--pa-ink)" }}>
            Je suis Animateur
          </div>
          <div className="text-sm" style={{ color: "var(--pa-muted)" }}>
            Pilotage du réseau
          </div>
        </div>
      </button>
    </div>
  );
}
