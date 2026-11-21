import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { parseMovementCatalogueFile, projectSheetToMovement, STARTING_POSITION_MERGE_SUMMARY } from "@/domain/catalogue/MovementCatalogueFile";
import { PREDEFINED_CATEGORIES } from "@/domain/categories/defaults";
import { preparePilotMovementImport } from "@/features/activities/pilotMovementImport";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";

import { convertPilotCorpus, PILOT_CATALOGUE_PATH } from "../convertPilotCorpus";

/**
 * CA-2 — conversion initiale du catalogue pilote. Le fichier versionné doit être exactement la
 * conversion des sources (régénération : `KODJO_WRITE_CATALOGUE=1 npx jest tools/catalogue`).
 * Après cette conversion, il fait foi et s'édite directement.
 *
 * Format 3.0.0 (18/11/2026, MOUV-ADM-20261117) : la conversion produit la forme 2.0.0 historique puis la relit par
 * la conversion du format (position de départ reprise au début des étapes — révision 2 —, champs abandonnés
 * retirés). Le fichier versionné (2.0.0, non modifié) relu par le format doit donner exactement ce résultat.
 */

const root = join(__dirname, "..", "..", "..");
const json = (path: string) => JSON.parse(readFileSync(join(root, path), "utf8")) as Record<string, unknown>;
const corpus = json("catalogue/pilote/mouvements-60-candidats.json");
const preclassement = json("catalogue/referentiels/preclassement-60-candidats-v0.json");
const taxonomy = json("catalogue/referentiels/taxonomie-v0-proposition.json");

/** Export réel de Hermann du 9/11 (408 octets) : aucune modification, aucun média. */
const emptyDrafts = () => ({
  schemaVersion: "0.1.0",
  kind: "KODJO_ADMIN_DRAFTS",
  publicationAllowed: false,
  movementEdits: {} as Record<string, unknown>,
  referenceAdditions: { specialties: [], gesturalFamilies: [], clinicalProblems: [], anatomicalTargets: [] } as Record<string, unknown[]>,
  referenceLabels: { specialties: {}, gesturalFamilies: {}, clinicalProblems: {}, anatomicalTargets: {} } as Record<string, Record<string, string>>,
  glossary: [] as unknown[],
});

const convert = (adminDrafts: Record<string, unknown> = emptyDrafts()) =>
  convertPilotCorpus({ corpus, preclassement, taxonomy, adminDrafts, convertedOn: "2026-11-10" });

const records = corpus.records as { candidateId: string; originalId: string; name: string; description: Record<string, unknown> }[];

const media = (id: string, rightsStatus = "UNVERIFIED") => ({
  id, kind: "PHOTO", storage: "EMBEDDED", url: "data:image/webp;base64,QUJD", fileName: id + ".webp",
  caption: "", sourceUrl: null, attribution: "", license: "", rightsStatus,
});

/** Média tel que saisi dans un brouillon 2.0.0 (texte alternatif encore présent, retiré par la conversion). */
const legacyMedia = (id: string, rightsStatus = "UNVERIFIED") => ({ ...media(id, rightsStatus), alt: "Photo " + id });

/** Étapes 3.0.0 d'une fiche du corpus : position de départ en première étape, puis les étapes. */
const mergedSteps = (description: Record<string, unknown>, steps = description.steps as string[]) =>
  typeof description.startingPosition === "string" && description.startingPosition.trim() !== ""
    ? [description.startingPosition.trim(), ...steps]
    : steps;

