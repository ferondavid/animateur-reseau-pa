import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getParametre } from "@/lib/parametres";
import { buildICalAnimateur, type RDVExport, type VisiteExport } from "@/lib/ical-export";

const FEED_CONFIG: Record<string, { calName: string; appleColor: string }> = {
  "rdv-physique": { calName: "Anim PA · RDV physiques",      appleColor: "#3B82F6" },
  "rdv-tel":      { calName: "Anim PA · RDV téléphone",      appleColor: "#10B981" },
  "rdv-visio":    { calName: "Anim PA · RDV visio",          appleColor: "#A855F7" },
  "visites":      { calName: "Anim PA · Visites planifiées",  appleColor: "#F59E0B" },
  "tout":         { calName: "Anim PA · Tout (RDV + visites)", appleColor: "#1E293B" },
};

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return new Response("Token manquant", { status: 401 });

  const exportToken = await getParametre("gcal_export_token", "");
  if (!exportToken || token !== exportToken) return new Response("Token invalide", { status: 401 });

  const feedType = request.nextUrl.searchParams.get("type") ?? "tout";
  const config = FEED_CONFIG[feedType] ?? FEED_CONFIG["tout"];

  const supabase = await createClient();

  const inclureRDV = feedType !== "visites";
  const inclureVisites = feedType === "visites" || feedType === "tout";
  const filtreTypeRDV = feedType.startsWith("rdv-") ? feedType.replace("rdv-", "") : null;

  const [{ data: rdvs }, { data: visites }] = await Promise.all([
    inclureRDV
      ? supabase
          .from("rendez_vous")
          .select("id, type, statut, date_souhaitee, heure_souhaitee, objet, message, lieu, magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville)")
          .not("statut", "in", "(annule,fait)")
          .order("date_souhaitee", { ascending: true })
          .then(r => filtreTypeRDV ? { data: (r.data ?? []).filter(e => e.type === filtreTypeRDV) } : r)
      : Promise.resolve({ data: [] }),
    inclureVisites
      ? supabase
          .from("visites")
          .select("id, date_prevue, objectif, magasins(nom, enseigne)")
          .eq("statut", "planifiee")
          .order("date_prevue", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const icalContent = buildICalAnimateur(
    (rdvs ?? []) as unknown as RDVExport[],
    (visites ?? []) as unknown as VisiteExport[],
    config.calName,
    config.appleColor,
  );

  return new Response(icalContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="animateur-${feedType}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
