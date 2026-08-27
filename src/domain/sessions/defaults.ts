/**
 * Valeurs canoniques du Domaine pour la tranche T01 (Séance simple).
 *
 * Deux natures de constantes :
 * - « fixées » : verrouillées par le contrat T01, non modifiables, non
 *   exposées à l'utilisateur (Cycle, Tour, Série, Pause, position de
 *   l'unique Activité) ;
 * - « par défaut » : point de départ proposé à la création d'un brouillon,
 *   destinées à rester modifiables par l'utilisateur dans une interface
 *   future (couleur, compte à rebours initial, fin de séance, durée
 *   initiale d'un nouvel Exercice).
 *
 * La couleur par défaut reste centralisée dans `Session.ts`
 * (`DEFAULT_SESSION_COLOR`) et n'est pas dupliquée ici.
 *
 * Les valeurs `DEFAULT` du schéma SQL (`migration001.ts`) restent un filet
 * de sécurité complémentaire ; ce module est la source de vérité.
 */

export const FIXED_SERIES_COUNT = 1 as const;
export const FIXED_PAUSE_SECONDS = 0 as const;
export const FIXED_CYCLE_REPEAT_COUNT = 1 as const;
export const FIXED_TOUR_REPEAT_COUNT = 1 as const;
export const FIXED_ACTIVITY_STRUCTURAL_POSITION = "IN_TOUR" as const;
export const FIXED_ACTIVITY_POSITION = 0 as const;

export const DEFAULT_INITIAL_COUNTDOWN_SECONDS = 10 as const;
export const DEFAULT_FINAL_PHASE_SECONDS = 5 as const;
export const DEFAULT_EXERCISE_DURATION_SECONDS = 30 as const;

/**
 * Valeurs par défaut du brouillon d'Exercice (T01-S08) — distinctes de
 * `FIXED_SERIES_COUNT`/`FIXED_PAUSE_SECONDS` ci-dessus, qui restent le
 * garde-fou T01-S01 de `SqliteSessionRepository.ts` (`assertT01S01Row`),
 * non touché par cette tranche. Mêmes valeurs numériques par coïncidence
 * (1 et 0), deux constantes distinctes pour ne pas avoir à modifier la
 * couche de persistance avant T01-S09.
 */
export const DEFAULT_SERIES_COUNT = 1 as const;
export const DEFAULT_PAUSE_SECONDS = 0 as const;
export const DEFAULT_EXECUTION_MODE = "DURATION" as const;
/**
 * Valeur proposée par `ExerciseScreen` (T01-S08) au passage local du mode
 * Durée vers le mode Répétitions (`08` l.924, colonne « Valeur par défaut »
 * de `Nombre de répétitions`) — jamais lue par `createExerciseDraft()`
 * lui-même, qui démarre toujours en mode Durée (`repetitionCount: null`).
 */
export const DEFAULT_REPETITION_COUNT = 1 as const;
