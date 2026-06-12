import Link from "next/link";
import Navigation from "@/components/Navigation";
import { ArrowLeft, ArrowUpRight, ArrowRight, Zap } from "lucide-react";
import { Fragment, type ReactNode } from "react";

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
  couleur: string;
  features: Feature[];
};

// ─── Données ──────────────────────────────────────────────────────────────────

const CATEGORIES: Categorie[] = [
  {
    titre: "Vue d'ensemble",
    icon: "🗺️",
    couleur: "blue",
    features: [
      {
        icon: "🗺️",
        titre: "Carte du réseau",
        description: "Vue géographique cadrée sur la France, puces glossy + bulles pastel, niveau de risque par magasin",
        url: "/animateur",
        tag: "nouveau",
      },
      {
        icon: "📊",
        titre: "Pilotage",
        description: "Cockpit complet avec filtres : période, niveau, région, score risque",
        url: "/pilotage",
      },
      {
        icon: "📆",
        titre: "Agenda unifié",
        description: "RDV pro + visites planifiées + Google Calendar dans un seul flux trié",
        url: "/animateur",
        tag: "nouveau",
      },
      {
        icon: "🎯",
        titre: "Magasins prioritaires",
        description: "Stratégiques et observation hors seuil de visite (60j / 30j)",
        url: "/animateur",
      },
      {
        icon: "🌅",
        titre: "Préparation J-1",
        description: "Heure de départ + charge batterie auto-calculées pour les RDV de demain",
        url: "/animateur",
        tag: "nouveau",
      },
      {
        icon: "📄",
        titre: "Rapport d'activité",
        description: "Bilan hebdo & mensuel imprimable : visites, remontées, actions/RDV, satisfaction & risque réseau",
        url: "/animateur/rapport",
        tag: "nouveau",
      },
    ],
  },
  {
    titre: "Magasins",
    icon: "🏪",
    couleur: "emerald",
    features: [
      {
        icon: "📋",
        titre: "Liste magasins",
        description: "Filtres par statut (Actifs / En sommeil / Archivés)",
        url: "/magasins",
      },
      {
        icon: "➕",
        titre: "Ajouter un magasin",
        description: "Géocodage automatique via Nominatim",
        url: "/magasins/nouveau",
      },
      {
        icon: "🏷️",
        titre: "Niveaux",
        description: "Stratégique ⭐ / Standard / Observation 🔍 (seuils visite différenciés)",
        url: "/animateur/parametres",
      },
      {
        icon: "🔒",
        titre: "Infos animateur",
        description: "Date création, collaborateurs, type activité, score potentiel, tags, notes confidentielles",
      },
      {
        icon: "🌙",
        titre: "Mettre en sommeil",
        description: "Désactiver temporairement sans perdre l'historique",
      },
      {
        icon: "🗄️",
        titre: "Archiver / supprimer",
        description: "Cascade sur visites, RDV, remontées, CA, évaluations",
      },
    ],
  },
  {
    titre: "RDV & Visites",
    icon: "📅",
    couleur: "blue",
    features: [
      {
        icon: "📅",
        titre: "Demande de RDV",
        description: "Type physique / téléphone / visio avec multi-invités",
        url: "/animateur/rdv",
      },
      {
        icon: "🤝",
        titre: "Workflow bidirectionnel",
        description: "Le membre peut accepter, refuser ou contre-proposer",
      },
      {
        icon: "✅",
        titre: "Confirmer / Reporter / Annuler",
        description: "Actions rapides depuis le dashboard",
      },
      {
        icon: "📨",
        titre: "Invitation calendrier .ics",
        description: "Email auto à la confirmation (animateur + magasin)",
      },
      {
        icon: "🗓️",
        titre: "Visites planifiées",
        description: "Statut planifiée / réalisée + notes confiance/business",
        url: "/visites",
      },
      {
        icon: "📝",
        titre: "Compte rendu visite",
        description: "Objectif, points clés, photos audio",
      },
    ],
  },
  {
    titre: "Parcours de tournée",
    icon: "🚗",
    couleur: "amber",
    features: [
      {
        icon: "🚗",
        titre: "Sélection multi-magasins",
        description: "Filtres par niveau + recherche",
        url: "/animateur/parcours",
      },
      {
        icon: "🧭",
        titre: "Itinéraire optimisé",
        description: "Algorithme nearest-neighbor depuis ton point de départ",
      },
      {
        icon: "⚡",
        titre: "Véhicule électrique",
        description: "Insertion auto des arrêts recharge via OpenChargeMap",
        tag: "nouveau",
      },
      {
        icon: "🗺️",
        titre: "Export Google Maps",
        description: "Ouverture directe avec waypoints",
      },
      {
        icon: "📅",
        titre: "Planifier les visites",
        description: "Création des visites planifiées en 1 clic, 1 par jour",
      },
      {
        icon: "📍",
        titre: "Filtre par zone",
        description: "Filtre par région + magasins regroupés par zone dans la liste, carte cadrée sur la France",
        tag: "nouveau",
      },
    ],
  },
  {
    titre: "Remontées terrain",
    icon: "📢",
    couleur: "orange",
    features: [
      {
        icon: "📢",
        titre: "Liste & gestion",
        description: "Toutes les remontées avec filtres statut + gravité",
        url: "/remontees",
      },
      {
        icon: "📎",
        titre: "Pièces jointes",
        description: "Image, PDF, vidéo, audio — preview directe",
      },
      {
        icon: "💬",
        titre: "Réponse animateur",
        description: "Avec date de traitement et historique",
      },
      {
        icon: "🚨",
        titre: "Notifications email",
        description: "Alerte instantanée sur gravité urgente (Resend)",
        tag: "nouveau",
      },
    ],
  },
  {
    titre: "Actions réseau",
    icon: "📋",
    couleur: "purple",
    features: [
      {
        icon: "📋",
        titre: "Liste & gestion",
        description: "Filtres par urgence + statut",
        url: "/actions-reseau",
      },
      {
        icon: "🎯",
        titre: "Niveaux d'urgence",
        description: "Info / Important / Urgent",
      },
      {
        icon: "👥",
        titre: "Origine + destinataire",
        description: "Qui a créé, à qui c'est assigné",
        tag: "nouveau",
      },
      {
        icon: "📜",
        titre: "Historique des statuts",
        description: "Timeline auto avec triggers SQL + commentaires manuels",
        tag: "nouveau",
      },
    ],
  },
  {
    titre: "Évaluations",
    icon: "⭐",
    couleur: "yellow",
    features: [
      {
        icon: "⭐",
        titre: "Double évaluation",
        description: "Mon évaluation animateur (confiance/business) ET l'évaluation reçue du magasin, côte à côte par visite",
        url: "/evaluations",
        tag: "nouveau",
      },
      {
        icon: "🔗",
        titre: "Lien public partagé",
        description: "Formulaire à envoyer au magasin après visite",
      },
      {
        icon: "📊",
        titre: "Moyenne réseau",
        description: "Sur la durée + par magasin",
      },
    ],
  },
  {
    titre: "News du réseau",
    icon: "📰",
    couleur: "indigo",
    features: [
      {
        icon: "📰",
        titre: "CRUD complet",
        description: "Liste, création, modification, suppression",
        url: "/animateur/news",
      },
      {
        icon: "📌",
        titre: "Épinglage",
        description: "Garde une news en haut du fil",
      },
      {
        icon: "🎨",
        titre: "4 types",
        description: "Info 📢 / Événement 🎉 / Alerte ⚠️ / Témoignage 💬",
      },
      {
        icon: "🖼️",
        titre: "Image hero",
        description: "Upload via Supabase Storage",
      },
    ],
  },
  {
    titre: "CA & Pilotage commercial",
    icon: "💰",
    couleur: "emerald",
    features: [
      {
        icon: "💰",
        titre: "CA mensuel par magasin",
        description: "Saisie 24 mois × 4 segments (chimie / matériel / piscine / spa)",
      },
      {
        icon: "📈",
        titre: "Évolution N vs N-1",
        description: "Détectée automatiquement sur fiche magasin",
      },
      {
        icon: "📊",
        titre: "Sparkline 24 mois",
        description: "Visualisation tendance sur la fiche",
      },
    ],
  },
  {
    titre: "Communications",
    icon: "📡",
    couleur: "blue",
    features: [
      {
        icon: "🔔",
        titre: "Notifications email",
        description: "Resend : remontée urgente, RDV demandé, RDV confirmé avec .ics",
        url: "/animateur/parametres",
        tag: "nouveau",
      },
      {
        icon: "📞",
        titre: "Contact 1-clic depuis fiche membre",
        description: "WhatsApp / Email / Appel / SMS pré-remplis",
      },
      {
        icon: "📅",
        titre: "Sync Google Calendar",
        description: "Lecture iCal + export multi-feeds colorés (RDV par type + visites)",
        url: "/animateur/parametres",
      },
    ],
  },
  {
    titre: "Assistant vocal",
    icon: "🎤",
    couleur: "violet",
    features: [
      {
        icon: "🎤",
        titre: "Bouton micro flottant",
        description: "Toujours accessible en bas à droite (animateur uniquement)",
        tag: "nouveau",
      },
      {
        icon: "🧭",
        titre: "Navigation vocale",
        description: "« Ouvre la carte », « Va sur les remontées », « Page parcours »",
      },
      {
        icon: "➕",
        titre: "Création vocale",
        description: "« Crée un RDV visio avec Aqua Démo le 15 juin à 14h30 »",
      },
      {
        icon: "❓",
        titre: "Consultation vocale",
        description: "« Quel est mon prochain RDV », « Combien j'ai de remontées urgentes »",
      },
      {
        icon: "🔊",
        titre: "Réponse vocale française",
        description: "Lecture auto via Web Speech Synthesis + bouton Réécouter",
      },
    ],
  },
  {
    titre: "Sécurité & Paramètres",
    icon: "🔒",
    couleur: "slate",
    features: [
      {
        icon: "🔐",
        titre: "Auth simple",
        description: "Login Membre PA (pa / associe) ou Animateur (df / dfdf)",
      },
      {
        icon: "🛡️",
        titre: "Anti-référencement",
        description: "noindex global, robots.txt, header X-Robots-Tag",
      },
      {
        icon: "👥",
        titre: "Middleware par rôle",
        description: "Routes animateur protégées du membre et vice-versa",
      },
      {
        icon: "⚙️",
        titre: "Paramètres centralisés",
        description: "Email animateur, agenda Google, véhicule électrique, point de départ",
        url: "/animateur/parametres",
      },
    ],
  },
  {
    titre: "Installation & Performance",
    icon: "📱",
    couleur: "cyan",
    features: [
      {
        icon: "📱",
        titre: "PWA installable",
        description: "Sur iOS et Android comme une vraie app",
      },
      {
        icon: "⚡",
        titre: "Service worker",
        description: "Cache des assets statiques pour usage offline-light",
      },
      {
        icon: "🎨",
        titre: "Icône custom PA",
        description: "Sur fond bleu nuit, écran d'accueil mobile",
      },
      {
        icon: "🚀",
        titre: "Vercel + auto-deploy",
        description: "Push sur main → prod en 60s",
      },
    ],
  },
  {
    titre: "Design & ergonomie",
    icon: "✨",
    couleur: "violet",
    features: [
      {
        icon: "🎨",
        titre: "Design pastel premium",
        description: "Cartes glassmorphism, aurora animée, badges arrondis, icônes Lucide — cohérence sur tout l'espace animateur",
        tag: "nouveau",
      },
      {
        icon: "📦",
        titre: "Tuiles repliables",
        description: "Dashboard en tuiles compactes à l'ouverture : Préparation J-1, RDV, Visites, Activité récente",
        tag: "nouveau",
      },
      {
        icon: "🖨️",
        titre: "Impression & PDF",
        description: "Rapport d'activité optimisé pour impression : fond blanc, cartes sans blur, coupures de page évitées",
        tag: "nouveau",
      },
      {
        icon: "📱",
        titre: "Responsive complet",
        description: "Cartes, tableaux et grilles adaptés mobile → desktop avec vues compactes sur petits écrans",
      },
    ],
  },
];

