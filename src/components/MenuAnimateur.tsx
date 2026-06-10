"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/login/actions";
import BoutonInstallerPWA from "./BoutonInstallerPWA";

type Item =
  | { kind: "link"; href: string; icon: string; label: string; tone?: "default" | "primary" | "emerald" | "amber" }
  | { kind: "sep" }
  | { kind: "logout" };

const ITEMS: Item[] = [
  { kind: "link", href: "/pilotage",          icon: "📊", label: "Pilotage complet",     tone: "primary" },
  { kind: "link", href: "/animateur/parcours",icon: "🚗", label: "Préparer une tournée", tone: "emerald" },
  { kind: "sep" },
  { kind: "link", href: "/animateur/news",    icon: "📰", label: "Gestion des news" },
  { kind: "link", href: "/animateur/fonctionnalites", icon: "📚", label: "Fonctionnalités app" },
  { kind: "link", href: "/animateur/parametres", icon: "⚙️", label: "Paramètres" },
  { kind: "sep" },
  { kind: "logout" },
];

export default function MenuAnimateur() {
  const [ouvert, setOuvert] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme au clic en dehors / Escape
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }
    if (ouvert) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [ouvert]);

  return (
    <div className="flex items-center gap-2" ref={containerRef}>
      <BoutonInstallerPWA />

      <div className="relative">
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span>Menu</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${ouvert ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {ouvert && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 origin-top-right">
            {ITEMS.map((item, i) => {
              if (item.kind === "sep") {
                return <div key={`sep-${i}`} className="h-px bg-slate-100" />;
              }

              if (item.kind === "logout") {
                return (
                  <form key="logout" action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span className="font-semibold">Déconnexion</span>
                    </button>
                  </form>
                );
              }

              const toneClass =
                item.tone === "primary"
                  ? "text-slate-900 font-semibold"
                  : item.tone === "emerald"
                  ? "text-emerald-700 font-semibold"
                  : item.tone === "amber"
                  ? "text-amber-700"
                  : "text-slate-700";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOuvert(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${toneClass}`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
