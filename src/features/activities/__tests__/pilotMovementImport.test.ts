import { describe, expect, it } from "@jest/globals";

import type { Movement } from "@/domain/activities/Movement";
import { normalizeMovementName } from "@/domain/activities/Movement";
import {
  installPilotMovements,
  preparePilotMovementImport,
  PILOT_IMPORT_COUNT,
} from "@/features/activities/pilotMovementImport";

function emptyDraft() {
  return {
    schemaVersion: "0.1.0",
    kind: "KODJO_ADMIN_DRAFTS",
    publicationAllowed: false,
    movementEdits: {} as Record<string, unknown>,
    referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
    referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} },
    glossary: [],
  };
}

function fakeCatalogue(initial: Movement[] = []) {
  const stored = new Map(initial.map((item) => [item.id, item]));
  let writes = 0;
  return {
    stored,
    get writes() { return writes; },
    async listEntries() {
      return [...stored.values()].map((movement) => ({
        movement,
        level: null,
        exerciseCount: 0,
        archived: false,
      }));
    },
    async createIndependent(movement: Movement) {
      writes++;
      const conflict = [...stored.values()].find((old) => normalizeMovementName(old.name) === normalizeMovementName(movement.name));
      if (conflict) return { status: "DUPLICATE_NAME" as const };
      stored.set(movement.id, movement);
      return { status: "SAVED" as const, movement };
    },
  };
}

describe("Passerelle administration OVH → KODJO local", () => {
  it("transforme les 60 fiches sans publier ni fabriquer d'Exercice", () => {
    const preview = preparePilotMovementImport(emptyDraft());
    expect(preview.movements).toHaveLength(PILOT_IMPORT_COUNT);
    expect(new Set(preview.movements.map((m) => m.id)).size).toBe(60);
    expect(preview.movements.every((m) => m.bodyZoneIds.length && m.categoryId && m.levelGroup === null)).toBe(true);
    expect(preview.movements.every((m) => m.media.length === 0 && m.phases.length === 0)).toBe(true);
    expect(preview.editorialMetadataImported).toBe(false);
    expect(preview.excludedMediaCount).toBe(0);
  });

  it("les modifications admin sont appliquées et les photos explicitement comptées comme exclues", () => {
    const source = emptyDraft();
    source.movementEdits["pilot:FIT-CRO-001"] = {
      name: "Air squat — personnalisé",
      steps: ["Position de départ.", "Flexion des genoux.", "Remontez."],
      aliases: ["Squat simple"],
      categoryId: "coordination",
      bodyZoneIds: ["cuisses"],
      media: [{ id: "m-1", kind: "PHOTO", dataUri: "data:image/jpeg;base64,AA==" }],
    };
    const preview = preparePilotMovementImport(source);
    const squat = preview.movements.find((m) => m.id === "pilot:FIT-CRO-001");
    expect(squat).toMatchObject({
      name: "Air squat — personnalisé",
      description: "Position de départ.\nFlexion des genoux.\nRemontez.",
      aliases: ["Squat simple"],
      categoryId: "coordination",
      bodyZoneIds: ["cuisses"],
      media: [],
    });
    expect(preview.overriddenCount).toBe(1);
    expect(preview.excludedMediaCount).toBe(1);
  });

  it("refuse un ancien brouillon de démonstration sans perte", () => {
    const d = emptyDraft();
    d.movementEdits["demo:AIR-SQUAT"] = { name: "Air squat" };
    expect(() => preparePilotMovementImport(d)).toThrow(/étranger au pilote/);
  });

  it("refuse les valeurs de nom / étapes invalides avant la première écriture", () => {
    const d = emptyDraft();
    d.movementEdits["pilot:FIT-CRO-001"] = {
      name: "", steps: [], aliases: [], categoryId: null, bodyZoneIds: [], media: [],
    };
    expect(() => preparePilotMovementImport(d)).toThrow(/pilot:FIT-CRO-001/);
  });

  it("installe 60 mouvements locaux et est idempotent", async () => {
    const preview = preparePilotMovementImport(emptyDraft());
    const db = fakeCatalogue();
    const first = await installPilotMovements(db, preview);
    expect(first).toEqual({ inserted: 60, unchanged: 0 });
    const second = await installPilotMovements(db, preview);
    expect(second).toEqual({ inserted: 0, unchanged: 60 });
    expect(db.writes).toBe(60);
    expect(db.stored.size).toBe(60);
  });

  it("refuse un nom déjà utilisé : aucun mouvement n'est écrit", async () => {
    const preview = preparePilotMovementImport(emptyDraft());
    const existing: Movement = { ...preview.movements[0]!, id: "private-existing" };
    const db = fakeCatalogue([existing]);
    await expect(installPilotMovements(db, preview)).rejects.toThrow(/déjà utilisé/);
    expect(db.writes).toBe(0);
    expect(db.stored.size).toBe(1);
  });

  it("refuse une fiche déjà importée mais modifiée sur le téléphone : aucune écriture", async () => {
    const preview = preparePilotMovementImport(emptyDraft());
    const existing: Movement = { ...preview.movements[0]!, name: "Personnalisé sur iPhone" };
    const db = fakeCatalogue([existing]);
    await expect(installPilotMovements(db, preview)).rejects.toThrow(/contenu différent/);
    expect(db.writes).toBe(0);
  });
});