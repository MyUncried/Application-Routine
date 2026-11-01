import { createEmptyExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { repriseExecutionParameters, type Movement } from "@/domain/activities/Movement";
import { DEFAULT_CIRCUIT_NATURE } from "@/domain/sessions/circuit";
import { settleCircuitMembership } from "@/domain/sessions/circuitMembership";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import { createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";
import { insertIntoRichLayout, resolveRichLayout } from "@/features/sessions/compositionLayout";
import { formatOccurrenceSummary, isIncompleteSummary } from "@/features/sessions/compositionPresentation";

/**
 * PRE-9 A.2 (ARB-22a, D-449, ARB-07) — Exercices de Séance créés depuis des Mouvements.
 *
 * Les deux actions du menu Créer de la Composition passent par les écrans de Mouvement de PRE-8 :
 * « Créer un nouvel exercice » ouvre la création d'un Mouvement (CE-MVT-01, route `/movement` en
 * contexte Séance), « Utiliser un mouvement existant » la sélection des Mouvements actifs du
 * Catalogue (Q6, route `/movement-selection`) [cette entrée est retirée du menu le 01/11/2026 — ordre
 * de Hermann, ch13 CE-T03-08 « Menu Créer — état cible » : seul « Créer un exercice » reste, la
 * saisie du nom y propose les Mouvements existants]. Chacun REMET à la Composition, à son retour, le ou
 * les Mouvements choisis (`handMovementsToComposition`) ; la Composition les reprend au retour au
 * premier plan (`takeMovementsHandedToComposition`), en fait des Exercices insérés selon ARB-07
 * (`withMovementExercises`), posés « Paramètres à compléter » sans ouvrir de feuille (demande de
 * Hermann du 29/10/2026) : toucher leur carte ouvre leurs paramètres. Remise en mémoire, à usage unique : la
 * fiche Mouvement est une route de la pile racine, hors du fournisseur du brouillon de Séance.
 */
let handedMovements: readonly Movement[] | null = null;

/**
 * Contre-recette PRE-9 n° 1 (Hermann, 30/10/2026 : « Choisir un mouvement existant : les mouvements
 * déjà présents dans la séance sont identifiables » ; rendu choisi : mention « Dans la séance ») —
 * Mouvements dont la Séance en cours contient déjà un Exercice, remis par la Composition à la
 * sélection au moment de l'ouvrir (même raison que `handedMovements` : route hors du brouillon).
 */
let movementIdsInSession: ReadonlySet<string> = new Set();

/** Mouvements déjà présents dans la Séance, pour la sélection qui va s'ouvrir. */
export function markMovementsInSession(movementIds: Iterable<string>): void {
  movementIdsInSession = new Set(movementIds);
}

/** Lecture (sans consommation) des Mouvements déjà présents dans la Séance. */
export function movementsInSession(): ReadonlySet<string> {
  return movementIdsInSession;
}

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
  /** PRE-9 (01/11/2026, point 2) : « Récupération après un exercice » du Profil. */
  readonly recoverySeconds: number;
};

/**
 * Nouvel Exercice de Séance, occurrence d'un Mouvement enregistré — mêmes valeurs que l'ancien
 * éditeur pour « Utiliser ce mouvement » (PRE-7 A2.3, MFN-09) : contenu du Mouvement (vue, jamais
 * persistée avec l'occurrence, R-3), filiation `sourceMovementId`, paramètres vierges avec Compte à
 * rebours et Fin du Profil, phases du Mouvement à durées vides (`repriseExecutionParameters`) ;
 * aucune Récupération automatique (`null`, AD-35) [remplacé le 01/11/2026 (ordre de Hermann, point 2 ;
 * ch07 « Récupération de l'Exercice et défauts du Profil ») : la Récupération de l'Exercice reprend
 * « Récupération après un exercice » du Profil, et les défauts du Profil repris restent « en attente »
 * (`profileDefaultsPending`, fond orange dans la feuille) jusqu'au premier ✓]. Paramètres incomplets tant qu'ils ne sont pas
 * réglés : la Composition le signale et bloque l'enregistrement (D-389).
 * [PRE-9 A.2b, 31/10/2026 — décision de Hermann du 30/10 : « à durées vides » est remplacé par
 * « durées par défaut du Mouvement reprises par identité de phase, vides où le Mouvement n'en a
 * pas ». Valeurs copiées dans l'Exercice : ni sa modification dans la Séance ne touche le
 * Mouvement, ni une modification ultérieure du Mouvement ne touche l'Exercice (31/10 : « Inchangés »).]
 * [Remplacé en partie le 31/10/2026, recette iPhone n° 2, constat e : une durée restée VIDE dans un
 * Exercice enregistré reçoit une valeur par défaut ajoutée ensuite au Mouvement (« Paramètre à
 * vérifier », `parametersToVerify.ts`).]
 */
export function exerciseOfMovement(movement: Movement, id: string, defaults: MovementExerciseDefaults): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, defaults.recoverySeconds),
    name: movement.name,
    instruction: movement.description,
    categoryId: movement.categoryId,
    bodyZoneIds: [...movement.bodyZoneIds],
    media: [...movement.media],
    executionParameters: repriseExecutionParameters(movement, createEmptyExecutionParameters(defaults)),
    sourceMovementId: movement.id,
    profileDefaultsPending: true,
  };
}

