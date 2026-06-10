import Link from "next/link";
import Navigation from "@/components/Navigation";

type Tag = "nouveau" | "stable" | "beta";

type Feature = {
  icon: string;
  titre: string;
  description: string;
  url?: string;
  tag?: Tag;
};

type Categorie = {
  titre: string;
  icon: string;
  couleur: string; // tailwind bg- and text- pair
  features: Feature[];
};

const CATEGORIES: Categorie[] = [
  {
    titre: "Vue d'ensemble",
    icon: "🗺️",
    couleur: "blue",
    features: [
      { icon: "🗺️", titre: "Carte du réseau", description: "Vue géographique avec pins colorés selon risque + badges niveau magasin", url: "/animateur" },
      { icon: "📊", titre: "Pilotage", description: "Cockpit complet avec filtres : période, niveau, région, score risque", url: "/pilotage" },
      { icon: "📆", titre: "Agenda unifié", description: "RDV pro + visites planifiées + Google Calendar dans un seul flux trié", url: "/animateur", tag: "nouveau" },
      { icon: "🎯", titre: "Magasins prioritaires", description: "Stratégiques et observation hors seuil de visite (60j / 30j)", url: "/animateur" },
      { icon: "🌅", titre: "Préparation J-1", description: "Heure de départ + charge batterie auto-calculées pour les RDV de demain", url: "/animateur", tag: "nouveau" },
    ],
  },
  {
    titre: "Magasins",
    icon: "🏪",
    couleur: "emerald",
    features: [
      { icon: "📋", titre: "Liste magasins", description: "Filtres par statut (Actifs / En sommeil / Archivés)", url: "/magasins" },
      { icon: "➕", titre: "Ajouter un magasin", description: "Géocodage automatique via Nominatim", url: "/magasins/nouveau" },
      { icon: "🏷️", titre: "Niveaux", description: "Stratégique ⭐ / Standard / Observation 🔍 (seuils visite différenciés)", url: "/animateur/parametres" },
      { icon: "🔒", titre: "Infos animateur", description: "Date création, collaborateurs, type activité, score potentiel, tags, notes confidentielles" },
      { icon: "🌙", titre: "Mettre en sommeil", description: "Désactiver temporairement sans perdre l'historique" },
      { icon: "🗄️", titre: "Archiver / supprimer", description: "Cascade sur visites, RDV, remontées, CA, évaluations" },
    ],
  },
  {
    titre: "RDV & Visites",
    icon: "📅",
    couleur: "blue",
    features: [
      { icon: "📅", titre: "Demande de RDV", description: "Type physique / téléphone / visio avec multi-invités", url: "/animateur/rdv" },
      { icon: "🤝", titre: "Workflow bidirectionnel", description: "Le membre peut accepter, refuser ou contre-proposer" },
      { icon: "✅", titre: "Confirmer / Reporter / Annuler", description: "Actions rapides depuis le dashboard" },
      { icon: "📨", titre: "Invitation calendrier .ics", description: "Email auto à la confirmation (animateur + magasin)" },
      { icon: "🗓️", titre: "Visites planifiées", description: "Statut planifiée / réalisée + notes confiance/business", url: "/visites" },
      { icon: "📝", titre: "Compte rendu visite", description: "Objectif, points clés, photos audio" },
    ],
  },
  {
    titre: "Parcours de tournée",
    icon: "🚗",
    couleur: "amber",
    features: [
      { icon: "🚗", titre: "Sélection multi-magasins", description: "Filtres par niveau + recherche", url: "/animateur/parcours" },
      { icon: "🧭", titre: "Itinéraire optimisé", description: "Algorithme nearest-neighbor depuis ton point de départ" },
      { icon: "⚡", titre: "Véhicule électrique", description: "Insertion auto des arrêts recharge via OpenChargeMap", tag: "nouveau" },
      { icon: "🗺️", titre: "Export Google Maps", description: "Ouverture directe avec waypoints" },
      { icon: "📅", titre: "Planifier les visites", description: "Création des visites planifiées en 1 clic, 1 par jour" },
    ],
  },
  {
    titre: "Remontées terrain",
    icon: "📢",
    couleur: "orange",
    features: [
      { icon: "📢", titre: "Liste & gestion", description: "Toutes les remontées avec filtres statut + gravité", url: "/remontees" },
      { icon: "📎", titre: "Pièces jointes", description: "Image, PDF, vidéo, audio — preview directe" },
      { icon: "💬", titre: "Réponse animateur", description: "Avec date de traitement et historique" },
      { icon: "🚨", titre: "Notifications email", description: "Alerte instantanée sur gravité urgente (Resend)", tag: "nouveau" },
    ],
  },
  {
    titre: "Actions réseau",
    icon: "📋",
    couleur: "purple",
    features: [
      { icon: "📋", titre: "Liste & gestion", description: "Filtres par urgence + statut", url: "/actions-reseau" },
      { icon: "🎯", titre: "Niveaux d'urgence", description: "Info / Important / Urgent" },
      { icon: "👥", titre: "Origine + destinataire", description: "Qui a créé, à qui c'est assigné", tag: "nouveau" },
      { icon: "📜", titre: "Historique des statuts", description: "Timeline auto avec triggers SQL + commentaires manuels", tag: "nouveau" },
    ],
  },
  {
    titre: "Évaluations",
    icon: "⭐",
    couleur: "yellow",
    features: [
      { icon: "⭐", titre: "Évaluations reçues", description: "Score satisfaction par visite (q6)", url: "/evaluations" },
      { icon: "🔗", titre: "Lien public partagé", description: "Formulaire à envoyer au magasin après visite" },
      { icon: "📊", titre: "Moyenne réseau", description: "Sur la durée + par magasin" },
    ],
  },
  {
    titre: "News du réseau",
    icon: "📰",
    couleur: "indigo",
    features: [
      { icon: "📰", titre: "CRUD complet", description: "Liste, création, modification, suppression", url: "/animateur/news" },
      { icon: "📌", titre: "Épinglage", description: "Garde une news en haut du fil" },
      { icon: "🎨", titre: "4 types", description: "Info 📢 / Événement 🎉 / Alerte ⚠️ / Témoignage 💬" },
      { icon: "🖼️", titre: "Image hero", description: "Upload via Supabase Storage" },
    ],
  },
  {
    titre: "CA & Pilotage commercial",
    icon: "💰",
    couleur: "emerald",
    features: [
      { icon: "💰", titre: "CA mensuel par magasin", description: "Saisie 24 mois × 4 segments (chimie / matériel / piscine / spa)" },
      { icon: "📈", titre: "Évolution N vs N-1", description: "Détectée automatiquement sur fiche magasin" },
      { icon: "📊", titre: "Sparkline 24 mois", description: "Visualisation tendance sur la fiche" },
    ],
  },
  {
    titre: "Communications",
    icon: "📡",
    couleur: "blue",
    features: [
      { icon: "🔔", titre: "Notifications email", description: "Resend : remontée urgente, RDV demandé, RDV confirmé avec .ics", url: "/animateur/parametres", tag: "nouveau" },
      { icon: "📞", titre: "Contact 1-clic depuis fiche membre", description: "WhatsApp / Email / Appel / SMS pré-remplis" },
      { icon: "📅", titre: "Sync Google Calendar", description: "Lecture iCal + export multi-feeds colorés (RDV par type + visites)", url: "/animateur/parametres" },
    ],
  },
  {
    titre: "Assistant vocal",
    icon: "🎤",
    couleur: "violet",
    features: [
      { icon: "🎤", titre: "Bouton micro flottant", description: "Toujours accessible en bas à droite (animateur uniquement)", tag: "nouveau" },
      { icon: "🧭", titre: "Navigation vocale", description: "« Ouvre la carte », « Va sur les remontées », « Page parcours »" },
      { icon: "➕", titre: "Création vocale", description: "« Crée un RDV visio avec Aqua Démo le 15 juin à 14h30 »" },
      { icon: "❓", titre: "Consultation vocale", description: "« Quel est mon prochain RDV », « Combien j'ai de remontées urgentes »" },
      { icon: "🔊", titre: "Réponse vocale française", description: "Lecture auto via Web Speech Synthesis + bouton Réécouter" },
    ],
  },
  {
    titre: "Sécurité & Paramètres",
    icon: "🔒",
    couleur: "slate",
    features: [
      { icon: "🔐", titre: "Auth simple", description: "Login Membre PA (pa / associe) ou Animateur (df / dfdf)" },
      { icon: "🛡️", titre: "Anti-référencement", description: "noindex global, robots.txt, header X-Robots-Tag" },
      { icon: "👥", titre: "Middleware par rôle", description: "Routes animateur protégées du membre et vice-versa" },
      { icon: "⚙️", titre: "Paramètres centralisés", description: "Email animateur, agenda Google, véhicule électrique, point de départ", url: "/animateur/parametres" },
    ],
  },
  {
    titre: "Installation & Performance",
    icon: "📱",
    couleur: "cyan",
    features: [
      { icon: "📱", titre: "PWA installable", description: "Sur iOS et Android comme une vraie app" },
      { icon: "⚡", titre: "Service worker", description: "Cache des assets statiques pour usage offline-light" },
      { icon: "🎨", titre: "Icône custom PA", description: "Sur fond bleu nuit, écran d'accueil mobile" },
      { icon: "🚀", titre: "Vercel + auto-deploy", description: "Push sur main → prod en 60s" },
    ],
  },
];

