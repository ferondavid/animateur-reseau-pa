import FormulaireLogin from "@/components/FormulaireLogin";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 p-6 md:p-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Animation réseau Piscinistes Associés
          </h1>
          <p className="text-slate-500 text-sm">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>
        <FormulaireLogin />
      </div>
    </main>
  );
}
