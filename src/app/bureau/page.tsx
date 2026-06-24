export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { getVisibilite, peutVoir } from "@/lib/visibilite";
import { LogOut, Eye } from "lucide-react";

type Carte = { cle: string; href: string; titre: string; sous: string; emoji: string; bg: string; color: string };

const CARTES: Carte[] = [
  { cle: "bureau_pilotage", href: "/pilotage", titre: "Pilotage", sous: "Cockpit réseau, KPIs, magasins à risque", emoji: "📊", bg: "linear-gradient(135deg,#D9EAFB,#BFDBF7)", color: "#2D6FD0" },
  { cle: "bureau_sante", href: "/animateur/sante", titre: "Santé réseau 360", sous: "Scorecard des 40 magasins", emoji: "🩺", bg: "linear-gradient(135deg,#E4DDFB,#D3C7F7)", color: "#6B4FD8" },
  { cle: "bureau_classement", href: "/animateur/classement", titre: "Classement CA", sous: "CA Leaders & BFA des associés", emoji: "🏆", bg: "linear-gradient(135deg,#FBF1D8,#F6E3B0)", color: "#B07D14" },
  { cle: "bureau_rapport", href: "/animateur/rapport", titre: "Rapport d'activité", sous: "Synthèse visites, remontées, RDV", emoji: "📄", bg: "linear-gradient(135deg,#D2F2E7,#B5E9D5)", color: "#0F8C68" },
  { cle: "bureau_notes", href: "/animateur/notes", titre: "Notes vocales", sous: "Mémos terrain de l'animateur", emoji: "🎤", bg: "linear-gradient(135deg,#F9DCE7,#F4C4D6)", color: "#C04B72" },
];

function eur(v: number): string {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default async function BureauPage() {
  const supabase = await createClient();
  const { data: ca } = await supabase
    .from("ca_bfa")
    .select("ca_global, ca_leaders")
    .eq("periode", "fin mai 2026");
  const rows = (ca ?? []) as unknown as { ca_global: number | null; ca_leaders: number | null }[];
  const totalCA = rows.reduce((s, r) => s + (Number(r.ca_global) || 0), 0);
  const totalLeaders = rows.reduce((s, r) => s + (Number(r.ca_leaders) || 0), 0);

  const vis = await getVisibilite();
  const cartes = CARTES.filter((c) => peutVoir(vis, c.cle, "bureau"));

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="pa-hero pa-reveal" style={{ animationDelay: ".04s" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: "#fff", letterSpacing: "-0.3px" }}>
                Espace Bureau
              </h1>
              <p className="text-[13px] mt-1 inline-flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                <Eye size={13} /> Consultation de l&apos;activité réseau
              </p>
            </div>
            <form action={logout}>
              <button type="submit" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                <LogOut size={13} /> Quitter
              </button>
            </form>
          </div>
        </div>

        {totalCA > 0 && (
          <div className="grid grid-cols-2 gap-3 pa-reveal" style={{ animationDelay: ".10s" }}>
            <div className="pa-card p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "var(--pa-ink)" }}>{eur(totalCA)}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>CA global réseau</p>
            </div>
            <div className="pa-card p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "#6B4FD8" }}>{eur(totalLeaders)}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>CA Leaders ({totalCA > 0 ? Math.round((totalLeaders / totalCA) * 100) : 0}%)</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cartes.map((c) => (
            <Link key={c.href} href={c.href} className="pa-tile p-5 flex items-center gap-4 transition-all" style={{ textDecoration: "none" }}>
              <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: c.bg }}>
                {c.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>{c.titre}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>{c.sous}</p>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>
          Accès en lecture seule — aucune modification possible.
        </p>
      </div>
    </main>
  );
}
