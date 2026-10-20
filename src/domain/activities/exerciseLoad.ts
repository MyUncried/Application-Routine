/**
 * PRE-5 (story 1.1, AD-19, FR-10 à FR-14, Δ16 à Δ20, Δ48) — module UNIQUE de
 * la charge d'un Exercice : arrondi, règles du zéro, réactivation, format et
 * analyse du texte saisi. Les transitions du Brouillon (story 2.1) appellent
 * ces fonctions ; l'interface ne calcule ni arrondi ni zéro.
 *
 * La charge est en kg, finie, ≥ 0, multiple de 0,25, sans plafond ; elle n'a
 * aucun effet sur les cibles, durées, cadence, pauses, Condition d'arrêt et
 * calculs, quel que soit le Mode (Δ48).
 *
 * Fonctions pures, sans i18n : `formatLoadKg` est un formateur du domaine, comme
 * ceux de la Phrase (AD-32).
 */

import { normalizeEffective, seriesRowsOf, type ExecutionParametersInput, type ExecutionSeries } from "./ExecutionParameters";

/** Pas de la charge, en kg (AD-19). */
export const LOAD_STEP_KG = 0.25;

/** Charge posée à la réactivation quand aucune valeur positive n'est mémorisée (FR-14). */
export const REACTIVATED_LOAD_KG = 0.25;

/**
 * Multiple de 0,25 kg supérieur ou égal (AD-19) : 1,3 → 1,5 ; 0,01 → 0,25 ;
 * 1,25 → 1,25 ; 0 reste 0. Une valeur négative ou non finie donne 0.
 */
export function roundLoadUp(kg: number): number {
  if (!Number.isFinite(kg) || kg <= 0) {
    return 0;
  }
  // kg / 0,25 = kg × 4 ; les multiples de 0,25 sont exacts en binaire.
  return Math.ceil(kg * 4) / 4;
}

/** Charges effectives (N = 1 = identiques) : la valeur commune, ou celle de chaque ligne. */
function effectiveLoads(parameters: ExecutionParametersInput): readonly number[] {
  return seriesRowsOf(normalizeEffective(parameters)).map((row) => row.loadKg);
}

/**
 * Règles du zéro (FR-14, Δ19) : en identiques, une charge commune à 0 fait
 * passer à Sans ; en variables, une ligne à 0 vaut « sans charge » pour cette
 * Série seulement, et la charge reste active tant qu'une ligne est positive ;
 * toutes les lignes à 0 font passer à Sans. Aucune valeur n'est modifiée : un
 * zéro n'est jamais remplacé par une ancienne charge positive.
 */
export function normalizeLoad<T extends ExecutionParametersInput>(parameters: T): T {
  if (!parameters.loadEnabled || effectiveLoads(parameters).some((kg) => kg > 0)) {
    return parameters;
  }
  return { ...parameters, loadEnabled: false };
}

function withLoad(series: ExecutionSeries, loadKg: number): ExecutionSeries {
  return series.kind === "UNIFORM"
    ? { ...series, loadKg }
    : { kind: "VARIABLE", rows: series.rows.map((row) => ({ ...row, loadKg })) };
}

/**
 * Passage à Avec (FR-14, Δ20) : aucune valeur mémorisée, ou toutes nulles
 * ([0 ; 0 ; 0]) → 0,25 kg sur l'uniforme et sur chaque ligne ; sinon les
 * valeurs conservées sous Sans sont restaurées telles quelles, zéros compris.
 */
export function reactivateLoad<T extends ExecutionParametersInput>(parameters: T): T {
  const loads = seriesRowsOf(parameters).map((row) => row.loadKg);
  const series = loads.every((kg) => kg === 0) ? withLoad(parameters.series, REACTIVATED_LOAD_KG) : parameters.series;
  return { ...parameters, series, loadEnabled: true };
}

/**
 * Nombre seul d'une charge (AD-19, AD-32 ; story 1.2) : séparateur décimal du
 * français, sans zéro inutile (« 1,5 », « 1,25 », « 20 »). Sert aux listes de
 * la Phrase (« (charges : 20, 12,5 kg) »), où l'unité n'est écrite qu'une fois.
 */
export function formatLoadValue(kg: number): string {
  return String(kg).replace(".", ",");
}

/**
 * SEUL formateur de kg (AD-19, AD-32) : séparateur décimal du français, sans
 * zéro inutile (« 1,5 kg », « 1,25 kg », « 20 kg »). Dérive de `formatLoadValue`.
 */
export function formatLoadKg(kg: number): string {
  return `${formatLoadValue(kg)} kg`;
}

/** Résultat de l'analyse d'un texte de charge saisi (AD-19, AD-26). */
export type LoadTextParse =
  | { readonly kind: "value"; readonly kg: number }
  | { readonly kind: "empty" }
  | { readonly kind: "invalid" };

const LOAD_TEXT_PATTERN = /^(\d+([.,]\d*)?|[.,]\d+)$/;

/**
 * Analyse du texte d'un champ de charge (AD-19) : « , » et « . » sont acceptés
 * (la touche décimale du `decimal-pad` iOS suit la région de l'appareil). La
 * valeur lue est retournée sans arrondi (`roundLoadUp` appartient aux
 * transitions). Champ vide (ou blanc) → `empty` (vaut 0 à la sortie du
 * champ, §9-10) ; texte illisible ou négatif → `invalid` (la valeur
 * précédente reste).
 */
export function parseLoadText(text: string): LoadTextParse {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { kind: "empty" };
  }
  if (!LOAD_TEXT_PATTERN.test(trimmed)) {
    return { kind: "invalid" };
  }
  const kg = Number(trimmed.replace(",", "."));
  return Number.isFinite(kg) ? { kind: "value", kg } : { kind: "invalid" };
}
