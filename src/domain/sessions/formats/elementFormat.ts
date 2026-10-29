/**
 * PRE-9 (C.1, ARB-03) — Format porté par un élément (Circuit ou Exercice) et ses réglages.
 *
 * Les réglages sont les valeurs des seuls paramètres réglables du Format (FMT-04) : une constante
 * vient du registre et n'est jamais enregistrée (FMT-03), une valeur calculée non plus (FMT-05). Un
 * réglage absent n'est pas renseigné : sa complétude relève de la validité de configuration (C.3,
 * D.4). La version de règle n'est figée que dans l'instantané (D.2, ch09 l.593-598).
 *
 * Contrôle structurel (`elementFormatViolations`) : Format connu, porteur admis, réglages connus,
 * réglables, entiers et au-dessus de leur borne. Aucune règle propre au Format (compte commun,
 * volume non nul, organisation) n'est appliquée ici (C.3).
 *
 * Stockage : JSON versionné `{ "version": 1, "values": { … } }` (sur le modèle
 * d'`execution_parameters`), relu strictement (`decodeFormatSettings`).
 */

import { FORMAT_REGISTRY, isElementFormatKey, type ElementFormatKey, type FormatParameter } from "./registry";

export type FormatSettingValue = number | readonly number[];

export type FormatSettings = Readonly<Record<string, FormatSettingValue>>;

export type ElementFormat = {
  readonly key: ElementFormatKey;
  readonly settings: FormatSettings;
};

export type FormatCarrierKind = "EXERCISE" | "CIRCUIT";

export type ElementFormatViolationCode =
  | "FORMAT_UNKNOWN"
  | "FORMAT_CARRIER_RESERVED"
  | "FORMAT_SETTING_UNKNOWN"
  | "FORMAT_SETTING_NOT_ADJUSTABLE"
  | "FORMAT_SETTING_INVALID";

export const FORMAT_SETTINGS_VERSION = 1;

function settingValueValid(parameter: FormatParameter, value: unknown): boolean {
  const valid = (item: unknown) =>
    typeof item === "number" && Number.isInteger(item) && (parameter.min === undefined || item >= parameter.min);
  if (parameter.list !== undefined) {
    return Array.isArray(value) && value.length > 0 && value.every(valid);
  }
  return valid(value);
}

/** Violations structurelles d'un Format porté par un élément (voir l'en-tête), sans doublon. */
export function elementFormatViolations(format: ElementFormat, carrier: FormatCarrierKind): readonly ElementFormatViolationCode[] {
  if (!isElementFormatKey(format.key)) {
    return ["FORMAT_UNKNOWN"];
  }
  const descriptor = FORMAT_REGISTRY[format.key];
  const violations = new Set<ElementFormatViolationCode>();
  if (carrier === "CIRCUIT" && descriptor.carriers.CIRCUIT.status === "RESERVED") {
    violations.add("FORMAT_CARRIER_RESERVED");
  }
  const settings: Readonly<Record<string, unknown>> =
    typeof format.settings === "object" && format.settings !== null && !Array.isArray(format.settings) ? format.settings : {};
  if (settings !== format.settings) {
    violations.add("FORMAT_SETTING_INVALID");
  }
  for (const [id, value] of Object.entries(settings)) {
    const parameter = descriptor.parameters.find((candidate) => candidate.id === id);
    if (parameter === undefined) {
      violations.add("FORMAT_SETTING_UNKNOWN");
    } else if (parameter.lock !== "ADJUSTABLE") {
      violations.add("FORMAT_SETTING_NOT_ADJUSTABLE");
    } else if (!settingValueValid(parameter, value)) {
      violations.add("FORMAT_SETTING_INVALID");
    }
  }
  return [...violations];
}

/** Copie indépendante (les listes ne sont jamais partagées entre deux éléments). */
export function cloneElementFormat(format: ElementFormat): ElementFormat {
  return {
    key: format.key,
    settings: Object.fromEntries(
      Object.entries(format.settings).map(([id, value]) => [id, Array.isArray(value) ? [...value] : value]),
    ),
  };
}

export function elementFormatsEqual(a: ElementFormat | null | undefined, b: ElementFormat | null | undefined): boolean {
  if ((a ?? null) === null || (b ?? null) === null) {
    return (a ?? null) === (b ?? null);
  }
  return a!.key === b!.key && encodeFormatSettings(a!.settings) === encodeFormatSettings(b!.settings);
}

/** JSON versionné, clés triées (une même configuration a une seule écriture). */
export function encodeFormatSettings(settings: FormatSettings): string {
  const values = Object.fromEntries(Object.keys(settings).sort().map((id) => [id, settings[id]]));
  return JSON.stringify({ version: FORMAT_SETTINGS_VERSION, values });
}

/** Lecture stricte : JSON invalide, autre version ou valeur non numérique → `null`. */
export function decodeFormatSettings(json: string): FormatSettings | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  const { version, values } = parsed as { version?: unknown; values?: unknown };
  if (version !== FORMAT_SETTINGS_VERSION || typeof values !== "object" || values === null || Array.isArray(values)) {
    return null;
  }
  const isNumber = (item: unknown) => typeof item === "number" && Number.isFinite(item);
  for (const value of Object.values(values)) {
    if (!(isNumber(value) || (Array.isArray(value) && value.every(isNumber)))) {
      return null;
    }
  }
  return values as FormatSettings;
}
