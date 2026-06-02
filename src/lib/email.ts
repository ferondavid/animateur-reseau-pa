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

  const payload = {
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
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[EMAIL] erreur Resend API :", res.status, err);
      return { ok: false, status: res.status, error: err };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[EMAIL] erreur réseau :", err);
    return { ok: false, error: err };
  }
}
