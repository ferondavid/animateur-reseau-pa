import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormulaireModifierVisite from "./FormulaireModifierVisite";

export default async function ModifierVisitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: visite }, { data: magasins }] = await Promise.all([
    supabase.from("visites").select("*").eq("id", id).single(),
    supabase.from("magasins").select("id, nom, enseigne, ville").order("nom"),
  ]);

  if (!visite) notFound();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/visites/${id}`}
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            ← Retour à la fiche
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Modifier la visite
          </h1>
        </div>
        <FormulaireModifierVisite
          visite={visite}
          magasins={magasins ?? []}
        />
      </div>
    </main>
  );
}
