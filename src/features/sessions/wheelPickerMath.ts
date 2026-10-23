/**
 * Fonctions pures de conversion/bornage pour `DurationWheelPicker`
 * (Composition d'une séance, T01-S07 ; borne haute paramétrable pour
 * Durée/Pause d'Exercice, T01-S08). Aucune dépendance React Native — ni
 * `ScrollView`, ni animation — pour rester testable sans monter de
 * composant.
 *
 * Bornes validées (arbitrage V1, T01-S07-plan-composition-seance.md §5) :
 * minutes 0–59, secondes 0–59, total 0 à 3599 secondes (0 min 00 s à
 * 59 min 59 s) — bornes par défaut de `toTotalSeconds`/`fromTotalSeconds`
 * ci-dessous, inchangées pour tout appelant existant qui ne fournit pas
 * `maxTotalSeconds`.
 *
 * **Pas des secondes — R4-05, nouvelle décision post-Figma** (`[ChatGPT]
 * REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED`,
 * 2026-09-03) : le pas de `5` s (résolution de l'ARBITRAGE 1, cycle
 * `PHASE02 REWORK01 ADDENDUM`, ci-dessous conservée pour mémoire) est
 * **remplacé** par un pas de `1` s (`00, 01, …, 59`), conformément à la
 * mission de design dédiée (rapport `2026-09-03_design-complements-
 * composition-wheel.md`, §8 « Comportement contractuel du picker »,
 * commit `ed84285`) et au registre R4 (`R4-05`). `CE-T01-07`/`CE-T01-14`
 * (`13 – Contrats d'écran.md`, « pas de `5` ») n'ont pas encore été mis à
 * jour par cette mission de design — silence de fraîcheur documenté dans
 * le rapport de mission, pas une contradiction ignorée : R4-05 est un
 * registre d'implémentation explicitement autorisé, plus récent que ce
 * contrat resté inchangé.
 *
 * Ancienne justification (pas de `5`, cycle précédent, conservée pour
 * traçabilité) : les cycles avant `PHASE02 REWORK01 ADDENDUM` avaient
 * conservé un pas de `1` seconde en le classant à tort comme une
 * contradiction non résolue entre le Registre des décisions (D-089, qui
 * borne `0–3599 s` sans jamais mentionner de pas) et `13 – Contrats
 * d'écran.md` (CE-T01-07 : « Les secondes avancent par pas de `5` »).
 * Relecture exacte à l'époque : D-089 était silencieux sur le pas, pas
 * contradictoire — l'ordre de préséance `INDEX.md` §6 ne s'applique qu'en
 * cas de contradiction réelle. Cette analyse reste correcte pour D-089 ;
 * elle est aujourd'hui supersédée par la nouvelle décision R4-05
 * elle-même, qui s'applique indépendamment de CE-T01-07.
 *
 * Bornes Durée/Pause d'Exercice (T01-S08, `08` l.925) : 0 à 5999 secondes
 * (0 min 00 s à 99 min 59 s) — `WHEEL_EXERCISE_DURATION_SECONDS_MAX`/
 * `WHEEL_PAUSE_SECONDS_MAX` ci-dessous, à passer explicitement en
 * `maxTotalSeconds`. Même pas de secondes (`WHEEL_SECONDS_STEP`), CE-T01-14
 * renvoyant explicitement au contrat CE-T01-07.
 */

export const WHEEL_MINUTES_MAX_INDEX = 59;
/** Pas des secondes — `1` (R4-05, `00…59`), voir la note ci-dessus. */
export const WHEEL_SECONDS_STEP = 1;
/** Nombre de valeurs de secondes visibles (`0, 1, …, 59` — `60 / WHEEL_SECONDS_STEP`). */
export const WHEEL_SECONDS_ITEM_COUNT = 60 / WHEEL_SECONDS_STEP;
/** Index maximal de la colonne secondes (`WHEEL_SECONDS_ITEM_COUNT - 1`, soit `11`). */
export const WHEEL_SECONDS_MAX_INDEX = WHEEL_SECONDS_ITEM_COUNT - 1;
export const WHEEL_TOTAL_SECONDS_MAX = 3599;

/** Borne haute de la Durée d'un Exercice, en secondes (T01-S08, `08` l.925) — 99 min 59 s. */
export const WHEEL_EXERCISE_DURATION_SECONDS_MAX = 5999;
/** Borne haute de la Pause après Série d'un Exercice, en secondes (T01-S08, `08` l.925) — mêmes bornes que la Durée. */
export const WHEEL_PAUSE_SECONDS_MAX = 5999;

