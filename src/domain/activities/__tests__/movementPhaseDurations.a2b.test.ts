import { describe, expect, it } from "@jest/globals";

import { createEmptyExecutionParameters, WORK_PATTERN_DURATION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import {
  allocatePhaseIdentities,
  movementPhaseDefaultDuration,
  movementPhasesProblem,
  repriseExecutionParameters,
  transferParametersByRank,
  validateMovement,
  withPhaseStructure,
  type Movement,
} from "@/domain/activities/Movement";
import {
  addMovementPhase,
  moveMovementPhase,
  removeMovementPhase,
  renameMovementPhase,
  savableMovementPhases,
  setMovementPhaseDuration,
} from "@/domain/activities/movementPhaseList";
import { decideMovementSave, movementContentOf, onlyPhaseDurationsChanged } from "@/domain/activities/movementSave";
import { uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createExerciseDraft, withOccurrenceMovement } from "@/domain/sessions/SessionDraft";

/**
 * PRE-9 A.2b — durées des phases portées par le Mouvement. Décisions de Hermann :
 * - 30/10/2026 : « Créer un mouvement : les durées de la phase peuvent faire partie du mouvement, si
 *   elles sont renseignées elles sont reprises par défaut et peuvent être changées dans la séance, si
 *   elles n'existent pas elles sont à renseigner dans la séance. »
 * - 31/10/2026 : modification ultérieure des durées du Mouvement → Exercices existants « Inchangés ».
 */

function movement(overrides: Partial<Movement> = {}): Movement {
  return {
    id: "mv-1",
    name: "Squat",
    description: null,
    media: [],
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
    phases: [
      { id: 1, label: "Descente", durationSeconds: 3 },
      { id: 2, label: "Pause" },
      { id: 3, label: "Montée", durationSeconds: 2 },
    ],
    nextPhaseId: 4,
    aliases: [],
    levelGroup: null,
    ...overrides,
  };
}

describe("PRE-9 A.2b — durée par défaut d'une phase du Mouvement : validation", () => {
  it("facultative : absente, `null` ou entière dans 1..3535 s ; 0, 3536, décimale ou texte refusés", () => {
    for (const durationSeconds of [undefined, null, WORK_PATTERN_DURATION_BOUNDS.min, 90, WORK_PATTERN_DURATION_BOUNDS.max]) {
      expect(movementPhasesProblem([{ id: 1, label: "a", durationSeconds }])).toBeNull();
    }
    for (const durationSeconds of [0, 3536, 1.5, -1, "10"]) {
      expect(movementPhasesProblem([{ id: 1, label: "a", durationSeconds }])).toBe("malformed movement phase duration");
    }
    expect(validateMovement(movement()).ok).toBe(true);
    expect(validateMovement(movement({ phases: [{ id: 1, label: "a", durationSeconds: 0 }], nextPhaseId: 2 })).ok).toBe(false);
  });

  it("movementPhaseDefaultDuration : nombre si renseignée, `null` sinon (absente ou `null`)", () => {
    expect(movementPhaseDefaultDuration({ id: 1, label: "a", durationSeconds: 12 })).toBe(12);
    expect(movementPhaseDefaultDuration({ id: 1, label: "a", durationSeconds: null })).toBeNull();
    expect(movementPhaseDefaultDuration({ id: 1, label: "a" })).toBeNull();
  });
});

describe("PRE-9 A.2b — identité de phase : la durée suit la phase", () => {
  it("fiche (movementPhaseList) : renommer et déplacer gardent la durée ; retirer la perd ; une phase nouvelle n'en a aucune ; `null` retire", () => {
    const list = { phases: movement().phases, nextPhaseId: 4 };
    const renamed = renameMovementPhase(list, 1, "Flexion");
    expect(renamed.phases[0]).toStrictEqual({ id: 1, label: "Flexion", durationSeconds: 3 });
    const moved = moveMovementPhase(renamed, 3, 0);
    expect(moved.phases.map((phase) => [phase.id, movementPhaseDefaultDuration(phase)])).toEqual([
      [3, 2],
      [1, 3],
      [2, null],
    ]);
    const removed = removeMovementPhase(moved, 3);
    expect(removed.phases.map((phase) => phase.id)).toEqual([1, 2]);
    const added = addMovementPhase(removed, "Repos");
    expect(added.phases.at(-1)).toStrictEqual({ id: 4, label: "Repos" });
    const set = setMovementPhaseDuration(added, 4, 20);
    expect(set.phases.at(-1)).toStrictEqual({ id: 4, label: "Repos", durationSeconds: 20 });
    expect(setMovementPhaseDuration(set, 4, null).phases.at(-1)).toStrictEqual({ id: 4, label: "Repos", durationSeconds: null });
    // Phases enregistrables : la durée est conservée avec le libellé rogné.
    expect(savableMovementPhases([{ id: 1, label: " a ", durationSeconds: 5 }])).toStrictEqual([{ id: 1, label: "a", durationSeconds: 5 }]);
  });

  it("withPhaseStructure : une phase reçue sans durée garde celle de la même identité ; reçue avec une durée (ou `null`), elle la remplace", () => {
    const next = withPhaseStructure(
      movement(),
      [
        { id: 3, label: "Montée" },
        { id: 1, label: "Descente", durationSeconds: null },
        { id: 4, label: "Nouvelle" },
      ],
      5,
    );
    expect(next.phases).toStrictEqual([
      { id: 3, label: "Montée", durationSeconds: 2 },
      { id: 1, label: "Descente", durationSeconds: null },
      { id: 4, label: "Nouvelle" },
    ]);
  });

  it("allocatePhaseIdentities (structure reconstruite depuis les paramètres d'un Exercice) : les durées du Mouvement sont conservées, jamais remplacées par celles de l'Exercice", () => {
    const parameters = uniformParameters({
      mode: "DURATION",
      target: 100,
      workPhases: [
        { id: 1, label: "Descente", durationSeconds: 40 },
        { id: 3, label: "Montée", durationSeconds: 50 },
        { id: 9, label: "Ajout", durationSeconds: 10 },
      ],
    });
    const { movement: next } = allocatePhaseIdentities(movement(), parameters);
    expect(next.phases).toStrictEqual([
      { id: 1, label: "Descente", durationSeconds: 3 },
      { id: 3, label: "Montée", durationSeconds: 2 },
      { id: 4, label: "Ajout" },
    ]);
  });
});

describe("PRE-9 A.2b — valeurs par défaut d'un nouvel Exercice (repriseExecutionParameters)", () => {
  const base = createEmptyExecutionParameters({ countdownSeconds: 10, endSeconds: 5 });

  it("durée du Mouvement reprise par identité de phase ; 0 (à renseigner) là où le Mouvement n'en a pas", () => {
    const reprise = repriseExecutionParameters(movement(), base);
    expect(reprise.series.workPhases).toEqual([
      { id: 1, label: "Descente", durationSeconds: 3 },
      { id: 2, label: "Pause", durationSeconds: 0 },
      { id: 3, label: "Montée", durationSeconds: 2 },
    ]);
  });

  it("valeurs COPIÉES : modifier ensuite le Mouvement ne change pas les paramètres déjà créés", () => {
    const source = movement();
    const reprise = repriseExecutionParameters(source, base);
    const before = JSON.stringify(reprise);
    const changed = { ...source, phases: source.phases.map((phase) => ({ ...phase, durationSeconds: 99 })) };
    expect(repriseExecutionParameters(changed, base).series.workPhases.map((phase) => phase.durationSeconds)).toEqual([99, 99, 99]);
    expect(JSON.stringify(reprise)).toBe(before);
  });
});

describe("PRE-9 A.2b — décision de sauvegarde C03", () => {
  const before = movementContentOf(movement());

  it("durées seules modifiées : enregistrées sans dialogue (`SILENT`), même avec d'autres Exercices — ils restent inchangés", () => {
    const after = movementContentOf(
      movement({ phases: [{ id: 1, label: "Descente", durationSeconds: 4 }, { id: 2, label: "Pause" }, { id: 3, label: "Montée", durationSeconds: 2 }] }),
    );
    expect(onlyPhaseDurationsChanged(before, after)).toBe(true);
    expect(decideMovementSave(before, after, 3, 0)).toEqual({ kind: "SILENT" });
    // Durée retirée (`null`) : même décision.
    const cleared = movementContentOf(
      movement({ phases: [{ id: 1, label: "Descente", durationSeconds: null }, { id: 2, label: "Pause" }, { id: 3, label: "Montée", durationSeconds: 2 }] }),
    );
    expect(decideMovementSave(before, cleared, 3, 0)).toEqual({ kind: "SILENT" });
  });

  it("phases sans durée renseignée (structure reconstruite depuis un Exercice) : aucune modification (`NONE`)", () => {
    const after = movementContentOf(
      movement({ phases: [{ id: 1, label: "Descente" }, { id: 2, label: "Pause" }, { id: 3, label: "Montée" }] }),
    );
    expect(onlyPhaseDurationsChanged(before, after)).toBe(false);
    expect(decideMovementSave(before, after, 3, 0)).toEqual({ kind: "NONE" });
  });

  it("contenu partagé modifié en plus des durées : table C03 inchangée (CONFIRM avec d'autres Exercices, CHOICE sur le nom)", () => {
    const relabeled = movementContentOf(
      movement({ phases: [{ id: 1, label: "Flexion", durationSeconds: 4 }, { id: 2, label: "Pause" }, { id: 3, label: "Montée", durationSeconds: 2 }] }),
    );
    expect(decideMovementSave(before, relabeled, 2, 0)).toEqual({ kind: "CONFIRM", otherCount: 2 });
    expect(decideMovementSave(before, { ...before, name: "Squat lent" }, 0, 0)).toEqual({ kind: "CHOICE", otherCount: 0 });
  });
});

/**
 * Réponse de Hermann du 31/10/2026 (changement de niveau) : « les durées par défaut de toutes les phases
 * sont reprises ». Lecture appliquée : toute phase du mouvement choisi qui porte une durée par défaut la
 * reçoit (remplace la durée locale du même rang) ; sans durée par défaut, règle R-6 inchangée (durée
 * locale du même rang, sinon vide).
 */
describe("PRE-9 A.2b — changement de niveau : durées par défaut du mouvement choisi reprises", () => {
  const local = uniformParameters({
    mode: "DURATION",
    target: 100,
    workPhases: [
      { id: 7, label: "A", durationSeconds: 40 },
      { id: 8, label: "B", durationSeconds: 50 },
    ],
  });

  it("toutes les phases du mouvement choisi ont une durée par défaut : elles remplacent toutes les durées locales", () => {
    const next = transferParametersByRank(local, movement().phases.map((phase) => ({ ...phase, durationSeconds: 5 })));
    expect(next.series.workPhases).toEqual([
      { id: 1, label: "Descente", durationSeconds: 5 },
      { id: 2, label: "Pause", durationSeconds: 5 },
      { id: 3, label: "Montée", durationSeconds: 5 },
    ]);
  });

  it("certaines phases seulement : défaut repris là où il existe ; ailleurs, durée locale du même rang, sinon vide", () => {
    // Mouvement : Descente 3 s, Pause sans défaut, Montée 2 s ; local : rangs 1 et 2 (40, 50).
    const next = transferParametersByRank(local, movement().phases);
    expect(next.series.workPhases).toEqual([
      { id: 1, label: "Descente", durationSeconds: 3 },
      { id: 2, label: "Pause", durationSeconds: 50 },
      { id: 3, label: "Montée", durationSeconds: 2 },
    ]);
    // Sans phase locale (sans → phases) : défauts repris, vide ailleurs.
    const without = uniformParameters({ mode: "DURATION", target: 100 });
    expect(transferParametersByRank(without, movement().phases).series.workPhases.map((phase) => phase.durationSeconds)).toEqual([3, 0, 2]);
    // Mouvement choisi sans aucun défaut : règle R-6 inchangée.
    const plain = movement().phases.map(({ id, label }) => ({ id, label }));
    expect(transferParametersByRank(local, plain).series.workPhases.map((phase) => phase.durationSeconds)).toEqual([40, 50, 0]);
  });

  it("occurrence de Séance (withOccurrenceMovement) : même transfert, reste de l'occurrence conservé", () => {
    const occurrence = { ...createExerciseDraft("occ-1", 20), executionParameters: local, sourceMovementId: "mv-0" };
    const next = withOccurrenceMovement(occurrence, movement());
    expect(next.sourceMovementId).toBe("mv-1");
    expect(next.executionParameters.series.workPhases.map((phase) => phase.durationSeconds)).toEqual([3, 50, 2]);
    expect(next.postActivityRecoverySeconds).toBe(20);
  });
});
