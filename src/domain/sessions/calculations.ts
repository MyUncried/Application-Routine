/**
 * Calculs métier déterministes (§10, §12.5) : Nombre d'Activités et Durée
 * estimée.
 *
 * Ces fonctions n'acceptent qu'une entrée métier minimale (« Facts »),
 * jamais une ligne SQL ni un type d'infrastructure. Deux chemins équivalents
 * peuvent alimenter ces Facts, sans requête supplémentaire :
 * - une projection depuis l'agrégat `Session` (`toEstimatedDurationFacts`,
 *   `toActivityCountFacts`) ;
 * - une conversion directe des valeurs déjà extraites par une projection
 *   SQL de résumé (ex. `listActive`), effectuée par l'appelant.
 *
 * **T02-S01 — structure réelle des trois zones** (CE-T02-01 « Calculs »,
 * AC-10, et clarifications autoritatives du verdict `PLAN_REVIEW_APPROVED`
 * de la tranche) :
 *
 * 1. le NOMBRE d'Activités est celui des Activités RÉELLEMENT COMPOSÉES —
 *    chaque Activité compte UNE SEULE FOIS, quelle que soit sa zone et quel
 *    que soit `tourRepeatCount` ; ce compteur ne représente jamais des
 *    occurrences d'Exécution (celles-ci restent
 *    `computeTotalActivitiesToExecute`, RM-075, hors périmètre du moteur) ;
 * 2. la DURÉE estimée compte une fois les Activités `BEFORE_TOUR`, multiplie
 *    les Activités `IN_TOUR` par `tourRepeatCount`, puis compte une fois les
 *    Activités `AFTER_TOUR` ;
 * 3. le Compte à rebours initial et la Fin de séance sont EXCLUS de cette
 *    durée affichée — ils ne figurent donc plus dans les Facts. (Le
 *    paragraphe « Calculs » de CE-T02-01 les décrivait comme contribuant à
 *    « la durée globale » ; le verdict de revue de la tranche, qui prime
 *    explicitement « sur toute formulation contradictoire », les exclut. La
 *    contradiction documentaire est consignée dans le rapport de mission.)
 *
 * **T02-S02 — formule canonique unique** (RM-129, DM-015, `04 – Modèle
 * fonctionnel.md`, `08` §« Durée totale calculée », CE-T01-13) :
 *
 * ```text
 * D = C × A + (C − 1) × B + R
 * ```
 *
 * avec `A` la durée d'une Série, `B` la Pause, `C` le nombre de Séries et `R`
 * la Récupération ATTACHÉE. Deux corrections par rapport à T02-S01 :
 *
 * 1. la Pause est développée `max(C − 1, 0)` fois — **jamais `C`** : « Une
 *    Pause ne s'exécute qu'entre deux Séries, jamais après la dernière »
 *    (RM-129/CE-T02-01). L'ancienne formule (`C × B`) comptait une Pause
 *    finale inexistante ;
 * 2. la Récupération attachée `R` est ajoutée **une seule fois**, après
 *    toutes les Séries, et ne compte jamais comme une Activité
 *    supplémentaire (`computeActivityCount` inchangé).
 *
 * En modes Répétitions et « À l'échec », aucune durée conventionnelle n'est
 * attribuée à l'Exercice lui-même (`A` est inconnu) : seules les parts
 * DÉTERMINABLES — les Pauses entre Séries et la Récupération — sont comptées,
 * et le total est une BORNE MINIMALE `≥` (RM-072/RM-132/D-112), jamais une
 * valeur exacte.
 */

import type { Activity, ActivityType, ExerciseExecutionMode, Session } from "./Session";

/**
 * Modes sans durée conventionnelle (RM-072/D-112) : la durée estimée qui les
 * contient est une BORNE MINIMALE, jamais une valeur exacte.
 */
export function isLowerBoundExecutionMode(mode: ExerciseExecutionMode | null): boolean {
  return mode === "REPETITIONS" || mode === "TO_FAILURE";
}

