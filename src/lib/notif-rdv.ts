import { createClient } from "@/lib/supabase/server";
import { genererInvitation } from "@/lib/ical-invite";
import { envoyerInvitationRDV } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://animateur-reseau-pa.vercel.app";
const ANIMATEUR_EMAIL = process.env.ANIMATEUR_EMAIL ?? "animateur@piscinistes-associes.fr";

const TYPE_LABEL: Record<string, string> = {
  physique: "RDV Physique",
  tel: "RDV Téléphone",
  visio: "RDV Visio",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatHeure(heureStr: string | null): string | null {
  if (!heureStr) return null;
  return heureStr.slice(0, 5);
}

type MagasinRow = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  contact_email: string | null;
  contact_nom: string | null;
};

export async function notifierConfirmationRDV(rdvId: string): Promise<void> {
  const supabase = await createClient();

  const { data: rdv, error } = await supabase
    .from("rendez_vous")
    .select(
      `id, type, objet, message, date_souhaitee, heure_souhaitee, lieu, lien_visio,
       magasins!rendez_vous_magasin_id_fkey(id, nom, enseigne, ville, contact_email, contact_nom)`
    )
    .eq("id", rdvId)
    .single();

  if (error || !rdv) {
    console.error("[NOTIF-RDV] RDV introuvable :", rdvId, error);
    return;
  }

  const mag = rdv.magasins as unknown as MagasinRow | null;
  const enseigne = mag?.enseigne ?? mag?.nom ?? "Magasin";
  const nomMag = mag ? (mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom) : "Magasin";
  const typeLabel = TYPE_LABEL[rdv.type] ?? rdv.type;
  const titre = `${typeLabel} · ${rdv.objet} — ${enseigne}`;

  // Calcul DTSTART / DTEND
  const dateStr = rdv.date_souhaitee as string;
  const heureStr = rdv.heure_souhaitee as string | null;

  let debut: Date;
  let fin: Date;

  if (heureStr) {
    const [hh, mm] = heureStr.slice(0, 5).split(":").map(Number);
    debut = new Date(
      `${dateStr}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`
    );
    fin = new Date(debut.getTime() + 60 * 60 * 1000);
  } else {
    debut = new Date(`${dateStr}T09:00:00Z`);
    fin = new Date(`${dateStr}T10:00:00Z`);
  }

  // Lieu selon type
  let lieu: string | undefined;
  if (rdv.type === "physique") {
    lieu = (rdv.lieu as string | null) ?? (mag?.ville ? `Au magasin ${mag.ville}` : undefined);
  } else if (rdv.type === "visio") {
    lieu = (rdv.lien_visio as string | null) ?? "Lien à venir";
  } else {
    lieu = "Appel téléphonique";
  }

  const appUrl = `${APP_URL}/animateur/rdv/${rdvId}`;

  const descLines = [
    `Type : ${typeLabel}`,
    `Magasin : ${nomMag}`,
    ...(mag?.ville ? [`Ville : ${mag.ville}`] : []),
    "",
    ...(rdv.message ? [`Message :\n${rdv.message}`, ""] : []),
    `Voir : ${appUrl}`,
  ];
  const description = descLines.join("\n");

  // Destinataires
  const contactNom = mag?.contact_nom ?? "Contact magasin";
  const destinataires: string[] = [ANIMATEUR_EMAIL];
  if (mag?.contact_email) destinataires.push(mag.contact_email);

  const invites = [
    { email: ANIMATEUR_EMAIL, nom: "Animateur PA" },
    ...(mag?.contact_email ? [{ email: mag.contact_email, nom: contactNom }] : []),
  ];

  const icsContent = genererInvitation({
    uid: `rdv-${rdvId}@animateur-reseau-pa.vercel.app`,
    titre,
    description,
    debut,
    fin,
    lieu,
    organisateur: { email: ANIMATEUR_EMAIL, nom: "Animateur PA" },
    invites,
    url: appUrl,
  });

  // HTML email
  const dateLisible = formatDate(dateStr);
  const heureLisible = formatHeure(heureStr);

  const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:540px;padding:20px;color:#1e293b">
    <h2 style="margin:0 0 8px;font-size:18px">&#128197; RDV confirm&#233;</h2>
    <p style="color:#64748b;margin:0 0 20px">Une invitation calendrier est jointe &#224; cet email.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:0;font-weight:600">${titre}</p>
      <p style="margin:8px 0 0;color:#475569;font-size:14px">${dateLisible}${heureLisible ? " &#224; " + heureLisible : ""}</p>
      ${lieu ? `<p style="margin:8px 0 0;color:#475569;font-size:14px">&#128205; ${lieu}</p>` : ""}
    </div>
    <a href="${appUrl}"
       style="display:inline-block;padding:10px 20px;background:#1e293b;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
      Ouvrir dans l&#8217;app &#8594;
    </a>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">
      Cliquez sur l&#8217;invitation jointe pour ajouter le RDV &#224; votre agenda
      (Google Calendar, Outlook, Apple Calendar, etc.)
    </p>
  </div>`;

  const result = await envoyerInvitationRDV({
    destinataires,
    sujet: `📅 RDV confirmé : ${titre}`,
    htmlBody,
    icsContent,
    icsFilename: `rdv-${rdvId}.ics`,
  });

  console.log("[NOTIF-RDV] email envoyé :", result);
}
