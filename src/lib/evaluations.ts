// Libellés et ordre des 6 questions d'évaluation — source de vérité partagée
export const QUESTIONS_EVAL = [
  { key: "q1_ecoute", label: "Écoute et compréhension de vos besoins" },
  { key: "q2_pertinence", label: "Pertinence des conseils donnés" },
  { key: "q3_solutions", label: "Qualité des solutions proposées" },
  { key: "q4_suivi", label: "Suivi des actions précédentes" },
  { key: "q5_disponibilite", label: "Disponibilité et réactivité" },
  { key: "q6_satisfaction_globale", label: "Satisfaction globale" },
] as const;

export type QuestionKey = (typeof QUESTIONS_EVAL)[number]["key"];

export function moyenneNotes(
  e: Record<string, number | null>
): number | null {
  const vals = QUESTIONS_EVAL.map((q) => e[q.key] as number | null).filter(
    (v): v is number => v !== null && v > 0
  );
  if (vals.length === 0) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}
