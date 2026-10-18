import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  activityDefinitionToInput,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import { serializeV2, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { commitSheetDraft, openSheetDraft, setSeriesCount } from "@/domain/activities/ExecutionParametersDraft";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import { createExerciseSnapshot, parseExerciseSnapshot, serializeExerciseSnapshot } from "@/domain/activities/exerciseSnapshot";
import { variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { moveDraftMedia, toDraftMediaItems, type DraftMediaItem } from "@/domain/media/ActivityMedia";
import {
  ActivityMediaImportService,
  readyMedia,
  type MediaCopyPort,
  type MediaPickerPort,
  type PickedMedia,
  type PickOutcome,
} from "@/domain/media/ActivityMediaImportService";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import { duplicateActivity } from "@/domain/sessions/composition";
import { SessionValidationError } from "@/domain/sessions/errors";
import type { Session } from "@/domain/sessions/Session";
import {
  createEmptyDraft,
  toCreateSessionInput,
  toSessionDraft,
  toUpdateSessionInput,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import type { Database } from "@/infrastructure/database/Database";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { buildVersion9 } from "@/infrastructure/database/testing/buildVersion9";
import { failOnWrite } from "@/infrastructure/database/testing/failOnWrite";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";

/** Fichiers `.ts`/`.tsx` d'un répertoire (hors `node_modules`). */
function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "node_modules") {
        files.push(...sourceFiles(path));
      }
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

/**
 * PRE-4 story 1.3 — copies, duplications et Instantanés à Cibles typées, sur
 * SQLite RÉELLE (`node:sqlite`, AD-10). Les fichiers de Médias sont simulés
 * par un magasin de test qui tient l'ensemble des fichiers présents et
 * compte les suppressions (seul point de suppression du code :
 * `MediaCopyPort.deletePrepared`, appelé par l'abandon confirmé).
 *
 * Sans objet, consignés dans la story : AC6 (aucune duplication de Séance ni
 * d'Exercice au Catalogue dans le code de départ, P36) et AC8 (aucune
 * suppression ni archivage de Définition exposé ; seul cas de disparition
 * d'une source : l'écart par `migration010`, couvert en 1.1 AC12).
 */

/** Magasin de fichiers simulé : présence des fichiers et suppressions comptées. */
class CountingStore implements MediaCopyPort {
  readonly files = new Set<string>();
  readonly deleted: string[] = [];
  readonly failures = new Set<string>();
  copies = 0;
  async copyToInternal(source: PickedMedia, assetId: string) {
    if (this.failures.has(source.uri)) {
      throw new Error("copy failed");
    }
    this.copies += 1;
    const uri = `kodjo-media/${assetId}`;
    this.files.add(uri);
    return { uri, sizeBytes: source.sizeBytes };
  }
  availableBytes() {
    return null;
  }
  async deletePrepared(uri: string) {
    this.deleted.push(uri);
    this.files.delete(uri);
  }
}

class ScriptedPicker implements MediaPickerPort {
  constructor(public outcome: PickOutcome) {}
  async pickFromLibrary() {
    return this.outcome;
  }
}

function picked(name: string): PickedMedia {
  return {
    uri: `file:///cache/${name}`,
    kind: "PHOTO",
    mimeType: "image/jpeg",
    fileName: name,
    sizeBytes: 10,
    durationMs: null,
    width: 10,
    height: 10,
    nativeAssetId: null,
  };
}

/** Ancien Exercice dont la Cible est restée à renseigner après migration (forme v2 écrite par 010). */
async function forceParameters(database: Database, definitionId: string, parameters: ExecutionParameters) {
  await database.runAsync("UPDATE activity_definitions SET execution_parameters = ? WHERE id = ?", [serializeV2(parameters), definitionId]);
}

describe("PRE-4 story 1.3 — copies, duplications, Instantanés et Médias (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;
  let store: CountingStore;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    store = new CountingStore();
  });

  afterEach(() => {
    database.close();
  });

  /** Média « importé » : le fichier existe dans le magasin, son asset sera écrit avec la Définition. */
  function importedAsset(id: string, kind: "PHOTO" | "VIDEO" = "PHOTO"): MediaAsset {
    const uri = `kodjo-media/${id}`;
    store.files.add(uri);
    return {
      id,
      uri,
      createdAt: "2026-10-16T10:00:00.000Z",
      kind,
      mimeType: kind === "PHOTO" ? "image/jpeg" : "video/mp4",
      fileName: null,
      sizeBytes: 10,
      durationMs: kind === "VIDEO" ? 1000 : null,
      width: null,
      height: null,
    };
  }

  /** AC1 : Durée, Régime variables, `[NUMBER 30, NUMBER 45, FAILURE]`, Pauses 10 s × 3, Bip 0, côtés D→G par série, PC 5, CR 3, Fin 4. */
  const ac1Parameters = (): ExecutionParameters =>
    variableParameters({
      mode: "DURATION",
      rows: [
        [30, 10],
        [45, 10],
        ["FAILURE", 10],
      ],
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SERIES",
      sideRecoverySeconds: 5,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 3,
      endSeconds: 4,
    });

  function definitionInput(parameters: ExecutionParameters, media: readonly MediaAsset[]): CreateActivityDefinitionInput {
    return {
      name: "Fentes sautées",
      description: "Buste droit",
      category: { kind: "EXISTING", categoryId: "cardio" },
      bodyZoneIds: ["cuisses", "jambes"],
      executionParameters: parameters,
      media: media.map((asset) => ({ assetId: asset.id, asset })),
    };
  }

  /** Même chemin que l'application : validation du Domaine puis Repository. */
  async function saveDefinition(input: CreateActivityDefinitionInput): Promise<ActivityDefinition> {
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      throw new Error(JSON.stringify(validated.violations));
    }
    return new SqliteActivityDefinitionRepository(database, ids("def")).create(validated.value);
  }

  async function updateDefinition(id: string, input: CreateActivityDefinitionInput): Promise<ActivityDefinition> {
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      throw new Error(JSON.stringify(validated.violations));
    }
    const updated = await new SqliteActivityDefinitionRepository(database, ids("def")).update(id, validated.value);
    if (!updated) {
      throw new Error("definition not found");
    }
    return updated;
  }

  /** Continuer : brouillon de Composition → Séance persistée. */
  async function continueNew(exercises: readonly SessionDraftExercise[]): Promise<Session> {
    const draft: SessionDraft = { ...createEmptyDraft(), name: "Jambes", exercises };
    const input = toCreateSessionInput(draft);
    if (!input.ok) {
      throw new Error(JSON.stringify(input.violations));
    }
    const created = await new SqliteSessionRepository(database, ids("ses")).create(input.value);
    return (await new SqliteSessionRepository(database, ids("ses")).findById(created.id))!;
  }

  async function continueEdit(session: Session, mutate: (draft: SessionDraft) => SessionDraft): Promise<Session> {
    const input = toUpdateSessionInput(mutate(toSessionDraft(session)));
    if (!input.ok) {
      throw new Error(JSON.stringify(input.violations));
    }
    const outcome = await new SqliteSessionRepository(database, ids("ses")).update(session.id, input.value);
    if (outcome.status !== "UPDATED") {
      throw new Error(outcome.status);
    }
    return (await new SqliteSessionRepository(database, ids("ses")).findById(session.id))!;
  }

  async function readDefinition(id: string): Promise<ActivityDefinition> {
    return (await new SqliteActivityDefinitionRepository(database, ids("def")).findById(id))!;
  }

  async function dump(): Promise<Record<string, unknown[]>> {
    const result: Record<string, unknown[]> = {};
    for (const table of [
      "activity_definitions",
      "activity_definition_body_zones",
      "activity_media",
      "media_assets",
      "sessions",
      "activities",
      "session_activity_media",
      "categories",
    ]) {
      result[table] = await database.getAllAsync(`SELECT * FROM ${table} ORDER BY rowid`);
    }
    return result;
  }

  /** Activités dans l'ordre affiché (avant, dans, après le Circuit) : une copie entre avant le Circuit. */
  const exercisesOf = (session: Session) => [
    ...(session.cycle.beforeTour ?? []),
    ...session.cycle.tour.exercises,
    ...(session.cycle.afterTour ?? []),
  ];

  async function ac1Definition(): Promise<ActivityDefinition> {
    return saveDefinition(definitionInput(ac1Parameters(), [importedAsset("v1", "VIDEO"), importedAsset("p1"), importedAsset("p2")]));
  }

  it("PRE4-1.3/AC1 — copie Catalogue → Séance complète, relue après Continuer ; Récupération 0 ; la Définition ne porte ni position ni Récupération", async () => {
    const definition = await readDefinition((await ac1Definition()).id);
    const session = await continueNew([activityDefinitionToDraftExercise(definition, "occ-1", 0)]);
    const copy = exercisesOf(session)[0]!;

    expect(copy.name).toBe("Fentes sautées");
    expect(copy.instruction).toBe("Buste droit");
    expect(copy.categoryId).toBe("cardio");
    expect([...copy.bodyZoneIds].sort()).toEqual(["cuisses", "jambes"]);
    expect(copy.media?.map((item) => [item.position, item.assetId, item.asset.uri])).toEqual([
      [0, "v1", "kodjo-media/v1"],
      [1, "p1", "kodjo-media/p1"],
      [2, "p2", "kodjo-media/p2"],
    ]);
    // Égalité champ par champ, types de Cible et ordre compris.
    expect(copy.executionParameters).toEqual(ac1Parameters());
    expect(copy.executionParameters).toEqual(definition.executionParameters);
    expect(copy.postActivityRecoverySeconds).toBe(0);

    const columns = (await database.getAllAsync<{ name: string }>("PRAGMA table_info(activity_definitions)")).map((column) => column.name);
    expect(columns).not.toContain("position");
    expect(columns.some((name) => /recovery/.test(name) && name !== "side_recovery_seconds")).toBe(false);
    expect(definition).not.toHaveProperty("structuralPosition");
    expect(definition).not.toHaveProperty("postActivityRecoverySeconds");
  });

  it("PRE4-1.3/AC2 — isolation dans les deux sens : modifier la Définition ne touche pas les copies ; modifier une copie ne touche ni la Définition ni l'autre copie", async () => {
    const definition = await readDefinition((await ac1Definition()).id);
    const session = await continueNew([
      activityDefinitionToDraftExercise(definition, "occ-1", 0),
      activityDefinitionToDraftExercise(definition, "occ-2", 0),
    ]);

    // Définition modifiée : Cible, Pause, ordre des côtés.
    const editedDefinition = variableParameters({
      mode: "DURATION",
      rows: [
        [35, 15],
        [45, 10],
        ["FAILURE", 10],
      ],
      sideMode: "RIGHT_LEFT",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 5,
      countdownSeconds: 3,
      endSeconds: 4,
    });
    await updateDefinition(definition.id, { ...activityDefinitionToInput(definition), executionParameters: editedDefinition });
    const reread = (await new SqliteSessionRepository(database, ids("ses")).findById(session.id))!;
    expect(exercisesOf(reread).map((copy) => copy.executionParameters)).toEqual([ac1Parameters(), ac1Parameters()]);

    // Copie modifiée : Cible de la ligne 1, ordre des lignes, retrait d'un Média ; Terminer puis Continuer.
    const definitionBefore = await dump();
    const edited = await continueEdit(reread, (draft) => ({
      ...draft,
      exercises: draft.exercises.map((exercise) => {
        if (exercise.id !== "occ-1") {
          return exercise;
        }
        const rows = [
          { target: { kind: "NUMBER" as const, value: 40 }, pauseSeconds: 10 },
          { target: { kind: "FAILURE" as const }, pauseSeconds: 10 },
          { target: { kind: "NUMBER" as const, value: 45 }, pauseSeconds: 10 },
        ];
        return {
          ...exercise,
          executionParameters: { ...exercise.executionParameters, series: { kind: "VARIABLE", rows } },
          media: exercise.media?.filter((item) => item.assetId !== "p1"),
        };
      }),
    }));
    const [first, second] = exercisesOf(edited);
    expect(first!.executionParameters.series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: { kind: "NUMBER", value: 40 }, pauseSeconds: 10 },
        { target: { kind: "FAILURE" }, pauseSeconds: 10 },
        { target: { kind: "NUMBER", value: 45 }, pauseSeconds: 10 },
      ],
    });
    expect(first!.media?.map((item) => item.assetId)).toEqual(["v1", "p2"]);
    expect(second!.executionParameters).toEqual(ac1Parameters());
    expect(second!.media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);
    const after = await dump();
    for (const table of ["activity_definitions", "activity_definition_body_zones", "activity_media", "media_assets"]) {
      expect(after[table]).toEqual(definitionBefore[table]);
    }
    expect((await readDefinition(definition.id)).executionParameters).toEqual(editedDefinition);
  });

  it("PRE4-1.3/AC4 — Définition à Cible héritée UNSET : la Copie entre au brouillon UNSET ; Continuer refuse, base inchangée", async () => {
    const created = await saveDefinition(definitionInput(variableParameters({ mode: "REPETITIONS", rows: [[12, 10], [12, 10]] }), []));
    const inherited = variableParameters({ mode: "REPETITIONS", rows: [["UNSET", 10], [12, 10]] });
    await forceParameters(database, created.id, inherited);
    const definition = await readDefinition(created.id);
    expect(definition.executionParameters).toEqual(inherited);

    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    const draft: SessionDraft = { ...createEmptyDraft(), name: "Jambes", exercises: [copy] };
    expect(draft.exercises[0]!.executionParameters).toEqual(inherited);
    expect(JSON.stringify(draft.exercises[0]!.executionParameters)).not.toContain("FAILURE");

    const before = await dump();
    const continued = toCreateSessionInput(draft);
    expect(continued.ok).toBe(false);
    expect(!continued.ok && continued.violations).toEqual([{ code: "REQUIRED", field: "exercise.repetitionCount" }]);
    // Même forcée jusqu'au repository, l'écriture est refusée sans trace.
    const forced = await new SqliteSessionRepository(database, ids("ses"))
      .create({
        name: "Jambes",
        initialCountdownSeconds: 10,
        finalPhaseSeconds: 5,
        tourRepeatCount: 1,
        exercises: [
          {
            id: copy.id,
            type: "EXERCISE",
            structuralPosition: "IN_TOUR",
            name: copy.name,
            postActivityRecoverySeconds: 0,
            bodyZoneIds: copy.bodyZoneIds,
            executionParameters: copy.executionParameters,
            categoryId: copy.categoryId,
          },
        ],
      })
      .then(
        () => null,
        (error: unknown) => error,
      );
    // Violation STORAGE de la Cible à renseigner (Répétitions : `repetitionCount` requis), et rien d'autre.
    expect(forced).toBeInstanceOf(SessionValidationError);
    expect((forced as SessionValidationError).violations).toEqual([{ code: "REQUIRED", field: "exercise.repetitionCount" }]);
    expect(await dump()).toEqual(before);
  });

  it("PRE4-1.3/AC5 — duplication d'une Copie : nouvel identifiant juste après la source, tout égal, Catalogue inchangé, indépendance", async () => {
    const repetitions = () => variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10], ["FAILURE", 10]] });
    const definition = await readDefinition(
      (await saveDefinition(definitionInput(repetitions(), [importedAsset("v1", "VIDEO"), importedAsset("p1")]))).id,
    );
    const session = await continueNew([
      activityDefinitionToDraftExercise(definition, "occ-1", 40),
      activityDefinitionToDraftExercise(definition, "occ-2", 0),
    ]);
    const definitionsBefore = await database.getAllAsync("SELECT id FROM activity_definitions");
    const assetsBefore = await database.getAllAsync("SELECT * FROM media_assets ORDER BY id");

    const duplicated = await continueEdit(session, (draft) => ({ ...draft, exercises: duplicateActivity(draft.exercises, "occ-1", "occ-3") }));
    const [source, copy, other] = exercisesOf(duplicated);
    expect([source!.id, copy!.id, other!.id]).toEqual(["occ-1", "occ-3", "occ-2"]);
    expect(copy!.executionParameters).toEqual(repetitions());
    expect(copy!.postActivityRecoverySeconds).toBe(40);
    expect(copy!.categoryId).toBe("cardio");
    expect([...copy!.bodyZoneIds].sort()).toEqual([...source!.bodyZoneIds].sort());
    expect(copy!.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual(definitionsBefore);
    // Aucun fichier copié : mêmes assets, nouveaux liens seulement.
    expect(await database.getAllAsync("SELECT * FROM media_assets ORDER BY id")).toEqual(assetsBefore);
    expect(store.copies).toBe(0);

    // Modifier l'une ne modifie pas l'autre.
    const edited = await continueEdit(duplicated, (draft) => ({
      ...draft,
      exercises: draft.exercises.map((exercise) =>
        exercise.id === "occ-3"
          ? { ...exercise, executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[8, 10], [12, 10], ["FAILURE", 10]] }), media: [] }
          : exercise,
      ),
    }));
    expect(exercisesOf(edited)[0]!.executionParameters).toEqual(repetitions());
    expect(exercisesOf(edited)[0]!.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
  });

  it("PRE4-1.3/AC7 — N 2 → 3 depuis une ligne à l'échec : après Terminer et réouverture, la ligne ajoutée est FAILURE, Pause 20 s", async () => {
    const created = await saveDefinition(definitionInput(variableParameters({ mode: "REPETITIONS", rows: [[10, 10], ["FAILURE", 20]] }), []));
    const opened = await readDefinition(created.id);
    const committed = commitSheetDraft(setSeriesCount(openSheetDraft(opened.executionParameters), 3), opened.executionParameters);
    expect(committed.ok).toBe(true);
    await updateDefinition(created.id, { ...activityDefinitionToInput(opened), executionParameters: committed.ok ? committed.value : opened.executionParameters });
    expect((await readDefinition(created.id)).executionParameters.series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: { kind: "NUMBER", value: 10 }, pauseSeconds: 10 },
        { target: { kind: "FAILURE" }, pauseSeconds: 20 },
        { target: { kind: "FAILURE" }, pauseSeconds: 20 },
      ],
    });
  });

  it("PRE4-1.3/AC9 — aucun chemin de production n'écrit ni ne stocke d'Instantané (H11) : rien ne peut réécrire une enveloppe v1", () => {
    const root = join(__dirname, "..", "..", "..", "..");
    const production = [...sourceFiles(join(root, "src")), ...sourceFiles(join(root, "app"))]
      .map((path) => ({ path: relative(root, path).replace(/\\/g, "/"), code: readFileSync(path, "utf8") }))
      .filter((file) => !file.path.includes("/__tests__/") && !file.path.includes("/testing/"));
    // Seul le module de l'Instantané crée, sérialise ou relit une enveloppe.
    expect(
      production
        .filter((file) => /\b(createExerciseSnapshot|serializeExerciseSnapshot|parseExerciseSnapshot)\b/.test(file.code))
        .map((file) => file.path),
    ).toEqual(["src/domain/activities/exerciseSnapshot.ts"]);
    // Aucun repository, aucune migration, aucun SQL ne mentionne un Instantané.
    expect(production.filter((file) => file.path.startsWith("src/infrastructure/") && /snapshot/i.test(file.code)).map((file) => file.path)).toEqual([]);
  });

  it("PRE4-1.3/AC9 — enveloppes v1 prises sur une base v9 réelle : après migration010, relues selon leur version (Bip absent → 0, durée réalisée NULL ou 95), égales aux paramètres migrés de leur source", async () => {
    const v9 = NodeSqliteDatabase.openInMemory();
    try {
      await buildVersion9(v9);
      const v1Parameters = {
        version: 1,
        mode: "REPETITIONS",
        series: { kind: "UNIFORM", count: 3, target: 12, pauseSeconds: 10 },
        sideMode: "UNILATERAL",
        sideOrder: "BY_SIDE",
        sideRecoverySeconds: 0,
        cadenceBeepIntervalSeconds: 2,
        countdownSeconds: 3,
        endSeconds: 0,
      };
      await v9.runAsync(
        `INSERT INTO activity_definitions (
           id, name, description, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
           side_mode, created_at, updated_at, category_id, side_recovery_seconds, execution_parameters
         ) VALUES ('def-v9', 'Pompes', NULL, 'REPETITIONS', NULL, 12, 3, 10, 'UNILATERAL', '2026-01-02T00:00:00.000Z', '2026-01-03T00:00:00.000Z', 'cardio', 0, ?)`,
        [JSON.stringify(v1Parameters)],
      );
      // Enveloppes v1 prises en PRE-3 sur cette source (en mémoire, H11).
      const envelope = (parameters: Record<string, unknown>, actualDurationSeconds: number | null) =>
        JSON.stringify({ snapshotVersion: 1, name: "Pompes", categoryId: "cardio", bodyZoneIds: [], executionParameters: parameters, recoverySeconds: 0, media: [], actualDurationSeconds });
      const { cadenceBeepIntervalSeconds: _beep, ...withoutBeep } = v1Parameters;
      const timed = envelope(v1Parameters, 95);
      const untimed = envelope(withoutBeep, null);

      await migrateDatabase(v9);
      expect(await v9.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 10 });
      expect(await v9.getAllAsync("SELECT name FROM sqlite_master WHERE name LIKE '%snapshot%'")).toEqual([]);
      const migrated = (await new SqliteActivityDefinitionRepository(v9, ids("def")).findById("def-v9"))!;

      const rereadTimed = parseExerciseSnapshot(timed);
      expect(rereadTimed.snapshotVersion).toBe(1);
      expect(rereadTimed.executionParameters).toEqual(migrated.executionParameters);
      expect(rereadTimed.actualDurationSeconds).toBe(95);
      const rereadUntimed = parseExerciseSnapshot(untimed);
      expect(rereadUntimed.executionParameters).toEqual({ ...migrated.executionParameters, cadenceBeepIntervalSeconds: 0 });
      expect(rereadUntimed.actualDurationSeconds).toBeNull();

      // Modifier ensuite la source ne change pas la relecture (aucun recalcul depuis la source).
      await new SqliteActivityDefinitionRepository(v9, ids("def")).update("def-v9", {
        ...activityDefinitionToInput(migrated),
        executionParameters: { ...migrated.executionParameters, cadenceBeepIntervalSeconds: 7 },
      });
      expect(parseExerciseSnapshot(timed)).toEqual(rereadTimed);
    } finally {
      v9.close();
    }
  });

  it("PRE4-1.3/AC10 — Instantané d'une Copie relue : v2, Cibles typées et Médias ordonnés par référence ; une modification ultérieure de la Copie ne l'atteint pas", async () => {
    const parameters = variableParameters({
      mode: "DURATION",
      rows: [
        [30, 10],
        ["FAILURE", 10],
        [45, 10],
      ],
      sideMode: "RIGHT_LEFT",
      sideRecoverySeconds: 5,
      cadenceBeepIntervalSeconds: 2,
    });
    const definition = await readDefinition(
      (await saveDefinition(definitionInput(parameters, [importedAsset("v1", "VIDEO"), importedAsset("p1"), importedAsset("p2")]))).id,
    );
    const session = await continueNew([activityDefinitionToDraftExercise(definition, "occ-1", 0)]);
    const copy = exercisesOf(session)[0]!;
    const filesBefore = [...store.files];
    const snapshot = createExerciseSnapshot({
      name: copy.name,
      categoryId: copy.categoryId ?? null,
      bodyZoneIds: copy.bodyZoneIds,
      executionParameters: copy.executionParameters,
      recoverySeconds: copy.postActivityRecoverySeconds ?? 0,
      media: copy.media ?? [],
    });
    const json = serializeExerciseSnapshot(snapshot);
    const reread = parseExerciseSnapshot(json);
    expect(reread.snapshotVersion).toBe(2);
    expect(reread.executionParameters).toEqual(parameters);
    expect(reread.media.map((item) => [item.position, item.asset.id, item.asset.uri])).toEqual([
      [0, "v1", "kodjo-media/v1"],
      [1, "p1", "kodjo-media/p1"],
      [2, "p2", "kodjo-media/p2"],
    ]);
    expect([...store.files]).toEqual(filesBefore);
    expect(store.copies).toBe(0);

    await continueEdit(session, (draft) => ({
      ...draft,
      exercises: draft.exercises.map((exercise) => ({ ...exercise, executionParameters: { ...exercise.executionParameters, cadenceBeepIntervalSeconds: 5 }, media: [] })),
    }));
    expect(parseExerciseSnapshot(json)).toEqual(reread);
    expect(snapshot.executionParameters.cadenceBeepIntervalSeconds).toBe(2);
    expect(snapshot.media).toHaveLength(3);
  });

  it("PRE4-1.3/AC11 — Séance : Terminer n'écrit que dans le brouillon ; la Copie n'est écrite en base qu'au Continuer", async () => {
    const definition = await readDefinition((await ac1Definition()).id);
    const before = await dump();
    // Ajout, édition de la Copie et Terminer : uniquement des valeurs de brouillon.
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    const draft: SessionDraft = { ...createEmptyDraft(), name: "Jambes", exercises: [{ ...copy, name: "Fentes modifiées" }] };
    expect(toCreateSessionInput(draft).ok).toBe(true);
    expect(await dump()).toEqual(before);
    const session = await continueNew(draft.exercises);
    expect(exercisesOf(session).map((exercise) => exercise.name)).toEqual(["Fentes modifiées"]);
  });

  it("PRE4-1.3/AC12 — erreur d'écriture injectée à Terminer : base inchangée, nouvelle tentative réussie ; Définition supprimée : NOT_FOUND, jamais recréée", async () => {
    const definition = await readDefinition((await ac1Definition()).id);
    const before = await dump();
    // Échec au premier lien de Média, APRÈS la mise à jour de la Définition et de ses Zones dans la même transaction.
    const failing = failOnWrite(database, /INSERT INTO activity_media/);
    const service = new ActivityDefinitionService(new SqliteActivityDefinitionRepository(failing.database, ids("def")));
    const editInput = { ...activityDefinitionToInput(definition), name: "Fentes lentes" };
    await expect(service.updateActivityDefinition(definition.id, editInput)).rejects.toThrow("Injected failure");
    expect(failing.state.armed).toBe(false);
    expect(failing.state.writesBeforeFailure).toBeGreaterThanOrEqual(2);
    expect(await dump()).toEqual(before);
    const retried = await service.updateActivityDefinition(definition.id, editInput);
    expect(retried.status).toBe("UPDATED");
    expect((await readDefinition(definition.id)).name).toBe("Fentes lentes");

    await database.runAsync("DELETE FROM activity_definitions WHERE id = ?", [definition.id]);
    const missing = await service.updateActivityDefinition(definition.id, editInput);
    expect(missing.status).toBe("NOT_FOUND");
    expect(await database.getAllAsync("SELECT id FROM activity_definitions")).toEqual([]);
  });

  it("PRE4-1.3/AC13 — import, réordonnancement et Terminer : ordre et identité relus, aucun lien avant Terminer, références sans contenu, copies sans fichier supplémentaire", async () => {
    const definition = await readDefinition(
      (await saveDefinition(definitionInput(ac1Parameters(), [importedAsset("v1", "VIDEO"), importedAsset("p1"), importedAsset("p2")]))).id,
    );
    // Une copie de Séance faite avant le réordonnancement de l'Exercice.
    const session = await continueNew([activityDefinitionToDraftExercise(definition, "occ-1", 0)]);
    const copiesBeforeImport = store.copies;

    // Import d'un quatrième Média dans le brouillon de l'Éditeur, puis réordonnancement.
    const importService = new ActivityMediaImportService(new ScriptedPicker({ status: "PICKED", items: [picked("new.jpg")], limitedAccess: false }), store, () => "p3");
    const mediaDraftId = `definition:${definition.id}`;
    importService.leaseExisting(mediaDraftId, ["v1", "p1", "p2"]);
    const imported = await importService.importFromLibrary(mediaDraftId);
    let draftMedia: readonly DraftMediaItem[] = [
      ...toDraftMediaItems(definition.media ?? []),
      ...(imported.status === "IMPORTED" ? readyMedia(imported.items) : []),
    ];
    draftMedia = moveDraftMedia(draftMedia, 3, 0);
    draftMedia = moveDraftMedia(draftMedia, 2, 3);
    const displayed = draftMedia.map((item) => item.assetId);
    expect(displayed).toEqual(["p3", "v1", "p2", "p1"]);

    // Avant Terminer : aucun lien ni asset du Média ajouté.
    expect(await database.getAllAsync("SELECT id FROM activity_media WHERE asset_id = 'p3'")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM media_assets WHERE id = 'p3'")).toEqual([]);

    await updateDefinition(definition.id, {
      ...activityDefinitionToInput(definition),
      media: draftMedia.map((item) => ({ assetId: item.assetId, asset: item.asset })),
    });
    importService.commitDraft(mediaDraftId);
    const reread = await readDefinition(definition.id);
    expect(reread.media?.map((item) => item.assetId)).toEqual(displayed);
    expect(reread.media?.map((item) => item.asset.id)).toEqual(displayed);
    // Première vignette = premier Média relu (la vignette de carte n'est pas implémentée, D-264).
    expect(reread.media?.[0]?.assetId).toBe("p3");
    const positions = await database.getAllAsync<{ position: number }>(
      "SELECT position FROM activity_media WHERE activity_definition_id = ? ORDER BY position",
      [definition.id],
    );
    expect(positions.map((row) => row.position)).toEqual([0, 1, 2, 3]);

    // La base ne contient aucun contenu de fichier ; chaque référence pointe vers un fichier existant, inchangée.
    const assetColumns = await database.getAllAsync<{ type: string }>("PRAGMA table_info(media_assets)");
    expect(assetColumns.some((column) => /BLOB/i.test(column.type))).toBe(false);
    const uris = await database.getAllAsync<{ id: string; uri: string }>("SELECT id, uri FROM media_assets ORDER BY id");
    expect(uris).toEqual(["p1", "p2", "p3", "v1"].map((id) => ({ id, uri: `kodjo-media/${id}` })));
    expect(uris.every((row) => store.files.has(row.uri))).toBe(true);

    // Réordonner l'Exercice ne change pas l'ordre des Médias de sa copie.
    const copy = exercisesOf((await new SqliteSessionRepository(database, ids("ses")).findById(session.id))!)[0]!;
    expect(copy.media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);

    // Copie Catalogue → Séance et duplication : aucun fichier de plus, mêmes fichiers dans le même ordre.
    const fileCount = store.files.size;
    const second = await continueNew([activityDefinitionToDraftExercise(reread, "occ-9", 0)]);
    const duplicated = await continueEdit(second, (draft) => ({ ...draft, exercises: duplicateActivity(draft.exercises, "occ-9", "occ-10") }));
    expect(store.files.size).toBe(fileCount);
    expect(store.copies).toBe(copiesBeforeImport + 1);
    for (const exercise of exercisesOf(duplicated)) {
      expect(exercise.media?.map((item) => item.asset.uri)).toEqual(displayed.map((id) => `kodjo-media/${id}`));
    }
  });

  it("PRE4-1.3/AC14 — un fichier référencé par une Définition, une Copie, un Instantané seul ou une Séance archivée n'est jamais supprimé ; retirer un Média d'une Copie ne retire que ce lien", async () => {
    const mediaRepository = new SqliteMediaRepository(database);
    const importService = new ActivityMediaImportService(new ScriptedPicker({ status: "CANCELED" }), store, ids("asset"));
    const service = new ActivityDefinitionService(
      new SqliteActivityDefinitionRepository(database, ids("def")),
      undefined,
      undefined,
      undefined,
      { importService, repository: mediaRepository },
    );
    const definition = await readDefinition((await ac1Definition()).id);
    const other = await readDefinition((await saveDefinition(definitionInput(ac1Parameters(), [importedAsset("solo")]))).id);
    const session = await continueNew([
      activityDefinitionToDraftExercise(definition, "occ-1", 0),
      activityDefinitionToDraftExercise(definition, "occ-2", 0),
    ]);
    // Séance archivée qui référence p2.
    const archived = await continueNew([activityDefinitionToDraftExercise(definition, "occ-arch", 0)]);
    await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = '2026-10-16T12:00:00.000Z' WHERE id = ?", [archived.id]);
    // Instantané seul : « solo » n'est plus référencé que par lui.
    const snapshot = createExerciseSnapshot({
      name: other.name,
      categoryId: null,
      bodyZoneIds: [],
      executionParameters: other.executionParameters,
      recoverySeconds: 0,
      media: other.media ?? [],
    });
    await updateDefinition(other.id, { ...activityDefinitionToInput(other), media: [] });
    expect(await mediaRepository.countReferences("solo")).toBe(0);

    // Opérations : enregistrement, retrait d'un Média d'un autre Exercice, abandon (la migration : cas v9 ci-dessous).
    await updateDefinition(definition.id, { ...activityDefinitionToInput(definition), name: "Renommé" });
    service.leaseDraftMedia(`definition:${definition.id}`, ["v1", "p1", "p2"]);
    expect(await service.abandonMediaDraft(`definition:${definition.id}`)).toEqual([]);
    service.leaseDraftMedia("occurrence:occ-1", ["v1", "p1", "p2"]);
    expect(await service.abandonMediaDraft("occurrence:occ-1")).toEqual([]);

    // Retirer p1 d'une Copie puis Continuer : seul ce lien disparaît.
    const edited = await continueEdit(session, (draft) => ({
      ...draft,
      exercises: draft.exercises.map((exercise) =>
        exercise.id === "occ-1" ? { ...exercise, media: exercise.media?.filter((item) => item.assetId !== "p1") } : exercise,
      ),
    }));
    expect(exercisesOf(edited).map((exercise) => exercise.media?.map((item) => item.assetId))).toEqual([
      ["v1", "p2"],
      ["v1", "p1", "p2"],
    ]);
    expect((await readDefinition(definition.id)).media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);
    expect(await mediaRepository.countReferences("p2")).toBe(4);

    expect(store.deleted).toEqual([]);
    for (const uri of ["kodjo-media/v1", "kodjo-media/p1", "kodjo-media/p2", "kodjo-media/solo"]) {
      expect(store.files.has(uri)).toBe(true);
    }
    expect(snapshot.media.map((item) => item.asset.uri)).toEqual(["kodjo-media/solo"]);
    expect(await mediaRepository.findAsset("solo")).toEqual(expect.objectContaining({ uri: "kodjo-media/solo" }));
  });

  it("PRE4-1.3/AC14 — migration010 sur une base v9 réelle : Médias d'une Définition, d'une Copie, d'une Séance archivée et un asset sans lien (Instantané seul) conservés, liens et ordre compris ; aucun fichier supprimé", async () => {
    const v9 = NodeSqliteDatabase.openInMemory();
    try {
      await buildVersion9(v9);
      const v1 = JSON.stringify({
        version: 1,
        mode: "DURATION",
        series: { kind: "UNIFORM", count: 2, target: 30, pauseSeconds: 10 },
        sideMode: "UNILATERAL",
        sideOrder: "BY_SIDE",
        sideRecoverySeconds: 0,
        cadenceBeepIntervalSeconds: 0,
        countdownSeconds: 0,
        endSeconds: 0,
      });
      for (const id of ["a-def", "a-copy", "a-archived", "a-solo"]) {
        await v9.runAsync("INSERT INTO media_assets (id, uri, created_at) VALUES (?, ?, '2026-01-01T00:00:00.000Z')", [id, `kodjo-media/${id}`]);
        store.files.add(`kodjo-media/${id}`);
      }
      await v9.runAsync(
        `INSERT INTO activity_definitions (
           id, name, description, execution_mode, duration_seconds, repetition_count, series_count, pause_seconds,
           side_mode, created_at, updated_at, category_id, side_recovery_seconds, execution_parameters
         ) VALUES ('def-v9', 'Gainage', NULL, 'DURATION', 30, NULL, 2, 10, 'UNILATERAL', '2026-01-02T00:00:00.000Z', '2026-01-03T00:00:00.000Z', 'cardio', 0, ?)`,
        [v1],
      );
      await v9.runAsync(
        "INSERT INTO activity_media (id, activity_definition_id, asset_id, position) VALUES ('m1', 'def-v9', 'a-def', 0), ('m2', 'def-v9', 'a-copy', 1)",
      );
      for (const [suffix, status, archivedAt, asset] of [
        ["active", "ACTIVE", null, "a-copy"],
        ["archived", "ARCHIVED", "2026-01-08T00:00:00.000Z", "a-archived"],
      ] as const) {
        await v9.runAsync(
          `INSERT INTO sessions (id, owner_id, name, status, archived_at, initial_countdown_seconds, final_phase_seconds, created_at, updated_at)
           SELECT ?, id, ?, ?, ?, 10, 5, '2026-01-04T00:00:00.000Z', '2026-01-05T00:00:00.000Z' FROM users WHERE singleton_key = 1`,
          [`session-${suffix}`, `Séance ${suffix}`, status, archivedAt],
        );
        await v9.runAsync("INSERT INTO cycles (id, session_id, position, repeat_count) VALUES (?, ?, 1, 1)", [`cycle-${suffix}`, `session-${suffix}`]);
        await v9.runAsync("INSERT INTO tours (id, cycle_id, session_id, position, repeat_count) VALUES (?, ?, ?, 1, 1)", [
          `tour-${suffix}`,
          `cycle-${suffix}`,
          `session-${suffix}`,
        ]);
        await v9.runAsync(
          `INSERT INTO activities (
             id, session_id, cycle_id, tour_id, type, structural_position, position, name, execution_mode,
             duration_seconds, repetition_count, series_count, pause_seconds, post_activity_recovery_seconds,
             instruction, created_at, updated_at, side_mode, execution_parameters, category_id
           ) VALUES (?, ?, ?, ?, 'EXERCISE', 'IN_TOUR', 0, 'Copie', 'DURATION', 30, NULL, 2, 10, 0, NULL,
             '2026-01-06T00:00:00.000Z', '2026-01-07T00:00:00.000Z', 'UNILATERAL', ?, 'cardio')`,
          [`copy-${suffix}`, `session-${suffix}`, `cycle-${suffix}`, `tour-${suffix}`, v1],
        );
        await v9.runAsync("INSERT INTO session_activity_media (id, activity_id, asset_id, position) VALUES (?, ?, ?, 0), (?, ?, 'a-def', 1)", [
          `sm-${suffix}-0`,
          `copy-${suffix}`,
          asset,
          `sm-${suffix}-1`,
          `copy-${suffix}`,
        ]);
      }
      const media = async () => ({
        assets: await v9.getAllAsync("SELECT * FROM media_assets ORDER BY id"),
        definitionLinks: await v9.getAllAsync("SELECT * FROM activity_media ORDER BY id"),
        copyLinks: await v9.getAllAsync("SELECT * FROM session_activity_media ORDER BY id"),
      });
      const before = await media();
      const files = [...store.files];

      await migrateDatabase(v9);
      expect(await v9.getFirstAsync("PRAGMA user_version")).toEqual({ user_version: 10 });
      expect(await media()).toEqual(before);
      expect((await new SqliteActivityDefinitionRepository(v9, ids("def")).findById("def-v9"))?.media?.map((item) => item.assetId)).toEqual(["a-def", "a-copy"]);
      const mediaRepository = new SqliteMediaRepository(v9);
      expect(await mediaRepository.countReferences("a-archived")).toBe(1);
      expect(await mediaRepository.countReferences("a-solo")).toBe(0);
      expect(await mediaRepository.findAsset("a-solo")).toEqual(expect.objectContaining({ uri: "kodjo-media/a-solo" }));
      expect(store.deleted).toEqual([]);
      expect([...store.files]).toEqual(files);
    } finally {
      v9.close();
    }
  });

  it("PRE4-1.3/AC15 — import annulé puis Terminer : mêmes 2 Médias ; import en échec, réessai réussi, Terminer : 3 Médias, le nouveau en dernier, sans orphelin", async () => {
    const definition = await readDefinition(
      (await saveDefinition(definitionInput(ac1Parameters(), [importedAsset("v1", "VIDEO"), importedAsset("p1")]))).id,
    );
    const picker = new ScriptedPicker({ status: "CANCELED" });
    const importService = new ActivityMediaImportService(picker, store, () => "p-new");
    const mediaDraftId = `definition:${definition.id}`;

    const canceled = await importService.importFromLibrary(mediaDraftId);
    expect(canceled.status).toBe("CANCELED");
    await updateDefinition(definition.id, activityDefinitionToInput(definition));
    expect((await readDefinition(definition.id)).media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);

    store.failures.add("file:///cache/new.jpg");
    picker.outcome = { status: "PICKED", items: [picked("new.jpg")], limitedAccess: false };
    const failed = await importService.importFromLibrary(mediaDraftId);
    const failedItem = failed.status === "IMPORTED" ? failed.items[0]! : null;
    expect(failedItem?.state).toBe("FAILED");
    expect(store.files.has("kodjo-media/p-new")).toBe(false);
    store.failures.clear();
    const retried = await importService.retry(mediaDraftId, failedItem!);
    expect(retried.state).toBe("READY");
    const draftMedia = [...toDraftMediaItems(definition.media ?? []), ...readyMedia([retried])];
    await updateDefinition(definition.id, {
      ...activityDefinitionToInput(definition),
      media: draftMedia.map((item) => ({ assetId: item.assetId, asset: item.asset })),
    });
    importService.commitDraft(mediaDraftId);

    expect((await readDefinition(definition.id)).media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p-new"]);
    expect(await database.getAllAsync("SELECT asset_id FROM activity_media ORDER BY position")).toEqual([
      { asset_id: "v1" },
      { asset_id: "p1" },
      { asset_id: "p-new" },
    ]);
    // Sans lien orphelin (FK) ni fichier référencé absent.
    expect(await database.getAllAsync("PRAGMA foreign_key_check")).toEqual([]);
    const uris = await database.getAllAsync<{ uri: string }>("SELECT uri FROM media_assets");
    expect(uris.every((row) => store.files.has(row.uri))).toBe(true);
    expect(store.copies).toBe(1);
  });

  it("PRE4-1.3/AC16 — Média indisponible : Exercice, Copie et Instantané se relisent avec tous leurs paramètres et liens ; le lien n'est pas supprimé", async () => {
    const definition = await readDefinition((await ac1Definition()).id);
    const session = await continueNew([activityDefinitionToDraftExercise(definition, "occ-1", 0)]);
    const copy = exercisesOf(session)[0]!;
    const json = serializeExerciseSnapshot(
      createExerciseSnapshot({
        name: copy.name,
        categoryId: copy.categoryId ?? null,
        bodyZoneIds: copy.bodyZoneIds,
        executionParameters: copy.executionParameters,
        recoverySeconds: 0,
        media: copy.media ?? [],
      }),
    );
    // Le fichier disparaît hors de l'application.
    store.files.delete("kodjo-media/p1");

    const rereadDefinition = await readDefinition(definition.id);
    const rereadCopy = exercisesOf((await new SqliteSessionRepository(database, ids("ses")).findById(session.id))!)[0]!;
    const rereadSnapshot = parseExerciseSnapshot(json);
    expect(rereadDefinition.executionParameters).toEqual(ac1Parameters());
    expect(rereadCopy.executionParameters).toEqual(ac1Parameters());
    expect(rereadSnapshot.executionParameters).toEqual(ac1Parameters());
    for (const media of [rereadDefinition.media, rereadCopy.media, rereadSnapshot.media]) {
      expect(media?.map((item) => item.asset.id)).toEqual(["v1", "p1", "p2"]);
    }
    expect(await database.getAllAsync("SELECT id FROM activity_media WHERE asset_id = 'p1'")).toHaveLength(1);
    expect(await database.getAllAsync("SELECT id FROM session_activity_media WHERE asset_id = 'p1'")).toHaveLength(1);
  });

  it("PRE4-1.3/AC17 — Copie rouverte : mêmes Mode et Cibles typées ; Durée totale par la même fonction que pour la Définition (même montant, même nature)", async () => {
    for (const parameters of [
      ac1Parameters(),
      variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 10]] }),
      variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10]], cadenceBeepIntervalSeconds: 2 }),
    ]) {
      const definition = await readDefinition((await saveDefinition(definitionInput(parameters, []))).id);
      const session = await continueNew([activityDefinitionToDraftExercise(definition, `occ-${++sequence}`, 30)]);
      const reopened = toSessionDraft(session).exercises[0]!;
      expect(reopened.executionParameters.mode).toBe(definition.executionParameters.mode);
      expect(reopened.executionParameters.series).toEqual(definition.executionParameters.series);
      expect(computeIntrinsicDuration(reopened.executionParameters)).toEqual(computeIntrinsicDuration(definition.executionParameters));
      // Phrase (porteuse de la Durée totale affichée) : même résultat, y compris son absence.
      const phrase = generateExecutionPhrase(definition.executionParameters);
      expect(generateExecutionPhrase(reopened.executionParameters)).toEqual(phrase);
      if (phrase) {
        expect(phraseText(generateExecutionPhrase(reopened.executionParameters)!)).toBe(phraseText(phrase));
      }
    }
  });
});
