import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  cataloguePublicationSynthesis,
  diffusableCatalogue,
  libraryPublicationSynthesis,
  normalizeStoredLibrary,
  normalizeStoredSheet,
  parseMovementCatalogueFile,
  projectSheetToMovement,
  serializeMovementCatalogueFile,
  sheetBeforeStartingPositionMerge,
  sheetFingerprint,
  STARTING_POSITION_MERGE_SUMMARY,
  withoutInternalNotes,
  type CatalogueLibrary,
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
      origin: "LOCAL_CREATED",
      upstream: null,
      owner: { kind: "PERSON", id: "coach-martin" },
      author: { kind: "PERSON", id: "coach-martin" },
      rightsHolder: null,
      license: null,
    },
    content: {
      name: "Squat gobelet",
      aliases: ["Goblet squat", "Squat au kettlebell"],
      equipment: "Kettlebell",
      steps: ["Debout, charge contre la poitrine.", "Écartez les pieds.", "Descendez en gardant le buste droit.", "Remontez en poussant dans les talons."],
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
    },
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
    phases: [],
    install: { knownLocalMovementIds: [] },
  }));
}

/** Fiche 2.0.0 (avant le 18/11/2026) : champs abandonnés présents, position de départ distincte. */
function legacySheet(): Record<string, unknown> {
  const sheet = handWrittenSheet() as unknown as Record<string, Record<string, unknown>>;
  const { phases: _phases, ...rest } = sheet;
  void _phases;
  return {
    ...rest,
    provenance: { gestureId: "squat", ...sheet.provenance, publisher: null, reviewStatus: "DRAFT", visibility: "PRIVATE" },
    content: { ...sheet.content, startingPosition: "Debout, charge contre la poitrine", steps: (sheet.content!.steps as string[]).slice(1) },
    classification: { ...sheet.classification, basis: "Saisie de l'auteur", review: null, original: {}, originalProposedSpecialties: [] },
    sources: { documentary: null, prescriptionContext: {} },
    media: [{ ...photo, alt: "Personne en position basse de squat" }],
  };
}

/** Catalogue 2.0.0 : en-tête et Bibliothèques avec les champs abandonnés. */
function legacyCatalogue(sheets: unknown[] = [legacySheet()]): Record<string, unknown> {
  const file = catalogue(sheets as never) as unknown as Record<string, unknown>;
  const libraries = (file.libraries as Record<string, unknown>[]).map((library) => ({
    ...library, editor: { kind: "PERSON", id: "coach-martin" }, publicationAllowed: false,
  }));
  return {
    ...file,
    formatVersion: "2.0.0",
    catalogue: { ...(file.catalogue as object), manager: null, publisher: null, publicationAllowed: false },
    libraries,
  };
}

