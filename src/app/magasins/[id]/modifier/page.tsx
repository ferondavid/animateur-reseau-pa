import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateMagasin } from "../actions";

export default async function ModifierMagasinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: m } = await supabase
    .from("magasins")
    .select("*")
    .eq("id", id)
    .single();

  if (!m) notFound();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/magasins/${id}`}
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            ← Retour à la fiche
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Modifier — {m.nom}
          </h1>
        </div>

        <form action={updateMagasin} className="space-y-6">
          <input type="hidden" name="id" value={id} />

          {/* Identité */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Identité
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Nom" name="nom" defaultValue={m.nom ?? ""} required />
              <Champ label="Enseigne" name="enseigne" defaultValue={m.enseigne ?? ""} />
            </div>
            <Champ label="Adresse" name="adresse" defaultValue={m.adresse ?? ""} />
            <div className="grid grid-cols-3 gap-4">
              <Champ label="Code postal" name="code_postal" defaultValue={m.code_postal ?? ""} />
              <div className="col-span-2">
                <Champ label="Ville" name="ville" defaultValue={m.ville ?? ""} />
              </div>
            </div>
            <Champ label="Région" name="region" defaultValue={m.region ?? ""} />
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Contact
            </h2>
            <Champ label="Nom du contact" name="contact_nom" defaultValue={m.contact_nom ?? ""} />
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Téléphone" name="contact_telephone" defaultValue={m.contact_telephone ?? ""} />
              <Champ label="Email" name="contact_email" type="email" defaultValue={m.contact_email ?? ""} />
            </div>
          </div>

          {/* Statut & Niveau */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Classement
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Statut
                </label>
                <select
                  name="statut"
                  defaultValue={m.statut ?? "actif"}
                  className="pa-input"
                >
                  <option value="actif">Actif</option>
                  <option value="pause">En pause</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Niveau
                </label>
                <select
                  name="niveau"
                  defaultValue={m.niveau ?? "standard"}
                  className="pa-input"
                >
                  <option value="strategique">Stratégique</option>
                  <option value="standard">Standard</option>
                  <option value="observation">Observation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              Notes
            </h2>
            <textarea
              name="notes"
              defaultValue={m.notes ?? ""}
              rows={5}
              placeholder="Observations, remarques…"
              className="pa-input resize-y"
            />
          </div>

          {/* Infos animateur (confidentielles) */}
          <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide inline-flex items-center gap-2">
                🔒 Infos animateur
              </h2>
              <span className="text-[10px] font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                CONFIDENTIEL — Non visible côté membre
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Champ
                label="Date de création (entreprise)"
                name="date_creation_entreprise"
                type="date"
                defaultValue={m.date_creation_entreprise ?? ""}
              />
              <Champ
                label="Nombre de collaborateurs"
                name="nb_collaborateurs"
                type="number"
                defaultValue={m.nb_collaborateurs?.toString() ?? ""}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Type d&apos;activité
              </label>
              <select
                name="type_activite"
                defaultValue={m.type_activite ?? ""}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">— Non renseigné —</option>
                <option value="integree">🏗️ Intégrée (atelier/SAV maison)</option>
                <option value="sous_traitance">🔗 Sous-traitance</option>
                <option value="mixte">⚖️ Mixte</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Score de potentiel <span className="text-slate-400">(1 = faible · 5 = très fort)</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="flex-1">
                    <input
                      type="radio"
                      name="score_potentiel"
                      value={n.toString()}
                      defaultChecked={m.score_potentiel === n}
                      className="sr-only peer"
                    />
                    <span className="block text-center py-2 rounded-xl border-2 border-slate-200 bg-white peer-checked:border-amber-500 peer-checked:bg-amber-100 text-sm font-medium cursor-pointer transition-colors">
                      {"⭐".repeat(n)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Tags <span className="text-slate-400">(séparés par des virgules)</span>
              </label>
              <input
                type="text"
                name="tags_animateur"
                defaultValue={Array.isArray(m.tags_animateur) ? m.tags_animateur.join(", ") : ""}
                placeholder="ambassadeur, moteur, à suivre, fragile…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Exemples : <em>ambassadeur</em>, <em>moteur réseau</em>, <em>à suivre</em>, <em>fragile</em>, <em>nouveau</em>…
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Notes confidentielles
              </label>
              <textarea
                name="notes_animateur"
                defaultValue={m.notes_animateur ?? ""}
                rows={5}
                placeholder="Contexte, dirigeant, points sensibles, historique relationnel… tout ce qui te sert mais que tu ne veux pas exposer au membre."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/magasins/${id}`}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="px-4 py-2 pa-btn-primary rounded-xl text-sm font-medium transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Champ({
  label,
  name,
  defaultValue,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="pa-input"
      />
    </div>
  );
}
