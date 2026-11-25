import { describe, expect, it } from "@jest/globals";

import {
  classificationFilterOptions,
  movementClassifications,
  movementsWithValue,
  sheetClassification,
} from "@/domain/catalogue/catalogueFilters";
import type { CatalogueReferences, CatalogueSheet } from "@/domain/catalogue/MovementCatalogueFile";

/**
 * MOUV-UX-20261117 — données des filtres validés (spécialités, familles gestuelles, cibles anatomiques, problèmes
 * cliniques) utilisables sur le téléphone, sans parcours de filtre (défini plus tard dans Figma).
 */

const ref = (id: string, label: string) => ({ id, label, kind: null, status: null });
const references: CatalogueReferences = {
  categories: [], bodyZones: [],
  specialties: [ref("reeducation", "Rééducation"), ref("crossfit", "CrossFit")],
  gesturalFamilies: [ref("squat", "Squat")],
  clinicalProblems: [ref("genou", "Douleur du genou")],
  anatomicalTargets: [ref("quadriceps", "Quadriceps")],
};
const classification = (specialtyIds: string[], extra: Partial<CatalogueSheet["classification"]> = {}) => ({
  classification: {
    categoryId: "renforcement", bodyZoneIds: [], specialtyIds, gesturalFamilyIds: [], clinicalProblemIds: [], anatomicalTargetIds: [], ...extra,
  },
});

describe("données des filtres de classification", () => {
  it("libellés du référentiel, dans son ordre ; identifiant affiché si le référentiel est inconnu", () => {
    const values = sheetClassification("c", classification(["crossfit", "reeducation"], { gesturalFamilyIds: ["squat"] }), references);
    expect(values.specialties).toEqual([
      { catalogueId: "c", id: "reeducation", label: "Rééducation" },
      { catalogueId: "c", id: "crossfit", label: "CrossFit" },
    ]);
    expect(values.gesturalFamilies).toEqual([{ catalogueId: "c", id: "squat", label: "Squat" }]);
    expect(sheetClassification("c", classification(["crossfit"]), undefined).specialties).toEqual([{ catalogueId: "c", id: "crossfit", label: "crossfit" }]);
  });

  it("valeurs proposables sans doublon et Mouvements portant une valeur ; catalogues distincts jamais confondus", () => {
    const byMovement = movementClassifications([
      { catalogueId: "c", movementId: "m1", sheet: classification(["crossfit"], { clinicalProblemIds: ["genou"] }) },
      { catalogueId: "c", movementId: "m2", sheet: classification(["crossfit", "reeducation"]) },
      { catalogueId: "autre", movementId: "m3", sheet: classification(["crossfit"]) },
    ], new Map([["c", references]]));
    const options = classificationFilterOptions(byMovement);
    expect(options.specialties.map((value) => value.catalogueId + "/" + value.id)).toEqual(["c/crossfit", "c/reeducation", "autre/crossfit"]);
    expect(options.clinicalProblems).toEqual([{ catalogueId: "c", id: "genou", label: "Douleur du genou" }]);
    expect(movementsWithValue(byMovement, "specialties", { catalogueId: "c", id: "crossfit" })).toEqual(["m1", "m2"]);
    expect(movementsWithValue(byMovement, "anatomicalTargets", { catalogueId: "c", id: "quadriceps" })).toEqual([]);
  });
});
