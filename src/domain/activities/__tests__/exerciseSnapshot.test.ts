import { describe, expect, it } from "@jest/globals";

import {
  cloneExecutionParameters,
  EXECUTION_PARAMETERS_VERSION,
  failureTarget,
  numberTarget,
  type ExecutionParameters,
} from "@/domain/activities/ExecutionParameters";
import { phraseText, generateExecutionPhrase } from "@/domain/activities/executionPhrase";
import {
  createExerciseSnapshot,
  parseExerciseSnapshot,
  serializeExerciseSnapshot,
  EXERCISE_SNAPSHOT_VERSION,
  ExerciseSnapshotDataError,
} from "@/domain/activities/exerciseSnapshot";
import type { MediaAsset } from "@/domain/media/MediaAsset";

const photo: MediaAsset = {
  id: "asset-photo",
  uri: "kodjo-media/asset-photo.jpg",
  createdAt: "2026-10-09T10:00:00.000Z",
  kind: "PHOTO",
  mimeType: "image/jpeg",
  fileName: null,
  sizeBytes: 2048,
  durationMs: null,
  width: 1200,
  height: 800,
};
const video: MediaAsset = {
  id: "asset-video",
  uri: "kodjo-media/asset-video.mov",
  createdAt: "2026-10-09T10:01:00.000Z",
  kind: "VIDEO",
  mimeType: "video/quicktime",
  fileName: "IMG_0001.MOV",
  sizeBytes: 900_000,
  durationMs: 12_500,
  width: null,
  height: null,
};

function canonical(): ExecutionParameters {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: "DURATION",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
        { target: numberTarget(45), pauseSeconds: 20, loadKg: 0 },
        { target: numberTarget(60), pauseSeconds: 30, loadKg: 0 },
      ],
      workPhases: [],
    },
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 15,
    cadenceBeepIntervalSeconds: 4,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: false,
  };
}

describe("P3-18/copy-complete — instantané complet et immuable", () => {
  it("paramètres, Catégorie, médias ordonnés et métadonnées ; même fichier physique", () => {
    const source = {
      sourceMovementId: "mov-1",
      name: "Squats sautés",
      categoryId: "renforcement",
      bodyZoneIds: ["cuisses", "fessiers"],
      executionParameters: canonical(),
      recoverySeconds: 120,
      media: [{ asset: video }, { asset: photo }],
    };
    const snapshot = createExerciseSnapshot(source);
    expect(snapshot.executionParameters).toEqual(canonical());
    expect(snapshot.media.map((item) => [item.position, item.asset.id, item.asset.uri])).toEqual([
      [0, "asset-video", "kodjo-media/asset-video.mov"],
      [1, "asset-photo", "kodjo-media/asset-photo.jpg"],
    ]);
    expect(snapshot.media[0]!.asset).toEqual(video);
    expect(snapshot.categoryId).toBe("renforcement");
  });

  it("muter la source après coup n'atteint jamais l'instantané", () => {
    const parameters = canonical();
    const media = [{ asset: { ...photo } }];
    const snapshot = createExerciseSnapshot({
      sourceMovementId: "mov-1",
      name: "A",
      categoryId: null,
      bodyZoneIds: ["z"],
      executionParameters: parameters,
      recoverySeconds: 0,
      media,
    });
    (parameters.series as unknown as { rows: { target: { value: number } }[] }).rows[0]!.target.value = 999;
    (media[0]!.asset as { uri: string }).uri = "changed";
    expect(snapshot.executionParameters.series).toEqual(canonical().series);
    expect(snapshot.media[0]!.asset.uri).toBe(photo.uri);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.executionParameters.series)).toBe(true);
    try {
      (snapshot as { name: string }).name = "x";
    } catch {
      // Mode strict : l'écriture lève ; sinon elle est ignorée. Dans les deux cas, rien ne change.
    }
    expect(snapshot.name).toBe("A");
  });
});

describe("P3-18/historical-immutability et P3-15/no-storage", () => {
  it("la durée réalisée reste inchangée ; aucune phrase/segment sérialisé ; la phrase se régénère", () => {
    const snapshot = createExerciseSnapshot({
      sourceMovementId: "mov-1",
      name: "Gainage",
      categoryId: "c",
      bodyZoneIds: [],
      executionParameters: canonical(),
      recoverySeconds: 30,
      media: [],
      actualDurationSeconds: 412,
    });
    const json = serializeExerciseSnapshot(snapshot);
    expect(json).not.toMatch(/phrase|segment|texte|gras|Durée totale/);
    // Une phrase « historique » injectée est ignorée à la relecture.
    const tampered = JSON.stringify({ ...JSON.parse(json), phrase: "ancienne phrase figée", segments: [] });
    const reread = parseExerciseSnapshot(tampered);
    expect(reread.actualDurationSeconds).toBe(412);
    expect(reread).not.toHaveProperty("phrase");
    expect(phraseText(generateExecutionPhrase(reread.executionParameters)!)).toContain(
      "3 séries de durée variable (30 s, 45 s puis 1 min)",
    );
  });

  it("version inconnue → erreur de données explicite", () => {
    expect(() => parseExerciseSnapshot(JSON.stringify({ snapshotVersion: 9 }))).toThrow(ExerciseSnapshotDataError);
    expect(() => parseExerciseSnapshot("{")).toThrow(ExerciseSnapshotDataError);
  });
});

