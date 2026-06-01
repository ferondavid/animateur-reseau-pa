"use client";

import { useTransition } from "react";
import { deleteMagasin, archiverMagasin } from "./actions";

export default function BoutonSupprimer({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleArchiver() {
    if (
      !confirm(
        "🗄️ Archiver ce magasin ?\n\nIl sera masqué partout (carte, KPIs, liste par défaut) mais son historique (visites, remontées, CA…) sera conservé.\n\nRecommandé plutôt que la suppression définitive."
      )
    )
      return;
    startTransition(async () => {
      await archiverMagasin(id);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleArchiver}
        disabled={isPending}
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        {isPending ? "…" : "🗄️ Archiver"}
      </button>
      <form action={deleteMagasin}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          onClick={(e) => {
            if (
              !confirm(
                "🗑️ Supprimer définitivement ?\n\nToutes les visites, remontées, RDV, évaluations et CA mensuel liés seront aussi supprimés.\n\n⚠️ Cette action est IRRÉVERSIBLE."
              )
            ) {
              e.preventDefault();
            }
          }}
          className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          🗑️ Supprimer
        </button>
      </form>
    </div>
  );
}
