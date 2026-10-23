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

/**
 * `0 exercice` / `1 exercice` / `N exercices`. PRE-4 (story 1.2, décision
 * Q32 de Hermann du 2026-10-16) : zéro prend le singulier, comme le résumé
 * vide de Composition — une Séance vidée par la migration affiche
 * « 0 exercice · 2 tours » sur sa carte.
 */
export function formatActivityCount(count: number): string {
  const label =
    count === 0 || count === 1
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
 * établie côté brouillon par `formatCompositionSummary` (supprimé par PRE-6 story 7.8)
 * (`compositionPresentation.ts`), désormais également appliquée à une
 * Séance persistée (`SessionSummary.isEstimatedDurationApproximate`).
 */
/**
 * PRE-3 (P3-13/tours-cycles-list) : `kind` accepte désormais le résultat
 * typé de l'autorité Domaine (`exact` sans symbole, `estimated` → « ≈ »,
 * `lowerBound` → « ≥ ») ; le booléen historique reste accepté (`true` =
 * borne minimale) pour les appelants existants.
 */
export function formatEstimatedDuration(
  seconds: number,
  kind: boolean | "exact" | "estimated" | "lowerBound" = false,
): string {
  const minutes = Math.ceil(seconds / 60);
  const formatted = `${minutes} ${strings.screens.sessions.card.durationUnit}`;
  // PRE-4 (story 2.2, AC6, NFR-08) : les symboles viennent du lexique ;
  // arrondi, unité et forme restent ceux de PRE-3 (P41).
  const { estimatedPrefix, lowerBoundPrefix } = strings.shared.durationNature;
  if (kind === "estimated") {
    return `${estimatedPrefix}${formatted}`;
  }
  return kind === true || kind === "lowerBound" ? `${lowerBoundPrefix}${formatted}` : formatted;
}

/**
 * Segment Catégories de la ligne de synthèse sous le nom de la Séance
 * (T01-S09, correction VISUAL tentative 2, point B ; séparation en segment
 * dédié introduite par la correction VISUAL point A, commentaire de revue
 * 5551083690, pour permettre son rendu dans la couleur propre de la
 * Séance — `SessionCard.tsx` colore ce seul segment, jamais le segment Zones
 * corporelles ni le séparateur). Liste jointe par `", "`, dans l'ordre déjà
 * déterminé par `SessionSummary.categoryNames` (Repository, D-107) — jamais
 * réordonné ici. `null` si aucune Catégorie n'est associée.
 */
export function formatCategoryNamesSegment(categoryNames: readonly string[]): string | null {
  return categoryNames.length > 0 ? categoryNames.join(", ") : null;
}

/**
 * Segment Zones corporelles de la ligne de synthèse — même patron que
 * `formatCategoryNamesSegment`, ordre déjà déterminé par
 * `SessionSummary.bodyZoneNames` (référentiel, jamais réordonné ici). `null`
 * si aucune Zone corporelle n'est couverte.
 */
export function formatBodyZoneNamesSegment(bodyZoneNames: readonly string[]): string | null {
  return bodyZoneNames.length > 0 ? bodyZoneNames.join(", ") : null;
}

/**
 * Ligne de synthèse Catégories + Zones corporelles affichée sous le nom de
 * la Séance sur la carte condensée (T01-S09, correction VISUAL tentative 2,
 * point B — ligne manquante du contrat d'écran CE-T01-03 : `Catégories |
 * Associations de Catégories | Si présentes ; ordre et présentation
 * conformes au composant`).
 *
 * Correction VISUAL point A (commentaire de revue 5551083690, 2e
 * contre-recette) : le séparateur entre le groupe Catégories et le groupe
 * Zones corporelles devient `" : "` (auparavant `" · "`, point médian —
 * défaut visuel signalé, le rendu attendu est par exemple
 * « Cardio : Genoux, Dos »). Un groupe vide est omis entièrement (jamais un
 * séparateur adjacent à un segment vide). `null` si aucun des deux groupes
 * n'a de valeur — état vide, l'appelant ne rend alors aucune ligne (jamais
 * une ligne visible vide).
 *
 * Assemblée à partir des mêmes segments que `SessionCard.tsx` utilise pour
 * le rendu coloré (`formatCategoryNamesSegment`/`formatBodyZoneNamesSegment`)
 * — une seule définition de la règle de séparation, jamais dupliquée entre
 * cette forme texte brut et le rendu à deux couleurs.
 */
export function formatSessionTagLine(
  categoryNames: readonly string[],
  bodyZoneNames: readonly string[],
): string | null {
  const categoriesSegment = formatCategoryNamesSegment(categoryNames);
  const zonesSegment = formatBodyZoneNamesSegment(bodyZoneNames);

  if (categoriesSegment === null) {
    return zonesSegment;
  }
  if (zonesSegment === null) {
    return categoriesSegment;
  }
  return `${categoriesSegment} : ${zonesSegment}`;
}
