"use client";

import { useRef, useState, useTransition } from "react";
import { archiverProgramme } from "./actions";
import { Copy, Printer, Archive, Check, X } from "lucide-react";

export type JourProgramme = {
  date: string;
  label: string;
  visites: {
    id: string;
    heure: string | null;
    enseigne: string | null;
    nom: string;
    ville: string | null;
    objectif: string | null;
  }[];
  rdvs: {
    id: string;
    heure: string | null;
    enseigne: string | null;
    nom: string;
    ville: string | null;
    objet: string | null;
  }[];
};

export type ArchiveProgramme = {
  id: string;
  semaine_debut: string;
  semaine_fin: string;
  archive_le: string;
  contenu_texte: string | null;
  note: string | null;
};

function fmtDateFr(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtHeure(h: string | null): string {
  if (!h) return "";
  return h.slice(0, 5);
}

function ligneTexte(
  heure: string | null,
  enseigne: string | null,
  nom: string,
  ville: string | null,
  detail: string | null
): string {
  const parts: string[] = [];
  if (heure) parts.push(fmtHeure(heure));
  parts.push(enseigne ? `${enseigne} ${nom}` : nom);
  if (ville) parts.push(ville);
  if (detail) parts.push(detail);
  return parts.join(" — ");
}

function buildTexte(titre: string, note: string, jours: JourProgramme[]): string {
  const lines: string[] = [titre, ""];
  if (note.trim()) {
    lines.push("Note : " + note.trim(), "");
  }
  for (const j of jours) {
    lines.push(j.label.toUpperCase());
    const items: string[] = [];
    for (const v of j.visites) {
      items.push("  · " + ligneTexte(v.heure, v.enseigne, v.nom, v.ville, v.objectif));
    }
    for (const r of j.rdvs) {
      items.push("  · RDV " + ligneTexte(r.heure, r.enseigne, r.nom, r.ville, r.objet));
    }
    if (items.length === 0) items.push("  — Disponible");
    lines.push(...items, "");
  }
  return lines.join("\n").trim();
}

export default function ProgrammeClient({
  titre,
  semaine_debut,
  semaine_fin,
  jours,
  archives,
}: {
  titre: string;
  semaine_debut: string;
  semaine_fin: string;
  jours: JourProgramme[];
  archives: ArchiveProgramme[];
}) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [modalArchive, setModalArchive] = useState<ArchiveProgramme | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const texte = buildTexte(titre, note, jours);
  const contenu_json = JSON.stringify(jours);

  function handleCopier() {
    navigator.clipboard.writeText(texte).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePDF() {
    window.print();
  }

  function handleArchiver() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    fd.set("contenu_texte", texte);
    fd.set("contenu_json", contenu_json);
    startTransition(async () => {
      const res = await archiverProgramme(fd);
      if (res.success) {
        setToast("Archivé !");
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast("Erreur : " + res.error);
        setTimeout(() => setToast(null), 4000);
      }
    });
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .pa-card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl no-print"
          style={{
            background: toast.startsWith("Erreur") ? "#FBE0E8" : "#D2F2E7",
            color:      toast.startsWith("Erreur") ? "#C0476E" : "#0F8C68",
            border:     toast.startsWith("Erreur") ? "1px solid rgba(192,71,110,0.25)" : "1px solid rgba(15,140,104,0.25)",
          }}
        >
          <Check size={15} strokeWidth={2.5} />
          {toast}
        </div>
      )}

      {/* Hidden form for server action inputs */}
      <form ref={formRef} style={{ display: "none" }} onSubmit={(e) => e.preventDefault()}>
        <input name="semaine_debut" defaultValue={semaine_debut} readOnly />
        <input name="semaine_fin"   defaultValue={semaine_fin}   readOnly />
        <input name="note"          value={note}                 onChange={() => {}} />
      </form>

      {/* Boutons d'action */}
      <div className="no-print flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={handleCopier}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: copied ? "#D2F2E7" : "rgba(255,255,255,0.8)",
            color:      copied ? "#0F8C68" : "var(--pa-ink)",
            border:     "1px solid var(--pa-line)",
            boxShadow:  "0 2px 8px -3px rgba(80,60,140,0.12)",
          }}
        >
          {copied ? <Check size={15} strokeWidth={2.5} /> : <Copy size={15} />}
          {copied ? "Copié !" : "Copier le texte"}
        </button>

        <button
          type="button"
          onClick={handlePDF}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "rgba(255,255,255,0.8)",
            color:      "var(--pa-ink)",
            border:     "1px solid var(--pa-line)",
            boxShadow:  "0 2px 8px -3px rgba(80,60,140,0.12)",
          }}
        >
          <Printer size={15} />
          Télécharger PDF
        </button>

        <button
          type="button"
          onClick={handleArchiver}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "#534AB7",
            color:      "#fff",
            opacity:    isPending ? 0.7 : 1,
            boxShadow:  "0 4px 14px -4px rgba(83,74,183,0.4)",
          }}
        >
          <Archive size={15} />
          {isPending ? "Archivage…" : "Archiver"}
        </button>
      </div>

      {/* Note */}
      <div className="pa-card p-5 space-y-3 mb-4">
        <label className="block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
          Note / message d&apos;accompagnement (facultatif)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ajouter un message pour la direction…"
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm resize-y no-print"
          style={{
            background: "rgba(255,255,255,0.7)",
            border:     "1px solid var(--pa-line)",
            color:      "var(--pa-ink)",
            outline:    "none",
          }}
        />
        {note.trim() && (
          <p className="text-sm italic print-only hidden" style={{ color: "var(--pa-muted)" }}>
            Note : {note}
          </p>
        )}
      </div>

      {/* Programme jour par jour */}
      <div className="pa-card p-5 sm:p-6 space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
          Programme détaillé
        </h2>

        {jours.map((jour) => {
          const total = jour.visites.length + jour.rdvs.length;
          return (
            <div key={jour.date}>
              <div
                className="flex items-center gap-3 mb-3 pb-2"
                style={{ borderBottom: "1px solid var(--pa-line)" }}
              >
                <span
                  className="text-sm font-bold capitalize"
                  style={{ color: "var(--pa-ink)" }}
                >
                  {jour.label}
                </span>
                {total > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "#EDEBFB", color: "#534AB7" }}
                  >
                    {total} événement{total > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {total === 0 ? (
                <p className="text-sm pl-1" style={{ color: "var(--pa-muted)" }}>— Disponible</p>
              ) : (
                <div className="space-y-2">
                  {jour.visites.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ background: "rgba(237,235,251,0.5)", border: "1px solid rgba(83,74,183,0.1)" }}
                    >
                      <span
                        className="w-12 shrink-0 text-sm font-bold"
                        style={{ color: "#534AB7" }}
                      >
                        {fmtHeure(v.heure) || "—"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>
                          {v.enseigne ? `${v.enseigne} ${v.nom}` : v.nom}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          {v.ville && (
                            <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{v.ville}</span>
                          )}
                          {v.objectif && (
                            <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{v.objectif}</span>
                          )}
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "#EDEBFB", color: "#534AB7" }}
                          >
                            Visite
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {jour.rdvs.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 rounded-xl px-4 py-3"
                      style={{ background: "rgba(210,242,231,0.5)", border: "1px solid rgba(15,140,104,0.12)" }}
                    >
                      <span
                        className="w-12 shrink-0 text-sm font-bold"
                        style={{ color: "#0F8C68" }}
                      >
                        {fmtHeure(r.heure) || "—"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>
                          {r.enseigne ? `${r.enseigne} ${r.nom}` : r.nom}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          {r.ville && (
                            <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{r.ville}</span>
                          )}
                          {r.objet && (
                            <span className="text-xs" style={{ color: "var(--pa-muted)" }}>{r.objet}</span>
                          )}
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "#D2F2E7", color: "#0F8C68" }}
                          >
                            RDV
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Archives */}
      {archives.length > 0 && (
        <div className="pa-card p-5 sm:p-6 space-y-4 no-print mt-4">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>
            Programmes archivés
          </h2>
          <div className="space-y-2">
            {archives.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.5)", border: "1px solid var(--pa-line)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>
                    Semaine du {fmtDateFr(a.semaine_debut)} au {fmtDateFr(a.semaine_fin)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                    Archivé le {new Date(a.archive_le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    {a.note ? ` · ${a.note.slice(0, 60)}${a.note.length > 60 ? "…" : ""}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalArchive(a)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "#EDEBFB", color: "#534AB7", border: "1px solid rgba(83,74,183,0.15)" }}
                >
                  Voir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal archive */}
      {modalArchive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(30,20,60,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setModalArchive(null)}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-3xl p-6 space-y-4"
            style={{ background: "#fff", boxShadow: "0 30px 80px -20px rgba(80,60,140,0.4)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--pa-muted)" }}>Archive</p>
                <h3 className="text-base font-bold mt-0.5" style={{ color: "var(--pa-ink)" }}>
                  Semaine du {fmtDateFr(modalArchive.semaine_debut)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalArchive(null)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-full"
                style={{ background: "#F4F3F9", color: "var(--pa-muted)" }}
              >
                <X size={15} />
              </button>
            </div>

            {modalArchive.note && (
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: "#F4F3F9" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--pa-muted)" }}>Note</p>
                <p className="text-sm" style={{ color: "var(--pa-ink)" }}>{modalArchive.note}</p>
              </div>
            )}

            {modalArchive.contenu_texte ? (
              <pre
                className="text-xs whitespace-pre-wrap rounded-xl p-4"
                style={{ background: "#F4F3F9", color: "var(--pa-ink)", fontFamily: "inherit", lineHeight: 1.6 }}
              >
                {modalArchive.contenu_texte}
              </pre>
            ) : (
              <p className="text-sm" style={{ color: "var(--pa-muted)" }}>Contenu non disponible.</p>
            )}

            <button
              type="button"
              onClick={() => {
                if (modalArchive.contenu_texte) {
                  navigator.clipboard.writeText(modalArchive.contenu_texte);
                }
                setModalArchive(null);
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#534AB7", color: "#fff" }}
            >
              <Copy size={14} /> Copier et fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
