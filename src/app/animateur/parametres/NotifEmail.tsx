"use client";

import { useState, useTransition } from "react";
import { updateParametreEmail, toggleNotif, testerEmailNotif } from "./actions";

const NOTIFS = [
  { cle: "notif_remontee_urgente", label: "🚨 Remontée urgente d'un magasin" },
  { cle: "notif_rdv_demande",      label: "📅 Nouveau RDV demandé par un magasin" },
  { cle: "notif_rdv_confirme",     label: "✓ RDV confirmé (invitation .ics jointe)" },
];

type TestResult = { ok: boolean; error?: string; id?: string };

export default function NotifEmail({
  emailInitial,
  notifsInitiales,
}: {
  emailInitial: string;
  notifsInitiales: Record<string, boolean>;
}) {
  const [email, setEmail] = useState(emailInitial);
  const [notifs, setNotifs] = useState(notifsInitiales);
  const [saveOk, setSaveOk] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isPendingSave, startSave] = useTransition();
  const [isPendingTest, startTest] = useTransition();

  return (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Adresse email destinataire
        </label>
        <div className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSaveOk(false); }}
            placeholder="anim@piscinistes.fr"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
          <button
            onClick={() =>
              startSave(async () => {
                const fd = new FormData();
                fd.set("animateur_email", email);
                await updateParametreEmail(fd);
                setSaveOk(true);
                setTimeout(() => setSaveOk(false), 2500);
              })
            }
            disabled={isPendingSave}
            className="pa-btn-primary px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            {isPendingSave ? "Enregistrement…" : saveOk ? "✓ Enregistré" : "Enregistrer"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Cet email reçoit les alertes remontées urgentes, RDV demandés et RDV confirmés.
          Modifiable à tout moment sans redéploiement.
        </p>
      </div>

      {/* Toggles */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-3">Activer / désactiver par type</p>
        <div className="space-y-3">
          {NOTIFS.map(({ cle, label }) => (
            <label key={cle} className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm text-slate-700">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={notifs[cle]}
                onClick={() => {
                  const next = !notifs[cle];
                  setNotifs((prev) => ({ ...prev, [cle]: next }));
                  toggleNotif(cle, next).catch(() =>
                    setNotifs((prev) => ({ ...prev, [cle]: !next }))
                  );
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                  notifs[cle] ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    notifs[cle] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Test */}
      <div className="pt-4 border-t border-slate-100 flex items-center gap-4 flex-wrap">
        <button
          onClick={() =>
            startTest(async () => {
              setTestResult(null);
              const r = await testerEmailNotif();
              setTestResult(r);
            })
          }
          disabled={isPendingTest || !email.trim()}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {isPendingTest ? "Envoi en cours…" : "🧪 Envoyer un email de test"}
        </button>
        {testResult && (
          testResult.ok ? (
            <span className="text-sm text-emerald-600 font-medium">
              ✓ Email envoyé — vérifie ta boîte
            </span>
          ) : (
            <span className="text-sm text-red-600 font-medium">
              ✗ {testResult.error}
            </span>
          )
        )}
      </div>
    </div>
  );
}
