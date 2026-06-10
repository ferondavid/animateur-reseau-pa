import FormulaireLogin from "@/components/FormulaireLogin";
import BoutonInstallerPWA from "@/components/BoutonInstallerPWA";

const FEATURES = [
  {
    role: "membre",
    title: "Membre PA",
    gradient: "linear-gradient(135deg,#34C9A3,#1FA98A)",
    shadow: "rgba(31,169,138,0.35)",
    icon: "🏪",
    items: [
      { ic: "📊", t: "Vos indicateurs clés (confiance, business, satisfaction)" },
      { ic: "📅", t: "Demande de RDV (physique, téléphone ou visio)" },
      { ic: "📢", t: "Remontée terrain avec photo ou fichier" },
      { ic: "📞", t: "Appel direct de votre animateur" },
      { ic: "📰", t: "Actualités du réseau en direct" },
    ],
  },
  {
    role: "animateur",
    title: "Animateur",
    gradient: "linear-gradient(135deg,#5BA8F5,#3D7BE8)",
    shadow: "rgba(61,123,232,0.35)",
    icon: "🎛️",
    items: [
      { ic: "🗺️", t: "Carte du réseau avec niveau de risque par magasin" },
      { ic: "📅", t: "Pilotage des demandes de RDV (confirmer, reporter)" },
      { ic: "📋", t: "Traitement des remontées terrain" },
      { ic: "✅", t: "Tableau de bord complet (KPIs, top/flop)" },
      { ic: "📰", t: "Publication des actualités du réseau" },
    ],
  },
] as const;

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
        </div>

        {/* Présentation des 2 rôles */}
        <section>
          <p
            className="text-center text-xs font-semibold uppercase tracking-widest mb-6 pa-reveal"
            style={{ color: "var(--pa-muted)", animationDelay: ".18s" }}
          >
            Ce que vous pouvez faire
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.role}
                className="pa-card p-6 pa-reveal"
                style={{ animationDelay: `${.22 + i * .08}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg text-white"
                    style={{ background: f.gradient, boxShadow: `0 6px 16px -4px ${f.shadow}` }}
                  >
                    {f.icon}
                  </span>
                  <h2 className="text-base font-bold" style={{ color: "var(--pa-ink)" }}>
                    Côté {f.title}
                  </h2>
                </div>
                <ul className="space-y-2.5">
                  {f.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--pa-ink)" }}>
                      <span className="shrink-0 mt-0.5">{it.ic}</span>
                      <span>{it.t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        <div className="flex justify-center mt-10">
          <BoutonInstallerPWA />
        </div>
      </div>
    </main>
  );
}