/**
 * Entrée minimale du calcul de durée d'UNE Activité — satisfaite aussi bien
 * par une `Activity` persistée que par un `SessionDraftExercise` (structural
 * typing), pour que le brouillon et l'agrégat ne portent jamais deux formules
 * distinctes.
 */
export type ActivityDurationFacts = {
  readonly type: ActivityType;
  readonly executionMode: ExerciseExecutionMode | null;
  readonly durationSeconds: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  /** T02-S02 : Récupération ATTACHÉE, exécutée une seule fois après toutes les Séries (`0` = aucune). */
  readonly recoverySeconds: number;
};

/**
 * Nombre de Pauses réellement exécutées pour `seriesCount` Séries :
 * `max(C − 1, 0)`.
 *
 * Une Pause s'exécute UNIQUEMENT ENTRE deux Séries — une Série unique n'en
 * produit donc aucune, et la dernière Série n'est jamais suivie d'une Pause
 * (RM-129, CE-T02-01 « La Pause est développée `C − 1` fois »). Extraite en
 * fonction nommée pour que cette règle soit prouvable en un point unique
 * plutôt que réécrite à chaque appelant.
 */
export function computePauseOccurrences(seriesCount: number | null): number {
  return Math.max((seriesCount ?? 0) - 1, 0);
}

/**
 * Durée estimée d'UNE Activité, hors répétitions du Tour — la formule
 * canonique `D = C × A + (C − 1) × B + R` (voir la note de tête).
 *
 * En modes Répétitions et « À l'échec », le terme `C × A` est omis (aucune
 * durée conventionnelle n'est inventée) ; les Pauses et la Récupération
 * restent comptées et le résultat est une borne MINIMALE.
 */
export function computeActivityDurationSeconds(activity: ActivityDurationFacts): number {
  // Chemin défensif : ancienne Activité `RECOVERY` autonome (D-041), que
  // `migration004` a convertie et supprimée — plus jamais produite par le
  // Domaine, conservée ici pour ne pas mal calculer une donnée inattendue.
  if (activity.type === "RECOVERY") {
    return activity.durationSeconds ?? 0;
  }
  const seriesCount = activity.seriesCount ?? 0;
  const targetSeconds = isLowerBoundExecutionMode(activity.executionMode)
    ? 0
    : seriesCount * (activity.durationSeconds ?? 0);
  return (
    targetSeconds +
    computePauseOccurrences(seriesCount) * activity.pauseSeconds +
    activity.recoverySeconds
  );
}

/**
 * Entrée de la dépendance bidirectionnelle `Séries ↔ Durée totale`
 * (`06` §« Dépendance Séries / Durée totale », RM-130, API-ACT-02) — mode
 * Durée UNIQUEMENT : `A` (durée d'une Série), `B` (Pause), `R`
 * (Récupération attachée).
 */
export type TotalDurationFacts = {
  /** `A` — durée d'une Série, en secondes. */
  readonly durationSeconds: number;
  /** `B` — Pause entre Séries, en secondes. */
  readonly pauseSeconds: number;
  /** `R` — Récupération attachée, en secondes. */
  readonly recoverySeconds: number;
};

/** Bornes canoniques du nombre de Séries (D-092) — partagées par le calcul inverse. */
export const SERIES_COUNT_MIN = 1;
export const SERIES_COUNT_MAX = 99;

/**
 * `D = C × A + (C − 1) × B + R` — Durée totale d'une occurrence d'Activité en
 * mode Durée (RM-129). Sens DIRECT : `Séries` pilote, `Durée totale` est
 * dérivée.
 */
export function computeTotalDurationSeconds(
  seriesCount: number,
  facts: TotalDurationFacts,
): number {
  return (
    seriesCount * facts.durationSeconds +
    computePauseOccurrences(seriesCount) * facts.pauseSeconds +
    facts.recoverySeconds
  );
}

