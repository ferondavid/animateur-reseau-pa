import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoutonSupprimerVisite from "./BoutonSupprimerVisite";

const statutStyles: Record<string, string> = {
  planifiee: "bg-blue-100 text-blue-800",
  realisee: "bg-green-100 text-green-800",
  annulee: "bg-slate-100 text-slate-600",
  reportee: "bg-orange-100 text-orange-800",
};

const statutLabels: Record<string, string> = {
  planifiee: "Planifiée",
  realisee: "Réalisée",
  annulee: "Annulée",
  reportee: "Reportée",
};

function Etoiles({ note }: { note: number | null }) {
  if (!note) return null;
  return (
    <span className="text-3xl text-amber-400 leading-none">
      {"★".repeat(note)}
      <span className="text-slate-200">{"★".repeat(5 - note)}</span>
    </span>
  );
}

function Bloc({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-slate-400 mb-1">{label}</dt>
      <dd className="text-slate-900 whitespace-pre-wrap leading-relaxed">
        {value}
      </dd>
    </div>
  );
}

export default async function VisiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: v } = await supabase
    .from("visites")
    .select("*, magasins(id, nom, enseigne, ville)")
    .eq("id", id)
    .single();

  if (!v) notFound();

  const magasin = v.magasins as {
    id: string;
    nom: string;
    enseigne: string | null;
    ville: string | null;
  } | null;

  const nomMagasin = magasin
    ? `${magasin.enseigne ? magasin.enseigne + " — " : ""}${magasin.nom}`
    : "Visite";

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link
              href="/visites"
              className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
            >
              ← Visites
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {nomMagasin}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {v.date_realisee
                ? `Réalisée le ${new Date(v.date_realisee).toLocaleDateString("fr-FR")}`
                : v.date_prevue
                  ? `Prévue le ${new Date(v.date_prevue).toLocaleDateString("fr-FR")}`
                  : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Link
              href={`/visites/${id}/modifier`}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Modifier
            </Link>
            <BoutonSupprimerVisite id={id} magasinId={magasin?.id} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Informations */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Informations
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Magasin</dt>
                <dd>
                  {magasin ? (
                    <Link
                      href={`/magasins/${magasin.id}`}
                      className="text-slate-900 hover:underline"
                    >
                      {nomMagasin}
                      {magasin.ville ? ` (${magasin.ville})` : ""}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Statut</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[v.statut] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {statutLabels[v.statut] ?? v.statut}
                  </span>
                </dd>
              </div>
              {v.date_prevue && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">Date prévue</dt>
                  <dd className="text-slate-900">
                    {new Date(v.date_prevue).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
              {v.date_realisee && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">
                    Date réalisée
                  </dt>
                  <dd className="text-slate-900">
                    {new Date(v.date_realisee).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
              {v.duree_minutes && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">Durée</dt>
                  <dd className="text-slate-900">{v.duree_minutes} min</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Objectif */}
          {v.objectif && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Objectif
              </h2>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {v.objectif}
              </p>
            </div>
          )}

          {/* Compte-rendu */}
          {(v.compte_rendu || v.points_positifs || v.points_attention) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Compte-rendu
              </h2>
              <dl className="space-y-4">
                <Bloc label="Compte-rendu général" value={v.compte_rendu} />
                <Bloc label="Points positifs" value={v.points_positifs} />
                <Bloc label="Points d'attention" value={v.points_attention} />
              </dl>
            </div>
          )}

          {/* Actions */}
          {(v.actions_decidees || v.prochaine_etape) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Actions
              </h2>
              <dl className="space-y-4">
                <Bloc label="Actions décidées" value={v.actions_decidees} />
                <Bloc label="Prochaine étape" value={v.prochaine_etape} />
              </dl>
            </div>
          )}

          {/* Indicateurs */}
          {(v.note_confiance || v.note_business) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Indicateurs
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {v.note_confiance && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Confiance</p>
                    <Etoiles note={v.note_confiance} />
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {v.note_confiance}/5
                    </p>
                    {v.commentaire_confiance && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {v.commentaire_confiance}
                      </p>
                    )}
                  </div>
                )}
                {v.note_business && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Business</p>
                    <Etoiles note={v.note_business} />
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {v.note_business}/5
                    </p>
                    {v.commentaire_business && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {v.commentaire_business}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
