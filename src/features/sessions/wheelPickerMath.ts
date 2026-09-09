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
 * Limite disclosée : la Durée totale CALCULÉE (`D = C × A + (C − 1) × B + R`)
 * peut légitimement dépasser cette borne (jusqu'à `99` Séries de `99 min 59 s`)
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
