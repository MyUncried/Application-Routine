/**
 * PRE-7 (A1.3, D-437, D-438, MFN-02, MFN-08 ; ch11 « Contrats MFN » :
 * « Enregistrer une correction ») — domaine de la CORRECTION PARTAGÉE d'un
 * Mouvement : le contenu du geste (nom, description, médias, Catégorie, Zones,
 * structure des phases) est porté par le Mouvement et vaut pour tous les
 * Exercices du Catalogue qui le référencent (« Corriger cet exercice »).
 *
 * - `assessSharedCorrection` : ce que l'interface doit savoir AVANT
 *   d'enregistrer — usage durable, changement d'un champ sensible (nom,
 *   description, médias, structure des phases : MFN-08), nombre de définitions
 *   touchées, durées manquantes des Exercices frères, frères inéligibles.
 * - `planSiblingCorrection` / `planSiblingsCorrection` : nouveaux paramètres
 *   Catalogue de chaque frère après un changement de l'ENSEMBLE des phases :
 *   valeurs déjà présentes conservées par `phaseId`, durées manquantes jamais
 *   inventées (complétion fournie, ou `null` = complétion explicitement
 *   passée → frère INCOMPLET, MFN/AC24). Une correction qui ne change pas
 *   l'ensemble des identités (renommage, déplacement) ne touche pas les
 *   paramètres des frères : leurs durées restent associées par `phaseId`.
 *
 * Une correction ne touche jamais les copies de Séance ni les instantanés
 * (MFN-03, MFN-08 : « jamais une synchronisation des occurrences »).
 *
 * Fonctions pures — sans React, SQLite, Expo, i18n ni horloge.
 */

import {
  numberTarget,
  unsetTarget,
  type CatalogExecutionParameters,
  type ExecutionParameters,
  type PhaseDuration,
  type SeriesTarget,
} from "./ExecutionParameters";
import {
  splitResolvedParameters,
  validateCatalogParameters,
  type Movement,
  type MovementPhase,
} from "./Movement";

/**
 * Complétion d'un Exercice frère, fournie par l'étape distincte de saisie des
 * durées manquantes (MFN-08). Une durée `null` passe EXPLICITEMENT la
 * complétion : le frère est conservé incomplet. Une entrée pour un Exercice
 * qui n'est pas un frère concerné est ignorée.
 */
export type SiblingCompletion = {
  readonly definitionId: string;
  /** Durées des phases manquantes, par `phaseId` (identités allouées par le Mouvement). */
  readonly phaseDurations?: readonly PhaseDuration[];
  /**
   * Avec → Sans (structure retirée) : durée de série d'un frère dont les durées
   * étaient incomplètes ; `null` la laisse à renseigner.
   */
  readonly seriesDurationSeconds?: number | null;
};

/** Durées absentes d'un frère, à présenter à l'étape de complétion. */
export type SiblingGap = {
  readonly definitionId: string;
  /** Phases de la nouvelle structure sans durée connue, dans l'ordre de la structure. */
  readonly missingPhaseIds: readonly number[];
  /** Vrai quand la structure est retirée et que la durée de série ne peut pas être déduite. */
  readonly missingSeriesDuration: boolean;
};

/** Frère soumis au plan : identifiant et paramètres résolus relus (complets ou incomplets). */
export type SiblingDefinition = {
  readonly definitionId: string;
  readonly parameters: ExecutionParameters;
};

export type SiblingPlan =
  /** L'ensemble des phases ne change pas : paramètres du frère inchangés. */
  | { readonly status: "UNCHANGED" }
  | { readonly status: "READY"; readonly parameters: CatalogExecutionParameters; readonly incomplete: boolean }
  | { readonly status: "NEEDS_COMPLETION"; readonly gap: SiblingGap }
  /**
   * La nouvelle structure porte des phases et le frère ne peut pas en avoir
   * (MFN-02, éligibilité conservée : mode Durée, Cible chiffrée, séries
   * identiques).
   */
  | { readonly status: "INELIGIBLE" }
  /** Une durée fournie est invalide (entier ≥ 1 s, somme et bornes du format). */
  | { readonly status: "INVALID_COMPLETION" };

