"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Home, Map, BarChart3, CalendarDays, Eye, Car, Zap,
  Megaphone, Newspaper, Star, Store, Activity, Trophy, KeyRound, SlidersHorizontal,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { SessionRole } from "@/lib/auth";

type Lien = { href: string; label: string; icon: LucideIcon };

const TOUS_LIENS: Lien[] = [
  { href: "/animateur",            label: "Accueil",     icon: Home },
  { href: "/animateur/carte",      label: "Carte",       icon: Map },
  { href: "/pilotage",             label: "Pilotage",    icon: BarChart3 },
  { href: "/animateur/sante",      label: "Santé",       icon: Activity },
  { href: "/animateur/classement", label: "Classement",  icon: Trophy },
  { href: "/animateur/rdv",        label: "RDV",         icon: CalendarDays },
  { href: "/visites",              label: "Visites",     icon: Eye },
  { href: "/animateur/parcours",   label: "Parcours",    icon: Car },
  { href: "/actions-reseau",       label: "Actions",     icon: Zap },
  { href: "/remontees",            label: "Remontées",   icon: Megaphone },
  { href: "/animateur/news",       label: "News",        icon: Newspaper },
  { href: "/evaluations",          label: "Évaluations", icon: Star },
  { href: "/magasins",             label: "Magasins",    icon: Store },
  { href: "/animateur/comptes",    label: "Comptes",     icon: KeyRound },
  { href: "/animateur/visibilite", label: "Visibilité",  icon: SlidersHorizontal },
];

const BUREAU_MASQUES = new Set([
  "/animateur/comptes",
  "/animateur/visibilite",
  "/animateur/parametres",
  "/animateur/disponibilites",
]);

function getLiens(role: SessionRole, hrefsMasques: string[]): Lien[] {
  if (role !== "bureau") return TOUS_LIENS;
  return TOUS_LIENS
    .filter((l) => !BUREAU_MASQUES.has(l.href))
    .filter((l) => !hrefsMasques.includes(l.href))
    .map((l) => l.href === "/animateur" ? { ...l, href: "/bureau", label: "Bureau" } : l);
}

function estActif(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavigationClient({
  nbNouvellesRemontees = 0,
  nbRDVEnAttente = 0,
  role = "animateur",
  hrefsMasques = [],
}: {
  nbNouvellesRemontees?: number;
  nbRDVEnAttente?: number;
  role?: SessionRole;
  hrefsMasques?: string[];
}) {
  const pathname = usePathname();
  const liens = getLiens(role, hrefsMasques);
  const navRef = useRef<HTMLElement>(null);

  function scroll(dir: "left" | "right") {
    navRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  }

  return (
    <div className="flex items-center gap-2" style={{ maxWidth: "fit-content", margin: "0 auto" }}>
      <Image src="/pISCINISTES-ASSOCIES-logo.jpg" alt="PA" width={80} height={36} style={{ objectFit: "contain" }} className="shrink-0" />
      <button
        onClick={() => scroll("left")}
        className="hidden sm:flex shrink-0 items-center justify-center w-7 h-7 rounded-xl transition-all"
        style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.7)", color: "var(--pa-muted)", backdropFilter: "blur(16px)" }}
        aria-label="Défiler à gauche"
      >
        <ChevronLeft size={14} />
      </button>

      <nav
        ref={navRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide whitespace-nowrap p-1.5"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.7)",
          borderRadius: "18px",
          boxShadow: "0 4px 20px -8px rgba(80,60,140,0.2)",
          maxWidth: "min(100%, 640px)",
        }}
      >
        {liens.map((l) => {
          const actif = estActif(l.href, pathname);
          const badge =
            l.href === "/remontees" && nbNouvellesRemontees > 0
              ? nbNouvellesRemontees
              : l.href === "/animateur/rdv" && nbRDVEnAttente > 0
              ? nbRDVEnAttente
              : null;

          return (
            <Link
              key={l.href}
              href={l.href}
              className="relative shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[13px] transition-all duration-150 whitespace-nowrap font-medium"
              style={
                actif
                  ? {
                      background: "linear-gradient(135deg, rgba(124,107,232,0.13), rgba(201,139,217,0.13))",
                      color: "#534AB7",
                      fontWeight: 700,
                      border: "1px solid rgba(124,107,232,0.2)",
                      boxShadow: "0 2px 8px -2px rgba(80,60,140,0.15)",
                    }
                  : {
                      color: "var(--pa-muted)",
                    }
              }
            >
              <l.icon
                size={14}
                style={{ flexShrink: 0, opacity: actif ? 1 : 0.75 }}
              />
              {l.label}
              {badge !== null && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-white text-[10px] font-bold leading-none"
                  style={{ background: "#C0476E", boxShadow: "0 2px 6px -1px rgba(192,71,110,.5)" }}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => scroll("right")}
        className="hidden sm:flex shrink-0 items-center justify-center w-7 h-7 rounded-xl transition-all"
        style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.7)", color: "var(--pa-muted)", backdropFilter: "blur(16px)" }}
        aria-label="Défiler à droite"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