describe("PRE-4 story 1.1 — Instantanés versionnés (AD-3)", () => {
  it("PRE4-1.1/AC2, PRE5-1.1/AC11 — un nouvel Instantané est en version 3, paramètres typés sérialisés en v3 (AD-18)", () => {
    const snapshot = createExerciseSnapshot({
      sourceMovementId: "mov-1",
      name: "Gainage",
      categoryId: null,
      bodyZoneIds: [],
      executionParameters: canonical(),
      recoverySeconds: 0,
      media: [],
    });
    expect(snapshot.snapshotVersion).toBe(EXERCISE_SNAPSHOT_VERSION);
    expect(EXERCISE_SNAPSHOT_VERSION).toBe(3);
    const raw = JSON.parse(serializeExerciseSnapshot(snapshot));
    expect(raw.snapshotVersion).toBe(3);
    // PRE-7 (D-446, R-2) : paramètres sérialisés dans la version courante, v5.
    expect(raw.executionParameters.version).toBe(5);
    expect(raw.executionParameters.series.rows[0]).toEqual({ target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10, loadKg: 0 });
    expect(parseExerciseSnapshot(serializeExerciseSnapshot(snapshot))).toEqual(snapshot);
  });

  it("PRE4-1.1/AC3 — une enveloppe v1 est relue selon sa version, sans réécriture (Cibles typées)", () => {
    const v1 = JSON.stringify({
      snapshotVersion: 1,
      name: "Pompes",
      categoryId: null,
      bodyZoneIds: [],
      executionParameters: {
        version: 1,
        mode: "REPETITIONS",
        series: { kind: "UNIFORM", count: 3, target: 12, pauseSeconds: 10 },
        sideMode: "UNILATERAL",
        sideOrder: "BY_SIDE",
        sideRecoverySeconds: 0,
        cadenceBeepIntervalSeconds: 2,
        countdownSeconds: 0,
        endSeconds: 0,
      },
      recoverySeconds: 0,
      media: [],
      actualDurationSeconds: null,
    });
    const reread = parseExerciseSnapshot(v1);
    expect(reread.snapshotVersion).toBe(1);
    expect(reread.executionParameters.series).toEqual({ kind: "UNIFORM", count: 3, target: numberTarget(12), pauseSeconds: 10, loadKg: 0, workPhases: [] });
    expect(reread.actualDurationSeconds).toBeNull();

    // Re-sérialisé, il est écrit en version courante (3, paramètres v3) et se relit à l'identique hors version.
    const rewritten = serializeExerciseSnapshot(reread);
    expect(JSON.parse(rewritten).snapshotVersion).toBe(3);
    const roundTrip = parseExerciseSnapshot(rewritten);
    expect(roundTrip).toEqual({ ...reread, snapshotVersion: 3 });
  });
});

/**
 * PRE-4 story 1.3 — Instantanés v1 relus selon leur version, jamais réécrits ;
 * nouveaux Instantanés v2 typés et gelés (AD-3, H11 : aucun Instantané n'est
 * stocké en base dans le code de départ, les enveloppes sont en mémoire).
 */
