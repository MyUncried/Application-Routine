import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  parseMovementCatalogueFile,
  projectSheetToMovement,
  sheetFingerprint,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";

/**
 * CA-1 — format `KODJO_MOVEMENT_CATALOGUE` v1 : validation, projection Mouvement, empreinte de
 * fiche. La fiche « LOCAL-001 » est rédigée à la main, sans code : preuve qu'une nouvelle fiche
 * se crée directement dans le fichier.
 */

type Mutable<T> = { -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K] };

const photo = {
  id: "media-0001aa",
  kind: "PHOTO",
  storage: "REMOTE",
  url: "https://exemple.fr/squat.webp",
  fileName: "squat.webp",
  caption: "Position basse",
  alt: "Personne en position basse de squat",
  sourceUrl: "https://exemple.fr/source",
  attribution: "Exemple",
  license: "CC-BY-4.0",
  rightsStatus: "UNVERIFIED",
};

function handWrittenSheet(): Mutable<CatalogueSheet> {
  return JSON.parse(JSON.stringify({
    sheetId: "LOCAL-001",
    revision: "1",
    history: [{ revision: "1", date: "2026-11-10", author: { kind: "PERSON", id: "coach-martin" }, summary: "Création" }],
    provenance: {
      gestureId: "squat",
      origin: "LOCAL_CREATED",
      upstream: null,
      owner: { kind: "PERSON", id: "coach-martin" },
      authors: [{ kind: "PERSON", id: "coach-martin" }],
      publisher: null,
      rightsHolder: null,
      license: null,
      reviewStatus: "DRAFT",
      visibility: "PRIVATE",
    },
    content: {
      name: "Squat gobelet",
      aliases: ["Goblet squat", "Squat au kettlebell"],
      startingPosition: "Debout, charge contre la poitrine",
      equipment: "Kettlebell",
      steps: ["Écartez les pieds.", "Descendez en gardant le buste droit.", "Remontez en poussant dans les talons."],
      safetyNotes: null,
      notes: "",
    },
    classification: {
      categoryId: "renforcement",
      bodyZoneIds: ["cuisses", "hanches-bassin"],
      specialtyIds: ["crossfit"],
      gesturalFamilyIds: ["squat"],
      clinicalProblemIds: [],
      anatomicalTargetIds: ["quadriceps"],
      basis: "Saisie de l'auteur",
      review: null,
      original: {},
      originalProposedSpecialties: [],
    },
    sources: { documentary: null, prescriptionContext: {} },
    validation: {
      classification: "PENDING",
      clinical: "NOT_ASSESSED",
      rights: "PENDING",
      corpusReview: null,
      licensing: null,
      clinicalValidation: null,
      publicationAllowed: false,
    },
    media: [photo],
    install: { knownLocalMovementIds: [] },
  }));
}

function catalogue(sheets: unknown[] = [handWrittenSheet()]): Mutable<MovementCatalogueFile> {
  const ref = (id: string) => ({ id, label: id, kind: null, status: null });
  return JSON.parse(JSON.stringify({
    format: "KODJO_MOVEMENT_CATALOGUE",
    formatVersion: "1.0.0",
    catalogue: {
      id: "coach-martin.perso",
      title: "Catalogue de test",
      revision: "1",
      owner: { kind: "PERSON", id: "coach-martin" },
      publisher: null,
      publicationAllowed: false,
      notes: [],
    },
    references: {
      categories: [ref("renforcement"), ref("mobilite")],
      bodyZones: [ref("cuisses"), ref("hanches-bassin"), ref("dos")],
      specialties: [ref("crossfit")],
      gesturalFamilies: [ref("squat")],
      clinicalProblems: [],
      anatomicalTargets: [ref("quadriceps")],
    },
    glossary: [{ id: "g-1", term: "Gobelet", definition: "Charge tenue contre la poitrine.", synonyms: [], relatedSheetIds: ["LOCAL-001"] }],
    sheets,
  }));
}

const codes = (raw: unknown) => {
  const result = parseMovementCatalogueFile(raw);
  return result.ok ? [] : result.issues.map((issue) => issue.path + ":" + issue.code);
};

