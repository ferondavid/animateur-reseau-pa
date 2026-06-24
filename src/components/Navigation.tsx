import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import NavigationClient from "./NavigationClient";

export default async function Navigation() {
  const [session, supabase] = await Promise.all([
    getSession(),
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

  return (
    <NavigationClient
      nbNouvellesRemontees={nbRemontees ?? 0}
      nbRDVEnAttente={nbRDV ?? 0}
      role={session?.role ?? "animateur"}
    />
  );
}
