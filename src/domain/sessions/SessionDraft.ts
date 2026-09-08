/**
 * Brouillon local de Séance (T01) : représentation en mémoire, potentiellement
 * incomplète, distincte de `CreateSessionInput`. « Le brouillon reste local
 * jusqu'à l'enregistrement final » — rien ici ne persiste quoi que ce soit,
 * y compris une Catégorie personnalisée créée depuis l'écran `Catégories de
 * la séance` (D-107) : elle reste une entrée `categoryDrafts`, jamais
 * persistée isolément avant `Enregistrer la séance` — voir
 * `SessionDraftCategoryDraft` pour la séparation explicite entre son
 * existence dans le brouillon et son état sélectionné.
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
  Activity,
  ActivityType,
  CreateSessionCategoryInput,
  CreateSessionInput,
  ExerciseExecutionMode,
  Session,
  SessionColor,
  StructuralPosition,
  UpdateSessionActivityInput,
  UpdateSessionInput,
} from "./Session";
import { DEFAULT_SESSION_COLOR } from "./Session";
import {
  DEFAULT_ACTIVITY_TYPE,
  DEFAULT_EXECUTION_MODE,
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_PAUSE_SECONDS,
  DEFAULT_SERIES_COUNT,
  DEFAULT_STRUCTURAL_POSITION,
  DEFAULT_TOUR_REPEAT_COUNT,
} from "./defaults";
import type { ValidationResult } from "./errors";
import { fail } from "./errors";
import { validateCreateSessionInput, validateUpdateSessionInput } from "./validation";

/**
 * Mode d'exécution d'un Exercice dans un brouillon (T01-S08 ; T01-S10 :
 * `TO_FAILURE` ajouté, D-111) : une durée cible, un nombre de répétitions
 * cible, ou « à l'échec » (aucune cible).
 */
