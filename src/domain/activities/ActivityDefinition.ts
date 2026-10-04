/**
 * Domaine `ActivityDefinition` (V2-CAT-01, complété V2-PRE-1) : racine
 * persistante autonome d'un Exercice du Catalogue — distincte d'une
 * `SessionActivity` (celle-ci reste rattachée à une Séance et porte sa
 * position structurelle, `SessionDraft.ts`). Une `ActivityDefinition` ne
 * porte aucune position de Composition ; sa copie vers un brouillon de
 * Séance (`toDraftExercise`) est ponctuelle et indépendante — les
 * modifications ultérieures de l'une n'affectent jamais l'autre.
 *
 * **V2-PRE-1 (plan §3.1)** : `recoverySeconds` est supprimé du contrat cible
 * — la récupération post-exercice n'appartient jamais à la définition, elle
 * est une propriété exclusive de l'occurrence (`Activity.postActivityRecoverySeconds`,
 * copiée depuis le Profil à l'insertion, `SessionService`). `categoryId`
 * (Catégorie exactement une, obligatoire, D-211) et `sideRecoverySeconds`
 * (pause de changement de côté propre à l'Exercice bilatéral) sont ajoutés ;
 * `bodyZoneIds` doit être non vide et sans doublon.
 *
 * Fonctions pures, indépendantes de React et SQLite (même politique que
 * `@/domain/sessions`). Réutilise les validateurs déjà exportés par
 * `@/domain/sessions/validation` (mêmes bornes que l'Activité de Séance :
 * nom `1..80`, description `..1000`, durée/pause `..5999`, répétitions/
 * séries `1..99`) plutôt que de les dupliquer.
 */

import { validateCategoryColor, type CreateCategoryInput } from "@/domain/categories/Category";
import { validateCategoryName } from "@/domain/categories/validation";
import {
  createExerciseDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import type { ExerciseExecutionMode } from "@/domain/sessions/Session";
import {
  DEFAULT_ACTIVITY_TYPE,
  DEFAULT_SIDE_MODE,
  DEFAULT_STRUCTURAL_POSITION,
} from "@/domain/sessions/defaults";
import { isSideMode, type SideMode } from "@/domain/sessions/sideMode";
import {
  validateExerciseDurationSeconds,
  validateExerciseName,
  validateInstruction,
  validatePauseSeconds,
  validateRepetitionCount,
  validateSeriesCount,
} from "@/domain/sessions/validation";

export type ActivityDefinitionExecutionMode = ExerciseExecutionMode;

/** Une `ActivityDefinition` persistée (Catalogue des exercices). */
export type ActivityDefinition = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly executionMode: ActivityDefinitionExecutionMode;
  /** Non nul uniquement en mode `DURATION`. */
  readonly durationSeconds: number | null;
  /** Non nul uniquement en mode `REPETITIONS`. */
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  /**
   * V2-PRE-1 (D-211) : Catégorie exactement une, TOUJOURS obligatoire à
   * l'écriture (`CreateActivityDefinitionInput.category`, validé,
   * jamais optionnel). Champ OPTIONNEL uniquement sur ce type LU, pour la
   * compatibilité structurelle de fixtures hors périmètre d'écriture
   * (`ActivityCatalogueList.test.tsx`, `useActivityCatalogue.test.ts`,
   * `CatalogueScreen.test.tsx`, `scope_allow`) qui construisent encore ce
   * type sans Catégorie — toujours défini en pratique par le Repository.
   */
  readonly categoryId?: string;
  /** Zones corporelles — collection non vide, distincte (plan §4). */
  readonly bodyZoneIds: readonly string[];
  readonly sideMode: SideMode;
  /** V2-PRE-1 (plan §3.1) : pause de changement de côté propre à l'Exercice — utilisée uniquement lorsque `sideMode` est bilatéral. Optionnelle sur ce type LU pour la même raison de compatibilité que `categoryId` ci-dessus. */
  readonly sideRecoverySeconds?: number;
  /** @deprecated V2-PRE-1 : la récupération post-exercice n'appartient plus jamais à la définition (plan §3.1) — conservé uniquement pour la compatibilité structurelle de fixtures hors périmètre d'écriture (`ActivityCatalogueList.test.tsx`, `useActivityCatalogue.test.ts`, `CatalogueScreen.test.tsx`) qui l'utilisent encore ; jamais lu par le Domaine, les mappings ou la persistance. */
  readonly recoverySeconds?: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * Référence d'un `MediaAsset` déjà persisté à associer à l'Exercice
 * (V2-PRE-1, plan §3.3/§13, REQ-001108DC7F67664C) — jamais la création de
 * l'asset lui-même (hors périmètre de cette tranche, aucun écran ne la
 * déclenche). L'ORDRE du tableau est la position stable persistée
 * (0-indexée) : jamais un champ `position` séparé que l'appelant pourrait
 * faire diverger de l'ordre réel du tableau.
 */
