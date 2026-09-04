/**
 * Brouillon local de Séance (T01) : représentation en mémoire, potentiellement
 * incomplète, distincte de `CreateSessionInput`. « Le brouillon reste local
 * jusqu'à l'enregistrement final » — rien ici ne persiste quoi que ce soit.
 *
 * `toCreateSessionInput` emploie le même contrat de résultat structuré que
 * le reste des validations du Domaine : succès avec un `CreateSessionInput`
 * prêt à persister, ou échec listant **toutes** les violations déterminables
 * (complétude ET contenu, jamais seulement la première catégorie rencontrée).
 * Elle ne réimplémente aucune règle de bornes : elle réutilise les
 * validateurs élémentaires de `validation.ts`, puis délègue l'assemblage
 * final à `validateCreateSessionInput`, qui reste la validation complète de
 * l'entrée persistable. Elle ne lève jamais d'exception.
 */

import type { CreateSessionInput, Session, SessionColor } from "./Session";
import { DEFAULT_SESSION_COLOR } from "./Session";
import {
  DEFAULT_EXECUTION_MODE,
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_PAUSE_SECONDS,
  DEFAULT_SERIES_COUNT,
} from "./defaults";
import { fail, type ValidationResult, type ValidationViolation } from "./errors";
import {
  validateCreateSessionInput,
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateFinalPhaseSeconds,
  validateInitialCountdownSeconds,
  validateInstruction,
  validateSessionColor,
  validateSessionName,
} from "./validation";

/**
 * Mode d'exécution d'un Exercice (T01-S08, RM-034) : soit une durée, soit
 * un nombre de répétitions — jamais les deux à la fois.
 */
export type SessionDraftExerciseExecutionMode = "DURATION" | "REPETITIONS";

export type SessionDraftExercise = {
  /**
   * Identifiant stable, propre au brouillon (jamais un identifiant de
   * persistance SQLite — voir la note de tête de `toCreateSessionInput`) —
   * introduit par la complétion REWORK12 (« Plusieurs activités et bouton
   * persistant ») pour permettre l'édition ciblée d'une Activité au sein
   * d'une collection ordonnée. Fourni par l'appelant (`createExerciseDraft`
   * ne génère jamais lui-même d'identifiant — ce fichier reste une fonction
   * pure, sans dépendance `expo-crypto`/React ; `ExerciseScreen.tsx` est
   * responsable de la génération réelle, via `Crypto.randomUUID()`, déjà
   * utilisé ailleurs dans le projet pour les identifiants persistés).
   */
  readonly id: string;
  readonly name: string;
  readonly executionMode: SessionDraftExerciseExecutionMode;
  /** Non nul uniquement en mode `DURATION` (RM-034). */
  readonly durationSeconds: number | null;
  /** Non nul uniquement en mode `REPETITIONS` (RM-034). */
  readonly repetitionCount: number | null;
  /** Toujours entier ≥ 1 (RM-035), borné à 99 en interface (D-092). */
  readonly seriesCount: number;
  /** Pause après Série, en secondes (RM-037). */
  readonly pauseSeconds: number;
  readonly instruction: string | null;
  /** Identifiants stables du référentiel `bodyZones.ts` (T01-S08, D-093) — sélection multiple, ordre indifférent. */
  readonly bodyZoneIds: readonly string[];
};

export type SessionDraft = {
  readonly name: string;
  readonly color: SessionColor;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  /**
   * Collection ORDONNÉE d'Activités (T01-S08, complétion REWORK12 — « La
   * transformation du brouillon actuel, limité à un champ `exercise`
   * unique, vers une collection ordonnée d'activités est explicitement
   * autorisée dans ce lot »). Remplace l'ancien champ `exercise:
   * SessionDraftExercise | null`. L'ordre de ce tableau EST l'ordre
   * d'insertion/affichage dans `Composition d'une séance` — aucun index de
   * tri séparé. Le déplacement réel (réorganisation par geste) reste hors
   * périmètre de S08 et appartient à S09 (poignée indicative uniquement,
   * COMP-01) ; seuls l'ajout en fin de collection et le remplacement d'un
   * élément existant par son `id` sont exercés en S08.
   */
  readonly exercises: readonly SessionDraftExercise[];
};

/** Brouillon de Séance vide, initialisé avec les valeurs canoniques par défaut (aucune Activité définie). */
export function createEmptyDraft(): SessionDraft {
  return {
    name: "",
    color: DEFAULT_SESSION_COLOR,
    initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
    finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
    exercises: [],
  };
}