describe("PRE-4 story 1.3 — Instantanés", () => {
  function v1Envelope(parameters: Record<string, unknown>, actualDurationSeconds: number | null): string {
    return JSON.stringify({
      snapshotVersion: 1,
      name: "Pompes",
      categoryId: "renforcement",
      bodyZoneIds: ["bras"],
      executionParameters: parameters,
      recoverySeconds: 30,
      media: [{ position: 0, asset: photo }],
      actualDurationSeconds,
    });
  }

  const withoutBeep = v1Envelope(
    {
      version: 1,
      mode: "DURATION",
      series: { kind: "UNIFORM", count: 2, target: 40, pauseSeconds: 10 },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      countdownSeconds: 3,
      endSeconds: 0,
    },
    null,
  );
  const legacyFailure = v1Envelope(
    {
      version: 1,
      mode: ["TO", "FAILURE"].join("_"),
      series: { kind: "UNIFORM", count: 3, target: null, pauseSeconds: 15 },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 0,
      endSeconds: 0,
    },
    null,
  );
  const withActualDuration = v1Envelope(
    {
      version: 1,
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 3, target: 12, pauseSeconds: 10 },
      sideMode: "UNILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 2,
      countdownSeconds: 0,
      endSeconds: 0,
    },
    95,
  );

  it("PRE4-1.3/AC9 — v1 relus selon leur version (lecture seule, sans réécriture) : Bip absent → 0, ancien mode à l'échec → 3 Cibles FAILURE, durée réalisée NULL/95 sans recalcul", () => {
    const envelopes = [withoutBeep, legacyFailure, withActualDuration];
    const reread = envelopes.map((json) => parseExerciseSnapshot(json));

    expect(reread.map((snapshot) => snapshot.snapshotVersion)).toEqual([1, 1, 1]);

    // Sans clé Bip : non cadencé (ch. 09, « absent dans ancien snapshot = non cadencé »).
    expect(reread[0]!.executionParameters.cadenceBeepIntervalSeconds).toBe(0);
    expect(reread[0]!.executionParameters.series).toEqual({ kind: "UNIFORM", count: 2, target: numberTarget(40), pauseSeconds: 10, loadKg: 0, workPhases: [] });

    // Ancien mode à l'échec : Répétitions, 3 Cibles FAILURE, aucun nombre de répétitions.
    expect(reread[1]!.executionParameters.mode).toBe("REPETITIONS");
    expect(reread[1]!.executionParameters.series).toEqual({ kind: "UNIFORM", count: 3, target: failureTarget(), pauseSeconds: 15, loadKg: 0, workPhases: [] });
    expect(JSON.stringify(reread[1]!.executionParameters.series)).not.toMatch(/"value"/);

    // Durée réalisée : NULL reste NULL (jamais 0), 95 reste 95.
    expect(reread[0]!.actualDurationSeconds).toBeNull();
    expect(reread[1]!.actualDurationSeconds).toBeNull();
    expect(reread[2]!.actualDurationSeconds).toBe(95);
  });

  it("PRE4-1.3/AC9 — v1 à Bip `null` : non cadencé ; paramètres illisibles : erreur de l'Instantané, message d'origine conservé", () => {
    const parameters = (JSON.parse(withActualDuration) as { executionParameters: Record<string, unknown> }).executionParameters;
    const nullBeep = v1Envelope({ ...parameters, cadenceBeepIntervalSeconds: null }, null);
    expect(parseExerciseSnapshot(nullBeep).executionParameters.cadenceBeepIntervalSeconds).toBe(0);

    const negative = v1Envelope({ ...parameters, series: { kind: "UNIFORM", count: 3, target: -3, pauseSeconds: 10 } }, null);
    let thrown: unknown = null;
    try {
      parseExerciseSnapshot(negative);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ExerciseSnapshotDataError);
    expect((thrown as Error).message).toMatch(/Unreadable legacy execution parameters: target is negative or not an integer/);
  });

  it("PRE4-1.3/AC10 — nouvel Instantané (v3 depuis PRE-5) : types, valeurs, ordre et Bip unique restitués ; Médias par référence et ordonnés ; gelé", () => {
    const parameters: ExecutionParameters = {
      ...canonical(),
      series: {
        kind: "VARIABLE",
        rows: [
          { target: numberTarget(30), pauseSeconds: 10, loadKg: 0 },
          { target: failureTarget(), pauseSeconds: 20, loadKg: 0 },
          { target: numberTarget(45), pauseSeconds: 30, loadKg: 0 },
        ],
        workPhases: [],
      },
      sideMode: "RIGHT_LEFT",
      cadenceBeepIntervalSeconds: 2,
    };
    const third: MediaAsset = { ...photo, id: "asset-third", uri: "kodjo-media/asset-third.jpg" };
    const copy = {
      sourceMovementId: "mov-1",
      name: "Fentes",
      categoryId: "renforcement",
      bodyZoneIds: ["cuisses", "fessiers"],
      executionParameters: cloneExecutionParameters(parameters),
      recoverySeconds: 40,
      media: [{ asset: { ...video } }, { asset: { ...photo } }, { asset: { ...third } }],
    };
    const snapshot = createExerciseSnapshot(copy);
    const reread = parseExerciseSnapshot(serializeExerciseSnapshot(snapshot));

    expect(reread.snapshotVersion).toBe(3);
    expect(reread.executionParameters).toEqual(parameters);
    // Un seul Bip, au niveau de l'Exercice : aucune clé de Bip par Série ni par côté.
    const raw = JSON.parse(serializeExerciseSnapshot(snapshot)) as { executionParameters: { series: { rows: object[] } } };
    expect(raw.executionParameters.series.rows.every((row) => Object.keys(row).sort().join() === "loadKg,pauseSeconds,target")).toBe(true); // PRE-5 (AD-18) : la charge suit la ligne.
    expect(JSON.stringify(raw).match(/cadenceBeepIntervalSeconds/g)).toHaveLength(1);
    // Médias : même ordre, mêmes fichiers (référence par URI), aucune copie de contenu.
    expect(reread.media.map((item) => [item.position, item.asset.id, item.asset.uri])).toEqual([
      [0, "asset-video", video.uri],
      [1, "asset-photo", photo.uri],
      [2, "asset-third", third.uri],
    ]);

    // Modifier ensuite la Copie ne change pas l'Instantané (objet gelé, copie profonde).
    (copy.executionParameters.series as unknown as { rows: { target: unknown }[] }).rows[1]!.target = numberTarget(8);
    copy.media.reverse();
    (copy.bodyZoneIds as string[]).push("dos");
    expect(snapshot.executionParameters).toEqual(parameters);
    expect(snapshot.media.map((item) => item.asset.id)).toEqual(["asset-video", "asset-photo", "asset-third"]);
    expect(snapshot.bodyZoneIds).toEqual(["cuisses", "fessiers"]);
    expect(Object.isFrozen(snapshot.executionParameters.series)).toBe(true);
    expect(Object.isFrozen(snapshot.media)).toBe(true);
  });
});

