import { describe, expect, it } from "@jest/globals";

import {
  CatalogueEditError,
  joinSheetFamily,
  leaveSheetFamily,
  moveSheetInFamily,
  sheetFamilies,
} from "@/domain/catalogue/catalogueEditing";
import { catalogueFamilyAction, catalogueFamilyGroupId, orderedCatalogueFamily } from "@/domain/catalogue/catalogueFamilies";
import {
  parseMovementCatalogueFile,
  sheetFingerprint,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";

/** Familles de niveaux des fiches (décision de Hermann du 11/11/2026) : format, édition, placement sur le téléphone. */

function sheet(sheetId: string, levelGroup?: { groupId: string; sortKey: number } | null): CatalogueSheet {
  return {
    sheetId, revision: "1", history: [{ revision: "1", date: "2026-11-11", author: null, summary: "Création" }],
    provenance: {
      gestureId: null, origin: "LOCAL_CREATED", upstream: null, owner: null, author: null, publisher: null,
      rightsHolder: null, license: null, reviewStatus: "DRAFT", visibility: "PRIVATE",
    },
    content: { name: "Fiche " + sheetId, aliases: [], startingPosition: null, equipment: null, steps: ["Étape"], safetyNotes: null, notes: "" },
    classification: {
      categoryId: "renforcement", bodyZoneIds: ["epaules"], specialtyIds: [], gesturalFamilyIds: [], clinicalProblemIds: [],
      anatomicalTargetIds: [], basis: "TEST", review: null, original: {}, originalProposedSpecialties: [],
    },
    sources: { documentary: null, prescriptionContext: {} },
    validation: { classification: "P", clinical: "P", rights: "P", corpusReview: null, licensing: null, clinicalValidation: null, publicationAllowed: false },
    media: [],
    ...(levelGroup === undefined ? {} : { levelGroup }),
    install: { knownLocalMovementIds: [] },
  } as CatalogueSheet;
}

function file(...sheets: CatalogueSheet[]): MovementCatalogueFile {
  return {
    format: "KODJO_MOVEMENT_CATALOGUE", formatVersion: "2.0.0",
    catalogue: { id: "test", title: "Test", revision: "1", owner: null, manager: null, publisher: null, publicationAllowed: false, notes: [] },
    references: {
      categories: [{ id: "renforcement", label: "Renforcement", kind: null, status: null }],
      bodyZones: [{ id: "epaules", label: "Épaules", kind: null, status: null }],
      specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [],
    },
    glossary: [], libraries: [], sheets,
  } as unknown as MovementCatalogueFile;
}

const levels = (value: MovementCatalogueFile) => Object.fromEntries(value.sheets.map((entry) => [entry.sheetId, entry.levelGroup ?? null]));

describe("format", () => {
  it("lit une fiche sans famille (ancien fichier) et garde son empreinte", () => {
    expect(parseMovementCatalogueFile(file(sheet("A"))).ok).toBe(true);
    expect(sheetFingerprint(sheet("A", null))).toBe(sheetFingerprint(sheet("A")));
  });

  it("l'empreinte change avec l'appartenance ou la position", () => {
    const base = sheetFingerprint(sheet("A", { groupId: "g", sortKey: 0 }));
    expect(sheetFingerprint(sheet("A"))).not.toBe(base);
    expect(sheetFingerprint(sheet("A", { groupId: "g", sortKey: 1 }))).not.toBe(base);
    expect(sheetFingerprint(sheet("A", { groupId: "h", sortKey: 0 }))).not.toBe(base);
  });

  it("refuse une famille invalide et deux fiches à la même position d'une famille", () => {
    const invalid = parseMovementCatalogueFile(file(sheet("A", { groupId: "", sortKey: 0 })));
    expect(invalid.ok ? [] : invalid.issues).toContainEqual({ path: "sheets[0].levelGroup", code: "INVALID" });
    const duplicate = parseMovementCatalogueFile(file(sheet("A", { groupId: "g", sortKey: 0 }), sheet("B", { groupId: "g", sortKey: 0 })));
    expect(duplicate.ok ? [] : duplicate.issues).toContainEqual({ path: "sheets[1].levelGroup.sortKey", code: "DUPLICATE", detail: "g" });
  });
});

describe("édition dans l'administration", () => {
  it("crée une famille (cible niveau 1) puis rattache au niveau le plus élevé", () => {
    let edited = joinSheetFamily(file(sheet("A"), sheet("B"), sheet("C")), "B", "A", "g");
    edited = joinSheetFamily(edited, "C", "A", "ignoré");
    expect(levels(edited)).toEqual({ A: { groupId: "g", sortKey: 0 }, B: { groupId: "g", sortKey: 1 }, C: { groupId: "g", sortKey: 2 } });
    expect(sheetFamilies(edited)[0]!.sheets.map((entry) => entry.sheetId)).toEqual(["A", "B", "C"]);
  });

  it("une fiche déjà dans une famille ne change pas de famille sans la quitter (règle C6)", () => {
    const value = file(sheet("A", { groupId: "g", sortKey: 0 }), sheet("B", { groupId: "g", sortKey: 1 }), sheet("C"), sheet("D"));
    expect(() => joinSheetFamily(value, "A", "C", "h")).toThrow(CatalogueEditError);
  });

  it("réordonner n'échange que deux positions", () => {
    const value = file(sheet("A", { groupId: "g", sortKey: 0 }), sheet("B", { groupId: "g", sortKey: 1 }), sheet("C", { groupId: "g", sortKey: 2 }));
    const moved = moveSheetInFamily(value, "C", -1);
    expect(levels(moved)).toEqual({ A: { groupId: "g", sortKey: 0 }, B: { groupId: "g", sortKey: 2 }, C: { groupId: "g", sortKey: 1 } });
    expect(moveSheetInFamily(value, "A", -1)).toBe(value);
  });

  it("détacher : seule la fiche sort ; l'avant-dernier membre dissout la famille (règle D2)", () => {
    const value = file(sheet("A", { groupId: "g", sortKey: 0 }), sheet("B", { groupId: "g", sortKey: 1 }), sheet("C", { groupId: "g", sortKey: 2 }));
    const left = leaveSheetFamily(value, "B");
    expect(levels(left)).toEqual({ A: { groupId: "g", sortKey: 0 }, B: null, C: { groupId: "g", sortKey: 2 } });
    expect(levels(leaveSheetFamily(left, "A"))).toEqual({ A: null, B: null, C: null });
  });
});

describe("placement sur le téléphone", () => {
  const ns = catalogueFamilyGroupId("cat", "g");
  const group = (sortKey: number) => ({ groupId: "g", sortKey });

  it("identifiant propre au catalogue", () => {
    expect(catalogueFamilyGroupId("a", "g")).not.toBe(catalogueFamilyGroupId("b", "g"));
  });

  it("installation et rattachement : placer, sauf appartenance locale à une autre famille", () => {
    expect(catalogueFamilyAction({ catalogueId: "cat", base: undefined, incoming: group(0), localGroupId: null }))
      .toEqual({ kind: "PLACE", groupId: ns, leaveFirst: false });
    expect(catalogueFamilyAction({ catalogueId: "cat", base: undefined, incoming: group(0), localGroupId: "local" })).toEqual({ kind: "KEEP_LOCAL" });
    expect(catalogueFamilyAction({ catalogueId: "cat", base: undefined, incoming: null, localGroupId: "local" })).toEqual({ kind: "NONE" });
  });

  it("révision : rien si la famille n'a pas changé ; adaptation locale conservée ; sortie et changement de famille", () => {
    expect(catalogueFamilyAction({ catalogueId: "cat", base: group(0), incoming: group(0), localGroupId: null })).toEqual({ kind: "NONE" });
    expect(catalogueFamilyAction({ catalogueId: "cat", base: group(0), incoming: group(3), localGroupId: null })).toEqual({ kind: "KEEP_LOCAL" });
    expect(catalogueFamilyAction({ catalogueId: "cat", base: group(0), incoming: null, localGroupId: ns })).toEqual({ kind: "LEAVE" });
    expect(catalogueFamilyAction({ catalogueId: "cat", base: { groupId: "h", sortKey: 0 }, incoming: group(1), localGroupId: catalogueFamilyGroupId("cat", "h") }))
      .toEqual({ kind: "PLACE", groupId: ns, leaveFirst: true });
  });

  it("range les membres importés par clé et laisse les membres locaux à leur place", () => {
    const current = [
      { movementId: "sol", sortKey: 2 },
      { movementId: "perso", sortKey: null },
      { movementId: "mur", sortKey: 0 },
    ];
    expect(orderedCatalogueFamily(current, "genoux", 1)).toEqual(["mur", "genoux", "perso", "sol"]);
    expect(orderedCatalogueFamily([], "seul", 5)).toEqual(["seul"]);
  });
});
