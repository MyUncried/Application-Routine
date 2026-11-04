/**
 * PRE-9 (C.1, réalignement du 02/11/2026) — Format porté par un Exercice ou un Circuit, et ses
 * réglages (référence Formats du 02/11, §1 et §14).
 *
 * Les réglages sont les valeurs du rôle du porteur (`formatParametersOf`) : Exercice autonome,
 * Circuit porteur (Format d'origine) ou membre d'un Circuit porteur. Un réglage absent est
 * facultatif ou à renseigner : sa complétude relève de la validité de configuration (D.4).
 *
 * Contrôle structurel (`elementFormatViolations`) : Format connu, réglages connus du rôle, entiers
 * au-dessus de leur borne de saisie. La version de règle n'est figée que dans l'instantané (D.2).
 *
 * Stockage : JSON versionné `{ "version": 1, "values": { … } }`, relu strictement
 * (`decodeFormatSettings`).
 */

import { formatParametersOf, isElementFormatKey, type ElementFormatKey, type FormatParameter, type FormatRole } from "./registry";

export type FormatSettingValue = number | readonly number[];

export type FormatSettings = Readonly<Record<string, FormatSettingValue>>;

export type ElementFormat = {
  readonly key: ElementFormatKey;
  readonly settings: FormatSettings;
};

export type ElementFormatViolationCode =
  | "FORMAT_UNKNOWN"
  | "FORMAT_SETTING_UNKNOWN"
  | "FORMAT_ROLE_FORBIDDEN"
  | "FORMAT_SETTING_INVALID";

export const FORMAT_SETTINGS_VERSION = 1;

function settingValueValid(parameter: FormatParameter, value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    (parameter.min === undefined || value >= parameter.min) &&
    (parameter.unit !== "FLAG" || value <= 1) &&
    (parameter.unit !== "ROLE" || value <= 2)
  );
}

/** Violations structurelles d'un Format dans le rôle de son porteur (voir l'en-tête), sans doublon. */
export function elementFormatViolations(
  format: ElementFormat,
  role: FormatRole = { kind: "EXERCISE" },
): readonly ElementFormatViolationCode[] {
  if (!isElementFormatKey(format.key)) {
    return ["FORMAT_UNKNOWN"];
  }
  const parameters = formatParametersOf(format.key, role);
  if (parameters === null) {
    return ["FORMAT_ROLE_FORBIDDEN"];
  }
  const violations = new Set<ElementFormatViolationCode>();
  const settings: Readonly<Record<string, unknown>> =
    typeof format.settings === "object" && format.settings !== null && !Array.isArray(format.settings) ? format.settings : {};
  if (settings !== format.settings) {
    violations.add("FORMAT_SETTING_INVALID");
  }
  for (const [id, value] of Object.entries(settings)) {
    const parameter = parameters.find((candidate) => candidate.id === id);
    if (parameter === undefined) {
      violations.add("FORMAT_SETTING_UNKNOWN");
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
