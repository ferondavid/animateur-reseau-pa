"use server";

import { setSession, clearSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParametre } from "@/lib/parametres";
import { envoyerEmail } from "@/lib/email";

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function demanderAideConnexion(
  _prev: { ok?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const email = String(formData.get("email") || "").trim();
  const profil = String(formData.get("profil") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Renseigne une adresse email valide." };
  }

  const admin = (await getParametre("animateur_email", "")) || "feron.david@gmail.com";

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#2A2540">
      <div style="background:linear-gradient(135deg,#6B4FD8,#7C6BE8);border-radius:16px 16px 0 0;padding:22px 24px">
        <p style="margin:0;color:#fff;font-size:18px;font-weight:700">🔑 Demande d'aide à la connexion</p>
        <p style="margin:4px 0 0;color:rgba(255,255,255,.85);font-size:13px">Animation Réseau PA</p>
      </div>
      <div style="background:#F7F5FC;border:1px solid #E9E5F3;border-top:none;border-radius:0 0 16px 16px;padding:22px 24px">
        <p style="margin:0 0 14px;font-size:14px;color:#8B8699">Un utilisateur a oublié ses identifiants et demande de l'aide :</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#8B8699;width:120px">Email</td><td style="padding:8px 0;font-weight:600"><a href="mailto:${escapeHtml(email)}" style="color:#6B4FD8;text-decoration:none">${escapeHtml(email)}</a></td></tr>
          ${profil ? `<tr><td style="padding:8px 0;color:#8B8699">Profil</td><td style="padding:8px 0;font-weight:600">${escapeHtml(profil)}</td></tr>` : ""}
          ${message ? `<tr><td style="padding:8px 0;color:#8B8699;vertical-align:top">Message</td><td style="padding:8px 0">${escapeHtml(message)}</td></tr>` : ""}
        </table>
        <p style="margin:18px 0 0;font-size:13px;color:#8B8699">Réponds directement à cette personne pour lui communiquer ses accès.</p>
      </div>
    </div>`;

  const res = await envoyerEmail({
    destinataires: [admin],
    sujet: "🔑 Demande d'aide connexion — Animation Réseau PA",
    htmlBody: html,
  });

  if (!res.ok && !res.skipped) {
    return { error: "Envoi impossible pour le moment. Réessaie dans un instant." };
  }
  return { ok: true };
}
