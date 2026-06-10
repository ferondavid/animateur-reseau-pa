import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import FormulaireVisite from "./FormulaireVisite";

export default async function NouvelleVisitePage({
  searchParams,
}: {
  searchParams: Promise<{ magasin_id?: string }>;
}) {
  const { magasin_id } = await searchParams;

  const supabase = await createClient();
  const { data: magasins } = await supabase
    .from("magasins")
    .select("id, nom, enseigne, ville")
    .order("nom");

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/visites"
            className="text-slate-500 hover:text-slate-900 text-sm transition-colors"
          >
            ← Visites
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Nouvelle visite
          </h1>
        </div>
        <FormulaireVisite
          magasins={magasins ?? []}
          defaultMagasinId={magasin_id}
        />
      </div>
    </main>
  );
}