/**
 * `Cth = (D − R + B) / (A + B)` — calcul INVERSE (RM-130, API-ACT-02) :
 * `Durée totale` pilote, `Séries` est dérivé.
 *
 * Arrondi à l'entier le PLUS PROCHE, `.5` VERS LE HAUT, puis borné à
 * `[1, 99]` (D-092). `Math.floor(x + 0.5)` — jamais `Math.round`, dont le
 * comportement sur les valeurs négatives arrondit `.5` vers zéro (donc vers
 * le bas) ; la borne basse rend ce cas inatteignable ici, mais la règle
 * documentaire est « `.5` vers le haut » sans condition de signe et doit être
 * exprimée telle quelle.
 *
 * `A + B === 0` est impossible depuis l'interface (la durée d'une Série est
 * bornée `1..5999`, `validation.ts`) ; le garde retourne néanmoins le minimum
 * plutôt que `NaN`/`Infinity`.
 */
export function computeSeriesCountForTotalDuration(
  targetTotalSeconds: number,
  facts: TotalDurationFacts,
): number {
  const denominator = facts.durationSeconds + facts.pauseSeconds;
  if (denominator <= 0) {
    return SERIES_COUNT_MIN;
  }
  const theoretical =
    (targetTotalSeconds - facts.recoverySeconds + facts.pauseSeconds) / denominator;
  const rounded = Math.floor(theoretical + 0.5);
  if (rounded < SERIES_COUNT_MIN) {
    return SERIES_COUNT_MIN;
  }
  if (rounded > SERIES_COUNT_MAX) {
    return SERIES_COUNT_MAX;
  }
  return rounded;
}

/**
 * Résultat complet d'une confirmation de `Durée totale` cible : le nombre de
 * Séries canonique retenu, la durée RÉELLEMENT ATTEIGNABLE recalculée depuis
 * ce nombre entier, et le fait que la cible ait dû être ajustée.
 *
 * `wasAdjusted` pilote le message temporaire `Durée ajustée à {D} pour
 * respecter un nombre entier de Séries.` (`06`, CE-T01-13) — il n'est jamais
 * déduit d'une comparaison de chaînes formatées côté présentation.
 */
export type AdjustedTotalDuration = {
  readonly seriesCount: number;
  readonly totalDurationSeconds: number;
  readonly wasAdjusted: boolean;
};

/**
 * Applique une `Durée totale` cible confirmée (RM-130) : calcul inverse,
 * bornage, puis RECALCUL de la durée atteignable. Seul `seriesCount` est
 * persistable — `totalDurationSeconds` reste dérivé (DM-015/DM-016).
 */
export function applyTargetTotalDuration(
  targetTotalSeconds: number,
  facts: TotalDurationFacts,
): AdjustedTotalDuration {
  const seriesCount = computeSeriesCountForTotalDuration(targetTotalSeconds, facts);
  const totalDurationSeconds = computeTotalDurationSeconds(seriesCount, facts);
  return {
    seriesCount,
    totalDurationSeconds,
    wasAdjusted: totalDurationSeconds !== targetTotalSeconds,
  };
}

/**
 * Durées par zone structurelle (T02-S01) — trois colonnes distinctes, jamais
 * un total déjà agrégé : seule la zone `IN_TOUR` est multipliée par
 * `tourRepeatCount`. La projection SQL `listActive` produit exactement ces
 * trois colonnes, par zone (clarification n° 5 du verdict de revue).
 */
export type EstimatedDurationFacts = {
  readonly beforeTourDurationSeconds: number;
  readonly inTourDurationSeconds: number;
  readonly afterTourDurationSeconds: number;
  /** Répétition du Tour, entier `1..99` (D-058). */
  readonly tourRepeatCount: number;
  /** `true` dès qu'au moins un Exercice contribuant à ces durées est en mode Répétitions ou « À l'échec » (RM-072/D-112). */
  readonly isLowerBoundEstimate: boolean;
};

/**
 * Nombres d'Activités par zone structurelle (T02-S01). Deux lectures
 * distinctes en découlent, jamais confondues : le nombre d'Activités
 * COMPOSÉES (`computeActivityCount`) et le nombre total d'Activités À
 * EXÉCUTER (`computeTotalActivitiesToExecute`, RM-075).
 */
export type ActivityCountFacts = {
  readonly beforeTourActivityCount: number;
  readonly inTourActivityCount: number;
  readonly afterTourActivityCount: number;
  readonly tourRepeatCount: number;
};

