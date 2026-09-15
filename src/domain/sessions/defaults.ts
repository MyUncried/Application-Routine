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

import type { SideMode } from "./sideMode";

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
 * T01-S10 : valeur de départ de la répétition du Tour dans un brouillon
 * (`SessionDraft.tourRepeatCount`). Distincte de `FIXED_TOUR_REPEAT_COUNT`
 * (garde-fou T01-S01 de la persistance, inchangé) — même valeur numérique,
 * deux constantes distinctes : le Tour devient réglable `1..99` (D-058)
 * sans toucher le garde-fou historique.
 */
export const DEFAULT_TOUR_REPEAT_COUNT = 1 as const;

/**
 * @deprecated T01-S10 : durée de départ d'une Récupération explicite ajoutée
 * comme ACTIVITÉ AUTONOME dans un brouillon (D-041). **T02-S02 supprime cette
 * notion** — la Récupération est désormais une durée attachée
 * (`DEFAULT_RECOVERY_SECONDS`, valeur neutre `0`) et aucune Activité
 * `RECOVERY` ne peut plus être créée. Constante conservée sans consommateur
 * pour ne pas casser un import déjà publié.
 */
export const DEFAULT_RECOVERY_DURATION_SECONDS = 30 as const;

/**
 * **T02-S02** : valeur de départ de la Récupération ATTACHÉE d'une Activité
 * (`SessionDraftExercise.recoverySeconds`).
 *
 * `0` — valeur NEUTRE, pas une durée proposée : la Récupération est
 * facultative (`13 – Contrats d'écran.md`, CE-T01-13 « Pause et Récupération
 * peuvent valoir `0 s` ») et une Activité créée n'en porte aucune tant que
 * l'utilisateur n'en confirme pas une. Distincte de
 * `DEFAULT_RECOVERY_DURATION_SECONDS` (`30`), qui décrivait l'ancienne
 * Activité autonome supprimée par cette tranche.
 */
export const DEFAULT_RECOVERY_SECONDS = 0 as const;

/** T01-S10 : type d'Activité par défaut d'un nouveau brouillon (Exercice, D-061). */
export const DEFAULT_ACTIVITY_TYPE = "EXERCISE" as const;

/**
 * Position structurelle par défaut d'un nouveau brouillon d'Activité.
 *
 * T01-S10 la fixait à `"IN_TOUR"`, seule zone alors réellement peuplée.
 * **T02-S01** la porte à `"BEFORE_TOUR"` : `13 – Contrats d'écran.md`,
 * CE-T01-09 (« Une nouvelle Activité est insérée après le Compte à rebours,
 * avant le Tour, puis peut être déplacée ») et CE-T02-01 rendent le
 * déplacement réel disponible — une Activité créée démarre donc AVANT le
 * Tour et n'y entre que par un déplacement explicite de l'utilisateur.
 *
 * Ne concerne QUE les Activités créées après cette tranche : aucune Séance
 * persistée n'est réorganisée à la lecture (`toSessionDraft` reprend toujours
 * la zone réellement persistée, AC-13).
 */
export const DEFAULT_STRUCTURAL_POSITION = "BEFORE_TOUR" as const;

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

/**
 * V2-BILAT-01 : direction par défaut d'une occurrence d'Activité de Séance
 * (`Activity.sideMode`/`SessionDraftExercise.sideMode`) — `UNILATERAL`, le
 * comportement historique (aucune répétition de côté).
 */
export const DEFAULT_SIDE_MODE: SideMode = "UNILATERAL";

/** V2-BILAT-01 : direction par défaut du Tour (`Session.cycle.tour.sideMode`/`SessionDraft.tourSideMode`) — même valeur neutre que `DEFAULT_SIDE_MODE`. */
export const DEFAULT_TOUR_SIDE_MODE: SideMode = "UNILATERAL";
