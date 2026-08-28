/**
 * Fonctions pures de conversion/bornage pour `DurationWheelPicker`
 * (Composition d'une séance, T01-S07 ; borne haute paramétrable pour
 * Durée/Pause d'Exercice, T01-S08). Aucune dépendance React Native — ni
 * `ScrollView`, ni animation — pour rester testable sans monter de
 * composant.
 *
 * Bornes validées (arbitrage V1, T01-S07-plan-composition-seance.md §5) :
 * minutes 0–59, secondes 0–59, total 0 à 3599 secondes (0 min 00 s à
 * 59 min 59 s), incrément 1 s — bornes par défaut de `toTotalSeconds`/
 * `fromTotalSeconds` ci-dessous, inchangées pour tout appelant existant qui
 * ne fournit pas `maxTotalSeconds`.
 *
 * Bornes Durée/Pause d'Exercice (T01-S08, `08` l.925) : 0 à 5999 secondes
 * (0 min 00 s à 99 min 59 s) — `WHEEL_EXERCISE_DURATION_SECONDS_MAX`/
 * `WHEEL_PAUSE_SECONDS_MAX` ci-dessous, à passer explicitement en
 * `maxTotalSeconds`.
 */

export const WHEEL_MINUTES_MAX_INDEX = 59;
export const WHEEL_SECONDS_MAX_INDEX = 59;
export const WHEEL_TOTAL_SECONDS_MAX = 3599;

/** Borne haute de la Durée d'un Exercice, en secondes (T01-S08, `08` l.925) — 99 min 59 s. */
export const WHEEL_EXERCISE_DURATION_SECONDS_MAX = 5999;
/** Borne haute de la Pause après Série d'un Exercice, en secondes (T01-S08, `08` l.925) — mêmes bornes que la Durée. */
export const WHEEL_PAUSE_SECONDS_MAX = 5999;

/** Ramène un index de colonne à `[0, max]` — jamais négatif, jamais au-delà de la dernière ligne. */
export function clampIndex(index: number, max: number): number {
  // `<= 0`, pas `< 0` : `Math.round(-0.5)` vaut `-0` (pas `0`), qui
  // échouerait un test d'égalité stricte (`Object.is`) sur `0` alors que
  // `-0 < 0` est `false` en JavaScript — cette borne couvre les deux.
  if (index <= 0) {
    return 0;
  }
  if (index > max) {
    return max;
  }
  return index;
}

/**
 * Convertit un décalage de défilement (`offsetY`, en points) en index de
 * ligne le plus proche, borné à `[0, max]`. `itemHeight <= 0` (état
 * transitoire avant layout) retombe sur l'index `0` plutôt que de produire
 * `NaN`/`Infinity`.
 */
export function offsetToIndex(offsetY: number, itemHeight: number, max: number): number {
  if (itemHeight <= 0) {
    return 0;
  }
  return clampIndex(Math.round(offsetY / itemHeight), max);
}

/** Décalage de défilement exact correspondant à un index — utilisé pour la correction d'alignement final. */
export function indexToOffset(index: number, itemHeight: number): number {
  return index * itemHeight;
}

/**
 * `minutes * 60 + secondes`, borné à `[0, maxTotalSeconds]` (par défaut
 * `WHEEL_TOTAL_SECONDS_MAX` = 3599, V1 ; passer
 * `WHEEL_EXERCISE_DURATION_SECONDS_MAX`/`WHEEL_PAUSE_SECONDS_MAX` pour
 * l'Exercice, T01-S08).
 */
export function toTotalSeconds(
  minutes: number,
  seconds: number,
  maxTotalSeconds: number = WHEEL_TOTAL_SECONDS_MAX,
): number {
  const total = minutes * 60 + seconds;
  if (total < 0) {
    return 0;
  }
  if (total > maxTotalSeconds) {
    return maxTotalSeconds;
  }
  return total;
}

/**
 * Inverse de `toTotalSeconds` : décompose une durée totale bornée en
 * minutes/secondes, secondes toujours bornées à `[0, 59]`, minutes bornées
 * par `maxTotalSeconds` (mêmes valeurs par défaut que `toTotalSeconds`).
 */
export function fromTotalSeconds(
  totalSeconds: number,
  maxTotalSeconds: number = WHEEL_TOTAL_SECONDS_MAX,
): { minutes: number; seconds: number } {
  const bounded = clampTotalSeconds(totalSeconds, maxTotalSeconds);
  return { minutes: Math.floor(bounded / 60), seconds: bounded % 60 };
}

function clampTotalSeconds(totalSeconds: number, maxTotalSeconds: number): number {
  if (totalSeconds < 0) {
    return 0;
  }
  if (totalSeconds > maxTotalSeconds) {
    return maxTotalSeconds;
  }
  return totalSeconds;
}

/** Index maximal de la colonne minutes pour une borne totale donnée (`5999` → `99`, `3599` → `59`). */
export function minutesMaxIndexFor(maxTotalSeconds: number): number {
  return Math.floor(maxTotalSeconds / 60);
}

/** Affichage à deux chiffres (`0` → `"00"`, `59` → `"59"`). */
export function formatTwoDigits(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Bornes de la roulette à colonne unique Répétitions/Séries d'un Exercice
 * (T01-S08, D-092) — `NumberWheelPicker`. Distinctes des bornes de durée
 * ci-dessus : ce sont des valeurs entières directement affichées (1 à 99),
 * jamais des secondes.
 */
export const WHEEL_NUMBER_MIN = 1;
export const WHEEL_NUMBER_MAX = 99;