export type SessionDraftExerciseExecutionMode = ExerciseExecutionMode;

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
  /**
   * T01-S10 (D-061) : type de l'Activité. Le parcours de création T01-S09
   * ne produit que des Exercices (`"EXERCISE"`) ; la modification bout en
   * bout d'une Séance persistée peut réhydrater une Récupération. Un
   * brouillon de Récupération conserve `executionMode`/`seriesCount` à
   * leurs valeurs par défaut mais elles sont ignorées à la conversion
   * (`toUpdateSessionInput`).
   */
  readonly type: ActivityType;
  /** T01-S10 (D-061) : position structurelle — avant, dans, ou après le Tour. Reste `"IN_TOUR"` pour tout brouillon créé avant S10. */
  readonly structuralPosition: StructuralPosition;
  readonly name: string;
  readonly executionMode: SessionDraftExerciseExecutionMode;
  /** Non nul uniquement en mode `DURATION` — ou porte la durée d'une Récupération (RM-034 ; T01-S10). */
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
 * Catégorie personnalisée créée dans le brouillon (T01-S09, D-106/D-107,
 * correction du BLOCKING_POINT signalé au commentaire de revue 5551813745) :
 * son EXISTENCE dans le brouillon est désormais explicitement séparée de son
 * état SÉLECTIONNÉ (`SessionDraft.selectedCategoryIds`). Une Catégorie
 * personnalisée créée puis désélectionnée reste ici, disponible pour être
 * de nouveau sélectionnée sans jamais être recréée en double — seule sa
 * présence dans `selectedCategoryIds` détermine si elle est actuellement
 * associée à la Séance. `id` est LOCAL au brouillon (jamais un identifiant
 * de persistance — même convention que `SessionDraftExercise.id`) ; `name`
 * est déjà normalisé (`normalizeCategoryName`, écran appelant). Aucune
 * Catégorie personnalisée n'existe dans aucune table tant que `Enregistrer
 * la séance` n'a pas réussi.
 */
export type SessionDraftCategoryDraft = {
  readonly id: string;
  readonly name: string;
};

export type SessionDraft = {
  /**
   * T01-S10 : identifiant de la Séance persistée en cours de MODIFICATION,
   * ou `null` pour une CRÉATION. Champ optionnel de transition (Q1-A,
   * livraison séquencée) : les constructeurs du Domaine (`createEmptyDraft`,
   * `toSessionDraft`) le renseignent toujours ; un consommateur externe
   * lit `draft.sourceSessionId ?? null`.
   */
  readonly sourceSessionId?: string | null;
  readonly name: string;
  readonly color: SessionColor;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  /**
   * T01-S10 (D-058) : répétition du Tour, entier `1..99`. Champ optionnel
   * de transition — `createEmptyDraft` le fixe à `DEFAULT_TOUR_REPEAT_COUNT`
   * ; un consommateur lit `draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT`.
   */
  readonly tourRepeatCount?: number;
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
   * Catégories personnalisées créées dans ce même parcours (T01-S09) —
   * existent indépendamment de leur sélection courante (voir
   * `SessionDraftCategoryDraft`). Ensemble, pas une séquence à préserver :
   * l'ordre d'AFFICHAGE dans l'écran `Catégories de la séance` suit toujours
   * le référentiel (prédéfinies par `displayOrder`, puis personnalisées par
   * `createdAt`, D-107), jamais l'ordre de création local.
   */
  readonly categoryDrafts: readonly SessionDraftCategoryDraft[];
  /**
   * Identifiants des Catégories actuellement sélectionnées pour cette
   * Séance (T01-S09, D-106) — zéro, un ou plusieurs. Chaque identifiant
   * référence soit une Catégorie déjà persistée (prédéfinie ou d'une Séance
   * antérieure), soit une entrée de `categoryDrafts` (par son `id` local).
   * Désélectionner une Catégorie personnalisée retire uniquement son `id`
   * d'ici — elle reste dans `categoryDrafts`, donc toujours visible comme
   * tag non sélectionné (correction du BLOCKING_POINT 5551813745).
   */
  readonly selectedCategoryIds: readonly string[];
};

/** Brouillon de Séance vide, initialisé avec les valeurs canoniques par défaut (aucune Activité, aucune Catégorie créée ou sélectionnée). */
export function createEmptyDraft(): SessionDraft {
  return {
    sourceSessionId: null,
    name: "",
    color: DEFAULT_SESSION_COLOR,
    initialCountdownSeconds: DEFAULT_INITIAL_COUNTDOWN_SECONDS,
    finalPhaseSeconds: DEFAULT_FINAL_PHASE_SECONDS,
    tourRepeatCount: DEFAULT_TOUR_REPEAT_COUNT,
    exercises: [],
    categoryDrafts: [],
    selectedCategoryIds: [],
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
    type: DEFAULT_ACTIVITY_TYPE,
    structuralPosition: DEFAULT_STRUCTURAL_POSITION,
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
  const structuralActivities: readonly Activity[] = [
    ...(session.cycle.beforeTour ?? []),
    ...session.cycle.tour.exercises,
    ...(session.cycle.afterTour ?? []),
  ];

  return {
    sourceSessionId: session.id,
    name: session.name,
    color: session.color,
    initialCountdownSeconds: session.initialCountdownSeconds,
    finalPhaseSeconds: session.finalPhaseSeconds,
    tourRepeatCount: session.cycle.tour.repeatCount,
    exercises: structuralActivities.map((activity) => activityToDraftExercise(activity)),
    // Toutes les Catégories déjà associées à une Séance persistée sont, par
    // construction, déjà persistées elles-mêmes : aucune n'est un brouillon
    // local (`categoryDrafts` reste vide), toutes sont sélectionnées.
    categoryDrafts: [],
    selectedCategoryIds: session.categories.map((category) => category.id),
  };
}

/**
 * Projette une `Activity` persistée vers un `SessionDraftExercise` (T01-S10).
 * Une Récupération (`type === "RECOVERY"`) conserve son type et sa position
 * mais reprend les valeurs par défaut d'Exercice pour `executionMode`/
 * `seriesCount` (ignorées à la conversion `toUpdateSessionInput`, qui relit
 * `type`). L'ordre d'affichage suit `structuralActivities` (avant, dans,
 * après le Tour) — jamais `position` seul, qui n'est unique que par zone.
 */
function activityToDraftExercise(activity: Activity): SessionDraftExercise {
  return {
    id: activity.id,
    type: activity.type,
    structuralPosition: activity.structuralPosition,
    name: activity.name,
    executionMode: activity.executionMode ?? DEFAULT_EXECUTION_MODE,
    durationSeconds: activity.durationSeconds,
    repetitionCount: activity.repetitionCount,
    seriesCount: activity.seriesCount ?? DEFAULT_SERIES_COUNT,
    pauseSeconds: activity.pauseSeconds,
    instruction: activity.instruction,
    bodyZoneIds: activity.bodyZoneIds,
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
    a.type === b.type &&
    a.structuralPosition === b.structuralPosition &&
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
 * Compare deux ensembles de Catégories personnalisées créées dans le
 * brouillon — ordre indifférent (`SessionDraft.categoryDrafts` est un
 * ensemble, pas une séquence, voir sa documentation), contenu déterminant.
 */
function categoryDraftsEqual(
  a: readonly SessionDraftCategoryDraft[],
  b: readonly SessionDraftCategoryDraft[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((draft) => b.some((other) => other.id === draft.id && other.name === draft.name));
}

/** Compare deux ensembles d'identifiants de Catégories sélectionnées — ordre indifférent, contenu déterminant. */
function selectedCategoryIdsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

/**
 * Compare les champs fonctionnels d'un brouillon à ceux d'un brouillon vide
 * (`createEmptyDraft()`) — utilisé par la garde de sortie de Composition
 * (T01-S07) pour décider si une navigation sortante doit être bloquée.
 * Fonction pure, aucune dépendance React/navigation.
 */
export function isSessionDraftDirty(draft: SessionDraft): boolean {
  return !sessionDraftsEqual(draft, createEmptyDraft());
}

/**
 * Compare champ à champ deux brouillons sur leurs propriétés FONCTIONNELLES
 * (nom, couleur, phases, répétition du Tour, Activités dans l'ordre,
 * Catégories créées et sélectionnées) — `sourceSessionId` est un champ
 * d'IDENTITÉ, jamais comparé. T01-S10 : la garde de sortie en MODIFICATION
 * compare le brouillon courant à son état RÉHYDRATÉ (CE-T01-S10-06 — le
 * dialogue d'abandon n'apparaît que si quelque chose a réellement changé) ;
 * en CRÉATION, `isSessionDraftDirty` compare au brouillon vide. Fonction
 * pure, aucune dépendance React/navigation.
 */
export function sessionDraftsEqual(a: SessionDraft, b: SessionDraft): boolean {
  return (
    a.name === b.name &&
    a.color === b.color &&
    a.initialCountdownSeconds === b.initialCountdownSeconds &&
    a.finalPhaseSeconds === b.finalPhaseSeconds &&
    (a.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT) ===
      (b.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT) &&
    exercisesEqual(a.exercises, b.exercises) &&
    categoryDraftsEqual(a.categoryDrafts, b.categoryDrafts) &&
    selectedCategoryIdsEqual(a.selectedCategoryIds, b.selectedCategoryIds)
  );
}

/** Résout les Catégories sélectionnées d'un brouillon vers des `CreateSessionCategoryInput` (partagé par `toCreateSessionInput` et `toUpdateSessionInput`). */
function resolveDraftCategories(draft: SessionDraft): CreateSessionCategoryInput[] {
  return draft.selectedCategoryIds.map((id) => {
    const localDraft = draft.categoryDrafts.find((entry) => entry.id === id);
    return localDraft
      ? { kind: "NEW" as const, name: localDraft.name }
      : { kind: "EXISTING" as const, categoryId: id };
  });
}

/**
 * Paramètres persistables d'un brouillon d'Activité, normalisés selon son
 * type (T02-S01) — partagés par `toCreateSessionInput` et
 * `toUpdateSessionInput`, qui appliquaient jusqu'ici cette normalisation
 * séparément (et, pour la création, pas du tout : elle émettait toujours un
 * Exercice, perdant toute Récupération du brouillon).
 *
 * Une Récupération (`type === "RECOVERY"`, D-041) est toujours chronométrée :
 * elle est émise sans mode d'Exercice, sans Séries, sans pause et sans Zones
 * corporelles — les valeurs par défaut d'Exercice que son brouillon conserve
 * (`executionMode`/`seriesCount`, voir `SessionDraftExercise`) sont ignorées.
 */
function toDraftActivityParameters(exercise: SessionDraftExercise) {
  if (exercise.type === "RECOVERY") {
    return {
      type: "RECOVERY" as const,
      executionMode: null,
      durationSeconds: exercise.durationSeconds,
      repetitionCount: null,
      seriesCount: null,
      pauseSeconds: 0,
      instruction: exercise.instruction,
      bodyZoneIds: [] as readonly string[],
    };
  }
  return {
    type: "EXERCISE" as const,
    executionMode: exercise.executionMode,
    durationSeconds: exercise.durationSeconds,
    repetitionCount: exercise.repetitionCount,
    seriesCount: exercise.seriesCount,
    pauseSeconds: exercise.pauseSeconds,
    instruction: exercise.instruction,
    bodyZoneIds: exercise.bodyZoneIds,
  };
}

/**
 * Valide et convertit un brouillon vers un `CreateSessionInput` persistable
 * (T01-S09 : TOUTES les Activités de `draft.exercises`, dans l'ordre, et
 * toutes les Catégories actuellement SÉLECTIONNÉES — `draft.selectedCategoryIds`
 * — jamais une Catégorie personnalisée simplement créée puis désélectionnée).
 *
 * **T02-S01** : transporte désormais aussi l'identifiant de brouillon de
 * chaque Activité, son type, sa position structurelle et la répétition réelle
 * du Tour — une création comportant une Récupération, une Activité hors Tour
 * ou un Tour ≠ `1` était jusqu'ici persistée comme un Exercice `IN_TOUR` d'un
 * Tour figé à `1` (plan §5.1).
 *
 * Chaque identifiant sélectionné est résolu : s'il correspond à l'`id` d'une
 * entrée de `draft.categoryDrafts`, la Catégorie est une Catégorie
 * personnalisée à créer (`kind: "NEW"`) ; sinon, il référence une Catégorie
 * déjà persistée (`kind: "EXISTING"`).
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
  return validateCreateSessionInput({
    name: draft.name,
    color: draft.color,
    initialCountdownSeconds: draft.initialCountdownSeconds,
    finalPhaseSeconds: draft.finalPhaseSeconds,
    tourRepeatCount: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    exercises: draft.exercises.map((exercise) => ({
      id: exercise.id,
      structuralPosition: exercise.structuralPosition,
      name: exercise.name,
      ...toDraftActivityParameters(exercise),
    })),
    categories: resolveDraftCategories(draft),
  });
}

/**
 * Valide et convertit un brouillon de MODIFICATION vers un `UpdateSessionInput`
 * persistable (T01-S10, plan §6.2 ; Q3-A — jamais `toCreateSessionInput`).
 *
 * Exige `draft.sourceSessionId` (échec `REQUIRED` sur `session.sourceSessionId`
 * sinon — un brouillon de création n'est jamais enregistré par cette voie).
 * Chaque `SessionDraftExercise` devient une `UpdateSessionActivityInput` en
 * conservant son `id` (identifiant persistant d'une Activité existante, ou
 * identifiant frais d'une nouvelle Activité — le Repository fusionne par
 * identifiant, plan §6.4). `position` est réattribué par zone structurelle
 * dans l'ordre du brouillon. Une Récupération (`type === "RECOVERY"`) est
 * émise sans mode d'Exercice, sans Séries, sans pause, sans Zones (D-041).
 *
 * Délègue l'intégralité de la validation à `validateUpdateSessionInput`.
 * Ne lève jamais d'exception.
 */
export function toUpdateSessionInput(
  draft: SessionDraft,
): ValidationResult<UpdateSessionInput> {
  const sourceSessionId = draft.sourceSessionId ?? null;
  if (sourceSessionId === null || sourceSessionId.trim().length === 0) {
    return fail([{ code: "REQUIRED", field: "session.sourceSessionId" }]);
  }

  const positionByZone = new Map<StructuralPosition, number>();
  const activities: UpdateSessionActivityInput[] = draft.exercises.map((exercise) => {
    const zone = exercise.structuralPosition;
    const position = positionByZone.get(zone) ?? 0;
    positionByZone.set(zone, position + 1);

    return {
      id: exercise.id,
      structuralPosition: zone,
      position,
      name: exercise.name,
      ...toDraftActivityParameters(exercise),
    };
  });

  return validateUpdateSessionInput({
    sourceSessionId,
    name: draft.name,
    color: draft.color,
    initialCountdownSeconds: draft.initialCountdownSeconds,
    finalPhaseSeconds: draft.finalPhaseSeconds,
    tourRepeatCount: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    activities,
    categories: resolveDraftCategories(draft),
  });
}
