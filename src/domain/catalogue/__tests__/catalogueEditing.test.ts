import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  addLibraryMember,
  applyFileEdit,
  applyLibraryEdit,
  applySheetEdit,
  CatalogueEditError,
  createLibrary,
  createSheet,
  linkLocalMovement,
  moveLibraryMember,
  nextRevision,
  removeLibraryMember,
  replaceLibrary,
  type CatalogueEditMeta,
} from "@/domain/catalogue/catalogueEditing";
import {
  parseMovementCatalogueFile,
  serializeMovementCatalogueFile,
  sheetFingerprint,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";

/**
 * W1 (11/11/2026) — édition du format v2 par l'administration locale : création de fiche,
 * révisions sur changement effectif seulement, Bibliothèques par références, rapprochement.
 */

const meta: CatalogueEditMeta = { date: "2026-11-11", author: { kind: "PERSON", id: "hermann" }, summary: "Test" };

function pilot(): MovementCatalogueFile {
  const text = readFileSync(join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json"), "utf8");
  const parsed = parseMovementCatalogueFile(JSON.parse(text));
  if (!parsed.ok) throw new Error("pilote invalide");
  return parsed.file;
}

/** Aller-retour par la sérialisation de référence, puis validation par le parseur partagé. */
function roundTrip(file: MovementCatalogueFile): MovementCatalogueFile {
  const text = serializeMovementCatalogueFile(file);
  const parsed = parseMovementCatalogueFile(JSON.parse(text));
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
  expect(serializeMovementCatalogueFile(parsed.file)).toBe(text);
  return parsed.file;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

describe("nextRevision", () => {
  it("incrémente un entier, y compris au-delà de la précision d'un nombre", () => {
    expect(nextRevision("1")).toBe("2");
    expect(nextRevision("9")).toBe("10");
    expect(nextRevision("99999999999999999999")).toBe("100000000000000000000");
  });

  it("incrémente un suffixe pointé, sinon ajoute « .1 » (révision non numérique)", () => {
    expect(nextRevision("2026-10-27")).toBe("2026-10-27.1");
    expect(nextRevision("2026-10-27.1")).toBe("2026-10-27.2");
    expect(nextRevision("1.0.0")).toBe("1.0.1");
  });

  it("ne réutilise jamais une révision déjà présente dans l'historique", () => {
    expect(nextRevision("2", ["1", "2", "3"])).toBe("4");
    expect(nextRevision("2026-10-27", ["2026-10-27.1"])).toBe("2026-10-27.2");
  });
});

describe("createSheet", () => {
  it("crée une 61e fiche privée, brouillon, non publiable, sans identité inventée, acceptée par le parseur", () => {
    const { file, sheet } = createSheet(pilot(), { name: "Pompe murale", categoryId: "renforcement", bodyZoneIds: ["bras", "epaules"] }, meta);
    expect(file.sheets).toHaveLength(61);
    expect(sheet).toMatchObject({
      sheetId: "fiche-pompe-murale",
      revision: "1",
      provenance: { origin: "LOCAL_CREATED", upstream: null, owner: null, author: null, visibility: "PRIVATE", reviewStatus: "DRAFT" },
      validation: { publicationAllowed: false },
      install: { knownLocalMovementIds: [] },
    });
    expect(sheet.history).toEqual([{ revision: "1", date: "2026-11-11", author: meta.author, summary: "Test" }]);
    const reread = roundTrip(file);
    expect(reread.sheets[60].sheetId).toBe("fiche-pompe-murale");
  });

  it("génère un identifiant unique et refuse un identifiant déjà pris ou invalide", () => {
    const first = createSheet(pilot(), { name: "Élan", categoryId: "cardio", bodyZoneIds: ["jambes"] }, meta);
    const second = createSheet(first.file, { name: "Elan", categoryId: "cardio", bodyZoneIds: ["jambes"] }, meta);
    expect(first.sheet.sheetId).toBe("fiche-elan");
    expect(second.sheet.sheetId).toBe("fiche-elan-2");
    expect(() => createSheet(pilot(), { sheetId: "REED-001", name: "X", categoryId: "cardio", bodyZoneIds: ["cou"] }, meta))
      .toThrow(CatalogueEditError);
    expect(() => createSheet(pilot(), { sheetId: "a b", name: "X", categoryId: "cardio", bodyZoneIds: ["cou"] }, meta))
      .toThrow(/INVALID_SHEET_ID/);
    expect(() => createSheet(pilot(), { name: "  ", categoryId: "cardio", bodyZoneIds: ["cou"] }, meta)).toThrow(/INVALID_INPUT/);
  });

  it("conserve propriétaire et auteur seulement s'ils sont fournis", () => {
    const owner = { kind: "ORGANIZATION" as const, id: "ankusha" };
    const { sheet } = createSheet(pilot(), { name: "Gainage", categoryId: "renforcement", bodyZoneIds: ["dos"], owner }, meta);
    expect(sheet.provenance.owner).toEqual(owner);
    expect(sheet.provenance.author).toBeNull();
  });
});

describe("applySheetEdit", () => {
  it("sans changement effectif : fiche précédente inchangée, aucune révision", () => {
    const previous = pilot().sheets[0];
    const edited = clone(previous) as CatalogueSheet;
    expect(applySheetEdit(previous, edited, meta)).toBe(previous);
    // Ordre d'un ensemble (Zones) : sans signification, donc aucune révision.
    const reordered = clone(previous) as { classification: { bodyZoneIds: string[] } } & CatalogueSheet;
    reordered.classification.bodyZoneIds.reverse();
    expect(applySheetEdit(previous, reordered, meta)).toBe(previous);
  });

  it("changement effectif : révision suivante et entrée d'historique, révision forgée ignorée", () => {
    const previous = pilot().sheets[0];
    const edited = clone(previous) as { content: { name: string }; revision: string; history: unknown[] } & CatalogueSheet;
    edited.content.name = "Élévation de jambe tendue (modifiée)";
    edited.revision = "99";
    edited.history = [];
    const next = applySheetEdit(previous, edited, meta);
    expect(next.revision).toBe("2");
    expect(next.history).toHaveLength(2);
    expect(next.history[1]).toEqual({ revision: "2", date: "2026-11-11", author: meta.author, summary: "Test" });
    expect(sheetFingerprint(next)).not.toBe(sheetFingerprint(previous));
  });

  it("l'ordre des étapes est un changement effectif", () => {
    const previous = pilot().sheets[0];
    const edited = clone(previous) as { content: { steps: string[] } } & CatalogueSheet;
    edited.content.steps.reverse();
    expect(applySheetEdit(previous, edited, meta).revision).toBe("2");
  });

  it("installation seule : nouvelle liste conservée sans révision éditoriale", () => {
    const previous = pilot().sheets[0];
    const edited = clone(previous) as { install: { knownLocalMovementIds: string[] } } & CatalogueSheet;
    edited.install.knownLocalMovementIds.push("mv-local-1");
    const next = applySheetEdit(previous, edited, meta);
    expect(next.revision).toBe(previous.revision);
    expect(next.history).toBe(previous.history);
    expect(next.install.knownLocalMovementIds).toEqual(["pilot:REED-001", "mv-local-1"]);
  });

  it("refuse un changement d'identité", () => {
    const previous = pilot().sheets[0];
    expect(() => applySheetEdit(previous, { ...previous, sheetId: "AUTRE" }, meta)).toThrow(/SHEET_ID_CHANGED/);
  });
});

describe("applyLibraryEdit et composition", () => {
  it("ajout, retrait, réordonnancement par références ; révision sur composition seulement", () => {
    const file = pilot();
    const library = file.libraries[0];
    const id = file.catalogue.id;
    expect(applyLibraryEdit(library, clone(library), meta)).toBe(library);
    const moved = moveLibraryMember(library, 0, 2);
    expect(moved.members.slice(0, 3).map((m) => m.sheetId)).toEqual(["REED-002", "REED-003", "REED-001"]);
    const revised = applyLibraryEdit(library, moved, meta);
    // Révision « 1 » sans historique (Bibliothèque issue de la conversion) → « 2 » avec une entrée.
    expect(revised.revision).toBe("2");
    expect(revised.history).toEqual([{ revision: "2", date: "2026-11-11", author: meta.author, summary: "Test" }]);
    const removed = removeLibraryMember(library, { catalogueId: id, sheetId: "REED-001" });
    expect(removed.members).toHaveLength(59);
    expect(() => addLibraryMember(library, { catalogueId: id, sheetId: "REED-001" })).toThrow(/MEMBER_ALREADY_PRESENT/);
    const readded = addLibraryMember(removed, { catalogueId: id, sheetId: "REED-001" }, 0);
    expect(applyLibraryEdit(library, readded, meta)).toBe(library);
    expect(() => removeLibraryMember(removed, { catalogueId: id, sheetId: "REED-001" })).toThrow(/UNKNOWN_MEMBER/);
  });

  it("une fiche peut appartenir à plusieurs Bibliothèques, sans copie", () => {
    const base = pilot();
    const { file, library } = createLibrary(base, { title: "Genou — sélection", members: [
      { catalogueId: base.catalogue.id, sheetId: "REED-001" },
      { catalogueId: base.catalogue.id, sheetId: "REED-002" },
    ] }, meta);
    expect(library).toMatchObject({ libraryId: "bib-genou-selection", revision: "1", visibility: "PRIVATE", publicationAllowed: false, owner: null, editor: null });
    const reread = roundTrip(file);
    expect(reread.libraries).toHaveLength(2);
    expect(reread.sheets).toHaveLength(60);
    expect(reread.libraries.filter((lib) => lib.members.some((m) => m.sheetId === "REED-001"))).toHaveLength(2);
    expect(() => createLibrary(file, { libraryId: "bib-genou-selection", title: "Doublon" }, meta)).toThrow(/LIBRARY_ID_TAKEN/);
    expect(() => createLibrary(file, { libraryId: "Majuscules", title: "X" }, meta)).toThrow(/INVALID_LIBRARY_ID/);
    expect(() => replaceLibrary(file, { ...library, libraryId: "inconnue" })).toThrow(/UNKNOWN_LIBRARY/);
  });
});

describe("applyFileEdit", () => {
  it("fichier identique : aucun changement, fichier précédent retourné", () => {
    const previous = pilot();
    const result = applyFileEdit(previous, clone(previous), meta);
    expect(result).toMatchObject({ ok: true, changed: false, changedSheets: [], changedLibraries: [] });
    if (result.ok) expect(result.file).toBe(previous);
  });

  it("création d'une fiche : révision « 1 » imposée, catalogue révisé une fois, aller-retour valide", () => {
    const previous = pilot();
    const created = createSheet(previous, { name: "Pompe murale", categoryId: "renforcement", bodyZoneIds: ["bras"] },
      { date: "1999-01-01", author: null, summary: "forgé" });
    const forged = clone(created.file) as { sheets: { revision: string }[] } & MovementCatalogueFile;
    forged.sheets[60].revision = "1";
    const result = applyFileEdit(previous, forged, meta);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changed).toBe(true);
    expect(result.createdSheets).toEqual(["fiche-pompe-murale"]);
    expect(result.file.catalogue.revision).toBe("2");
    expect(result.file.sheets[60].history).toEqual([{ revision: "1", date: "2026-11-11", author: meta.author, summary: "Test" }]);
    const saved = roundTrip(result.file);
    // Réenregistrer le fichier enregistré sans modification ne crée aucune révision.
    const again = applyFileEdit(saved, clone(saved), meta);
    expect(again).toMatchObject({ ok: true, changed: false });
  });

  it("modification d'une fiche : seule cette fiche et le catalogue sont révisés", () => {
    const previous = pilot();
    const edited = clone(previous) as { sheets: { content: { notes: string } }[] } & MovementCatalogueFile;
    edited.sheets[3].content.notes = "Note ajoutée";
    const result = applyFileEdit(previous, edited, meta);
    expect(result).toMatchObject({ ok: true, changed: true, changedSheets: [previous.sheets[3].sheetId], changedLibraries: [] });
    if (!result.ok) return;
    expect(result.file.sheets[3].revision).toBe("2");
    expect(result.file.sheets[2]).toBe(previous.sheets[2]);
    expect(result.file.catalogue.revision).toBe("2");
    roundTrip(result.file);
  });

  it("rapprochement : aucune révision de fiche, mais révision du catalogue", () => {
    const previous = pilot();
    const linked = linkLocalMovement(previous, "REED-002", "mv-123");
    const result = applyFileEdit(previous, linked, meta);
    expect(result).toMatchObject({ ok: true, changed: true, changedSheets: [], installChangedSheets: ["REED-002"] });
    if (!result.ok) return;
    expect(result.file.sheets[1].revision).toBe("1");
    expect(result.file.catalogue.revision).toBe("2");
    expect(linkLocalMovement(linked, "REED-002", "mv-123")).toBe(linked);
    expect(() => linkLocalMovement(linked, "REED-003", "mv-123")).toThrow(/LOCAL_ID_ALREADY_LINKED/);
    expect(() => linkLocalMovement(linked, "INCONNUE", "mv-9")).toThrow(/UNKNOWN_SHEET/);
    roundTrip(result.file);
  });

  it("refuse la suppression d'une fiche ou d'une Bibliothèque et le changement d'identité du catalogue", () => {
    const previous = pilot();
    const withoutSheet = { ...previous, sheets: previous.sheets.slice(1) };
    expect(applyFileEdit(previous, withoutSheet, meta)).toEqual({ ok: false, issues: [{ code: "SHEET_REMOVED", id: "REED-001" }] });
    expect(applyFileEdit(previous, { ...previous, libraries: [] }, meta))
      .toEqual({ ok: false, issues: [{ code: "LIBRARY_REMOVED", id: "kodjo.pilote-60" }] });
    expect(applyFileEdit(previous, { ...previous, catalogue: { ...previous.catalogue, id: "autre" } }, meta))
      .toMatchObject({ ok: false, issues: [{ code: "CATALOGUE_ID_CHANGED" }] });
  });

  it("nouvelle Bibliothèque et modification d'en-tête : révisions recalculées", () => {
    const previous = pilot();
    const { file } = createLibrary(previous, { title: "Épaule" }, { date: "1999-01-01", author: null, summary: "" });
    const edited = { ...file, catalogue: { ...file.catalogue, title: "Nouveau titre", revision: "42" } };
    const result = applyFileEdit(previous, edited, meta);
    expect(result).toMatchObject({ ok: true, changed: true, createdLibraries: ["bib-epaule"], changedLibraries: ["bib-epaule"] });
    if (!result.ok) return;
    expect(result.file.catalogue).toMatchObject({ title: "Nouveau titre", revision: "2" });
    expect(result.file.libraries[1].history).toEqual([{ revision: "1", date: "2026-11-11", author: meta.author, summary: "Test" }]);
    roundTrip(result.file);
  });
});
