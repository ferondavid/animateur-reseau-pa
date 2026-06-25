import { createClient } from "@/lib/supabase/server";
import { envoyerEmail } from "./email";
import { envoyerPush } from "./push";
import { genererInvitationIcs } from "./ical-invite";
import { getParametre } from "./parametres";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://animateur-reseau-pa.vercel.app";

async function emailAnimateur(): Promise<string> {
  return await getParametre("animateur_email", "");
}

async function notifActive(cle: string): Promise<boolean> {
  const v = await getParametre(cle, "false");
  return v === "true" || v === "1";
}

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
  if (!(await notifActive("notif_animateur_remontee_urgente"))) return;

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("remontees")
    .select("id, titre, description, gravite, magasins(nom, enseigne, ville)")
    .eq("id", remonteeId)
    .single();

  if (!r || r.gravite !== "urgente") return;

  const mag = r.magasins as unknown as { nom: string; enseigne?: string | null; ville?: string | null } | null;
  const enseigne = mag?.enseigne || mag?.nom || "Magasin";

  await envoyerPush({
    title: "🚨 Remontée urgente",
    body: `${enseigne}${mag?.ville ? ` · ${mag.ville}` : ""} — ${r.titre as string}`,
    url: `${APP_URL}/animateur`,
    tag: "remontee-urgente",
  });

  const animEmail = await emailAnimateur();
  if (!animEmail) return;

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
    destinataires: [animEmail],
    sujet: `🚨 [URGENT] ${r.titre as string} — ${enseigne}`,
    htmlBody: html,
  });
  console.log("[NOTIF] remontée urgente :", result);
}

// ── 2. NOUVEAU RDV DEMANDÉ PAR UN MAGASIN ───────────────────────────────────

export async function notifierNouveauRDVMagasin(rdvId: string): Promise<void> {
  if (!(await notifActive("notif_animateur_rdv_demande"))) return;

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

  await envoyerPush({
    title: "📅 Demande de RDV",
    body: `${enseigne}${mag?.ville ? ` · ${mag.ville}` : ""} — ${r.objet as string}`,
    url: `${APP_URL}/animateur/rdv?tab=attente`,
    tag: "rdv-demande",
  });

  const animEmail = await emailAnimateur();
  if (!animEmail) return;

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
    destinataires: [animEmail],
    sujet: `📅 Nouvelle demande de RDV — ${enseigne}`,
    htmlBody: html,
  });
  console.log("[NOTIF] nouveau RDV magasin :", result);
}

// ── 3. RDV CONFIRMÉ → EMAIL + INVITATION .ICS ───────────────────────────────

export async function notifierConfirmationRDV(rdvId: string): Promise<void> {
  if (!(await notifActive("notif_animateur_rdv_confirme"))) return;
  const animEmail = await emailAnimateur();

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

  const destinataires = [animEmail, mag?.contact_email].filter((e): e is string => !!e);
  if (destinataires.length === 0) return;

  const icsContent = genererInvitationIcs({
    uid: `rdv-${r.id}@animateur-reseau-pa.vercel.app`,
    titre,
    description,
    debut,
    fin,
    lieu,
    organisateurEmail: animEmail || "animateur@piscinistes-associes.fr",
    organisateurNom: "Animateur Réseau PA",
    inviteEmails: destinataires,
    url: `${APP_URL}/animateur/rdv/${r.id}`,
  });

  const [y, mth, dy] = dateStr.split("-");
  const dateLisible = `${dy}/${mth}/${y}`;
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

// ── 4. NOUVELLE REMONTÉE (NON URGENTE) → PUSH + EMAIL ANIMATEUR ─────────────

export async function notifierNouvelleRemontee(remonteeId: string): Promise<void> {
  if (!(await notifActive("notif_animateur_remontee_nouvelle"))) return;

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("remontees")
    .select("id, titre, description, gravite, type, magasins(nom, enseigne, ville)")
    .eq("id", remonteeId)
    .single();

  // Urgente = déjà couverte par notifierRemonteeUrgente
  if (!r || r.gravite === "urgente") return;

  const mag = r.magasins as unknown as { nom: string; enseigne?: string | null; ville?: string | null } | null;
  const enseigne = mag?.enseigne || mag?.nom || "Magasin";
  const graviteLabel = r.gravite === "attention" ? "⚠️ Attention" : "ℹ️ Normale";

  await envoyerPush({
    title: "📣 Nouvelle remontée",
    body: `${enseigne}${mag?.ville ? ` · ${mag.ville}` : ""} — ${r.titre as string}`,
    url: `${APP_URL}/remontees/${remonteeId}`,
    tag: "remontee-nouvelle",
  });

  const animEmail = await emailAnimateur();
  if (!animEmail) return;

  const html = htmlLayout(
    "📣 Nouvelle remontée terrain",
    `<p style="color:#1e293b;margin:0 0 16px">
      <strong>${enseigne}</strong>${mag?.ville ? ` · ${mag.ville}` : ""} a créé une remontée terrain.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:8px">
      <p style="margin:0;font-weight:600;color:#1e293b">${r.titre as string}</p>
      <p style="margin:6px 0 0;color:#475569;font-size:13px">${graviteLabel}</p>
      ${r.description ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;white-space:pre-wrap">${r.description as string}</p>` : ""}
    </div>`,
    `${APP_URL}/remontees/${remonteeId}`,
    "Voir la remontée"
  );

  await envoyerEmail({
    destinataires: [animEmail],
    sujet: `📣 ${r.titre as string} — ${enseigne}`,
    htmlBody: html,
  });
}

// ── 5. NOUVELLE ÉVALUATION → PUSH + EMAIL ANIMATEUR ─────────────────────────

export async function notifierNouvelleEvaluation(visiteId: string, magasinId: string): Promise<void> {
  if (!(await notifActive("notif_animateur_evaluation_nouvelle"))) return;

  const supabase = await createClient();
  const { data: mag } = await supabase
    .from("magasins")
    .select("nom, enseigne, ville")
    .eq("id", magasinId)
    .single();

  const m = mag as { nom: string; enseigne?: string | null; ville?: string | null } | null;
  const enseigne = m?.enseigne || m?.nom || "Magasin";

  await envoyerPush({
    title: "⭐ Nouvelle évaluation",
    body: `${enseigne}${m?.ville ? ` · ${m.ville}` : ""} a complété l'évaluation d'accompagnement`,
    url: `${APP_URL}/evaluations`,
    tag: "evaluation-nouvelle",
  });

  const animEmail = await emailAnimateur();
  if (!animEmail) return;

  const html = htmlLayout(
    "⭐ Nouvelle évaluation d'accompagnement",
    `<p style="color:#1e293b;margin:0 0 16px">
      <strong>${enseigne}</strong>${m?.ville ? ` · ${m.ville}` : ""} vient de compléter l'évaluation de l'accompagnement.
    </p>
    <p style="color:#475569;font-size:14px">Consultez les résultats dans l'espace Évaluations.</p>`,
    `${APP_URL}/evaluations`,
    "Voir les évaluations"
  );

  await envoyerEmail({
    destinataires: [animEmail],
    sujet: `⭐ Nouvelle évaluation — ${enseigne}`,
    htmlBody: html,
  });
}