/** Durée estimée = zone avant Tour + (zone du Tour × répétitions du Tour) + zone après Tour. */
export function computeEstimatedDurationSeconds(facts: EstimatedDurationFacts): number {
  return (
    facts.beforeTourDurationSeconds +
    facts.inTourDurationSeconds * facts.tourRepeatCount +
    facts.afterTourDurationSeconds
  );
}

/**
 * Nombre d'Activités RÉELLEMENT COMPOSÉES : chaque Activité des trois zones
 * compte une seule fois, sans multiplication par les répétitions du Tour.
 */
export function computeActivityCount(facts: ActivityCountFacts): number {
  return (
    facts.beforeTourActivityCount + facts.inTourActivityCount + facts.afterTourActivityCount
  );
}

/**
 * Nombre total d'Activités à exécuter (RM-075), après développement des
 * répétitions du Tour : les zones hors Tour comptent une fois, la zone du
 * Tour `tourRepeatCount` fois. Métrique du Plan d'Exécution — distincte du
 * nombre d'Activités composées ci-dessus, jamais affichée par le Catalogue
 * ni par la synthèse de Composition en T02.
 */
export function computeTotalActivitiesToExecute(facts: ActivityCountFacts): number {
  return (
    facts.beforeTourActivityCount +
    facts.inTourActivityCount * facts.tourRepeatCount +
    facts.afterTourActivityCount
  );
}

/** Durée cumulée d'une COLLECTION d'Activités, et caractère « borne minimale » du total. */
export type ZoneDurationFacts = {
  readonly seconds: number;
  readonly isLowerBoundEstimate: boolean;
};

/**
 * Somme des durées d'Activité d'une zone (ou de toute autre collection), et
 * indicateur de borne minimale.
 *
 * **T02-S02** : exportée et généralisée à `ActivityDurationFacts` (au lieu de
 * `Activity` seul) pour que la présentation — notamment la durée d'UNE
 * occurrence du Tour, calculée depuis le BROUILLON
 * (`SessionDraftExercise`) — partage exactement cette implémentation plutôt
 * que d'en réécrire une boucle équivalente
 * (`compositionPresentation.ts`, parité domaine/présentation testée).
 */
export function computeZoneDurationFacts(
  activities: readonly ActivityDurationFacts[],
): ZoneDurationFacts {
  let seconds = 0;
  let isLowerBoundEstimate = false;
  for (const activity of activities) {
    if (activity.type === "EXERCISE" && isLowerBoundExecutionMode(activity.executionMode)) {
      isLowerBoundEstimate = true;
    }
    seconds += computeActivityDurationSeconds(activity);
  }
  return { seconds, isLowerBoundEstimate };
}

function zoneDurationSeconds(activities: readonly Activity[]): ZoneDurationFacts {
  return computeZoneDurationFacts(activities);
}

export function toEstimatedDurationFacts(session: Session): EstimatedDurationFacts {
  const beforeTour = zoneDurationSeconds(session.cycle.beforeTour ?? []);
  const inTour = zoneDurationSeconds(session.cycle.tour.exercises);
  const afterTour = zoneDurationSeconds(session.cycle.afterTour ?? []);

  return {
    beforeTourDurationSeconds: beforeTour.seconds,
    inTourDurationSeconds: inTour.seconds,
    afterTourDurationSeconds: afterTour.seconds,
    tourRepeatCount: session.cycle.tour.repeatCount,
    isLowerBoundEstimate:
      beforeTour.isLowerBoundEstimate ||
      inTour.isLowerBoundEstimate ||
      afterTour.isLowerBoundEstimate,
  };
}

export function toActivityCountFacts(session: Session): ActivityCountFacts {
  return {
    beforeTourActivityCount: (session.cycle.beforeTour ?? []).length,
    inTourActivityCount: session.cycle.tour.exercises.length,
    afterTourActivityCount: (session.cycle.afterTour ?? []).length,
    tourRepeatCount: session.cycle.tour.repeatCount,
  };
}
