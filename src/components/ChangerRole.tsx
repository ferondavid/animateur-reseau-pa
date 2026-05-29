"use client";

import { useRouter } from "next/navigation";

export default function ChangerRole({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        localStorage.removeItem("pa_role");
        localStorage.removeItem("pa_magasin_id");
        router.push("/");
      }}
      className={
        className ??
        "text-sm text-slate-400 hover:text-slate-600 transition-colors"
      }
    >
      Changer de rôle
    </button>
  );
}
