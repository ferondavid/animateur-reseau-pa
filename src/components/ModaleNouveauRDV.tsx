"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Magasin = { id: string; nom: string; enseigne: string | null };
type TypeRDV = "physique" | "tel" | "visio";

type Props = {
  magasinId: string;
  autresMagasins: Magasin[];
  onClose: () => void;
};

const TYPES: { value: TypeRDV; label: string; emoji: string }[] = [
  { value: "physique", label: "Physique", emoji: "🏪" },
  { value: "tel", label: "Téléphone", emoji: "📞" },
  { value: "visio", label: "Visio", emoji: "💻" },
];

export default function ModaleNouveauRDV({ magasinId, autresMagasins, onClose }: Props) {
  const router = useRouter();
  const [type, setType] = useState<TypeRDV>("physique");
  const [invites, setInvites] = useState<string[]>([]);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

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
      setToast("Erreur lors de la demande. Réessaie.");
      return;
    }

    if (invites.length > 0) {
      await supabase.from("rendez_vous_invites").insert(
        invites.map((mid) => ({ rendez_vous_id: rdv.id, magasin_id: mid }))
      );
    }

    setLoading(false);
    setToast("Demande de RDV envoyée !");
    setTimeout(() => {
      onClose();
      router.refresh();
    }, 1200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">📅 Demander un RDV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        {toast && (
          <div className={`rounded-xl px-4 py-2 text-sm font-medium ${toast.includes("Erreur") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
            {toast}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Type de RDV</label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-colors ${
                    type === t.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Objet *</label>
            <input name="objet" required type="text" placeholder="Ex : Point trimestriel" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date souhaitée *</label>
              <input name="date_souhaitee" required type="date" min={today} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Heure (optionnel)</label>
              <input name="heure_souhaitee" type="time" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          {type === "physique" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Lieu proposé</label>
              <input name="lieu" type="text" placeholder="Au magasin" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          )}

          {type === "visio" && (
            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
              Le lien de visio sera envoyé après confirmation de l&apos;animateur.
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Message (optionnel)</label>
            <textarea name="message" rows={2} placeholder="Informations complémentaires…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y" />
          </div>

          {autresMagasins.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Inviter d&apos;autres membres ({invites.length}/10)
              </label>
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-slate-100 p-1">
                {magasinsFiltres.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={invites.includes(m.id)}
                      onChange={() => toggleInvite(m.id)}
                      className="accent-blue-500"
                    />
                    <span className="text-slate-700">{m.enseigne ? `${m.enseigne} — ${m.nom}` : m.nom}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
              {loading ? "Envoi…" : "Envoyer la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
