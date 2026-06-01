import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { creerRDVAnimateur } from "../actions";

export default async function NouvelleRDVPage({
  searchParams,
}: {
  searchParams: Promise<{ magasin?: string }>;
}) {
  const { magasin: preselectedMagasin } = await searchParams;
  const supabase = await createClient();
  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, nom, enseigne, ville")
    .eq("statut", "actif")
    .order("nom");

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/animateur/rdv" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Retour aux RDV
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Nouvelle demande de RDV</h1>
        </div>

        <form action={creerRDVAnimateur} className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Magasin *</label>
              <select name="magasin_id" required defaultValue={preselectedMagasin ?? ""} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="" disabled>— Sélectionner —</option>
                {(magasins ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}{m.ville ? ` (${m.ville})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type *</label>
              <div className="flex gap-2">
                {[{ value: "physique", label: "🏪 Physique" }, { value: "tel", label: "📞 Téléphone" }, { value: "visio", label: "💻 Visio" }].map((t) => (
                  <label key={t.value} className="flex-1">
                    <input type="radio" name="type" value={t.value} className="sr-only peer" defaultChecked={t.value === "physique"} />
                    <span className="block text-center py-2 rounded-xl border-2 border-slate-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 text-sm font-medium cursor-pointer transition-colors">
                      {t.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Objet *</label>
              <input name="objet" required type="text" placeholder="Ex : Point trimestriel" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Date *</label>
                <input name="date_souhaitee" required type="date" min={today} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Heure</label>
                <input name="heure_souhaitee" type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Lieu</label>
              <input name="lieu" type="text" placeholder="Adresse ou 'Au magasin'" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Lien visio</label>
              <input name="lien_visio" type="url" placeholder="https://meet.google.com/..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Message</label>
              <textarea name="message" rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-y" />
            </div>

            {/* Invités — champ caché, géré manuellement */}
            <input type="hidden" name="invites" value="[]" />
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/animateur/rdv" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
              Annuler
            </Link>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold transition-colors">
              Créer le RDV
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
