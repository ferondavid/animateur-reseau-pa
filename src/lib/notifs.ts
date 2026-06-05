import { createClient } from "@/lib/supabase/server";
import { envoyerEmail } from "./email";
import { genererInvitationIcs } from "./ical-invite";

const ANIMATEUR_EMAIL = process.env.ANIMATEUR_EMAIL ?? "animateur@piscinistes-associes.fr";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://animateur-reseau-pa.vercel.app";

function htmlLayout(titre: string, body: string, ctaUrl?: string, ctaLabel?: string): string {
  const cta =
    ctaUrl && ctaLabel
      ? `<div style="margin-top:24px"><a href="${ctaUrl}" style="display:inline-block;padding:10px 20px;background:#1e293b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">${ctaLabel} →</a></div>`
      : "";
  return `<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#ffffff">
  <div style="background:#1e293b;padding:20px 24px;border-radius:12px 12px 0 0">
    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700">${titre}</p>
  </div>
  <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    ${body}
    ${cta}
    <p style="margin-top:24px;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;padding-top:12px">
      Animateur Réseau PA · <a href="${APP_URL}" style="color:#94a3b8">${APP_URL}</a>
    </p>
  </div>
</div>`;
}

// ── 1. REMONTÉE URGENTE ──────────────────────────────────────────────────────

