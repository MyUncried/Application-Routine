/**
 * PRE-7 (A1.1, D-437 à D-439, MFN-01 à MFN-05, MFN-08) — domaine du Mouvement :
 * contenu PARTAGÉ d'un geste (ou de sa variante précise) entre les Exercices du
 * Catalogue qui le référencent (`ActivityDefinition.movementId`). « Mouvement »
 * est un terme interne au code ; l'interface dit exercice, geste ou niveau
 * (MFN/AC37).
 *
 * Répartition (ch10 MFN-01, tableau « Répartition des propriétés » ; ch09
 * « Modèle cible Mouvement et filiation ») :
 * - Mouvement : nom, description en étapes, médias ordonnés, Catégorie, Zones
 *   corporelles 1..n, structure ordonnée des phases `(id, label)`, compteur
 *   monotone de phase, état durable « déjà utilisé », groupe de niveaux ;
 * - Exercice du Catalogue : paramètres d'exécution propres, forme Catalogue v4
 *   (`CatalogExecutionParameters`, durées associées par `phaseId`, sans libellé).
 *
 * Ce module relie les deux formes : `splitResolvedParameters` scinde la
 * représentation RÉSOLUE (v3, avec libellés : Feuille, phrase, calculs, copies,
 * Instantané) en structure + valeurs ; `resolveCatalogParameters` la reconstitue
 * et dit si l'Exercice est exécutable ou incomplet (exercice frère après une
 * correction partagée, MFN-08). Les cas métier attendus sont des unions
 * discriminées ; une donnée corrompue (structure ≠ valeurs) lève
 * `ExecutionParametersDataError`. Aucune persistance ici (A1.2), aucun service
 * (A1.3), aucune réassociation des frères.
 *
 * Fonctions pures — sans React, SQLite, Expo, i18n ni horloge.
 */

import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import { codePointLength, validateExerciseName, validateInstruction } from "@/domain/sessions/validation";

import {
  CATALOG_EXECUTION_PARAMETERS_VERSION,
  EXECUTION_PARAMETERS_VERSION,
  ExecutionParametersDataError,
  normalizeEffective,
  phaseDurationsProblem,
  resolvedWorkPhasesProblem,
  unsetTarget,
  validateForSave,
  WORK_PHASE_LIMITS,
  type CatalogExecutionParameters,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type ExecutionParametersViolation,
  type PhaseDuration,
  type WorkPhase,
} from "./ExecutionParameters";

/**
 * Phase de la structure d'un Mouvement (MFN-02) : identité entière ≥ 1, unique
 * dans le Mouvement (clé complète : Mouvement + phase), conservée au déplacement
 * et au clonage ; libellé de 1 à 20 points de code, non blanc. Aucune durée :
 * les durées appartiennent aux paramètres de chaque Exercice.
 */
export type MovementPhase = {
  readonly id: number;
  readonly label: string;
};

/**
 * Appartenance à un groupe de niveaux (MFN-05, D-439) : identifiant de groupe et
 * clé de tri, toujours présents ensemble ; au plus un groupe par Mouvement. Aucun
 * objet Niveau ni rang persisté : rang et total sont dérivés de l'ordre des clés.
 * Un groupe réduit à un membre conserve son identifiant.
 */
export type MovementLevelGroup = {
  readonly groupId: string;
  readonly sortKey: number;
};

