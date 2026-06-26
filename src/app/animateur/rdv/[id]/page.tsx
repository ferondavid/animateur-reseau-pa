import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { confirmerRDV, annulerRDV, marquerFait } from "../actions";
import { redirect } from "next/navigation";
import { getParametre, getParametreNumber, getParametreFloat } from "@/lib/parametres";
import { calculerPreparation } from "@/lib/preparation-rdv";
import { ArrowLeft, Store, Phone, Monitor, Check, X, Sunrise, CalendarCheck } from "lucide-react";

type Badge = { label: string; bg: string; fg: string };
const GRAY = { bg: "#ECEAF3", fg: "#6F6982" };

const TYPE_CONFIG: Record<string, { label: string; Icon: React.ComponentType<{ size?: number }> }> = {
  physique: { label: "Physique", Icon: Store },
  tel: { label: "Téléphone", Icon: Phone },
  visio: { label: "Visio", Icon: Monitor },
};

const STATUT_BADGE: Record<string, Badge> = {
  demande:  { label: "Demande",  bg: "#FBF1D8", fg: "#B07D14" },
  reporte:  { label: "Reporté",  bg: "#E4F0FB", fg: "#2D6FD0" },
  confirme: { label: "Confirmé", bg: "#D2F2E7", fg: "#0F8C68" },
  annule:   { label: "Annulé",   bg: "#FBE0E8", fg: "#C0476E" },
  fait:     { label: "Fait",     ...GRAY },
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
    { data: visiteLinked },
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
    supabase
      .from("visites")
      .select("id, statut, date_realisee, note_confiance, note_business")
      .eq("rdv_id", id)
      .maybeSingle(),
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

  const statutBadge = STATUT_BADGE[rdv.statut] ?? { label: rdv.statut, ...GRAY };
  const typeConf = TYPE_CONFIG[rdv.type] ?? { label: rdv.type, Icon: Store };

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
          <Link href="/animateur/rdv" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--pa-muted)" }}>
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour aux RDV
          </Link>
          <h1 className="mt-2 text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>{rdv.objet}</h1>
        </div>

        {/* Statut + type */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: statutBadge.bg, color: statutBadge.fg }}>
            {statutBadge.label}
          </span>
          <span className="text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: "#ECEAF3", color: "#6F6982" }}>
            <typeConf.Icon size={13} /> {typeConf.label}
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
            <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--pa-muted)" }}>Contact — {nomMag}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums" style={{ color: "var(--pa-ink)" }}>{formatTel(mag.contact_telephone)}</span>
              <a href={`tel:${normalizeTel(mag.contact_telephone)}`}
                className="inline-flex items-center gap-1.5 text-white rounded-full px-3 py-1.5 text-xs font-semibold transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg,#34C9A3,#1FA98A)", boxShadow: "0 4px 10px -4px rgba(31,169,138,.5)" }}>
                <Phone size={12} /> Appel
              </a>
            </div>
          </div>
        )}

        {/* Invités */}
        {invites.length > 0 && (
          <div className="pa-card p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--pa-muted)" }}>
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
                      <p className="text-sm font-semibold" style={{ color: "var(--pa-ink)" }}>{nom}</p>
                      {m.ville && <p className="text-xs" style={{ color: "var(--pa-muted)" }}>{m.ville}</p>}
                    </div>
                    {m.contact_telephone && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs tabular-nums" style={{ color: "var(--pa-muted)" }}>{formatTel(m.contact_telephone)}</span>
                        <a href={`tel:${normalizeTel(m.contact_telephone)}`}
                          className="inline-flex items-center gap-1 text-white rounded-full px-2.5 py-1 text-xs font-semibold transition-transform active:scale-95"
                          style={{ background: "linear-gradient(135deg,#34C9A3,#1FA98A)" }}>
                          <Phone size={12} />
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
            <h2 className="text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
              <Sunrise size={14} strokeWidth={2.5} style={{ color: "#E8943A" }} /> Préparation veille
            </h2>

            {!departOk ? (
              <p className="text-sm" style={{ color: "var(--pa-muted)" }}>
                Configure ton{" "}
                <Link href="/animateur/parametres" className="underline font-semibold" style={{ color: "#6B4FD8" }}>
                  point de départ habituel
                </Link>{" "}
                pour voir la préparation détaillée.
              </p>
            ) : !magCoords ? (
              <p className="text-sm" style={{ color: "var(--pa-muted)" }}>Coordonnées du magasin non renseignées.</p>
            ) : prep ? (
              <div className="space-y-2 text-sm" style={{ color: "var(--pa-ink)" }}>
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
                  <p style={{ color: "var(--pa-muted)" }}>Heure RDV non précisée — calcul impossible</p>
                )}
                {prep.chargeRecommandeePct > 0 && (
                  <p>
                    🔋 Charger ce soir jusqu&apos;à <strong>{prep.chargeRecommandeePct}%</strong>
                    {prep.nbArretsEstime > 0 && (
                      <span style={{ color: "#B07D14" }}> · {prep.nbArretsEstime} arrêt{prep.nbArretsEstime > 1 ? "s" : ""} borne à prévoir</span>
                    )}
                  </p>
                )}
                {prep.alertes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {prep.alertes.map((a, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FBF1D8", color: "#B07D14" }}>
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Visite liée */}
        {visiteLinked && (
          <div className="pa-card p-5 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5" style={{ color: "var(--pa-muted)" }}>
              <CalendarCheck size={14} strokeWidth={2.5} style={{ color: "#534AB7" }} /> Visite liée
            </h2>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <VisiteStatutBadge statut={visiteLinked.statut} />
              <Link
                href={`/visites/${visiteLinked.id}`}
                className="text-sm font-semibold inline-flex items-center gap-1"
                style={{ color: "#534AB7" }}
              >
                Voir la visite →
              </Link>
            </div>
            {visiteLinked.statut === "realisee" && (visiteLinked.note_confiance || visiteLinked.note_business) && (
              <div className="flex gap-4">
                {visiteLinked.note_confiance && (
                  <div>
                    <p className="text-xs" style={{ color: "var(--pa-muted)" }}>Confiance</p>
                    <p className="text-lg font-bold" style={{ color: "var(--pa-ink)" }}>{visiteLinked.note_confiance}/5</p>
                  </div>
                )}
                {visiteLinked.note_business && (
                  <div>
                    <p className="text-xs" style={{ color: "var(--pa-muted)" }}>Business</p>
                    <p className="text-lg font-bold" style={{ color: "var(--pa-ink)" }}>{visiteLinked.note_business}/5</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {(isActionnable || isConfirme) && (
          <div className="flex flex-wrap gap-3">
            {isActionnable && (
              <form action={async () => { "use server"; await confirmerRDV(id); redirect(`/animateur/rdv/${id}`); }}>
                <button type="submit" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: "linear-gradient(135deg,#34C9A3,#1FA98A)", boxShadow: "0 4px 10px -4px rgba(31,169,138,.5)" }}>
                  <Check size={15} strokeWidth={2.5} /> Confirmer
                </button>
              </form>
            )}
            {isConfirme && (
              <form action={async () => { "use server"; await marquerFait(id); redirect("/animateur/rdv"); }}>
                <button type="submit" className="inline-flex items-center gap-1.5 pa-btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
                  <Check size={15} strokeWidth={2.5} /> Marquer comme fait
                </button>
              </form>
            )}
            {(isActionnable || isConfirme) && (
              <form action={async () => { "use server"; await annulerRDV(id); redirect("/animateur/rdv"); }}>
                <button type="submit" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-transform active:scale-95"
                  style={{ background: "#ECEAF3", color: "#6F6982" }}>
                  <X size={15} strokeWidth={2.5} /> Annuler
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
      <dt className="text-xs w-32 shrink-0 pt-0.5" style={{ color: "var(--pa-muted)" }}>{label}</dt>
      <dd className="text-sm flex-1" style={{ color: "var(--pa-ink)" }}>{value}</dd>
    </div>
  );
}

const VISITE_STATUT: Record<string, { label: string; bg: string; fg: string }> = {
  planifiee: { label: "Planifiée",  bg: "#EDEBFB", fg: "#534AB7" },
  realisee:  { label: "Réalisée",  bg: "#D2F2E7", fg: "#0F8C68" },
  annulee:   { label: "Annulée",   bg: "#FBE0E8", fg: "#C0476E" },
  reportee:  { label: "Reportée",  bg: "#E4F0FB", fg: "#2D6FD0" },
};

function VisiteStatutBadge({ statut }: { statut: string }) {
  const cfg = VISITE_STATUT[statut] ?? { label: statut, bg: "#ECEAF3", fg: "#6F6982" };
  return (
    <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.fg }}>
      {cfg.label}
    </span>
  );
}
