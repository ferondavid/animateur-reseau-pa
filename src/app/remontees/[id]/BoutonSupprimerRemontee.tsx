"use client";

import { deleteRemontee } from "./actions";

export default function BoutonSupprimerRemontee({ id }: { id: string }) {
  return (
    <form action={deleteRemontee}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Supprimer cette remontée définitivement ?")) {
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