describe("PRE-5 story 1.1 — Instantanés v3 (AD-18, FR-41)", () => {
  const loaded = (): ExecutionParameters => ({
    ...canonical(),
    series: {
      kind: "UNIFORM",
      count: 3,
      target: numberTarget(9),
      pauseSeconds: 15,
      loadKg: 2.5,
      workPhases: [
        { id: 3, label: "Descente", durationSeconds: 6 },
        { id: 1, label: "Maintien", durationSeconds: 3 },
      ],
    },
    sideMode: "LEFT_RIGHT",
    loadEnabled: false,
  });

  it("PRE5-1.1/AC11 — phases (identités comprises) et charge sous Sans traversent l'Instantané v3 ; une copie isolée de la source", () => {
    const source = loaded();
    const snapshot = createExerciseSnapshot({ sourceMovementId: "mov-1", name: "Squat", categoryId: null, bodyZoneIds: [], executionParameters: source, recoverySeconds: 0, media: [] });
    const reread = parseExerciseSnapshot(serializeExerciseSnapshot(snapshot));
    expect(reread.executionParameters).toEqual(loaded());
    (source.series as unknown as { workPhases: { label: string }[] }).workPhases[0]!.label = "Modifiée";
    expect(snapshot.executionParameters).toEqual(loaded());
  });

  it("PRE5-1.1/AC11 — une enveloppe v2 (paramètres v2) reste lisible : sans phases, charge Sans", () => {
    const v2 = JSON.stringify({
      snapshotVersion: 2,
      name: "Gainage",
      categoryId: null,
      bodyZoneIds: [],
      executionParameters: {
        version: 2,
        mode: "DURATION",
        series: { kind: "UNIFORM", count: 3, target: { kind: "NUMBER", value: 30 }, pauseSeconds: 10 },
        sideMode: "UNILATERAL",
        sideOrder: "BY_SIDE",
        sideRecoverySeconds: 0,
        cadenceBeepIntervalSeconds: 0,
        countdownSeconds: 0,
        endSeconds: 0,
      },
      recoverySeconds: 0,
      media: [],
      actualDurationSeconds: 95,
    });
    const reread = parseExerciseSnapshot(v2);
    expect(reread.snapshotVersion).toBe(2);
    expect(reread.executionParameters.loadEnabled).toBe(false);
    expect(reread.executionParameters.series).toEqual({
      kind: "UNIFORM",
      count: 3,
      target: numberTarget(30),
      pauseSeconds: 10,
      loadKg: 0,
      workPhases: [],
    });
    expect(reread.actualDurationSeconds).toBe(95);
  });

  it("PRE5-1.1/AC11 — paramètres v3 incomplets dans une enveloppe : erreur explicite de l'Instantané", () => {
    const raw = JSON.parse(
      serializeExerciseSnapshot(createExerciseSnapshot({ sourceMovementId: "mov-1", name: "x", categoryId: null, bodyZoneIds: [], executionParameters: loaded(), recoverySeconds: 0, media: [] })),
    ) as { executionParameters: Record<string, unknown> };
    delete raw.executionParameters.loadEnabled;
    expect(() => parseExerciseSnapshot(JSON.stringify(raw))).toThrow(ExerciseSnapshotDataError);
  });
});
