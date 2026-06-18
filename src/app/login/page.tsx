import FormulaireLogin from "@/components/FormulaireLogin";
import BoutonInstallerPWA from "@/components/BoutonInstallerPWA";
import AideConnexion from "@/components/AideConnexion";

export default function LoginPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header hero */}
        <div className="pa-hero pa-reveal text-center mb-10 p-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: "#fff", letterSpacing: "-0.3px" }}
          >
            Animation réseau Piscinistes Associés
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {/* Formulaire centré */}
        <div className="max-w-md mx-auto mb-14 pa-reveal" style={{ animationDelay: ".12s" }}>
          <div className="pa-card p-6">
            <FormulaireLogin />
          </div>
          <AideConnexion />
        </div>

        <div className="flex justify-center mt-10">
          <BoutonInstallerPWA />
        </div>
      </div>
    </main>
  );
}
