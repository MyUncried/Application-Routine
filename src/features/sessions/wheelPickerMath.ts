/**
 * Fonctions pures de conversion/bornage pour `DurationWheelPicker`
 * (Composition d'une séance, T01-S07). Aucune dépendance React Native — ni
 * `ScrollView`, ni animation — pour rester testable sans monter de
 * composant.
 *
 * Bornes validées (arbitrage V1, T01-S07-plan-composition-seance.md §5) :
 * minutes 0–59, secondes 0–59, total 0 à 3599 secondes (0 min 00 s à
 * 59 min 59 s), incrément 1 s.
 */

export const WHEEL_MINUTES_MAX_INDEX = 59;
export const WHEEL_SECONDS_MAX_INDEX = 59;
export const WHEEL_TOTAL_SECONDS_MAX = 3599;

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

/** `minutes * 60 + secondes`, borné à `[0, 3599]` (V1). */
export function toTotalSeconds(minutes: number, seconds: number): number {
  const total = minutes * 60 + seconds;
  if (total < 0) {
    return 0;
  }
  if (total > WHEEL_TOTAL_SECONDS_MAX) {
    return WHEEL_TOTAL_SECONDS_MAX;
  }
  return total;
}

/** Inverse de `toTotalSeconds` : décompose une durée totale bornée en minutes/secondes bornées elles-mêmes à `[0, 59]`. */
export function fromTotalSeconds(totalSeconds: number): { minutes: number; seconds: number } {
  const bounded = clampTotalSeconds(totalSeconds);
  return { minutes: Math.floor(bounded / 60), seconds: bounded % 60 };
}

function clampTotalSeconds(totalSeconds: number): number {
  if (totalSeconds < 0) {
    return 0;
  }
  if (totalSeconds > WHEEL_TOTAL_SECONDS_MAX) {
    return WHEEL_TOTAL_SECONDS_MAX;
  }
  return totalSeconds;
}

/** Affichage à deux chiffres (`0` → `"00"`, `59` → `"59"`). */
export function formatTwoDigits(value: number): string {
  return value.toString().padStart(2, "0");
}
