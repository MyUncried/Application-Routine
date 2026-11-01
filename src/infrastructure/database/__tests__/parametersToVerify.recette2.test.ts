import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { serializeCatalogExecutionParameters, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { splitResolvedParameters, type Movement } from "@/domain/activities/Movement";
import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { structureExercises } from "@/domain/sessions/structure";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, constat e (classe B). Hermann : « modifier un
 * mouvement : Ajouter une valeur par défaut doit mettre à jour les exercices qui utilisent cet
 * exercice, mais que les champs (et l'ensemble de la ligne de couleur) soient identifiés en orange,
 * avec le texte « Paramètre à vérifier » […] ». Réponses du 31/10 : « Champs vides seulement »,
 * « Ouverture de la feuille », « Séances et Catalogue ». SQLite réelle en mémoire (`migration019`).
 */

const NOW = "2026-10-31T09:00:00.000Z";
const CREATED = "2026-10-30T08:00:00.000Z";
let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);
const sessions = () => new SqliteSessionRepository(database, ids("ses"), () => NOW);
const definitions = () => new SqliteActivityDefinitionRepository(database, ids("def"), () => NOW);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const squat = (phases: Movement["phases"]): Movement => ({
  id: "mv-squat",
  name: "Squat",
  description: null,
  media: [],
  categoryId: "renforcement",
  bodyZoneIds: ["cuisses"],
  phases,
  nextPhaseId: 4,
  aliases: [],
  levelGroup: null,
});

const STRUCTURE = [
  { id: 1, label: "Descente" },
  { id: 2, label: "Pause" },
  { id: 3, label: "Montée" },
] as const;

/** Paramètres d'Exercice aux durées de phase données (0 = vide, « à compléter »). */
function withPhaseDurations(durations: readonly number[]): ExecutionParameters {
  const base = durationParameters(30);
  return {
    ...base,
    series: {
      ...base.series,
      workPhases: STRUCTURE.map((phase, index) => ({ ...phase, durationSeconds: durations[index] ?? 0 })),
    },
  } as ExecutionParameters;
}

/** Mouvement Squat (Descente 3 s, Pause sans durée, Montée 2 s), une Séance et un Exercice du Catalogue. */
async function seed(occurrenceDurations: readonly number[], definitionDurations: readonly number[]) {
  await movements().create(
    squat([
      { id: 1, label: "Descente", durationSeconds: 3 },
      { id: 2, label: "Pause" },
      { id: 3, label: "Montée", durationSeconds: 2 },
    ]),
  );
  const session = await sessions().create({
    name: "Jambes",
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    tourRepeatCount: 1,
    exercises: [
      {
        type: "EXERCISE",
        structuralPosition: "IN_TOUR",
        // Une Séance ne s'enregistre qu'avec des durées renseignées (D-389) : une durée vide d'occurrence
        // naît d'une phase ajoutée au Mouvement après coup ; simulée ici par la forme Catalogue (`null`).
        executionParameters: withPhaseDurations(occurrenceDurations.map((seconds) => (seconds === 0 ? 1 : seconds))),
        postActivityRecoverySeconds: 0,
        sourceMovementId: "mv-squat",
      },
    ],
  });
  await database.runAsync("UPDATE activities SET execution_parameters = ?", [
    serializeCatalogExecutionParameters(splitResolvedParameters(withPhaseDurations(occurrenceDurations)).parameters),
  ]);
  await database.runAsync(
    "INSERT INTO activity_definitions (id, movement_id, execution_parameters, created_at, updated_at) VALUES ('def-1', 'mv-squat', ?, ?, ?)",
    [serializeCatalogExecutionParameters(splitResolvedParameters(withPhaseDurations(definitionDurations)).parameters), CREATED, CREATED],
  );
  return session;
}

async function occurrenceOf(sessionId: string) {
  const session = await sessions().findStructuredById(sessionId);
  return structureExercises(session!.structure)[0]!;
}

const durationsOf = (parameters: ExecutionParameters) => parameters.series.workPhases.map((phase) => phase.durationSeconds);

describe("PRE-9 recette n° 2, constat e — valeur par défaut ajoutée au Mouvement", () => {
  it("Séances et Catalogue : seules les durées VIDES reçoivent la valeur ajoutée, marquées « à vérifier » ; une durée renseignée n'est jamais remplacée ; une valeur inchangée ne propage rien", async () => {
    // Occurrence : Descente 6 (locale), Pause vide, Montée 2. Exercice du Catalogue : tout vide.
    const session = await seed([6, 0, 2], [0, 0, 0]);
    const before = await database.getAllAsync<{ updated_at: string }>("SELECT updated_at FROM activity_definitions");

    // Hermann ajoute 4 s à la Pause et change la Descente (3 → 5) ; Montée inchangée (2).
    await movements().update(
      squat([
        { id: 1, label: "Descente", durationSeconds: 5 },
        { id: 2, label: "Pause", durationSeconds: 4 },
        { id: 3, label: "Montée", durationSeconds: 2 },
      ]),
    );

    const occurrence = await occurrenceOf(session.id);
    expect(durationsOf(occurrence.executionParameters)).toEqual([6, 4, 2]);
    expect(occurrence.phasesToVerify).toEqual([2]);

    const definition = (await definitions().findById("def-1"))!;
    // Descente et Pause reçoivent les valeurs ajoutées ; Montée (valeur inchangée) reste à compléter.
    expect(durationsOf(definition.executionParameters)).toEqual([5, 4, 0]);
    expect(definition.phasesToVerify).toEqual([1, 2]);
    expect(definition.missingPhaseIds).toEqual([3]);
    // La reprise ne réordonne pas le Catalogue (`updated_at` inchangé).
    expect(await database.getAllAsync("SELECT updated_at FROM activity_definitions")).toEqual(before);
  });

  it("contre-recette n° 3 (cr4-verifier) : le Catalogue des Séances lit la marque — carte « à vérifier » tant qu'un Exercice est marqué, normale après l'ouverture de sa feuille", async () => {
    const session = await seed([6, 0, 2], [0, 0, 0]);
    await movements().update(
      squat([
        { id: 1, label: "Descente", durationSeconds: 3 },
        { id: 2, label: "Pause", durationSeconds: 4 },
        { id: 3, label: "Montée", durationSeconds: 2 },
      ]),
    );
    const catalogueProjection = async () => {
      const record = (await sessions().listCatalogue()).find((candidate) => candidate.id === session.id)!;
      return projectSessionForCatalogue(record, new Map());
    };
    const marked = await catalogueProjection();
    expect(marked.incomplete).toBe(false);
    expect(marked.toVerify).toBe(true);

    await sessions().acknowledgeParametersToVerify((await occurrenceOf(session.id)).id);
    expect((await catalogueProjection()).toVerify).toBe(false);
  });

  it("« Ouverture de la feuille » : la marque est retirée, rien d'autre n'est écrit ; une nouvelle valeur ajoutée s'ajoute à la marque", async () => {
    const session = await seed([0, 0, 2], [0, 0, 0]);
    await movements().update(
      squat([
        { id: 1, label: "Descente", durationSeconds: 3 },
        { id: 2, label: "Pause", durationSeconds: 4 },
        { id: 3, label: "Montée", durationSeconds: 2 },
      ]),
    );
    const occurrenceId = (await occurrenceOf(session.id)).id;
    expect((await occurrenceOf(session.id)).phasesToVerify).toEqual([2]);
    const parametersBefore = await database.getAllAsync("SELECT execution_parameters FROM activities");

    await sessions().acknowledgeParametersToVerify(occurrenceId);
    await definitions().acknowledgeParametersToVerify("def-1");
    expect((await occurrenceOf(session.id)).phasesToVerify).toBeUndefined();
    expect((await definitions().findById("def-1"))!.phasesToVerify).toBeUndefined();
    expect(await database.getAllAsync("SELECT execution_parameters FROM activities")).toEqual(parametersBefore);

    // Descente encore vide dans l'occurrence : une valeur changée (3 → 8) la remplit et la marque.
    await movements().update(
      squat([
        { id: 1, label: "Descente", durationSeconds: 8 },
        { id: 2, label: "Pause", durationSeconds: 4 },
        { id: 3, label: "Montée", durationSeconds: 2 },
      ]),
    );
    const occurrence = await occurrenceOf(session.id);
    expect(durationsOf(occurrence.executionParameters)).toEqual([8, 4, 2]);
    expect(occurrence.phasesToVerify).toEqual([1]);
  });

  it("valeur retirée (`null`) ou structure reconstruite sans durées : aucune propagation ; motif hors bornes : Exercice inchangé, sans erreur", async () => {
    const session = await seed([0, 0, 2], [0, 0, 0]);
    const activitiesBefore = await database.getAllAsync("SELECT execution_parameters, phases_to_verify FROM activities");
    await movements().update(
      squat([
        { id: 1, label: "Descente", durationSeconds: null },
        { id: 2, label: "Pause" },
        { id: 3, label: "Montée", durationSeconds: 2 },
      ]),
    );
    expect(await database.getAllAsync("SELECT execution_parameters, phases_to_verify FROM activities")).toEqual(activitiesBefore);

    // 3000 + 600 + 2 > 3535 s (D-430) : l'Exercice reste à compléter, l'enregistrement aboutit.
    await movements().update(
      squat([
        { id: 1, label: "Descente", durationSeconds: 3000 },
        { id: 2, label: "Pause", durationSeconds: 600 },
        { id: 3, label: "Montée", durationSeconds: 2 },
      ]),
    );
    const occurrence = await occurrenceOf(session.id);
    expect(durationsOf(occurrence.executionParameters)).toEqual([0, 0, 2]);
    expect(occurrence.phasesToVerify).toBeUndefined();
    expect((await movements().findById("mv-squat"))!.phases[0]).toEqual({ id: 1, label: "Descente", durationSeconds: 3000 });
  });

  it("phase ajoutée au Mouvement (vide dans les Exercices), puis sa valeur par défaut : l'Exercice la reçoit, marquée", async () => {
    const session = await seed([6, 1, 2], [6, 1, 2]);
    const fourPhases = (repos: number | undefined): Movement => ({
      ...squat([
        { id: 1, label: "Descente", durationSeconds: 3 },
        { id: 2, label: "Pause" },
        { id: 3, label: "Montée", durationSeconds: 2 },
        repos === undefined ? { id: 4, label: "Repos" } : { id: 4, label: "Repos", durationSeconds: repos },
      ]),
      nextPhaseId: 5,
    });
    await movements().update(fourPhases(undefined));
    expect(durationsOf((await occurrenceOf(session.id)).executionParameters)).toEqual([6, 1, 2, 0]);
    await movements().update(fourPhases(5));
    const occurrence = await occurrenceOf(session.id);
    expect(durationsOf(occurrence.executionParameters)).toEqual([6, 1, 2, 5]);
    expect(occurrence.phasesToVerify).toEqual([4]);
    expect((await definitions().findById("def-1"))!.phasesToVerify).toEqual([4]);
  });

  it("marque illisible : ignorée, l'Exercice reste lisible", async () => {
    const session = await seed([0, 0, 2], [0, 0, 0]);
    await database.runAsync("UPDATE activities SET phases_to_verify = 'oups'");
    await database.runAsync("UPDATE activity_definitions SET phases_to_verify = '[0]'");
    expect((await occurrenceOf(session.id)).phasesToVerify).toBeUndefined();
    expect((await definitions().findById("def-1"))!.phasesToVerify).toBeUndefined();
  });
});
