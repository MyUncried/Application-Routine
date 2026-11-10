/**
 * CA-2 — Conversion initiale, à usage unique, du catalogue pilote vers le format autonome
 * `KODJO_MOVEMENT_CATALOGUE` v1 (10/11/2026).
 *
 * Entrées : corpus pilote (27/10/2026), préclassement v0 non approuvé, taxonomie v0 proposée,
 * référentiels Catégories et Zones de l'application, et un export « brouillons » de
 * l'administration Web (lecture seule ; aucune modification d'OVH).
 *
 * Après conversion, le fichier produit fait foi et s'édite directement : ce module n'est pas le
 * mécanisme de gestion du catalogue. Toute propriété source inconnue fait échouer la conversion,
 * afin qu'aucune donnée ne soit perdue en silence.
 */
import type { EditorialActorRef, EditorialReviewStatus } from "@/domain/catalogue/MovementEditorialProvenance";
import {
  MOVEMENT_CATALOGUE_FORMAT,
  MOVEMENT_CATALOGUE_FORMAT_VERSION,
  type CatalogueMedia,
  type CatalogueReferenceEntry,
  type CatalogueReferences,
  type CatalogueSheet,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";
import { PREDEFINED_CATEGORIES } from "@/domain/categories/defaults";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";

export const PILOT_CATALOGUE_ID = "kodjo.pilote-60";
export const PILOT_CATALOGUE_PATH = "catalogue/catalogues/kodjo-pilote-60.catalogue.json";
/** Gestionnaire administratif du catalogue pilote (décision du 10/11/2026) — ni propriétaire ni ayant droit des fiches. */
export const PILOT_CATALOGUE_MANAGER = { kind: "ORGANIZATION", id: "ankusha" } as const;

type Json = Record<string, unknown>;

export type PilotSources = {
  readonly corpus: Json;
  readonly preclassement: Json;
  readonly taxonomy: Json;
  readonly adminDrafts: Json;
  /** Date de conversion portée dans l'historique des fiches (AAAA-MM-JJ). */
  readonly convertedOn: string;
};

type TaxonomyAxis = "specialties" | "gesturalFamilies" | "clinicalProblems" | "anatomicalTargets";
const EDIT_AXES = [
  ["specialtyIds", "specialties"],
  ["gesturalFamilyIds", "gesturalFamilies"],
  ["clinicalProblemIds", "clinicalProblems"],
  ["anatomicalTargetIds", "anatomicalTargets"],
] as const;

const CORPUS_RECORD_KEYS = [
  "candidateId", "originalId", "name", "reviewStatus", "proposedSpecialties", "kodjoCategoryId",
  "kodjoBodyZoneIds", "originalClassification", "description", "originalPrescriptionContext", "evidence",
  "validation",
];
const CORPUS_DESCRIPTION_KEYS = ["startingPosition", "equipment", "steps", "safetyNotes"];
const CORPUS_EVIDENCE_KEYS = ["usageStatement", "sourceId", "section", "url"];
const CORPUS_VALIDATION_KEYS = ["classification", "clinical", "rights"];
const PRECLASSEMENT_RECORD_KEYS = [
  "candidateId", "originalId", "name", "categoryId", "bodyZoneIds", "gesturalFamilyIds", "anatomicalTargetIds",
  "specialtyIds", "clinicalProblemIds", "review", "licensing", "clinicalValidation", "publicationAllowed",
];
const EDIT_KEYS = [
  "name", "steps", "aliases", "categoryId", "bodyZoneIds", "specialtyIds", "gesturalFamilyIds",
  "clinicalProblemIds", "anatomicalTargetIds", "owner", "authors", "notes", "editorialStatus", "media",
];
const DRAFTS_KEYS = [
  "schemaVersion", "kind", "publicationAllowed", "movementEdits", "referenceAdditions", "referenceLabels", "glossary",
];

function fail(message: string): never {
  throw new Error("Conversion du catalogue pilote refusée : " + message);
}

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function onlyKeys(value: unknown, allowed: readonly string[], where: string): Json {
  if (!isObject(value)) fail(where + " n'est pas un objet");
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) fail(where + " contient des propriétés non prises en charge : " + unknown.join(", "));
  return value;
}

const strings = (value: unknown, where: string): string[] => {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) fail(where + " : liste de textes attendue");
  return [...value] as string[];
};
const text = (value: unknown, where: string): string => {
  if (typeof value !== "string") fail(where + " : texte attendu");
  return value;
};
const textOrNull = (value: unknown, where: string): string | null => (value === null ? null : text(value, where));
const stringRecord = (value: unknown, where: string): Record<string, string> => {
  if (!isObject(value) || !Object.values(value).every((item) => typeof item === "string")) fail(where + " : textes attendus");
  return { ...(value as Record<string, string>) };
};

