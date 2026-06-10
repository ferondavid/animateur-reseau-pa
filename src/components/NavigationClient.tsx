"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const liens = [
  { href: "/animateur",           label: "Accueil" },
  { href: "/animateur/carte",     label: "🗺️ Carte" },
  { href: "/pilotage",            label: "Pilotage" },
  { href: "/animateur/rdv",       label: "RDV" },
  { href: "/visites",             label: "Visites" },
  { href: "/animateur/parcours",  label: "🚗 Parcours" },
  { href: "/actions-reseau",      label: "Actions" },
  { href: "/remontees",           label: "Remontées" },
  { href: "/animateur/news",      label: "News" },
  { href: "/evaluations",         label: "Évaluations" },
  { href: "/magasins",            label: "Magasins" },
];

function estActif(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavigationClient({
  nbNouvellesRemontees = 0,
  nbRDVEnAttente = 0,
}: {
  nbNouvellesRemontees?: number;
  nbRDVEnAttente?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 shadow-sm p-1.5 overflow-x-auto scrollbar-hide whitespace-nowrap max-w-fit mx-auto">
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
            className={`relative shrink-0 px-3.5 py-1.5 rounded-xl text-sm transition-all duration-150 whitespace-nowrap ${
              actif
                ? "bg-white shadow-sm text-slate-900 font-semibold ring-1 ring-slate-200/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium"
            }`}
          >
            {l.label}
            {badge !== null && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
