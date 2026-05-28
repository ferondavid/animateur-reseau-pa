"use client";

import { deleteVisite } from "./actions";

export default function BoutonSupprimerVisite({
  id,
  magasinId,
}: {
  id: string;
  magasinId?: string;
}) {
  return (
    <form action={deleteVisite}>
      <input type="hidden" name="id" value={id} />
      {magasinId && <input type="hidden" name="magasin_id" value={magasinId} />}
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Supprimer cette visite définitivement ?")) {
            e.preventDefault();
          }
        }}
        className="px-4 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        Supprimer
      </button>
    </form>
  );
}
