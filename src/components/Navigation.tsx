"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const liens = [
  { href: "/", label: "Carte" },
  { href: "/magasins", label: "Magasins" },
  { href: "/visites", label: "Visites" },
  { href: "/actions-reseau", label: "Actions" },
];

function estActif(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {liens.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            estActif(l.href, pathname)
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
