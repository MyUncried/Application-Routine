import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  activityDefinitionToDraftExercise,
  validateActivityDefinitionInput,
  type ActivityDefinition,
  type CreateActivityDefinitionInput,
} from "@/domain/activities/ActivityDefinition";
import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { commitSheetDraft, openSheetDraft, setSeriesCount } from "@/domain/activities/ExecutionParametersDraft";
import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import { createExerciseSnapshot, parseExerciseSnapshot, serializeExerciseSnapshot } from "@/domain/activities/exerciseSnapshot";
import { variableParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { moveDraftMedia, toDraftMediaItems, type DraftMediaItem, type MediaLinkInput } from "@/domain/media/ActivityMedia";
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
import { withLocalMovements } from "@/domain/sessions/testing/draftMovements";
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
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { JOINED_ASSET_COLUMNS, mapJoinedAsset, SqliteMediaRepository } from "@/infrastructure/database/repositories/SqliteMediaRepository";
import { replaceMovementMediaLinks } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { createTestMovement } from "@/infrastructure/database/testing/createTestMovement";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import type { MovementMediaRow } from "@/infrastructure/database/types/DatabaseRows";

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
 *
 * [A.3 du 04/11/2026 : les anciennes définitions du Catalogue sont supprimées (migration 021, décision de
 * Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens
 * exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. ») et leur dépôt
 * retiré. La « Définition » de ces cas est désormais un Mouvement créé seul (`createTestMovement`) vu
 * avec des paramètres tenus en mémoire ; ses médias sont ceux du Mouvement. Les cas propres à
 * l'écriture d'une définition (modification de ses paramètres, de son nom, échec injecté à son
 * enregistrement, AC2 partie Catalogue, AC7 persistance, AC12) sont retirés ; les deux preuves sur base
 * v9 de `migration010` (AC9, AC14) sont déplacées dans `migration010.test.ts`.]
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

describe("PRE-4 story 1.3 — copies, duplications, Instantanés et Médias (NodeSqliteDatabase REAL)", () => {
  let database: NodeSqliteDatabase;
  let store: CountingStore;
  let sequence = 0;
  const ids = (prefix: string) => () => `${prefix}-${++sequence}`;

  beforeEach(async () => {
    database = NodeSqliteDatabase.openInMemory();
    await migrateDatabase(database);
    store = new CountingStore();
    views.clear();
  });

  /** Vue « Définition » : Mouvement et paramètres tenus en mémoire (A.3, plus de ligne de définition). */
  const views = new Map<string, { readonly movementId: string; parameters: ExecutionParameters }>();

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

  /** Validation du Domaine puis Mouvement créé seul (contenu, Zones, médias, phases). */
  async function saveDefinition(input: CreateActivityDefinitionInput): Promise<ActivityDefinition> {
    const validated = validateActivityDefinitionInput(input);
    if (!validated.ok) {
      throw new Error(JSON.stringify(validated.violations));
    }
    const { movementId } = await createTestMovement(database, validated.value, { kind: "INDEPENDENT" }, ids("def"));
    const id = `def-${movementId}`;
    views.set(id, { movementId, parameters: validated.value.executionParameters });
    return readDefinition(id);
  }

  /** Médias du Mouvement de la vue remplacés (ordre compris), dans une transaction. */
  async function replaceDefinitionMedia(id: string, media: readonly MediaLinkInput[]): Promise<void> {
    await database.withExclusiveTransactionAsync((transaction) => replaceMovementMediaLinks(transaction, views.get(id)!.movementId, media, ids("link")));
  }

  /** Continuer : brouillon de Composition → Séance persistée. */
  async function continueNew(exercises: readonly SessionDraftExercise[]): Promise<Session> {
    // PRE-7 (R-3, C05) : Exercices créés dans la Séance = créations locales terminées (Mouvements NEW).
    const draft: SessionDraft = withLocalMovements({ ...createEmptyDraft(), name: "Jambes", exercises });
    const input = toCreateSessionInput(draft);
    if (!input.ok) {
      throw new Error(JSON.stringify(input.violations));
    }
    const created = await new SqliteSessionRepository(database, ids("ses")).create(input.value);
    return (await new SqliteSessionRepository(database, ids("ses")).findById(created.id))!;
  }

  async function continueEdit(session: Session, mutate: (draft: SessionDraft) => SessionDraft): Promise<Session> {
    const input = toUpdateSessionInput(withLocalMovements(mutate(toSessionDraft(session))));
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
    const view = views.get(id)!;
    const movement = (await database.getFirstAsync<{ name: string; description: string | null; category_id: string }>(
      "SELECT name, description, category_id FROM movements WHERE id = ?",
      [view.movementId],
    ))!;
    const zones = await database.getAllAsync<{ body_zone_id: string }>(
      "SELECT body_zone_id FROM movement_body_zones WHERE movement_id = ? ORDER BY rowid",
      [view.movementId],
    );
    const links = await database.getAllAsync<MovementMediaRow>(
      `SELECT movement_media.id, movement_media.movement_id, movement_media.asset_id, movement_media.position, ${JOINED_ASSET_COLUMNS}
       FROM movement_media JOIN media_assets ON media_assets.id = movement_media.asset_id
       WHERE movement_media.movement_id = ? ORDER BY movement_media.position`,
      [view.movementId],
    );
    return {
      id,
      movementId: view.movementId,
      name: movement.name,
      description: movement.description,
      executionParameters: view.parameters,
      categoryId: movement.category_id,
      bodyZoneIds: zones.map((row) => row.body_zone_id),
      sideMode: view.parameters.sideMode,
      media: links.map((row) => ({ id: row.id, activityDefinitionId: id, assetId: row.asset_id, position: row.position, asset: mapJoinedAsset(row.asset_id, row) })),
      createdAt: "now",
      updatedAt: "now",
    };
  }

  async function dump(): Promise<Record<string, unknown[]>> {
    const result: Record<string, unknown[]> = {};
    for (const table of [
      // PRE-7 (A1.2) : contenu partagé porté par le Mouvement.
      "movements",
      "movement_phases",
      "movement_body_zones",
      "movement_media",
      "media_assets",
      "sessions",
      "activities",
      // PRE-7 (R-3, C05) : plus de liens de médias propres aux occurrences.
      "movement_aliases",
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

    // [A.3 du 04/11/2026 : contrôle des colonnes de la table des anciennes définitions retiré (table vidée, hors usage).]
    expect(definition).not.toHaveProperty("structuralPosition");
    expect(definition).not.toHaveProperty("postActivityRecoverySeconds");
  });

  // [A.3 du 04/11/2026 : volet « modifier la Définition » (écriture d'une ancienne définition) retiré.]
  it("PRE4-1.3/AC2 — isolation : modifier une copie ne touche ni le Mouvement ni l'autre copie", async () => {
    const definition = await readDefinition((await ac1Definition()).id);
    const session = await continueNew([
      activityDefinitionToDraftExercise(definition, "occ-1", 0),
      activityDefinitionToDraftExercise(definition, "occ-2", 0),
    ]);

    // Copie modifiée : Cible de la ligne 1, ordre des lignes ; Terminer puis Continuer. PRE-7 (R-3,
    // D-445 C05) : les Médias appartiennent au Mouvement — une vue modifiée sur l'occurrence n'est
    // jamais écrite (la correction du Mouvement depuis la Séance passe par le brouillon, R-4).
    const reread = (await new SqliteSessionRepository(database, ids("ses")).findById(session.id))!;
    const definitionBefore = await dump();
    const edited = await continueEdit(reread, (draft) => ({
      ...draft,
      exercises: draft.exercises.map((exercise) => {
        if (exercise.id !== "occ-1") {
          return exercise;
        }
        const rows = [
          { target: { kind: "NUMBER" as const, value: 40 }, pauseSeconds: 10, loadKg: 0 },
          { target: { kind: "FAILURE" as const }, pauseSeconds: 10, loadKg: 0 },
          { target: { kind: "NUMBER" as const, value: 45 }, pauseSeconds: 10, loadKg: 0 },
        ];
        return {
          ...exercise,
          executionParameters: { ...exercise.executionParameters, series: { kind: "VARIABLE", rows, workPhases: [] } },
        };
      }),
    }));
    const [first, second] = exercisesOf(edited);
    expect(first!.executionParameters.series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: { kind: "NUMBER", value: 40 }, pauseSeconds: 10, loadKg: 0 },
        { target: { kind: "FAILURE" }, pauseSeconds: 10, loadKg: 0 },
        { target: { kind: "NUMBER", value: 45 }, pauseSeconds: 10, loadKg: 0 },
      ],
      workPhases: [],
    });
    expect(first!.media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);
    expect(second!.executionParameters).toEqual(ac1Parameters());
    expect(second!.media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);
    const after = await dump();
    for (const table of ["movements", "movement_phases", "movement_body_zones", "movement_media", "media_assets"]) {
      expect(after[table]).toEqual(definitionBefore[table]);
    }
  });

  it("PRE4-1.3/AC4 — Définition à Cible héritée UNSET : la Copie entre au brouillon UNSET ; Continuer refuse, base inchangée", async () => {
    const created = await saveDefinition(definitionInput(variableParameters({ mode: "REPETITIONS", rows: [[12, 10], [12, 10]] }), []));
    const inherited = variableParameters({ mode: "REPETITIONS", rows: [["UNSET", 10], [12, 10]] });
    // [A.3 du 04/11/2026 : Cible héritée posée sur la vue en mémoire.]
    views.get(created.id)!.parameters = inherited;
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
            postActivityRecoverySeconds: 0,
            executionParameters: copy.executionParameters,
            // PRE-7 (R-3, C05) : référence au Mouvement de la définition, sans contenu.
            sourceMovementId: copy.sourceMovementId,
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
    const definitionsBefore = await database.getAllAsync("SELECT id FROM movements ORDER BY id");
    const assetsBefore = await database.getAllAsync("SELECT * FROM media_assets ORDER BY id");

    const duplicated = await continueEdit(session, (draft) => ({ ...draft, exercises: duplicateActivity(draft.exercises, "occ-1", "occ-3") }));
    const [source, copy, other] = exercisesOf(duplicated);
    expect([source!.id, copy!.id, other!.id]).toEqual(["occ-1", "occ-3", "occ-2"]);
    expect(copy!.executionParameters).toEqual(repetitions());
    expect(copy!.postActivityRecoverySeconds).toBe(40);
    expect(copy!.categoryId).toBe("cardio");
    expect([...copy!.bodyZoneIds].sort()).toEqual([...source!.bodyZoneIds].sort());
    expect(copy!.media?.map((item) => item.assetId)).toEqual(["v1", "p1"]);
    expect(await database.getAllAsync("SELECT id FROM movements ORDER BY id")).toEqual(definitionsBefore);
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

  // [A.3 du 04/11/2026 : l'enregistrement et la réouverture de la Définition (anciennes définitions) sont
  // retirés ; la valeur validée par la feuille est contrôlée directement.]
  it("PRE4-1.3/AC7 — N 2 → 3 depuis une ligne à l'échec : la ligne ajoutée est FAILURE, Pause 20 s", async () => {
    const opened = { executionParameters: variableParameters({ mode: "REPETITIONS", rows: [[10, 10], ["FAILURE", 20]] }) };
    const committed = commitSheetDraft(setSeriesCount(openSheetDraft(opened.executionParameters), 3), opened.executionParameters);
    expect(committed.ok).toBe(true);
    expect((committed.ok ? committed.value : opened.executionParameters).series).toEqual({
      kind: "VARIABLE",
      rows: [
        { target: { kind: "NUMBER", value: 10 }, pauseSeconds: 10, loadKg: 0 },
        { target: { kind: "FAILURE" }, pauseSeconds: 20, loadKg: 0 },
        { target: { kind: "FAILURE" }, pauseSeconds: 20, loadKg: 0 },
      ],
      workPhases: [],
    });
  });

  it("PRE4-1.3/AC9 — aucun chemin de production n'écrit ni ne stocke d'Instantané (H11) : rien ne peut réécrire une enveloppe v1", () => {
    const root = join(__dirname, "..", "..", "..", "..");
    const production = [...sourceFiles(join(root, "src")), ...sourceFiles(join(root, "app"))]
      .map((path) => ({ path: relative(root, path).replace(/\\/g, "/"), code: readFileSync(path, "utf8") }))
      .filter((file) => !file.path.includes("/__tests__/") && !file.path.includes("/testing/"));
    // Seul le module de l'Instantané crée, sérialise ou relit une enveloppe. PRE-9 (D.2) :
    // l'instantané de Séance, pur, crée en mémoire l'instantané de chaque Exercice, sans le
    // sérialiser ni le stocker (persistance reportée à PRE-10).
    const users = production.filter((file) => /\b(createExerciseSnapshot|serializeExerciseSnapshot|parseExerciseSnapshot)\b/.test(file.code));
    expect(users.map((file) => file.path)).toEqual(["src/domain/activities/exerciseSnapshot.ts", "src/domain/sessions/sessionSnapshot.ts"]);
    expect(users.filter((file) => /\b(serializeExerciseSnapshot|parseExerciseSnapshot)\b/.test(file.code)).map((file) => file.path)).toEqual([
      "src/domain/activities/exerciseSnapshot.ts",
    ]);
    // Aucun repository, aucune migration, aucun SQL ne mentionne un Instantané. [Remplacé par PRE-10 (09/11/2026) : seule
    // la persistance de l'Exécution stocke l'instantané de Séance, en JSON immuable écrit une seule fois à la création
    // (ch09 « Instantané de source », ch12 §12.15) — jamais une enveloppe d'Exercice v1, jamais réécrit.]
    expect(production.filter((file) => file.path.startsWith("src/infrastructure/") && /snapshot/i.test(file.code)).map((file) => file.path).sort()).toEqual([
      "src/infrastructure/database/migrations/migration024.ts",
      "src/infrastructure/database/repositories/SqliteExecutionRepository.ts",
    ]);
    const repository = production.find((file) => file.path === "src/infrastructure/database/repositories/SqliteExecutionRepository.ts")!;
    expect(repository.code).not.toMatch(/UPDATE executions SET[^`]*snapshot_json/);
  });

  it("PRE4-1.3/AC10 — Instantané d'une Copie relue : version courante (v3 depuis PRE-5), Cibles typées et Médias ordonnés par référence ; une modification ultérieure de la Copie ne l'atteint pas", async () => {
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
      sourceMovementId: copy.sourceMovementId!,
      name: copy.name,
      categoryId: copy.categoryId ?? null,
      bodyZoneIds: copy.bodyZoneIds,
      executionParameters: copy.executionParameters,
      recoverySeconds: copy.postActivityRecoverySeconds ?? 0,
      media: copy.media ?? [],
    });
    const json = serializeExerciseSnapshot(snapshot);
    const reread = parseExerciseSnapshot(json);
    expect(reread.snapshotVersion).toBe(3); // PRE-5 (AD-18) : enveloppe v3.
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
    // Ajout, édition de la Copie et Terminer : uniquement des valeurs de brouillon. PRE-7 (R-3, C05) :
    // ses paramètres propres sont écrits au Continuer ; son nom est celui du Mouvement.
    const copy = activityDefinitionToDraftExercise(definition, "occ-1", 0);
    const editedParameters = { ...copy.executionParameters, cadenceBeepIntervalSeconds: 7 };
    const draft: SessionDraft = { ...createEmptyDraft(), name: "Jambes", exercises: [{ ...copy, executionParameters: editedParameters }] };
    expect(toCreateSessionInput(draft).ok).toBe(true);
    expect(await dump()).toEqual(before);
    const session = await continueNew(draft.exercises);
    expect(exercisesOf(session).map((exercise) => [exercise.name, exercise.executionParameters])).toEqual([["Fentes sautées", editedParameters]]);
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
    expect(await database.getAllAsync("SELECT id FROM movement_media WHERE asset_id = 'p3'")).toEqual([]);
    expect(await database.getAllAsync("SELECT id FROM media_assets WHERE id = 'p3'")).toEqual([]);

    // [A.3 du 04/11/2026 : Terminer écrit les médias du Mouvement.]
    await replaceDefinitionMedia(
      definition.id,
      draftMedia.map((item) => ({ assetId: item.assetId, asset: item.asset })),
    );
    importService.commitDraft(mediaDraftId);
    const reread = await readDefinition(definition.id);
    expect(reread.media?.map((item) => item.assetId)).toEqual(displayed);
    expect(reread.media?.map((item) => item.asset.id)).toEqual(displayed);
    // Première vignette = premier Média relu (la vignette de carte n'est pas implémentée, D-264).
    expect(reread.media?.[0]?.assetId).toBe("p3");
    const positions = await database.getAllAsync<{ position: number }>(
      "SELECT position FROM movement_media WHERE movement_id = ? ORDER BY position",
      [definition.movementId],
    );
    expect(positions.map((row) => row.position)).toEqual([0, 1, 2, 3]);

    // La base ne contient aucun contenu de fichier ; chaque référence pointe vers un fichier existant, inchangée.
    const assetColumns = await database.getAllAsync<{ type: string }>("PRAGMA table_info(media_assets)");
    expect(assetColumns.some((column) => /BLOB/i.test(column.type))).toBe(false);
    const uris = await database.getAllAsync<{ id: string; uri: string }>("SELECT id, uri FROM media_assets ORDER BY id");
    expect(uris).toEqual(["p1", "p2", "p3", "v1"].map((id) => ({ id, uri: `kodjo-media/${id}` })));
    expect(uris.every((row) => store.files.has(row.uri))).toBe(true);

    // PRE-7 (R-3, D-445 C05) : la copie relit les Médias de son Mouvement — ordre réordonné compris.
    const copy = exercisesOf((await new SqliteSessionRepository(database, ids("ses")).findById(session.id))!)[0]!;
    expect(copy.media?.map((item) => item.assetId)).toEqual(displayed);

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
      undefined,
      undefined,
      undefined,
      { importService, repository: mediaRepository },
    );
    const definition = await readDefinition((await ac1Definition()).id);
    // PRE-7 (R-3, C01) : nom de Mouvement distinct.
    const other = await readDefinition((await saveDefinition({ ...definitionInput(ac1Parameters(), [importedAsset("solo")]), name: "Fentes solo" })).id);
    const session = await continueNew([
      activityDefinitionToDraftExercise(definition, "occ-1", 0),
      activityDefinitionToDraftExercise(definition, "occ-2", 0),
    ]);
    // Séance archivée qui référence p2.
    const archived = await continueNew([activityDefinitionToDraftExercise(definition, "occ-arch", 0)]);
    await database.runAsync("UPDATE sessions SET status = 'ARCHIVED', archived_at = '2026-10-16T12:00:00.000Z' WHERE id = ?", [archived.id]);
    // Instantané seul : « solo » n'est plus référencé que par lui.
    const snapshot = createExerciseSnapshot({
      sourceMovementId: other.movementId,
      name: other.name,
      categoryId: null,
      bodyZoneIds: [],
      executionParameters: other.executionParameters,
      recoverySeconds: 0,
      media: other.media ?? [],
    });
    await replaceDefinitionMedia(other.id, []);
    expect(await mediaRepository.countReferences("solo")).toBe(0);

    // Opérations : enregistrement, retrait d'un Média d'un autre Exercice, abandon (la migration : cas v9 ci-dessous).
    // [A.3 du 04/11/2026 : renommage par l'ancienne définition retiré.]
    service.leaseDraftMedia(`definition:${definition.id}`, ["v1", "p1", "p2"]);
    expect(await service.abandonMediaDraft(`definition:${definition.id}`)).toEqual([]);
    service.leaseDraftMedia("occurrence:occ-1", ["v1", "p1", "p2"]);
    expect(await service.abandonMediaDraft("occurrence:occ-1")).toEqual([]);

    // PRE-7 (R-3, D-445 C05) : une Copie n'a plus de liens propres — retirer p1 de sa vue n'écrit rien ;
    // les deux Copies relisent les Médias du Mouvement, seule source des références.
    const edited = await continueEdit(session, (draft) => ({
      ...draft,
      exercises: draft.exercises.map((exercise) =>
        exercise.id === "occ-1" ? { ...exercise, media: exercise.media?.filter((item) => item.assetId !== "p1") } : exercise,
      ),
    }));
    expect(exercisesOf(edited).map((exercise) => exercise.media?.map((item) => item.assetId))).toEqual([
      ["v1", "p1", "p2"],
      ["v1", "p1", "p2"],
    ]);
    expect((await readDefinition(definition.id)).media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p2"]);
    expect(await mediaRepository.countReferences("p2")).toBe(1);

    expect(store.deleted).toEqual([]);
    for (const uri of ["kodjo-media/v1", "kodjo-media/p1", "kodjo-media/p2", "kodjo-media/solo"]) {
      expect(store.files.has(uri)).toBe(true);
    }
    expect(snapshot.media.map((item) => item.asset.uri)).toEqual(["kodjo-media/solo"]);
    expect(await mediaRepository.findAsset("solo")).toEqual(expect.objectContaining({ uri: "kodjo-media/solo" }));
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
    await replaceDefinitionMedia(definition.id, toDraftMediaItems(definition.media ?? []));
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
    await replaceDefinitionMedia(
      definition.id,
      draftMedia.map((item) => ({ assetId: item.assetId, asset: item.asset })),
    );
    importService.commitDraft(mediaDraftId);

    expect((await readDefinition(definition.id)).media?.map((item) => item.assetId)).toEqual(["v1", "p1", "p-new"]);
    expect(await database.getAllAsync("SELECT asset_id FROM movement_media ORDER BY position")).toEqual([
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
        sourceMovementId: copy.sourceMovementId!,
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
    expect(await database.getAllAsync("SELECT id FROM movement_media WHERE asset_id = 'p1'")).toHaveLength(1);
    // PRE-7 (R-3, C05) : la Copie relit les liens de son Mouvement (mêmes identités), sans lien propre.
    expect(rereadCopy.media?.map((item) => item.id)).toEqual(rereadDefinition.media?.map((item) => item.id));
  });

  it("PRE4-1.3/AC17 — Copie rouverte : mêmes Mode et Cibles typées ; Durée totale par la même fonction que pour la Définition (même montant, même nature)", async () => {
    for (const parameters of [
      ac1Parameters(),
      variableParameters({ mode: "DURATION", rows: [[30, 10], [45, 10]] }),
      variableParameters({ mode: "REPETITIONS", rows: [[10, 10], [12, 10]], cadenceBeepIntervalSeconds: 2 }),
    ]) {
      // PRE-7 (R-3, C01) : un Mouvement de nom distinct par définition.
      const definition = await readDefinition((await saveDefinition({ ...definitionInput(parameters, []), name: `Fentes ${++sequence}` })).id);
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

  /**
   * PRE-5 story 1.1 (AC12, AD-9, AD-19, AD-22, FR-41) : la copie Définition → Séance, la
   * duplication et l'Instantané transportent les phases, la charge (valeurs sous Sans
   * comprises) et la Description encodée ; chaque copie reste isolée.
   */
  it("PRE5-1.1/AC12 — phases, charge sous Sans et Description en étapes transportées par copie, duplication et Instantané ; copies isolées", async () => {
    const phased = (): ExecutionParameters => ({
      ...variableParameters({ mode: "DURATION", rows: [[9, 15]], sideMode: "LEFT_RIGHT", sideRecoverySeconds: 5 }),
      series: {
        kind: "UNIFORM",
        count: 3,
        target: { kind: "NUMBER", value: 9 },
        pauseSeconds: 15,
        loadKg: 2.5,
        workPhases: [
          { id: 2, label: "Descente", durationSeconds: 6 },
          { id: 5, label: "Maintien", durationSeconds: 3 },
        ],
      },
      loadEnabled: false,
    });
    const steps = encodeInstructionSteps(["Buste droit", "Genoux souples", "Expirer en montant"]);
    const definition = await readDefinition(
      (await saveDefinition({ ...definitionInput(phased(), [importedAsset("p1")]), description: steps })).id,
    );
    expect(definition.executionParameters).toEqual(phased());
    expect(definition.description).toBe("Buste droit\nGenoux souples\nExpirer en montant");

    const session = await continueNew([activityDefinitionToDraftExercise(definition, "occ-1", 0)]);
    const duplicated = await continueEdit(session, (draft) => ({ ...draft, exercises: duplicateActivity(draft.exercises, "occ-1", "occ-2") }));
    const [source, copy] = exercisesOf(duplicated);
    for (const exercise of [source!, copy!]) {
      expect(exercise.executionParameters).toEqual(phased());
      expect(decodeInstructionSteps(exercise.instruction)).toEqual(["Buste droit", "Genoux souples", "Expirer en montant"]);
    }
    const stored = await database.getAllAsync<{ execution_parameters: string }>("SELECT execution_parameters FROM activities ORDER BY rowid");
    // PRE-7 (R-3, C05) : forme Catalogue v5 des copies (durées par `phaseId`).
    expect(stored.every((row) => row.execution_parameters.startsWith('{"version":5,'))).toBe(true);

    // Instantané : phases et charge sous Sans conservées.
    const snapshot = parseExerciseSnapshot(
      serializeExerciseSnapshot(
        createExerciseSnapshot({
          sourceMovementId: copy!.sourceMovementId!,
          name: copy!.name,
          categoryId: copy!.categoryId ?? null,
          bodyZoneIds: copy!.bodyZoneIds,
          executionParameters: copy!.executionParameters,
          recoverySeconds: 0,
          media: copy!.media ?? [],
        }),
      ),
    );
    expect(snapshot.executionParameters).toEqual(phased());

    // Modifier les durées de phases et la charge de la copie ne touche ni la source, ni la Définition.
    // PRE-7 (R-3, C05) : la structure des phases (identités, libellés) reste celle du Mouvement.
    const editedParameters: ExecutionParameters = {
      ...phased(),
      series: {
        ...(phased().series as Extract<ExecutionParameters["series"], { kind: "UNIFORM" }>),
        target: { kind: "NUMBER", value: 10 },
        loadKg: 5,
        workPhases: [
          { id: 2, label: "Descente", durationSeconds: 7 },
          { id: 5, label: "Maintien", durationSeconds: 3 },
        ],
      },
      loadEnabled: true,
    };
    const edited = await continueEdit(duplicated, (draft) => ({
      ...draft,
      exercises: draft.exercises.map((exercise) => (exercise.id === "occ-2" ? { ...exercise, executionParameters: editedParameters } : exercise)),
    }));
    expect(exercisesOf(edited).map((exercise) => exercise.executionParameters)).toEqual([phased(), editedParameters]);
    expect((await readDefinition(definition.id)).executionParameters).toEqual(phased());
    expect(snapshot.executionParameters).toEqual(phased());
  });
});
