import { sync as icalSync } from "node-ical";
import type { VEvent, ParameterValue } from "node-ical";
import { getParametre } from "@/lib/parametres";

export type GCalEvent = {
  uid: string;
  titre: string;
  description?: string;
  lieu?: string;
  debut: Date;
  fin: Date;
  journeeEntiere: boolean;
  url?: string;
};

function extractString(val: ParameterValue | undefined): string | undefined {
  if (!val) return undefined;
  if (typeof val === "string") return val || undefined;
  return (val as { val: string }).val || undefined;
}

export async function fetchGCalEvents(
  daysAhead = 30
): Promise<{ events: GCalEvent[]; label: string; error?: string }> {
  const [url, label] = await Promise.all([
    getParametre("gcal_ical_url", ""),
    getParametre("gcal_label", "Mon agenda Google"),
  ]);

  if (!url) return { events: [], label, error: "URL iCal non configurée" };

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return { events: [], label, error: `Erreur ${res.status} en récupérant l'agenda` };
    const text = await res.text();
    const parsed = icalSync.parseICS(text);

    const maintenant = Date.now();
    const limite = maintenant + daysAhead * 86_400_000;
    const events: GCalEvent[] = [];

    for (const k in parsed) {
      const comp = parsed[k];
      if (!comp || comp.type !== "VEVENT") continue;
      const e = comp as VEvent;
      const debut = e.start as Date;
      const t = debut.getTime();
      if (t < maintenant - 3_600_000 || t > limite) continue;

      events.push({
        uid: e.uid ?? k,
        titre: extractString(e.summary) ?? "(sans titre)",
        description: extractString(e.description),
        lieu: extractString(e.location),
        debut,
        fin: (e.end ?? debut) as Date,
        journeeEntiere: e.datetype === "date",
        url: e.url ?? undefined,
      });
    }

    events.sort((a, b) => a.debut.getTime() - b.debut.getTime());
    return { events, label };
  } catch (err) {
    return {
      events: [],
      label,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
