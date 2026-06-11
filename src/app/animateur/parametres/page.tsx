export const dynamic = "force-dynamic";

import { getParametre, getParametreNumber } from "@/lib/parametres";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { ArrowLeft } from "lucide-react";
import FormulaireGCal from "./FormulaireGCal";
import ExportCalendar from "./ExportCalendar";
import SelectNbNewsFiche from "@/components/SelectNbNewsFiche";
import NotifEmail from "./NotifEmail";
import VehiculeElectrique from "./VehiculeElectrique";
import AdresseDepart from "./AdresseDepart";

export default async function ParametresPage() {
  const [gcalUrl, gcalLabel, nbNews, exportToken,
    animEmail, notifRemontee, notifRdvDemande, notifRdvConfirme,
    veActif, autonomieKm, seuilPct, ciblePct, chargeDepartPct, tempsRechargeMin,
    adresseDepart, latDepart, lngDepart,
  ] = await Promise.all([
    getParametre("gcal_ical_url", ""),
    getParametre("gcal_label", "Mon agenda Google"),
    getParametreNumber("nb_news_fiche_membre", 1),
    getParametre("gcal_export_token", ""),
    getParametre("animateur_email", ""),
    getParametre("notif_remontee_urgente", "true"),
    getParametre("notif_rdv_demande", "true"),
    getParametre("notif_rdv_confirme", "true"),
    getParametre("vehicule_electrique", "false"),
    getParametreNumber("autonomie_km", 300),
    getParametreNumber("seuil_recharge_pct", 20),
    getParametreNumber("cible_recharge_pct", 80),
    getParametreNumber("charge_depart_pct", 100),
    getParametreNumber("temps_recharge_min", 25),
    getParametre("adresse_depart_habituel", ""),
    getParametre("lat_depart_habituel", ""),
    getParametre("lng_depart_habituel", ""),
  ]);

  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>⚙️ Paramètres</h1>
          <Link href="/animateur" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--pa-muted)" }}>
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour dashboard
          </Link>
        </div>

        <Navigation />

        {/* Agenda Google Calendar */}
        <div className="pa-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>📆 Agenda Google Calendar</h2>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Synchronisation en lecture seule via URL iCal privée. Rafraîchi toutes les 5 minutes.
            </p>
          </div>

          <FormulaireGCal urlInitiale={gcalUrl} labelInitial={gcalLabel} />

          <div className="pa-card p-4 text-sm space-y-2" style={{ color: "var(--pa-muted)" }}>
            <p className="font-semibold" style={{ color: "var(--pa-ink)" }}>Comment obtenir votre URL iCal privée :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Ouvrez Google Calendar dans votre navigateur</li>
              <li>
                Sur l&apos;agenda à synchroniser, cliquez sur{" "}
                <strong>⋮ → Paramètres et partage</strong>
              </li>
              <li>
                Tout en bas, section{" "}
                <strong>&ldquo;Adresse secrète au format iCal&rdquo;</strong> → copiez l&apos;URL
              </li>
            </ol>
            <div className="mt-3 rounded-xl px-3 py-2 text-xs font-medium" style={{ background: "#FBF1D8", border: "1px solid rgba(176,125,20,.25)", color: "#B07D14" }}>
              ⚠️ Ne partagez jamais cette URL : elle donne accès en lecture à votre agenda. Vous pouvez la régénérer depuis Google Calendar si elle a fuité.
            </div>
          </div>
        </div>

        {/* Export iCal → Google Calendar */}
        <div className="pa-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>📤 Exporter les RDV vers Google Calendar</h2>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Abonnez Google Calendar à ce feed pour voir tous les RDV et visites planifiés de l&apos;app dans votre agenda.
              Mis à jour toutes les 12 à 24h (limitation Google).
            </p>
          </div>
          <ExportCalendar tokenInitial={exportToken} />
        </div>

        {/* Point de départ habituel */}
        <div className="pa-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>🏠 Point de départ habituel</h2>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Ton adresse de domicile ou bureau, utilisée pour calculer les heures de départ et la charge batterie.
            </p>
          </div>
          <AdresseDepart
            adresseInitiale={adresseDepart}
            latInitiale={latDepart}
            lngInitiale={lngDepart}
          />
        </div>

        {/* Véhicule électrique */}
        <div className="pa-card p-6 space-y-5" style={{ borderColor: "rgba(176,125,20,.25)" }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>⚡ Véhicule électrique</h2>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Active cette option pour que l&apos;app insère automatiquement des arrêts de recharge dans tes parcours de visite.
            </p>
          </div>
          <VehiculeElectrique
            actif={veActif === "true"}
            autonomieKm={autonomieKm}
            seuilPct={seuilPct}
            ciblePct={ciblePct}
            chargeDepartPct={chargeDepartPct}
            tempsRechargeMin={tempsRechargeMin}
          />
        </div>

        {/* Notifications email */}
        <div className="pa-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>📧 Notifications email</h2>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Reçois une alerte instantanée pour les événements importants.
              L&apos;adresse est modifiable sans redéploiement.
            </p>
          </div>
          <NotifEmail
            emailInitial={animEmail}
            notifsInitiales={{
              notif_remontee_urgente: notifRemontee !== "false",
              notif_rdv_demande:      notifRdvDemande !== "false",
              notif_rdv_confirme:     notifRdvConfirme !== "false",
            }}
          />
        </div>

        {/* Affichage news fiche membre */}
        <div className="pa-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>📰 Affichage news sur les fiches membre</h2>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Nombre de news affichées sur chaque fiche membre.
            </p>
          </div>
          <SelectNbNewsFiche valeurInitiale={nbNews} />
        </div>

        {/* Documentation : Niveaux de magasin */}
        <div className="pa-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>🏷️ Niveaux de magasin</h2>
            <p className="text-sm mt-1" style={{ color: "var(--pa-muted)" }}>
              Classification des magasins selon leur criticité pour l&apos;animation réseau.
              Le niveau détermine le seuil d&apos;alerte « non visité » et la priorité d&apos;affichage.
            </p>
          </div>

          <div className="space-y-3">
            {/* Stratégique */}
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(176,125,20,.2)", borderLeft: "4px solid #E8B43A", background: "#FBF7EA" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FBF1D8", color: "#B07D14" }}>
                  ⭐ Stratégique
                </span>
                <span className="text-xs" style={{ color: "var(--pa-muted)" }}>Seuil : <strong style={{ color: "var(--pa-ink)" }}>60 jours</strong></span>
              </div>
              <p className="text-sm mb-1" style={{ color: "var(--pa-ink)" }}>
                <strong className="font-semibold">Magasin clé, prioritaire pour le réseau.</strong>
              </p>
              <ul className="text-xs list-disc list-inside space-y-0.5" style={{ color: "var(--pa-muted)" }}>
                <li>Top CA / fort potentiel commercial</li>
                <li>Localisation stratégique (grand bassin, concurrence forte)</li>
                <li>Visites fréquentes (mensuelles ou bimestrielles)</li>
                <li>Bénéficie en avant-première des opérations / promos / outils</li>
                <li>Représente environ <strong>10-15 %</strong> du réseau</li>
              </ul>
            </div>

            {/* Standard */}
            <div className="rounded-xl p-4" style={{ border: "1px solid var(--pa-line)", borderLeft: "4px solid #C8C4D6", background: "#FAFAFC" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#ECEAF3", color: "#6F6982" }}>
                  ⚪ Standard
                </span>
                <span className="text-xs" style={{ color: "var(--pa-muted)" }}>Seuil : <strong style={{ color: "var(--pa-ink)" }}>90 jours</strong></span>
              </div>
              <p className="text-sm mb-1" style={{ color: "var(--pa-ink)" }}>
                <strong className="font-semibold">Magasin « normal » du réseau, à suivre régulièrement.</strong>
              </p>
              <ul className="text-xs list-disc list-inside space-y-0.5" style={{ color: "var(--pa-muted)" }}>
                <li>Performance dans la moyenne</li>
                <li>Suivi régulier sans intensité particulière</li>
                <li>Visites trimestrielles</li>
                <li>Reçoit les outils et opérations comme tout le monde</li>
                <li>Représente la majorité, environ <strong>70-80 %</strong></li>
              </ul>
            </div>

            {/* Observation */}
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(45,111,208,.2)", borderLeft: "4px solid #5BA8F5", background: "#EFF6FD" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#E4F0FB", color: "#2D6FD0" }}>
                  🔍 Observation
                </span>
                <span className="text-xs" style={{ color: "var(--pa-muted)" }}>Seuil : <strong style={{ color: "var(--pa-ink)" }}>30 jours</strong></span>
              </div>
              <p className="text-sm mb-1" style={{ color: "var(--pa-ink)" }}>
                <strong className="font-semibold">Magasin sous surveillance, vigilance accrue.</strong>
              </p>
              <ul className="text-xs list-disc list-inside space-y-0.5" style={{ color: "var(--pa-muted)" }}>
                <li>Nouvel entrant en phase d&apos;évaluation</li>
                <li>Performance en baisse ou problème identifié</li>
                <li>Doute sur la pérennité (commercial, financier, équipe)</li>
                <li>Suivi rapproché pour décider : monter en standard ou archiver</li>
                <li>Plan d&apos;action court terme avec objectifs précis</li>
                <li>Représente le reste, environ <strong>10-15 %</strong></li>
              </ul>
            </div>
          </div>

          <div className="text-xs italic pt-2 border-t" style={{ color: "var(--pa-muted)", borderColor: "var(--pa-line)" }}>
            💡 Le niveau d&apos;un magasin est défini à la création et modifiable depuis la fiche magasin (bouton Modifier).
            Il est visible sous forme de badge sur la carte du réseau (étoile dorée pour stratégique, loupe bleue pour observation).
          </div>
        </div>

        <Link href="/animateur" className="inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--pa-muted)" }}>
          <ArrowLeft size={15} strokeWidth={2.5} />
          Retour dashboard
        </Link>
      </div>
    </main>
  );
}
