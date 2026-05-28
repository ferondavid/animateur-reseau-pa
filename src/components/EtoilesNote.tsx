"use client";

// Composant étoiles réutilisable :
// - mode="display" : lecture seule, étoiles non cliquables
// - mode="input"   : interactif, appelle onChange(note: 1-5)

interface EtoilesNoteProps {
  note: number | null;
  mode?: "display" | "input";
  onChange?: (note: number) => void;
  taille?: "sm" | "md" | "lg";
}

const tailleClasses = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-3xl",
};

export default function EtoilesNote({
  note,
  mode = "display",
  onChange,
  taille = "md",
}: EtoilesNoteProps) {
  const classe = tailleClasses[taille];

  if (mode === "display") {
    if (!note) return <span className="text-slate-300">—</span>;
    return (
      <span className={`${classe} text-amber-400 leading-none`}>
        {"★".repeat(note)}
        <span className="text-slate-200">{"★".repeat(5 - note)}</span>
      </span>
    );
  }

  // Mode interactif
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={`${classe} leading-none transition-colors ${
            note && i <= note
              ? "text-amber-400"
              : "text-slate-200 hover:text-amber-300"
          }`}
          aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
