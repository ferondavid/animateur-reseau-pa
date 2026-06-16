export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import BoutonAccueil from "@/components/BoutonAccueil";
import Navigation from "@/components/Navigation";
import GestionJoursBloques from "@/components/GestionJoursBloques";
import { SELECT_JOURS_BLOQUES, type JourBloque } from "@/lib/jours-bloques";
import { CalendarOff } from "lucide-react";

export default async function DisponibilitesPage() {
  const aujourdhui = new Date(Date.now() + 2 * 3600_000).toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 400 * 86400_000).toISOString().slice(0, 10);
  const supabase = await createClient();
  const { data } = await supabase
    .from("jours_bloques")
    .select(SELECT_JOURS_BLOQUES)
    .gte("date_fin", aujourdhui)
    .lte("date_debut", horizon)
    .order("date_debut", { ascending: true });
  const jours = (data ?? []) as JourBloque[];

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        <BoutonAccueil />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
            <CalendarOff size={22} style={{ color: "#6B4FD8" }} /> Disponibilités
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Bloque tes jours non-tournée (home office, congés, journée bureau) — ils seront exclus de la planification.
          </p>
        </div>

        <Navigation />

        <GestionJoursBloques initial={jours} />
      </div>
    </main>
  );
}
