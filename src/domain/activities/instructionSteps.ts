/**
 * PRE-5 (story 1.1, AD-22, FR-33 à FR-35, Δ01 à Δ03, NFR-9) — codec UNIQUE des
 * étapes de la Description. Stockage inchangé : la chaîne encodée vit dans
 * `activity_definitions.description` et `activities.instruction`, sans
 * migration ni conversion (FR-35). Une étape par ligne, jointes par `\n`, sans
 * numéro ; une étape ne contient jamais de saut de ligne.
 *
 * Limite (QN-1 validée par Hermann le 19/10) : `INSTRUCTION_MAX_LENGTH`
 * (1000 points de code) s'applique à la chaîne ENCODÉE, séparateurs compris,
 * ce qui garantit le CHECK `length(instruction) <= 1000` sans migration ;
 * `instructionStepsLength` en est la seule mesure. `normalizeInstruction` reste
 * la validation de la chaîne encodée, sans seconde règle.
 *
 * Fonctions pures, sans i18n. Les fonctions de saisie (`splitStepAt`,
 * `insertPastedText`, PRD §9-6) retournent la liste ; l'appelant refuse une
 * saisie dont `instructionStepsLength` dépasserait la limite.
 */

import { codePointLength } from "@/domain/sessions/validation";

/** Séparateur de lignes : `\r\n` (Windows) ou `\n`, sans étape fantôme (NFR-9). */
const LINE_BREAK = /\r?\n/;

/**
 * Décodage littéral (AD-22) : une ligne = une étape ; `null` ou `""` → `[]`.
 * Un ancien texte PRE-4 multiligne est relu par le même découpage (FR-35).
 */
export function decodeInstructionSteps(text: string | null): string[] {
  if (text === null || text === "") {
    return [];
  }
  return text.split(LINE_BREAK);
}

/**
 * Encodage (AD-22) : un saut de ligne résiduel éclate l'étape, les espaces
 * extérieurs de chaque étape sont retirés, les étapes vides sont retirées ;
 * jointure par `\n`, sans numéro ; `null` si aucune étape ne reste.
 */
export function encodeInstructionSteps(steps: readonly string[]): string | null {
  const kept = steps
    .flatMap((step) => step.split(LINE_BREAK))
    .map((step) => step.trim())
    .filter((step) => step !== "");
  return kept.length === 0 ? null : kept.join("\n");
}

/** Longueur de la chaîne encodée en points de code, séparateurs compris : seule mesure de la limite (QN-1). */
export function instructionStepsLength(steps: readonly string[]): number {
  return codePointLength(encodeInstructionSteps(steps) ?? "");
}

const isStepIndex = (steps: readonly string[], index: number): boolean =>
  Number.isInteger(index) && index >= 0 && index < steps.length;

/** Position bornée dans le texte de l'étape (unités UTF-16, comme la sélection d'un `TextInput`). */
const clampPosition = (text: string, position: number): number =>
  Math.min(Math.max(Number.isFinite(position) ? Math.trunc(position) : 0, 0), text.length);

/**
 * Entrée au milieu d'une étape (PRD §9-6) : l'étape `index` est coupée au
 * curseur ; la partie après le curseur devient l'étape suivante. Index hors
 * bornes : liste inchangée.
 */
export function splitStepAt(steps: readonly string[], index: number, cursor: number): string[] {
  if (!isStepIndex(steps, index)) {
    return [...steps];
  }
  const text = steps[index]!;
  const at = clampPosition(text, cursor);
  return [...steps.slice(0, index), text.slice(0, at), text.slice(at), ...steps.slice(index + 1)];
}

/**
 * Collage dans l'étape `index`, à la place de la sélection `[start, end)`
 * (PRD §9-6) : un collage sur plusieurs lignes (`/\r?\n/`) donne une étape
 * par ligne ; la première ligne prolonge le texte avant la sélection, la
 * dernière précède le texte après elle. Aucune autre étape n'est modifiée.
 * Index hors bornes : liste inchangée.
 */
export function insertPastedText(
  steps: readonly string[],
  index: number,
  selection: { readonly start: number; readonly end: number },
  pasted: string,
): string[] {
  if (!isStepIndex(steps, index)) {
    return [...steps];
  }
  const text = steps[index]!;
  const start = clampPosition(text, Math.min(selection.start, selection.end));
  const end = clampPosition(text, Math.max(selection.start, selection.end));
  const lines = pasted.split(LINE_BREAK);
  lines[0] = text.slice(0, start) + lines[0]!;
  lines[lines.length - 1] = lines[lines.length - 1]! + text.slice(end);
  return [...steps.slice(0, index), ...lines, ...steps.slice(index + 1)];
}