/** Mouvement (ch09 « Modèle cible Mouvement et filiation »). */
export type Movement = {
  /** Identifiant stable. */
  readonly id: string;
  readonly name: string;
  /** Description en étapes ordonnées, chaîne encodée par `instructionSteps.ts` (D-425) ; `null` si absente. */
  readonly description: string | null;
  /** Médias ordonnés : l'ordre du tableau est la position. */
  readonly media: readonly DraftMediaItem[];
  /** Catégorie obligatoire (D-211). */
  readonly categoryId: string;
  /** Zones corporelles : au moins une, sans doublon. */
  readonly bodyZoneIds: readonly string[];
  /** Structure ordonnée des phases ; `[]` = sans phases. */
  readonly phases: readonly MovementPhase[];
  /**
   * Compteur MONOTONE de phase (MFN-02, MFN/AC30) : prochaine identité à
   * attribuer, toujours > max(`id`) ; ne décroît jamais, une identité retirée
   * n'est jamais réallouée.
   */
  readonly nextPhaseId: number;
  /** État durable « déjà utilisé » (MFN-08) : faux au départ, irréversible. */
  readonly used: boolean;
  /** Groupe de niveaux, `null` pour un Mouvement neuf (MFN-05). */
  readonly levelGroup: MovementLevelGroup | null;
};

export type MovementValidationField =
  | "movement.id"
  | "movement.name"
  | "movement.description"
  | "movement.media"
  | "movement.category"
  | "movement.bodyZoneIds"
  | "movement.phases"
  | "movement.nextPhaseId"
  | "movement.used"
  | "movement.levelGroup";

export type MovementViolation = {
  readonly code: "REQUIRED" | "TOO_LONG" | "DUPLICATE" | "OUT_OF_RANGE" | "UNRECOGNIZED";
  readonly field: MovementValidationField;
};

export type MovementValidationResult =
  | { readonly ok: true; readonly value: Movement }
  | { readonly ok: false; readonly violations: readonly MovementViolation[] };

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

/**
 * Invariant de la structure des phases (MFN-02, AD-20) : au plus 6 phases,
 * identités entières ≥ 1 uniques, libellés de 1 à 20 points de code non blancs.
 * Retourne la raison d'un écart, `null` s'il tient.
 */
export function movementPhasesProblem(phases: unknown): string | null {
  if (!Array.isArray(phases)) {
    return "movement phases are not a list";
  }
  if (phases.length > WORK_PHASE_LIMITS.maxCount) {
    return "too many movement phases";
  }
  const ids = new Set<number>();
  for (const phase of phases as unknown[]) {
    if (typeof phase !== "object" || phase === null || Array.isArray(phase)) {
      return "malformed movement phase";
    }
    const { id, label } = phase as { id?: unknown; label?: unknown };
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1 || ids.has(id)) {
      return "malformed or duplicated movement phase id";
    }
    ids.add(id);
    if (isBlank(label) || codePointLength(label as string) > WORK_PHASE_LIMITS.labelMaxLength) {
      return "malformed movement phase label";
    }
  }
  return null;
}

/** Plus petite valeur admise du compteur : max(`id`) + 1, 1 sans phase. */
function phaseCounterFloor(phases: readonly { readonly id: number }[]): number {
  return phases.reduce((max, phase) => Math.max(max, phase.id), 0) + 1;
}

/**
 * Validation d'un Mouvement (ch09, MFN-02, MFN-05). Agrège toutes les
 * violations, ne lève jamais. Nom et description sont contrôlés et normalisés
 * par les validateurs de l'Exercice (`validateExerciseName`,
 * `validateInstruction`) ; Catégorie non vide ; Zones corporelles non vides et
 * distinctes ; médias à identifiant non vide et cohérent avec l'asset ; structure
 * des phases (`movementPhasesProblem`) ; compteur entier > max(`id`) (un
 * compteur ≤ max(`id`) pourrait réallouer une identité) ; `used` booléen ; groupe
 * `null` ou identifiant non vide ET clé de tri finie, toujours ensemble.
 * Succès : Mouvement normalisé (nom et description).
 */
