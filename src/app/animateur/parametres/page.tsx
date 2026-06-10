export const dynamic = "force-dynamic";

import { getParametre, getParametreNumber } from "@/lib/parametres";
import Link from "next/link";
import Navigation from "@/components/Navigation";
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
          <h1 className="text-2xl font-semibold text-slate-900">⚙️ Paramètres</h1>
          <Link href="/animateur" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Retour dashboard
          </Link>
        </div>

        <Navigation />

        {/* Agenda Google Calendar */}
        <div className="pa-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">📆 Agenda Google Calendar</h2>
            <p className="text-sm text-slate-500 mt-1">
              Synchronisation en lecture seule via URL iCal privée. Rafraîchi toutes les 5 minutes.
            </p>
          </div>

          <FormulaireGCal urlInitiale={gcalUrl} labelInitial={gcalLabel} />

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 space-y-2">
            <p className="font-semibold text-slate-700">Comment obtenir votre URL iCal privée :</p>
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
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs font-medium text-amber-700">
              ⚠️ Ne partagez jamais cette URL : elle donne accès en lecture à votre agenda. Vous pouvez la régénérer depuis Google Calendar si elle a fuité.
            </div>
          </div>
        </div>

        {/* Export iCal → Google Calendar */}
        <div className="pa-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">📤 Exporter les RDV vers Google Calendar</h2>
            <p className="text-sm text-slate-500 mt-1">
              Abonnez Google Calendar à ce feed pour voir tous les RDV et visites planifiés de l&apos;app dans votre agenda.
              Mis à jour toutes les 12 à 24h (limitation Google).
            </p>
          </div>
          <ExportCalendar tokenInitial={exportToken} />
        </div>

        {/* Point de départ habituel */}
        <div className="pa-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">🏠 Point de départ habituel</h2>
            <p className="text-sm text-slate-500 mt-1">
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
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">⚡ Véhicule électrique</h2>
            <p className="text-sm text-slate-500 mt-1">
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
            <h2 className="text-base font-semibold text-slate-900">📧 Notifications email</h2>
            <p className="text-sm text-slate-500 mt-1">
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
            <h2 className="text-base font-semibold text-slate-900">📰 Affichage news sur les fiches membre</h2>
            <p className="text-sm text-slate-500 mt-1">
              Nombre de news affichées sur chaque fiche membre.
            </p>
          </div>
          <SelectNbNewsFiche valeurInitiale={nbNews} />
        </div>

        {/* Documentation : Niveaux de magasin */}
        <div className="pa-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">🏷️ Niveaux de magasin</h2>
            <p className="text-sm text-slate-500 mt-1">
              Classification des magasins selon leur criticité pour l&apos;animation réseau.
              Le niveau détermine le seuil d&apos;alerte « non visité » et la priorité d&apos;affichage.
            </p>
          </div>

          <div className="space-y-3">
            {/* Stratégique */}
            <div className="rounded-xl border-l-4 border-l-amber-400 border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                  ⭐ Stratégique
                </span>
                <span className="text-xs text-slate-500">Seuil : <strong className="text-slate-700">60 jours</strong></span>
              </div>
              <p className="text-sm text-slate-700 mb-1">
                <strong className="font-semibold">Magasin clé, prioritaire pour le réseau.</strong>
              </p>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                <li>Top CA / fort potentiel commercial</li>
                <li>Localisation stratégique (grand bassin, concurrence forte)</li>
                <li>Visites fréquentes (mensuelles ou bimestrielles)</li>
                <li>Bénéficie en avant-première des opérations / promos / outils</li>
                <li>Représente environ <strong>10-15 %</strong> du réseau</li>
              </ul>
            </div>

            {/* Standard */}
            <div className="rounded-xl border-l-4 border-l-slate-400 border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  ⚪ Standard
                </span>
                <span className="text-xs text-slate-500">Seuil : <strong className="text-slate-700">90 jours</strong></span>
              </div>
              <p className="text-sm text-slate-700 mb-1">
                <strong className="font-semibold">Magasin « normal » du réseau, à suivre régulièrement.</strong>
              </p>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                <li>Performance dans la moyenne</li>
                <li>Suivi régulier sans intensité particulière</li>
                <li>Visites trimestrielles</li>
                <li>Reçoit les outils et opérations comme tout le monde</li>
                <li>Représente la majorité, environ <strong>70-80 %</strong></li>
              </ul>
            </div>

            {/* Observation */}
            <div className="rounded-xl border-l-4 border-l-blue-400 border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-200 text-blue-800">
                  🔍 Observation
                </span>
                <span className="text-xs text-slate-500">Seuil : <strong className="text-slate-700">30 jours</strong></span>
              </div>
              <p className="text-sm text-slate-700 mb-1">
                <strong className="font-semibold">Magasin sous surveillance, vigilance accrue.</strong>
              </p>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                <li>Nouvel entrant en phase d&apos;évaluation</li>
                <li>Performance en baisse ou problème identifié</li>
                <li>Doute sur la pérennité (commercial, financier, équipe)</li>
                <li>Suivi rapproché pour décider : monter en standard ou archiver</li>
                <li>Plan d&apos;action court terme avec objectifs précis</li>
                <li>Représente le reste, environ <strong>10-15 %</strong></li>
              </ul>
            </div>
          </div>

          <div className="text-xs text-slate-500 italic pt-2 border-t border-slate-100">
            💡 Le niveau d&apos;un magasin est défini à la création et modifiable depuis la fiche magasin (bouton Modifier).
            Il est visible sous forme de badge sur la carte du réseau (étoile dorée pour stratégique, loupe bleue pour observation).
          </div>
        </div>

        <Link href="/animateur" className="inline-block text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← Retour dashboard
        </Link>
      </div>
    </main>
  );
}
