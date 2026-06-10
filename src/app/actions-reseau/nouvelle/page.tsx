import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import FormulaireNouvelleAction from "./FormulaireNouvelleAction";

export default async function NouvelleActionPage({
  searchParams,
}: {
  searchParams: Promise<{ magasin_id?: string; description?: string }>;
}) {
  const { magasin_id, description } = await searchParams;
  const supabase = await createClient();

  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, nom, enseigne")
    .order("nom");

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/actions-reseau"
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            ← Retour aux actions
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Nouvelle action
          </h1>
        </div>

        <FormulaireNouvelleAction
          magasins={magasins ?? []}
          magasinIdInitial={magasin_id}
          descriptionInitiale={description}
        />
      </div>
    </main>
  );
}
