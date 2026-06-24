import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { getVisibilite, peutVoir } from "@/lib/visibilite";
import NavigationClient from "./NavigationClient";

// Mapping clé visibilité → href dans TOUS_LIENS (href d'origine, avant remap bureau)
const BUREAU_HREF_MAP: Record<string, string> = {
  bureau_accueil:     "/animateur",
  bureau_carte:       "/animateur/carte",
  bureau_pilotage:    "/pilotage",
  bureau_sante:       "/animateur/sante",
  bureau_classement:  "/animateur/classement",
  bureau_rdv:         "/animateur/rdv",
  bureau_tournee:     "/animateur/tournee",
  bureau_suggestion:  "/animateur/tournee/suggestion",
  bureau_parcours:    "/animateur/parcours",
  bureau_visites:     "/visites",
  bureau_actions:     "/actions-reseau",
  bureau_remontees:   "/remontees",
  bureau_news:        "/animateur/news",
  bureau_evaluations: "/evaluations",
  bureau_magasins:    "/magasins",
  bureau_rapport:     "/animateur/rapport",
  bureau_notes:       "/animateur/notes",
};

export default async function Navigation() {
  const [session, vis, supabase] = await Promise.all([
    getSession(),
    getVisibilite(),
    createClient(),
  ]);

  const [{ count: nbRemontees }, { count: nbRDV }] = await Promise.all([
    supabase
      .from("remontees")
      .select("*", { count: "exact", head: true })
      .eq("statut", "nouvelle"),
    supabase
      .from("rendez_vous")
      .select("*", { count: "exact", head: true })
      .in("statut", ["demande", "reporte"]),
  ]);

  const hrefsMasques: string[] =
    session?.role === "bureau"
      ? Object.entries(BUREAU_HREF_MAP)
          .filter(([cle]) => !peutVoir(vis, cle, "bureau"))
          .map(([, href]) => href)
      : [];

  return (
    <NavigationClient
      nbNouvellesRemontees={nbRemontees ?? 0}
      nbRDVEnAttente={nbRDV ?? 0}
      role={session?.role ?? "animateur"}
      hrefsMasques={hrefsMasques}
    />
  );
}
