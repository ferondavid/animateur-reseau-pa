"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { enregistrerNews } from "@/app/animateur/news/actions";
import Link from "next/link";
import MarkdownContenu from "@/components/MarkdownContenu";
import type { NewsItem } from "@/components/CardNews";
import {
  Megaphone, CalendarDays, AlertTriangle, MessageSquareQuote,
  Bold, Italic, Heading, List, Quote, Link2,
  ImagePlus, Pin, Trash2, X, Eye,
} from "lucide-react";

type TypeNews = NewsItem["type"];

const TYPES: { value: TypeNews; label: string; Icon: typeof Megaphone; bg: string; fg: string }[] = [
  { value: "info",       label: "Info",       Icon: Megaphone,           bg: "#E4F0FB", fg: "#2D6FD0" },
  { value: "evenement",  label: "Événement",  Icon: CalendarDays,        bg: "#EDEBFB", fg: "#6B4FD8" },
  { value: "alerte",     label: "Alerte",     Icon: AlertTriangle,       bg: "#FBE0E8", fg: "#C0476E" },
  { value: "temoignage", label: "Témoignage", Icon: MessageSquareQuote,  bg: "#D2F2E7", fg: "#0F8C68" },
];

type Props = {
  mode: "creer" | "modifier";
  newsInitiale?: {
    id: string;
    titre: string;
    contenu: string;
    type: string;
    image_url: string | null;
    epinglee: boolean;
    publie: boolean;
    auteur: string | null;
  };
};