export async function notifierRemonteeUrgente(remonteeId: string): Promise<void> {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("remontees")
    .select("id, titre, description, gravite, magasins(nom, enseigne, ville)")
    .eq("id", remonteeId)
    .single();

  if (!r || r.gravite !== "urgente") return;

  const mag = r.magasins as unknown as { nom: string; enseigne?: string | null; ville?: string | null } | null;
  const enseigne = mag?.enseigne || mag?.nom || "Magasin";

  const html = htmlLayout(
    "🚨 Remontée urgente",
    `<p style="color:#1e293b;margin:0 0 16px">
      <strong>${enseigne}</strong>${mag?.ville ? ` · ${mag.ville}` : ""} vient de remonter un sujet urgent.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:8px">
      <p style="margin:0;font-weight:600;color:#1e293b">${r.titre as string}</p>
      ${r.description ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;white-space:pre-wrap">${r.description as string}</p>` : ""}
    </div>`,
    `${APP_URL}/animateur`,
    "Traiter la remontée"
  );

  const result = await envoyerEmail({
    destinataires: [ANIMATEUR_EMAIL],
    sujet: `🚨 [URGENT] ${r.titre as string} — ${enseigne}`,
    htmlBody: html,
  });
  console.log("[NOTIF] remontée urgente :", result);
}

// ── 2. NOUVEAU RDV DEMANDÉ PAR UN MAGASIN ───────────────────────────────────

export async function notifierNouveauRDVMagasin(rdvId: string): Promise<void> {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("rendez_vous")
    .select(
      "id, type, date_souhaitee, heure_souhaitee, objet, message, demandeur_type, magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville)"
    )
    .eq("id", rdvId)
    .single();

  if (!r || r.demandeur_type !== "magasin") return;

  const mag = r.magasins as unknown as { nom: string; enseigne?: string | null; ville?: string | null } | null;
  const enseigne = mag?.enseigne || mag?.nom || "Magasin";

  const dateStr = r.date_souhaitee as string;
  const [y, m, d] = dateStr.split("-");
  const dateLisible = `${d}/${m}/${y}`;
  const heureLisible = r.heure_souhaitee ? (r.heure_souhaitee as string).slice(0, 5) : null;
  const typeLabel: Record<string, string> = {
    physique: "🏪 Physique",
    tel: "📞 Téléphone",
    visio: "💻 Visio",
  };

  const html = htmlLayout(
    "📅 Demande de RDV",
    `<p style="color:#1e293b;margin:0 0 16px">
      <strong>${enseigne}</strong>${mag?.ville ? ` · ${mag.ville}` : ""} demande un rendez-vous.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:8px">
      <p style="margin:0;font-weight:600;color:#1e293b">${r.objet as string}</p>
      <p style="margin:8px 0 0;color:#475569;font-size:14px">
        ${typeLabel[r.type as string] ?? r.type} · ${dateLisible}${heureLisible ? ` à ${heureLisible}` : ""}
      </p>
      ${r.message ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;white-space:pre-wrap">"${r.message as string}"</p>` : ""}
    </div>`,
    `${APP_URL}/animateur/rdv?tab=attente`,
    "Voir et confirmer"
  );

  const result = await envoyerEmail({
    destinataires: [ANIMATEUR_EMAIL],
    sujet: `📅 Nouvelle demande de RDV — ${enseigne}`,
    htmlBody: html,
  });
  console.log("[NOTIF] nouveau RDV magasin :", result);
}

// ── 3. RDV CONFIRMÉ → EMAIL + INVITATION .ICS ───────────────────────────────

export async function notifierConfirmationRDV(rdvId: string): Promise<void> {
  const supabase = await createClient();
  const { data: r } = await supabase
    .from("rendez_vous")
    .select(
      "id, type, date_souhaitee, heure_souhaitee, objet, message, lieu, lien_visio, magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville, contact_email, contact_nom)"
    )
    .eq("id", rdvId)
    .single();

  if (!r) return;

  const mag = r.magasins as unknown as {
    nom: string;
    enseigne?: string | null;
    ville?: string | null;
    contact_email?: string | null;
    contact_nom?: string | null;
  } | null;
  const enseigne = mag?.enseigne || mag?.nom || "Magasin";

  const dateStr = r.date_souhaitee as string;
  const [aaaa, mm, jj] = dateStr.split("-").map(Number);
  const heureStr = r.heure_souhaitee as string | null;

  let debut: Date;
  if (heureStr) {
    const [h, mn] = heureStr.slice(0, 5).split(":").map(Number);
    // v1 approximation UTC : -1h (correct CET/UTC+1, approx CEST/UTC+2)
    debut = new Date(Date.UTC(aaaa, mm - 1, jj, h - 1, mn));
  } else {
    debut = new Date(Date.UTC(aaaa, mm - 1, jj, 8, 0));
  }
  const fin = new Date(debut.getTime() + 60 * 60 * 1000);

  const typeLabel: Record<string, string> = {
    physique: "Physique",
    tel: "Téléphone",
    visio: "Visio",
  };
  const titre = `RDV ${typeLabel[r.type as string] ?? r.type} · ${r.objet} — ${enseigne}`;
  const lieu =
    r.type === "visio"
      ? (r.lien_visio as string | null) ?? "Lien à venir"
      : r.type === "tel"
        ? "Appel téléphonique"
        : (r.lieu as string | null) ?? `Au magasin ${mag?.ville ?? ""}`.trim();

  const descParts: string[] = [
    `Type : ${typeLabel[r.type as string] ?? r.type}`,
    `Magasin : ${enseigne}${mag?.ville ? ` · ${mag.ville}` : ""}`,
  ];
  if (r.lien_visio) descParts.push(`Lien : ${r.lien_visio as string}`);
  if (r.message) { descParts.push(""); descParts.push(`Message :\n${r.message as string}`); }
  descParts.push(""); descParts.push(`Voir dans l'app : ${APP_URL}/animateur/rdv/${r.id}`);
  const description = descParts.join("\n");

  const destinataires = [ANIMATEUR_EMAIL, mag?.contact_email].filter((e): e is string => !!e);

  const icsContent = genererInvitationIcs({
    uid: `rdv-${r.id}@animateur-reseau-pa.vercel.app`,
    titre,
    description,
    debut,
    fin,
    lieu,
    organisateurEmail: ANIMATEUR_EMAIL,
    organisateurNom: "Animateur Réseau PA",
    inviteEmails: destinataires,
    url: `${APP_URL}/animateur/rdv/${r.id}`,
  });

  const [y, m, d] = dateStr.split("-");
  const dateLisible = `${d}/${m}/${y}`;
  const heureLisible = heureStr ? heureStr.slice(0, 5) : null;

  const html = htmlLayout(
    "📅 RDV confirmé",
    `<p style="color:#1e293b;margin:0 0 16px">
      Le rendez-vous a été <strong>confirmé</strong>. L'invitation calendrier est jointe à cet email.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:12px 16px;border-radius:8px">
      <p style="margin:0;font-weight:600;color:#1e293b">${titre}</p>
      <p style="margin:8px 0 0;color:#475569;font-size:14px">📆 ${dateLisible}${heureLisible ? ` à ${heureLisible}` : ""}</p>
      <p style="margin:4px 0 0;color:#475569;font-size:14px">📍 ${lieu}</p>
    </div>
    <p style="margin:16px 0 0;color:#64748b;font-size:13px">
      Cliquez sur l'invitation jointe pour l'ajouter à votre agenda (Google Calendar, Outlook, Apple Calendar).
    </p>`,
    `${APP_URL}/animateur/rdv/${r.id}`,
    "Ouvrir dans l'app"
  );

  const result = await envoyerEmail({
    destinataires,
    sujet: `✓ RDV confirmé : ${r.objet as string} — ${enseigne}`,
    htmlBody: html,
    attachments: [
      {
        filename: `rdv-${r.id}.ics`,
        content: Buffer.from(icsContent).toString("base64"),
        contentType: "text/calendar; method=REQUEST; charset=utf-8",
      },
    ],
    icalEvent: true,
  });
  console.log("[NOTIF] confirmation RDV :", result);
}
