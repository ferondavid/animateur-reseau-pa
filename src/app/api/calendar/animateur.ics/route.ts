import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getParametre } from "@/lib/parametres";
import { buildICalAnimateur, type RDVExport, type VisiteExport } from "@/lib/ical-export";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new Response("Token manquant", { status: 401 });
  }

  const exportToken = await getParametre("gcal_export_token", "");
  if (!exportToken || token !== exportToken) {
    return new Response("Token invalide", { status: 401 });
  }

  const supabase = await createClient();

  const [{ data: rdvs }, { data: visites }] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select(
        "id, type, statut, date_souhaitee, heure_souhaitee, objet, message, lieu, magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville)"
      )
      .not("statut", "in", "(annule,fait)")
      .order("date_souhaitee", { ascending: true }),
    supabase
      .from("visites")
      .select("id, date_prevue, objectif, magasins(nom, enseigne)")
      .eq("statut", "planifiee")
      .order("date_prevue", { ascending: true }),
  ]);

  const icalContent = buildICalAnimateur(
    (rdvs ?? []) as unknown as RDVExport[],
    (visites ?? []) as unknown as VisiteExport[]
  );

  return new Response(icalContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="animateur.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
