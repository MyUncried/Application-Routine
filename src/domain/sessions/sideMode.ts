/**
 * Bilatéralité (V2-BILAT-01, complétée par V2-PRE-1 plan §3.3) : configuration
 * du côté d'exécution d'une occurrence d'Activité de Séance, préalable à T03
 * (aucune donnée d'Exécution ni de Résultat n'est modélisée ici).
 *
 * `SideMode` est un enum à trois valeurs, entièrement gouverné par
 * l'interface (un contrôle cyclique, jamais une saisie libre) :
 *
 * - `UNILATERAL` — un seul côté, aucune répétition (comportement historique,
 *   valeur par défaut) ;
 * - `RIGHT_LEFT` — bilatéral, droite puis gauche (« D→G ») ;
 * - `LEFT_RIGHT` — bilatéral, gauche puis droite (« G→D »).
 *
 * **V2-PRE-1 (plan §3.3)** : « Le `sideMode` du Tour ne possède plus aucune
 * influence fonctionnelle. » La bilatéralité est désormais portée
 * EXCLUSIVEMENT par l'Exercice — `resolveEffectiveSideMode` et
 * `applyTourSideModeTransition` (résolution/transition gouvernées par le
 * Tour) sont donc retirées de ce module : la direction effective d'une
 * Activité, dans le Circuit comme hors de lui, est toujours SA PROPRE
 * direction (`activity.sideMode ?? DEFAULT_SIDE_MODE`), jamais dérivée d'un
 * Tour.
 */

export type SideMode = "UNILATERAL" | "RIGHT_LEFT" | "LEFT_RIGHT";

/** Ordre canonique des trois états — celui du cycle (`cycleSideMode`) et de toute énumération exhaustive. */
export const SIDE_MODES: readonly SideMode[] = ["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"];

export function isSideMode(value: unknown): value is SideMode {
  return typeof value === "string" && SIDE_MODES.includes(value as SideMode);
}

/**
 * Fait avancer le contrôle `Côtés` d'un cran (T02-S02… V2-BILAT-01, `## UI`
 * du plan) : `Unilatéral → D→G → G→D → Unilatéral`. Boucle indéfiniment —
 * jamais de valeur hors énumération en sortie, quelle que soit l'entrée
 * (une valeur déjà hors énumération retombe sur `UNILATERAL`, plutôt que de
 * propager une valeur invalide).
 */
export function cycleSideMode(current: SideMode): SideMode {
  const index = SIDE_MODES.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % SIDE_MODES.length;
  return SIDE_MODES[nextIndex]!;
}

/**
 * Multiplicateur de durée `L` d'une direction (plan `## Calculs`) : `1` pour
 * `UNILATERAL`, `2` pour toute direction bilatérale — jamais un troisième
 * palier, la Récupération et la direction elle-même (droite→gauche ou
 * gauche→droite) n'affectant jamais ce nombre.
 */
export function sideMultiplier(mode: SideMode): number {
  return mode === "UNILATERAL" ? 1 : 2;
}
