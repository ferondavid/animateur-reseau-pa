type Props = {
  url: string | null | undefined;
  nom?: string;
};

function getType(url: string): "image" | "pdf" | "video" | "audio" | "autre" {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["mp3", "m4a", "wav", "ogg"].includes(ext)) return "audio";
  return "autre";
}

export default function PieceJointe({ url, nom }: Props) {
  if (!url) return null;

  const type = getType(url);
  const nomFichier = nom ?? url.split("/").pop() ?? "fichier";

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        📎 Pièce jointe
      </p>

      {type === "image" && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block cursor-zoom-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={nomFichier}
            className="max-w-full rounded-xl border border-slate-200 shadow-sm object-contain"
            style={{ maxHeight: 500 }}
            onError={(e) => {
              (e.currentTarget.nextSibling as HTMLElement | null)?.removeAttribute("hidden");
            }}
          />
          <p className="hidden text-xs text-amber-600 mt-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ Si la pièce jointe ne s&apos;affiche pas, vérifie que le bucket Supabase &quot;photos-remontees&quot; est en Public.
          </p>
        </a>
      )}

      {type === "pdf" && (
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <iframe src={url} width="100%" height="600" title={nomFichier} />
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Ouvrir dans un nouvel onglet ↗
            </a>
          </div>
        </div>
      )}

      {type === "video" && (
        <video controls src={url} className="w-full rounded-xl border border-slate-200 shadow-sm">
          Votre navigateur ne supporte pas la lecture vidéo.
        </video>
      )}

      {type === "audio" && (
        <audio controls src={url} className="w-full" />
      )}

      {type === "autre" && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400 shrink-0"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
          <div>
            <p className="text-sm font-medium text-slate-900 break-all">{nomFichier}</p>
            <p className="text-xs text-slate-400 mt-0.5">Cliquer pour télécharger</p>
          </div>
        </a>
      )}
    </div>
  );
}
