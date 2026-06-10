import Link from "next/link";
import { creerMagasin } from "./actions";

function Champ({
  label, name, defaultValue = "", type = "text", required, placeholder, hint,
}: {
  label: string; name: string; defaultValue?: string; type?: string;
  required?: boolean; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} defaultValue={defaultValue} required={required}
        placeholder={placeholder}
        className="pa-input"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function NouveauMagasinPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/magasins" className="text-slate-500 hover:text-slate-900 text-sm transition-colors">
            ← Retour à la liste
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Ajouter un magasin</h1>
        </div>

        <form action={creerMagasin} className="space-y-6">
          {/* Identité */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Identité</h2>
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Nom" name="nom" required />
              <Champ label="Enseigne" name="enseigne" />
            </div>
            <Champ label="Adresse" name="adresse" />
            <div className="grid grid-cols-3 gap-4">
              <Champ label="Code postal" name="code_postal" placeholder="75001" />
              <div className="col-span-2">
                <Champ label="Ville" name="ville" />
              </div>
            </div>
            <Champ label="Région" name="region" placeholder="Île-de-France" />
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Contact (optionnel)</h2>
            <Champ label="Nom du contact" name="contact_nom" />
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Téléphone" name="contact_telephone" type="tel" />
              <Champ label="Email" name="contact_email" type="email" />
            </div>
          </div>

          {/* Classement */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Classement</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Niveau</label>
                <select
                  name="niveau"
                  defaultValue="standard"
                  className="pa-input"
                >
                  <option value="strategique">Stratégique</option>
                  <option value="standard">Standard</option>
                  <option value="observation">Observation</option>
                </select>
              </div>
              <Champ label="Date d'entrée dans le réseau" name="date_entree_reseau" type="date" />
            </div>
          </div>

          {/* Géolocalisation */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Géolocalisation (optionnel)</h2>
            <p className="text-xs text-slate-400 -mt-2">
              Laissez vide : la position sera calculée automatiquement via l'adresse (Nominatim).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Champ label="Latitude" name="latitude" type="number" placeholder="48.8566" />
              <Champ label="Longitude" name="longitude" type="number" placeholder="2.3522" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/magasins"
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              className="px-5 py-2.5 pa-btn-primary rounded-xl text-sm font-semibold"
            >
              Créer le magasin
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
