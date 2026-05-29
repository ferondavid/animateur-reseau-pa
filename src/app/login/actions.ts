"use server";

import { createClient } from "@/lib/supabase/server";
import { setSession, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginMembre(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const cp = String(formData.get("cp") || "").trim();
  const password = String(formData.get("password") || "");

  if (!cp || !password) {
    return { error: "Code postal et mot de passe obligatoires" };
  }

  if (password !== "associe") {
    return { error: "Mot de passe incorrect" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("magasins")
    .select("id, code_postal")
    .eq("code_postal", cp)
    .eq("statut", "actif")
    .limit(1);

  if (error) {
    return { error: "Erreur de connexion à la base : " + error.message };
  }
  if (!data || data.length === 0) {
    return { error: "Aucune agence trouvée pour le code postal " + cp };
  }

  await setSession({ role: "membre", cp });
  redirect("/membre");
}

export async function loginAnimateur(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const login = String(formData.get("login") || "").trim();
  const password = String(formData.get("password") || "");

  if (login !== "df" || password !== "dfdf") {
    return { error: "Identifiants incorrects" };
  }

  await setSession({ role: "animateur" });
  redirect("/animateur");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
