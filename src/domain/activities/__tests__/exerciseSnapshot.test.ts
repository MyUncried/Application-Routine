import { describe, expect, it } from "@jest/globals";

import type { ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import { phraseText, generateExecutionPhrase } from "@/domain/activities/executionPhrase";
import {
  createExerciseSnapshot,
  parseExerciseSnapshot,
  serializeExerciseSnapshot,
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
    version: 1,
    mode: "DURATION",
    series: {
      kind: "VARIABLE",
      rows: [
        { target: 30, pauseSeconds: 10 },
        { target: 45, pauseSeconds: 20 },
        { target: 60, pauseSeconds: 30 },
      ],
    },
    sideMode: "RIGHT_LEFT",
    sideOrder: "BY_SERIES",
    sideRecoverySeconds: 15,
    cadenceBeepIntervalSeconds: 4,
    countdownSeconds: 10,
    endSeconds: 5,
  };
}

describe("P3-18/copy-complete — instantané complet et immuable", () => {
  it("paramètres, Catégorie, médias ordonnés et métadonnées ; même fichier physique", () => {
    const source = {
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
      name: "A",
      categoryId: null,
      bodyZoneIds: ["z"],
      executionParameters: parameters,
      recoverySeconds: 0,
      media,
    });
    (parameters.series as unknown as { rows: { target: number }[] }).rows[0]!.target = 999;
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