export function validateMovement(movement: Movement): MovementValidationResult {
  const violations: MovementViolation[] = [];
  if (isBlank(movement.id)) {
    violations.push({ code: "REQUIRED", field: "movement.id" });
  }
  const name = validateExerciseName(movement.name);
  if (!name.ok) {
    violations.push({
      code: name.violations.some((violation) => violation.code === "TOO_LONG") ? "TOO_LONG" : "REQUIRED",
      field: "movement.name",
    });
  }
  const description = validateInstruction(movement.description);
  if (!description.ok) {
    violations.push({ code: "TOO_LONG", field: "movement.description" });
  }
  if (
    !Array.isArray(movement.media) ||
    movement.media.some((item) => isBlank(item.assetId) || item.asset === undefined || item.asset.id !== item.assetId)
  ) {
    violations.push({ code: "REQUIRED", field: "movement.media" });
  }
  if (isBlank(movement.categoryId)) {
    violations.push({ code: "REQUIRED", field: "movement.category" });
  }
  if (!Array.isArray(movement.bodyZoneIds) || movement.bodyZoneIds.length === 0 || movement.bodyZoneIds.some(isBlank)) {
    violations.push({ code: "REQUIRED", field: "movement.bodyZoneIds" });
  } else if (new Set(movement.bodyZoneIds).size !== movement.bodyZoneIds.length) {
    violations.push({ code: "DUPLICATE", field: "movement.bodyZoneIds" });
  }
  const phasesValid = movementPhasesProblem(movement.phases) === null;
  if (!phasesValid) {
    violations.push({ code: "UNRECOGNIZED", field: "movement.phases" });
  }
  const counter = movement.nextPhaseId;
  if (
    typeof counter !== "number" ||
    !Number.isInteger(counter) ||
    counter < 1 ||
    (phasesValid && counter < phaseCounterFloor(movement.phases))
  ) {
    violations.push({ code: "OUT_OF_RANGE", field: "movement.nextPhaseId" });
  }
  if (typeof movement.used !== "boolean") {
    violations.push({ code: "UNRECOGNIZED", field: "movement.used" });
  }
  const group = movement.levelGroup;
  if (
    group !== null &&
    (typeof group !== "object" || isBlank(group.groupId) || typeof group.sortKey !== "number" || !Number.isFinite(group.sortKey))
  ) {
    violations.push({ code: "REQUIRED", field: "movement.levelGroup" });
  }
  if (violations.length > 0 || !name.ok || !description.ok) {
    return { ok: false, violations };
  }
  return { ok: true, value: { ...movement, name: name.value, description: description.value } };
}

/**
 * Avance le compteur de phase (MFN-02, MFN/AC30) : le plus grand du compteur
 * courant, de `nextPhaseId` (par exemple celui d'un Brouillon de Feuille après
 * des ajouts) et de max(`id`) + 1. Jamais de recul : une valeur inférieure ou
 * non entière est ignorée.
 */
export function advancePhaseCounter(movement: Movement, nextPhaseId: number): Movement {
  const candidate = Number.isInteger(nextPhaseId) ? nextPhaseId : 0;
  const advanced = Math.max(movement.nextPhaseId, candidate, phaseCounterFloor(movement.phases));
  return advanced === movement.nextPhaseId ? movement : { ...movement, nextPhaseId: advanced };
}

/**
 * Remplace la structure des phases (ordre, libellés, identités) et avance le
 * compteur par `advancePhaseCounter` : une identité retirée de la structure
 * reste consommée. Aucune durée n'est portée. La validité de la structure reste
 * à la charge de `validateMovement`.
 *
 * Entrée invalide (lève, MFN-02, MFN/AC30) : une identité absente de la
 * structure précédente et inférieure au compteur précédent est une identité
 * RETIRÉE ; la réintroduire réallouerait un identifiant supprimé. Une identité
 * ≥ au compteur précédent est une allocation nouvelle, admise.
 */
