// Composant serveur : récupère le compteur de remontées nouvelles
// et délègue le rendu (avec état actif) au composant client NavigationClient.
import { createClient } from "@/lib/supabase/server";
import NavigationClient from "./NavigationClient";

export default async function Navigation() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("remontees")
    .select("*", { count: "exact", head: true })
    .eq("statut", "nouvelle");

  return <NavigationClient nbNouvellesRemontees={count ?? 0} />;
}
