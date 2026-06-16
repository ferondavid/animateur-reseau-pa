// Client-safe (aucun import serveur) : constantes + helpers purs.
// La lecture en base se fait inline dans les pages serveur.

export type JourBloque = {
  id: string;
  date_debut: string;
  date_fin: string;
  type: string;
  note: string | null;
};

export const TYPE_BLOC: Record<string, { label: string; bg: string; fg: string }> = {
  home_office: { label: "Home office", bg: "#E4F0FB", fg: "#2D6FD0" },
  conges:      { label: "Congés", bg: "#D2F2E7", fg: "#0F8C68" },
  bureau:      { label: "Journée bureau", bg: "#EDEBFB", fg: "#6B4FD8" },
};

export const SELECT_JOURS_BLOQUES = "id, date_debut, date_fin, type, note";

// Étale les périodes en map date(YYYY-MM-DD) -> type
export function mapJoursBloques(rows: JourBloque[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows) {
    const d = new Date(r.date_debut + "T12:00:00");
    const fin = new Date(r.date_fin + "T12:00:00");
    while (d <= fin) {
      m.set(d.toISOString().slice(0, 10), r.type);
      d.setDate(d.getDate() + 1);
    }
  }
  return m;
}
