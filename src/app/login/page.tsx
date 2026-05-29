import FormulaireLogin from "@/components/FormulaireLogin";

const FEATURES = [
  {
    role: "membre",
    title: "Membre PA",
    color: "emerald",
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
    color: "blue",
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 p-6 md:p-10">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Animation réseau Piscinistes Associés
          </h1>
          <p className="text-slate-500 text-sm">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {/* Formulaire centré */}
        <div className="max-w-md mx-auto mb-14">
          <FormulaireLogin />
        </div>

        {/* Présentation des 2 rôles */}
        <section>
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
            Ce que vous pouvez faire
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => {
              const isEmerald = f.color === "emerald";
              return (
                <div
                  key={f.role}
                  className={`bg-white rounded-2xl border ${
                    isEmerald ? "border-emerald-200" : "border-blue-200"
                  } shadow-sm p-6`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg ${
                        isEmerald
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {f.icon}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Côté {f.title}
                    </h2>
                  </div>
                  <ul className="space-y-2.5">
                    {f.items.map((it, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-slate-700"
                      >
                        <span className="shrink-0 mt-0.5">{it.ic}</span>
                        <span>{it.t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