describe("format KODJO_MOVEMENT_CATALOGUE v1 — validation", () => {
  it("accepte une fiche rédigée à la main dans le fichier, sans aucun code", () => {
    const result = parseMovementCatalogueFile(catalogue());
    expect(result).toMatchObject({ ok: true, warnings: [] });
  });

  it("accepte un catalogue vide", () => {
    const empty = catalogue([]);
    empty.glossary = [];
    expect(parseMovementCatalogueFile(empty).ok).toBe(true);
  });

  it("refuse un format ou une version étrangers", () => {
    expect(codes({ ...catalogue(), format: "KODJO_ADMIN_DRAFTS" })).toEqual(["format:UNRECOGNIZED"]);
    expect(codes({ ...catalogue(), formatVersion: "2.0.0" })).toEqual(["formatVersion:UNRECOGNIZED"]);
    expect(codes(null)).toEqual([":INVALID"]);
  });

  it("refuse les identités dupliquées : sheetId, identifiants locaux connus, référentiels, glossaire", () => {
    const a = handWrittenSheet();
    const b = handWrittenSheet();
    b.content.name = "Autre nom";
    a.install.knownLocalMovementIds = ["pilot:X"];
    b.install.knownLocalMovementIds = ["pilot:X"];
    const file = catalogue([a, b]);
    file.references.categories.push({ id: "renforcement", label: "Doublon", kind: null, status: null });
    file.glossary.push({ ...file.glossary[0]! });
    expect(codes(file)).toEqual(expect.arrayContaining([
      "sheets[1].sheetId:DUPLICATE",
      "sheets[1].install.knownLocalMovementIds:DUPLICATE",
      "references.categories[2].id:DUPLICATE",
      "glossary[1].id:DUPLICATE",
    ]));
  });

  it("refuse une référence inconnue de Catégorie, de Zone ou de taxonomie, et une fiche de glossaire inconnue", () => {
    const sheet = handWrittenSheet();
    sheet.classification.categoryId = "inconnue";
    sheet.classification.bodyZoneIds = ["cuisses", "nuque"];
    sheet.classification.gesturalFamilyIds = ["fente"];
    const file = catalogue([sheet]);
    file.glossary[0]!.relatedSheetIds = ["ABSENTE"];
    expect(codes(file)).toEqual(expect.arrayContaining([
      "sheets[0].classification.categoryId:UNKNOWN_REFERENCE",
      "sheets[0].classification.bodyZoneIds:UNKNOWN_REFERENCE",
      "sheets[0].classification.gesturalFamilyIds:UNKNOWN_REFERENCE",
      "glossary[0].relatedSheetIds:UNKNOWN_REFERENCE",
    ]));
  });

  it("exige un historique cohérent avec la révision", () => {
    const sheet = handWrittenSheet();
    sheet.revision = "2";
    expect(codes(catalogue([sheet]))).toContain("sheets[0].history:INCONSISTENT");
    sheet.history = [];
    expect(codes(catalogue([sheet]))).toContain("sheets[0].history:REQUIRED");
    const twice = handWrittenSheet();
    twice.history.unshift({ ...twice.history[0]! });
    expect(codes(catalogue([twice]))).toContain("sheets[0].history[1].revision:DUPLICATE");
  });

  it("réemploie le validateur de provenance : source exigée hors création originale", () => {
    const sheet = handWrittenSheet();
    sheet.provenance.origin = "CATALOGUE_INSTALLED";
    expect(codes(catalogue([sheet]))).toContain("sheets[0].provenance.upstream:REQUIRED");
    sheet.provenance.origin = "LOCAL_CREATED";
    sheet.provenance.authors = [{ kind: "PERSON", id: "a" }, { kind: "PERSON", id: "a" }];
    expect(codes(catalogue([sheet]))).toContain("sheets[0].provenance.authors:DUPLICATE");
  });

  it("propriétaire inconnu : accepté et signalé, jamais attribué par déduction", () => {
    const sheet = handWrittenSheet();
    sheet.provenance.owner = null;
    const result = parseMovementCatalogueFile(catalogue([sheet]));
    expect(result).toMatchObject({ ok: true, warnings: [{ path: "sheets[0].provenance.owner", code: "UNKNOWN_OWNER" }] });
  });

  it("homonymie (spécification A1 ouverte) : signalée, non bloquante", () => {
    const other = handWrittenSheet();
    other.sheetId = "LOCAL-002";
    const result = parseMovementCatalogueFile(catalogue([handWrittenSheet(), other]));
    expect(result).toMatchObject({ ok: true, warnings: [{ path: "sheets[1].content.name", code: "DUPLICATE_NAME" }] });
  });

  it("applique les règles médias de l'administration", () => {
    const sheet = handWrittenSheet();
    sheet.media = [{ ...photo, url: "http://exemple.fr/a.webp" } as never];
    expect(codes(catalogue([sheet]))).toEqual(["sheets[0].media[0]:INVALID"]);
    sheet.media = [{ ...photo, alt: " " } as never];
    expect(codes(catalogue([sheet]))).toEqual(["sheets[0].media[0]:INVALID"]);
    sheet.media = [{ ...photo, rightsStatus: "PERMISSION_CONFIRMED", license: "" } as never];
    expect(codes(catalogue([sheet]))).toEqual(["sheets[0].media[0]:INVALID"]);
    sheet.media = Array.from({ length: 31 }, (_, i) => ({ ...photo, id: "media-" + String(i).padStart(6, "0") }) as never);
    expect(codes(catalogue([sheet]))).toEqual(["sheets[0].media:INVALID"]);
    sheet.media = [photo as never, photo as never];
    expect(codes(catalogue([sheet]))).toEqual(["sheets[0].media[1].id:DUPLICATE"]);
    sheet.media = [{ ...photo, storage: "EMBEDDED", url: "data:image/webp;base64,QUJD", sourceUrl: null } as never];
    expect(codes(catalogue([sheet]))).toEqual([]);
  });

  it("contrôle la projection avec le contrat Movement actuel", () => {
    const sheet = handWrittenSheet();
    sheet.classification.bodyZoneIds = [];
    expect(codes(catalogue([sheet]))).toEqual([expect.stringMatching(/^sheets\[0\]:MOVEMENT_CONTRACT$/)]);
  });

  it("tout fichier versionné dans catalogue/catalogues est valide", () => {
    const folder = join(__dirname, "..", "..", "..", "..", "catalogue", "catalogues");
    const files = readdirSync(folder).filter((name) => name.endsWith(".catalogue.json"));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const result = parseMovementCatalogueFile(JSON.parse(readFileSync(join(folder, name), "utf8")));
      expect({ name, issues: result.ok ? [] : result.issues }).toEqual({ name, issues: [] });
    }
  });
});

