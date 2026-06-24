export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import BoutonAccueil from "@/components/BoutonAccueil";
import EnregistreurNote from "@/components/EnregistreurNote";
import ListeNotesSelectionnable from "@/components/ListeNotesSelectionnable";
import type { NoteItem } from "@/components/ListeNotesSelectionnable";
import { guardBureau } from "@/lib/visibilite";

export default async function NotesVocalesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; record?: string }>;
}) {
  const { statut = "active", record } = await searchParams;
  const autoStart = record === "1";
  const statutActif = statut === "archivee" ? "archivee" : "active";

  await guardBureau("bureau_notes");
  const supabase = await createClient();
  const { data: notesData } = await supabase
    .from("notes_vocales")
    .select(
      "id, titre, audio_url, duree_sec, magasin_id, statut, created_at, magasins(nom, enseigne)"
    )
    .eq("statut", statutActif)
    .order("created_at", { ascending: false });

  const notes = (notesData ?? []) as unknown as NoteItem[];

  // Compteurs pour les badges de filtre
  const [{ count: nbActive }, { count: nbArchivee }] = await Promise.all([
    supabase
      .from("notes_vocales")
      .select("*", { count: "exact", head: true })
      .eq("statut", "active"),
    supabase
      .from("notes_vocales")
      .select("*", { count: "exact", head: true })
      .eq("statut", "archivee"),
  ]);

  const SEG_WRAP: React.CSSProperties = {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.7)",
  };
  const SEG_ACTIF: React.CSSProperties = {
    background: "#fff",
    color: "#534AB7",
    boxShadow: "0 2px 8px -2px rgba(80,60,140,0.18)",
  };
  const SEG_INACTIF: React.CSSProperties = { color: "var(--pa-muted)" };

  const filtres = [
    { key: "active",   label: "Actives",   count: nbActive ?? 0 },
    { key: "archivee", label: "Archivées",  count: nbArchivee ?? 0 },
  ];

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* En-tête */}
        <div>
          <BoutonAccueil />
          <h1
            className="mt-2 text-2xl font-bold"
            style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
          >
            Notes vocales
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Mémos audio — mode voiture mains-libres
          </p>
        </div>

        <div style={{ paddingTop: "12px" }}>
          <Navigation />
        </div>

        {/* Bloc Mode voiture */}
        <EnregistreurNote autoStart={autoStart} />

        {/* Filtre Actives / Archivées */}
        <div
          className="flex items-center gap-1 p-1 rounded-[14px] self-start"
          style={SEG_WRAP}
        >
          {filtres.map((f) => {
            const actif = statutActif === f.key;
            return (
              <Link
                key={f.key}
                href={`/animateur/notes?statut=${f.key}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
                style={actif ? SEG_ACTIF : SEG_INACTIF}
              >
                {f.label}
                {f.count > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                    style={
                      actif
                        ? { background: "#EDEBFB", color: "#534AB7" }
                        : { background: "rgba(120,110,150,0.15)", color: "var(--pa-muted)" }
                    }
                  >
                    {f.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Liste */}
        {notes.length === 0 ? (
          <div
            className="pa-card p-12 text-center"
          >
            <p className="text-sm font-medium" style={{ color: "var(--pa-muted)" }}>
              {statutActif === "active"
                ? "Aucune note vocale pour l'instant."
                : "Aucune note archivée."}
            </p>
            {statutActif === "active" && (
              <p className="text-xs mt-1.5" style={{ color: "var(--pa-muted)" }}>
                Utilisez le bloc ci-dessus pour enregistrer votre premier mémo.
              </p>
            )}
          </div>
        ) : (
          <ListeNotesSelectionnable notes={notes} />
        )}

      </div>
    </main>
  );
}
