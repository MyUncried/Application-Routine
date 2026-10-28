import { describe, expect, it } from "@jest/globals";

import {
  allFailureParameters,
  durationParameters,
  repetitionParameters,
  uniformParameters,
} from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import type { StructureCircuit, StructureElement } from "@/domain/sessions/structure";
import {
  formatCatalogueVolume,
  projectSessionForCatalogue,
  type CatalogueCategoryRef,
} from "@/features/sessions/sessionCatalogueProjection";

/**
 * PRE-8 (epic E, story E.1) — projection de lecture du Catalogue unifié des Séances : compte D-449 §6,
 * catégories, zones, visuel, synthèse, durée et arbre (spécification du 27/10, §1 et §2).
 */

const CATEGORIES = new Map<string, CatalogueCategoryRef>([
  ["mobilite", { id: "mobilite", name: "Mobilité", color: "#2E9B62" }],
  ["renfo", { id: "renfo", name: "Renforcement", color: "#E5484D" }],
  ["cardio", { id: "cardio", name: "Cardio", color: "#3B82F6" }],
]);

const photo = (id: string): MediaAsset =>
  ({ id, kind: "IMAGE", uri: `media/${id}.jpg`, mimeType: "image/jpeg" }) as unknown as MediaAsset;

let sequence = 0;
const exercise = (overrides: Partial<Activity> & { readonly name: string }): Activity => ({
  id: overrides.id ?? `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  executionParameters: durationParameters(45),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  categoryId: "renfo",
  media: [],
  sourceMovementId: `mv-${overrides.name}`,
  ...overrides,
});

const withMedia = (activity: Activity, assetId: string): Activity => ({
  ...activity,
  media: [{ id: `link-${assetId}`, activityId: activity.id, assetId, position: 0, asset: photo(assetId) }],
});

const circuit = (id: string, exercises: readonly Activity[], repeatCount = 1, nature: "TOURS" | "SERIES" = "TOURS"): StructureCircuit<Activity> => ({
  id,
  repeatCount,
  nature,
  exercises,
});

const record = (elements: readonly StructureElement<Activity>[], overrides: Partial<CatalogueSessionRecord> = {}): CatalogueSessionRecord => ({
  id: "s-1",
  name: "Renforcement du genou",
  color: "#3B82F6",
  labelId: null,
  status: "ACTIVE",
  archivedAt: null,
  updatedAt: "2026-10-28T08:00:00.000Z",
  structure: { elements, stopPoints: [] },
  ...overrides,
});

const project = (elements: readonly StructureElement<Activity>[], overrides: Partial<CatalogueSessionRecord> = {}) =>
  projectSessionForCatalogue(record(elements, overrides), CATEGORIES);

describe("PRE-8 E.1 — compte et synthèse", () => {
  it("Séance sans exercice : « 0 exercice » (D-392, Q-E6), visuel Libre, aucune catégorie", () => {
    const projection = project([]);
    expect(projection.exerciseCount).toBe(0);
    expect(projection.summary).toEqual({ kind: "COUNT", count: 0 });
    expect(projection.visual).toEqual({ kind: "FORMAT", format: "FREE" });
    expect(projection.expandable).toBe(false);
    expect(projection.categories).toEqual([]);
    expect(projection.tree).toEqual([]);
  });

  it("un seul exercice : volume, jamais « 1 exercice », aucun chevron", () => {
    const one = project([{ kind: "EXERCISE", exercise: exercise({ name: "Squat assisté", executionParameters: durationParameters(90, 3, 30) }) }]);
    expect(one.exerciseCount).toBe(1);
    expect(one.summary).toEqual({ kind: "VOLUME", volume: "3 × 1 min 30 s" });
    expect(one.expandable).toBe(false);
    const single = project([{ kind: "EXERCISE", exercise: exercise({ name: "Mobilisation du genou" }) }]);
    expect(single.summary).toEqual({ kind: "VOLUME", volume: "1 × 45 s" });
  });

  it("volume : formes existantes reprises (échec, répétitions, séries variables)", () => {
    expect(formatCatalogueVolume(exercise({ name: "a", executionParameters: repetitionParameters(12, 3) }))).toBe("3 × 12 rép.");
    expect(formatCatalogueVolume(exercise({ name: "b", executionParameters: allFailureParameters(2) }))).toBe("2 séries à l’échec");
    expect(
      formatCatalogueVolume(exercise({ name: "c", executionParameters: uniformParameters({ count: 1, target: "UNSET" }) })),
    ).toBe("Paramètres à compléter.");
  });

  it("plusieurs exercices : compte sans multiplier par séries, tours ni répétitions de Cycle ; même Mouvement compté deux fois", () => {
    const squat = (id: string) => exercise({ id, name: "Squat", sourceMovementId: "mv-squat", executionParameters: durationParameters(30, 4) });
    const projection = project([
      { kind: "EXERCISE", exercise: squat("a") },
      {
        kind: "CYCLE",
        cycle: { id: "cy", repeatCount: 3, circuits: [circuit("c1", [squat("b"), squat("c")], 5), circuit("c2", [squat("d")], 2)] },
      },
    ]);
    expect(projection.exerciseCount).toBe(4);
    expect(projection.summary).toEqual({ kind: "COUNT", count: 4 });
    expect(projection.expandable).toBe(true);
  });

  it("les récupérations ne comptent pas (récupération attachée et ancienne Récupération autonome)", () => {
    const recovery: Activity = { ...exercise({ name: "" }), type: "RECOVERY", executionParameters: durationParameters(60) };
    const projection = project([
      { kind: "EXERCISE", exercise: exercise({ name: "A", postActivityRecoverySeconds: 30 }) },
      { kind: "EXERCISE", exercise: recovery },
      { kind: "EXERCISE", exercise: exercise({ name: "B" }) },
    ]);
    expect(projection.exerciseCount).toBe(2);
    expect(projection.tree.map((line) => line.kind)).toEqual(["EXERCISE", "RECOVERY", "RECOVERY", "EXERCISE"]);
  });
});

describe("PRE-8 E.1 — catégories, zones, étiquette", () => {
  it("catégories dédupliquées dans l'ordre de première apparition ; zones agrégées pour les filtres", () => {
    const projection = project([
      { kind: "EXERCISE", exercise: exercise({ name: "A", categoryId: "mobilite", bodyZoneIds: ["genoux"] }) },
      { kind: "CIRCUIT", circuit: circuit("c", [exercise({ name: "B", categoryId: "renfo", bodyZoneIds: ["dos", "genoux"] }), exercise({ name: "C", categoryId: "mobilite" })], 2) },
      { kind: "EXERCISE", exercise: exercise({ name: "D", categoryId: "inconnue" }) },
    ], { labelId: "lbl-hyrox" });
    expect(projection.categories.map((category) => category.name)).toEqual(["Mobilité", "Renforcement"]);
    expect(projection.bodyZoneIds).toEqual(["genoux", "dos"]);
    expect(projection.labelId).toBe("lbl-hyrox");
  });
});

describe("PRE-8 E.1 — cascade du visuel", () => {
  it("photo de l'exercice unique", () => {
    const projection = project([{ kind: "EXERCISE", exercise: withMedia(exercise({ name: "A" }), "p1") }]);
    expect(projection.visual).toEqual({ kind: "MEDIA", source: { uri: "media/p1.jpg", isVideo: false } });
  });

  it("sinon première photo dans l'ordre de composition, sinon Libre", () => {
    const withPhoto = project([
      { kind: "EXERCISE", exercise: exercise({ name: "Sans photo" }) },
      { kind: "CIRCUIT", circuit: circuit("c", [withMedia(exercise({ name: "B" }), "p2"), withMedia(exercise({ name: "C" }), "p3")], 3) },
    ]);
    expect(withPhoto.visual).toEqual({ kind: "MEDIA", source: { uri: "media/p2.jpg", isVideo: false } });
    const without = project([{ kind: "EXERCISE", exercise: exercise({ name: "A" }) }, { kind: "EXERCISE", exercise: exercise({ name: "B" }) }]);
    expect(without.visual).toEqual({ kind: "FORMAT", format: "FREE" });
    expect(without.format).toBe("FREE");
  });
});

describe("PRE-8 E.1 — durée", () => {
  it("durée par l'autorité du Domaine (Cycles et Circuits compris)", () => {
    const projection = project([
      { kind: "EXERCISE", exercise: exercise({ name: "A", executionParameters: durationParameters(30) }) },
      { kind: "CYCLE", cycle: { id: "cy", repeatCount: 2, circuits: [circuit("c", [exercise({ name: "B", executionParameters: durationParameters(30) })], 3)] } },
    ]);
    expect(projection.duration).toEqual({ kind: "exact", seconds: 30 + 2 * 3 * 30 });
  });

  it("répétitions : borne minimale (≥)", () => {
    const projection = project([{ kind: "EXERCISE", exercise: exercise({ name: "A", executionParameters: repetitionParameters(10, 3) }) }]);
    expect(projection.duration.kind).toBe("lowerBound");
  });
});

describe("PRE-8 E.1 — arbre de la composition", () => {
  it("Cycle et Circuit montrés, membres décalés, deux décalages au plus, ordre conservé", () => {
    const projection = project([
      { kind: "EXERCISE", exercise: exercise({ id: "warm", name: "Mobilisation du genou" }) },
      {
        kind: "CYCLE",
        cycle: {
          id: "cy",
          repeatCount: 2,
          circuits: [
            circuit("c1", [
              exercise({ id: "sq", name: "Squat assisté", executionParameters: repetitionParameters(12, 3) }),
              exercise({ id: "ext", name: "Extension de jambe", executionParameters: durationParameters(45, 2), postActivityRecoverySeconds: 60 }),
            ], 3),
          ],
        },
      },
      { kind: "EXERCISE", exercise: exercise({ id: "cool", name: "Étirement ischio-jambiers", executionParameters: durationParameters(30) }) },
    ]);
    expect(projection.tree).toEqual([
      { kind: "EXERCISE", key: "warm", depth: 0, name: "Mobilisation du genou", volume: "45 s" },
      { kind: "CYCLE", key: "cy", depth: 0, repeatCount: 2 },
      { kind: "CIRCUIT", key: "c1", depth: 1, repeatCount: 3, nature: "TOURS" },
      { kind: "EXERCISE", key: "sq", depth: 2, name: "Squat assisté", volume: "3 × 12 rép." },
      { kind: "EXERCISE", key: "ext", depth: 2, name: "Extension de jambe", volume: "2 × 45 s" },
      { kind: "RECOVERY", key: "ext:recovery", depth: 2, seconds: 60 },
      { kind: "EXERCISE", key: "cool", depth: 0, name: "Étirement ischio-jambiers", volume: "30 s" },
    ]);
    expect(Math.max(...projection.tree.map((line) => line.depth))).toBe(2);
  });

  it("conteneur masqué seulement s'il ne se répète pas et ne contient qu'un exercice", () => {
    const projection = project([
      { kind: "CIRCUIT", circuit: circuit("trivial", [exercise({ id: "a", name: "A" })], 1) },
      { kind: "CIRCUIT", circuit: circuit("repeated", [exercise({ id: "b", name: "B" })], 2, "SERIES") },
      { kind: "CYCLE", cycle: { id: "cy1", repeatCount: 1, circuits: [circuit("inner", [exercise({ id: "c", name: "C" })], 1)] } },
      { kind: "CIRCUIT", circuit: circuit("pair", [exercise({ id: "d", name: "D" }), exercise({ id: "e", name: "E" })], 1) },
    ]);
    expect(projection.tree.map((line) => [line.kind, line.key, line.depth])).toEqual([
      ["EXERCISE", "a", 0],
      ["CIRCUIT", "repeated", 0],
      ["EXERCISE", "b", 1],
      ["EXERCISE", "c", 0],
      ["CIRCUIT", "pair", 0],
      ["EXERCISE", "d", 1],
      ["EXERCISE", "e", 1],
    ]);
  });

  it("Cycle non répété de plusieurs Circuits : le Cycle est montré (il contient plusieurs exercices)", () => {
    const projection = project([
      { kind: "CYCLE", cycle: { id: "cy", repeatCount: 1, circuits: [circuit("x", [exercise({ id: "a", name: "A" })]), circuit("y", [exercise({ id: "b", name: "B" })])] } },
    ]);
    expect(projection.tree.map((line) => [line.kind, line.depth])).toEqual([
      ["CYCLE", 0],
      ["EXERCISE", 1],
      ["EXERCISE", 1],
    ]);
  });
});

describe("PRE-8 E.1 — lecture seule et identité", () => {
  it("la projection ne modifie pas l'enregistrement ; un changement de composition garde l'identité", () => {
    const source = record([{ kind: "EXERCISE", exercise: exercise({ id: "a", name: "A" }) }]);
    const frozen = JSON.stringify(source);
    const first = projectSessionForCatalogue(source, CATEGORIES);
    expect(JSON.stringify(source)).toBe(frozen);
    const changed = projectSessionForCatalogue(
      { ...source, structure: { elements: [...source.structure.elements, { kind: "EXERCISE", exercise: exercise({ id: "b", name: "B" }) }], stopPoints: [] } },
      CATEGORIES,
    );
    expect(changed.id).toBe(first.id);
    expect(changed.exerciseCount).toBe(2);
    expect(changed.name).toBe(first.name);
  });

  it("une Séance archivée se projette de la même manière, statut conservé", () => {
    const projection = project([{ kind: "EXERCISE", exercise: exercise({ name: "A" }) }], { status: "ARCHIVED", archivedAt: "2026-10-28T09:00:00.000Z" });
    expect(projection.status).toBe("ARCHIVED");
  });
});
