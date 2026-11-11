import { describe, expect, it } from "@jest/globals";

import { createLibrary, createSheet } from "@/domain/catalogue/catalogueEditing";
import type { SheetLoadItem } from "@/domain/catalogue/catalogueLoadPlan";
import type { LibraryPreview } from "@/domain/catalogue/libraryPlan";
import type { MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import { reviewLabel, unknownOwnerText } from "@/features/catalogue/libraryPresentation";

/**
 * Demande de Hermann du 11/11/2026 : cause réelle d'une fiche non appliquée, raisons du bandeau « Propriétaire
 * inconnu », et propriétaire par défaut des nouvelles fiches (« mettre mon nom par défaut »).
 */

const item = (state: SheetLoadItem["state"]) => ({ state, name: "Squat test recette" }) as SheetLoadItem;

describe("fiche non appliquée : cause précise", () => {
  it.each([
    ["WITHDRAWN_LOCALLY", /Archivé ou supprimé sur ce téléphone/],
    ["INCOHERENT_REVISION", /Révision incohérente/],
    ["REFUSED_REVISION", /Révision refusée sur ce téléphone/],
    ["INTERRUPTED", /interrompue/],
  ] as const)("%s", (state, text) => {
    expect(reviewLabel({ item: item(state), reason: "NOT_APPLICABLE" })).toMatch(text);
  });

  it("les autres raisons gardent leur libellé", () => {
    expect(reviewLabel({ item: item("TO_RECONCILE"), reason: "TO_RECONCILE" })).toMatch(/Modifiée sur ce téléphone/);
  });
});

describe("bandeau « Propriétaire inconnu »", () => {
  const preview = (ownerlessLibrary: boolean, ownerlessSheets: string[]) =>
    ({ unknownOwner: true, ownerlessLibrary, ownerlessSheets }) as unknown as LibraryPreview;

  it("nomme la Bibliothèque et les fiches sans propriétaire", () => {
    const text = unknownOwnerText(preview(true, ["A", "B", "C", "D", "E"]));
    expect(text).toContain("la bibliothèque n'a pas de propriétaire déclaré");
    expect(text).toContain("5 fiches sans propriétaire déclaré (« A », « B », « C » et 2 autres)");
    expect(text).toContain("ni partagées, ni redistribuées");
  });

  it("une seule fiche", () => {
    expect(unknownOwnerText(preview(false, ["Fente"]))).toContain("Cause : 1 fiche sans propriétaire déclaré (« Fente »)");
  });
});

describe("propriétaire par défaut des nouvelles fiches et Bibliothèques", () => {
  const owner = { kind: "LOCAL_USER", id: "Hermann" } as const;
  const file = {
    format: "KODJO_MOVEMENT_CATALOGUE", formatVersion: "2.0.0",
    catalogue: { id: "test", title: "Test", revision: "1", owner, manager: null, publisher: null, publicationAllowed: false, notes: [] },
    references: { categories: [{ id: "renforcement", label: "R", kind: null, status: null }], bodyZones: [{ id: "epaules", label: "É", kind: null, status: null }],
      specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] },
    glossary: [], libraries: [], sheets: [],
  } as unknown as MovementCatalogueFile;
  const meta = { date: "2026-11-11", author: null, summary: "Test" };

  it("reprend le propriétaire du catalogue, sauf déclaration explicite", () => {
    expect(createSheet(file, { name: "Gainage", categoryId: "renforcement", bodyZoneIds: ["epaules"] }, meta).sheet.provenance.owner).toEqual(owner);
    expect(createSheet(file, { name: "Gainage", categoryId: "renforcement", bodyZoneIds: ["epaules"], owner: null }, meta).sheet.provenance.owner).toBeNull();
    expect(createLibrary(file, { title: "Pompes" }, meta).library.owner).toEqual(owner);
  });
});
