export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/Navigation";
import BoutonAccueil from "@/components/BoutonAccueil";
import GestionNotifs, { type LigneNotif } from "@/components/GestionNotifs";
import { Bell } from "lucide-react";

type EventDef = Omit<LigneNotif, "actif">;

const EVENEMENTS: EventDef[] = [
  {
    cle: "notif_animateur_remontee_urgente",
    libelle: "Remontée urgente",
    description: "Push + email immédiat quand un associé soumet une remontée de gravité urgente.",
    categorie: "Animateur",
    canaux: ["push", "email"],
  },
  {
    cle: "notif_animateur_remontee_nouvelle",
    libelle: "Nouvelle remontée (non urgente)",
    description: "Notification pour toute remontée normale ou attention créée par un associé.",
    categorie: "Animateur",
    canaux: ["push", "email"],
  },
  {
    cle: "notif_animateur_rdv_demande",
    libelle: "Demande de RDV magasin",
    description: "Push + email quand un associé demande un rendez-vous via son espace.",
    categorie: "Animateur",
    canaux: ["push", "email"],
  },
  {
    cle: "notif_animateur_rdv_confirme",
    libelle: "RDV confirmé",
    description: "Email de confirmation + invitation .ics envoyée à l'animateur et au magasin.",
    categorie: "Animateur",
    canaux: ["push", "email"],
  },
  {
    cle: "notif_animateur_evaluation_nouvelle",
    libelle: "Nouvelle évaluation complétée",
    description: "Push quand un associé complète une évaluation d'accompagnement.",
    categorie: "Animateur",
    canaux: ["push"],
  },
  {
    cle: "notif_associe_rdv_confirme",
    libelle: "RDV confirmé par l'animateur",
    description: "L'associé reçoit un push dès que son rendez-vous est accepté.",
    categorie: "Associés",
    canaux: ["push"],
  },
  {
    cle: "notif_associe_rdv_reporte",
    libelle: "RDV reporté ou annulé",
    description: "L'associé est notifié si son RDV est modifié, reporté ou annulé.",
    categorie: "Associés",
    canaux: ["push"],
  },
  {
    cle: "notif_associe_news_nouvelle",
    libelle: "Nouvelle actualité publiée",
    description: "Push envoyé à tous les associés abonnés lors de la publication d'une news.",
    categorie: "Associés",
    canaux: ["push"],
  },
  {
    cle: "notif_associe_remontee_traitee",
    libelle: "Remontée prise en charge",
    description: "L'associé reçoit un push quand l'animateur traite ou répond à sa remontée.",
    categorie: "Associés",
    canaux: ["push"],
  },
];

export default async function NotifsPage() {
  const supabase = await createClient();

  const { data: params } = await supabase
    .from("parametres")
    .select("key, value")
    .like("key", "notif_%");

  const map = new Map((params ?? []).map((p: { key: string; value: string }) => [p.key, p.value]));

  const lignes: LigneNotif[] = EVENEMENTS.map((e) => ({
    ...e,
    actif: map.get(e.cle) === "true",
  }));

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <BoutonAccueil />

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)", letterSpacing: "-0.3px" }}>
            <Bell size={22} style={{ color: "#6B4FD8" }} /> Notifications
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--pa-muted)" }}>
            Active les événements qui déclenchent un push ou un email. Tout est off par défaut.
          </p>
        </div>

        <Navigation />

        <GestionNotifs lignes={lignes} />
      </div>
    </main>
  );
}
