"use client";

import { useState, useTransition } from "react";
import { regenererTokenExport } from "./actions";

const BASE_URL = "https://animateur-reseau-pa.vercel.app";

const FEEDS = [
  { type: "rdv-physique", label: "RDV physiques",      dot: "bg-blue-500",    hex: "#3B82F6" },
  { type: "rdv-tel",      label: "RDV téléphone",      dot: "bg-emerald-500", hex: "#10B981" },
  { type: "rdv-visio",    label: "RDV visio",          dot: "bg-purple-500",  hex: "#A855F7" },
  { type: "visites",      label: "Visites planifiées",  dot: "bg-amber-500",   hex: "#F59E0B" },
] as const;

function FeedRow({ feedUrl, label, dot }: { feedUrl: string; label: string; dot: string }) {
  const [copied, setCopied] = useState(false);

  function copier() {
    navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`shrink-0 w-4 h-4 rounded-full ${dot}`} />
      <span className="shrink-0 text-sm font-medium text-slate-700 w-36">{label}</span>
      <input
        readOnly
        value={feedUrl}
        onClick={(e) => (e.target as HTMLInputElement).select()}
        className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-mono text-slate-600 focus:outline-none cursor-text"
      />
      <button
        onClick={copier}
        className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
      >
        {copied ? "✓ Copié !" : "📋 Copier"}
      </button>
    </div>
  );
}

export default function ExportCalendar({ tokenInitial }: { tokenInitial: string }) {
  const [token, setToken] = useState(tokenInitial);
  const [copiedTout, setCopiedTout] = useState(false);
  const [aideVisible, setAideVisible] = useState(false);
  const [isPending, startTransition] = useTransition();

  const feedUrls = FEEDS.map(f => ({
    ...f,
    url: `${BASE_URL}/api/calendar/animateur.ics?token=${token}&type=${f.type}`,
  }));
  const urlTout = `${BASE_URL}/api/calendar/animateur.ics?token=${token}`;

  function copierTout() {
    navigator.clipboard.writeText(urlTout).then(() => {
      setCopiedTout(true);
      setTimeout(() => setCopiedTout(false), 2000);
    });
  }

  function abonnerTout() {
    for (const { url } of feedUrls) {
      const gcalUrl = `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?cid=${encodeURIComponent(url)}`;
      window.open(gcalUrl, "_blank", "noopener");
    }
  }

  function regenerer() {
    if (!confirm("⚠️ Régénérer le token ?\n\nToutes les URLs ne fonctionneront plus. Vous devrez ré-abonner les 4 calendriers dans Google Calendar."))
      return;
    startTransition(async () => {
      const r = await regenererTokenExport();
      if (r.ok && r.token) setToken(r.token);
    });
  }

  if (!token) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Token non configuré. Exécutez le SQL fourni dans Supabase Studio pour générer le token initial.
      </p>
    );
  }

  return (
    <div className="space-y-5">

      {/* 4 feeds colorés */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">
          4 calendriers séparés (pour des couleurs différentes dans Google)
        </p>
        {feedUrls.map(f => (
          <FeedRow key={f.type} feedUrl={f.url} label={f.label} dot={f.dot} />
        ))}
      </div>

      {/* Feed "tout" */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <p className="text-sm font-medium text-slate-600">
          ⚫ Ou abonner tout en un seul calendrier (sans distinction de couleur) :
        </p>
        <div className="flex items-center gap-3">
          <input
            readOnly
            value={urlTout}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-mono text-slate-600 focus:outline-none cursor-text"
          />
          <button
            onClick={copierTout}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copiedTout ? "✓ Copié !" : "📋 Copier"}
          </button>
        </div>
      </div>

      {/* Bouton "abonner d'un coup" */}
      <div>
        <button
          onClick={abonnerTout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold transition-colors"
        >
          🔗 Abonner les 4 calendriers d&apos;un coup
        </button>
        <p className="mt-1 text-xs text-slate-400">
          Ouvre 4 onglets Google Calendar. Votre navigateur peut bloquer certains popups — autorisez-les si demandé.
        </p>
      </div>

      {/* Délai de synchro */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        🕐 <strong>Délai de synchro Google Calendar : 12 à 24h</strong> pour les nouveaux événements.
        C&apos;est une limitation de Google, pas de l&apos;app. Pour un push immédiat il faudrait l&apos;API OAuth Google.
      </div>

      {/* Aide couleurs */}
      <div>
        <button
          onClick={() => setAideVisible(v => !v)}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {aideVisible ? "▲ Masquer l'aide" : "▼ Comment abonner et choisir les couleurs ?"}
        </button>
        {aideVisible && (
          <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-3">
            <div>
              <p className="font-semibold text-slate-700 mb-1.5">Pour avoir des couleurs différentes :</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Copiez chacune des 4 URLs ci-dessus</li>
                <li>Dans <strong>Google Calendar</strong> → colonne gauche → <strong>+ à droite de &ldquo;Autres agendas&rdquo;</strong></li>
                <li>Choisissez <strong>&ldquo;À partir de l&apos;URL&rdquo;</strong> → collez → <strong>Ajouter</strong></li>
                <li>Répétez 4 fois (une par URL)</li>
                <li>Une fois les 4 agendas ajoutés : cliquez sur <strong>⋮ à côté du nom du calendrier</strong> → choisissez la couleur</li>
              </ol>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              <strong>Pourquoi 4 URLs ?</strong> Google Calendar ne respecte pas les couleurs par événement dans les feeds iCal externes.
              La couleur s&apos;applique au <em>calendrier entier</em>. Avec 4 feeds séparés, chaque type peut avoir sa couleur.
            </div>
            <p className="text-xs text-slate-400">
              Pour forcer un rafraîchissement : retirez et ré-ajoutez le calendrier dans Google.
            </p>
          </div>
        )}
      </div>

      {/* Régénérer token */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={regenerer}
          disabled={isPending}
          className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50 transition-colors"
        >
          {isPending ? "Régénération…" : "🔄 Régénérer le token (toutes les URLs seront invalidées)"}
        </button>
      </div>
    </div>
  );
}