// ─── Palette glossy ───────────────────────────────────────────────────────────

type Gloss = { clair: string; base: string; fg: string; soft: string };

function couleurGloss(name: string): Gloss {
  const MAP: Record<string, Gloss> = {
    blue:    { clair: "#8FC0F5", base: "#3D7BE8", fg: "#2D6FD0", soft: "#E4F0FB" },
    emerald: { clair: "#6FD9B0", base: "#1FA98A", fg: "#0F8C68", soft: "#D2F2E7" },
    green:   { clair: "#6FD9B0", base: "#1FA98A", fg: "#0F8C68", soft: "#D2F2E7" },
    amber:   { clair: "#F6C97A", base: "#E8943A", fg: "#B07D14", soft: "#FBF1D8" },
    yellow:  { clair: "#F6C97A", base: "#E8943A", fg: "#B07D14", soft: "#FBF1D8" },
    orange:  { clair: "#F6C97A", base: "#E8943A", fg: "#B07D14", soft: "#FBF1D8" },
    purple:  { clair: "#A79BF0", base: "#6B4FD8", fg: "#534AB7", soft: "#EDEBFB" },
    violet:  { clair: "#A79BF0", base: "#6B4FD8", fg: "#534AB7", soft: "#EDEBFB" },
    indigo:  { clair: "#A79BF0", base: "#6B4FD8", fg: "#534AB7", soft: "#EDEBFB" },
    red:     { clair: "#F0A0A0", base: "#D85C5C", fg: "#C0476E", soft: "#FBE0E8" },
    cyan:    { clair: "#8FC0F5", base: "#3D7BE8", fg: "#2D6FD0", soft: "#E4F0FB" },
  };
  return MAP[name] ?? { clair: "#C8C6D6", base: "#8B8699", fg: "#6F6982", soft: "#ECEAF3" };
}