function catalogue(sheets: unknown[] = [handWrittenSheet()]): Mutable<MovementCatalogueFile> {
  const ref = (id: string) => ({ id, label: id, kind: null, status: null });
  return JSON.parse(JSON.stringify({
    format: "KODJO_MOVEMENT_CATALOGUE",
    formatVersion: "3.0.0",
    catalogue: {
      id: "coach-martin.perso",
      title: "Catalogue de test",
      revision: "1",
      owner: { kind: "PERSON", id: "coach-martin" },
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
      owner: { kind: "PERSON", id: "coach-martin" },
      visibility: "PRIVATE",
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

describe("format KODJO_MOVEMENT_CATALOGUE v3 — validation", () => {
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
    expect(codes({ ...catalogue(), formatVersion: "4.0.0" })).toEqual(["formatVersion:UNRECOGNIZED"]);
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

    const omitted = handWrittenSheet() as unknown as { provenance: Record<string, unknown> };
    delete omitted.provenance.owner;
    expect(codes(catalogue([omitted]))).toContain("sheets[0].provenance.owner:REQUIRED");

    const header = catalogue([]) as unknown as { catalogue: Record<string, unknown>; glossary: unknown[] };
    header.glossary = [];
    header.catalogue.owner = null;
    expect(parseMovementCatalogueFile(header)).toMatchObject({ ok: true, warnings: [{ path: "catalogue.owner", code: "UNKNOWN_OWNER" }] });
  });

  it("MOUV-ADM-20261117 : les champs abandonnés ne réapparaissent pas dans un fichier 3.0.0", () => {
    const sheet = handWrittenSheet() as unknown as Record<string, Record<string, unknown>>;
    sheet.content!.startingPosition = "Debout";
    sheet.provenance!.publisher = null;
    sheet.provenance!.visibility = "PRIVATE";
    sheet.classification!.basis = "x";
    sheet.sources = { documentary: null, prescriptionContext: {} };
    const file = catalogue([sheet]) as unknown as Record<string, Record<string, unknown>>;
    file.catalogue!.manager = null;
    expect(codes(file)).toEqual(expect.arrayContaining([
      "sheets[0].content.startingPosition:UNRECOGNIZED",
      "sheets[0].provenance.publisher:UNRECOGNIZED",
      "sheets[0].provenance.visibility:UNRECOGNIZED",
      "sheets[0].classification.basis:UNRECOGNIZED",
      "sheets[0].sources:UNRECOGNIZED",
      "catalogue.manager:UNRECOGNIZED",
    ]));
    const alt = handWrittenSheet();
    alt.media = [{ ...photo, alt: "x" } as never];
    expect(codes(catalogue([alt]))).toEqual(["sheets[0].media[0]:INVALID"]);
  });

  it("licence (MOUV-ADM n° 15) : non renseignée, nom et lien, ou texte ; jamais les deux ni vide", () => {
    const sheet = handWrittenSheet();
    const withLicense = (license: unknown) => {
      (sheet.provenance as { license: unknown }).license = license;
      return codes(catalogue([sheet]));
    };
    expect(withLicense(null)).toEqual([]);
    expect(withLicense({ name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/", text: null })).toEqual([]);
    expect(withLicense({ name: "Usage interne", url: null, text: null })).toEqual([]);
    expect(withLicense({ name: null, url: null, text: "Reproduction autorisée pour les patients du cabinet." })).toEqual([]);
    expect(withLicense({ name: "A", url: null, text: "B" })).toEqual(["sheets[0].provenance.license:INCONSISTENT"]);
    expect(withLicense({ name: null, url: "https://x.fr", text: "B" })).toEqual(["sheets[0].provenance.license:INCONSISTENT"]);
    expect(withLicense({ name: " ", url: null, text: null })).toEqual(["sheets[0].provenance.license:INCONSISTENT"]);
    expect(withLicense({ name: "A", url: "ftp://x", text: null })).toEqual(["sheets[0].provenance.license:UNRECOGNIZED"]);
    expect(withLicense("CC BY")).toEqual(["sheets[0].provenance.license:REQUIRED"]);
  });

  it("ayant droit (MOUV-ADM n° 14) : null = propriétaire ; un tiers distinct ; jamais le propriétaire en double", () => {
    const sheet = handWrittenSheet();
    sheet.provenance.rightsHolder = { kind: "ORGANIZATION", id: "editions-x" };
    expect(codes(catalogue([sheet]))).toEqual([]);
    sheet.provenance.rightsHolder = { kind: "PERSON", id: "coach-martin" };
    expect(codes(catalogue([sheet]))).toEqual(["sheets[0].provenance.rightsHolder:INCONSISTENT"]);
  });

  it("phases (MOUV-UX-20261117) : contrat Mouvement — 6 au plus, libellé de 1 à 20, durée 1..3535 ou null", () => {
    const sheet = handWrittenSheet();
    const withPhases = (phases: unknown) => {
      (sheet as { phases: unknown }).phases = phases;
      return codes(catalogue([sheet]));
    };
    expect(withPhases([{ id: 1, label: "Descente", durationSeconds: 3 }, { id: 3, label: "Remontée", durationSeconds: null }])).toEqual([]);
    expect(withPhases([{ id: 1, label: "", durationSeconds: null }])).toEqual(["sheets[0].phases:INVALID"]);
    expect(withPhases([{ id: 1, label: "A", durationSeconds: 0 }])).toEqual(["sheets[0].phases:INVALID"]);
    expect(withPhases([{ id: 1, label: "A" }])).toEqual(["sheets[0].phases:INVALID"]);
    expect(withPhases([{ id: 1, label: "A", durationSeconds: null }, { id: 1, label: "B", durationSeconds: null }])).toEqual(["sheets[0].phases:INVALID"]);
    expect(withPhases(Array.from({ length: 7 }, (_, i) => ({ id: i + 1, label: "P" + i, durationSeconds: null })))).toEqual(["sheets[0].phases:INVALID"]);
    expect(withPhases(undefined)).toEqual(["sheets[0].phases:REQUIRED"]);
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
    const file = legacyCatalogue() as unknown as Record<string, unknown>;
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
    expect(one.file.formatVersion).toBe("3.0.0");
    expect(one.file.sheets[0].provenance.author).toEqual({ kind: "PERSON", id: "coach-martin" });
    expect("authors" in one.file.sheets[0].provenance).toBe(false);
    expect(one.file.libraries).toEqual([expect.objectContaining({
      libraryId: "coach-martin.perso",
      title: "Catalogue de test",
      visibility: "PRIVATE",
      members: [{ catalogueId: "coach-martin.perso", sheetId: "LOCAL-001" }],
    })]);
    expect("publicationAllowed" in one.file.libraries[0]!).toBe(false);
    expect(one.warnings).toContainEqual({ path: "formatVersion", code: "CONVERTED_FROM_V1" });
  });

  it("v1 : identifiant de catalogue quelconque et en-tête publiable acceptés ; Bibliothèque implicite privée", () => {
    const raw = v1([]) as Record<string, Record<string, unknown>>;
    raw.catalogue!.id = "Coach_Martin Perso";
    raw.catalogue!.publicationAllowed = true;
    const result = parseMovementCatalogueFile(raw);
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.file.libraries[0]).toMatchObject({ libraryId: "coach-martin-perso", visibility: "PRIVATE" });
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

  it("valide les Bibliothèques : identité, doublons, fiche inconnue, propriétaire inconnu", () => {
    const file = catalogue();
    const base = file.libraries[0];
    file.libraries = [
      { ...base, members: [...base.members, ...base.members, { catalogueId: "coach-martin.perso", sheetId: "ABSENTE" }] },
      { ...base },
      { ...base, libraryId: "Pas Valide" },
      { ...base, libraryId: "inconnu", owner: null, visibility: "PUBLIC" },
      { ...base, libraryId: "publique", visibility: "PUBLIC", publicationAllowed: true },
    ] as never;
    expect(codes(file)).toEqual(expect.arrayContaining([
      "libraries[0].members[1]:DUPLICATE",
      "libraries[0].members[2].sheetId:UNKNOWN_REFERENCE",
      "libraries[1].libraryId:DUPLICATE",
      "libraries[2].libraryId:INVALID",
      "libraries[3].visibility:INCONSISTENT",
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
      description: "Debout, charge contre la poitrine.\nÉcartez les pieds.\nDescendez en gardant le buste droit.\nRemontez en poussant dans les talons.",
      categoryId: "renforcement",
      bodyZoneIds: ["cuisses", "hanches-bassin"],
      media: [],
      phases: [],
      nextPhaseId: 1,
      levelGroup: null,
    });
  });

  it("phases de la fiche projetées (MOUV-UX-20261117) : ordre, libellés, durée explicite, compteur au-delà du plus grand", () => {
    const sheet = handWrittenSheet();
    (sheet as { phases: unknown }).phases = [{ id: 4, label: "Descente", durationSeconds: 3 }, { id: 2, label: "Remontée", durationSeconds: null }];
    const movement = projectSheetToMovement(sheet as CatalogueSheet, "m");
    expect(movement.phases).toEqual([{ id: 4, label: "Descente", durationSeconds: 3 }, { id: 2, label: "Remontée", durationSeconds: null }]);
    expect(movement.nextPhaseId).toBe(5);
  });
});

describe("format 3.0.0 — conversion déterministe des fichiers 2.0.0 (MOUV-ADM-20261117)", () => {
  const converted = () => {
    const result = parseMovementCatalogueFile(legacyCatalogue());
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    return result;
  };

  it("position de départ reprise au début des étapes, nouvelle révision datée de la précédente, champs abandonnés retirés", () => {
    const result = converted();
    expect(result.sourceFormatVersion).toBe("2.0.0");
    expect(result.warnings).toEqual(expect.arrayContaining([
      { path: "formatVersion", code: "CONVERTED_FROM_V2" },
      { path: "sheets[0].content.steps", code: "STARTING_POSITION_MERGED" },
    ]));
    const sheet = result.file.sheets[0]!;
    expect(sheet.content.steps).toEqual(["Debout, charge contre la poitrine", "Écartez les pieds.", "Descendez en gardant le buste droit.", "Remontez en poussant dans les talons."]);
    expect(sheet.revision).toBe("2");
    expect(sheet.history.at(-1)).toEqual({ revision: "2", date: "2026-11-10", author: null, summary: STARTING_POSITION_MERGE_SUMMARY });
    expect(Object.keys(sheet.content)).toEqual(["name", "aliases", "equipment", "steps", "safetyNotes", "notes"]);
    expect(Object.keys(sheet.provenance)).toEqual(["origin", "upstream", "owner", "author", "rightsHolder", "license"]);
    expect(Object.keys(sheet.classification)).toEqual(["categoryId", "bodyZoneIds", "specialtyIds", "gesturalFamilyIds", "clinicalProblemIds", "anatomicalTargetIds"]);
    expect("sources" in sheet).toBe(false);
    expect("alt" in sheet.media[0]!).toBe(false);
    expect(sheet.phases).toEqual([]);
    expect(Object.keys(result.file.catalogue)).toEqual(["id", "title", "revision", "owner", "notes"]);
    expect(Object.keys(result.file.libraries[0]!)).toEqual(["libraryId", "title", "description", "revision", "history", "owner", "visibility", "members"]);
  });

  it("sans doublon : position déjà présente dans les étapes (casse, espaces, point final ignorés) → retirée sans révision", () => {
    const sheet = legacySheet() as Record<string, Record<string, unknown>>;
    sheet.content!.startingPosition = "  debout,  charge contre la poitrine ";
    sheet.content!.steps = ["Debout, charge contre la poitrine.", "Écartez les pieds."];
    const result = parseMovementCatalogueFile(legacyCatalogue([sheet]));
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    expect(result.file.sheets[0]!.content.steps).toEqual(["Debout, charge contre la poitrine.", "Écartez les pieds."]);
    expect(result.file.sheets[0]!.revision).toBe("1");
    const empty = legacySheet() as Record<string, Record<string, unknown>>;
    empty.content!.startingPosition = null;
    const again = parseMovementCatalogueFile(legacyCatalogue([empty]));
    expect(again.ok && again.file.sheets[0]!.revision).toBe("1");
  });

  it("répétée, la conversion donne le même fichier ; relu, le fichier écrit en 3.0.0 est identique", () => {
    const first = converted();
    const second = converted();
    expect(serializeMovementCatalogueFile(second.file)).toBe(serializeMovementCatalogueFile(first.file));
    const reread = parseMovementCatalogueFile(JSON.parse(serializeMovementCatalogueFile(first.file)));
    if (!reread.ok) throw new Error(JSON.stringify(reread.issues));
    expect(reread.sourceFormatVersion).toBe("3.0.0");
    expect(reread.file).toEqual(first.file);
  });

  it("licence texte → conditions connues en texte ; ayant droit égal au propriétaire → null ; identités et historique conservés", () => {
    const sheet = legacySheet() as Record<string, Record<string, unknown>>;
    sheet.provenance!.license = "Usage pédagogique";
    sheet.provenance!.rightsHolder = { kind: "PERSON", id: "coach-martin" };
    const result = parseMovementCatalogueFile(legacyCatalogue([sheet]));
    if (!result.ok) throw new Error(JSON.stringify(result.issues));
    const converted = result.file.sheets[0]!;
    expect(converted.provenance.license).toEqual({ name: null, url: null, text: "Usage pédagogique" });
    expect(converted.provenance.rightsHolder).toBeNull();
    expect(converted.sheetId).toBe("LOCAL-001");
    expect(converted.history[0]).toEqual((sheet.history as unknown as unknown[])[0]);
    expect(converted.install).toEqual({ knownLocalMovementIds: [] });
  });

  it("instantané installé (téléphone) : conversion sans reprise ni révision, notes internes retirées, idempotente", () => {
    const stored = { ...legacySheet(), content: { ...(legacySheet().content as object), notes: "Interne" } } as unknown as CatalogueSheet;
    const normalized = normalizeStoredSheet(stored);
    expect(normalized.revision).toBe("1");
    expect(normalized.content.steps).toHaveLength(3);
    expect(normalized.content.notes).toBe("");
    expect("startingPosition" in normalized.content).toBe(false);
    expect(normalizeStoredSheet(normalized)).toBe(normalized);
    const library = { ...catalogue().libraries[0], editor: null, publicationAllowed: false } as unknown as CatalogueLibrary;
    expect(Object.keys(normalizeStoredLibrary(library))).not.toContain("editor");
  });

  it("version d'avant la reprise reconstituée (révision précédente, première étape retirée)", () => {
    const sheet = converted().file.sheets[0]!;
    const before = sheetBeforeStartingPositionMerge(sheet);
    expect(before).toMatchObject({ revision: "1", content: { steps: ["Écartez les pieds.", "Descendez en gardant le buste droit.", "Remontez en poussant dans les talons."] } });
    expect(before!.history).toHaveLength(1);
    expect(sheetBeforeStartingPositionMerge(handWrittenSheet() as CatalogueSheet)).toBeNull();
  });
});

describe("format 3.0.0 — diffusion et publication", () => {
  it("notes internes (fiche, catalogue) retirées de toute diffusion ; le reste inchangé", () => {
    const file = catalogue();
    file.sheets[0].content.notes = "À revoir avec le kiné";
    file.catalogue.notes = ["Note interne"];
    file.sheets[0].media = [{ ...photo, rightsStatus: "PERMISSION_CONFIRMED" } as never];
    const recipient = withoutInternalNotes(file as MovementCatalogueFile);
    expect(recipient.sheets[0]!.content.notes).toBe("");
    expect(recipient.catalogue.notes).toEqual([]);
    const diffusable = diffusableCatalogue(file as MovementCatalogueFile);
    expect(diffusable.ok && diffusable.file.sheets[0]!.content.notes).toBe("");
    expect(diffusable.ok && diffusable.file.catalogue.notes).toEqual([]);
    expect(diffusable.ok && diffusable.file.sheets[0]!.revision).toBe("1");
  });

  it("synthèse calculée : Bibliothèque et catalogue publiables seulement si toutes les fiches ont l'autorisation système", () => {
    const file = catalogue() as MovementCatalogueFile;
    const library = file.libraries[0]!;
    expect(libraryPublicationSynthesis(file, library)).toBe(false);
    expect(cataloguePublicationSynthesis(file)).toBe(false);
    const allowed = { ...file, sheets: file.sheets.map((sheet) => ({ ...sheet, validation: { ...sheet.validation, publicationAllowed: true } })) };
    expect(libraryPublicationSynthesis(allowed, library)).toBe(true);
    expect(cataloguePublicationSynthesis(allowed)).toBe(true);
    expect(libraryPublicationSynthesis(allowed, { ...library, owner: null })).toBe(false);
    expect(libraryPublicationSynthesis(allowed, { ...library, members: [...library.members, { catalogueId: "autre", sheetId: "X" }] })).toBe(false);
  });
});

describe("marquage des photos — vue retenue (D-600)", () => {
  const withView = (view: unknown, extra: object = {}) => catalogue([{ ...handWrittenSheet(), media: [{ ...photo, ...extra, view }] } as never]);

  it("vue absente ou nulle : image retenue entière, fichier valide", () => {
    expect(parseMovementCatalogueFile(withView(undefined)).ok).toBe(true);
    expect(parseMovementCatalogueFile(withView(null)).ok).toBe(true);
  });

  it("vue valide en pourcentage, conservée par la lecture et l'aller-retour", () => {
    const view = { x: 50.5, y: 0, width: 49.5, height: 100 };
    const result = parseMovementCatalogueFile(withView(view));
    expect(result.ok && result.file.sheets[0]!.media[0]!.view).toEqual(view);
    if (!result.ok) return;
    const again = parseMovementCatalogueFile(JSON.parse(serializeMovementCatalogueFile(result.file)));
    expect(again.ok && again.file.sheets[0]!.media[0]!.view).toEqual(view);
  });

  it.each([
    ["largeur nulle", { x: 0, y: 0, width: 0, height: 50 }],
    ["hors de l'image", { x: 60, y: 0, width: 50, height: 100 }],
    ["négatif", { x: -1, y: 0, width: 10, height: 10 }],
    ["non numérique", { x: "0", y: 0, width: 10, height: 10 }],
    ["incomplet", { x: 0, y: 0, width: 10 }],
  ])("vue refusée : %s", (_label, view) => {
    expect(codes(withView(view))).toEqual(["sheets[0].media[0]:INVALID"]);
  });

  it("vue réservée aux photos", () => {
    expect(codes(withView({ x: 0, y: 0, width: 50, height: 50 }, { kind: "VIDEO" }))).toEqual(["sheets[0].media[0]:INVALID"]);
  });

  it("changer la vue change l'empreinte de la fiche (la mise à jour atteint le téléphone)", () => {
    const a = parseMovementCatalogueFile(withView({ x: 0, y: 0, width: 50, height: 100 }));
    const b = parseMovementCatalogueFile(withView({ x: 50, y: 0, width: 50, height: 100 }));
    expect(a.ok && b.ok && sheetFingerprint(a.file.sheets[0]!) !== sheetFingerprint(b.file.sheets[0]!)).toBe(true);
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
    ["phases", (s: Mutable<CatalogueSheet>) => { (s as { phases: unknown }).phases = [{ id: 1, label: "Descente", durationSeconds: null }]; }],
    ["licence", (s: Mutable<CatalogueSheet>) => { (s.provenance as { license: unknown }).license = { name: "CC BY", url: null, text: null }; }],
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
