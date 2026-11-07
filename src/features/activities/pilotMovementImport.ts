/**
 * KODJO — import local du catalogue pilote depuis un export de l'administration Web.
 *
 * Cette passerelle est un outil de préparation, NON une publication du catalogue.
 * Le fichier source reste l'export « brouillons » de l'administration OVH ;
 * les 60 candidats et les classifications provisoires sont figés dans la build.
 * Aucune donnée clinique, auteur, licence ou média n'est inférée.
 */
import { encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { normalizeMovementName, validateMovement, type Movement } from "@/domain/activities/Movement";
import type { MovementCatalogueService } from "@/features/activities/MovementCatalogueService";

import pilot from "../../../catalogue/pilote/mouvements-60-candidats.json";
import classification from "../../../catalogue/referentiels/preclassement-60-candidats-v0.json";

export const PILOT_IMPORT_COUNT = 60;
export const PILOT_ADMIN_JSON_MAX_BYTES = 24 * 1024 * 1024;

export type PilotImportPreview = {
  readonly movements: readonly Movement[];
  readonly excludedMediaCount: number;
  readonly overriddenCount: number;
  /** Les fichiers administratifs restent la seule source des données éditoriales complètes. */
  readonly editorialMetadataImported: false;
};

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((element) => typeof element === "string");
}
function fail(message: string): never {
  throw new Error("Import KODJO refusé : " + message);
}

type AdminEdit = {
  name: string;
  steps: string[];
  aliases: string[];
  categoryId: string | null;
  bodyZoneIds: string[];
  media: unknown[];
};

function readAdminEdit(value: unknown, id: string): AdminEdit {
  if (!object(value)) fail("fiche modifiée invalide : " + id);
  const { name, steps, aliases, categoryId, bodyZoneIds, media } = value;
  if (typeof name !== "string" || !strings(steps) || !strings(aliases) ||
      !(categoryId === null || typeof categoryId === "string") ||
      !strings(bodyZoneIds) || !Array.isArray(media)) {
    fail("champs incompatibles dans la fiche " + id);
  }
  return { name, steps, aliases, categoryId, bodyZoneIds, media };
}

/**
 * Utilise TOUTES les fiches du pilote, et remplace uniquement par les données
 * de brouillon saisies par l'administrateur. Les champs catégorie/zone restés
 * vides reçoivent les valeurs du PRÉCLASSEMENT NON APPROUVÉ.
 *
 * Le bloc media est conservé uniquement dans le JSON source : convertir une
 * photo base64 éditoriale en MediaAsset du mobile est un autre chantier.
 * Le nombre de médias non portés est explicite pour éviter toute perte tacite.
 */
