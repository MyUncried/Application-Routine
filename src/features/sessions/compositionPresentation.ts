import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { formatActivityCount, formatEstimatedDuration } from "@/features/sessions/formatSessionSummary";
import { formatTwoDigits, fromTotalSeconds } from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";

/**
 * Fonctions de présentation pures de l'écran Composition (T01-S07),
 * séparées de `resources/fr.ts` pour la même raison que
 * `formatSessionSummary.ts` (T01-S06) : ce fichier reste un arbre de
 * chaînes statiques, sans logique d'assemblage ni d'arrondi.
 */

export type CompositionSummaryFacts = {
  readonly exercise: SessionDraftExercise | null;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
};

/**
 * Résumé `N activités · durée estimée` de la Composition (§9 du plan).
 *
 * État vide (`exercise === null`) : chaîne locale et complète
 * `"0 activité · 0 min"` (arbitrage V2) — n'appelle jamais
 * `formatActivityCount(0)`, qui produit délibérément `"0 activités"`
 * (pluriel) pour le Catalogue et reste inchangé.
 *
 * État non vide : réutilise `formatActivityCount`/`formatEstimatedDuration`
 * (T01-S06) sans modification, avec `Math.ceil(totalSeconds / 60)` déjà porté
 * par `formatEstimatedDuration`.
 */
export function formatCompositionSummary(facts: CompositionSummaryFacts): string {
  if (facts.exercise === null) {
    return strings.screens.composition.summary.empty;
  }

  const estimatedDurationSeconds =
    facts.initialCountdownSeconds +
    (facts.exercise.durationSeconds ?? 0) +
    facts.finalPhaseSeconds;

  return `${formatActivityCount(1)} · ${formatEstimatedDuration(estimatedDurationSeconds)}`;
}

/** Valeur affichée sur une ligne `Compte à rebours initial`/`Fin de séance` avant ouverture du sélecteur, ex. `"00 min 10 s"`. */
export function formatDurationRowValue(totalSeconds: number): string {
  const { minutes, seconds } = fromTotalSeconds(totalSeconds);
  return `${formatTwoDigits(minutes)} min ${formatTwoDigits(seconds)} s`;
}
