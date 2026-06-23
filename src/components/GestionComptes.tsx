"use client";

import { useState, useTransition } from "react";
import { titreMagasin } from "@/lib/magasin";
import { enregistrerCompte, supprimerCompte } from "@/app/animateur/comptes/actions";
import { Search, Save, Trash2, Check, KeyRound } from "lucide-react";

export type LigneCompte = {
  id: string;
  nom: string;
  enseigne: string | null;
  ville: string | null;
  login: string;
  mot_de_passe: string;
  actif: boolean;
  aCompte: boolean;
};

function Row({ l }: { l: LigneCompte }) {
  const [login, setLogin] = useState(l.login);
  const [mdp, setMdp] = useState(l.mot_de_passe);
  const [actif, setActif] = useState(l.actif);
  const [aCompte, setACompte] = useState(l.aCompte);
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, start] = useTransition();

  const dirty = login !== l.login || mdp !== l.mot_de_passe || actif !== l.actif;

  function save() {
    setMsg(null);
    start(async () => {
      const r = await enregistrerCompte(l.id, login, mdp, actif);
      setMsg(r);
      if (r.ok) setACompte(true);
    });
  }
  function remove() {
    if (!confirm("Supprimer l'accès de cet associé ?")) return;
    setMsg(null);
    start(async () => {
      await supprimerCompte(l.id);
      setLogin(""); setMdp(""); setActif(true); setACompte(false);
      setMsg({ ok: true });
    });
  }

  return (
    <div className="pa-card p-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--pa-ink)" }}>{titreMagasin(l.enseigne, l.nom)}</p>
          {l.ville && <p className="text-xs" style={{ color: "var(--pa-muted)" }}>{l.ville}</p>}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={aCompte
            ? (actif ? { background: "#D2F2E7", color: "#0F8C68" } : { background: "#FBF1D8", color: "#B07D14" })
            : { background: "#ECEAF3", color: "#6F6982" }}>
          {aCompte ? (actif ? "Actif" : "Désactivé") : "Pas de compte"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Identifiant" autoCapitalize="none" className="pa-input" />
        <input value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="Mot de passe" className="pa-input" />
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--pa-ink)" }}>
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} style={{ accentColor: "#6B4FD8" }} />
          Compte actif
        </label>
        <div className="flex items-center gap-2">
          {msg?.error && <span className="text-xs font-semibold" style={{ color: "#C0476E" }}>{msg.error}</span>}
          {msg?.ok && !dirty && <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: "#0F8C68" }}><Check size={13} /> Enregistré</span>}
          {aCompte && (
            <button onClick={remove} disabled={pending}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: "#FBE0E8", color: "#C0476E" }}>
              <Trash2 size={13} /> Supprimer
            </button>
          )}
          <button onClick={save} disabled={pending || !login.trim() || !mdp.trim()}
            className="inline-flex items-center gap-1 pa-btn-primary px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60">
            <Save size={13} /> {pending ? "…" : aCompte ? "Mettre à jour" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestionComptes({ lignes }: { lignes: LigneCompte[] }) {
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState<"tous" | "avec" | "sans">("tous");

  const affichees = lignes.filter((l) => {
    if (filtre === "avec" && !l.aCompte) return false;
    if (filtre === "sans" && l.aCompte) return false;
    if (search.trim()) {
      const hay = `${l.enseigne ?? ""} ${l.nom} ${l.ville ?? ""} ${l.login}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const nbAvec = lignes.filter((l) => l.aCompte).length;

  return (
    <div className="space-y-4">
      <div className="pa-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--pa-muted)" }}>
          <KeyRound size={15} style={{ color: "#6B4FD8" }} />
          <span><strong style={{ color: "var(--pa-ink)" }}>{nbAvec}</strong> / {lignes.length} associés ont un accès</span>
        </div>
        <div className="relative">
          <Search size={14} style={{ color: "var(--pa-muted)", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un associé…" className="pa-input" style={{ paddingLeft: 34 }} />
        </div>
        <div className="flex gap-2">
          {([["tous", "Tous"], ["avec", "Avec accès"], ["sans", "Sans accès"]] as const).map(([k, lab]) => (
            <button key={k} onClick={() => setFiltre(k)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
              style={filtre === k ? { background: "#6B4FD8", color: "#fff" } : { background: "#ECEAF3", color: "#6F6982" }}>
              {lab}
            </button>
          ))}
        </div>
      </div>

      {affichees.map((l) => <Row key={l.id} l={l} />)}
    </div>
  );
}
