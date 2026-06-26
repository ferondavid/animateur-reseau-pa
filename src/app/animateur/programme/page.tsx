export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import BoutonAccueil from "@/components/BoutonAccueil";
import Navigation from "@/components/Navigation";
import ProgrammeClient, { type JourProgramme, type ArchiveProgramme } from "./ProgrammeClient";
import { CalendarDays } from "lucide-react";

// ─── Helpers date ─────────────────────────────────────────────────────────────

const JOURS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS_FR  = ["janvier", "février", "mars", "avril", "mai", "juin",
                  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtCourt(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MOIS_FR[m - 1]} ${y}`;
}

function fmtJourLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${JOURS_FR[date.getDay()]} ${d} ${MOIS_FR[m - 1]}`;
}

function semaineSuivante(): { lundi: string; vendredi: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=dim
  const diffLundi = dow === 0 ? 1 : 8 - dow; // jours jusqu'au prochain lundi
  const lundi = new Date(now);
  lundi.setDate(now.getDate() + diffLundi);
  const vendredi = new Date(lundi);
  vendredi.setDate(lundi.getDate() + 4);
  return { lundi: fmtISO(lundi), vendredi: fmtISO(vendredi) };
}

function joursOuvres(lundi: string, vendredi: string): string[] {
  const days: string[] = [];
  const [y, m, d] = lundi.split("-").map(Number);
  for (let i = 0; i < 5; i++) {
    const date = new Date(y, m - 1, d + i);
    days.push(fmtISO(date));
  }
  return days;
}

// ─── Types Supabase ───────────────────────────────────────────────────────────

type VisiteRaw = {
  id: string;
  date_prevue: string | null;
  heure_prevue: string | null;
  objectif: string | null;
  magasins: { nom: string; enseigne: string | null; ville: string | null } | null;
};

type RDVRaw = {
  id: string;
  date_souhaitee: string | null;
  heure_souhaitee: string | null;
  objet: string | null;
  magasins: { nom: string; enseigne: string | null; ville: string | null } | null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgrammePage() {
  const { lundi, vendredi } = semaineSuivante();
  const supabase = await createClient();

  const [r1, r2, r3] = await Promise.all([
    // Visites planifiées S+1
    supabase
      .from("visites")
      .select("id, date_prevue, heure_prevue, objectif, magasins(nom, enseigne, ville)")
      .eq("statut", "planifiee")
      .gte("date_prevue", lundi)
      .lte("date_prevue", vendredi)
      .order("date_prevue", { ascending: true })
      .order("heure_prevue", { ascending: true, nullsFirst: true }),

    // RDV confirmés ou demandés S+1
    supabase
      .from("rendez_vous")
      .select("id, date_souhaitee, heure_souhaitee, objet, magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville)")
      .in("statut", ["confirme", "demande"])
      .gte("date_souhaitee", lundi)
      .lte("date_souhaitee", vendredi)
      .order("date_souhaitee", { ascending: true })
      .order("heure_souhaitee", { ascending: true, nullsFirst: true }),

    // 5 derniers programmes archivés
    supabase
      .from("programmes_semaine")
      .select("id, semaine_debut, semaine_fin, archive_le, contenu_texte, note")
      .order("semaine_debut", { ascending: false })
      .limit(5),
  ]);

  const visites = (r1.data ?? []) as unknown as VisiteRaw[];
  const rdvs    = (r2.data ?? []) as unknown as RDVRaw[];
  const archives = (r3.data ?? []) as ArchiveProgramme[];

  // Construire le programme jour par jour
  const jours: JourProgramme[] = joursOuvres(lundi, vendredi).map((date) => ({
    date,
    label: fmtJourLong(date),
    visites: visites
      .filter((v) => v.date_prevue === date)
      .map((v) => ({
        id:       v.id,
        heure:    v.heure_prevue,
        enseigne: v.magasins?.enseigne ?? null,
        nom:      v.magasins?.nom ?? "—",
        ville:    v.magasins?.ville ?? null,
        objectif: v.objectif,
      })),
    rdvs: rdvs
      .filter((r) => r.date_souhaitee === date)
      .map((r) => ({
        id:       r.id,
        heure:    r.heure_souhaitee,
        enseigne: r.magasins?.enseigne ?? null,
        nom:      r.magasins?.nom ?? "—",
        ville:    r.magasins?.ville ?? null,
        objet:    r.objet,
      })),
  }));

  const titre = `Programme semaine du ${fmtCourt(lundi)} au ${fmtCourt(vendredi)}`;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* En-tête */}
        <div className="no-print">
          <BoutonAccueil />
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
            >
              <CalendarDays size={22} style={{ color: "#534AB7" }} />
              Programme semaine
            </h1>
            <p className="text-sm font-semibold mt-0.5" style={{ color: "#534AB7" }}>
              du {fmtCourt(lundi)} au {fmtCourt(vendredi)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--pa-muted)" }}>
              Réseau Piscinistes Associés · à envoyer à la direction
            </p>
          </div>
        </div>

        <div className="no-print">
          <Navigation />
        </div>

        {/* Tout le reste est client (interactivité : note, copier, archiver) */}
        <ProgrammeClient
          titre={titre}
          semaine_debut={lundi}
          semaine_fin={vendredi}
          jours={jours}
          archives={archives}
        />

      </div>
    </main>
  );
}