/** Brouillons d'administration représentatifs : édition, médias ordonnés, taxonomie, acteurs, glossaire. */
function editedDrafts() {
  const drafts = emptyDrafts();
  const first = records[0]!;
  const second = records[45]!;
  drafts.movementEdits[first.candidateId] = {
    name: "Élévation jambe tendue (revue)",
    steps: ["Allongez-vous sur le dos.", "Contractez la cuisse.", "Levez la jambe tendue."],
    aliases: ["SLR", "Straight leg raise"],
    categoryId: "renforcement",
    bodyZoneIds: ["genoux", "cuisses"],
    specialtyIds: ["reeducation", "pilates"],
    gesturalFamilyIds: [],
    clinicalProblemIds: ["knee-strength-deficit"],
    anatomicalTargetIds: ["quadriceps"],
    owner: { kind: "ORGANIZATION", id: "ankusha" },
    authors: [{ kind: "PERSON", id: "kine-1" }],
    notes: "Revoir la consigne de respiration.",
    editorialStatus: "IN_REVIEW",
    media: [legacyMedia("media-bbbbbb"), legacyMedia("media-aaaaaa", "RESTRICTED")],
  };
  drafts.movementEdits[second.candidateId] = {
    name: second.name,
    steps: (second.description.steps as string[]),
    aliases: [],
    categoryId: null,
    bodyZoneIds: [],
    specialtyIds: [],
    gesturalFamilyIds: [],
    clinicalProblemIds: [],
    anatomicalTargetIds: [],
    owner: null,
    authors: [],
    notes: "",
    editorialStatus: "DRAFT",
    media: [],
  };
  drafts.referenceAdditions.gesturalFamilies = [{ id: "rotation", label: "Rotation", kind: null }];
  drafts.referenceLabels.specialties = { hyrox: "HYROX (course)" };
  drafts.glossary = [
    { id: "g-2", term: "SLR", definition: "Straight leg raise.", synonyms: ["Élévation"], relatedCandidateIds: [first.candidateId] },
    { id: "g-1", term: "Gainage", definition: "Stabilisation du tronc.", synonyms: [], relatedCandidateIds: [] },
  ];
  return drafts;
}

