export type InviteInput = {
  uid: string;
  titre: string;
  description: string;
  debut: Date;
  fin: Date;
  lieu?: string;
  organisateur: { email: string; nom: string };
  invites: { email: string; nom: string }[];
  url?: string;
  sequence?: number;
};

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function fold(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    out.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return out.join("\r\n");
}

function toIcalDate(d: Date): string {
  return d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

export function genererInvitation(input: InviteInput): string {
  const now = toIcalDate(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Animation PA//FR",
    "METHOD:REQUEST",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    fold(`UID:${input.uid}`),
    `DTSTAMP:${now}`,
    `DTSTART:${toIcalDate(input.debut)}`,
    `DTEND:${toIcalDate(input.fin)}`,
    `SEQUENCE:${input.sequence ?? 0}`,
    fold(`SUMMARY:${esc(input.titre)}`),
    fold(`DESCRIPTION:${esc(input.description)}`),
    ...(input.lieu ? [fold(`LOCATION:${esc(input.lieu)}`)] : []),
    ...(input.url ? [fold(`URL:${input.url}`)] : []),
    "STATUS:CONFIRMED",
    fold(`ORGANIZER;CN=${esc(input.organisateur.nom)}:mailto:${input.organisateur.email}`),
    ...input.invites.map((inv) =>
      fold(
        `ATTENDEE;CN=${esc(inv.nom)};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:${inv.email}`
      )
    ),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
