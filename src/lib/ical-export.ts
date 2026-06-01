const BASE_URL = "https://animateur-reseau-pa.vercel.app";

// ─── Helpers iCal ─────────────────────────────────────────────────────────────

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

function dtNow(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function dateToIcal(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function dtStart(date: string, heure: string | null): string {
  if (!heure) return `DTSTART;VALUE=DATE:${dateToIcal(date)}`;
  const h = heure.slice(0, 5).replace(":", "");
  return `DTSTART:${dateToIcal(date)}T${h}00`;
}

function dtEnd(date: string, heure: string | null, dureeMin = 60): string {
  if (!heure) {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    return `DTEND;VALUE=DATE:${d.toISOString().slice(0, 10).replace(/-/g, "")}`;
  }
  const [hh, mm] = heure.slice(0, 5).split(":").map(Number);
  const total = hh * 60 + mm + dureeMin;
  const eh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const em = String(total % 60).padStart(2, "0");
  return `DTEND:${dateToIcal(date)}T${eh}${em}00`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MagasinInfo = { nom: string; enseigne: string | null; ville?: string | null } | null;

export type RDVExport = {
  id: string;
  type: string;
  statut: string;
  date_souhaitee: string;
  heure_souhaitee: string | null;
  objet: string;
  message?: string | null;
  lieu?: string | null;
  magasins?: MagasinInfo;
};

export type VisiteExport = {
  id: string;
  date_prevue: string;
  objectif?: string | null;
  magasins?: { nom: string; enseigne: string | null } | null;
};

// ─── Labels & statuts RDV ─────────────────────────────────────────────────────

const RDV_SUMMARY_PREFIX: Record<string, string> = {
  physique: "🏪 [Phys]",
  tel:      "📞 [Tél]",
  visio:    "💻 [Visio]",
};

const RDV_TYPE_LABEL: Record<string, string> = {
  physique: "RDV physique",
  tel:      "RDV téléphone",
  visio:    "RDV visio",
};

const RDV_STATUS: Record<string, string> = {
  confirme: "CONFIRMED",
  demande:  "TENTATIVE",
  reporte:  "TENTATIVE",
};

// ─── Builder principal ────────────────────────────────────────────────────────

export function buildICalAnimateur(
  rdvs: RDVExport[],
  visites: VisiteExport[],
  calName = "Anim PA · Tout (RDV + visites)",
  appleColor = "#1E293B",
): string {
  const stamp = dtNow();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Animation reseau PA//FR",
    `X-WR-CALNAME:${calName}`,
    "X-WR-TIMEZONE:Europe/Paris",
    `X-APPLE-CALENDAR-COLOR:${appleColor}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const r of rdvs) {
    const mag = r.magasins;
    const nomMag = mag ? (mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom) : "?";
    const prefix = RDV_SUMMARY_PREFIX[r.type] ?? "📅";
    const typeLabel = RDV_TYPE_LABEL[r.type] ?? r.type;
    const url = `${BASE_URL}/animateur/rdv/${r.id}`;

    const descParts = [
      `Type : ${typeLabel}`,
      `Magasin : ${nomMag}${mag?.ville ? ` (${mag.ville})` : ""}`,
      `Statut : ${r.statut}`,
    ];
    if (r.message) descParts.push("", `Message : ${r.message}`);
    descParts.push("", `Voir : ${url}`);

    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:rdv-${r.id}@animateur-reseau-pa.vercel.app`),
      `DTSTAMP:${stamp}`,
      dtStart(r.date_souhaitee, r.heure_souhaitee),
      dtEnd(r.date_souhaitee, r.heure_souhaitee, 60),
      fold(`SUMMARY:${esc(`${prefix} ${r.objet} — ${nomMag}`)}`),
      fold(`DESCRIPTION:${esc(descParts.join("\n"))}`),
      ...(r.lieu ? [fold(`LOCATION:${esc(r.lieu)}`)] : []),
      fold(`URL:${url}`),
      `STATUS:${RDV_STATUS[r.statut] ?? "TENTATIVE"}`,
      "END:VEVENT",
    );
  }

  for (const v of visites) {
    const mag = v.magasins;
    const nomMag = mag ? (mag.enseigne ? `${mag.enseigne} — ${mag.nom}` : mag.nom) : "?";
    const url = `${BASE_URL}/visites/${v.id}`;

    const descParts = [
      `Type : Visite planifiée`,
      `Magasin : ${nomMag}`,
    ];
    if (v.objectif) descParts.push("", `Objectif : ${v.objectif}`);
    descParts.push("", `Voir : ${url}`);

    const summaryTitre = v.objectif ? `${v.objectif} — ${nomMag}` : nomMag;

    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:visite-${v.id}@animateur-reseau-pa.vercel.app`),
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateToIcal(v.date_prevue)}`,
      `DTEND;VALUE=DATE:${(() => {
        const d = new Date(v.date_prevue + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + 1);
        return d.toISOString().slice(0, 10).replace(/-/g, "");
      })()}`,
      fold(`SUMMARY:${esc(`🚗 [Visite] ${summaryTitre}`)}`),
      fold(`DESCRIPTION:${esc(descParts.join("\n"))}`),
      fold(`URL:${url}`),
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
