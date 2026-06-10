"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CalendarPlus, Store, Phone, Monitor, X } from "lucide-react";

type Magasin = { id: string; nom: string; enseigne: string | null };
type TypeRDV = "physique" | "tel" | "visio";

type Props = {
  magasinId: string;
  autresMagasins: Magasin[];
  onClose: () => void;
};

const TYPES: { value: TypeRDV; label: string; Icon: React.ComponentType<{ size?: number }> }[] = [
  { value: "physique", label: "Physique",   Icon: Store },
  { value: "tel",      label: "Téléphone",  Icon: Phone },
  { value: "visio",    label: "Visio",      Icon: Monitor },
];

export default function ModaleNouveauRDV({ magasinId, autresMagasins, onClose }: Props) {
  const router = useRouter();
  const [type, setType] = useState<TypeRDV>("physique");
  const [invites, setInvites] = useState<string[]>([]);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const magasinsFiltres = autresMagasins.filter((m) => {
    if (!recherche.trim()) return true;
    const hay = `${m.nom} ${m.enseigne ?? ""}`.toLowerCase();
    return hay.includes(recherche.toLowerCase());
  });

  function toggleInvite(id: string) {
    setInvites((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 10 ? [...prev, id] : prev
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();

    const { data: rdv, error } = await supabase
      .from("rendez_vous")
      .insert({
        magasin_id: magasinId,
        type,
        date_souhaitee: form.get("date_souhaitee") as string,
        heure_souhaitee: (form.get("heure_souhaitee") as string) || null,
        objet: form.get("objet") as string,
        message: (form.get("message") as string) || null,
        lieu: type === "physique" ? ((form.get("lieu") as string) || "Au magasin") : null,
        statut: "demande",
        demandeur_type: "magasin",
      })
      .select("id")
      .single();

    if (error || !rdv) {
      setLoading(false);
      const msg = error?.message ?? error?.code ?? JSON.stringify(error) ?? "Erreur inconnue";
      setErreur(`Erreur : ${msg}`);
      return;
    }
    setErreur(null);

    if (invites.length > 0) {
      await supabase.from("rendez_vous_invites").insert(
        invites.map((mid) => ({ rendez_vous_id: rdv.id, magasin_id: mid }))
      );
    }

    fetch("/api/notif/rdv-demande", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rdv.id }),
    }).catch(() => {});

    setLoading(false);
    setToast("Demande de RDV envoyée !");
    setTimeout(() => {
      onClose();
      router.refresh();
    }, 1200);
  }

  return (
    <div className="pa-modal-overlay">
      <div className="pa-modal-content w-full max-w-lg p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--pa-ink)" }}>
            <CalendarPlus size={18} style={{ color: "#3D7BE8" }} />
            Demander un RDV
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ color: "var(--pa-muted)" }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {toast && (
          <div className="rounded-xl px-4 py-2.5 text-sm font-medium"
               style={{ background: "#D4F3E8", color: "#0F8C68" }}>
            {toast}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div>
            <label className="pa-label">Type de RDV</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-1.5"
                  style={
                    type === t.value
                      ? { borderColor: "#7C6BE8", background: "rgba(124,107,232,0.08)", color: "#534AB7" }
                      : { borderColor: "rgba(124,107,232,0.2)", color: "var(--pa-muted)" }
                  }
                >
                  <t.Icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="pa-label">Objet *</label>
            <input name="objet" required type="text" placeholder="Ex : Point trimestriel" className="pa-input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="pa-label">Date souhaitée *</label>
              <input name="date_souhaitee" required type="date" min={today} className="pa-input" />
            </div>
            <div>
              <label className="pa-label">Heure (optionnel)</label>
              <input name="heure_souhaitee" type="time" className="pa-input" />
            </div>
          </div>

          {type === "physique" && (
            <div>
              <label className="pa-label">Lieu proposé</label>
              <input name="lieu" type="text" placeholder="Au magasin" className="pa-input" />
            </div>
          )}

          {type === "visio" && (
            <p className="text-xs rounded-xl px-3 py-2" style={{ background: "rgba(124,107,232,0.07)", color: "var(--pa-muted)" }}>
              Le lien de visio sera envoyé après confirmation de l&apos;animateur.
            </p>
          )}

          <div>
            <label className="pa-label">Message (optionnel)</label>
            <textarea name="message" rows={2} placeholder="Informations complémentaires…"
              className="pa-input resize-y" />
          </div>

          {autresMagasins.length > 0 && (
            <div>
              <label className="pa-label">
                Inviter d&apos;autres membres ({invites.length}/10)
              </label>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher…"
                className="pa-input mb-2 text-xs"
              />
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl p-1"
                   style={{ border: "1px solid rgba(124,107,232,0.15)" }}>
                {magasinsFiltres.map((m) => (
                  <label key={m.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors hover:bg-violet-50">
                    <input
                      type="checkbox"
                      checked={invites.includes(m.id)}
                      onChange={() => toggleInvite(m.id)}
                      className="accent-violet-500"
                    />
                    <span style={{ color: "var(--pa-ink)" }}>
                      {m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {erreur && (
            <div className="rounded-xl px-4 py-2.5 text-xs font-mono break-all"
                 style={{ background: "#FBE0E8", color: "#C0476E", border: "1px solid rgba(192,71,110,.2)" }}>
              {erreur}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="pa-btn-secondary flex-1 py-2.5 rounded-xl text-sm">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="pa-btn-primary flex-1 py-2.5 rounded-xl text-sm">
              {loading ? "Envoi…" : "Envoyer la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
