import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

const anthropic = new Anthropic();

type Intention =
  | "creer_rdv"
  | "creer_remontee"
  | "creer_action"
  | "creer_visite"
  | "prochain_rdv"
  | "remontees_urgentes"
  | "ca_du_mois"
  | "magasins_risque"
  | "preparation_demain"
  | "ouvrir_magasin"
  | "naviguer"
  | "inconnu";

interface ParsedIntention {
  intention: Intention;
  params: Record<string, string>;
}

const SYSTEM_PARSE = `Tu es un assistant vocal pour un animateur réseau de magasins piscinistes.
Analyse la commande vocale et retourne UNIQUEMENT un objet JSON valide, sans markdown, sans explication.

Format exact: {"intention":"<intention>","params":{<params>}}

Intentions disponibles:
- "creer_rdv" : créer un rendez-vous. params: { magasin?: string, objet?: string, date?: string, heure?: string }
- "creer_remontee" : créer une remontée terrain. params: { magasin?: string, message?: string, gravite?: "normale"|"urgente" }
- "creer_action" : créer une action réseau. params: { titre?: string, magasin?: string }
- "creer_visite" : planifier une visite. params: { magasin?: string, date?: string, objectif?: string }
- "prochain_rdv" : consulter le prochain RDV. params: {}
- "remontees_urgentes" : voir les remontées urgentes non traitées. params: {}
- "ca_du_mois" : voir le CA du mois en cours. params: {}
- "magasins_risque" : voir les magasins en risque. params: {}
- "preparation_demain" : voir la préparation pour demain. params: {}
- "ouvrir_magasin" : ouvrir la fiche d'un magasin. params: { magasin: string }
- "naviguer" : ouvrir une page de l'app. params: { cible: "carte"|"pilotage"|"rdv"|"visites"|"parcours"|"actions"|"remontees"|"news"|"evaluations"|"magasins"|"parametres"|"agenda"|"tournee" }
- "inconnu" : commande non reconnue. params: {}

Exemples navigation:
- "ouvre la carte" → {"intention":"naviguer","params":{"cible":"carte"}}
- "va à la carte" → {"intention":"naviguer","params":{"cible":"carte"}}
- "montre-moi le pilotage" → {"intention":"naviguer","params":{"cible":"pilotage"}}
- "ouvre les rendez-vous" / "page rdv" → {"intention":"naviguer","params":{"cible":"rdv"}}
- "ouvre les visites" → {"intention":"naviguer","params":{"cible":"visites"}}
- "page parcours" / "ma tournée" → {"intention":"naviguer","params":{"cible":"parcours"}}
- "ouvre les actions" / "actions réseau" → {"intention":"naviguer","params":{"cible":"actions"}}
- "remontées" / "voir les remontées" → {"intention":"naviguer","params":{"cible":"remontees"}}
- "actualités" / "news" → {"intention":"naviguer","params":{"cible":"news"}}
- "évaluations" → {"intention":"naviguer","params":{"cible":"evaluations"}}
- "liste des magasins" / "page magasins" → {"intention":"naviguer","params":{"cible":"magasins"}}
- "paramètres" / "réglages" → {"intention":"naviguer","params":{"cible":"parametres"}}
- "mon agenda" → {"intention":"naviguer","params":{"cible":"agenda"}}

Exemples autres:
- "crée un RDV avec Piscine Service Lyon" → {"intention":"creer_rdv","params":{"magasin":"Piscine Service Lyon"}}
- "montre-moi les remontées urgentes" → {"intention":"remontees_urgentes","params":{}}
- "ouvre la fiche du magasin Aqua Rêve Strasbourg" → {"intention":"ouvrir_magasin","params":{"magasin":"Aqua Rêve Strasbourg"}}
- "quel est mon prochain rendez-vous" → {"intention":"prochain_rdv","params":{}}
- "CA du mois" → {"intention":"ca_du_mois","params":{}}

IMPORTANT: "ouvre/va sur/page [section]" sans nom de magasin = "naviguer".
"ouvre la fiche [nom magasin]" = "ouvrir_magasin".`;

type MagasinRow = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
};

type RdvRow = {
  date_souhaitee: string;
  heure_souhaitee: string | null;
  objet: string;
  magasins: { nom: string; enseigne: string | null; ville: string | null } | null;
};

type RemonteeRow = {
  titre: string;
  magasins: { nom: string; enseigne: string | null } | null;
};

