type Attachment = {
  filename: string;
  content: string; // base64
  contentType?: string;
};

export async function envoyerEmail(opts: {
  destinataires: string[];
  sujet: string;
  htmlBody: string;
  attachments?: Attachment[];
  icalEvent?: boolean;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY manquant, email skipped");
    return { ok: false, skipped: true };
  }

  const payload: Record<string, unknown> = {
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to: opts.destinataires.filter(Boolean),
    subject: opts.sujet,
    html: opts.htmlBody,
  };

  if (opts.attachments?.length) {
    payload.attachments = opts.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      ...(a.contentType ? { content_type: a.contentType } : {}),
    }));
  }

  if (opts.icalEvent) {
    payload.headers = { "Content-Class": "urn:content-classes:calendarmessage" };
  }

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
      console.error("[EMAIL] erreur Resend :", res.status, err);
      return { ok: false, status: res.status, error: err };
    }

    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[EMAIL] erreur réseau :", err);
    return { ok: false, error: err };
  }
}