const now = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function FormulaireNews({ mode, newsInitiale }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [type, setType] = useState<TypeNews>((newsInitiale?.type as TypeNews) ?? "info");
  const [titre, setTitre] = useState(newsInitiale?.titre ?? "");
  const [contenu, setContenu] = useState(newsInitiale?.contenu ?? "");
  const [auteur, setAuteur] = useState(newsInitiale?.auteur ?? "Animateur");
  const [fichier, setFichier] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageActuelle, setImageActuelle] = useState<string | null>(newsInitiale?.image_url ?? null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const typeCfg = TYPES.find((t) => t.value === type)!;
  const apercu = previewUrl ?? imageActuelle;

  function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFichier(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  // ── Barre d'outils Markdown ────────────────────────────────────────────────
  function surround(before: string, after = before, placeholder = "") {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = contenu.slice(s, e) || placeholder;
    setContenu(contenu.slice(0, s) + before + sel + after + contenu.slice(e));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }
  function prefixLigne(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = contenu.lastIndexOf("\n", s - 1) + 1;
    setContenu(contenu.slice(0, lineStart) + prefix + contenu.slice(lineStart));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length);
    });
  }
  function insertLien() {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = contenu.slice(s, e) || "texte du lien";
    const md = `[${sel}](https://)`;
    setContenu(contenu.slice(0, s) + md + contenu.slice(e));
    requestAnimationFrame(() => ta.focus());
  }

  const OUTILS: { Icon: typeof Bold; label: string; action: () => void }[] = [
    { Icon: Bold,    label: "Gras",       action: () => surround("**", "**", "texte en gras") },
    { Icon: Italic,  label: "Italique",   action: () => surround("*", "*", "texte en italique") },
    { Icon: Heading, label: "Titre",      action: () => prefixLigne("## ") },
    { Icon: List,    label: "Liste",      action: () => prefixLigne("- ") },
    { Icon: Quote,   label: "Citation",   action: () => prefixLigne("> ") },
    { Icon: Link2,   label: "Lien",       action: insertLien },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setBusy(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("type", type);
      fd.set("mode", mode);
      if (mode === "modifier" && newsInitiale) fd.set("news_id", newsInitiale.id);
      if (imageActuelle && !fichier) fd.set("image_actuelle", imageActuelle);
      if (fichier) fd.set("image", fichier);

      const result = await enregistrerNews(fd);
      if (!result.ok) throw new Error(result.error);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      if (!msg.includes("NEXT_REDIRECT")) setErreur(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erreur && (
        <div className="rounded-xl p-3 text-xs font-mono break-all"
             style={{ background: "#FBE0E8", color: "#C0476E", border: "1px solid rgba(192,71,110,.2)" }}>
          {erreur}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* ── Colonne édition ───────────────────────────────────────────── */}
        <div className="pa-card p-5 space-y-5">
          {/* Titre */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="pa-label">Titre *</label>
              <span className="text-xs" style={{ color: titre.length > 110 ? "#C0476E" : "var(--pa-muted)" }}>
                {titre.length}/120
              </span>
            </div>
            <input
              name="titre" required maxLength={120} value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre de l'actualité" className="pa-input"
            />
          </div>

          {/* Type */}
          <div>
            <label className="pa-label">Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
              {TYPES.map(({ value, label, Icon, bg, fg }) => {
                const actif = type === value;
                return (
                  <button
                    key={value} type="button" onClick={() => setType(value)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={
                      actif
                        ? { background: bg, color: fg, boxShadow: `inset 0 0 0 1.5px ${fg}` }
                        : { background: "var(--pa-card)", color: "var(--pa-muted)", boxShadow: "inset 0 0 0 1px var(--pa-line)" }
                    }
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auteur */}
          <div>
            <label className="pa-label">Auteur</label>
            <input name="auteur" value={auteur} onChange={(e) => setAuteur(e.target.value)}
                   placeholder="Animateur" className="pa-input" />
          </div>

          {/* Image */}
          <div>
            <label className="pa-label">Image</label>
            {apercu ? (
              <div className="mt-1.5 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={apercu} alt="Aperçu" className="h-32 w-full object-cover rounded-xl"
                     style={{ border: "1px solid var(--pa-line)" }} />
                <div className="flex gap-3 mt-1.5">
                  {imageActuelle && !fichier && (
                    <button type="button" onClick={() => setImageActuelle(null)}
                            className="text-xs inline-flex items-center gap-1" style={{ color: "#C0476E" }}>
                      <Trash2 size={12} /> Supprimer l&apos;image
                    </button>
                  )}
                  {fichier && (
                    <button type="button" onClick={() => { setFichier(null); setPreviewUrl(null); }}
                            className="text-xs inline-flex items-center gap-1" style={{ color: "var(--pa-muted)" }}>
                      <X size={12} /> Annuler la sélection
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <label className="mt-1.5 mb-2 flex flex-col items-center justify-center gap-1 h-24 rounded-xl cursor-pointer transition-colors"
                     style={{ border: "1.5px dashed var(--pa-line)", color: "var(--pa-muted)" }}>
                <ImagePlus size={18} />
                <span className="text-xs">Ajouter une image (optionnel)</span>
                <input type="file" accept="image/*" onChange={handleFichier} className="hidden" />
              </label>
            )}
            {apercu && (
              <input type="file" accept="image/*" onChange={handleFichier}
                     className="text-xs w-full" style={{ color: "var(--pa-muted)" }} />
            )}
            <p className="text-xs mt-1" style={{ color: "var(--pa-muted)" }}>
              Sans image, un dégradé selon le type s&apos;affichera.
            </p>
          </div>

          {/* Contenu + barre d'outils Markdown */}
          <div>
            <label className="pa-label">Contenu *</label>
            <div className="flex items-center gap-1 mt-1.5 mb-1.5 flex-wrap">
              {OUTILS.map(({ Icon, label, action }) => (
                <button key={label} type="button" onClick={action} title={label} aria-label={label}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: "var(--pa-muted)", border: "1px solid var(--pa-line)" }}>
                  <Icon size={15} />
                </button>
              ))}
              <span className="text-xs ml-1" style={{ color: "var(--pa-muted)" }}>Mise en forme Markdown</span>
            </div>
            <textarea
              ref={taRef} name="contenu" required rows={12} value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Écrivez votre actualité. **gras**, *italique*, ## titre, - liste, > citation…"
              className="pa-input resize-y" style={{ minHeight: 260, fontFamily: "inherit" }}
            />
          </div>

          {/* Date + options */}
          <div>
            <label className="pa-label">Date de publication</label>
            <input type="datetime-local" name="date_publication" defaultValue={now()} className="pa-input" />
          </div>

          <div className="flex items-center gap-6 pt-1 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--pa-ink)" }}>
              <input type="checkbox" name="publie" defaultChecked={newsInitiale ? newsInitiale.publie : true}
                     className="w-4 h-4" style={{ accentColor: "#6B4FD8" }} />
              Publier immédiatement
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--pa-ink)" }}>
              <input type="checkbox" name="epinglee" defaultChecked={newsInitiale?.epinglee ?? false}
                     className="w-4 h-4" style={{ accentColor: "#6B4FD8" }} />
              <span className="inline-flex items-center gap-1"><Pin size={13} /> Épingler en tête</span>
            </label>
          </div>
        </div>

        {/* ── Colonne aperçu live ───────────────────────────────────────── */}
        <div className="pa-card p-5 lg:sticky lg:top-6">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold" style={{ color: "var(--pa-muted)" }}>
            <Eye size={13} /> Aperçu
          </div>
          <div className="rounded-xl overflow-hidden h-40 mb-4" style={{ border: "1px solid var(--pa-line)" }}>
            {apercu ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apercu} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${typeCfg.bg}, ${typeCfg.fg}33)` }} />
            )}
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                style={{ background: typeCfg.bg, color: typeCfg.fg }}>
            <typeCfg.Icon size={12} /> {typeCfg.label}
          </span>
          <h2 className="text-xl font-bold mt-3 mb-1" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
            {titre || "Titre de l'actualité"}
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--pa-muted)" }}>
            {auteur || "Animateur"} · aujourd&apos;hui
          </p>
          {contenu.trim() ? (
            <MarkdownContenu source={contenu} />
          ) : (
            <p className="text-sm italic" style={{ color: "var(--pa-muted)" }}>
              Le contenu mis en forme apparaîtra ici en direct.
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Link href="/animateur/news" className="pa-btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">
          Annuler
        </Link>
        <button type="submit" disabled={busy} className="pa-btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60">
          {busy ? "Envoi…" : mode === "creer" ? "Publier" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