export type CreateActivityMediaInput = {
  readonly assetId: string;
};

export type CreateActivityDefinitionInput = {
  readonly name: string;
  readonly description: string | null;
  readonly executionMode: ActivityDefinitionExecutionMode;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number;
  readonly pauseSeconds: number;
  /** Référence de Catégorie à résoudre (existante ou nouvelle) — voir `@/domain/categories/Category`. */
  readonly category: CreateCategoryInput;
  readonly bodyZoneIds: readonly string[];
  readonly sideMode?: SideMode;
  readonly sideRecoverySeconds: number;
  /**
   * Médias ORDONNÉS de l'Exercice (V2-PRE-1, plan §3.3/§13,
   * REQ-001108DC7F67664C) — optionnel, `[]` par défaut : aucun écran
   * n'alimente encore ce champ (`+ Ajouter un média` reste désactivé, plan
   * §4.1), mais le contrat de persistance doit déjà transporter une
   * collection ordonnée sans perdre sa position lorsqu'un appelant futur la
   * fournira.
   */
  readonly media?: readonly CreateActivityMediaInput[];
};

export type UpdateActivityDefinitionInput = CreateActivityDefinitionInput;

export type ActivityDefinitionValidationCode =
  | "REQUIRED"
  | "TOO_LONG"
  | "OUT_OF_RANGE"
  | "NOT_INTEGER"
  | "UNRECOGNIZED"
  | "MUST_BE_ABSENT"
  | "INVALID_COLOR"
  /** V2-PRE-1 : Zones corporelles vides ou portant un doublon. */
  | "DUPLICATE";

export type ActivityDefinitionValidationField =
  | "activityDefinition.name"
  | "activityDefinition.description"
  | "activityDefinition.executionMode"
  | "activityDefinition.durationSeconds"
  | "activityDefinition.repetitionCount"
  | "activityDefinition.seriesCount"
  | "activityDefinition.pauseSeconds"
  | "activityDefinition.category"
  | "activityDefinition.bodyZoneIds"
  | "activityDefinition.sideRecoverySeconds";

export type ActivityDefinitionValidationViolation = {
  readonly code: ActivityDefinitionValidationCode;
  readonly field: ActivityDefinitionValidationField;
  readonly details?: { readonly min?: number; readonly max?: number };
};

export type ActivityDefinitionValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly violations: readonly ActivityDefinitionValidationViolation[] };

const EXECUTION_MODES: readonly ActivityDefinitionExecutionMode[] = [
  "DURATION",
  "REPETITIONS",
  "TO_FAILURE",
];

/** Zones corporelles non vides et distinctes (plan §4 : « Catégorie exactement unique et Zones non vides, distinctes et valides »). */
function validateBodyZoneIds(bodyZoneIds: readonly string[]): {
  readonly ok: boolean;
  readonly code?: "REQUIRED" | "DUPLICATE";
} {
  if (bodyZoneIds.length === 0) {
    return { ok: false, code: "REQUIRED" };
  }
  const unique = new Set(bodyZoneIds);
  if (unique.size !== bodyZoneIds.length) {
    return { ok: false, code: "DUPLICATE" };
  }
  return { ok: true };
}

/** Résout une référence de Catégorie sans jamais affecter automatiquement une valeur (plan §12 : « sans affectation automatique »). */
function validateCategoryInput(
  category: CreateCategoryInput,
  violations: ActivityDefinitionValidationViolation[],
): CreateCategoryInput | undefined {
  if (category.kind === "EXISTING") {
    if (category.categoryId.trim().length === 0) {
      violations.push({ code: "REQUIRED", field: "activityDefinition.category" });
      return undefined;
    }
    return category;
  }
  const nameResult = validateCategoryName(category.name);
  const colorResult = validateCategoryColor(category.color);
  if (!nameResult.ok || !colorResult.ok) {
    violations.push({ code: "REQUIRED", field: "activityDefinition.category" });
    return undefined;
  }
  return { kind: "NEW", name: nameResult.value, color: colorResult.value };
}

/**
 * Valide et normalise une entrée de création/modification d'une
 * `ActivityDefinition`. Agrège toutes les violations déterminables (jamais
 * seulement la première) et ne lève jamais d'exception — même contrat que
 * `validateCreateSessionInput` (`@/domain/sessions/SessionDraft`).
 */