type CaRow = { ca_ht: number };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "animateur") {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = (await req.json()) as { texte?: string };
  const texte = body.texte?.trim();
  if (!texte) {
    return Response.json({ reponse: "Commande vide, réessayez." });
  }

  // 0. FALLBACK RAPIDE : regex sur les commandes de navigation simples
  // Évite un appel Claude inutile et garantit que ces commandes marchent
  const texteLower = texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, ""); // supprime accents
  const REGEX_NAV: Array<{ regex: RegExp; cible: string }> = [
    { regex: /\b(carte|map|cartographie|reseau)\b/, cible: "carte" },
    { regex: /\b(accueil|dashboard|home)\b/, cible: "accueil" },
    { regex: /\b(pilotage|cockpit|tableau de bord)\b/, cible: "pilotage" },
    { regex: /\b(rendez ?vous|rdv|prochains? rdv|mes? rdv)\b/, cible: "rdv" },
    { regex: /\b(visites?|liste des visites)\b/, cible: "visites" },
    { regex: /\b(parcours|tournee|itineraire|preparer une tournee)\b/, cible: "parcours" },
    { regex: /\b(actions?|actions? reseau)\b/, cible: "actions" },
    { regex: /\b(remontees?|alertes?|signalements?)\b/, cible: "remontees" },
    { regex: /\b(news|actualites?|infos? reseau)\b/, cible: "news" },
    { regex: /\b(evaluations?|notes? visites?)\b/, cible: "evaluations" },
    { regex: /\b(magasins?|liste|liste des magasins)\b/, cible: "magasins" },
    { regex: /\b(parametres?|reglages?|configuration|settings)\b/, cible: "parametres" },
    { regex: /\b(agenda|calendrier|planning)\b/, cible: "agenda" },
  ];
  // Si le texte commence par un verbe de navigation, on cherche la cible
  const verbeNav = /\b(ouvre|ouvrir|va|aller|montre|montrer|affiche|afficher|page|emmene|emmener|retour)\b/.test(texteLower);
  if (verbeNav) {
    for (const { regex, cible } of REGEX_NAV) {
      if (regex.test(texteLower)) {
        const MAP_LABEL: Record<string, { url: string; label: string }> = {
          carte:        { url: "/animateur/carte",      label: "la carte du réseau" },
          accueil:      { url: "/animateur",            label: "l'accueil" },
          agenda:       { url: "/animateur",            label: "l'agenda" },
          pilotage:     { url: "/pilotage",             label: "le pilotage" },
          rdv:          { url: "/animateur/rdv",        label: "les rendez-vous" },
          visites:      { url: "/visites",              label: "les visites" },
          parcours:     { url: "/animateur/parcours",   label: "la préparation de tournée" },
          actions:      { url: "/actions-reseau",       label: "les actions" },
          remontees:    { url: "/remontees",            label: "les remontées" },
          news:         { url: "/animateur/news",       label: "les actualités" },
          evaluations:  { url: "/evaluations",          label: "les évaluations" },
          magasins:     { url: "/magasins",             label: "la liste des magasins" },
          parametres:   { url: "/animateur/parametres", label: "les paramètres" },
        };
        const match = MAP_LABEL[cible];
        return Response.json({
          reponse: `J'ouvre ${match.label}.`,
          action: { type: "navigate", url: match.url },
        });
      }
    }
  }

  // 1. Parsing intention avec cache sur le prompt système
  const parseMsg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: [
      {
        type: "text",
        text: SYSTEM_PARSE,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: texte }],
  });

  let parsed: ParsedIntention = { intention: "inconnu", params: {} };
  try {
    const c = parseMsg.content[0];
    if (c.type === "text") {
      parsed = JSON.parse(c.text.trim()) as ParsedIntention;
    }
  } catch {
    // garde "inconnu"
  }

  // 2. Exécution sur Supabase
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  let donnees = "";
  let actionRetour: { type: "navigate"; url: string } | undefined;

  switch (parsed.intention) {
    case "prochain_rdv": {
      const { data } = await supabase
        .from("rendez_vous")
        .select(
          "date_souhaitee, heure_souhaitee, objet, magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville)"
        )
        .in("statut", ["confirme", "demande"])
        .gte("date_souhaitee", today)
        .order("date_souhaitee", { ascending: true })
        .limit(1);

      if (data?.length) {
        const rdv = data[0] as unknown as RdvRow;
        const m = rdv.magasins;
        const nomMag = m
          ? m.enseigne
            ? `${m.enseigne} ${m.nom}`
            : m.nom
          : "magasin inconnu";
        const dateF = new Date(rdv.date_souhaitee).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        donnees = `Prochain RDV : ${rdv.heure_souhaitee ? rdv.heure_souhaitee.slice(0, 5) + " " : ""}le ${dateF} avec ${nomMag}. Objet : ${rdv.objet}.`;
      } else {
        donnees = "Aucun RDV à venir.";
      }
      break;
    }

    case "remontees_urgentes": {
      const { data, count } = await supabase
        .from("remontees")
        .select("titre, magasins(nom, enseigne)", { count: "exact" })
        .eq("gravite", "urgente")
        .not("statut", "in", "(traitee,archivee)")
        .order("created_at", { ascending: false })
        .limit(3);

      if (!count) {
        donnees = "Aucune remontée urgente active.";
      } else {
        const titres = (data ?? []).map((r) => {
          const row = r as unknown as RemonteeRow;
          const nomMag = row.magasins
            ? (row.magasins.enseigne ?? row.magasins.nom)
            : "?";
          return `${nomMag} : ${row.titre}`;
        });
        donnees = `${count} remontée${count > 1 ? "s" : ""} urgente${count > 1 ? "s" : ""} active${count > 1 ? "s" : ""}. ${titres.slice(0, 2).join(". ")}.`;
      }
      break;
    }

    case "ca_du_mois": {
      const now = new Date();
      const moisStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data } = await supabase
        .from("ca_mensuel")
        .select("ca_ht")
        .like("mois", `${moisStr}%`);

      if (data?.length) {
        const total = (data as CaRow[]).reduce(
          (sum, r) => sum + (r.ca_ht ?? 0),
          0
        );
        donnees = `CA du mois en cours : ${total.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })} HT sur ${data.length} magasin${data.length > 1 ? "s" : ""}.`;
      } else {
        donnees = `Pas de données CA pour ${moisStr}. Rendez-vous sur le pilotage.`;
        actionRetour = { type: "navigate", url: "/pilotage" };
      }
      break;
    }

    case "magasins_risque": {
      const { data: remUrgentes, count: nbUrgentes } = await supabase
        .from("remontees")
        .select("magasin_id", { count: "exact" })
        .eq("gravite", "urgente")
        .not("statut", "in", "(traitee,archivee)");

      const magIdsUniques = new Set(
        (remUrgentes ?? []).map(
          (r: unknown) => (r as { magasin_id: string }).magasin_id
        )
      );

      const { count: nbStrategiques } = await supabase
        .from("magasins")
        .select("*", { count: "exact", head: true })
        .eq("statut", "actif")
        .eq("niveau", "strategique");

      donnees = `${magIdsUniques.size} magasin${magIdsUniques.size > 1 ? "s" : ""} avec remontée urgente active (${nbUrgentes ?? 0} remontée${(nbUrgentes ?? 0) > 1 ? "s" : ""}). ${nbStrategiques ?? 0} magasins stratégiques.`;
      actionRetour = { type: "navigate", url: "/pilotage" };
      break;
    }

    case "preparation_demain": {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      const { data } = await supabase
        .from("rendez_vous")
        .select(
          "heure_souhaitee, objet, magasins!rendez_vous_magasin_id_fkey(nom, enseigne, ville)"
        )
        .eq("statut", "confirme")
        .eq("date_souhaitee", tomorrowStr);

      if (!data?.length) {
        donnees = "Aucun RDV confirmé demain.";
      } else {
        const rdvList = (data as unknown as RdvRow[]).map((r) => {
          const m = r.magasins;
          const nomMag = m ? (m.enseigne ? `${m.enseigne} ${m.nom}` : m.nom) : "?";
          return `${r.heure_souhaitee ? r.heure_souhaitee.slice(0, 5) + " " : ""}${nomMag}`;
        });
        donnees = `Demain tu as ${data.length} RDV : ${rdvList.join(", ")}.`;
      }
      break;
    }

    case "ouvrir_magasin": {
      const nomRecherche = (parsed.params.magasin ?? "").toLowerCase().trim();
      if (!nomRecherche) {
        donnees = "Aucun nom de magasin précisé.";
        break;
      }
      const { data: magasins } = await supabase
        .from("magasins")
        .select("id, nom, enseigne, ville")
        .eq("statut", "actif");

      const trouve = (magasins ?? []).find((m) => {
        const row = m as unknown as MagasinRow;
        const champs = [row.nom, row.enseigne, row.ville]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          champs.includes(nomRecherche) ||
          nomRecherche.includes(row.nom.toLowerCase())
        );
      });

      if (trouve) {
        const row = trouve as unknown as MagasinRow;
        const nomMag = row.enseigne ? `${row.enseigne} ${row.nom}` : row.nom;
        donnees = `Ouverture de la fiche ${nomMag}.`;
        actionRetour = { type: "navigate", url: `/magasins/${row.id}` };
      } else {
        donnees = `Aucun magasin trouvé pour "${parsed.params.magasin}". Vérifiez le nom.`;
      }
      break;
    }

    case "creer_rdv": {
      const magasin = parsed.params.magasin ? ` avec ${parsed.params.magasin}` : "";
      donnees = `Je t'ouvre le formulaire de création de RDV${magasin}.`;
      actionRetour = { type: "navigate", url: "/animateur/rdv/nouvelle" };
      break;
    }

    case "creer_remontee": {
      donnees = "Je t'ouvre le formulaire pour créer une remontée terrain.";
      actionRetour = { type: "navigate", url: "/remontees/nouvelle" };
      break;
    }

    case "creer_action": {
      donnees = "Je t'ouvre le formulaire de création d'action réseau.";
      actionRetour = { type: "navigate", url: "/actions-reseau/nouvelle" };
      break;
    }

    case "creer_visite": {
      const magasin = parsed.params.magasin ? ` chez ${parsed.params.magasin}` : "";
      donnees = `Je t'ouvre le formulaire pour planifier une visite${magasin}.`;
      actionRetour = { type: "navigate", url: "/visites/nouvelle" };
      break;
    }

    case "naviguer": {
      const cible = (parsed.params.cible ?? "").toLowerCase().trim();
      const MAP_NAV: Record<string, { url: string; label: string }> = {
        carte:        { url: "/animateur",          label: "la carte du réseau" },
        accueil:      { url: "/animateur",          label: "l'accueil" },
        dashboard:    { url: "/animateur",          label: "le dashboard" },
        agenda:       { url: "/animateur",          label: "l'agenda" },
        pilotage:     { url: "/pilotage",           label: "le pilotage" },
        rdv:          { url: "/animateur/rdv",      label: "les rendez-vous" },
        "rendez-vous":{ url: "/animateur/rdv",      label: "les rendez-vous" },
        visites:      { url: "/visites",            label: "les visites" },
        parcours:     { url: "/animateur/parcours", label: "la préparation de tournée" },
        tournee:      { url: "/animateur/parcours", label: "la préparation de tournée" },
        itineraire:   { url: "/animateur/parcours", label: "l'itinéraire" },
        actions:      { url: "/actions-reseau",     label: "les actions" },
        "actions-reseau": { url: "/actions-reseau", label: "les actions" },
        remontees:    { url: "/remontees",          label: "les remontées" },
        remontée:     { url: "/remontees",          label: "les remontées" },
        news:         { url: "/animateur/news",     label: "les actualités" },
        actualites:   { url: "/animateur/news",     label: "les actualités" },
        evaluations:  { url: "/evaluations",        label: "les évaluations" },
        magasins:     { url: "/magasins",           label: "la liste des magasins" },
        liste:        { url: "/magasins",           label: "la liste des magasins" },
        parametres:   { url: "/animateur/parametres", label: "les paramètres" },
        reglages:     { url: "/animateur/parametres", label: "les réglages" },
      };
      // Normalise les accents (é → e, etc.)
      const cibleNorm = cible.normalize("NFD").replace(/\p{Diacritic}/gu, "");
      const match = MAP_NAV[cibleNorm] ?? MAP_NAV[cible];
      if (match) {
        donnees = `J'ouvre ${match.label}.`;
        actionRetour = { type: "navigate", url: match.url };
      } else {
        donnees = `Je ne sais pas ouvrir "${cible}". Essaye carte, pilotage, RDV, visites, parcours, actions, remontées, news, évaluations, magasins ou paramètres.`;
      }
      break;
    }

    default: {
      donnees = `Commande non reconnue : "${texte}". Essayez "prochain RDV", "remontées urgentes", ou "ouvre [nom magasin]".`;
    }
  }

  // 3. Formulation réponse naturelle courte
  const repMsg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    system: [
      {
        type: "text",
        text: "Tu es un assistant vocal concis pour animateur réseau. Reformule l'info en français naturel et bref (1-2 phrases max, moins de 25 mots). Pas de markdown.",
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: donnees }],
  });

  const repContent = repMsg.content[0];
  const reponse =
    repContent.type === "text" ? repContent.text.trim() : donnees;

  return Response.json({ reponse, action: actionRetour });
}
