import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getParametre, getParametreNumber, getParametreFloat } from "@/lib/parametres";
import { calculerPreparation } from "@/lib/preparation-rdv";
import { envoyerEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const [
    { data: rdvsDemain },
    animEmail, latDep, lngDep,
    vitesseKmh, coefRoute, bufferMin, margeCharge,
    veActif, autonomieKm, seuilPct,
  ] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select(
        "id, type, objet, heure_souhaitee, magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville, latitude, longitude)"
      )
      .eq("statut", "confirme")
      .eq("date_souhaitee", tomorrowStr),
    getParametre("animateur_email", ""),
    getParametre("lat_depart_habituel", ""),
    getParametre("lng_depart_habituel", ""),
    getParametreFloat("vitesse_moyenne_kmh", 70),
    getParametreFloat("coef_route_haversine", 1.3),
    getParametreNumber("buffer_arrivee_min", 30),
    getParametreNumber("marge_charge_pct", 15),
    getParametre("vehicule_electrique", "false"),
    getParametreNumber("autonomie_km", 300),
    getParametreNumber("seuil_recharge_pct", 20),
  ]);

  if (!animEmail || !rdvsDemain?.length) {
    return Response.json({ ok: true, skipped: true, reason: "no email or no rdv tomorrow" });
  }
  if (!latDep || !lngDep) {
    return Response.json({ ok: true, skipped: true, reason: "departure coords not configured" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://animateur-reseau-pa.vercel.app";
  const configCalc = {
    vitesseMoyenneKmh: vitesseKmh,
    coefRoute,
    bufferMin,
    margeChargePct: margeCharge,
    autonomieKm: veActif === "true" ? autonomieKm : undefined,
    seuilPct: veActif === "true" ? seuilPct : undefined,
  };

  type MagRow = { id: string; nom: string; enseigne: string | null; ville: string | null; latitude: number | null; longitude: number | null };
  type RdvRow = { id: string; type: string; objet: string; heure_souhaitee: string | null; magasins: MagRow | null };
  const rdvs = rdvsDemain as unknown as RdvRow[];

  const lignes = rdvs
    .filter((r) => r.magasins?.latitude && r.magasins?.longitude)
    .map((r) => {
      const mag = r.magasins!;
      const prep = calculerPreparation(
        parseFloat(latDep), parseFloat(lngDep),
        mag.latitude!, mag.longitude!,
        r.heure_souhaitee?.slice(0, 5) ?? null,
        configCalc
      );
      const nomMag = mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom;
      const duree = prep.dureeRouteMinutes < 60
        ? `${prep.dureeRouteMinutes} min`
        : `${Math.floor(prep.dureeRouteMinutes / 60)}h${prep.dureeRouteMinutes % 60 > 0 ? String(prep.dureeRouteMinutes % 60).padStart(2, "0") : ""}`;

      return `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin:10px 0">
        <p style="margin:0;font-weight:600;color:#0f172a">
          ${r.heure_souhaitee ? r.heure_souhaitee.slice(0, 5) + " · " : ""}${nomMag}
        </p>
        <p style="margin:4px 0 0;color:#475569;font-size:14px">${r.objet}</p>
        <p style="margin:8px 0 0;color:#334155;font-size:14px">
          🚗 ${prep.heureDepart ? `Partir à <strong>${prep.heureDepart}${prep.heureDepartVeille ? " (veille)" : ""}</strong> ·` : ""}
          ${Math.round(prep.distanceKm)} km · ${duree} de route
        </p>
        ${prep.chargeRecommandeePct > 0 ? `<p style="margin:4px 0 0;color:#334155;font-size:14px">🔋 Charger jusqu'à <strong>${prep.chargeRecommandeePct}%</strong>${prep.nbArretsEstime > 0 ? ` · ${prep.nbArretsEstime} arrêt borne` : ""}</p>` : ""}
        ${prep.alertes.length > 0 ? `<p style="margin:6px 0 0;color:#92400e;font-size:13px">⚠️ ${prep.alertes.join(" · ")}</p>` : ""}
        <a href="${appUrl}/animateur/rdv/${r.id}" style="display:inline-block;margin-top:8px;font-size:13px;color:#3b82f6">Voir le RDV →</a>
      </div>`;
    })
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;max-width:540px;padding:24px;color:#1e293b">
    <h2 style="margin:0 0 4px;font-size:18px">🌅 Demain tu as ${rdvs.length} RDV</h2>
    <p style="color:#64748b;margin:0 0 16px;font-size:14px">${tomorrowStr}</p>
    ${lignes}
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">Animation Réseau PA · <a href="${appUrl}" style="color:#94a3b8">${appUrl}</a></p>
  </div>`;

  const result = await envoyerEmail({
    destinataires: [animEmail],
    sujet: `🌅 Demain : ${rdvs.length} RDV — ${tomorrowStr}`,
    htmlBody: html,
  });

  console.log("[CRON J-1] email envoyé :", result);
  return Response.json({ ok: true, nb: rdvs.length, emailResult: result });
}
