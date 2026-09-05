import { strings } from "@/shared/i18n";

/**
 * Fonctions de présentation pures pour `SessionCard` (T01-S06).
 *
 * Volontairement séparées de `resources/fr.ts` : le système d'i18n du
 * projet n'expose aujourd'hui que des chaînes statiques (aucune fonction),
 * et cette tranche ne modifie pas ce contrat transverse pour les seuls
 * besoins de deux pluriels et d'un arrondi de durée — voir
 * `src/features/sessions/README.md`. Ces fonctions lisent les fragments
 * lexicaux nécessaires (singulier/pluriel, unité) dans `strings`, sans
 * jamais les dupliquer en dur, et portent elles-mêmes la logique
 * d'assemblage et d'arrondi.
 */

/** `1 activité` / `N activités`. */
export function formatActivityCount(count: number): string {
  const label =
    count === 1
      ? strings.screens.sessions.card.activitySingular
      : strings.screens.sessions.card.activityPlural;
  return `${count} ${label}`;
}

/** `1 tour` / `N tours`. */
export function formatTourCount(count: number): string {
  const label =
    count === 1
      ? strings.screens.sessions.card.tourSingular
      : strings.screens.sessions.card.tourPlural;
  return `${count} ${label}`;
}

/**
 * `N min`. La durée affichée est une estimation qui ne doit jamais
 * sous-estimer la durée réelle : les secondes entamées comptent pour une
 * minute entière (`Math.ceil`), plutôt qu'un arrondi au plus proche ou une
 * troncature qui minorerait l'attente réelle de l'utilisateur — aucune
 * règle d'arrondi n'étant fixée par les spécifications fonctionnelles pour
 * ce cas (arbitrage documenté dans le plan d'implémentation de T01-S06).
 *
 * `isApproximate` (T01-S09, RM-072) : préfixe `≥` dès qu'au moins une
 * Activité de la Composition est en mode Répétitions — même convention déjà
 * établie côté brouillon par `formatCompositionSummary`
 * (`compositionPresentation.ts`), désormais également appliquée à une
 * Séance persistée (`SessionSummary.isEstimatedDurationApproximate`).
 */
export function formatEstimatedDuration(seconds: number, isApproximate = false): string {
  const minutes = Math.ceil(seconds / 60);
  const formatted = `${minutes} ${strings.screens.sessions.card.durationUnit}`;
  return isApproximate ? `≥ ${formatted}` : formatted;
}

/**
 * Ligne de synthèse Catégories + Zones corporelles affichée sous le nom de
 * la Séance sur la carte condensée (T01-S09, correction VISUAL tentative 2,
 * point B — ligne manquante du contrat d'écran CE-T01-03 : `Catégories |
 * Associations de Catégories | Si présentes ; ordre et présentation
 * conformes au composant`).
 *
 * Réutilise le séparateur `" · "` déjà établi par `summaryLine`
 * (`SessionCard.tsx`) pour composer des segments hétérogènes sur une même
 * ligne, plutôt qu'un nouveau séparateur local. Chaque groupe (Catégories,
 * puis Zones corporelles) est lui-même une liste jointe par `", "`, dans
 * l'ordre déjà déterminé par `SessionSummary.categoryNames`/`bodyZoneNames`
 * (Repository, D-107) — jamais réordonné ici.
 *
 * Un groupe vide est omis entièrement (jamais un segment vide entre deux
 * `" · "`). `null` si aucun des deux groupes n'a de valeur — état vide,
 * l'appelant ne rend alors aucune ligne (jamais une ligne visible vide).
 */
export function formatSessionTagLine(
  categoryNames: readonly string[],
  bodyZoneNames: readonly string[],
): string | null {
  const segments = [categoryNames, bodyZoneNames]
    .filter((group) => group.length > 0)
    .map((group) => group.join(", "));
  return segments.length > 0 ? segments.join(" · ") : null;
}