export function withPhaseStructure(movement: Movement, phases: readonly MovementPhase[], nextPhaseId: number): Movement {
  const previous = new Set(movement.phases.map((phase) => phase.id));
  const retired = phases.find((phase) => !previous.has(phase.id) && phase.id < movement.nextPhaseId);
  if (retired !== undefined) {
    throw new Error(`withPhaseStructure: retired phase id ${retired.id} cannot be reallocated (MFN-02).`);
  }
  return advancePhaseCounter(
    { ...movement, phases: phases.map((phase) => ({ id: phase.id, label: phase.label })) },
    nextPhaseId,
  );
}

/**
 * Marque le Mouvement « déjà utilisé » (MFN-08) : métadonnée durable,
 * irréversible (aucune fonction inverse), sans modification du contenu ni des
 * paramètres. Déjà utilisé : Mouvement rendu tel quel.
 */
export function markMovementUsed(movement: Movement): Movement {
  return movement.used ? movement : { ...movement, used: true };
}

/** Structure et valeurs Catalogue issues d'une représentation résolue. */
export type SplitParameters = {
  readonly phases: readonly MovementPhase[];
  readonly parameters: CatalogExecutionParameters;
};

/**
 * Scinde des paramètres RÉSOLUS (v3) en structure `(id, label)` du Mouvement et
 * paramètres Catalogue v4 `{ phaseId, durationSeconds }` (MFN-02, MFN/AC35), dans
 * l'ordre des phases. Une durée < 1 s (0 de la représentation résolue d'un frère
 * incomplet) devient `null`, seule absence stockable. PRE-7 (D-446) : la Cible
 * est conservée telle quelle, liste complète ou non — elle est indépendante du
 * motif des phases (elle n'était forcée à `UNSET` que parce qu'elle valait Σ).
 * PRE-7 (D-446, R-2) : le motif est commun aux deux régimes ; une série variable porte
 * les mêmes durées de phases qu'une série identique. Aucune validation : le
 * sérialiseur et la résolution appliquent l'invariant.
 */
export function splitResolvedParameters(parameters: ExecutionParameters): SplitParameters {
  const { series } = parameters;
  const root = { ...parameters, version: CATALOG_EXECUTION_PARAMETERS_VERSION };
  const phaseDurations: PhaseDuration[] = series.workPhases.map((phase) => ({
    phaseId: phase.id,
    durationSeconds: phase.durationSeconds >= WORK_PHASE_LIMITS.durationMin ? phase.durationSeconds : null,
  }));
  const phases = series.workPhases.map((phase) => ({ id: phase.id, label: phase.label }));
  if (series.kind === "VARIABLE") {
    return {
      phases,
      parameters: {
        ...root,
        series: {
          kind: "VARIABLE",
          rows: series.rows.map((row) => ({ target: { ...row.target }, pauseSeconds: row.pauseSeconds, loadKg: row.loadKg })),
          phaseDurations,
        },
      },
    };
  }
  const { workPhases: _workPhases, ...uniform } = series;
  return {
    phases,
    parameters: {
      ...root,
      series: { ...uniform, target: { ...series.target }, phaseDurations },
    },
  };
}

/**
 * Résolution structure + valeurs (MFN-02, MFN-08, MFN/AC24, AC35) :
 * - `EXECUTABLE` : toutes les durées renseignées, paramètres résolus complets ;
 * - `INCOMPLETE` : au moins une durée `null` (exercice frère incomplet) ;
 *   `parameters` reste éditable (durée manquante à 0, ouverte `null` par le
 *   Brouillon ; Cible conservée, D-446) et `missingPhaseIds` liste les phases à
 *   compléter dans l'ordre de la structure. Jamais exécutable.
 *   PRE-7 (A1.3, MFN-08) : `missingPhaseIds` est VIDE pour un frère sans phase
 *   dont la durée de série reste à renseigner (Cible `UNSET` : structure
 *   retirée par une correction partagée alors que ses durées étaient
 *   incomplètes, complétion explicitement passée).
 */
export type CatalogResolution =
  | { readonly status: "EXECUTABLE"; readonly parameters: ExecutionParameters }
  | {
      readonly status: "INCOMPLETE";
      readonly parameters: ExecutionParameters;
      readonly missingPhaseIds: readonly number[];
    };