export function validateActivityDefinitionInput(
  input: CreateActivityDefinitionInput,
): ActivityDefinitionValidationResult<CreateActivityDefinitionInput> {
  const violations: ActivityDefinitionValidationViolation[] = [];

  const nameResult = validateExerciseName(input.name);
  const name = nameResult.ok ? nameResult.value : undefined;
  if (!nameResult.ok) {
    violations.push({ code: "REQUIRED", field: "activityDefinition.name" });
  }

  const descriptionResult = validateInstruction(input.description);
  const description = descriptionResult.ok ? descriptionResult.value : null;
  if (!descriptionResult.ok) {
    violations.push({ code: "TOO_LONG", field: "activityDefinition.description" });
  }

  if (!EXECUTION_MODES.includes(input.executionMode)) {
    violations.push({ code: "UNRECOGNIZED", field: "activityDefinition.executionMode" });
  }

  let durationSeconds: number | null = null;
  let repetitionCount: number | null = null;

  if (input.executionMode === "DURATION") {
    if (input.durationSeconds === null) {
      violations.push({ code: "REQUIRED", field: "activityDefinition.durationSeconds" });
    } else {
      const durationResult = validateExerciseDurationSeconds(input.durationSeconds);
      if (durationResult.ok) {
        durationSeconds = durationResult.value;
      } else {
        violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.durationSeconds" });
      }
    }
    if (input.repetitionCount !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.repetitionCount" });
    }
  } else if (input.executionMode === "REPETITIONS") {
    if (input.repetitionCount === null) {
      violations.push({ code: "REQUIRED", field: "activityDefinition.repetitionCount" });
    } else {
      const repetitionResult = validateRepetitionCount(input.repetitionCount);
      if (repetitionResult.ok) {
        repetitionCount = repetitionResult.value;
      } else {
        violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.repetitionCount" });
      }
    }
    if (input.durationSeconds !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.durationSeconds" });
    }
  } else if (input.executionMode === "TO_FAILURE") {
    if (input.durationSeconds !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.durationSeconds" });
    }
    if (input.repetitionCount !== null) {
      violations.push({ code: "MUST_BE_ABSENT", field: "activityDefinition.repetitionCount" });
    }
  }

  const seriesResult = validateSeriesCount(input.seriesCount);
  if (!seriesResult.ok) {
    violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.seriesCount" });
  }

  const pauseResult = validatePauseSeconds(input.pauseSeconds);
  if (!pauseResult.ok) {
    violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.pauseSeconds" });
  }

  const sideRecoveryResult = validatePauseSeconds(input.sideRecoverySeconds);
  if (!sideRecoveryResult.ok) {
    violations.push({ code: "OUT_OF_RANGE", field: "activityDefinition.sideRecoverySeconds" });
  }

  const bodyZonesResult = validateBodyZoneIds(input.bodyZoneIds);
  if (!bodyZonesResult.ok) {
    violations.push({
      code: bodyZonesResult.code === "DUPLICATE" ? "DUPLICATE" : "REQUIRED",
      field: "activityDefinition.bodyZoneIds",
    });
  }

  const category = validateCategoryInput(input.category, violations);

  if (violations.length > 0) {
    return { ok: false, violations };
  }

  return {
    ok: true,
    value: {
      name: name as string,
      description,
      executionMode: input.executionMode,
      durationSeconds,
      repetitionCount,
      seriesCount: seriesResult.ok ? seriesResult.value : input.seriesCount,
      pauseSeconds: pauseResult.ok ? pauseResult.value : input.pauseSeconds,
      category: category as CreateCategoryInput,
      bodyZoneIds: input.bodyZoneIds,
      sideMode: isSideMode(input.sideMode) ? input.sideMode : DEFAULT_SIDE_MODE,
      sideRecoverySeconds: sideRecoveryResult.ok
        ? sideRecoveryResult.value
        : input.sideRecoverySeconds,
      // V2-PRE-1 (plan §3.3/§13) : transmis tel quel, position stable =
      // ordre du tableau — jamais retrié, jamais une validation dupliquée
      // (l'intégrité référentielle de `assetId` reste à la charge du
      // Repository, même patron que `category`/`bodyZoneIds`).
      media: input.media ?? [],
    },
  };
}

/**
 * Brouillon d'`ActivityDefinition` vide, destiné à l'écran de création du
 * Catalogue — mêmes valeurs par défaut que `createExerciseDraft` (Composition),
 * sans `id`/`type`/`structuralPosition` (non applicables à une définition).
 * Aucune Catégorie n'est présélectionnée (plan §12 : « sans affectation
 * automatique ») — l'appelant doit fournir une sélection explicite avant
 * `Terminer` (contrat UX `08` l.978 / `13` §4.10).
 */
