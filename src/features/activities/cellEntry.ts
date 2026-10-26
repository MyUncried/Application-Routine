/**
 * PRE-5, D-434 (décision de Hermann du 19/10 ; réponses QD-434-1 à 4 validées le 19/10) —
 * saisie au clavier numérique natif dans les cellules des tableaux de la Feuille
 * « Paramètres d'exécution » : fonctions pures, sans React ni React Native.
 *
 * - Durée (Cible en mode Durée, Pause, durée de phase) : au repos, unités explicites sans
 *   zéros inutiles (formateur unique `formatPhraseDuration`, AD-5) ; en saisie, « MM:SS » sur
 *   quatre chiffres dans la même cellule. Les chiffres frappés se décalent vers la gauche,
 *   quatre au plus, le séparateur « : » est inséré (`formatMmss`).
 * - Entier (Cible en mode Répétitions, QD-434-1) : chiffres frappés, trois au plus.
 * - Décimal (Charge d'une cellule) : chiffres et séparateur décimal, lus à la sortie par
 *   `parseLoadText`.
 *
 * Composition (`composeCellEntry`) : la cellule n'utilise pas la sélection native (aucune
 * poignée iOS) ; la PREMIÈRE frappe remplace la valeur, les suivantes composent, Retour
 * arrière supprime le dernier caractère. Le texte natif reçu est comparé au texte affiché :
 * ce qui a été inséré (préfixe et suffixe communs retirés) est ajouté, chaque caractère
 * retiré efface le dernier caractère de la saisie.
 *
 * Sortie (QD-434-3, QD-434-4) : secondes > 59 reportées en minutes (`01:75` → 2 min 15 s) ;
 * valeur hors bornes ramenée à la borne existante ; cellule vidée → 0 si 0 est permis,
 * sinon `null` (valeur à renseigner).
 */

/** Genre de saisie d'une cellule. */
export type CellEntryKind = "duration" | "integer" | "decimal";

/** Nombre maximal de chiffres d'une durée (« MM:SS »). */
export const CELL_DURATION_MAX_DIGITS = 4;
/** Nombre maximal de chiffres d'un entier de cellule (Répétitions : 1 à 100). */
export const CELL_INTEGER_MAX_DIGITS = 3;

/** Saisie en cours : texte composé et « première frappe pas encore reçue » (`fresh`). */
export type CellEntryState = { readonly text: string; readonly fresh: boolean };

const DIGIT = /[0-9]/u;
const DECIMAL_CHARACTER = /[0-9.,]/u;

/** Chiffres « MMSS » d'une durée en secondes (65 → « 0105 », 3535 → « 5855 »). */
export function mmssDigitsOf(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.min(99, Math.floor(seconds / 60));
  return `${String(minutes).padStart(2, "0")}${String(seconds % 60).padStart(2, "0")}`;
}

/** « MM:SS » d'une saisie de chiffres, complétée à gauche par des zéros (« 5 » → « 00:05 », « » → « 00:00 »). */
export function formatMmss(digits: string): string {
  const padded = digits.slice(-CELL_DURATION_MAX_DIGITS).padStart(CELL_DURATION_MAX_DIGITS, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

/** Texte affiché dans la cellule en saisie. */
export function cellEntryDisplay(kind: CellEntryKind, text: string): string {
  if (kind === "duration") return formatMmss(text);
  if (kind === "integer") return text === "" ? "0" : text;
  return text;
}

/** Saisie vide d'une durée ou d'un entier : la cellule affiche « 00:00 » ou « 0 », atténué. */
export function cellEntryEmpty(kind: CellEntryKind, text: string): boolean {
  return kind !== "decimal" && text === "";
}

function accepts(kind: CellEntryKind, character: string): boolean {
  return kind === "decimal" ? DECIMAL_CHARACTER.test(character) : DIGIT.test(character);
}

function maxLength(kind: CellEntryKind): number {
  if (kind === "duration") return CELL_DURATION_MAX_DIGITS;
  if (kind === "integer") return CELL_INTEGER_MAX_DIGITS;
  return Number.POSITIVE_INFINITY;
}

/**
 * Applique le changement natif `shown` → `next` à la saisie `state`. Les caractères insérés
 * qui ne conviennent pas au genre sont ignorés ; au-delà de la longueur maximale, les chiffres
 * suivants sont refusés (quatre chiffres au plus pour une durée).
 */
export function composeCellEntry(kind: CellEntryKind, state: CellEntryState, shown: string, next: string): CellEntryState {
  let prefix = 0;
  const shortest = Math.min(shown.length, next.length);
  while (prefix < shortest && shown[prefix] === next[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < shortest - prefix &&
    shown[shown.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const removed = shown.length - prefix - suffix;
  const inserted = [...next.slice(prefix, next.length - suffix)].filter((character) => accepts(kind, character));
  if (removed === 0 && inserted.length === 0) return state;
  // Première frappe : la valeur est remplacée ; un Retour arrière seul efface depuis la valeur.
  let text = state.fresh && inserted.length > 0 ? "" : state.text.slice(0, Math.max(0, state.text.length - removed));
  for (const character of inserted) {
    if (text.length >= maxLength(kind)) break;
    // Revue D-434 : un seul séparateur décimal dans la charge.
    if (kind === "decimal" && /[.,]/u.test(character) && /[.,]/u.test(text)) continue;
    text += character;
  }
  return { text, fresh: false };
}

/** Bornes d'un champ de cellule (bornes existantes, `EXECUTION_BOUNDS`). */
export type CellBounds = { readonly min: number; readonly max: number };

const clamp = (value: number, bounds: CellBounds) => Math.min(bounds.max, Math.max(bounds.min, value));

/**
 * Sortie d'une cellule de durée (QD-434-3, QD-434-4) : « MMSS » lu en minutes et secondes,
 * secondes > 59 reportées (`01:75` → 135), puis ramené dans les bornes. Vide : 0 si 0 est
 * permis (Pause), sinon `null` (valeur à renseigner).
 */
export function cellDurationSeconds(digits: string, bounds: CellBounds): number | null {
  if (digits === "") return bounds.min <= 0 ? 0 : null;
  const padded = digits.padStart(CELL_DURATION_MAX_DIGITS, "0");
  const seconds = Number(padded.slice(0, -2)) * 60 + Number(padded.slice(-2));
  return clamp(seconds, bounds);
}

/**
 * PRE-7 (D-448, point 6, recette JA2 du 26/10/2026) : sortie d'une cellule de durée de PHASE —
 * mêmes règles que `cellDurationSeconds` (bornes de la Cible), sauf qu'une saisie de 0 s reste
 * 0 s, au lieu d'être ramenée au minimum : la cellule l'affiche « 0 s » (formateur de D-434) en rouge et le ✓ est
 * refusé comme pour une durée manquante. Vide : `null` (« — », à renseigner), jamais 0.
 */
export function cellPhaseDurationSeconds(digits: string, bounds: CellBounds): number | null {
  if (digits === "") return null;
  return cellDurationSeconds(digits, { min: 0, max: bounds.max });
}

/** Sortie d'une cellule entière (Répétitions) : ramenée dans les bornes ; vide → 0 si permis, sinon `null`. */
export function cellIntegerValue(digits: string, bounds: CellBounds): number | null {
  if (digits === "") return bounds.min <= 0 ? 0 : null;
  return clamp(Number(digits), bounds);
}