/**
 * T02-S02 : borne haute de la Récupération ATTACHÉE, en secondes.
 * `13 – Contrats d'écran.md` (CE-T01-14) : « `Durée`, `Pause`, `Récupération`
 * et `Durée totale` héritent du même contrat minutes/secondes » — mêmes
 * bornes que la Durée et la Pause, `0 s` restant valide.
 */
export const WHEEL_RECOVERY_SECONDS_MAX = 5999;

/**
 * T02-S02 : borne haute de la Durée totale CIBLE saisissable, en secondes —
 * même contrat de roulette que ci-dessus.
 *
 * Limite disclosée : la Durée totale CALCULÉE (formule canonique
 * conditionnelle, `calculations.ts`) peut légitimement dépasser cette borne
 * (jusqu'à `99` Séries de `99 min 59 s`)
 * ; elle est alors AFFICHÉE intégralement, seule la valeur que l'utilisateur
 * peut CONFIRMER dans la roulette étant bornée par le composant canonique.
 * Aucune source ne documente une seconde variante de roulette pour ce cas.
 */
export const WHEEL_TOTAL_DURATION_SECONDS_MAX = 5999;

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
 * minutes/secondes. Les secondes sont systématiquement ramenées au
 * multiple de `WHEEL_SECONDS_STEP` le plus proche (CE-T01-07/14) — y
 * compris pour une valeur d'entrée qui ne le serait pas déjà (défense en
 * profondeur ; toute valeur produite par `toTotalSeconds` ci-dessus est
 * déjà un multiple de `WHEEL_SECONDS_STEP`). Minutes bornées par
 * `maxTotalSeconds` (mêmes valeurs par défaut que `toTotalSeconds`).
 */
export function fromTotalSeconds(
  totalSeconds: number,
  maxTotalSeconds: number = WHEEL_TOTAL_SECONDS_MAX,
): { minutes: number; seconds: number } {
  const bounded = clampTotalSeconds(totalSeconds, maxTotalSeconds);
  const rawSeconds = bounded % 60;
  const steppedSeconds = clampIndex(
    Math.round(rawSeconds / WHEEL_SECONDS_STEP),
    WHEEL_SECONDS_MAX_INDEX,
  ) * WHEEL_SECONDS_STEP;
  return { minutes: Math.floor(bounded / 60), seconds: steppedSeconds };
}

/** Valeur en secondes (`0, 1, …, 59`) affichée par l'index de la colonne secondes. */
export function secondsIndexToValue(index: number): number {
  return clampIndex(index, WHEEL_SECONDS_MAX_INDEX) * WHEEL_SECONDS_STEP;
}