// ─── Composants locaux ────────────────────────────────────────────────────────

function GlossyPill({
  width,
  height,
  radius,
  bg,
  shadow,
  reflectOpacity = 0.85,
  children,
}: {
  width: number;
  height: number;
  radius: number;
  bg: string;
  shadow?: string;
  reflectOpacity?: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: radius,
        background: bg,
        boxShadow: shadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,${reflectOpacity}), transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <span style={{ position: "relative", zIndex: 1, lineHeight: 1 }}>
        {children}
      </span>
    </div>
  );
}

function TagBadge({ tag }: { tag: Tag }) {
  if (tag === "stable") return null;
  if (tag === "nouveau") {
    return (
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
        style={{ background: "#EDEBFB", color: "#6B4FD8" }}
      >
        Nouveau
      </span>
    );
  }
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: "#FBF1D8", color: "#B07D14" }}
    >
      Bêta
    </span>
  );
}

// ─── Schéma : flux remontée → action ──────────────────────────────────────────

const FLUX_NODES = [
  { emoji: "📢", titre: "Remontée", sous: "Le terrain alerte", clair: "#F6C97A", base: "#E8943A" },
  { emoji: "🧭", titre: "Décision", sous: "Tu évalues",        clair: "#C8C6D6", base: "#8B8699" },
  { emoji: "📋", titre: "Action",   sous: "Tu crées la tâche", clair: "#8FC0F5", base: "#3D7BE8" },
  { emoji: "✅", titre: "Clôture",  sous: "Traitée + Réalisée", clair: "#6FD9B0", base: "#1FA98A" },
];