export function createEmptyActivityDefinitionDraft(): Omit<CreateActivityDefinitionInput, "category"> {
  const exerciseDraft = createExerciseDraft("draft");
  return {
    name: exerciseDraft.name,
    description: exerciseDraft.instruction,
    executionMode: exerciseDraft.executionMode,
    durationSeconds: exerciseDraft.durationSeconds,
    repetitionCount: exerciseDraft.repetitionCount,
    seriesCount: exerciseDraft.seriesCount,
    pauseSeconds: exerciseDraft.pauseSeconds,
    bodyZoneIds: exerciseDraft.bodyZoneIds,
    sideMode: exerciseDraft.sideMode,
    sideRecoverySeconds: 0,
  };
}

/** Projette une `ActivityDefinition` persistée vers l'entrée éditable de l'éditeur (préremplissage exact, modification). */
export function activityDefinitionToInput(
  definition: ActivityDefinition,
): CreateActivityDefinitionInput {
  return {
    name: definition.name,
    description: definition.description,
    executionMode: definition.executionMode,
    durationSeconds: definition.durationSeconds,
    repetitionCount: definition.repetitionCount,
    seriesCount: definition.seriesCount,
    pauseSeconds: definition.pauseSeconds,
    category: { kind: "EXISTING", categoryId: definition.categoryId ?? "" },
    bodyZoneIds: definition.bodyZoneIds,
    sideMode: definition.sideMode,
    sideRecoverySeconds: definition.sideRecoverySeconds ?? 0,
  };
}

/**
 * Copie INDÉPENDANTE d'une `ActivityDefinition` vers une `SessionActivity`
 * locale (`SessionDraftExercise`) — « Une activité existante » depuis la
 * Composition (plan §4.4/§6.1). La copie porte un NOUVEL identifiant
 * (`newId`, fourni par l'appelant — ce module reste pur, sans
 * `expo-crypto`), reprend toutes les propriétés métier applicables et une
 * position structurelle par défaut (`DEFAULT_STRUCTURAL_POSITION`) — la zone
 * réelle d'insertion est décidée au moment de l'ajout par
 * `appendActivityAfterLastDisplayed` (`composition.ts`), jamais ici. Les
 * modifications ultérieures de la définition et de la copie restent
 * indépendantes : aucune référence n'est conservée vers `definition.id`.
 *
 * **V2-PRE-1 (plan §3.1/§3.2)** : `ActivityDefinition` ne porte plus aucune
 * récupération post-exercice — `postActivityRecoverySeconds` de l'occurrence
 * est donc un paramètre EXPLICITE, jamais dérivé de la définition source. Le
 * seul point d'insertion réel d'une occurrence (`SessionService`, plan §3.2)
 * le lit depuis le Profil au moment de la création ; cette fonction reste
 * pure et ne lit jamais le Profil elle-même.
 */
/**
 * Règle pure de copie de la Pause entre les côtés du Profil, appliquée par
 * `ExerciseScreen` (adaptateur Catalogue) au changement de côté d'une
 * `ActivityDefinition` (V2-PRE-2, plan §6.1/§7, T21, D-213) :
 *
 * - `Sans changement` (`UNILATERAL`) → `D→G`/`G→D` : copie la valeur
 *   COURANTE du Profil (snapshot atomique à l'activation, jamais relue
 *   ensuite) ;
 * - toute autre transition (`D→G` ↔ `G→D`, ou un retour à `Sans
 *   changement`) : la valeur stockée est CONSERVÉE inchangée — jamais
 *   réinitialisée, jamais recopiée du Profil.
 *
 * Une création unilatérale (`createEmptyActivityDefinitionDraft`) n'appelle
 * jamais cette fonction : elle reste à `0` par construction.
 */
export function sideRecoveryOnSideModeChange(
  previousSideMode: SideMode,
  nextSideMode: SideMode,
  currentSideRecoverySeconds: number,
  profileSideChangeRecoverySecondsDefault: number,
): number {
  const wasUnilateral = previousSideMode === "UNILATERAL";
  const isNowBilateral = nextSideMode !== "UNILATERAL";
  if (wasUnilateral && isNowBilateral) {
    return profileSideChangeRecoverySecondsDefault;
  }
  return currentSideRecoverySeconds;
}

export function activityDefinitionToDraftExercise(
  definition: ActivityDefinition,
  newId: string,
  postActivityRecoverySeconds: number,
): SessionDraftExercise {
  return {
    id: newId,
    type: DEFAULT_ACTIVITY_TYPE,
    structuralPosition: DEFAULT_STRUCTURAL_POSITION,
    name: definition.name,
    executionMode: definition.executionMode,
    durationSeconds: definition.durationSeconds,
    repetitionCount: definition.repetitionCount,
    seriesCount: definition.seriesCount,
    pauseSeconds: definition.pauseSeconds,
    postActivityRecoverySeconds,
    instruction: definition.description,
    bodyZoneIds: [...definition.bodyZoneIds],
    sideMode: definition.sideMode,
  };
}
