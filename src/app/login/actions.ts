"use server";

import { setSession, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginMembre(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const login = String(formData.get("login") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (login !== "pa" || password !== "associe") {
    return { error: "Identifiants incorrects" };
  }

  await setSession({ role: "membre" });
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
