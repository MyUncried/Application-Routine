/**
 * PRE-5 story 2.5 (FR-30, AD-24, R-11, §9-7) — option affichée par le segmenté « Cadence »
 * de la Feuille, lue sur la valeur du Bip de cadence. Recette du 19/10 (RC-10) : trois
 * options seulement, Autre / 1 s / Sans ; 2 s et 5 s ne sont plus des options.
 *
 * Fonction pure, sans mémoire : 0 → Sans ; 1 → 1 s ; toute autre valeur (2 et 5 compris)
 * → Autre ; `null` (non renseignée) → aucune option. Aucune valeur personnalisée n'est
 * retenue (D-312, D-313) : la donnée reste `cadenceBeepIntervalSeconds`, sans migration.
 */
export type CadenceOption = "OTHER" | "1" | "NONE";

/** Ordre des options du segmenté, de gauche à droite (Sans à droite, comme les autres segmentés). */
export const CADENCE_OPTIONS: readonly CadenceOption[] = ["OTHER", "1", "NONE"];

/** Valeur écrite par une option fixe ; Autre n'écrit rien (il révèle le ± existant). */
export const CADENCE_OPTION_SECONDS: Readonly<Record<Exclude<CadenceOption, "OTHER">, number>> = {
  "1": 1,
  NONE: 0,
};

export function cadenceOptionOf(value: number | null): CadenceOption | null {
  if (value === null) return null;
  if (value === 0) return "NONE";
  if (value === 1) return "1";
  return "OTHER";
}
