/**
 * Contrat partagé de la boîte d'arrivée des Mouvements envoyés par le téléphone (W2, 11/11/2026).
 *
 * Le téléphone envoie, par le Wi-Fi local, une enveloppe `KODJO_MOVEMENT_INBOX` 1.0.0 décrivant
 * des Mouvements personnels. L'administration (PC) la valide avec CE module (même code côté
 * serveur et page), la conserve, puis la personne qui administre décide explicitement : créer une
 * fiche (`LOCAL_CREATED`, privée, brouillon, non publiable, aucune identité inventée) ou rapprocher
 * le Mouvement d'une fiche existante (`install.knownLocalMovementIds`).
 *
 * Limites de ce lot : les médias des Mouvements personnels ne sont PAS transférés (seul leur
 * nombre `mediaCount` est transmis). Le Wi-Fi n'est qu'un canal de transport (A-6).
 *
 * Module pur : aucune lecture de fichier ni accès réseau.
 */
import { instructionStepsLength } from "@/domain/activities/instructionSteps";
import { normalizeMovementName } from "@/domain/activities/Movement";
import { canonicalJson, type MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type { NewSheetInput } from "@/domain/catalogue/catalogueEditing";
import {
  codePointLength,
  INSTRUCTION_MAX_LENGTH,
  validateExerciseName,
} from "@/domain/sessions/validation";

export const MOVEMENT_INBOX_FORMAT = "KODJO_MOVEMENT_INBOX";
export const MOVEMENT_INBOX_FORMAT_VERSION = "1.0.0";
/** Mouvements par envoi. */
export const MOVEMENT_INBOX_MAX_MOVEMENTS = 200;
/**
 * Étapes : contrat du Mouvement de l'application (QN-1, 19/10/2026) — total encodé ≤ 1 000 points de code,
 * aucune borne par étape ni par nombre d'étapes, afin qu'aucun Mouvement valide du téléphone ne soit refusé.
 * [11/11/2026 : bornes « 20 étapes de 65 points de code » de l'administration Web retirées de la boîte d'arrivée ;
 * elles restent des repères éditoriaux de l'administration.]
 */
export const MOVEMENT_INBOX_MAX_ALIASES = 20;
export const MOVEMENT_INBOX_MAX_ID_LENGTH = 128;
export const MOVEMENT_INBOX_MAX_LABEL_LENGTH = 80;
export const MOVEMENT_INBOX_MAX_DEVICE_NAME_LENGTH = 60;
export const MOVEMENT_INBOX_MAX_MEDIA_COUNT = 1000;

export type InboxMovement = {
  /** Identifiant local du Mouvement sur le téléphone (`Movement.id`). */
  readonly movementId: string;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly steps: readonly string[];
  readonly categoryId: string;
  readonly categoryLabel: string;
  readonly bodyZoneIds: readonly string[];
  /** Libellés alignés sur `bodyZoneIds` (même longueur, même ordre). */
  readonly bodyZoneLabels: readonly string[];
  /** Nombre de médias du Mouvement sur le téléphone ; les médias ne sont pas transférés. */
  readonly mediaCount: number;
};

export type MovementInboxEnvelope = {
  readonly format: typeof MOVEMENT_INBOX_FORMAT;
  readonly formatVersion: typeof MOVEMENT_INBOX_FORMAT_VERSION;
  readonly sentAt: string;
  readonly device: { readonly name: string };
  readonly movements: readonly InboxMovement[];
};

export type MovementInboxIssue = {
  readonly path: string;
  readonly code: "REQUIRED" | "INVALID" | "UNRECOGNIZED" | "TOO_LONG" | "TOO_MANY" | "DUPLICATE";
};

export type MovementInboxParseResult =
  | {
      readonly ok: true;
      /** Enveloppe normalisée : seules les propriétés du contrat sont conservées. */
      readonly envelope: MovementInboxEnvelope;
      /** Doublons exacts retirés (même `movementId`, même contenu). */
      readonly collapsedDuplicates: number;
    }
  | { readonly ok: false; readonly issues: readonly MovementInboxIssue[] };

type Raw = Record<string, unknown>;
const isObject = (value: unknown): value is Raw => typeof value === "object" && value !== null && !Array.isArray(value);
const CONTROL = /[\u0000-\u001f\u007f]/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Libellé ou identifiant : chaîne non blanche, sans caractère de contrôle, bornée. */
function boundedText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim() !== "" && !CONTROL.test(value) && codePointLength(value) <= max;
}

/** Empreinte du contenu d'un Mouvement reçu (idempotence des envois). */
export function inboxMovementFingerprint(movement: InboxMovement): string {
  return canonicalJson(movement, null);
}

/**
 * Validation stricte d'une enveloppe : toute anomalie la refuse en entier (aucun envoi partiel).
 * Les propriétés inconnues sont ignorées (compatibilité ascendante) et non conservées.
 */