/** Index de colonne secondes (`[0, WHEEL_SECONDS_MAX_INDEX]`) le plus proche d'une valeur en secondes. */
export function secondsValueToIndex(seconds: number): number {
  return clampIndex(Math.round(seconds / WHEEL_SECONDS_STEP), WHEEL_SECONDS_MAX_INDEX);
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

/**
 * PRE-4 story 3.4 (Q36, P21, H15) — bornes d'une roulette de Cible Durée, en
 * secondes (1..3535 depuis D-430). La position `00:00` reste présente dans la roue, mais n'est
 * jamais une Cible (Q15, FR-08-04) : le ✓ y est indisponible.
 */
export type WheelTargetBounds = { readonly min: number; readonly max: number };

/**
 * Story 3.4 (AC2, Q36) — secondes proposées pour une minute donnée, sous des bornes
 * de Cible : toute seconde dont le total `minutes × 60 + secondes` est dans
 * `[bounds.min, bounds.max]`, plus la position `00` à 0 minute (`00:00`, jamais
 * une Cible). Pour 1..3535 (D-430) : `00` puis 01..59 à 0 min, 00..59 de 1 à 57 min, 00..55
 * à 58 min. Les bornes sont à la seconde : cette liste suppose le pas de 1 de
 * `WHEEL_SECONDS_STEP` (R4-05, Q36), vérifié par `wheelPickerMath.test.ts`.
 */
export function boundedSecondsValues(minutes: number, bounds: WheelTargetBounds): number[] {
  const values: number[] = [];
  for (let seconds = 0; seconds <= WHEEL_SECONDS_MAX_INDEX * WHEEL_SECONDS_STEP; seconds += WHEEL_SECONDS_STEP) {
    const total = minutes * 60 + seconds;
    if ((minutes === 0 && seconds === 0) || (total >= bounds.min && total <= bounds.max)) {
      values.push(seconds);
    }
  }
  return values;
}

/**
 * PRE-4 story 3.7 (FR-14-03, H8) — minutes proposées sous des bornes : de 0 si
 * `bounds.min < 60` (position `00:00` conservée, comportement de la story 3.4
 * inchangé), sinon de `floor(min / 60)`, jusqu'à `floor(max / 60)`. Chaque minute
 * proposée a au moins une seconde dans `boundedSecondsValues` (secondes ≥ `min % 60` à
 * la première minute, ≤ `max % 60` à la dernière) : aucune liste vide. Ex. Durée totale
 * 70..6930 (d = 60 s, p = 10 s) : minutes 1..99, secondes 10..59 à 1 min.
 */
export function boundedMinutesValues(bounds: WheelTargetBounds): number[] {
  const first = bounds.min < 60 ? 0 : Math.floor(bounds.min / 60);
  const last = minutesMaxIndexFor(bounds.max);
  return Array.from({ length: Math.max(last - first + 1, 0) }, (_, index) => first + index);
}

/**
 * Story 3.4 — recalage d'une seconde absente de la liste de sa minute (changement de
 * minute, ou valeur native hors liste) : la plus proche valeur proposée, en sélection
 * numérique. À 0 minute, le recalage vise une Cible valide (00:05 pour une borne
 * de 5 s ; sous 1..3535, D-430, toute seconde de 01 à 59 est déjà proposée),
 * jamais `00:00` : cette position n'est atteinte que par la roue elle-même ou par
 * l'option échec. Une seconde présente dans la liste est gardée telle quelle.
 */
export function snapBoundedSeconds(seconds: number, minutes: number, bounds: WheelTargetBounds): number {
  const values = boundedSecondsValues(minutes, bounds);
  if (values.includes(seconds)) {
    return seconds;
  }
  const candidates = minutes === 0 ? values.filter((value) => value !== 0) : values;
  return candidates.length === 0 ? 0 : nearestWheelValue(seconds, candidates);
}

/** Valeur de `values` la plus proche de `value` (elle-même si présente ; à égalité, la plus grande). */
export function nearestWheelValue(value: number, values: readonly number[]): number {
  if (values.includes(value)) {
    return value;
  }
  return values.reduce((best, candidate) => {
    const gap = Math.abs(candidate - value);
    const bestGap = Math.abs(best - value);
    return gap < bestGap || (gap === bestGap && candidate > best) ? candidate : best;
  }, values[0] ?? 0);
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

/**
 * PRE-6 story 4.1 (CE-T03-08 §14, E12) — grille de la roulette « Durée de récupération » :
 * 0..300 s, pas de 1 s jusqu'à 5 s, de 5 s jusqu'à 120 s, de 30 s jusqu'à 300 s. Valeurs
 * totales en secondes, croissantes ; `DurationWheelPicker` les répartit en minutes et secondes
 * (`valueGrid`).
 */
export const RECOVERY_WHEEL_VALUES: readonly number[] = [
  ...Array.from({ length: 6 }, (_, index) => index),
  ...Array.from({ length: (120 - 10) / 5 + 1 }, (_, index) => 10 + index * 5),
  ...Array.from({ length: (300 - 150) / 30 + 1 }, (_, index) => 150 + index * 30),
];

/** Minutes proposées par une grille de valeurs totales (`floor(valeur / 60)`, sans doublon, croissantes). */
export function gridMinutesValues(grid: readonly number[]): number[] {
  return Array.from(new Set(grid.map((value) => Math.floor(value / 60)))).sort((a, b) => a - b);
}

/** Secondes proposées pour une minute donnée par une grille de valeurs totales (croissantes). */
export function gridSecondsValues(grid: readonly number[], minutes: number): number[] {
  return grid
    .filter((value) => Math.floor(value / 60) === minutes)
    .map((value) => value % 60)
    .sort((a, b) => a - b);
}

/** Valeur de la grille la plus proche d'une durée (à égalité, la plus grande). Grille vide : `0`. */
export function snapToGrid(totalSeconds: number, grid: readonly number[]): number {
  return grid.length === 0 ? 0 : nearestWheelValue(totalSeconds, grid);
}

/** Seconde de la grille la plus proche pour une minute donnée (changement de minute de la roue). */
export function snapGridSeconds(seconds: number, minutes: number, grid: readonly number[]): number {
  const values = gridSecondsValues(grid, minutes);
  return values.length === 0 ? 0 : nearestWheelValue(seconds, values);
}
