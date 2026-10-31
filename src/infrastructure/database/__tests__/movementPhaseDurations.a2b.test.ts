import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { repriseExecutionParameters, type Movement } from "@/domain/activities/Movement";
import { createEmptyExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 A.2b — persistance des durées par défaut des phases du Mouvement (`migration018`,
 * `movement_phases.duration_seconds`). Décisions de Hermann : 30/10/2026 (« les durées de la phase
 * peuvent faire partie du mouvement […] peuvent être changées dans la séance ») ; 31/10/2026
 * (Exercices existants « Inchangés » après une modification du Mouvement). SQLite réelle en mémoire.
 */

const NOW = "2026-10-31T09:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const sessions = () => new SqliteSessionRepository(database, ids("ses"), () => NOW);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const squat = (overrides: Partial<Movement> = {}): Movement => ({
  id: "mv-squat",
  name: "Squat",
  description: null,
  media: [],
  categoryId: "renforcement",
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
});

const storedPhases = () =>
  database.getAllAsync("SELECT phase_id, position, label, duration_seconds FROM movement_phases ORDER BY position");

describe("PRE-9 A.2b — dépôt du Mouvement : durées des phases", () => {
  it("aller-retour : durées écrites, relues par identité ; phase sans durée relue sans `durationSeconds`", async () => {
    const created = await movements().create(squat());
    expect(created.phases).toStrictEqual(squat().phases);
    expect(await storedPhases()).toEqual([
      { phase_id: 1, position: 0, label: "Descente", duration_seconds: 3 },
      { phase_id: 2, position: 1, label: "Pause", duration_seconds: null },
      { phase_id: 3, position: 2, label: "Montée", duration_seconds: 2 },
    ]);
    expect((await movements().findById("mv-squat"))!.phases).toStrictEqual(squat().phases);
  });

  it("mise à jour : durée absente → conservée par identité (déplacement, renommage) ; `null` → retirée ; nombre → remplacée ; phase retirée → perdue ; phase nouvelle → aucune", async () => {
    await movements().create(squat());
    await movements().update(
      squat({
        phases: [
          { id: 3, label: "Remontée" },
          { id: 1, label: "Descente", durationSeconds: null },
          { id: 4, label: "Repos" },
        ],
        nextPhaseId: 5,
      }),
    );
    expect(await storedPhases()).toEqual([
      { phase_id: 3, position: 0, label: "Remontée", duration_seconds: 2 },
      { phase_id: 1, position: 1, label: "Descente", duration_seconds: null },
      { phase_id: 4, position: 2, label: "Repos", duration_seconds: null },
    ]);
    await movements().update(squat({ phases: [{ id: 3, label: "Remontée", durationSeconds: 10 }], nextPhaseId: 5 }));
    expect(await storedPhases()).toEqual([{ phase_id: 3, position: 0, label: "Remontée", duration_seconds: 10 }]);
  });

  it("une durée hors bornes est refusée avant écriture (validation du domaine) ; rien n'est écrit", async () => {
    await expect(movements().create(squat({ phases: [{ id: 1, label: "a", durationSeconds: 3536 }], nextPhaseId: 2 }))).rejects.toThrow(
      /movement\.phases/,
    );
    expect(await database.getAllAsync("SELECT id FROM movements")).toEqual([]);
  });
});

describe("PRE-9 A.2b — Séance : l'Exercice et le Mouvement sont indépendants après la création", () => {
  it("nouvel Exercice : durées du Mouvement reprises (vides où il n'en a pas) ; modifier ensuite le Mouvement laisse l'Exercice inchangé ; enregistrer l'Exercice modifié laisse le Mouvement inchangé", async () => {
    const movement = await movements().create(squat());
    // Nouvel Exercice depuis le Mouvement (même construction que la Composition, `exerciseOfMovement`).
    const reprise = repriseExecutionParameters(movement, createEmptyExecutionParameters({ countdownSeconds: 10, endSeconds: 5 }));
    expect(reprise.series.workPhases.map((phase) => phase.durationSeconds)).toEqual([3, 0, 2]);

    // Exercice complété dans la Séance (Pause renseignée à 4, Descente changée à 6), puis enregistré.
    const local = durationParameters(30);
    const exerciseParameters = {
      ...local,
      series: {
        ...local.series,
        workPhases: [
          { id: 1, label: "Descente", durationSeconds: 6 },
          { id: 2, label: "Pause", durationSeconds: 4 },
          { id: 3, label: "Montée", durationSeconds: 2 },
        ],
      },
    } as typeof local;
    const session = await sessions().create({
      name: "Jambes",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [
        { type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: exerciseParameters, postActivityRecoverySeconds: 0, sourceMovementId: "mv-squat" },
      ],
    });
    // L'Exercice modifié dans la Séance n'a pas touché le Mouvement.
    expect((await movements().findById("mv-squat"))!.phases).toStrictEqual(squat().phases);

    const exerciseRow = await database.getAllAsync("SELECT id, execution_parameters FROM activities");
    // Modification ultérieure du Mouvement (durées) : l'Exercice existant est « Inchangé » (Hermann, 31/10).
    await movements().update(
      squat({ phases: [{ id: 1, label: "Descente", durationSeconds: 20 }, { id: 2, label: "Pause", durationSeconds: 20 }, { id: 3, label: "Montée", durationSeconds: 20 }] }),
    );
    expect(await database.getAllAsync("SELECT id, execution_parameters FROM activities")).toEqual(exerciseRow);
    const [row] = await database.getAllAsync<{ execution_parameters: string }>("SELECT execution_parameters FROM activities WHERE session_id = ?", [
      session.id,
    ]);
    const stored = JSON.parse(row!.execution_parameters) as { series: { phaseDurations: { phaseId: number; durationSeconds: number }[] } };
    expect(stored.series.phaseDurations).toEqual([
      { phaseId: 1, durationSeconds: 6 },
      { phaseId: 2, durationSeconds: 4 },
      { phaseId: 3, durationSeconds: 2 },
    ]);
  });

  it("Mouvement corrigé depuis la Séance (`EDITED`, structure reconstruite depuis l'Exercice, sans durées) : les durées du Mouvement sont conservées", async () => {
    await movements().create(squat());
    await sessions().create({
      name: "Jambes",
      initialCountdownSeconds: 10,
      finalPhaseSeconds: 5,
      tourRepeatCount: 1,
      exercises: [
        { type: "EXERCISE", structuralPosition: "IN_TOUR", executionParameters: durationParameters(30), postActivityRecoverySeconds: 0, sourceMovementId: "mv-squat" },
      ],
      movements: [
        {
          id: "mv-squat",
          change: "EDITED",
          name: "Squat",
          description: "Dos droit",
          categoryId: "renforcement",
          bodyZoneIds: ["cuisses"],
          media: [],
          phases: [
            { id: 1, label: "Flexion" },
            { id: 2, label: "Pause" },
            { id: 3, label: "Montée" },
          ],
          nextPhaseId: 4,
          aliases: [],
        },
      ],
    });
    const saved = (await movements().findById("mv-squat"))!;
    expect(saved.description).toBe("Dos droit");
    expect(saved.phases).toStrictEqual([
      { id: 1, label: "Flexion", durationSeconds: 3 },
      { id: 2, label: "Pause" },
      { id: 3, label: "Montée", durationSeconds: 2 },
    ]);
  });
});