/**
 * Brouillon d'Exercice vide, destiné au parcours « Ajouter une activité »
 * (T01-S08) : nom vide, mode Durée par défaut (`DEFAULT_EXECUTION_MODE`),
 * durée initiale canonique (`DEFAULT_EXERCISE_DURATION_SECONDS`), une
 * Série sans pause (`DEFAULT_SERIES_COUNT`/`DEFAULT_PAUSE_SECONDS`), aucune
 * consigne, aucune zone corporelle sélectionnée.
 *
 * `id` est désormais un paramètre obligatoire (complétion REWORK12) —
 * fourni par l'appelant, jamais généré ici (fonction pure).
 */
export function createExerciseDraft(id: string): SessionDraftExercise {
  return {
    id,
    name: "",
    executionMode: DEFAULT_EXECUTION_MODE,
    durationSeconds: DEFAULT_EXERCISE_DURATION_SECONDS,
    repetitionCount: null,
    seriesCount: DEFAULT_SERIES_COUNT,
    pauseSeconds: DEFAULT_PAUSE_SECONDS,
    instruction: null,
    bodyZoneIds: [],
  };
}

/**
 * Convertit une `Session` persistée vers un `SessionDraft` modifiable —
 * l'inverse de `toCreateSessionInput`. Fonction pure, aucune dépendance
 * React ou SQLite. Copie sans perte les champs éditables (nom, couleur,
 * phases, nom/mode/durée-ou-répétitions/séries/pause/consigne de
 * l'Exercice) ; les champs d'identité et d'audit (`id`, `ownerId`,
 * `status`, `createdAt`, `updatedAt`, identifiants et `repeatCount` de
 * `cycle`/`tour`, et sur l'Exercice `id`/`type`/`structuralPosition`/
 * `position`) ne sont volontairement pas repris : `SessionDraft` ne les
 * modélise pas, et `sessionId` est transmis séparément lors de
 * l'enregistrement d'une modification.
 *
 * `bodyZoneIds` vaut toujours `[]` ici : `Session`/`DurationExercise`
 * (`Session.ts`) ne modélisent pas encore les Zones corporelles — cette
 * association n'est pas persistée avant une tranche ultérieure. Ce champ
 * n'est donc jamais restauré à la réouverture pour l'instant (T01-S08
 * n'appelle de toute façon jamais cette fonction : la persistance/réouverture
 * réelle restent hors périmètre).
 *
 * Limite disclosée (complétion REWORK12) : `Session`/`Cycle`/`Tour`
 * (`Session.ts`) modélisent toujours une seule Activité persistée
 * (`cycle.tour.exercise`, jamais un tableau) — cette fonction produit donc
 * une collection à un seul élément. La collection à plusieurs éléments du
 * brouillon (`SessionDraft.exercises`) n'a pas d'équivalent persisté avant
 * une tranche ultérieure qui étendrait `Session`/SQLite en conséquence,
 * hors périmètre de cette mission (« Enregistrer la séance », CE-T01-11,
 * reste lui-même hors périmètre T01-S08).
 */
export function toSessionDraft(session: Session): SessionDraft {
  return {
    name: session.name,
    color: session.color,
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    exercises: [
      {
        id: session.cycle.tour.exercise.id,
        name: session.cycle.tour.exercise.name,
        executionMode: session.cycle.tour.exercise.executionMode,
        durationSeconds: session.cycle.tour.exercise.durationSeconds,
        repetitionCount: session.cycle.tour.exercise.repetitionCount,
        seriesCount: session.cycle.tour.exercise.seriesCount,
        pauseSeconds: session.cycle.tour.exercise.pauseSeconds,
        instruction: session.cycle.tour.exercise.instruction,
        bodyZoneIds: [],
      },
    ],
  };
}

function bodyZoneIdSetsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

/**
 * Compare deux brouillons d'Exercice champ à champ — exportée (T01-S08)
 * pour être réutilisée directement par `ExerciseScreen` (comparaison de sa
 * copie de travail locale à son instantané initial, indépendamment du
 * `SessionDraft` partagé). Les zones corporelles sont comparées comme un
 * ensemble : leur ordre n'est pas significatif. `id` est comparé comme
 * n'importe quel autre champ (complétion REWORK12) — sans effet pratique
 * ici, puisque `ExerciseScreen` compare toujours une copie de travail à son
 * propre instantané initial, qui partagent nécessairement le même `id`
 * tout au long d'une session d'édition.
 */
export function exerciseEquals(
  a: SessionDraftExercise | null,
  b: SessionDraftExercise | null,
): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.executionMode === b.executionMode &&
    a.durationSeconds === b.durationSeconds &&
    a.repetitionCount === b.repetitionCount &&
    a.seriesCount === b.seriesCount &&
    a.pauseSeconds === b.pauseSeconds &&
    a.instruction === b.instruction &&
    bodyZoneIdSetsEqual(a.bodyZoneIds, b.bodyZoneIds)
  );
}

