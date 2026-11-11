import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  parseMovementCatalogueFile,
  projectSheetToMovement,
  serializeMovementCatalogueFile,
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
      author: { kind: "PERSON", id: "coach-martin" },
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
    formatVersion: "2.0.0",
    catalogue: {
      id: "coach-martin.perso",
      title: "Catalogue de test",
      revision: "1",
      owner: { kind: "PERSON", id: "coach-martin" },
      manager: null,
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
    libraries: [{
      libraryId: "perso",
      title: "Ma bibliothèque",
      description: null,
      revision: "1",
      history: [],
      editor: { kind: "PERSON", id: "coach-martin" },
      owner: { kind: "PERSON", id: "coach-martin" },
      visibility: "PRIVATE",
      publicationAllowed: false,
      members: sheets
        .filter((sheet): sheet is { sheetId: string } => typeof (sheet as { sheetId?: unknown })?.sheetId === "string")
        .map((sheet) => ({ catalogueId: "coach-martin.perso", sheetId: sheet.sheetId })),
    }],
    sheets,
  }));
}

const codes = (raw: unknown) => {
  const result = parseMovementCatalogueFile(raw);
  return result.ok ? [] : result.issues.map((issue) => issue.path + ":" + issue.code);
};

describe("format KODJO_MOVEMENT_CATALOGUE v2 — validation", () => {
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
    expect(codes({ ...catalogue(), formatVersion: "3.0.0" })).toEqual(["formatVersion:UNRECOGNIZED"]);
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
    (sheet.provenance as { author: unknown }).author = [{ kind: "PERSON", id: "a" }];
    expect(codes(catalogue([sheet]))).toContain("sheets[0].provenance.author:UNRECOGNIZED");
  });

  it("propriétaire inconnu : accepté et signalé, jamais attribué par déduction", () => {
    const sheet = handWrittenSheet();
    sheet.provenance.owner = null;
    const result = parseMovementCatalogueFile(catalogue([sheet]));
    expect(result).toMatchObject({ ok: true, warnings: [{ path: "sheets[0].provenance.owner", code: "UNKNOWN_OWNER" }] });
  });

  it("propriétaire inconnu (décision du 10/11) : jamais publiable ni diffusable, champ obligatoirement déclaré", () => {
    const published = handWrittenSheet();
    published.provenance.owner = null;
    published.validation.publicationAllowed = true;
    expect(codes(catalogue([published]))).toContain("sheets[0].validation.publicationAllowed:INCONSISTENT");

    const diffused = handWrittenSheet();
    diffused.provenance.owner = null;
    diffused.provenance.visibility = "UNLISTED";
    expect(codes(catalogue([diffused]))).toContain("sheets[0].provenance.owner:INCONSISTENT");

    const omitted = handWrittenSheet() as unknown as { provenance: Record<string, unknown> };
    delete omitted.provenance.owner;
    expect(codes(catalogue([omitted]))).toContain("sheets[0].provenance.owner:REQUIRED");

    const header = catalogue([]);
    header.catalogue.owner = null;
    header.catalogue.publicationAllowed = true;
    expect(codes(header)).toContain("catalogue.publicationAllowed:INCONSISTENT");
  });

  it("gestionnaire administratif du catalogue : déclaré, distinct du propriétaire", () => {
    const managed = catalogue([]);
    managed.glossary = [];
    managed.catalogue.owner = null;
    managed.catalogue.manager = { kind: "ORGANIZATION", id: "ankusha" };
    expect(parseMovementCatalogueFile(managed)).toMatchObject({
      ok: true,
      warnings: [{ path: "catalogue.owner", code: "UNKNOWN_OWNER" }],
    });
    const missing = catalogue([]) as unknown as { catalogue: Record<string, unknown> };
    delete missing.catalogue.manager;
    expect(codes(missing)).toContain("catalogue.manager:REQUIRED");
    managed.catalogue.manager = { kind: "ORGANIZATION", id: " " };
    expect(codes(managed)).toContain("catalogue.manager.id:REQUIRED");
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

describe("format v2 — P0 (11/11/2026) : auteur unique, Bibliothèques, relecture v1, aller-retour", () => {
  /** Fichier v1 tel que produit par CA-1 : `authors[]`, aucune Bibliothèque. */
  function v1(authors: unknown[]): Record<string, unknown> {
    const file = catalogue() as unknown as Record<string, unknown>;
    const sheets = (file.sheets as Record<string, unknown>[]).map((sheet) => {
      const { author: _author, ...provenance } = sheet.provenance as Record<string, unknown>;
      void _author;
      return { ...sheet, provenance: { ...provenance, authors } };
    });
    const { libraries: _libraries, ...rest } = file;
    void _libraries;
    return { ...rest, formatVersion: "1.0.0", sheets };
  }

  it("relit un fichier v1 : 0 auteur → null, 1 auteur → auteur, Bibliothèque implicite de toutes les fiches", () => {
    const none = parseMovementCatalogueFile(v1([]));
    expect(none.ok && none.file.sheets[0].provenance.author).toBeNull();
    const one = parseMovementCatalogueFile(v1([{ kind: "PERSON", id: "coach-martin" }]));
    if (!one.ok) throw new Error("v1 refusé");
    expect(one.sourceFormatVersion).toBe("1.0.0");
    expect(one.file.formatVersion).toBe("2.0.0");
    expect(one.file.sheets[0].provenance.author).toEqual({ kind: "PERSON", id: "coach-martin" });
    expect("authors" in one.file.sheets[0].provenance).toBe(false);
    expect(one.file.libraries).toEqual([expect.objectContaining({
      libraryId: "coach-martin.perso",
      title: "Catalogue de test",
      visibility: "PRIVATE",
      publicationAllowed: false,
      members: [{ catalogueId: "coach-martin.perso", sheetId: "LOCAL-001" }],
    })]);
    expect(one.warnings).toContainEqual({ path: "formatVersion", code: "CONVERTED_FROM_V1" });
  });

  it("v1 : identifiant de catalogue quelconque et en-tête publiable acceptés ; Bibliothèque implicite privée", () => {
    const raw = v1([]) as Record<string, Record<string, unknown>>;
    raw.catalogue!.id = "Coach_Martin Perso";
    raw.catalogue!.publicationAllowed = true;
    const result = parseMovementCatalogueFile(raw);
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.file.libraries[0]).toMatchObject({ libraryId: "coach-martin-perso", visibility: "PRIVATE", publicationAllowed: false });
  });

  it("v1 à plusieurs auteurs : refus explicite, jamais de choix arbitraire (MOUV-D1)", () => {
    expect(codes(v1([{ kind: "PERSON", id: "a" }, { kind: "PERSON", id: "b" }])))
      .toEqual(["sheets[0].provenance.authors:INCONSISTENT"]);
  });

  it("refuse une fiche d’origine LOCAL_DERIVED (A-2 : aucune copie ni dérivation locale)", () => {
    const sheet = handWrittenSheet();
    sheet.provenance.origin = "LOCAL_DERIVED";
    sheet.provenance.upstream = { catalogueId: "kodjo", sheetId: "S", revision: "1" };
    expect(codes(catalogue([sheet]))).toContain("sheets[0].provenance.origin:INCONSISTENT");
  });

  it("une même fiche dans plusieurs Bibliothèques, sans copie ; fiche d’une autre source référencée et signalée", () => {
    const file = catalogue();
    const base = file.libraries[0];
    file.libraries = [
      base,
      { ...base, libraryId: "force", title: "Force", members: [
        { catalogueId: "coach-martin.perso", sheetId: "LOCAL-001" },
        { catalogueId: "kodjo.fitness", sheetId: "SQUAT" },
      ] },
    ] as never;
    const result = parseMovementCatalogueFile(file);
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.file.sheets).toHaveLength(1);
    expect(result.warnings).toContainEqual({ path: "libraries[1].members[1]", code: "EXTERNAL_MEMBER" });
  });

  it("valide les Bibliothèques : identité, doublons, fiche inconnue, propriétaire inconnu, diffusion sans droits", () => {
    const file = catalogue();
    const base = file.libraries[0];
    file.libraries = [
      { ...base, members: [...base.members, ...base.members, { catalogueId: "coach-martin.perso", sheetId: "ABSENTE" }] },
      { ...base },
      { ...base, libraryId: "Pas Valide" },
      { ...base, libraryId: "inconnu", owner: null, visibility: "PUBLIC", publicationAllowed: true },
      { ...base, libraryId: "publique", visibility: "PUBLIC", publicationAllowed: true },
    ] as never;
    expect(codes(file)).toEqual(expect.arrayContaining([
      "libraries[0].members[1]:DUPLICATE",
      "libraries[0].members[2].sheetId:UNKNOWN_REFERENCE",
      "libraries[1].libraryId:DUPLICATE",
      "libraries[2].libraryId:INVALID",
      "libraries[3].publicationAllowed:INCONSISTENT",
      "libraries[3].visibility:INCONSISTENT",
      "libraries[4].members[0]:INCONSISTENT",
    ]));
    const missing = catalogue() as unknown as Record<string, unknown>;
    delete missing.libraries;
    expect(codes(missing)).toContain("libraries:REQUIRED");
  });

  it("aller-retour : sérialiser puis relire redonne le même fichier, au caractère près", () => {
    const file = catalogue();
    file.sheets[0].media = [photo as never];
    const first = parseMovementCatalogueFile(file);
    if (!first.ok) throw new Error("refus");
    const text = serializeMovementCatalogueFile(first.file);
    const again = parseMovementCatalogueFile(JSON.parse(text));
    if (!again.ok) throw new Error("relecture refusée");
    expect(again.file).toEqual(first.file);
    expect(serializeMovementCatalogueFile(again.file)).toBe(text);
    expect(text.endsWith("}\n")).toBe(true);
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
    ["auteur", (s: Mutable<CatalogueSheet>) => { s.provenance.author = null; }],
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
