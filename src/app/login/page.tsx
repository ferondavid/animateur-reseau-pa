import Image from "next/image";
import FormulaireLogin from "@/components/FormulaireLogin";
import BoutonInstallerPWA from "@/components/BoutonInstallerPWA";
import AideConnexion from "@/components/AideConnexion";

export default function LoginPage() {
  return (
    <main className="min-h-screen p-6 md:p-10">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header hero */}
        <div className="pa-reveal mb-10" style={{ background: "white", padding: "2rem", textAlign: "center" }}>
          <div className="flex justify-center mb-4">
            <Image src="/pISCINISTES-ASSOCIES-logo.jpg" alt="Piscinistes Associés" width={180} height={80} style={{ objectFit: "contain", display: "block" }} />
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: "#1a1a2e", letterSpacing: "-0.3px" }}
          >
            Animation réseau
          </h1>
          <p style={{ color: "#6B7280", fontSize: "14px" }}>
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