/**
 * Reconstitue la représentation résolue depuis la structure du Mouvement et les
 * paramètres Catalogue (MFN-02, ch10 « Nature, libellés et ordre des phases →
 * Mouvement ») : l'ordre et les libellés sont ceux de la structure, les durées
 * sont associées par `phaseId`. Les identités doivent être EXACTEMENT les mêmes
 * des deux côtés (vide ⇔ vide ; D-446 : dans les deux régimes de séries) ; un écart,
 * une structure invalide ou un invariant rompu est une donnée corrompue →
 * `ExecutionParametersDataError`, jamais une association approchée.
 */
export function resolveCatalogParameters(
  phases: readonly MovementPhase[],
  parameters: CatalogExecutionParameters,
): CatalogResolution {
  const structureProblem = movementPhasesProblem(phases);
  if (structureProblem !== null) {
    throw new ExecutionParametersDataError(`Malformed movement structure: ${structureProblem}.`);
  }
  if (parameters.version !== CATALOG_EXECUTION_PARAMETERS_VERSION) {
    throw new ExecutionParametersDataError(`Unknown catalog execution parameters version: ${String(parameters.version)}.`);
  }
  const { series } = parameters;
  const root = { ...parameters, version: EXECUTION_PARAMETERS_VERSION };
  const durationsProblem = phaseDurationsProblem(series.phaseDurations);
  if (durationsProblem !== null) {
    throw new ExecutionParametersDataError(`Malformed phase durations: ${durationsProblem}.`);
  }
  const byId = new Map(series.phaseDurations.map((entry) => [entry.phaseId, entry.durationSeconds] as const));
  if (byId.size !== phases.length || phases.some((phase) => !byId.has(phase.id))) {
    throw new ExecutionParametersDataError("Movement phases and phase durations differ.");
  }
  const workPhases: WorkPhase[] = phases.map((phase) => ({
    id: phase.id,
    label: phase.label,
    durationSeconds: byId.get(phase.id) ?? 0,
  }));
  const missingPhaseIds = phases.filter((phase) => byId.get(phase.id) === null).map((phase) => phase.id);
  let resolved: ExecutionParameters;
  let unsetTargetPresent: boolean;
  if (series.kind === "VARIABLE") {
    resolved = {
      ...root,
      series: {
        kind: "VARIABLE",
        rows: series.rows.map((row) => ({ target: { ...row.target }, pauseSeconds: row.pauseSeconds, loadKg: row.loadKg })),
        workPhases,
      },
    };
    // Une Cible `UNSET` dans une ligne variable reste admise comme avant (PRE-4, story 2.1 AC8) :
    // seule une durée de phase manquante rend une série variable incomplète.
    unsetTargetPresent = false;
  } else {
    const { phaseDurations: _phaseDurations, ...uniform } = series;
    resolved = { ...root, series: { ...uniform, target: { ...series.target }, workPhases } };
    unsetTargetPresent = series.target.kind === "UNSET";
  }
  // PRE-7 (A1.3) : une Cible `UNSET` n'est jamais exécutable — sans phase
  // manquante, c'est la durée de série elle-même qui reste à renseigner.
  if (missingPhaseIds.length > 0 || unsetTargetPresent) {
    return { status: "INCOMPLETE", parameters: resolved, missingPhaseIds };
  }
  const problem = resolvedWorkPhasesProblem(workPhases);
  if (problem !== null) {
    throw new ExecutionParametersDataError(`Malformed resolved work phases: ${problem}.`);
  }
  return { status: "EXECUTABLE", parameters: resolved };
}

/**
 * Portée de la validation Catalogue (MFN-08) : `EDITED` pour l'Exercice
 * directement édité, qui doit être complet (MFN/AC25) ; `SIBLING_ACCEPTED` pour
 * un exercice frère dont l'utilisateur a explicitement passé la complétion
 * (MFN/AC24), persistable incomplet.
 */