/** Refus d'une correction partagée : rien n'est écrit. */
export type SharedCorrectionRefusal =
  | { readonly kind: "SIBLING_COMPLETION_REQUIRED"; readonly siblings: readonly SiblingGap[] }
  | { readonly kind: "INELIGIBLE_SIBLINGS"; readonly definitionIds: readonly string[] }
  | { readonly kind: "INVALID_SIBLING_COMPLETION"; readonly definitionIds: readonly string[] };

export type SiblingsPlan =
  | {
      readonly status: "READY";
      /** Frères dont les paramètres Catalogue changent (les frères inchangés n'y figurent pas). */
      readonly updates: readonly { readonly definitionId: string; readonly parameters: CatalogExecutionParameters }[];
    }
  | { readonly status: "REFUSED"; readonly refusal: SharedCorrectionRefusal };

/**
 * Garde du repository (entrée invalide, lève) : une correction partagée dont
 * les frères ne sont pas prêts (complétion absente, frère inéligible, durée
 * invalide) n'est jamais écrite. `ActivityDefinitionService` la rend en union.
 */
export class SharedCorrectionRefusedError extends Error {
  constructor(readonly refusal: SharedCorrectionRefusal) {
    super(`Shared movement correction refused: ${refusal.kind}.`);
    this.name = "SharedCorrectionRefusedError";
  }
}

function idSet(phases: readonly { readonly id: number }[]): string {
  return phases
    .map((phase) => phase.id)
    .sort((a, b) => a - b)
    .join(",");
}

/** Vrai quand l'ENSEMBLE des identités de phases change (ajout ou retrait ; l'ordre et les libellés n'y comptent pas). */
export function phaseSetChanged(
  previous: readonly { readonly id: number }[],
  next: readonly { readonly id: number }[],
): boolean {
  return idSet(previous) !== idSet(next);
}

function sumOf(entries: readonly PhaseDuration[]): number {
  return entries.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0);
}

/**
 * Plan d'un Exercice frère après une correction de la structure (MFN-08,
 * ch09 « Une correction structurelle conserve les durées par identifiant ») :
 *
 * - ensemble inchangé → `UNCHANGED` ;
 * - Avec → Sans (nouvelle structure vide) : frère complet → durée de série =
 *   somme de ses durées ; sinon la durée de série est à compléter
 *   (`seriesDurationSeconds`, `null` = passer → Cible `UNSET`, incomplet).
 *   Option conservatrice renvoyée à Hermann (spec A1.3, Design Notes) ;
 * - nouvelle structure non vide : le frère doit être éligible aux phases
 *   (Durée, séries identiques, Cible chiffrée ou à renseigner), sinon
 *   `INELIGIBLE` ; une phase conservée garde la durée du frère ; une phase
 *   nouvelle, ou dont la durée du frère manquait déjà, prend la complétion
 *   fournie (`null` admis) ; sans complétion → `NEEDS_COMPLETION`. Toutes les
 *   durées connues → Cible = somme ; sinon Cible `UNSET` (incomplet).
 *
 * Le résultat est validé en portée `SIBLING_ACCEPTED` (`validateCatalogParameters`) :
 * hors incomplétude, toute violation donne `INVALID_COMPLETION`. Aucune
 * valeur n'est inventée.
 */