export function parseMovementInbox(input: unknown): MovementInboxParseResult {
  const issues: MovementInboxIssue[] = [];
  const issue = (path: string, code: MovementInboxIssue["code"]) => issues.push({ path, code });
  if (!isObject(input)) return { ok: false, issues: [{ path: "", code: "INVALID" }] };
  if (input.format !== MOVEMENT_INBOX_FORMAT) issue("format", "UNRECOGNIZED");
  if (input.formatVersion !== MOVEMENT_INBOX_FORMAT_VERSION) issue("formatVersion", "UNRECOGNIZED");
  if (issues.length > 0) return { ok: false, issues };
  if (typeof input.sentAt !== "string" || !ISO_INSTANT.test(input.sentAt) || Number.isNaN(Date.parse(input.sentAt))) {
    issue("sentAt", "INVALID");
  }
  const device = input.device;
  if (!isObject(device) || !boundedText(device.name, MOVEMENT_INBOX_MAX_DEVICE_NAME_LENGTH)) issue("device.name", "INVALID");
  const raw = input.movements;
  if (!Array.isArray(raw)) {
    issue("movements", "REQUIRED");
    return { ok: false, issues };
  }
  if (raw.length === 0) issue("movements", "REQUIRED");
  if (raw.length > MOVEMENT_INBOX_MAX_MOVEMENTS) {
    issue("movements", "TOO_MANY");
    return { ok: false, issues };
  }
  const movements: InboxMovement[] = [];
  const byId = new Map<string, string>();
  let collapsedDuplicates = 0;
  raw.forEach((item, index) => {
    const movement = parseMovement(item, "movements[" + index + "]", issue);
    if (movement === null) return;
    const fingerprint = inboxMovementFingerprint(movement);
    const known = byId.get(movement.movementId);
    if (known === undefined) {
      byId.set(movement.movementId, fingerprint);
      movements.push(movement);
    } else if (known === fingerprint) {
      collapsedDuplicates += 1;
    } else {
      // Deux contenus différents pour un même Mouvement dans un même envoi : ambigu.
      issue("movements[" + index + "].movementId", "DUPLICATE");
    }
  });
  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    envelope: {
      format: MOVEMENT_INBOX_FORMAT,
      formatVersion: MOVEMENT_INBOX_FORMAT_VERSION,
      sentAt: input.sentAt as string,
      device: { name: ((device as Raw).name as string).trim() },
      movements,
    },
    collapsedDuplicates,
  };
}

function parseMovement(
  item: unknown,
  path: string,
  issue: (path: string, code: MovementInboxIssue["code"]) => void,
): InboxMovement | null {
  if (!isObject(item)) {
    issue(path, "INVALID");
    return null;
  }
  const before = { count: 0 };
  const flag = (at: string, code: MovementInboxIssue["code"]) => {
    before.count += 1;
    issue(path + "." + at, code);
  };
  if (!boundedText(item.movementId, MOVEMENT_INBOX_MAX_ID_LENGTH)) flag("movementId", "INVALID");

  let name = "";
  if (typeof item.name !== "string") {
    flag("name", "REQUIRED");
  } else {
    const validated = validateExerciseName(item.name);
    if (!validated.ok) flag("name", validated.violations.some((v) => v.code === "TOO_LONG") ? "TOO_LONG" : "REQUIRED");
    else name = validated.value;
  }

  const aliases: string[] = [];
  if (!Array.isArray(item.aliases) || !item.aliases.every((alias) => typeof alias === "string")) {
    flag("aliases", "INVALID");
  } else if (item.aliases.length > MOVEMENT_INBOX_MAX_ALIASES) {
    flag("aliases", "TOO_MANY");
  } else {
    for (const alias of item.aliases as string[]) {
      const validated = validateExerciseName(alias);
      if (!validated.ok) {
        flag("aliases", "INVALID");
        break;
      }
      aliases.push(validated.value);
    }
    if (new Set(aliases.map(normalizeMovementName)).size !== aliases.length) flag("aliases", "DUPLICATE");
  }

  const steps: string[] = [];
  if (!Array.isArray(item.steps) || !item.steps.every((step) => typeof step === "string")) {
    flag("steps", "INVALID");
  } else {
    for (const step of item.steps as string[]) {
      const trimmed = step.trim();
      if (trimmed === "" || /[\r\n]/.test(trimmed)) {
        flag("steps", "INVALID");
        break;
      }
      steps.push(trimmed);
    }
    if (instructionStepsLength(steps) > INSTRUCTION_MAX_LENGTH) flag("steps", "TOO_LONG");
  }

  if (!boundedText(item.categoryId, MOVEMENT_INBOX_MAX_ID_LENGTH)) flag("categoryId", "INVALID");
  if (!boundedText(item.categoryLabel, MOVEMENT_INBOX_MAX_LABEL_LENGTH)) flag("categoryLabel", "INVALID");
  const zoneIds = item.bodyZoneIds;
  const zoneLabels = item.bodyZoneLabels;
  if (!Array.isArray(zoneIds) || zoneIds.length === 0 ||
      !zoneIds.every((id) => boundedText(id, MOVEMENT_INBOX_MAX_ID_LENGTH))) {
    flag("bodyZoneIds", "INVALID");
  } else if (new Set(zoneIds).size !== zoneIds.length) {
    flag("bodyZoneIds", "DUPLICATE");
  }
  if (!Array.isArray(zoneLabels) || !zoneLabels.every((label) => boundedText(label, MOVEMENT_INBOX_MAX_LABEL_LENGTH)) ||
      !Array.isArray(zoneIds) || zoneLabels.length !== zoneIds.length) {
    flag("bodyZoneLabels", "INVALID");
  }
  if (typeof item.mediaCount !== "number" || !Number.isInteger(item.mediaCount) || item.mediaCount < 0 ||
      item.mediaCount > MOVEMENT_INBOX_MAX_MEDIA_COUNT) {
    flag("mediaCount", "INVALID");
  }
  if (before.count > 0) return null;
  return {
    movementId: item.movementId as string,
    name,
    aliases,
    steps,
    categoryId: item.categoryId as string,
    categoryLabel: (item.categoryLabel as string).trim(),
    bodyZoneIds: [...(zoneIds as string[])],
    bodyZoneLabels: (zoneLabels as string[]).map((label) => label.trim()),
    mediaCount: item.mediaCount as number,
  };
}

