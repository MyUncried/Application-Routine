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
 * `@/domain/sessions`). Réutilise les validateurs de nom et de description
 * de `@/domain/sessions/validation` plutôt que de les dupliquer.
 *
 * **PRE-4 (story 1.1, AD-3, AD-13)** : une définition ne porte plus aucun
 * Mode, Cible, N ni Pause scalaire ; ses paramètres d'exécution typés sont
 * obligatoires et contrôlés par la seule validation `validateForSave`.
 */

import { validateCategoryColor, type CreateCategoryInput } from "@/domain/categories/Category";
import type { ActivityMediaWithAsset, DraftMediaItem } from "@/domain/media/ActivityMedia";
import { isValidNewMediaAsset, type MediaAsset } from "@/domain/media/MediaAsset";
import { validateCategoryName } from "@/domain/categories/validation";
import { defaultExerciseExecutionParameters, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { DEFAULT_ACTIVITY_TYPE, DEFAULT_STRUCTURAL_POSITION } from "@/domain/sessions/defaults";
import type { SideMode } from "@/domain/sessions/sideMode";
import { validateExerciseName, validateInstruction } from "@/domain/sessions/validation";

import {
  cloneExecutionParameters,
  validateForSave,
  type ExecutionMode,
  type ExecutionParameters,
  type ExecutionParametersViolation,
} from "./ExecutionParameters";

/** Mode d'une définition : celui du domaine des paramètres (AD-1), deux valeurs. */
export type ActivityDefinitionExecutionMode = ExecutionMode;

/** Une `ActivityDefinition` persistée (Catalogue des exercices). */
export type ActivityDefinition = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  /**
   * PRE-4 (story 1.1, AD-3) : paramètres d'exécution TYPÉS, OBLIGATOIRES,
   * relus par `readV2` — seule source du Mode, des Cibles, de N et des
   * Pauses. Aucun champ scalaire n'est exposé (inventaire des lecteurs de
   * scalaires de la spine).
   */
  readonly executionParameters: ExecutionParameters;
  /**
   * V2-PRE-1 (D-211) : Catégorie exactement une, TOUJOURS obligatoire à
   * l'écriture (`CreateActivityDefinitionInput.category`, validé, jamais
   * optionnel). Champ OPTIONNEL uniquement sur ce type LU, pour la
   * compatibilité structurelle de fixtures qui construisent encore ce type
   * sans Catégorie — toujours défini en pratique par le Repository.
   */
  readonly categoryId?: string;
  /** Zones corporelles — collection non vide, distincte (plan §4). */
  readonly bodyZoneIds: readonly string[];
  /** Direction de l'Exercice, égale à `executionParameters.sideMode` (relue des paramètres). */
  readonly sideMode: SideMode;
  /** Pause entre les côtés, égale à `executionParameters.sideRecoverySeconds` (relue des paramètres). Optionnelle sur ce type LU (fixtures). */
  readonly sideRecoverySeconds?: number;
  /** @deprecated V2-PRE-1 : la récupération post-exercice n'appartient plus jamais à la définition (plan §3.1) — conservé uniquement pour la compatibilité structurelle de fixtures ; jamais lu par le Domaine, les mappings ou la persistance. */
  readonly recoverySeconds?: number;
  /** PRE-3 : médias ordonnés hydratés par le Repository (convention optionnelle sur ce type LU). */
  readonly media?: readonly ActivityMediaWithAsset[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * Référence d'un `MediaAsset` à associer à l'Exercice (V2-PRE-1, plan
 * §3.3/§13). L'ORDRE du tableau est la position stable persistée
 * (0-indexée) : jamais un champ `position` séparé que l'appelant pourrait
 * faire diverger de l'ordre réel du tableau.
 */
export type CreateActivityMediaInput = {
  readonly assetId: string;
  /**
   * PRE-3 (D-333) : asset complet. Présent pour un média fraîchement importé
   * — créé dans la MÊME transaction que l'Exercice et ses liens, jamais
   * avant — ou pour un asset déjà persisté (réouverture), auquel cas il
   * n'est jamais réécrit.
   */
  readonly asset?: MediaAsset;
};

export type CreateActivityDefinitionInput = {
  readonly name: string;
  readonly description: string | null;
  /** Référence de Catégorie à résoudre (existante ou nouvelle) — voir `@/domain/categories/Category`. */
  readonly category: CreateCategoryInput;
  readonly bodyZoneIds: readonly string[];
  /** Médias ORDONNÉS de l'Exercice — optionnel ; `undefined` à la modification conserve les liens persistés. */
  readonly media?: readonly CreateActivityMediaInput[];
  /**
   * PRE-4 (story 1.1, AD-3, AD-13) : paramètres typés OBLIGATOIRES, validés
   * au niveau structurel (`validateForSave(…, "STORAGE")`). Le repository en
   * projette les colonnes scalaires (Mode, Cible, N, Pause, côté, Pause entre
   * les côtés) : aucun scalaire n'est transporté par l'entrée.
   */
  readonly executionParameters: ExecutionParameters;
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
  | "activityDefinition.category"
  | "activityDefinition.bodyZoneIds"
  /** Paramètres d'exécution invalides (détail dans `executionViolations`). */
  | "activityDefinition.executionParameters"
  /** PRE-3 : asset de média importé invalide. */
  | "activityDefinition.media";

export type ActivityDefinitionValidationViolation = {
  readonly code: ActivityDefinitionValidationCode;
  readonly field: ActivityDefinitionValidationField;
  readonly details?: { readonly min?: number; readonly max?: number };
  /** Violations détaillées des paramètres d'exécution (champ, niveau et Série). */
  readonly executionViolations?: readonly ExecutionParametersViolation[];
};

export type ActivityDefinitionValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly violations: readonly ActivityDefinitionValidationViolation[] };

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
 * seulement la première) et ne lève jamais d'exception.
 *
 * PRE-4 (story 1.1, AD-13) : les paramètres d'exécution sont contrôlés par la
 * seule validation `validateForSave(…, "STORAGE")` (niveau structurel ; les
 * bornes de saisie sont appliquées par le ✓ de la Feuille et `Terminer`, avec
 * la ligne de base). L'ancien chemin de validation scalaire est supprimé.
 */
export function validateActivityDefinitionInput(
  input: CreateActivityDefinitionInput,
): ActivityDefinitionValidationResult<CreateActivityDefinitionInput> {
  const violations: ActivityDefinitionValidationViolation[] = [];

  const parameters = validateForSave(input.executionParameters, "STORAGE");
  if (!parameters.ok) {
    violations.push({
      code: "OUT_OF_RANGE",
      field: "activityDefinition.executionParameters",
      executionViolations: parameters.violations,
    });
  }

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

  for (const item of input.media ?? []) {
    const invalidAsset = item.asset !== undefined && (item.asset.id !== item.assetId || !isValidNewMediaAsset(item.asset));
    if (item.assetId.trim().length === 0 || invalidAsset) {
      violations.push({ code: "REQUIRED", field: "activityDefinition.media" });
      break;
    }
  }

  const bodyZonesResult = validateBodyZoneIds(input.bodyZoneIds);
  if (!bodyZonesResult.ok) {
    violations.push({
      code: bodyZonesResult.code === "DUPLICATE" ? "DUPLICATE" : "REQUIRED",
      field: "activityDefinition.bodyZoneIds",
    });
  }

  const category = validateCategoryInput(input.category, violations);

  if (violations.length > 0 || !parameters.ok) {
    return { ok: false, violations };
  }

  return {
    ok: true,
    value: {
      name: name as string,
      description,
      category: category as CreateCategoryInput,
      bodyZoneIds: input.bodyZoneIds,
      // V2-PRE-1 (plan §3.3/§13) : transmis tel quel, position stable =
      // ordre du tableau — l'intégrité référentielle de `assetId` reste à la
      // charge du Repository (`ActivityDefinitionService` conserve les liens
      // persistés quand une modification n'envoie aucun média).
      media: input.media ?? [],
      executionParameters: parameters.value,
    },
  };
}

/**
 * Brouillon d'`ActivityDefinition` vide — mêmes paramètres par défaut que
 * `createExerciseDraft` (Composition). Aucune Catégorie n'est présélectionnée
 * (plan §12 : « sans affectation automatique »).
 */
export function createEmptyActivityDefinitionDraft(): Omit<CreateActivityDefinitionInput, "category"> {
  return {
    name: "",
    description: null,
    bodyZoneIds: [],
    executionParameters: defaultExerciseExecutionParameters(),
  };
}

/** Projette une `ActivityDefinition` persistée vers l'entrée éditable de l'éditeur (préremplissage exact, modification). */
export function activityDefinitionToInput(definition: ActivityDefinition): CreateActivityDefinitionInput {
  return {
    name: definition.name,
    description: definition.description,
    category: { kind: "EXISTING", categoryId: definition.categoryId ?? "" },
    bodyZoneIds: definition.bodyZoneIds,
    // La réouverture conserve TOUS les paramètres (Cibles typées comprises)
    // et les liens ordonnés — la modification d'un seul champ ne les perd jamais.
    executionParameters: cloneExecutionParameters(definition.executionParameters),
    ...(definition.media
      ? { media: definition.media.map((item) => ({ assetId: item.assetId, asset: { ...item.asset } })) }
      : {}),
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
  // PRE-3 (P3-18) / PRE-4 (AD-9) : copie COMPLÈTE et indépendante — paramètres
  // typés clonés en profondeur (Cibles `FAILURE` et `UNSET` comprises),
  // Catégorie, médias ordonnés (mêmes fichiers physiques, nouveaux liens
  // créés à l'enregistrement de la Séance). Aucune référence partagée.
  const media: readonly DraftMediaItem[] = (definition.media ?? []).map((item) => ({
    assetId: item.assetId,
    asset: { ...item.asset },
  }));
  return {
    executionParameters: cloneExecutionParameters(definition.executionParameters),
    categoryId: definition.categoryId ?? null,
    media,
    id: newId,
    type: DEFAULT_ACTIVITY_TYPE,
    structuralPosition: DEFAULT_STRUCTURAL_POSITION,
    name: definition.name,
    postActivityRecoverySeconds,
    instruction: definition.description,
    bodyZoneIds: [...definition.bodyZoneIds],
    sideMode: definition.executionParameters.sideMode,
  };
}
