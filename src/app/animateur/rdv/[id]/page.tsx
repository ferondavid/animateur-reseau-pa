import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { confirmerRDV, annulerRDV, marquerFait } from "../actions";
import { redirect } from "next/navigation";
import { getParametre, getParametreNumber, getParametreFloat } from "@/lib/parametres";
import { calculerPreparation } from "@/lib/preparation-rdv";

const TYPE_ICON: Record<string, string> = { physique: "🏪", tel: "📞", visio: "💻" };
const TYPE_LABEL: Record<string, string> = { physique: "Physique", tel: "Téléphone", visio: "Visio" };
const STATUT_BADGE: Record<string, string> = {
  demande: "bg-amber-100 text-amber-700",
  reporte: "bg-blue-100 text-blue-700",
  confirme: "bg-emerald-100 text-emerald-700",
  annule: "bg-red-100 text-red-700",
  fait: "bg-slate-100 text-slate-600",
};

function normalizeTel(tel: string): string {
  const d = tel.replace(/[\s.\-()]/g, "");
  return d.startsWith("0") ? `+33${d.slice(1)}` : d;
}

function formatTel(tel: string): string {
  const d = tel.replace(/[\s.\-()]/g, "").replace(/^\+33/, "0");
  return d.match(/.{1,2}/g)?.join(" ") ?? tel;
}

