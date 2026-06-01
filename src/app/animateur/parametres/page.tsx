export const dynamic = "force-dynamic";

import { getParametre, getParametreNumber } from "@/lib/parametres";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import FormulaireGCal from "./FormulaireGCal";
import SelectNbNewsFiche from "@/components/SelectNbNewsFiche";

export default async function ParametresPage() {
  const [gcalUrl, gcalLabel, nbNews] = await Promise.all([
    getParametre("gcal_ical_url", ""),
    getParametre("gcal_label", "Mon agenda Google"),
    getParametreNumber("nb_news_fiche_membre", 1),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">⚙️ Paramètres</h1>
          <Link href="/animateur" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Retour dashboard
          </Link>
        </div>

        <Navigation />

        {/* Agenda Google Calendar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
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

        {/* Affichage news fiche membre */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">📰 Affichage news sur les fiches membre</h2>
            <p className="text-sm text-slate-500 mt-1">
              Nombre de news affichées sur chaque fiche membre.
            </p>
          </div>
          <SelectNbNewsFiche valeurInitiale={nbNews} />
        </div>

        <Link href="/animateur" className="inline-block text-sm text-slate-400 hover:text-slate-700 transition-colors">
          ← Retour dashboard
        </Link>
      </div>
    </main>
  );
}