export function planSiblingCorrection(
  previousPhases: readonly MovementPhase[],
  nextPhases: readonly MovementPhase[],
  sibling: SiblingDefinition,
  completion?: SiblingCompletion,
): SiblingPlan {
  if (!phaseSetChanged(previousPhases, nextPhases)) {
    return { status: "UNCHANGED" };
  }
  const catalog = splitResolvedParameters(sibling.parameters).parameters;
  const { series } = catalog;
  let next: CatalogExecutionParameters;
  if (nextPhases.length === 0) {
    if (series.kind !== "UNIFORM") {
      return { status: "INELIGIBLE" };
    }
    const known = series.phaseDurations;
    const complete = known.length > 0 && known.every((entry) => entry.durationSeconds !== null);
    let target: SeriesTarget;
    if (complete) {
      target = numberTarget(sumOf(known));
    } else if (completion !== undefined && completion.seriesDurationSeconds !== undefined) {
      target = completion.seriesDurationSeconds === null ? unsetTarget() : numberTarget(completion.seriesDurationSeconds);
    } else {
      return {
        status: "NEEDS_COMPLETION",
        gap: { definitionId: sibling.definitionId, missingPhaseIds: [], missingSeriesDuration: true },
      };
    }
    next = { ...catalog, series: { ...series, target, phaseDurations: [] } };
  } else {
    if (
      catalog.mode !== "DURATION" ||
      series.kind !== "UNIFORM" ||
      (series.target.kind !== "NUMBER" && series.target.kind !== "UNSET")
    ) {
      return { status: "INELIGIBLE" };
    }
    const own = new Map(series.phaseDurations.map((entry) => [entry.phaseId, entry.durationSeconds] as const));
    const previous = new Set(previousPhases.map((phase) => phase.id));
    const provided = new Map((completion?.phaseDurations ?? []).map((entry) => [entry.phaseId, entry.durationSeconds] as const));
    const missing: number[] = [];
    const phaseDurations: PhaseDuration[] = nextPhases.map((phase) => {
      const kept = previous.has(phase.id) ? (own.get(phase.id) ?? null) : null;
      if (kept !== null) {
        return { phaseId: phase.id, durationSeconds: kept };
      }
      if (provided.has(phase.id)) {
        return { phaseId: phase.id, durationSeconds: provided.get(phase.id) ?? null };
      }
      missing.push(phase.id);
      return { phaseId: phase.id, durationSeconds: null };
    });
    if (missing.length > 0) {
      return {
        status: "NEEDS_COMPLETION",
        gap: { definitionId: sibling.definitionId, missingPhaseIds: missing, missingSeriesDuration: false },
      };
    }
    const incomplete = phaseDurations.some((entry) => entry.durationSeconds === null);
    const target = incomplete ? unsetTarget() : numberTarget(sumOf(phaseDurations));
    next = { ...catalog, series: { ...series, target, phaseDurations } };
  }
  const validated = validateCatalogParameters(nextPhases, next, "SIBLING_ACCEPTED");
  if (!validated.ok) {
    return { status: "INVALID_COMPLETION" };
  }
  return {
    status: "READY",
    parameters: splitResolvedParameters(validated.value.parameters).parameters,
    incomplete: validated.value.status === "INCOMPLETE",
  };
}

/**
 * Plan de tous les frères (`planSiblingCorrection`). Refus, par priorité : un
 * frère inéligible, puis une complétion invalide, puis des complétions
 * manquantes (toutes listées, dans l'ordre des frères). Rien n'est écrit sur
 * refus.
 */
export function planSiblingsCorrection(
  previousPhases: readonly MovementPhase[],
  nextPhases: readonly MovementPhase[],
  siblings: readonly SiblingDefinition[],
  completions: readonly SiblingCompletion[] = [],
): SiblingsPlan {
  const byId = new Map(completions.map((completion) => [completion.definitionId, completion] as const));
  const ineligible: string[] = [];
  const invalid: string[] = [];
  const gaps: SiblingGap[] = [];
  const updates: { definitionId: string; parameters: CatalogExecutionParameters }[] = [];
  for (const sibling of siblings) {
    const plan = planSiblingCorrection(previousPhases, nextPhases, sibling, byId.get(sibling.definitionId));
    if (plan.status === "INELIGIBLE") {
      ineligible.push(sibling.definitionId);
    } else if (plan.status === "INVALID_COMPLETION") {
      invalid.push(sibling.definitionId);
    } else if (plan.status === "NEEDS_COMPLETION") {
      gaps.push(plan.gap);
    } else if (plan.status === "READY") {
      updates.push({ definitionId: sibling.definitionId, parameters: plan.parameters });
    }
  }
  if (ineligible.length > 0) {
    return { status: "REFUSED", refusal: { kind: "INELIGIBLE_SIBLINGS", definitionIds: ineligible } };
  }
  if (invalid.length > 0) {
    return { status: "REFUSED", refusal: { kind: "INVALID_SIBLING_COMPLETION", definitionIds: invalid } };
  }
  if (gaps.length > 0) {
    return { status: "REFUSED", refusal: { kind: "SIBLING_COMPLETION_REQUIRED", siblings: gaps } };
  }
  return { status: "READY", updates };
}