const COULEUR_CLASSES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-900",    icon: "bg-blue-100" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", icon: "bg-emerald-100" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",   icon: "bg-amber-100" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-900",  icon: "bg-orange-100" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-900",  icon: "bg-purple-100" },
  yellow:  { bg: "bg-yellow-50",  border: "border-yellow-200",  text: "text-yellow-900",  icon: "bg-yellow-100" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-900",  icon: "bg-indigo-100" },
  violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-900",  icon: "bg-violet-100" },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-900",   icon: "bg-slate-100" },
  cyan:    { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-900",    icon: "bg-cyan-100" },
};

const TAG_LABEL: Record<Tag, { label: string; cls: string }> = {
  nouveau: { label: "Nouveau",  cls: "bg-emerald-500 text-white" },
  stable:  { label: "Stable",   cls: "bg-slate-100 text-slate-700" },
  beta:    { label: "Bêta",     cls: "bg-amber-500 text-white" },
};

export default function FonctionnalitesPage() {
  const total = CATEGORIES.reduce((s, c) => s + c.features.length, 0);
  const nouveaux = CATEGORIES.reduce(
    (s, c) => s + c.features.filter((f) => f.tag === "nouveau").length,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/animateur" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
              ← Retour dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">📚 Fonctionnalités de l&apos;app</h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Vue d&apos;ensemble de toutes les capacités de l&apos;outil côté animateur.
              <strong className="text-slate-700"> {total} fonctionnalités</strong> réparties en{" "}
              <strong className="text-slate-700">{CATEGORIES.length} catégories</strong>
              {nouveaux > 0 && (
                <> · <strong className="text-emerald-700">{nouveaux} nouvelles</strong> récemment ajoutées</>
              )}.
            </p>
          </div>
        </div>

        <Navigation />

        {/* Catégories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CATEGORIES.map((cat) => {
            const c = COULEUR_CLASSES[cat.couleur] ?? COULEUR_CLASSES.slate;
            return (
              <section
                key={cat.titre}
                className={`rounded-2xl border-2 ${c.border} ${c.bg} p-5 shadow-sm`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${c.icon} text-2xl shadow-sm`}>
                    {cat.icon}
                  </span>
                  <div>
                    <h2 className={`text-lg font-bold ${c.text}`}>{cat.titre}</h2>
                    <p className="text-xs text-slate-500">{cat.features.length} fonctionnalité{cat.features.length > 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {cat.features.map((f) => {
                    const inner = (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                        <span className="shrink-0 text-lg leading-none mt-0.5">{f.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-slate-900">{f.titre}</p>
                            {f.tag && (
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${TAG_LABEL[f.tag].cls}`}>
                                {TAG_LABEL[f.tag].label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.description}</p>
                        </div>
                        {f.url && (
                          <span className="shrink-0 text-slate-300 text-sm">→</span>
                        )}
                      </div>
                    );
                    return f.url ? (
                      <Link key={f.titre} href={f.url}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={f.titre}>{inner}</div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Animation réseau Piscinistes Associés · {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </div>

      </div>
    </main>
  );
}
