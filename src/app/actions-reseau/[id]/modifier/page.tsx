import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormulaireModifierAction from "./FormulaireModifierAction";

export default async function ModifierActionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: action }, { data: magasins }] = await Promise.all([
    supabase
      .from("actions")
      .select("id, titre, description, niveau_urgence, portee, magasin_id, deadline")
      .eq("id", id)
      .single(),
    supabase.from("magasins").select("id, nom, enseigne").order("nom"),
  ]);

  if (!action) notFound();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/actions-reseau/${id}`}
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            ← Retour à l'action
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Modifier l'action
          </h1>
        </div>

        <FormulaireModifierAction action={action} magasins={magasins ?? []} />
      </div>
    </main>
  );
}