/** Contenu saisi, comparé au Mouvement (nom et description déjà normalisés par la validation de l'Exercice). */
export type CorrectionEdit = {
  readonly name: string;
  readonly description: string | null;
  /** Identifiants ordonnés des médias saisis ; `undefined` = médias inchangés. */
  readonly mediaAssetIds?: readonly string[];
  /** Structure après allocation des identités par le compteur du Mouvement (`allocatePhaseIdentities`). */
  readonly phases: readonly MovementPhase[];
};

/** Ce que l'interface doit savoir avant d'enregistrer une correction (MFN-08, ch11). */
export type CorrectionAssessment = {
  /** État durable « déjà utilisé » du Mouvement. */
  readonly movementUsed: boolean;
  /** Nom, description, médias ou structure des phases (identités, libellés, ordre) modifiés. */
  readonly sensitiveChange: boolean;
  /** L'ensemble des identités de phases change (étape de complétion possible). */
  readonly structuralChange: boolean;
  /** « Déjà utilisé » ET changement sensible : la question d'identité doit être posée (MFN-08). */
  readonly requiresIdentityDecision: boolean;
  /** Nombre de définitions du Catalogue qui partagent déjà le Mouvement (portée affichée du dialogue). */
  readonly affectedDefinitionCount: number;
  /** Frères dont des durées manquent avec la nouvelle structure. */
  readonly siblingGaps: readonly SiblingGap[];
  /** Frères qui ne peuvent pas porter la nouvelle structure (la correction serait refusée). */
  readonly ineligibleDefinitionIds: readonly string[];
};

function samePhases(a: readonly MovementPhase[], b: readonly MovementPhase[]): boolean {
  return a.length === b.length && a.every((phase, index) => phase.id === b[index]!.id && phase.label === b[index]!.label);
}

/**
 * Évaluation d'une correction du Mouvement `movement` (MFN-08) : `siblings`
 * sont les AUTRES définitions qui le partagent (hors Exercice édité),
 * `affectedDefinitionCount` le nombre de définitions qui le partagent déjà.
 * Une modification limitée aux paramètres, à la Catégorie ou aux Zones n'est
 * pas sensible. Aucun effet ; la décision appartient à l'interface (A2.2).
 */
export function assessSharedCorrection(
  movement: Movement,
  edit: CorrectionEdit,
  siblings: readonly SiblingDefinition[],
  affectedDefinitionCount: number,
): CorrectionAssessment {
  const mediaChanged =
    edit.mediaAssetIds !== undefined && edit.mediaAssetIds.join("\u0000") !== movement.media.map((item) => item.assetId).join("\u0000");
  const sensitiveChange =
    edit.name !== movement.name ||
    (edit.description ?? null) !== (movement.description ?? null) ||
    mediaChanged ||
    !samePhases(edit.phases, movement.phases);
  const structuralChange = phaseSetChanged(movement.phases, edit.phases);
  const ineligibleDefinitionIds: string[] = [];
  const siblingGaps: SiblingGap[] = [];
  for (const sibling of siblings) {
    const plan = planSiblingCorrection(movement.phases, edit.phases, sibling);
    if (plan.status === "INELIGIBLE") {
      ineligibleDefinitionIds.push(sibling.definitionId);
    } else if (plan.status === "NEEDS_COMPLETION") {
      siblingGaps.push(plan.gap);
    }
  }
  return {
    movementUsed: movement.used,
    sensitiveChange,
    structuralChange,
    requiresIdentityDecision: movement.used && sensitiveChange,
    affectedDefinitionCount,
    siblingGaps,
    ineligibleDefinitionIds,
  };
}