export default async function RDVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const [
    { data: rdv },
    latDep, lngDep,
    vitesseKmh, coefRoute, bufferMin, margeCharge,
    veActif, autonomieKm, seuilPct,
  ] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select(`
        *,
        magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville, region, contact_telephone, latitude, longitude),
        rendez_vous_invites(
          magasin_id,
          magasins(id, nom, enseigne, ville, contact_telephone)
        )
      `)
      .eq("id", id)
      .single(),
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

  if (!rdv) notFound();

  type MagDetail = { id: string; nom: string; enseigne: string | null; ville: string; region: string | null; contact_telephone: string | null; latitude: number | null; longitude: number | null };
  const mag = rdv.magasins as MagDetail | null;
  const invites = (rdv.rendez_vous_invites ?? []) as {
    magasin_id: string;
    magasins: { id: string; nom: string; enseigne: string | null; ville: string; contact_telephone: string | null } | null;
  }[];

  const nomMag = mag ? (mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom) : "—";
  const isActionnable = ["demande", "reporte"].includes(rdv.statut);
  const isConfirme = rdv.statut === "confirme";
  const rdvFutur = ["confirme", "demande"].includes(rdv.statut) && rdv.date_souhaitee >= today;

  // Calcul préparation veille
  const departOk = !!(latDep && lngDep);
  const magCoords = mag?.latitude && mag?.longitude;
  const prep =
    rdvFutur && departOk && magCoords
      ? calculerPreparation(
          parseFloat(latDep), parseFloat(lngDep),
          mag!.latitude!, mag!.longitude!,
          rdv.heure_souhaitee?.slice(0, 5) ?? null,
          {
            vitesseMoyenneKmh: vitesseKmh,
            coefRoute,
            bufferMin,
            margeChargePct: margeCharge,
            autonomieKm: veActif === "true" ? autonomieKm : undefined,
            seuilPct: veActif === "true" ? seuilPct : undefined,
          }
        )
      : null;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/animateur/rdv" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Retour aux RDV
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{rdv.objet}</h1>
        </div>

        {/* Statut + type */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUT_BADGE[rdv.statut] ?? "bg-slate-100 text-slate-600"}`}>
            {rdv.statut.charAt(0).toUpperCase() + rdv.statut.slice(1)}
          </span>
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {TYPE_ICON[rdv.type]} {TYPE_LABEL[rdv.type] ?? rdv.type}
          </span>
        </div>

        {/* Infos */}
        <div className="pa-card p-5 space-y-3">
          <Row label="Magasin" value={nomMag} />
          {mag?.ville && <Row label="Ville" value={`${mag.ville}${mag.region ? ` · ${mag.region}` : ""}`} />}
          <Row label="Date souhaitée" value={new Date(rdv.date_souhaitee + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
          {rdv.heure_souhaitee && <Row label="Heure" value={rdv.heure_souhaitee.slice(0, 5)} />}
          {rdv.lieu && <Row label="Lieu" value={rdv.lieu} />}
          {rdv.lien_visio && <Row label="Lien visio" value={rdv.lien_visio} />}
          {rdv.message && <Row label="Message" value={rdv.message} />}
          <Row label="Demande créée le" value={new Date(rdv.created_at).toLocaleDateString("fr-FR")} />
        </div>

        {/* Contact magasin */}
        {mag?.contact_telephone && (
          <div className="pa-card p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact — {nomMag}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700 tabular-nums">{formatTel(mag.contact_telephone)}</span>
              <a href={`tel:${normalizeTel(mag.contact_telephone)}`}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm">
                📞 Appel
              </a>
            </div>
          </div>
        )}

        {/* Invités */}
        {invites.length > 0 && (
          <div className="pa-card p-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Invités ({invites.length})
            </h2>
            <div className="space-y-3">
              {invites.map((inv) => {
                const m = inv.magasins;
                if (!m) return null;
                const nom = m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom;
                return (
                  <div key={inv.magasin_id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{nom}</p>
                      {m.ville && <p className="text-xs text-slate-400">{m.ville}</p>}
                    </div>
                    {m.contact_telephone && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-600 tabular-nums">{formatTel(m.contact_telephone)}</span>
                        <a href={`tel:${normalizeTel(m.contact_telephone)}`}
                          className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-2.5 py-1 text-xs font-semibold transition-colors">
                          📞
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Préparation veille */}
        {rdvFutur && (
          <div className="pa-card p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">🌅 Préparation veille</h2>

            {!departOk ? (
              <p className="text-sm text-slate-500">
                Configure ton{" "}
                <Link href="/animateur/parametres" className="text-blue-600 underline font-medium">
                  point de départ habituel
                </Link>{" "}
                pour voir la préparation détaillée.
              </p>
            ) : !magCoords ? (
              <p className="text-sm text-slate-400">Coordonnées du magasin non renseignées.</p>
            ) : prep ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  🛣️ <strong>{Math.round(prep.distanceKm)} km</strong> — {
                    prep.dureeRouteMinutes < 60
                      ? `${prep.dureeRouteMinutes} min`
                      : `${Math.floor(prep.dureeRouteMinutes / 60)}h${prep.dureeRouteMinutes % 60 > 0 ? String(prep.dureeRouteMinutes % 60).padStart(2, "0") : ""}`
                  } de route estimés
                </p>
                {prep.heureDepart ? (
                  <p>
                    🚗 Partir à <strong>{prep.heureDepart}</strong>
                    {prep.heureDepartVeille ? " (veille au soir)" : ""}
                    {" "}pour arriver avec {bufferMin} min de marge
                  </p>
                ) : (
                  <p className="text-slate-400">Heure RDV non précisée — calcul impossible</p>
                )}
                {prep.chargeRecommandeePct > 0 && (
                  <p>
                    🔋 Charger ce soir jusqu&apos;à <strong>{prep.chargeRecommandeePct}%</strong>
                    {prep.nbArretsEstime > 0 && (
                      <span className="text-amber-600"> · {prep.nbArretsEstime} arrêt{prep.nbArretsEstime > 1 ? "s" : ""} borne à prévoir</span>
                    )}
                  </p>
                )}
                {prep.alertes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prep.alertes.map((a, i) => (
                      <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Actions */}
        {(isActionnable || isConfirme) && (
          <div className="flex flex-wrap gap-3">
            {isActionnable && (
              <form action={async () => { "use server"; await confirmerRDV(id); redirect(`/animateur/rdv/${id}`); }}>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition-colors">
                  ✓ Confirmer
                </button>
              </form>
            )}
            {isConfirme && (
              <form action={async () => { "use server"; await marquerFait(id); redirect("/animateur/rdv"); }}>
                <button type="submit" className="pa-btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
                  ✓ Marquer comme fait
                </button>
              </form>
            )}
            {(isActionnable || isConfirme) && (
              <form action={async () => { "use server"; await annulerRDV(id); redirect("/animateur/rdv"); }}>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold shadow-sm transition-colors">
                  ✕ Annuler
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="text-xs text-slate-400 w-32 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-slate-800 flex-1">{value}</dd>
    </div>
  );
}
