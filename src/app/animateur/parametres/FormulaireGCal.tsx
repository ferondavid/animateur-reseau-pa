"use client";

import { useState, useTransition } from "react";
import { updateGCalParametres, testGCal } from "./actions";

type TestResult = { ok: boolean; nbEvents?: number; error?: string };

export default function FormulaireGCal({
  urlInitiale,
  labelInitial,
}: {
  urlInitiale: string;
  labelInitial: string;
}) {
  const [url, setUrl] = useState(urlInitiale);
  const [label, setLabel] = useState(labelInitial);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [isPendingTest, startTest] = useTransition();
  const [isPendingSave, startSave] = useTransition();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">URL iCal privée</label>
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setTestResult(null); }}
          placeholder="https://calendar.google.com/calendar/ical/.../private-xxxxx/basic.ics"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Libellé affiché</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
        />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() =>
            startTest(async () => {
              setTestResult(null);
              const r = await testGCal(url);
              setTestResult(r);
            })
          }
          disabled={isPendingTest || !url}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {isPendingTest ? "Test en cours…" : "🔌 Tester la connexion"}
        </button>
        <button
          onClick={() =>
            startSave(async () => {
              setSaveOk(false);
              await updateGCalParametres(url, label);
              setSaveOk(true);
              setTimeout(() => setSaveOk(false), 2000);
            })
          }
          disabled={isPendingSave}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          {isPendingSave ? "Enregistrement…" : "Enregistrer"}
        </button>
        {testResult && (
          testResult.ok ? (
            <span className="text-sm text-emerald-600 font-medium">
              ✓ Connexion OK — {testResult.nbEvents} événement{testResult.nbEvents !== 1 ? "s" : ""} trouvé{testResult.nbEvents !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-sm text-red-600 font-medium">✗ {testResult.error}</span>
          )
        )}
        {!testResult && saveOk && (
          <span className="text-sm text-emerald-600 font-medium">✓ Enregistré</span>
        )}
      </div>
    </div>
  );
}