describe("CA-2 — conversion initiale du catalogue pilote", () => {
  const converted = convert();

  it("le fichier versionné est exactement la conversion des sources (reproductible)", () => {
    const path = join(root, PILOT_CATALOGUE_PATH);
    if (process.env.KODJO_WRITE_CATALOGUE === "1") writeFileSync(path, JSON.stringify(converted, null, 2) + "\n", "utf8");
    const versioned = parseMovementCatalogueFile(JSON.parse(readFileSync(path, "utf8")));
    if (!versioned.ok) throw new Error(JSON.stringify(versioned.issues));
    expect(versioned.file).toEqual(converted);
    expect(convert()).toEqual(converted);
  });

  it("produit un fichier valide de 60 fiches, propriétaire inconnu signalé et non déduit", () => {
    const result = parseMovementCatalogueFile(converted);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.file.sheets).toHaveLength(60);
    expect(new Set(result.warnings.map((warning) => warning.code))).toEqual(new Set(["UNKNOWN_OWNER"]));
    // 60 fiches + en-tête + Bibliothèque de recette (A-1), toutes à propriétaire inconnu.
    expect(result.warnings).toHaveLength(62);
    expect(result.file.libraries).toEqual([expect.objectContaining({
      libraryId: "kodjo.pilote-60", visibility: "PRIVATE", owner: null,
    })]);
    expect(result.file.libraries[0]!.members).toHaveLength(60);
  });

  it("identités distinctes : sheetId d'origine, catalogue d'origine, identifiant local pilot:* en rapprochement", () => {
    converted.sheets.forEach((sheet, index) => {
      const record = records[index]!;
      expect(sheet.sheetId).toBe(record.originalId);
      expect(sheet.install.knownLocalMovementIds).toEqual([record.candidateId]);
      expect(sheet.sheetId).not.toBe(record.candidateId);
      expect(sheet.provenance).toMatchObject({
        origin: "EXTERNAL_IMPORTED",
        upstream: { catalogueId: "xlsx:KODJO_Catalogue_reeducation_fitness_60_fiches.xlsx", sheetId: record.originalId, revision: "2026-10-27" },
        owner: null,
        author: null,
      });
    });
    expect(converted.catalogue.id).toBe("kodjo.pilote-60");
  });

  it("décisions du 10/11 et du 17/11 : propriétaire inconnu, import Excel du 27/10 ; gestionnaire, diffuseur, sources et statuts retirés (MOUV-ADM)", () => {
    expect(converted.catalogue).toMatchObject({ owner: null });
    expect(Object.keys(converted.catalogue)).toEqual(["id", "title", "revision", "owner", "notes"]);
    converted.sheets.forEach((sheet) => {
      expect(sheet.provenance).toEqual({
        origin: "EXTERNAL_IMPORTED",
        upstream: sheet.provenance.upstream,
        owner: null,
        author: null,
        rightsHolder: null,
        license: null,
      });
      expect(sheet.provenance.upstream).toEqual({
        catalogueId: "xlsx:KODJO_Catalogue_reeducation_fitness_60_fiches.xlsx",
        sheetId: sheet.sheetId,
        revision: "2026-10-27",
      });
      // MOUV-ADM n° 18 : section « sources » supprimée ; provenance d'import et droits conservés.
      expect("sources" in sheet).toBe(false);
      expect(sheet.validation.publicationAllowed).toBe(false);
    });
  });

  /** Mouvements de l'importeur historique, position de départ ajoutée en première étape (format 3.0.0). */
  const legacyWithPosition = (movements: ReturnType<typeof preparePilotMovementImport>["movements"]) =>
    movements.map((movement, index) => ({
      ...movement,
      description: encodeInstructionSteps(mergedSteps(records[index]!.description, decodeInstructionSteps(movement.description))),
    }));

  it("E8 : la projection des 60 fiches égale les Mouvements de l'importeur actuel, position de départ en tête des étapes", () => {
    const legacy = preparePilotMovementImport(emptyDrafts()).movements;
    expect(converted.sheets.map((sheet) => projectSheetToMovement(sheet, sheet.install.knownLocalMovementIds[0]!))).toEqual(legacyWithPosition(legacy));
  });

  it("E8 avec brouillons édités : même projection que l'importeur actuel, position de départ en tête des étapes", () => {
    const drafts = editedDrafts();
    const legacy = preparePilotMovementImport(drafts).movements;
    const sheets = convert(drafts).sheets;
    expect(sheets.map((sheet) => projectSheetToMovement(sheet, sheet.install.knownLocalMovementIds[0]!))).toEqual(legacyWithPosition(legacy));
  });

  it("conserve tout le contenu descriptif du corpus, étapes structurées et ordonnées dans le contenu", () => {
    converted.sheets.forEach((sheet, index) => {
      const description = records[index]!.description;
      expect(sheet.content).toMatchObject({
        name: records[index]!.name,
        steps: mergedSteps(description),
        equipment: description.equipment,
        safetyNotes: description.safetyNotes,
      });
      expect(sheet.content).not.toHaveProperty("startingPosition");
      expect(sheet.classification).not.toHaveProperty("steps");
      // Reprise de la position de départ : révision 2 de la fiche, résumé explicite.
      expect(sheet.revision).toBe("2");
      expect(sheet.history.at(-1)).toMatchObject({ revision: "2", author: null, summary: STARTING_POSITION_MERGE_SUMMARY });
    });
  });

  it("conserve classifications courantes et statuts de validation ; classification d'origine et sources retirées (MOUV-ADM n° 6 à 9, 18)", () => {
    const raw = corpus.records as Record<string, Record<string, unknown>>[];
    const proposals = preclassement.records as Record<string, unknown>[];
    converted.sheets.forEach((sheet, index) => {
      expect(Object.keys(sheet.classification)).toEqual(["categoryId", "bodyZoneIds", "specialtyIds", "gesturalFamilyIds", "clinicalProblemIds", "anatomicalTargetIds"]);
      expect("sources" in sheet).toBe(false);
      expect(sheet.validation).toMatchObject({ ...raw[index]!.validation, corpusReview: raw[index]!.reviewStatus });
      expect(sheet.classification).toMatchObject({
        categoryId: proposals[index]!.categoryId,
        bodyZoneIds: proposals[index]!.bodyZoneIds,
        specialtyIds: proposals[index]!.specialtyIds,
        gesturalFamilyIds: proposals[index]!.gesturalFamilyIds,
        clinicalProblemIds: proposals[index]!.clinicalProblemIds,
        anatomicalTargetIds: proposals[index]!.anatomicalTargetIds,
      });
      expect(sheet.validation).toMatchObject({
        licensing: proposals[index]!.licensing,
        clinicalValidation: proposals[index]!.clinicalValidation,
        publicationAllowed: false,
      });
    });
  });

  it("référentiels : Catégories et Zones de l'application, taxonomie v0 dans l'ordre", () => {
    expect(converted.references.categories.map((entry) => entry.id)).toEqual(PREDEFINED_CATEGORIES.map((category) => category.id));
    expect(converted.references.bodyZones.map((entry) => entry.id)).toEqual(BODY_ZONES.map((zone) => zone.id));
    const axes = taxonomy.proposedAxes as Record<string, { values: { id: string; kind?: string }[] }>;
    for (const axis of ["specialties", "gesturalFamilies", "clinicalProblems", "anatomicalTargets"] as const) {
      expect(converted.references[axis].map((entry) => entry.id)).toEqual(axes[axis]!.values.map((value) => value.id));
    }
    expect(converted.references.clinicalProblems[0]).toMatchObject({ kind: "FUNCTIONAL_DEFICIT", status: "PROPOSED" });
  });

  it("brouillons d'administration : édition, médias ordonnés, acteurs, notes, statut, référentiels et glossaire conservés", () => {
    const file = convert(editedDrafts());
    expect(parseMovementCatalogueFile(file).ok).toBe(true);
    const sheet = file.sheets[0]!;
    expect(sheet.content).toMatchObject({
      name: "Élévation jambe tendue (revue)",
      steps: mergedSteps(records[0]!.description, ["Allongez-vous sur le dos.", "Contractez la cuisse.", "Levez la jambe tendue."]),
      aliases: ["SLR", "Straight leg raise"],
      notes: "Revoir la consigne de respiration.",
    });
    expect(sheet.classification).toMatchObject({
      bodyZoneIds: ["genoux", "cuisses"],
      specialtyIds: ["reeducation", "pilates"],
      clinicalProblemIds: ["knee-strength-deficit"],
    });
    expect(sheet.provenance).toMatchObject({
      owner: { kind: "ORGANIZATION", id: "ankusha" },
      author: { kind: "PERSON", id: "kine-1" },
    });
    expect(sheet.provenance).not.toHaveProperty("reviewStatus");
    expect(sheet.media.map((item) => item.id)).toEqual(["media-bbbbbb", "media-aaaaaa"]);
    expect(sheet.media[1]).toEqual(media("media-aaaaaa", "RESTRICTED"));
    expect(file.references.gesturalFamilies.at(-1)).toEqual({ id: "rotation", label: "Rotation", kind: null, status: "ADMIN_ADDITION" });
    expect(file.references.specialties.find((entry) => entry.id === "hyrox")?.label).toBe("HYROX (course)");
    expect(file.glossary.map((entry) => entry.id)).toEqual(["g-2", "g-1"]);
    expect(file.glossary[0]!.relatedSheetIds).toEqual([records[0]!.originalId]);
    // Fiche éditée sans valeurs : le préclassement non approuvé reste la base, comme l'importeur actuel.
    expect(file.sheets[45]!.classification.categoryId).toBe((preclassement.records as { categoryId: string }[])[45]!.categoryId);
  });

  it("refuse toute perte silencieuse : propriété source inconnue ou fiche étrangère", () => {
    const unknownField = editedDrafts();
    (unknownField.movementEdits[records[0]!.candidateId] as Record<string, unknown>).difficulty = "facile";
    expect(() => convert(unknownField)).toThrow(/propriétés non prises en charge : difficulty/);
    const foreign = emptyDrafts();
    foreign.movementEdits["pilot:INCONNU"] = {};
    expect(() => convert(foreign)).toThrow(/fiche étrangère/);
    expect(() => convert({ ...emptyDrafts(), kind: "AUTRE" })).toThrow(/KODJO_ADMIN_DRAFTS/);
    // MOUV-D1 : plusieurs auteurs dans un brouillon → refus explicite, jamais de choix arbitraire.
    const twoAuthors = editedDrafts();
    (twoAuthors.movementEdits[records[0]!.candidateId] as Record<string, unknown>).authors =
      [{ kind: "PERSON", id: "kine-1" }, { kind: "PERSON", id: "kine-2" }];
    expect(() => convert(twoAuthors)).toThrow(/plusieurs auteurs/);
  });
});