// ── 6. RDV CONFIRMÉ → PUSH ASSOCIÉ ──────────────────────────────────────────

export async function notifierRDVConfirmeAssoc(rdvId: string): Promise<void> {
  if (!(await notifActive("notif_associe_rdv_confirme"))) return;

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("rendez_vous")
    .select("objet, magasin_id, magasins!rendez_vous_magasin_id_fkey(nom, enseigne)")
    .eq("id", rdvId)
    .single();
  if (!r?.magasin_id) return;

  const mag = r.magasins as unknown as { nom: string; enseigne?: string | null } | null;
  const enseigne = mag?.enseigne || mag?.nom || "Votre magasin";

  await envoyerPush(
    { title: "✅ RDV confirmé", body: `${enseigne} — ${r.objet as string}`, url: `/membre/${r.magasin_id as string}`, tag: "rdv-confirme" },
    "associe",
    r.magasin_id as string
  );
}

// ── 5. RDV REPORTÉ / ANNULÉ → PUSH ASSOCIÉ ──────────────────────────────────

export async function notifierRDVReporteAssoc(rdvId: string): Promise<void> {
  if (!(await notifActive("notif_associe_rdv_reporte"))) return;

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("rendez_vous")
    .select("objet, statut, magasin_id, magasins!rendez_vous_magasin_id_fkey(nom, enseigne)")
    .eq("id", rdvId)
    .single();
  if (!r?.magasin_id) return;

  const mag = r.magasins as unknown as { nom: string; enseigne?: string | null } | null;
  const enseigne = mag?.enseigne || mag?.nom || "Votre magasin";
  const label = r.statut === "annule" ? "annulé" : "reporté";

  await envoyerPush(
    { title: `📅 RDV ${label}`, body: `${enseigne} — ${r.objet as string}`, url: `/membre/${r.magasin_id as string}`, tag: "rdv-reporte" },
    "associe",
    r.magasin_id as string
  );
}

// ── 6. NEWS PUBLIÉE → PUSH TOUS LES ASSOCIÉS ─────────────────────────────────

export async function notifierNewsPubliee(newsId: string): Promise<void> {
  if (!(await notifActive("notif_associe_news_nouvelle"))) return;

  const supabase = await createClient();
  const { data: n } = await supabase
    .from("news")
    .select("titre")
    .eq("id", newsId)
    .single();
  if (!n) return;

  await envoyerPush(
    { title: "📰 Nouvelle actualité", body: n.titre as string, url: "/news", tag: "news" },
    "associe"
  );
}

// ── 7. REMONTÉE TRAITÉE → PUSH ASSOCIÉ ───────────────────────────────────────

export async function notifierRemonteeTraitee(remonteeId: string): Promise<void> {
  if (!(await notifActive("notif_associe_remontee_traitee"))) return;

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("remontees")
    .select("titre, magasin_id")
    .eq("id", remonteeId)
    .single();
  if (!r?.magasin_id) return;

  await envoyerPush(
    { title: "✅ Remontée prise en charge", body: r.titre as string, url: `/membre/${r.magasin_id as string}`, tag: "remontee-traitee" },
    "associe",
    r.magasin_id as string
  );
}
