import { describe, expect, it } from "@jest/globals";

import { createLibrary, createSheet } from "@/domain/catalogue/catalogueEditing";
import type { SheetLoadItem } from "@/domain/catalogue/catalogueLoadPlan";
import type { MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type { LibraryPreview } from "@/domain/catalogue/libraryPlan";
import { availableLine, reviewLabel, UNKNOWN_LIBRARY_OWNER_TEXT } from "@/features/catalogue/libraryPresentation";

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
  ] as [SheetLoadItem["state"], RegExp][])("%s", (state, text) => {
    expect(reviewLabel({ item: item(state), reason: "NOT_APPLICABLE" })).toMatch(text);
  });

  it("les autres raisons gardent leur libellé", () => {
    expect(reviewLabel({ item: item("TO_RECONCILE"), reason: "TO_RECONCILE" })).toMatch(/Modifiée sur ce téléphone/);
  });
});

describe("bandeau « Propriétaire inconnu » (constat d) du 12/11)", () => {
  it("texte de Figma", () => {
    expect(UNKNOWN_LIBRARY_OWNER_TEXT).toBe("Ces fiches restent sur ce téléphone : elles ne peuvent être ni partagées, ni redistribuées.");
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

/** Recette du 13/11 (x-d-maj, x-d-compteurs) : « 7 fiches · Révision 8 disponible ne veut rien dire ». */
describe("availableLine — libellés de « Bibliothèques disponibles »", () => {
  const preview = (status: LibraryPreview["status"]) => ({ status, memberCount: 7, targetRevision: "8" }) as unknown as LibraryPreview;
  it("mise à jour : « 7 fiches · mise à jour disponible » ; refus : « … mise à jour refusée » ; plus de numéro de révision", () => {
    expect(availableLine(preview("UPDATE_AVAILABLE")).subtitle).toBe("7 fiches · mise à jour disponible");
    expect(availableLine(preview("REFUSED")).subtitle).toBe("7 fiches · mise à jour refusée");
    expect(availableLine(preview("NOT_INSTALLED")).subtitle).toBe("7 fiches · non installée");
  });
});
