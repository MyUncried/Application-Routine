/**
 * Brouillon local de Séance (T01) : représentation en mémoire, potentiellement
 * incomplète, distincte de `CreateSessionInput`. « Le brouillon reste local
 * jusqu'à l'enregistrement final » — rien ici ne persiste quoi que ce soit,
 * y compris une Catégorie personnalisée créée depuis l'écran `Catégories de
 * la séance` (D-107) : elle reste une entrée `categorySelections` de kind
 * `"NEW"`, jamais persistée isolément avant `Enregistrer la séance`.
 *
 * `toCreateSessionInput` emploie le même contrat de résultat structuré que
 * le reste des validations du Domaine : succès avec un `CreateSessionInput`
 * prêt à persister, ou échec listant **toutes** les violations déterminables.
 * Elle ne réimplémente aucune règle de bornes elle-même : elle assemble un
 * candidat directement depuis les champs du brouillon (déjà de la bonne
 * forme structurelle) et délègue l'intégralité de la validation/normalisation
 * à `validateCreateSessionInput` (`validation.ts`), la seule validation
 * complète d'une entrée persistable — réutilisée telle quelle par
 * `SqliteSessionRepository` en défense de dernier recours, quelle que soit
 * l'origine de l'entrée. Elle ne lève jamais d'exception.
 */

import type {
  CreateSessionCategoryInput,
  CreateSessionInput,
  Session,
  SessionColor,
} from "./Session";
import { DEFAULT_SESSION_COLOR } from "./Session";
import {
  DEFAULT_EXECUTION_MODE,
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_PAUSE_SECONDS,
  DEFAULT_SERIES_COUNT,
} from "./defaults";
import type { ValidationResult } from "./errors";
import { validateCreateSessionInput } from "./validation";

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

/**
 * Sélection d'une Catégorie dans le brouillon (T01-S09, D-106/D-107) : soit
 * une Catégorie déjà connue (prédéfinie ou persistée lors d'une Séance
 * antérieure), identifiée par `categoryId` ; soit une Catégorie
 * personnalisée créée dans ce même parcours, portant un `id` LOCAL au
 * brouillon (jamais un identifiant de persistance — même convention que
 * `SessionDraftExercise.id`) et son nom déjà normalisé
 * (`normalizeCategoryName`, écran appelant) — elle n'existe dans aucune
 * table tant que `Enregistrer la séance` n'a pas réussi.
 */
export type SessionDraftCategorySelection =
  | { readonly kind: "EXISTING"; readonly categoryId: string }
  | { readonly kind: "NEW"; readonly id: string; readonly name: string };

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
   * périmètre de S08/S09 (poignée indicative uniquement, COMP-01).
   */
  readonly exercises: readonly SessionDraftExercise[];
  /**
   * Sélection de Catégories (T01-S09) — zéro, une ou plusieurs (D-106).
   * Aucun ordre propre significatif ici : l'ordre d'AFFICHAGE dans l'écran
   * `Catégories de la séance` suit toujours le référentiel (prédéfinies par
   * `displayOrder`, puis personnalisées par `createdAt`, D-107), jamais
   * l'ordre de sélection — cette collection est un ENSEMBLE de sélections,
   * pas une séquence à préserver.
   */
  readonly categorySelections: readonly SessionDraftCategorySelection[];
};