/** Libellés d'acteur de l'administration (`{kind, id}`) conservés tels quels. */
function actor(value: unknown, where: string): EditorialActorRef | null {
  if (value === null || value === undefined) return null;
  const record = onlyKeys(value, ["kind", "id"], where);
  return { kind: text(record.kind, where + ".kind") as EditorialActorRef["kind"], id: text(record.id, where + ".id") };
}

function readDrafts(drafts: Json) {
  onlyKeys(drafts, DRAFTS_KEYS, "export de brouillons");
  if (drafts.kind !== "KODJO_ADMIN_DRAFTS" || drafts.schemaVersion !== "0.1.0" || drafts.publicationAllowed !== false) {
    fail("export de brouillons KODJO_ADMIN_DRAFTS 0.1.0 non publiable attendu");
  }
  if (!isObject(drafts.movementEdits) || !isObject(drafts.referenceAdditions) ||
      !isObject(drafts.referenceLabels) || !Array.isArray(drafts.glossary)) {
    fail("export de brouillons incomplet");
  }
  return {
    edits: drafts.movementEdits,
    additions: drafts.referenceAdditions,
    labels: drafts.referenceLabels,
    glossary: drafts.glossary as unknown[],
  };
}

function references(taxonomy: Json, additions: Json, labels: Json): CatalogueReferences {
  if (taxonomy.documentType !== "KODJO_TAXONOMY_DRAFT" || !isObject(taxonomy.proposedAxes)) {
    fail("taxonomie v0 KODJO_TAXONOMY_DRAFT attendue");
  }
  const axes = taxonomy.proposedAxes;
  const axis = (name: TaxonomyAxis): CatalogueReferenceEntry[] => {
    const definition = axes[name];
    if (!isObject(definition) || !Array.isArray(definition.values)) fail("axe de taxonomie absent : " + name);
    const relabel = isObject(labels[name]) ? (labels[name] as Json) : {};
    const base = (definition.values as unknown[]).map((value, index) => {
      const entry = onlyKeys(value, ["id", "label", "kind", "status", "requiresClinicalValidation"], name + "[" + index + "]");
      const id = text(entry.id, name + ".id");
      return {
        id,
        label: typeof relabel[id] === "string" ? (relabel[id] as string) : text(entry.label, name + ".label"),
        kind: entry.kind === undefined ? null : text(entry.kind, name + ".kind"),
        status: entry.status === undefined ? null : text(entry.status, name + ".status"),
      };
    });
    const added = (Array.isArray(additions[name]) ? (additions[name] as unknown[]) : []).map((value, index) => {
      const entry = onlyKeys(value, ["id", "label", "kind"], "ajout " + name + "[" + index + "]");
      const id = text(entry.id, name + ".id");
      return {
        id,
        label: typeof relabel[id] === "string" ? (relabel[id] as string) : text(entry.label, name + ".label"),
        kind: entry.kind === undefined || entry.kind === null ? null : text(entry.kind, name + ".kind"),
        status: "ADMIN_ADDITION",
      };
    });
    return [...base, ...added];
  };
  return {
    categories: [...PREDEFINED_CATEGORIES]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category) => ({ id: category.id, label: category.name, kind: null, status: null })),
    bodyZones: [...BODY_ZONES]
      .sort((a, b) => a.order - b.order)
      .map((zone) => ({ id: zone.id, label: zone.name, kind: null, status: null })),
    specialties: axis("specialties"),
    gesturalFamilies: axis("gesturalFamilies"),
    clinicalProblems: axis("clinicalProblems"),
    anatomicalTargets: axis("anatomicalTargets"),
  };
}

