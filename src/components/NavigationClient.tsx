"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const liens = [
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
    <nav className="flex items-center gap-2 flex-wrap">
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
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              actif
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {l.label}
            {/* Badge rouge pour les remontées nouvelles */}
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