/** Brouillon de Séance vide, initialisé avec les valeurs canoniques par défaut (aucune Activité, aucune Catégorie sélectionnée). */
export function createEmptyDraft(): SessionDraft {
  return {
    name: "",
    color: DEFAULT_SESSION_COLOR,
    initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
    finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
    exercises: [],
    categorySelections: [],
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
 * phases, TOUTES les Activités du Tour dans l'ordre — T01-S09, généralise
 * la limite REWORK12 à une seule Activité — et les Catégories déjà
 * associées, reprises comme autant de sélections `"EXISTING"`) ; les champs
 * d'identité et d'audit (`id`, `ownerId`, `status`, `createdAt`,
 * `updatedAt`, identifiants et `repeatCount` de `cycle`/`tour`, et sur
 * chaque Activité `id`/`type`/`structuralPosition`/`position`) ne sont
 * volontairement pas repris : `SessionDraft` ne les modélise pas, et
 * `sessionId` est transmis séparément lors de l'enregistrement d'une
 * modification.
 *
 * `SessionDraftExercise.id` reprend directement l'identifiant persisté de
 * l'Activité (`Activity.id`) — un identifiant stable, jamais régénéré ici
 * (édition ciblée par identifiant, même convention que `createExerciseDraft`).
 *
 * Cette fonction reste hors périmètre du parcours de création T01-S09
 * lui-même (réouverture/modification d'une Séance existante, T01-S10) —
 * elle n'est appelée par aucun écran câblé avant cette tranche future.
 */
export function toSessionDraft(session: Session): SessionDraft {
  return {
    name: session.name,
    color: session.color,
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    exercises: session.cycle.tour.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      executionMode: exercise.executionMode,
      durationSeconds: exercise.durationSeconds,
      repetitionCount: exercise.repetitionCount,
      seriesCount: exercise.seriesCount,
      pauseSeconds: exercise.pauseSeconds,
      instruction: exercise.instruction,
      bodyZoneIds: exercise.bodyZoneIds,
    })),
    categorySelections: session.categories.map((category) => ({
      kind: "EXISTING" as const,
      categoryId: category.id,
    })),
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

function categorySelectionEquals(
  a: SessionDraftCategorySelection,
  b: SessionDraftCategorySelection,
): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === "EXISTING" && b.kind === "EXISTING") {
    return a.categoryId === b.categoryId;
  }
  if (a.kind === "NEW" && b.kind === "NEW") {
    return a.id === b.id && a.name === b.name;
  }
  return false;
}

/**
 * Compare deux ensembles de sélections de Catégories — ordre indifférent
 * (`SessionDraft.categorySelections` est un ensemble, pas une séquence,
 * voir sa documentation), contenu déterminant.
 */
function categorySelectionsEqual(
  a: readonly SessionDraftCategorySelection[],
  b: readonly SessionDraftCategorySelection[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((selection) => b.some((other) => categorySelectionEquals(selection, other)));
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
    !exercisesEqual(draft.exercises, initial.exercises) ||
    !categorySelectionsEqual(draft.categorySelections, initial.categorySelections)
  );
}

/**
 * Valide et convertit un brouillon vers un `CreateSessionInput` persistable
 * (T01-S09 : TOUTES les Activités de `draft.exercises`, dans l'ordre, et
 * TOUTES les sélections de `draft.categorySelections`).
 *
 * Assemble un candidat structurellement conforme directement depuis les
 * champs du brouillon — sans revalider aucune borne elle-même — puis
 * délègue l'intégralité de la validation/normalisation à
 * `validateCreateSessionInput` (`validation.ts`), qui agrège systématiquement
 * **toutes** les violations déterminables (Séance, chaque Activité, chaque
 * Catégorie personnalisée) avant de retourner un échec ; ne s'arrête jamais
 * à la première catégorie de défaut rencontrée. Ne lève jamais d'exception.
 */
export function toCreateSessionInput(draft: SessionDraft): ValidationResult<CreateSessionInput> {
  const categories: CreateSessionCategoryInput[] = draft.categorySelections.map((selection) =>
    selection.kind === "EXISTING"
      ? { kind: "EXISTING", categoryId: selection.categoryId }
      : { kind: "NEW", name: selection.name },
  );

  return validateCreateSessionInput({
    name: draft.name,
    color: draft.color,
    initialCountdownSeconds: draft.initialCountdownSeconds,
    finalPhaseSeconds: draft.finalPhaseSeconds,
    exercises: draft.exercises.map((exercise) => ({
      name: exercise.name,
      executionMode: exercise.executionMode,
      durationSeconds: exercise.durationSeconds,
      repetitionCount: exercise.repetitionCount,
      seriesCount: exercise.seriesCount,
      pauseSeconds: exercise.pauseSeconds,
      instruction: exercise.instruction,
      bodyZoneIds: exercise.bodyZoneIds,
    })),
    categories,
  });
}
