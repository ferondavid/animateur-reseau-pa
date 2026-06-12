"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2, X } from "lucide-react";
import {
  archiverNote,
  desarchiverNote,
  supprimerNote,
  supprimerNotesEnLot,
} from "@/app/animateur/notes/actions";
import { titreMagasin } from "@/lib/magasin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NoteItem = {
  id: string;
  titre: string | null;
  audio_url: string;
  duree_sec: number | null;
  magasin_id: string | null;
  statut: string;
  created_at: string;
  magasins: unknown;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuree(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m > 0 ? m + "min " : ""}${s}s`;
}

function fmtDateHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function ListeNotesSelectionnable({
  notes,
}: {
  notes: NoteItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const headerCheckRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate =
        selected.size > 0 && selected.size < notes.length;
    }
  }, [selected.size, notes.length]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(
      selected.size === notes.length ? new Set() : new Set(notes.map((n) => n.id))
    );
  }

  function handleArchiver(id: string, statut: string) {
    setPendingId(id);
    startTransition(async () => {
      if (statut === "active") await archiverNote(id);
      else await desarchiverNote(id);
      router.refresh();
      setPendingId(null);
    });
  }

  function handleSupprimer(id: string) {
    if (!confirm("Supprimer cette note définitivement ?")) return;
    setPendingId(id);
    startTransition(async () => {
      await supprimerNote(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
      setPendingId(null);
    });
  }

  function handleBulkDelete() {
    const n = selected.size;
    if (!confirm(`Supprimer ${n} note${n > 1 ? "s" : ""} définitivement ? Cette action est irréversible.`)) return;
    startTransition(async () => {
      await supprimerNotesEnLot(Array.from(selected));
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Barre d'action bulk ── */}
      {selected.size > 0 && (
        <div
          className="sticky top-2 z-20 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "#FBE0E8",
            border: "1px solid rgba(192,71,110,0.22)",
            boxShadow: "0 4px 16px -6px rgba(192,71,110,0.35)",
          }}
        >
          <span className="text-sm font-semibold" style={{ color: "#C0476E" }}>
            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
            style={{ background: "#C0476E", color: "#fff", opacity: isPending ? 0.65 : 1 }}
          >
            <Trash2 size={14} strokeWidth={2.5} />
            Supprimer la sélection
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="inline-flex items-center gap-1 text-sm font-semibold ml-auto"
            style={{ color: "#C0476E" }}
          >
            <X size={14} strokeWidth={2.5} />
            Annuler
          </button>
        </div>
      )}

      {/* ── En-tête sélection tout ── */}
      {notes.length > 1 && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.45)" }}
        >
          <input
            ref={headerCheckRef}
            type="checkbox"
            checked={selected.size === notes.length && notes.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 cursor-pointer accent-violet-600 rounded"
          />
          <span className="text-xs" style={{ color: "var(--pa-muted)" }}>
            Tout sélectionner ({notes.length})
          </span>
        </div>
      )}

      {/* ── Liste des notes ── */}
      <div className="space-y-3">
        {notes.map((n) => {
          const mag = n.magasins as { nom: string; enseigne: string | null } | null;
          const isSelected = selected.has(n.id);
          const isProcessing = isPending && pendingId === n.id;

          return (
            <div
              key={n.id}
              className="pa-card p-4 space-y-3"
              style={{
                background: isSelected ? "rgba(107,79,216,0.07)" : undefined,
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              {/* Ligne haute : checkbox + titre + badges */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(n.id)}
                    className="w-4 h-4 cursor-pointer accent-violet-600 rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug" style={{ color: "var(--pa-ink)" }}>
                        {n.titre ?? "Note sans titre"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
                        {fmtDateHeure(n.created_at)}
                        {n.duree_sec ? ` · ${fmtDuree(n.duree_sec)}` : ""}
                      </p>
                      {mag && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: "#6B4FD8" }}>
                          {titreMagasin(mag.enseigne, mag.nom)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Badge statut */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={
                          n.statut === "active"
                            ? { background: "#D2F2E7", color: "#0F8C68" }
                            : { background: "#ECEAF3", color: "#6F6982" }
                        }
                      >
                        {n.statut === "active" ? "Active" : "Archivée"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lecteur audio */}
              <div className="pl-7">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--pa-line)" }}
                >
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio
                    controls
                    preload="none"
                    src={n.audio_url}
                    style={{ width: "100%", display: "block", height: "38px" }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pl-7 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleArchiver(n.id, n.statut)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: "#ECEAF3", color: "#6F6982" }}
                >
                  {n.statut === "active" ? (
                    <><Archive size={13} strokeWidth={2.5} /> Archiver</>
                  ) : (
                    <><ArchiveRestore size={13} strokeWidth={2.5} /> Désarchiver</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSupprimer(n.id)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{ background: "#FBE0E8", color: "#C0476E" }}
                >
                  <Trash2 size={13} strokeWidth={2.5} />
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
