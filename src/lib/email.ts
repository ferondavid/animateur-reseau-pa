import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

export async function envoyerInvitationRDV({
  destinataires,
  sujet,
  htmlBody,
  icsContent,
  icsFilename,
}: {
  destinataires: string[];
  sujet: string;
  htmlBody: string;
  icsContent: string;
  icsFilename: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY manquant, email skipped");
    return { ok: false, skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
      to: destinataires,
      subject: sujet,
      html: htmlBody,
      attachments: [
        {
          filename: icsFilename,
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
      headers: {
        "Content-Class": "urn:content-classes:calendarmessage",
      },
    });
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[EMAIL] erreur Resend :", err);
    return { ok: false, error: err };
  }
}