export function preparePilotMovementImport(raw: unknown): PilotImportPreview {
  if (!object(raw) ||
      raw.kind !== "KODJO_ADMIN_DRAFTS" ||
      raw.schemaVersion !== "0.1.0" ||
      raw.publicationAllowed !== false ||
      !object(raw.movementEdits) ||
      !object(raw.referenceAdditions) ||
      !object(raw.referenceLabels) ||
      !Array.isArray(raw.glossary)) {
    fail("le fichier doit être un export « brouillons » KODJO non publiable de version 0.1.0");
  }
  if (pilot.kind !== "KODJO_EDITORIAL_CANDIDATE_CORPUS" ||
      pilot.publicationAllowed !== false ||
      classification.kind !== "KODJO_CLASSIFICATION_PROPOSALS" ||
      classification.publicationAllowed !== false ||
      pilot.records.length !== PILOT_IMPORT_COUNT ||
      classification.records.length !== PILOT_IMPORT_COUNT) {
    fail("les sources pilotes intégrées à l'application sont incompatibles");
  }

  const ids = new Set(pilot.records.map((record) => record.candidateId));
  if (ids.size !== PILOT_IMPORT_COUNT) fail("identifiants source dupliqués");
  const edits = raw.movementEdits;
  for (const candidateId of Object.keys(edits)) {
    if (!ids.has(candidateId)) fail("la sauvegarde comporte un mouvement étranger au pilote : " + candidateId);
  }
  const assignments = new Map(classification.records.map((record) => [record.candidateId, record]));
  const results: Movement[] = [];
  let excludedMediaCount = 0;
  let overriddenCount = 0;

  for (const candidate of pilot.records) {
    const proposed = assignments.get(candidate.candidateId);
    if (!proposed ||
        proposed.originalId !== candidate.originalId ||
        proposed.review.status !== "PENDING" ||
        proposed.publicationAllowed !== false) {
      fail("préclassement incomplet/non autorisé pour " + candidate.candidateId);
    }
    const edit = Object.hasOwn(edits, candidate.candidateId)
      ? readAdminEdit(edits[candidate.candidateId], candidate.candidateId)
      : null;
    if (edit) {
      overriddenCount++;
      excludedMediaCount += edit.media.length;
    }
    const movement: Movement = {
      id: candidate.candidateId,
      name: edit?.name ?? candidate.name,
      aliases: edit?.aliases ?? [],
      description: encodeInstructionSteps(edit?.steps ?? candidate.description.steps),
      categoryId: edit?.categoryId || proposed.categoryId,
      bodyZoneIds: edit?.bodyZoneIds.length ? edit.bodyZoneIds : proposed.bodyZoneIds,
      media: [],
      phases: [],
      nextPhaseId: 1,
      levelGroup: null,
    };
    const valid = validateMovement(movement);
    if (!valid.ok) fail(candidate.candidateId + " : " + valid.violations.map((x) => x.field).join(", "));
    results.push(valid.value);
  }
  const normalizedNames = results.map((item) => normalizeMovementName(item.name));
  if (new Set(normalizedNames).size !== PILOT_IMPORT_COUNT) {
    fail("deux fiches sources ont le même nom KODJO normalisé");
  }
  return { movements: results, excludedMediaCount, overriddenCount, editorialMetadataImported: false };
}

function equivalent(a: Movement, b: Movement): boolean {
  return a.id === b.id &&
    a.name === b.name &&
    a.description === b.description &&
    a.categoryId === b.categoryId &&
    JSON.stringify(a.aliases) === JSON.stringify(b.aliases) &&
    JSON.stringify(a.bodyZoneIds) === JSON.stringify(b.bodyZoneIds) &&
    a.media.length === 0 &&
    a.levelGroup === null &&
    a.phases.length === 0 &&
    a.nextPhaseId === 1;
}

/**
 * Préflight sans écriture : refuse tout conflit de nom ou identité, puis crée
 * uniquement les entrées absentes. Réimport exact idempotent. Les créations
 * se font via le service Catalogue existant ; en cas d'erreur SQLite imprévue,
 * une nouvelle tentative peut reprendre les Mouvements déjà insérés.
 *
 * Pas de changement des Mouvements préexistants et aucune création d'Exercice.
 */
export async function installPilotMovements(
  catalogue: Pick<MovementCatalogueService, "listEntries" | "createIndependent">,
  preview: PilotImportPreview,
): Promise<{ readonly inserted: number; readonly unchanged: number }> {
  if (preview.movements.length !== PILOT_IMPORT_COUNT) fail("la sauvegarde ne contient pas 60 fiches");
  const existing = (await catalogue.listEntries()).map((entry) => entry.movement);
  const byId = new Map(existing.map((m) => [m.id, m]));
  const byName = new Map(existing.map((m) => [normalizeMovementName(m.name), m]));
  const toCreate: Movement[] = [];
  let unchanged = 0;

  for (const movement of preview.movements) {
    const prior = byId.get(movement.id);
    if (prior) {
      if (!equivalent(prior, movement)) fail(movement.id + " existe déjà avec un contenu différent — aucune écriture");
      unchanged++;
      continue;
    }
    const nameOwner = byName.get(normalizeMovementName(movement.name));
    if (nameOwner) fail("le nom « " + movement.name + " » est déjà utilisé par " + nameOwner.id + " — aucune écriture");
    toCreate.push(movement);
  }

  let inserted = 0;
  for (const movement of toCreate) {
    const result = await catalogue.createIndependent(movement);
    if (result.status !== "SAVED") {
      throw new Error(
        "Import interrompu après " + inserted + " insertion(s) : " + movement.id + " (" + result.status +
        "). Les mouvements déjà insérés ne sont pas effacés ; relancer avec le même fichier est sûr.",
      );
    }
    inserted++;
  }
  return { inserted, unchanged };
}