describe("projection Mouvement", () => {
  it("étapes encodées dans la description, ordre des alias conservé, identifiant fourni par l'installation", () => {
    const movement = projectSheetToMovement(handWrittenSheet() as CatalogueSheet, "local-42");
    expect(movement).toEqual({
      id: "local-42",
      name: "Squat gobelet",
      aliases: ["Goblet squat", "Squat au kettlebell"],
      description: "Écartez les pieds.\nDescendez en gardant le buste droit.\nRemontez en poussant dans les talons.",
      categoryId: "renforcement",
      bodyZoneIds: ["cuisses", "hanches-bassin"],
      media: [],
      phases: [],
      nextPhaseId: 1,
      levelGroup: null,
    });
  });
});

describe("empreinte de fiche éditoriale complète", () => {
  const base = sheetFingerprint(handWrittenSheet() as CatalogueSheet);
  const variant = (change: (sheet: Mutable<CatalogueSheet>) => void) => {
    const sheet = handWrittenSheet();
    change(sheet);
    return sheetFingerprint(sheet as CatalogueSheet);
  };

  it.each([
    ["ordre des étapes", (s: Mutable<CatalogueSheet>) => { s.content.steps.reverse(); }],
    ["ordre des alias", (s: Mutable<CatalogueSheet>) => { s.content.aliases.reverse(); }],
    ["ordre des médias", (s: Mutable<CatalogueSheet>) => { s.media.push({ ...photo, id: "media-0002bb" } as never); s.media.reverse(); }],
    ["droits d'un média", (s: Mutable<CatalogueSheet>) => { (s.media[0] as { rightsStatus: string }).rightsStatus = "RESTRICTED"; }],
    ["consignes de sécurité", (s: Mutable<CatalogueSheet>) => { s.content.safetyNotes = "Sans douleur."; }],
    ["classification d'origine", (s: Mutable<CatalogueSheet>) => { s.classification.original = { zone: "Jambes" }; }],
    ["source documentaire", (s: Mutable<CatalogueSheet>) => { s.sources.documentary = { sourceId: "S", section: null, url: null, usageStatement: null }; }],
    ["statut de validation clinique", (s: Mutable<CatalogueSheet>) => { s.validation.clinical = "APPROVED"; }],
    ["auteurs", (s: Mutable<CatalogueSheet>) => { s.provenance.authors = []; }],
    ["spécialités", (s: Mutable<CatalogueSheet>) => { s.classification.specialtyIds = []; }],
  ])("change avec : %s", (_label, change) => {
    expect(variant(change)).not.toBe(base);
  });

  it.each([
    ["ordre des Zones", (s: Mutable<CatalogueSheet>) => { s.classification.bodyZoneIds.reverse(); }],
    ["ordre d'une taxonomie", (s: Mutable<CatalogueSheet>) => { s.classification.specialtyIds = ["crossfit"]; }],
    ["révision et historique", (s: Mutable<CatalogueSheet>) => { s.revision = "2"; s.history.push({ revision: "2", date: "2026-11-11", author: null, summary: "" }); }],
    ["identifiants locaux connus", (s: Mutable<CatalogueSheet>) => { s.install.knownLocalMovementIds = ["pilot:X"]; }],
    ["ordre des clés", (s: Mutable<CatalogueSheet>) => { const content = { ...s.content }; s.content = Object.fromEntries(Object.entries(content).reverse()) as never; }],
  ])("inchangée avec : %s", (_label, change) => {
    expect(variant(change)).toBe(base);
  });
});
