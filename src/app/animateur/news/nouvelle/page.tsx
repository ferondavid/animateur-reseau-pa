import Link from "next/link";
import FormulaireNews from "@/components/FormulaireNews";

export default function NouvelleNewsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/animateur/news" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            ← Retour aux news
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Nouvelle actualité</h1>
        </div>
        <FormulaireNews mode="creer" />
      </div>
    </main>
  );
}