export type InboxCollision = {
  readonly sheetId: string;
  readonly reason: "KNOWN_LOCAL_ID" | "SAME_NAME";
};

/**
 * Fiches du catalogue susceptibles de correspondre au Mouvement reçu : identifiant local déjà
 * rapproché (`install.knownLocalMovementIds`) ou nom identique après normalisation (nom ou alias
 * de la fiche). Signalement seulement : aucune fusion automatique.
 */
export function findInboxCollisions(file: MovementCatalogueFile, movement: InboxMovement): readonly InboxCollision[] {
  const found: InboxCollision[] = [];
  const key = normalizeMovementName(movement.name);
  for (const sheet of file.sheets) {
    if (sheet.install.knownLocalMovementIds.includes(movement.movementId)) {
      found.push({ sheetId: sheet.sheetId, reason: "KNOWN_LOCAL_ID" });
    } else if ([sheet.content.name, ...sheet.content.aliases].some((name) => normalizeMovementName(name) === key)) {
      found.push({ sheetId: sheet.sheetId, reason: "SAME_NAME" });
    }
  }
  return found;
}

/** Correspondance proposée d'un identifiant ou, à défaut, d'un libellé avec un référentiel du catalogue. */
export function matchReference(
  entries: readonly { readonly id: string; readonly label: string }[],
  id: string,
  label: string,
): string | null {
  const byId = entries.find((entry) => entry.id === id);
  if (byId) return byId.id;
  const wanted = normalizeMovementName(label);
  const byLabel = entries.find((entry) => normalizeMovementName(entry.label) === wanted);
  return byLabel ? byLabel.id : null;
}

/** Catégorie et Zones proposées pour une fiche créée depuis la boîte d'arrivée (jamais inventées). */
export function proposedClassification(
  file: MovementCatalogueFile,
  movement: InboxMovement,
): { readonly categoryId: string | null; readonly bodyZoneIds: readonly string[]; readonly unmatchedZones: readonly string[] } {
  const categoryId = matchReference(file.references.categories, movement.categoryId, movement.categoryLabel);
  const bodyZoneIds: string[] = [];
  const unmatchedZones: string[] = [];
  movement.bodyZoneIds.forEach((id, index) => {
    const matched = matchReference(file.references.bodyZones, id, movement.bodyZoneLabels[index] ?? "");
    if (matched !== null && !bodyZoneIds.includes(matched)) bodyZoneIds.push(matched);
    else if (matched === null) unmatchedZones.push(movement.bodyZoneLabels[index] ?? id);
  });
  return { categoryId, bodyZoneIds, unmatchedZones };
}

export const INBOX_SHEET_BASIS = "RECEIVED_FROM_PHONE (Mouvement personnel reçu par Wi-Fi, non approuvé)";

/**
 * Données de création d'une fiche à partir d'un Mouvement reçu : contenu projeté (nom, alias,
 * étapes), Catégorie et Zones choisies dans les référentiels du catalogue, rapprochement
 * d'installation `[movementId]`. Propriétaire et auteur restent inconnus (`null`).
 */
export function inboxMovementToSheetInput(
  movement: InboxMovement,
  classification: { readonly categoryId: string; readonly bodyZoneIds: readonly string[] },
): NewSheetInput {
  return {
    name: movement.name,
    aliases: [...movement.aliases],
    steps: [...movement.steps],
    categoryId: classification.categoryId,
    bodyZoneIds: [...classification.bodyZoneIds],
    basis: INBOX_SHEET_BASIS,
    owner: null,
    author: null,
    knownLocalMovementIds: [movement.movementId],
    notes: movement.mediaCount > 0
      ? "Reçu du téléphone avec " + movement.mediaCount + " média(s) non transféré(s)."
      : "",
  };
}
