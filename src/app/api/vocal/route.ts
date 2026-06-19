import { type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

const anthropic = new Anthropic();
const MODEL = "claude-haiku-4-5-20251001";

type NavAction = { type: "navigate"; url: string };

// ── Système (mis en cache via prompt caching) ──────────────────────────────────
const SYSTEM = `Tu es l'assistant vocal de l'animateur du réseau de magasins piscinistes "Piscinistes Associés".

Ton rôle : comprendre une commande dite à voix haute (en français, parfois approximative) et y répondre en utilisant les outils mis à ta disposition.

Règles :
- Choisis le ou les outils adaptés à la demande, même si la formulation est libre ou inhabituelle.
- Pour ouvrir une PAGE de l'app, utilise "naviguer". Pour ouvrir la FICHE d'un magasin précis, utilise "ouvrir_magasin".
- Pour CRÉER quelque chose (RDV, visite, remontée, action) : appelle DIRECTEMENT l'outil de création. N'interroge JAMAIS l'utilisateur sur les détails (magasin, date, heure, objet) — le formulaire qui s'ouvre sert à les saisir. Si un nom de magasin est dit, transmets-le simplement à l'outil.
- Pour une question (prochain RDV, remontées urgentes, CA du mois, magasins à risque, préparation de demain), utilise l'outil de consultation puis donne la réponse.
- Demande une précision UNIQUEMENT si c'est vraiment indispensable pour agir (ex. un nom de magasin ambigu pour ouvrir une fiche) — et alors une seule question courte.
- Réponse finale : UNE phrase courte en français, moins de 20 mots. TEXTE BRUT uniquement : jamais de markdown, d'astérisques, de listes à puces ni de retours à la ligne.
- Si la demande est incompréhensible, dis-le brièvement et propose un exemple.`;

// ── Cibles de navigation ───────────────────────────────────────────────────────
const MAP_NAV: Record<string, { url: string; label: string }> = {
  accueil: { url: "/animateur", label: "l'accueil" },
  agenda: { url: "/animateur", label: "l'agenda" },
  carte: { url: "/animateur/carte", label: "la carte du réseau" },
  notes: { url: "/animateur/notes", label: "les notes vocales" },
  pilotage: { url: "/pilotage", label: "le pilotage" },
  sante: { url: "/animateur/sante", label: "la santé réseau" },
  rdv: { url: "/animateur/rdv", label: "les rendez-vous" },
  visites: { url: "/visites", label: "les visites" },
  parcours: { url: "/animateur/parcours", label: "la préparation de tournée" },
  tournee_suggeree: { url: "/animateur/tournee/suggestion", label: "la tournée suggérée" },
  actions: { url: "/actions-reseau", label: "les actions" },
  remontees: { url: "/remontees", label: "les remontées" },
  news: { url: "/animateur/news", label: "les actualités" },
  evaluations: { url: "/evaluations", label: "les évaluations" },
  magasins: { url: "/magasins", label: "la liste des magasins" },
  parametres: { url: "/animateur/parametres", label: "les paramètres" },
};

// ── Définition des outils ──────────────────────────────────────────────────────
const TOOLS: Anthropic.Tool[] = [
  {
    name: "naviguer",
    description: "Ouvrir une page de l'application animateur (pas la fiche d'un magasin précis).",
    input_schema: {
      type: "object",
      properties: { cible: { type: "string", enum: Object.keys(MAP_NAV) } },
      required: ["cible"],
    },
  },
  {
    name: "ouvrir_magasin",
    description: "Ouvrir la fiche détaillée d'un magasin identifié par son nom, enseigne ou ville.",
    input_schema: {
      type: "object",
      properties: { magasin: { type: "string", description: "Nom, enseigne ou ville du magasin" } },
      required: ["magasin"],
    },
  },
  {
    name: "creer_rdv",
    description: "Ouvrir le formulaire de création d'un rendez-vous.",
    input_schema: {
      type: "object",
      properties: {
        magasin: { type: "string" }, objet: { type: "string" },
        date: { type: "string" }, heure: { type: "string" },
      },
    },
  },
  {
    name: "creer_visite",
    description: "Ouvrir le formulaire pour planifier une visite.",
    input_schema: { type: "object", properties: { magasin: { type: "string" } } },
  },
  {
    name: "creer_remontee",
    description: "Ouvrir le formulaire pour créer une remontée terrain.",
    input_schema: { type: "object", properties: { magasin: { type: "string" } } },
  },
  {
    name: "creer_action",
    description: "Ouvrir le formulaire de création d'une action réseau.",
    input_schema: { type: "object", properties: { titre: { type: "string" } } },
  },
  {
    name: "prendre_note",
    description: "Lancer l'enregistrement d'une note vocale.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "prochain_rdv",
    description: "Consulter le prochain rendez-vous à venir.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "remontees_urgentes",
    description: "Consulter les remontées urgentes non traitées.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "ca_du_mois",
    description: "Consulter le chiffre d'affaires du réseau pour le mois en cours.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "magasins_risque",
    description: "Consulter les magasins en risque (remontées urgentes, magasins stratégiques).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "preparation_demain",
    description: "Consulter ce qui est prévu demain (RDV confirmés et visites planifiées).",
    input_schema: { type: "object", properties: {} },
  },
];

// ── Exécution d'un outil côté serveur ──────────────────────────────────────────
type Supa = Awaited<ReturnType<typeof createClient>>;

function parisYMD(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}
function titreMag(m: { nom: string; enseigne: string | null } | null): string {
  if (!m) return "magasin inconnu";
  return m.enseigne ? `${m.enseigne} ${m.nom}` : m.nom;
}

/** Nettoie le markdown pour une lecture vocale propre (gras, puces, titres, retours ligne). */
function nettoyerTexte(t: string): string {
  return t
    .replace(/\*\*/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: Supa
): Promise<{ result: string; action?: NavAction }> {
  const s = (k: string) => String(input[k] ?? "").trim();

  switch (name) {
    case "naviguer": {
      const cible = s("cible").toLowerCase();
      const m = MAP_NAV[cible];
      if (!m) return { result: `Cible inconnue : ${cible}.` };
      return { result: `Ouverture de ${m.label}.`, action: { type: "navigate", url: m.url } };
    }
    case "prendre_note":
      return { result: "Enregistrement lancé.", action: { type: "navigate", url: "/animateur/notes?record=1" } };
    case "creer_rdv": {
      const mag = s("magasin");
      return { result: `Formulaire RDV${mag ? ` avec ${mag}` : ""} ouvert.`, action: { type: "navigate", url: "/animateur/rdv/nouvelle" } };
    }
    case "creer_visite": {
      const mag = s("magasin");
      return { result: `Formulaire de visite${mag ? ` chez ${mag}` : ""} ouvert.`, action: { type: "navigate", url: "/visites/nouvelle" } };
    }
    case "creer_remontee":
      return { result: "Formulaire de remontée ouvert.", action: { type: "navigate", url: "/remontees/nouvelle" } };
    case "creer_action":
      return { result: "Formulaire d'action réseau ouvert.", action: { type: "navigate", url: "/actions-reseau/nouvelle" } };

    case "ouvrir_magasin": {
      const q = s("magasin").toLowerCase();
      if (!q) return { result: "Aucun nom de magasin précisé." };
      const { data } = await supabase.from("magasins").select("id, nom, enseigne, ville").eq("statut", "actif");
      const trouve = (data ?? []).find((m) => {
        const row = m as unknown as { nom: string; enseigne: string | null; ville: string | null };
        const hay = [row.nom, row.enseigne, row.ville].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(q) || q.includes(row.nom.toLowerCase());
      });
      if (!trouve) return { result: `Aucun magasin trouvé pour "${s("magasin")}".` };
      const row = trouve as unknown as { id: string; nom: string; enseigne: string | null };
      return { result: `Ouverture de la fiche ${titreMag(row)}.`, action: { type: "navigate", url: `/magasins/${row.id}` } };
    }

    case "prochain_rdv": {
      const today = parisYMD(new Date());
      const { data } = await supabase
        .from("rendez_vous")
        .select("date_souhaitee, heure_souhaitee, objet, magasins!rendez_vous_magasin_id_fkey(nom, enseigne)")
        .in("statut", ["confirme", "demande"])
        .gte("date_souhaitee", today)
        .order("date_souhaitee", { ascending: true })
        .limit(1);
      if (!data?.length) return { result: "Aucun RDV à venir." };
      const r = data[0] as unknown as { date_souhaitee: string; heure_souhaitee: string | null; objet: string; magasins: { nom: string; enseigne: string | null } | null };
      const dateF = new Date(r.date_souhaitee + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
      return { result: `Prochain RDV : ${r.heure_souhaitee ? r.heure_souhaitee.slice(0, 5) + " " : ""}le ${dateF} avec ${titreMag(r.magasins)}. Objet : ${r.objet}.` };
    }

    case "remontees_urgentes": {
      const { data, count } = await supabase
        .from("remontees")
        .select("titre, magasins(nom, enseigne)", { count: "exact" })
        .eq("gravite", "urgente")
        .not("statut", "in", "(traitee,archivee)")
        .order("created_at", { ascending: false })
        .limit(3);
      if (!count) return { result: "Aucune remontée urgente active." };
      const titres = (data ?? []).map((r) => {
        const row = r as unknown as { titre: string; magasins: { nom: string; enseigne: string | null } | null };
        return `${titreMag(row.magasins)} : ${row.titre}`;
      });
      return { result: `${count} remontée${count > 1 ? "s" : ""} urgente${count > 1 ? "s" : ""}. ${titres.slice(0, 2).join(". ")}.` };
    }

    case "ca_du_mois": {
      const now = new Date();
      const annee = now.getFullYear();
      const mois = now.getMonth() + 1;
      const { data } = await supabase
        .from("ca_mensuel")
        .select("magasin_id, montant")
        .eq("segment", "global")
        .eq("annee", annee)
        .eq("mois", mois);
      if (!data?.length) return { result: `Pas encore de données de CA pour le mois en cours.` };
      const rows = data as unknown as { magasin_id: string; montant: number | string }[];
      const total = rows.reduce((sum, r) => sum + Number(r.montant ?? 0), 0);
      const nbMag = new Set(rows.map((r) => r.magasin_id)).size;
      const montantStr = total.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
      return { result: `CA du mois en cours : ${montantStr} sur ${nbMag} magasin${nbMag > 1 ? "s" : ""}.` };
    }

    case "magasins_risque": {
      const { data: remUrg, count: nbUrg } = await supabase
        .from("remontees")
        .select("magasin_id", { count: "exact" })
        .eq("gravite", "urgente")
        .not("statut", "in", "(traitee,archivee)");
      const magIds = new Set((remUrg ?? []).map((r) => (r as unknown as { magasin_id: string }).magasin_id));
      const { count: nbStrat } = await supabase
        .from("magasins")
        .select("*", { count: "exact", head: true })
        .eq("statut", "actif")
        .eq("niveau", "strategique");
      return { result: `${magIds.size} magasin${magIds.size > 1 ? "s" : ""} avec remontée urgente (${nbUrg ?? 0} au total). ${nbStrat ?? 0} magasins stratégiques.` };
    }

    case "preparation_demain": {
      const demain = parisYMD(new Date(Date.now() + 86_400_000));
      const [{ data: rdvs }, { data: visites }] = await Promise.all([
        supabase.from("rendez_vous").select("heure_souhaitee, magasins!rendez_vous_magasin_id_fkey(nom, enseigne)").eq("statut", "confirme").eq("date_souhaitee", demain),
        supabase.from("visites").select("heure_prevue, magasins(nom, enseigne)").eq("statut", "planifiee").eq("date_prevue", demain),
      ]);
      const items: string[] = [];
      for (const r of (rdvs ?? []) as unknown as { heure_souhaitee: string | null; magasins: { nom: string; enseigne: string | null } | null }[]) {
        items.push(`${r.heure_souhaitee ? r.heure_souhaitee.slice(0, 5) + " " : ""}${titreMag(r.magasins)}`);
      }
      for (const v of (visites ?? []) as unknown as { heure_prevue: string | null; magasins: { nom: string; enseigne: string | null } | null }[]) {
        items.push(`${v.heure_prevue ? v.heure_prevue.slice(0, 5) + " " : ""}${titreMag(v.magasins)} (visite)`);
      }
      if (items.length === 0) return { result: "Rien de prévu demain." };
      return { result: `Demain : ${items.length} prévu${items.length > 1 ? "s" : ""}. ${items.join(", ")}.` };
    }

    default:
      return { result: "Outil inconnu." };
  }
}

// ── Handler ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "animateur") {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = (await req.json()) as {
    texte?: string;
    historique?: Anthropic.MessageParam[];
  };
  const texte = body.texte?.trim();
  if (!texte) return Response.json({ reponse: "Commande vide, réessayez." });

  // Conversation multi-tours : on reprend l'historique fourni par le client.
  // Borné pour garder le coût bas ; on coupe sur une frontière "user" pour ne pas
  // casser l'appairage tool_use / tool_result.
  let historique = Array.isArray(body.historique) ? body.historique : [];
  if (historique.length > 24) {
    const idx = historique.findIndex((m, i) => i >= historique.length - 24 && m.role === "user");
    historique = idx >= 0 ? historique.slice(idx) : [];
  }

  const supabase = await createClient();
  const messages: Anthropic.MessageParam[] = [...historique, { role: "user", content: texte }];
  let action: NavAction | undefined;
  let reponse = "";

  try {
    // Boucle agentique (max 4 tours, suffisant pour 1-2 appels d'outils)
    for (let i = 0; i < 4; i++) {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 400,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: TOOLS,
        messages,
      });

      if (resp.stop_reason !== "tool_use") {
        reponse = nettoyerTexte(
          resp.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join(" ")
        );
        messages.push({ role: "assistant", content: resp.content });
        break;
      }

      messages.push({ role: "assistant", content: resp.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of resp.content) {
        if (block.type === "tool_use") {
          const { result, action: a } = await executeTool(
            block.name,
            (block.input ?? {}) as Record<string, unknown>,
            supabase
          );
          if (a) action = a;
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
      }
      messages.push({ role: "user", content: toolResults });
    }
  } catch (e) {
    console.error("[VOCAL]", e);
    // En cas d'erreur (ex. historique corrompu), on repart proprement.
    return Response.json({
      reponse: "Désolé, j'ai perdu le fil. Reformulez votre demande.",
      historique: [],
    });
  }

  if (!reponse) {
    reponse = action ? "C'est fait." : "Je n'ai pas compris, reformulez votre demande.";
  }

  return Response.json({ reponse, action, historique: messages });
}
