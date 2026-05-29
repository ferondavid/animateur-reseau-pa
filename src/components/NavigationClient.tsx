"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const liens = [
  { href: "/pilotage", label: "Pilotage" },
  { href: "/", label: "Carte" },
  { href: "/magasins", label: "Magasins" },
  { href: "/visites", label: "Visites" },
  { href: "/actions-reseau", label: "Actions" },
  { href: "/remontees", label: "Remontées" },
  { href: "/evaluations", label: "Évaluations" },
];

function estActif(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavigationClient({
  nbNouvellesRemontees = 0,
}: {
  nbNouvellesRemontees?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 rounded-2xl bg-slate-100 border border-slate-200/60 shadow-sm p-1.5 overflow-x-auto">
      {liens.map((l) => {
        const actif = estActif(l.href, pathname);
        const badge =
          l.href === "/remontees" && nbNouvellesRemontees > 0
            ? nbNouvellesRemontees
            : null;

        return (
          <Link
            key={l.href}
            href={l.href}
            className={`relative shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              actif
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            {l.label}
            {badge !== null && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