/**
 * ARB-07 (« après le dernier Exercice entré, dans son conteneur, comme actuellement ») — même
 * insertion que les anciens parcours (B.2) : disposition générale (`insertIntoRichLayout`), sinon
 * ancien modèle (`appendActivityAfterLastDisplayed` puis réglage du Circuit). Un nouvel Exercice a
 * une seule série : son entrée dans un Circuit de Séries ne retire aucune série (aucune perte à
 * confirmer). PRE-9 (B.3) : en disposition générale aussi, il est porté au N du Circuit alterné qui
 * le reçoit (extension par sa ligne, sans perte).
 */
export function withMovementExercises(
  draft: SessionDraft,
  additions: readonly SessionDraftExercise[],
): Pick<SessionDraft, "exercises"> & Partial<Pick<SessionDraft, "structure">> {
  const rich = insertIntoRichLayout(draft, additions);
  if (rich !== null) {
    return { exercises: rich.exercises, structure: rich.structure };
  }
  let next = draft.exercises;
  for (const addition of additions) {
    next = appendActivityAfterLastDisplayed(next, addition);
  }
  return { exercises: settleCircuitMembership(draft, next).exercises };
}

/**
 * Demande de Hermann du 29/10/2026 (recette iPhone n° 1) : une carte d'Exercice « Paramètres à
 * compléter » (carte rouge, D-448 point 7 ; même règle que sa synthèse, `formatOccurrenceSummary`)
 * ouvre directement la feuille de paramètres, sans ouvrir l'éditeur ; complète, elle ouvre
 * l'éditeur comme avant.
 */
export function isExerciseParametersIncomplete(exercise: Pick<SessionDraftExercise, "type" | "executionParameters">): boolean {
  return exercise.type === "EXERCISE" && isIncompleteSummary(formatOccurrenceSummary(exercise));
}

/**
 * N hérité d'un Circuit de Séries (AD-37) — même règle que l'éditeur en Séance : ancien modèle,
 * Exercice du Circuit unique de nature Séries ; disposition générale, Exercice d'un Circuit de Séries.
 */
export function inheritsCircuitSeriesCount(
  draft: Pick<SessionDraft, "structure" | "exercises" | "circuitNature">,
  exercise: Pick<SessionDraftExercise, "id" | "type" | "structuralPosition">,
): boolean {
  if (exercise.type !== "EXERCISE") {
    return false;
  }
  const rich = resolveRichLayout(draft);
  if (rich !== null) {
    return structureCircuits(rich).some(
      (circuit) => circuit.nature === "SERIES" && circuit.exercises.some((member) => member.id === exercise.id),
    );
  }
  return exercise.structuralPosition === "IN_TOUR" && (draft.circuitNature ?? DEFAULT_CIRCUIT_NATURE) === "SERIES";
}

/**
 * PRE-7 (R-3, C05) : l'occurrence référence un Mouvement déjà enregistré (et non un Mouvement
 * NOUVEAU de la table du brouillon) — structure de ses phases verrouillée (MFN-09), comme dans
 * l'éditeur en Séance.
 */
export function isPersistedMovementOccurrence(
  exercise: Pick<SessionDraftExercise, "sourceMovementId">,
  movements: SessionDraft["movements"],
): boolean {
  const movementId = (exercise.sourceMovementId ?? "").trim();
  return movementId.length > 0 && movements?.[movementId]?.change !== "NEW";
}
