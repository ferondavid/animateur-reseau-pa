"use client";

import { useRouter } from "next/navigation";

export default function BoutonChangerRole() {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        localStorage.removeItem("pa_role");
        localStorage.removeItem("pa_magasin_id");
        router.push("/");
      }}
      className="bg-slate-900 hover:bg-slate-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Changer de rôle
    </button>
  );
}
