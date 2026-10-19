/**
 * PRE-5 story 2.5 (FR-30, AD-24, R-11, §9-7) — option affichée par le segmenté « Cadence »
 * de la Feuille (Autre / 5 s / 2 s / 1 s / Sans), lue sur la valeur du Bip de cadence.
 *
 * Fonction pure, sans mémoire : 0 → Sans ; 1, 2, 5 → l'option du même nombre ; toute autre
 * valeur → Autre ; `null` (non renseignée) → aucune option. Aucune valeur personnalisée
 * n'est retenue (D-312, D-313) : la donnée reste `cadenceBeepIntervalSeconds`.
 */
export type CadenceOption = "OTHER" | "5" | "2" | "1" | "NONE";

/** Ordre des options du segmenté, de gauche à droite. */
export const CADENCE_OPTIONS: readonly CadenceOption[] = ["OTHER", "5", "2", "1", "NONE"];

/** Valeur écrite par une option fixe ; Autre n'écrit rien (il révèle le ± existant). */
export const CADENCE_OPTION_SECONDS: Readonly<Record<Exclude<CadenceOption, "OTHER">, number>> = {
  "5": 5,
  "2": 2,
  "1": 1,
  NONE: 0,
};

export function cadenceOptionOf(value: number | null): CadenceOption | null {
  if (value === null) return null;
  if (value === 0) return "NONE";
  if (value === 1) return "1";
  if (value === 2) return "2";
  if (value === 5) return "5";
  return "OTHER";
}
