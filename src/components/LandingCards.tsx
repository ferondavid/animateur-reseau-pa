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
        className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-4 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="52"
          height="52"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-500"
        >
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a3 3 0 0 0-6 0v4" />
          <path d="M2 7h20" />
          <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
        </svg>
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900 mb-1">
            Je suis Membre PA
          </div>
          <div className="text-sm text-slate-500">
            Accédez à votre fiche magasin
          </div>
        </div>
      </button>

      {/* Animateur */}
      <button
        onClick={allerAnimateur}
        className="bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-4 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="52"
          height="52"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-500"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900 mb-1">
            Je suis Animateur
          </div>
          <div className="text-sm text-slate-500">Pilotage du réseau</div>
        </div>
      </button>
    </div>
  );
}
