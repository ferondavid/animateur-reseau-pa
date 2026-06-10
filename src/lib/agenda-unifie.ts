import { createClient } from "@/lib/supabase/server";
import { fetchGCalEvents } from "@/lib/gcal";

export type SourceEvt = "google" | "rdv" | "visite";
export type TypeRdv = "physique" | "tel" | "visio";

export type EvtAgenda = {
  source: SourceEvt;
  id: string;
  titre: string;
  debut: Date;
  fin: Date;
  journeeEntiere: boolean;
  lieu?: string;
  description?: string;
  // Spécifiques RDV/visite app
  typeRdv?: TypeRdv;
  magasinNom?: string;
  magasinEnseigne?: string;
  magasinVille?: string;
  urlDetail?: string;
  nbInvites?: number;
};

type MagasinJoin = { nom: string; enseigne: string | null; ville: string | null } | null;

export async function fetchAgendaUnifie(daysAhead = 30): Promise<{
  events: EvtAgenda[];
  gcalLabel: string;
  gcalError?: string;
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const limite = new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);

  // En parallèle : Google + RDV confirmés + Visites planifiées
  const [
    { events: gcalEvents, label: gcalLabel, error: gcalError },
    { data: rdvs },
    { data: visites },
  ] = await Promise.all([
    fetchGCalEvents(daysAhead),
    supabase
      .from("rendez_vous")
      .select(
        `id, type, date_souhaitee, heure_souhaitee, objet, lieu, lien_visio, message,
        magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville),
        rendez_vous_invites(magasin_id)`
      )
      .eq("statut", "confirme")
      .gte("date_souhaitee", today)
      .lte("date_souhaitee", limite)
      .order("date_souhaitee", { ascending: true }),
    supabase
      .from("visites")
      .select(`id, date_prevue, objectif, magasins(nom, enseigne, ville)`)
      .eq("statut", "planifiee")
      .gte("date_prevue", today)
      .lte("date_prevue", limite)
      .order("date_prevue", { ascending: true }),
  ]);

  const evts: EvtAgenda[] = [];

  // 1. Events Google
  for (const g of gcalEvents) {
    evts.push({
      source: "google",
      id: `gcal-${g.uid}`,
      titre: g.titre,
      debut: g.debut,
      fin: g.fin,
      journeeEntiere: g.journeeEntiere,
      lieu: g.lieu,
      description: g.description,
    });
  }

  // 2. RDV pro confirmés
  for (const r of rdvs ?? []) {
    const rdv = r as unknown as {
      id: string; type: string;
      date_souhaitee: string; heure_souhaitee: string | null;
      objet: string; lieu: string | null; lien_visio: string | null; message: string | null;
      magasins: MagasinJoin;
      rendez_vous_invites: unknown[] | null;
    };
    const [y, m, d] = rdv.date_souhaitee.split("-").map(Number);
    let debut: Date, fin: Date, journeeEntiere = false;
    if (rdv.heure_souhaitee) {
      const [h, mn] = rdv.heure_souhaitee.split(":").map(Number);
      debut = new Date(y, m - 1, d, h, mn);
      fin = new Date(debut.getTime() + 60 * 60 * 1000);
    } else {
      debut = new Date(y, m - 1, d, 9, 0);
      fin = new Date(y, m - 1, d, 10, 0);
      journeeEntiere = true;
    }
    evts.push({
      source: "rdv",
      id: `rdv-${rdv.id}`,
      titre: rdv.objet,
      debut, fin, journeeEntiere,
      typeRdv: rdv.type as TypeRdv,
      magasinNom: rdv.magasins?.nom,
      magasinEnseigne: rdv.magasins?.enseigne ?? undefined,
      magasinVille: rdv.magasins?.ville ?? undefined,
      lieu: rdv.type === "visio"
        ? (rdv.lien_visio ?? undefined)
        : (rdv.lieu ?? rdv.magasins?.ville ?? undefined),
      description: rdv.message ?? undefined,
      urlDetail: `/animateur/rdv/${rdv.id}`,
      nbInvites: rdv.rendez_vous_invites?.length ?? 0,
    });
  }

  // 3. Visites planifiées
  for (const v of visites ?? []) {
    const visite = v as unknown as {
      id: string; date_prevue: string; objectif: string | null;
      magasins: MagasinJoin;
    };
    const [y, m, d] = visite.date_prevue.split("-").map(Number);
    const debut = new Date(y, m - 1, d, 9, 0);
    const fin = new Date(y, m - 1, d, 17, 0);
    evts.push({
      source: "visite",
      id: `visite-${visite.id}`,
      titre: visite.objectif ?? "Visite planifiée",
      debut, fin, journeeEntiere: true,
      magasinNom: visite.magasins?.nom,
      magasinEnseigne: visite.magasins?.enseigne ?? undefined,
      magasinVille: visite.magasins?.ville ?? undefined,
      lieu: visite.magasins?.ville ?? undefined,
      urlDetail: `/visites/${visite.id}`,
    });
  }

  evts.sort((a, b) => a.debut.getTime() - b.debut.getTime());

  return { events: evts, gcalLabel, gcalError };
}