/**
 * Compare deux collections d'Activités élément par élément, dans l'ORDRE
 * (l'ordre lui-même est significatif — voir `SessionDraft.exercises`) —
 * introduite par la complétion REWORK12, réutilisée par
 * `isSessionDraftDirty` ci-dessous.
 */
function exercisesEqual(
  a: readonly SessionDraftExercise[],
  b: readonly SessionDraftExercise[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((exercise, index) => exerciseEquals(exercise, b[index]));
}

/**
 * Compare les champs fonctionnels d'un brouillon à ceux d'un brouillon vide
 * (`createEmptyDraft()`) — utilisé par la garde de sortie de Composition
 * (T01-S07) pour décider si une navigation sortante doit être bloquée.
 * Fonction pure, aucune dépendance React/navigation.
 */
export function isSessionDraftDirty(draft: SessionDraft): boolean {
  const initial = createEmptyDraft();
  return (
    draft.name !== initial.name ||
    draft.color !== initial.color ||
    draft.initialCountdownSeconds !== initial.initialCountdownSeconds ||
    draft.finalPhaseSeconds !== initial.finalPhaseSeconds ||
    !exercisesEqual(draft.exercises, initial.exercises)
  );
}

function collectViolations(
  ...results: readonly ValidationResult<unknown>[]
): readonly ValidationViolation[] {
  const violations: ValidationViolation[] = [];
  for (const result of results) {
    if (!result.ok) {
      violations.push(...result.violations);
    }
  }
  return violations;
}

/**
 * Valide et convertit un brouillon vers un `CreateSessionInput` persistable.
 *
 * Agrège systématiquement **toutes** les violations déterminables — champs
 * de la Séance et champs de l'Exercice, complétude et contenu confondus —
 * avant de retourner un échec ; ne s'arrête jamais à la première catégorie
 * de défaut rencontrée. Ne délègue l'assemblage final à
 * `validateCreateSessionInput` que lorsque plus aucune violation n'a été
 * relevée.
 *
 * Limite disclosée (complétion REWORK12) : `CreateSessionInput`/`Session`
 * (`Session.ts`) modélisent toujours une seule Activité persistable
 * (`exercise`, jamais un tableau) — cette fonction continue donc de ne
 * valider/assembler que la PREMIÈRE Activité de `draft.exercises`
 * (`exercises[0] ?? null`, même comportement que l'ancien champ singulier
 * `exercise` pour une collection à au plus un élément). Une collection à
 * plusieurs Activités n'est pas encore représentable par
 * `CreateSessionInput` — cette fonction n'est de toute façon jamais
 * invoquée par un parcours réellement câblé en T01-S08 (« Enregistrer la
 * séance », CE-T01-11, reste hors périmètre ; `Continuer`/`Enregistrer`
 * restent désactivés dans `CompositionScreen.tsx`), donc sans régression
 * observable pour l'utilisateur de cette tranche.
 */
export function toCreateSessionInput(draft: SessionDraft): ValidationResult<CreateSessionInput> {
  const violations: ValidationViolation[] = [
    ...collectViolations(
      validateSessionName(draft.name),
      validateSessionColor(draft.color),
      validateInitialCountdownSeconds(draft.initialCountdownSeconds),
      validateFinalPhaseSeconds(draft.finalPhaseSeconds),
    ),
  ];

  const exerciseDraft = draft.exercises[0] ?? null;

  if (exerciseDraft === null) {
    violations.push(
      { code: "REQUIRED", field: "exercise.name" },
      { code: "REQUIRED", field: "exercise.durationSeconds" },
    );
  } else {
    violations.push(...collectViolations(validateExerciseName(exerciseDraft.name)));

    if (exerciseDraft.durationSeconds === null) {
      violations.push({ code: "REQUIRED", field: "exercise.durationSeconds" });
    } else {
      violations.push(
        ...collectViolations(validateExerciseDurationSeconds(exerciseDraft.durationSeconds)),
      );
    }

    violations.push(...collectViolations(validateInstruction(exerciseDraft.instruction)));
  }

  if (violations.length > 0) {
    return fail(violations);
  }

  // Every individual check above passed: the exercise and its duration are
  // necessarily present here. Final assembly still goes through
  // `validateCreateSessionInput`, the single complete validator of a
  // persistable entry.
  const exercise = exerciseDraft as SessionDraftExercise & { durationSeconds: number };

  return validateCreateSessionInput({
    name: draft.name,
    color: draft.color,
    initialCountdownSeconds: draft.initialCountdownSeconds,
    finalPhaseSeconds: draft.finalPhaseSeconds,
    exercise: {
      name: exercise.name,
      durationSeconds: exercise.durationSeconds,
      instruction: exercise.instruction,
    },
  });
}
