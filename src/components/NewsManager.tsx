"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pin, Pencil, Search, Newspaper, FileText, CheckCircle2 } from "lucide-react";
import { getGradient } from "@/components/CardNews";
import type { NewsItem } from "@/components/CardNews";
import { stripMarkdown } from "@/lib/markdown";
import { togglePublication, toggleEpingle } from "@/app/animateur/news/actions";
import BoutonSupprimerNews from "@/components/BoutonSupprimerNews";

const TYPE: Record<NewsItem["type"], { label: string; bg: string; fg: string }> = {
  info:       { label: "Info",       bg: "#E4F0FB", fg: "#2D6FD0" },
  evenement:  { label: "Événement",  bg: "#EDEBFB", fg: "#6B4FD8" },
  alerte:     { label: "Alerte",     bg: "#FBE0E8", fg: "#C0476E" },
  temoignage: { label: "Témoignage", bg: "#D2F2E7", fg: "#0F8C68" },
};

type Statut = "all" | "publie" | "brouillon";
type FiltreType = "all" | NewsItem["type"];

function Pastille({ type }: { type: NewsItem["type"] }) {
  const m = TYPE[type];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

function Ligne({ n }: { n: NewsItem }) {
  return (
    <div className="pa-card p-3 flex items-center gap-3" style={{ opacity: n.publie ? 1 : 0.72 }}>
      <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden" style={{ border: "1px solid var(--pa-line)" }}>
        {n.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full ${getGradient(n.type)}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/news/${n.id}`} target="_blank"
              className="font-semibold text-sm hover:underline block truncate" style={{ color: "var(--pa-ink)" }}>
          {n.titre}
        </Link>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Pastille type={n.type} />
          <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
            {new Date(n.date_publication).toLocaleDateString("fr-FR")}
          </span>
          {!n.publie && (
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#ECEAF3", color: "#6F6982" }}>
              Brouillon
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <form action={toggleEpingle.bind(null, n.id, !n.epinglee)}>
          <button type="submit" aria-label={n.epinglee ? "Désépingler" : "Épingler"} className="inline-flex p-1"
                  style={{ color: n.epinglee ? "#6B4FD8" : "#C8C4D6" }}>
            <Pin size={17} fill={n.epinglee ? "#6B4FD8" : "none"} />
          </button>
        </form>
        <form action={togglePublication.bind(null, n.id, !n.publie)}>
          <button type="submit" title={n.publie ? "Dépublier" : "Publier"}
                  className="w-10 h-[22px] rounded-full inline-flex items-center transition-colors relative"
                  style={{ background: n.publie ? "#1FA98A" : "#D3D1C7" }}>
            <span className="w-[16px] h-[16px] rounded-full bg-white absolute transition-all"
                  style={{ left: n.publie ? 21 : 3 }} />
          </button>
        </form>
        <Link href={`/animateur/news/${n.id}/modifier`} aria-label="Modifier" className="inline-flex p-1" style={{ color: "#6B4FD8" }}>
          <Pencil size={15} />
        </Link>
        <BoutonSupprimerNews id={n.id} />
      </div>
    </div>
  );
}

export default function NewsManager({ liste }: { liste: NewsItem[] }) {
  const [q, setQ] = useState("");
  const [fType, setFType] = useState<FiltreType>("all");
  const [fStatut, setFStatut] = useState<Statut>("all");

  const stats = useMemo(() => ({
    total: liste.length,
    publiees: liste.filter((n) => n.publie).length,
    brouillons: liste.filter((n) => !n.publie).length,
    epinglees: liste.filter((n) => n.epinglee).length,
  }), [liste]);

  const filtre = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return liste.filter((n) => {
      if (fType !== "all" && n.type !== fType) return false;
      if (fStatut === "publie" && !n.publie) return false;
      if (fStatut === "brouillon" && n.publie) return false;
      if (needle) {
        const hay = (n.titre + " " + stripMarkdown(n.contenu)).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [liste, q, fType, fStatut]);

  const epinglees = filtre.filter((n) => n.epinglee);
  const autres = filtre.filter((n) => !n.epinglee);

  const CARTES = [
    { label: "Total",      valeur: stats.total,      Icon: Newspaper,    couleur: "var(--pa-ink)" },
    { label: "Publiées",   valeur: stats.publiees,   Icon: CheckCircle2, couleur: "#0F8C68" },
    { label: "Brouillons", valeur: stats.brouillons, Icon: FileText,     couleur: "#6F6982" },
    { label: "Épinglées",  valeur: stats.epinglees,  Icon: Pin,          couleur: "#6B4FD8" },
  ];

  const chipStyle = (actif: boolean): React.CSSProperties =>
    actif
      ? { background: "#EDEBFB", color: "#6B4FD8", boxShadow: "inset 0 0 0 1.5px #6B4FD8" }
      : { background: "var(--pa-card)", color: "var(--pa-muted)", boxShadow: "inset 0 0 0 1px var(--pa-line)" };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CARTES.map(({ label, valeur, Icon, couleur }) => (
          <div key={label} className="pa-card p-3.5">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--pa-muted)" }}>
              <Icon size={13} /> {label}
            </div>
            <div className="text-2xl font-bold mt-0.5" style={{ color: couleur }}>{valeur}</div>
          </div>
        ))}
      </div>

      {/* Recherche + filtres */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--pa-muted)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une actualité…"
                 className="pa-input" style={{ paddingLeft: 34 }} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([["all", "Tous"], ["info", "Info"], ["evenement", "Événement"], ["alerte", "Alerte"], ["temoignage", "Témoignage"]] as [FiltreType, string][]).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFType(v)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all" style={chipStyle(fType === v)}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {([["all", "Tout"], ["publie", "Publiées"], ["brouillon", "Brouillons"]] as [Statut, string][]).map(([v, l]) => (
            <button key={v} type="button" onClick={() => setFStatut(v)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all" style={chipStyle(fStatut === v)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      {filtre.length === 0 ? (
        <div className="pa-card p-10 text-center text-sm" style={{ color: "var(--pa-muted)" }}>
          Aucune actualité ne correspond à ces critères.
        </div>
      ) : (
        <>
          {epinglees.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#6B4FD8" }}>
                <Pin size={13} /> Épinglées en tête
              </div>
              {epinglees.map((n) => <Ligne key={n.id} n={n} />)}
            </div>
          )}
          <div className="space-y-2">
            {epinglees.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold pt-1" style={{ color: "var(--pa-muted)" }}>
                <Newspaper size={13} /> Toutes les actualités
              </div>
            )}
            {autres.map((n) => <Ligne key={n.id} n={n} />)}
          </div>
        </>
      )}
    </div>
  );
}
