"use client";

import { supprimerNews } from "@/app/animateur/news/actions";
import { useRouter } from "next/navigation";

export default function BoutonSupprimerNews({ id }: { id: string }) {
  const router = useRouter();
  async function handleClick() {
    if (!confirm("Supprimer cette news définitivement ?")) return;
    await supprimerNews(id);
    router.refresh();
  }
  return (
    <button
      onClick={handleClick}
      className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
    >
      🗑 Supprimer
    </button>
  );
}