export type CatalogValidationScope = "EDITED" | "SIBLING_ACCEPTED";

export type CatalogValidationResult =
  | { readonly ok: true; readonly value: CatalogResolution }
  | { readonly ok: false; readonly violations: readonly ExecutionParametersViolation[] };

/** Violation attendue d'un frère incomplet : Cible commune à renseigner, ou durée manquante de phase. */
function isIncompletenessViolation(violation: ExecutionParametersViolation, missing: ReadonlySet<number>): boolean {
  if (violation.code !== "REQUIRED" || violation.seriesNumber !== undefined) {
    return false;
  }
  return (
    violation.field === "target" ||
    (violation.field === "workPhases" && violation.phaseId !== undefined && missing.has(violation.phaseId))
  );
}

/**
 * Validation d'enregistrement des paramètres Catalogue d'un Exercice (MFN-02,
 * MFN-08), au niveau structurel (`validateForSave(…, "STORAGE")`) sur la
 * représentation résolue. Un écart structure ≠ valeurs (`ExecutionParametersDataError`
 * de la résolution) donne une violation `UNRECOGNIZED` `workPhases` ; toute autre
 * erreur levée n'est pas convertie. Le succès porte des paramètres EFFECTIFS
 * normalisés (`normalizeEffective` : N = 1, ordre des côtés), incomplets compris.
 * - Complet : mêmes règles que tout Exercice ; succès `EXECUTABLE`.
 * - Incomplet, `EDITED` : refusé, une violation `REQUIRED` `workPhases` par
 *   `phaseId` manquant (et la Cible commune à renseigner) ; phases conservées.
 * - Incomplet, `SIBLING_ACCEPTED` : accepté s'il ne viole rien d'autre que son
 *   incomplétude ; succès `INCOMPLETE`, jamais `EXECUTABLE`.
 */
export function validateCatalogParameters(
  phases: readonly MovementPhase[],
  parameters: CatalogExecutionParameters,
  scope: CatalogValidationScope,
): CatalogValidationResult {
  let resolution: CatalogResolution;
  try {
    resolution = resolveCatalogParameters(phases, parameters);
  } catch (error) {
    if (error instanceof ExecutionParametersDataError) {
      return { ok: false, violations: [{ code: "UNRECOGNIZED", field: "workPhases", level: "STRUCTURE" }] };
    }
    throw error;
  }
  const result = validateForSave(resolution.parameters, "STORAGE");
  if (resolution.status === "EXECUTABLE") {
    return result.ok ? { ok: true, value: { status: "EXECUTABLE", parameters: result.value } } : result;
  }
  const normalized: CatalogResolution = { ...resolution, parameters: normalizeEffective(resolution.parameters) };
  if (result.ok) {
    // Inatteignable : une durée manquante est toujours une violation de `validateForSave`.
    return { ok: true, value: normalized };
  }
  if (scope === "EDITED") {
    return result;
  }
  const missing = new Set(resolution.missingPhaseIds);
  const others = result.violations.filter((violation) => !isIncompletenessViolation(violation, missing));
  return others.length > 0 ? { ok: false, violations: others } : { ok: true, value: normalized };
}

/** Résultat de l'allocation des phases d'une mise à jour (`allocatePhaseIdentities`). */
export type PhaseAllocation = {
  /** Mouvement à la nouvelle structure, compteur avancé. */
  readonly movement: Movement;
  /** Paramètres résolus dont les identités de phases sont celles du Mouvement. */
  readonly parameters: ExecutionParameters;
};

