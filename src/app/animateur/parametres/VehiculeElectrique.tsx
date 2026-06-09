"use client";

import { useState, useTransition } from "react";
import { updateParametresVE } from "./actions";

export default function VehiculeElectrique({
  actif,
  autonomieKm,
  seuilPct,
  ciblePct,
  chargeDepartPct,
  tempsRechargeMin,
}: {
  actif: boolean;
  autonomieKm: number;
  seuilPct: number;
  ciblePct: number;
  chargeDepartPct: number;
  tempsRechargeMin: number;
}) {
  const [active, setActive] = useState(actif);
  const [form, setForm] = useState({
    autonomieKm: String(autonomieKm),
    seuilPct: String(seuilPct),
    ciblePct: String(ciblePct),
    chargeDepartPct: String(chargeDepartPct),
    tempsRechargeMin: String(tempsRechargeMin),
  });
  const [saveOk, setSaveOk] = useState(false);
  const [isPending, start] = useTransition();

  const set = (k: keyof typeof form, v: string) => { setForm((p) => ({ ...p, [k]: v })); setSaveOk(false); };

  const save = () => {
    start(async () => {
      const fd = new FormData();
      fd.set("vehicule_electrique", active ? "true" : "false");
      fd.set("autonomie_km", form.autonomieKm);
      fd.set("seuil_recharge_pct", form.seuilPct);
      fd.set("cible_recharge_pct", form.ciblePct);
      fd.set("charge_depart_pct", form.chargeDepartPct);
      fd.set("temps_recharge_min", form.tempsRechargeMin);
      await updateParametresVE(fd);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      {/* Toggle principal */}
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={active}
          onClick={() => { setActive(!active); setSaveOk(false); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            active ? "bg-amber-500" : "bg-slate-200"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
        <span className="text-sm font-medium text-slate-700">Véhicule électrique activé</span>
      </label>

      {active && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Autonomie totale (km)</label>
              <input type="number" min="0" value={form.autonomieKm}
                onChange={(e) => set("autonomieKm", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Charge au départ (%)</label>
              <input type="number" min="0" max="100" value={form.chargeDepartPct}
                onChange={(e) => set("chargeDepartPct", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Seuil de recharge (%)
                <span className="ml-1 text-slate-400 font-normal">— s'arrêter à</span>
              </label>
              <input type="number" min="0" max="50" value={form.seuilPct}
                onChange={(e) => set("seuilPct", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Cible de recharge (%)
                <span className="ml-1 text-slate-400 font-normal">— repartir à</span>
              </label>
              <input type="number" min="50" max="100" value={form.ciblePct}
                onChange={(e) => set("ciblePct", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Temps recharge rapide (min)</label>
              <input type="number" min="1" value={form.tempsRechargeMin}
                onChange={(e) => set("tempsRechargeMin", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            L&apos;app cherchera automatiquement une borne de recharge (via OpenChargeMap) avant que la batterie descende sous le seuil, et calculera le temps total en incluant les arrêts.
          </p>
        </>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={isPending}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saveOk && <span className="text-sm text-emerald-600 font-medium">✓ Enregistré</span>}
      </div>
    </div>
  );
}
