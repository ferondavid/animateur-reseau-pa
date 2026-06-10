"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/login/actions";
import BoutonInstallerPWA from "./BoutonInstallerPWA";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3, Car, Newspaper, Zap, Settings, LogOut, ChevronDown, Menu,
} from "lucide-react";

type Item =
  | { kind: "link"; href: string; icon: LucideIcon; label: string; tone?: "default" | "primary" | "emerald" }
  | { kind: "sep" }
  | { kind: "logout" };

const ITEMS: Item[] = [
  { kind: "link", href: "/pilotage",                    icon: BarChart3,  label: "Pilotage complet",      tone: "primary" },
  { kind: "link", href: "/animateur/parcours",          icon: Car,        label: "Préparer une tournée",  tone: "emerald" },
  { kind: "sep" },
  { kind: "link", href: "/animateur/news",              icon: Newspaper,  label: "Gestion des news" },
  { kind: "link", href: "/animateur/fonctionnalites",   icon: Zap,        label: "Fonctionnalités app" },
  { kind: "link", href: "/animateur/parametres",        icon: Settings,   label: "Paramètres" },
  { kind: "sep" },
  { kind: "logout" },
];

export default function MenuAnimateur() {
  const [ouvert, setOuvert] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        {/* Trigger button — glassmorphism */}
        <button
          type="button"
          onClick={() => setOuvert((v) => !v)}
          aria-expanded={ouvert}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[14px] text-sm font-semibold transition-all"
          style={{
            background: "rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.5)",
            color: "#fff",
            boxShadow: "0 4px 14px -4px rgba(80,60,140,0.3)",
          }}
        >
          <Menu size={15} />
          <span>Menu</span>
          <ChevronDown
            size={13}
            style={{
              transition: "transform .25s",
              transform: ouvert ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {/* Dropdown — glassmorphism */}
        {ouvert && (
          <div
            className="absolute right-0 mt-2 w-64 overflow-hidden z-50 origin-top-right"
            style={{
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(20px) saturate(140%)",
              WebkitBackdropFilter: "blur(20px) saturate(140%)",
              border: "1px solid rgba(255,255,255,0.7)",
              borderRadius: "20px",
              boxShadow: "0 20px 50px -15px rgba(80,60,140,0.35)",
            }}
          >
            {ITEMS.map((item, i) => {
              if (item.kind === "sep") {
                return (
                  <div
                    key={`sep-${i}`}
                    className="mx-3 my-1"
                    style={{ height: "1px", background: "var(--pa-line)" }}
                  />
                );
              }

              if (item.kind === "logout") {
                return (
                  <form key="logout" action={logout}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left"
                      style={{ color: "#C0476E" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(192,71,110,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <LogOut size={15} />
                      <span className="font-semibold">Déconnexion</span>
                    </button>
                  </form>
                );
              }

              const toneColor =
                item.tone === "primary" ? "#534AB7"
                : item.tone === "emerald" ? "#0F8C68"
                : "var(--pa-ink)";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOuvert(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                  style={{ color: toneColor, textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,107,232,0.07)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <item.icon size={15} style={{ opacity: 0.85 }} />
                  <span className={item.tone ? "font-semibold" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
