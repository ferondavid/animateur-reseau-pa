import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoutonSupprimer from "./BoutonSupprimer";
import CAEvolution from "@/components/CAEvolution";

const statutStyles: Record<string, string> = {
  actif: "bg-green-100 text-green-800",
  pause: "bg-yellow-100 text-yellow-800",
  inactif: "bg-slate-100 text-slate-600",
};

const urgenceActionStyles: Record<number, { label: string; style: string }> = {
  1: { label: "Info", style: "bg-slate-100 text-slate-600" },
  2: { label: "Important", style: "bg-orange-100 text-orange-800" },
  3: { label: "Urgent", style: "bg-red-100 text-red-800" },
};

const statutActionStyles: Record<string, { label: string; style: string }> = {
  ouverte: { label: "Ouverte", style: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", style: "bg-orange-100 text-orange-800" },
};

const graviteRemonteeStyles: Record<string, { label: string; style: string }> =
  {
    normale: { label: "Normale", style: "bg-slate-100 text-slate-600" },
    attention: { label: "Attention", style: "bg-orange-100 text-orange-800" },
    urgente: { label: "Urgente", style: "bg-red-100 text-red-800" },
  };

const typeRemonteeLabels: Record<string, string> = {
  commerciale: "Commerciale",
  sav_technique: "SAV / Tech.",
  concurrence: "Concurrence",
  opportunite: "Opportunité",
  autre: "Autre",
};

const statutRemonteeStyles: Record<string, { label: string; style: string }> =
  {
    nouvelle: { label: "Nouvelle", style: "bg-blue-100 text-blue-800" },
    en_cours: { label: "En cours", style: "bg-orange-100 text-orange-800" },
    traitee: { label: "Traitée", style: "bg-green-100 text-green-800" },
  };

const statutVisiteStyles: Record<string, string> = {
  planifiee: "bg-blue-100 text-blue-800",
  realisee: "bg-green-100 text-green-800",
  annulee: "bg-slate-100 text-slate-600",
  reportee: "bg-orange-100 text-orange-800",
};

const statutVisiteLabels: Record<string, string> = {
  planifiee: "Planifiée",
  realisee: "Réalisée",
  annulee: "Annulée",
  reportee: "Reportée",
};

const statutLabels: Record<string, string> = {
  actif: "Actif",
  pause: "En pause",
  inactif: "Inactif",
};

const niveauLabels: Record<string, string> = {
  strategique: "Stratégique",
  standard: "Standard",
  observation: "Observation",
};

export default async function MagasinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const [
    { data: m },
    { data: visites },
    { data: actionsOuvertes },
    { data: remonteesActives },
  ] = await Promise.all([
      supabase.from("magasins").select("*").eq("id", id).single(),
      supabase
        .from("visites")
        .select(
          "id, date_prevue, date_realisee, statut, note_confiance, note_business"
        )
        .eq("magasin_id", id)
        .order("date_realisee", { ascending: false, nullsFirst: false })
        .order("date_prevue", { ascending: false })
        .limit(5),
      supabase
        .from("actions")
        .select("id, titre, niveau_urgence, statut, deadline")
        .eq("magasin_id", id)
        .in("statut", ["ouverte", "en_cours"])
        .order("niveau_urgence", { ascending: false })
        .order("deadline", { ascending: true, nullsFirst: false }),
      supabase
        .from("remontees")
        .select("id, titre, type, gravite, statut")
        .eq("magasin_id", id)
        .neq("statut", "archivee")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (!m) notFound();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link
              href="/magasins"
              className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
            >
              ← Retour à la liste
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {m.nom}
            </h1>
            {m.enseigne && (
              <p className="text-slate-500 text-sm mt-0.5">{m.enseigne}</p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Link
              href={`/magasins/${id}/modifier`}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Modifier
            </Link>
            <BoutonSupprimer id={id} />
          </div>
        </div>

        <div className="space-y-4">
          {/* CA — bloc CA évolution en haut */}
          <CAEvolution magasinId={id} anneeCourante={new Date().getFullYear()} />

          {/* Card : Informations générales */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Informations générales
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Adresse</dt>
                <dd className="text-slate-900">
                  {[m.adresse, m.code_postal, m.ville]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Région</dt>
                <dd className="text-slate-900">{m.region ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Statut</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyles[m.statut] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {statutLabels[m.statut] ?? m.statut}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Niveau</dt>
                <dd className="text-slate-900">
                  {niveauLabels[m.niveau] ?? m.niveau ?? "—"}
                </dd>
              </div>
              {m.date_entree_reseau && (
                <div>
                  <dt className="text-xs text-slate-400 mb-0.5">
                    Entrée réseau
                  </dt>
                  <dd className="text-slate-900">
                    {new Date(m.date_entree_reseau).toLocaleDateString("fr-FR")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Card : Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Contact
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Nom</dt>
                <dd className="text-slate-900">{m.contact_nom ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 mb-0.5">Téléphone</dt>
                <dd className="text-slate-900">
                  {m.contact_telephone ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-slate-400 mb-0.5">Email</dt>
                <dd className="text-slate-900">
                  {m.contact_email ? (
                    <a
                      href={`mailto:${m.contact_email}`}
                      className="text-slate-900 hover:underline"
                    >
                      {m.contact_email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Card : Notes (uniquement si présentes) */}
          {m.notes && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Notes
              </h2>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {m.notes}
              </p>
            </div>
          )}

          {/* Card : Visites */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Visites
              </h2>
              <Link
                href={`/visites/nouvelle?magasin_id=${id}`}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                + Nouvelle visite
              </Link>
            </div>

            {(visites ?? []).length === 0 ? (
              <p className="text-slate-400 text-sm">
                Aucune visite enregistrée.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {(visites ?? []).map((v) => {
                  const date = v.date_realisee ?? v.date_prevue;
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-700">
                          {date
                            ? new Date(date).toLocaleDateString("fr-FR")
                            : "—"}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statutVisiteStyles[v.statut] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {statutVisiteLabels[v.statut] ?? v.statut}
                        </span>
                        {v.note_confiance && (
                          <span className="text-xs text-slate-500">
                            C&nbsp;
                            <span className="text-amber-400">
                              {"★".repeat(v.note_confiance)}
                            </span>
                          </span>
                        )}
                        {v.note_business && (
                          <span className="text-xs text-slate-500">
                            B&nbsp;
                            <span className="text-amber-400">
                              {"★".repeat(v.note_business)}
                            </span>
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/visites/${v.id}`}
                        className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors"
                      >
                        Voir →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Card : Remontées terrain */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Remontées terrain
              </h2>
              <Link
                href={`/remontees/nouvelle?magasin_id=${id}`}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                + Nouvelle remontée
              </Link>
            </div>

            {(remonteesActives ?? []).length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune remontée active.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {(remonteesActives ?? []).map((rem) => {
                  const gravite =
                    graviteRemonteeStyles[rem.gravite as string];
                  const statut =
                    statutRemonteeStyles[rem.statut as string];
                  return (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${gravite?.style ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {gravite?.label ?? rem.gravite}
                        </span>
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {typeRemonteeLabels[rem.type as string] ?? rem.type}
                        </span>
                        <span className="text-sm text-slate-900 font-medium truncate">
                          {rem.titre}
                        </span>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {statut?.label ?? rem.statut}
                        </span>
                      </div>
                      <Link
                        href={`/remontees/${rem.id}`}
                        className="shrink-0 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors ml-3"
                      >
                        Voir →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card : Actions ouvertes */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Actions
              </h2>
              <Link
                href={`/actions-reseau/nouvelle?magasin_id=${id}`}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                + Nouvelle action
              </Link>
            </div>

            {(actionsOuvertes ?? []).length === 0 ? (
              <p className="text-slate-400 text-sm">Aucune action en cours.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {(actionsOuvertes ?? []).map((a) => {
                  const today = new Date().toISOString().split("T")[0];
                  const urgence = urgenceActionStyles[a.niveau_urgence as number];
                  const statut = statutActionStyles[a.statut as string];
                  const depasse =
                    a.deadline && a.deadline < today;
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgence?.style ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {urgence?.label ?? a.niveau_urgence}
                        </span>
                        <span className="text-sm text-slate-900 font-medium truncate">
                          {a.titre}
                        </span>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statut?.style ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {statut?.label ?? a.statut}
                        </span>
                        {a.deadline && (
                          <span
                            className={`shrink-0 text-xs ${depasse ? "text-red-600 font-medium" : "text-slate-400"}`}
                          >
                            {new Date(a.deadline).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/actions-reseau/${a.id}`}
                        className="shrink-0 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors ml-3"
                      >
                        Voir →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