function FluxRemonteeAction() {
  return (
    <section
      className="rounded-[22px] p-5 space-y-4"
      style={{
        background: "rgba(255,255,255,0.52)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(255,255,255,0.68)",
        boxShadow: "0 6px 24px -10px rgba(80,60,140,0.16)",
      }}
    >
      {/* En-tête */}
      <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--pa-line)" }}>
        <GlossyPill width={40} height={40} radius={14} bg="linear-gradient(135deg,#A79BF0,#6B4FD8)" shadow="0 6px 16px -6px #6B4FD8">
          <span style={{ fontSize: 20 }}>🔄</span>
        </GlossyPill>
        <div>
          <h2 className="font-bold text-base" style={{ color: "var(--pa-ink)" }}>Remontée → Action : comment ça circule</h2>
          <p className="text-xs" style={{ color: "var(--pa-muted)" }}>Du signal terrain à la tâche réalisée</p>
        </div>
      </div>

      {/* Flux glossy */}
      <div className="flex flex-wrap items-start justify-center gap-2 sm:gap-3 pt-1">
        {FLUX_NODES.map((n, i) => (
          <Fragment key={n.titre}>
            <div className="flex flex-col items-center text-center" style={{ width: 104 }}>
              <GlossyPill width={52} height={52} radius={17} bg={`linear-gradient(135deg, ${n.clair}, ${n.base})`} shadow={`0 6px 16px -6px ${n.base}`}>
                <span style={{ fontSize: 22 }}>{n.emoji}</span>
              </GlossyPill>
              <p className="text-sm font-bold mt-2" style={{ color: "var(--pa-ink)" }}>{n.titre}</p>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--pa-muted)" }}>{n.sous}</p>
            </div>
            {i < FLUX_NODES.length - 1 && (
              <ArrowRight size={18} strokeWidth={2.5} style={{ color: "#C8C4D6", marginTop: 18, flexShrink: 0 }} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Cycles de vie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl px-3 py-2.5" style={{ background: "#FBF1D8", border: "1px solid rgba(176,125,20,.2)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#B07D14" }}>Cycle remontée</p>
          <p className="text-xs mt-0.5" style={{ color: "#9A7416" }}>nouvelle → en cours → traitée → archivée</p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: "#E4F0FB", border: "1px solid rgba(45,111,208,.2)" }}>
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#2D6FD0" }}>Cycle action</p>
          <p className="text-xs mt-0.5" style={{ color: "#2D6FD0" }}>ouverte → en cours → réalisée</p>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: "var(--pa-muted)" }}>
        💡 Une remontée peut <strong style={{ color: "var(--pa-ink)" }}>déclencher une action</strong> — ou se clore par une simple réponse.
      </p>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FonctionnalitesPage() {
  const total = CATEGORIES.reduce((s, c) => s + c.features.length, 0);
  const nouveaux = CATEGORIES.reduce(
    (s, c) => s + c.features.filter((f) => f.tag === "nouveau").length,
    0
  );

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

        {/* En-tête */}
        <div>
          <Link
            href="/animateur"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--pa-muted)" }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour dashboard
          </Link>
          <div className="flex items-center gap-2.5 mt-2">
            <Zap size={22} strokeWidth={2} style={{ color: "#534AB7", flexShrink: 0 }} />
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}
            >
              Fonctionnalités de l&apos;app
            </h1>
          </div>
          <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "var(--pa-muted)" }}>
            Vue d&apos;ensemble de toutes les capacités côté animateur.{" "}
            <span style={{ color: "var(--pa-ink)", fontWeight: 600 }}>{total} fonctionnalités</span>{" "}
            en{" "}
            <span style={{ color: "var(--pa-ink)", fontWeight: 600 }}>{CATEGORIES.length} catégories</span>
            {nouveaux > 0 && (
              <>
                {" "}·{" "}
                <span style={{ color: "#6B4FD8", fontWeight: 600 }}>{nouveaux} nouvelles</span>
              </>
            )}
          </p>
        </div>

        <div style={{ paddingTop: "12px" }}>
          <Navigation />
        </div>

        {/* Schéma : flux remontée → action */}
        <FluxRemonteeAction />

        {/* Grille des catégories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {CATEGORIES.map((cat) => {
            const g = couleurGloss(cat.couleur);
            return (
              <section
                key={cat.titre}
                className="rounded-[22px] p-5 space-y-4"
                style={{
                  background: "rgba(255,255,255,0.52)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.68)",
                  boxShadow: "0 6px 24px -10px rgba(80,60,140,0.16)",
                }}
              >
                {/* En-tête catégorie */}
                <div
                  className="flex items-center gap-3 pb-3"
                  style={{ borderBottom: "1px solid var(--pa-line)" }}
                >
                  <GlossyPill
                    width={40}
                    height={40}
                    radius={14}
                    bg={`linear-gradient(135deg, ${g.clair}, ${g.base})`}
                    shadow={`0 6px 16px -6px ${g.base}`}
                  >
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  </GlossyPill>
                  <div>
                    <h2 className="font-bold text-base" style={{ color: "var(--pa-ink)" }}>
                      {cat.titre}
                    </h2>
                    <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
                      {cat.features.length} fonctionnalité{cat.features.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Grille de fonctionnalités */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.features.map((f) => {
                    const cardContent = (
                      <div
                        className="pa-card rounded-2xl p-4 flex flex-col gap-2 h-full transition-transform hover:-translate-y-0.5"
                        style={{ cursor: f.url ? "pointer" : "default" }}
                      >
                        {/* Ligne haute : petite pastille + badges + flèche */}
                        <div className="flex items-start justify-between gap-2">
                          <GlossyPill
                            width={28}
                            height={28}
                            radius={9}
                            bg={g.soft}
                            reflectOpacity={0.7}
                          >
                            <span style={{ fontSize: 14 }}>{f.icon}</span>
                          </GlossyPill>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {f.tag && <TagBadge tag={f.tag} />}
                            {f.url && (
                              <ArrowUpRight
                                size={14}
                                strokeWidth={2.5}
                                style={{ color: g.fg, flexShrink: 0 }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Texte */}
                        <p
                          className="text-sm font-semibold leading-snug"
                          style={{ color: "var(--pa-ink)" }}
                        >
                          {f.titre}
                        </p>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: "var(--pa-muted)" }}
                        >
                          {f.description}
                        </p>
                      </div>
                    );

                    return f.url ? (
                      <Link key={f.titre} href={f.url} style={{ display: "contents" }}>
                        {cardContent}
                      </Link>
                    ) : (
                      <div key={f.titre}>{cardContent}</div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center pt-4" style={{ borderTop: "1px solid var(--pa-line)" }}>
          <p className="text-xs" style={{ color: "var(--pa-muted)" }}>
            Animation réseau Piscinistes Associés ·{" "}
            {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </div>

      </div>
    </main>
  );
}