/**
 * PRE-7 (A1.2, MFN-02, MFN/AC30 : « un compteur monotone porté par le
 * mouvement attribue les identifiants ») — allocation des identités de phases
 * d'une mise à jour. Une phase dont l'identité figure déjà dans la structure du
 * Mouvement la garde (déplacement, renommage, durée) ; toute autre phase reçoit
 * la valeur courante du compteur, qui avance d'autant. Garantie : une identité
 * absente de la structure PERSISTÉE n'est jamais reprise (une phase retirée et
 * enregistrée, puis réintroduite par un max + 1 du Brouillon, reçoit le
 * compteur). Limite : une identité encore présente dans la structure persistée
 * est conservée telle quelle ; si le Brouillon retire une phase sans
 * enregistrer puis en ajoute une qui recalcule la même identité par max + 1
 * (structure [1, 2, 3], 3 retirée puis rajoutée dans la même Feuille), elle est
 * gardée comme la phase 3 d'origine. Fermer ce cas suppose que la Feuille
 * reçoive le compteur du Mouvement (`openSheetDraft(…, { nextPhaseId })`,
 * câblage A2.1). PRE-7 (D-446, R-2) : même allocation pour une série variable,
 * dont le motif est commun à toutes les lignes.
 *
 * L'ordre et les libellés sont ceux des paramètres reçus ; les durées sont
 * reportées sur l'identité allouée. Aucune validation : le sérialiseur et la
 * résolution appliquent l'invariant.
 */
export function allocatePhaseIdentities(movement: Movement, parameters: ExecutionParameters): PhaseAllocation {
  const { series } = parameters;
  const present = new Set(movement.phases.map((phase) => phase.id));
  const kept = new Set<number>();
  let counter = movement.nextPhaseId;
  const workPhases: WorkPhase[] = series.workPhases.map((phase) => {
    let id: number;
    if (present.has(phase.id) && !kept.has(phase.id)) {
      id = phase.id;
    } else {
      id = counter;
      counter += 1;
    }
    kept.add(id);
    return { id, label: phase.label, durationSeconds: phase.durationSeconds };
  });
  const next = withPhaseStructure(
    movement,
    workPhases.map((phase) => ({ id: phase.id, label: phase.label })),
    counter,
  );
  return { movement: next, parameters: { ...parameters, series: { ...series, workPhases } } };
}

/**
 * Clé de recherche d'un nom de Mouvement (MFN-04, MFN-06 : recherche des
 * gestes disponibles, locaux compris) : espaces réduits, casse et accents
 * neutralisés — même normalisation que les clés canoniques des référentiels.
 * Aucune contrainte d'unicité n'en découle (MFN-05 : « aucune contrainte
 * d'unicité n'est posée sur les noms »).
 */
export function normalizeMovementName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * PRE-7 (A2.2, MFN-02, MFN-06 « Même geste, autres paramètres » : « reprendre son contenu ;
 * saisir les paramètres du nouvel exercice ») — paramètres initiaux d'une création sur un geste
 * repris : ceux du brouillon vide `base`, et, si le geste a des phases, sa STRUCTURE (identités et
 * libellés) portée par une série identique en mode Durée avec des durées à renseigner (0, Cible
 * `UNSET`) : aucune valeur n'est inventée, et une reprise inchangée n'est pas une modification de la
 * structure du geste. Fonction pure. PRE-7 (D-446) : le mode Durée n'est plus le seul éligible aux
 * phases (Répétitions et À l'échec le sont aussi) ; il reste le mode initial de la reprise,
 * comportement inchangé, l'utilisateur pouvant ensuite choisir Répétitions ou À l'échec.
 */
export function repriseExecutionParameters(movement: Movement, base: ExecutionParametersInput): ExecutionParametersInput {
  if (movement.phases.length === 0 || base.series.kind !== "UNIFORM") {
    return base;
  }
  return {
    ...base,
    mode: "DURATION",
    series: {
      ...base.series,
      target: unsetTarget(),
      workPhases: movement.phases.map((phase) => ({ id: phase.id, label: phase.label, durationSeconds: 0 })),
    },
  };
}
