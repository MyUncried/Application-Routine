import { createEmptyExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { repriseExecutionParameters, type Movement } from "@/domain/activities/Movement";
import { settleCircuitMembership } from "@/domain/sessions/circuitMembership";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { insertIntoRichLayout } from "@/features/sessions/compositionLayout";

/**
 * PRE-9 A.2 (ARB-22a, D-449, ARB-07) — Exercices de Séance créés depuis des Mouvements.
 *
 * Les deux actions du menu Créer de la Composition passent par les écrans de Mouvement de PRE-8 :
 * « Créer un nouvel exercice » ouvre la création d'un Mouvement (CE-MVT-01, route `/movement` en
 * contexte Séance), « Utiliser un mouvement existant » la sélection des Mouvements actifs du
 * Catalogue (Q6, route `/movement-selection`). Chacun REMET à la Composition, à son retour, le ou
 * les Mouvements choisis (`handMovementsToComposition`) ; la Composition les reprend au retour au
 * premier plan (`takeMovementsHandedToComposition`), en fait des Exercices insérés selon ARB-07
 * (`withMovementExercises`) puis ouvre leurs paramètres. Remise en mémoire, à usage unique : la
 * fiche Mouvement est une route de la pile racine, hors du fournisseur du brouillon de Séance.
 */
let handedMovements: readonly Movement[] | null = null;

/** Remet à la Composition les Mouvements choisis, dans l'ordre d'insertion voulu. */
export function handMovementsToComposition(movements: readonly Movement[]): void {
  handedMovements = movements.length > 0 ? [...movements] : null;
}

/** Reprend (une seule fois) les Mouvements remis ; `null` : aucun. */
export function takeMovementsHandedToComposition(): readonly Movement[] | null {
  const taken = handedMovements;
  handedMovements = null;
  return taken;
}

/** Valeurs du Profil copiées dans un nouvel Exercice (P3-10 : jamais relues ensuite). */
export type MovementExerciseDefaults = {
  readonly countdownSeconds: number;
  readonly endSeconds: number;
};

/**
 * Nouvel Exercice de Séance, occurrence d'un Mouvement enregistré — mêmes valeurs que l'ancien
 * éditeur pour « Utiliser ce mouvement » (PRE-7 A2.3, MFN-09) : contenu du Mouvement (vue, jamais
 * persistée avec l'occurrence, R-3), filiation `sourceMovementId`, paramètres vierges avec Compte à
 * rebours et Fin du Profil, phases du Mouvement à durées vides (`repriseExecutionParameters`) ;
 * aucune Récupération automatique (`null`, AD-35). Paramètres incomplets tant qu'ils ne sont pas
 * réglés : la Composition le signale et bloque l'enregistrement (D-389).
 */
export function exerciseOfMovement(movement: Movement, id: string, defaults: MovementExerciseDefaults): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, null),
    name: movement.name,
    instruction: movement.description,
    categoryId: movement.categoryId,
    bodyZoneIds: [...movement.bodyZoneIds],
    media: [...movement.media],
    executionParameters: repriseExecutionParameters(movement, createEmptyExecutionParameters(defaults)),
    sourceMovementId: movement.id,
  };
}

/**
 * ARB-07 (« après le dernier Exercice entré, dans son conteneur, comme actuellement ») — même
 * insertion que les anciens parcours (B.2) : disposition générale (`insertIntoRichLayout`), sinon
 * ancien modèle (`appendActivityAfterLastDisplayed` puis réglage du Circuit). Un nouvel Exercice a
 * une seule série : son entrée dans un Circuit de Séries ne retire aucune série (aucune perte à
 * confirmer).
 */
export function withMovementExercises(
  draft: SessionDraft,
  additions: readonly SessionDraftExercise[],
): Pick<SessionDraft, "exercises"> & Partial<Pick<SessionDraft, "structure">> {
  const rich = insertIntoRichLayout(draft, additions);
  if (rich !== null) {
    return rich;
  }
  let next = draft.exercises;
  for (const addition of additions) {
    next = appendActivityAfterLastDisplayed(next, addition);
  }
  return { exercises: settleCircuitMembership(draft, next).exercises };
}