/** Conversion déterministe : mêmes sources → fichier identique. */
export function convertPilotCorpus(sources: PilotSources): MovementCatalogueFile {
  const { corpus, preclassement, taxonomy, convertedOn } = sources;
  if (corpus.kind !== "KODJO_EDITORIAL_CANDIDATE_CORPUS" || corpus.publicationAllowed !== false ||
      !Array.isArray(corpus.records)) {
    fail("corpus pilote KODJO_EDITORIAL_CANDIDATE_CORPUS non publiable attendu");
  }
  if (preclassement.kind !== "KODJO_CLASSIFICATION_PROPOSALS" || preclassement.publicationAllowed !== false ||
      !Array.isArray(preclassement.records)) {
    fail("préclassement KODJO_CLASSIFICATION_PROPOSALS non publiable attendu");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(convertedOn)) fail("date de conversion invalide");
  const drafts = readDrafts(sources.adminDrafts);
  const workbook = text(corpus.sourceWorkbook, "corpus.sourceWorkbook");
  const referenceDate = text(corpus.sourceReferenceDate, "corpus.sourceReferenceDate");

  const proposals = new Map<string, Json>();
  for (const [index, value] of (preclassement.records as unknown[]).entries()) {
    const record = onlyKeys(value, PRECLASSEMENT_RECORD_KEYS, "préclassement[" + index + "]");
    proposals.set(text(record.candidateId, "préclassement.candidateId"), record);
  }
  const candidateIds = new Set<string>();
  const sheetIdByCandidate = new Map<string, string>();
  for (const [index, value] of (corpus.records as unknown[]).entries()) {
    const record = onlyKeys(value, CORPUS_RECORD_KEYS, "corpus[" + index + "]");
    candidateIds.add(text(record.candidateId, "corpus.candidateId"));
    sheetIdByCandidate.set(record.candidateId as string, text(record.originalId, "corpus.originalId"));
  }
  for (const candidateId of Object.keys(drafts.edits)) {
    if (!candidateIds.has(candidateId)) fail("brouillon d'une fiche étrangère au corpus : " + candidateId);
  }

  const sheets: CatalogueSheet[] = (corpus.records as Json[]).map((record) => {
    const candidateId = record.candidateId as string;
    const sheetId = record.originalId as string;
    const proposal = proposals.get(candidateId);
    if (!proposal || proposal.originalId !== sheetId || proposal.publicationAllowed !== false) {
      fail("préclassement absent ou incohérent pour " + candidateId);
    }
    // Champs de correspondance du corpus jamais renseignés : vérifiés vides, donc sans perte.
    if (record.kodjoCategoryId !== null || strings(record.kodjoBodyZoneIds, candidateId + ".kodjoBodyZoneIds").length > 0) {
      fail("correspondance KODJO renseignée dans le corpus pour " + candidateId + " : à reprendre explicitement");
    }
    const description = onlyKeys(record.description, CORPUS_DESCRIPTION_KEYS, candidateId + ".description");
    const evidence = onlyKeys(record.evidence, CORPUS_EVIDENCE_KEYS, candidateId + ".evidence");
    const validation = onlyKeys(record.validation, CORPUS_VALIDATION_KEYS, candidateId + ".validation");
    const review = onlyKeys(proposal.review, ["status", "needsReview", "flags", "note"], candidateId + ".review");
    const edit = Object.hasOwn(drafts.edits, candidateId)
      ? onlyKeys(drafts.edits[candidateId], EDIT_KEYS, "brouillon " + candidateId)
      : null;

    // Règle de l'importeur pilote : la valeur éditée prime ; vide → préclassement non approuvé.
    const listOr = (edited: unknown, proposed: unknown, where: string) => {
      const value = edited === undefined ? [] : strings(edited, "brouillon " + where);
      return value.length > 0 ? value : strings(proposed, "préclassement " + where);
    };
    const classification = {
      categoryId: (edit && typeof edit.categoryId === "string" && edit.categoryId) ||
        textOrNull(proposal.categoryId, candidateId + ".categoryId"),
      bodyZoneIds: listOr(edit?.bodyZoneIds, proposal.bodyZoneIds, candidateId + ".bodyZoneIds"),
      ...Object.fromEntries(EDIT_AXES.map(([field]) => [field, listOr(edit?.[field], proposal[field], candidateId + "." + field)])),
    } as { categoryId: string | null; bodyZoneIds: string[]; specialtyIds: string[]; gesturalFamilyIds: string[]; clinicalProblemIds: string[]; anatomicalTargetIds: string[] };

    const authors = edit?.authors === undefined ? [] : (edit.authors as unknown[]).map((value, index) =>
      actor(value, candidateId + ".authors[" + index + "]") as EditorialActorRef);

    return {
      sheetId,
      revision: "1",
      history: [{
        revision: "1",
        date: convertedOn,
        author: null,
        summary: "Conversion initiale : corpus pilote du " + referenceDate +
          ", préclassement v0 non approuvé et brouillons d'administration.",
      }],
      provenance: {
        gestureId: null,
        origin: "EXTERNAL_IMPORTED",
        upstream: { catalogueId: "xlsx:" + workbook, sheetId, revision: referenceDate },
        owner: actor(edit?.owner, candidateId + ".owner"),
        authors,
        publisher: null,
        rightsHolder: null,
        license: null,
        reviewStatus: (edit?.editorialStatus === undefined ? "DRAFT" : text(edit.editorialStatus, candidateId + ".editorialStatus")) as EditorialReviewStatus,
        visibility: "PRIVATE",
      },
      content: {
        name: edit ? text(edit.name, candidateId + ".name") : text(record.name, candidateId + ".name"),
        aliases: edit?.aliases === undefined ? [] : strings(edit.aliases, candidateId + ".aliases"),
        startingPosition: textOrNull(description.startingPosition ?? null, candidateId + ".startingPosition"),
        equipment: textOrNull(description.equipment ?? null, candidateId + ".equipment"),
        steps: edit ? strings(edit.steps, candidateId + ".steps") : strings(description.steps, candidateId + ".steps"),
        safetyNotes: textOrNull(description.safetyNotes ?? null, candidateId + ".safetyNotes"),
        notes: edit?.notes === undefined ? "" : text(edit.notes, candidateId + ".notes"),
      },
      classification: {
        ...classification,
        basis: text(preclassement.status, "préclassement.status") + " (préclassement v0" +
          (edit ? ", modifié dans l'administration" : "") + ")",
        review: {
          status: text(review.status, candidateId + ".review.status"),
          needsReview: review.needsReview === true,
          flags: strings(review.flags, candidateId + ".review.flags"),
          note: textOrNull(review.note, candidateId + ".review.note"),
        },
        original: stringRecord(record.originalClassification, candidateId + ".originalClassification"),
        originalProposedSpecialties: strings(record.proposedSpecialties, candidateId + ".proposedSpecialties"),
      },
      sources: {
        documentary: {
          sourceId: textOrNull(evidence.sourceId ?? null, candidateId + ".evidence.sourceId"),
          section: textOrNull(evidence.section ?? null, candidateId + ".evidence.section"),
          url: textOrNull(evidence.url ?? null, candidateId + ".evidence.url"),
          usageStatement: textOrNull(evidence.usageStatement ?? null, candidateId + ".evidence.usageStatement"),
        },
        prescriptionContext: stringRecord(record.originalPrescriptionContext, candidateId + ".originalPrescriptionContext"),
      },
      validation: {
        classification: text(validation.classification, candidateId + ".validation.classification"),
        clinical: text(validation.clinical, candidateId + ".validation.clinical"),
        rights: text(validation.rights, candidateId + ".validation.rights"),
        corpusReview: textOrNull(record.reviewStatus ?? null, candidateId + ".reviewStatus"),
        licensing: textOrNull(proposal.licensing ?? null, candidateId + ".licensing"),
        clinicalValidation: textOrNull(proposal.clinicalValidation ?? null, candidateId + ".clinicalValidation"),
        publicationAllowed: false,
      },
      // Médias de l'administration conservés intégralement et dans leur ordre.
      media: edit?.media === undefined ? [] : ([...(edit.media as unknown[])] as CatalogueMedia[]),
      install: { knownLocalMovementIds: [candidateId] },
    };
  });

  const glossary = drafts.glossary.map((value, index) => {
    const entry = onlyKeys(value, ["id", "term", "definition", "synonyms", "relatedCandidateIds"], "glossaire[" + index + "]");
    return {
      id: text(entry.id, "glossaire.id"),
      term: text(entry.term, "glossaire.term"),
      definition: text(entry.definition, "glossaire.definition"),
      synonyms: strings(entry.synonyms, "glossaire.synonyms"),
      relatedSheetIds: strings(entry.relatedCandidateIds, "glossaire.relatedCandidateIds").map((candidateId) =>
        sheetIdByCandidate.get(candidateId) ?? fail("glossaire : fiche inconnue " + candidateId)),
    };
  });

  return {
    format: MOVEMENT_CATALOGUE_FORMAT,
    formatVersion: MOVEMENT_CATALOGUE_FORMAT_VERSION,
    catalogue: {
      id: PILOT_CATALOGUE_ID,
      title: "Catalogue pilote KODJO — 60 fiches de test",
      revision: "1",
      owner: null,
      // Décision du 10/11/2026 : ANKUSHA gère le fichier pilote, sans propriété ni droits sur les fiches.
      manager: PILOT_CATALOGUE_MANAGER,
      publisher: null,
      publicationAllowed: false,
      notes: [
        "Conversion initiale (CA-2) du " + convertedOn + " ; ce fichier fait désormais foi et s'édite directement.",
        "Source : " + workbook + " (référence du " + referenceDate + ").",
        ...strings(corpus.notes, "corpus.notes"),
        ...strings(preclassement.notes, "préclassement.notes"),
        ...strings(taxonomy.guardrails, "taxonomie.guardrails"),
      ],
    },
    references: references(taxonomy, drafts.additions, drafts.labels),
    glossary,
    sheets,
  };
}
