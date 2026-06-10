import Link from "next/link";
import type { EvtAgenda } from "@/lib/agenda-unifie";

const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS  = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const TYPE_RDV_META: Record<string, { emoji: string; cls: string; label: string }> = {
  physique: { emoji: "🏪", cls: "bg-blue-100 text-blue-700",       label: "Physique" },
  tel:      { emoji: "📞", cls: "bg-emerald-100 text-emerald-700", label: "Téléphone" },
  visio:    { emoji: "💻", cls: "bg-purple-100 text-purple-700",   label: "Visio" },
};

const SOURCE_META: Record<EvtAgenda["source"], { emoji: string; cls: string; label: string }> = {
  google: { emoji: "📆", cls: "bg-slate-100 text-slate-600",     label: "Google" },
  rdv:    { emoji: "📅", cls: "bg-blue-100 text-blue-700",       label: "RDV" },
  visite: { emoji: "🚗", cls: "bg-amber-100 text-amber-700",     label: "Visite" },
};

function fmtDate(d: Date): string {
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}
function fmtHeure(d: Date): string {
  return d.toTimeString().slice(0, 5).replace(":", "h");
}

export default function CardEvtAgenda({ evt }: { evt: EvtAgenda }) {
  const meta = evt.source === "rdv" && evt.typeRdv
    ? TYPE_RDV_META[evt.typeRdv]
    : SOURCE_META[evt.source];

  const magasinAffich = evt.magasinEnseigne || evt.magasinNom;

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors flex items-start gap-3">
      {/* Icône source */}
      <div className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg ${meta.cls} text-lg`}>
        {meta.emoji}
      </div>

      {/* Bloc date */}
      <div className="shrink-0 w-12 text-center">
        <div className="text-sm font-bold text-slate-900 leading-tight">{evt.debut.getDate()}</div>
        <div className="text-[10px] text-slate-400 uppercase leading-tight">
          {MOIS[evt.debut.getMonth()].replace(".", "")}
        </div>
        {!evt.journeeEntiere && (
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">{fmtHeure(evt.debut)}</div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 truncate">{evt.titre}</div>
        <div className="text-xs text-slate-500 truncate mt-0.5">
          {evt.source === "rdv" || evt.source === "visite" ? (
            <>
              {magasinAffich && <span>{magasinAffich}</span>}
              {evt.magasinVille && <span className="text-slate-400"> · {evt.magasinVille}</span>}
            </>
          ) : (
            <>
              {evt.lieu && <span>📍 {evt.lieu}</span>}
              {!evt.lieu && <span className="text-slate-400">{fmtDate(evt.debut)}{!evt.journeeEntiere && ` · ${fmtHeure(evt.debut)}`}</span>}
            </>
          )}
        </div>

        {/* Badges secondaires */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {evt.source === "google" ? "Agenda Google" : evt.source === "rdv" ? `RDV ${TYPE_RDV_META[evt.typeRdv ?? "physique"]?.label ?? ""}` : "Visite planifiée"}
          </span>
          {evt.nbInvites != null && evt.nbInvites > 0 && (
            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
              +{evt.nbInvites} invité{evt.nbInvites > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Lien détail */}
      {evt.urlDetail && (
        <Link href={evt.urlDetail} className="shrink-0 text-xs text-blue-600 hover:underline font-medium self-center">
          →
        </Link>
      )}
    </div>
  );
}
