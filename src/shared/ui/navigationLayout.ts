import { spacing, type } from "@/shared/ui/tokens";

/**
 * Géométrie réelle de la barre de navigation basse (SHELL-R02, contre-recette
 * iPhone, `[ChatGPT] DEVICE_REVIEW_FAIL — REWORK 02`, 2026-09-03).
 *
 * Source unique de vérité partagée entre `app/(tabs)/_layout.tsx` (qui
 * dimensionne réellement la barre à partir de ces constantes) et tout écran
 * qui doit réserver l'espace qu'elle occupe pour son propre calcul de
 * centrage (`CatalogueScreen.tsx`, CAT-R04) — jamais deux estimations
 * indépendantes de la même hauteur.
 *
 * `NAVIGATION_CONTENT_HEIGHT` remplace l'usage de
 * `dimensions.mainNavigation.visualHeight` (`66`) pour la hauteur réelle :
 * ce token n'a jamais été vérifié contre un rendu réel et s'est révélé trop
 * grand à la contre-recette iPhone (SHELL-R02-E). La valeur ici est dérivée
 * du contenu réel d'un item de navigation (slot d'icône + écart + hauteur
 * de ligne du libellé + espacement vertical DS), donc exacte par
 * construction plutôt qu'une estimation séparée.
 */
export const NAVIGATION_ICON_SLOT = 24;
export const NAVIGATION_LABEL_GAP = spacing[4];
export const NAVIGATION_ITEM_VERTICAL_PADDING = spacing[8];

export const NAVIGATION_CONTENT_HEIGHT =
  NAVIGATION_ICON_SLOT +
  NAVIGATION_LABEL_GAP +
  type.navLabel.lineHeight +
  NAVIGATION_ITEM_VERTICAL_PADDING * 2;

/**
 * Position verticale basse — correction `D` (contre-recette iPhone,
 * correction consolidée, `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02
 * CONSOLIDATED REWORK02`, 2026-09-03, addendum `FOUNDATION BOTTOM
 * NAVIGATION VERTICAL POSITION`).
 *
 * Défaut précédent : la barre était translatée de la totalité de
 * `insets.bottom` (`navigationRow: { bottom: insets.bottom }`) — la Safe
 * Area était donc appliquée comme une marge flottante en plus de la barre
 * elle-même, au lieu d'être partiellement absorbée à l'intérieur de la
 * zone basse. Sur la géométrie de référence transmise par cette revue
 * (canevas `402×874`) : zone de navigation `y=797–874` (`77pt`), pilule
 * `h=66` `y=797–863`, résiduel bas `11pt` — c'est-à-dire que le bord bas de
 * la pilule se situe `23pt` **à l'intérieur** de la limite de Safe Area
 * (pour un appareil de référence à `insets.bottom=34`, limite à
 * `874-34=840` ; pilule à `863` ; écart `23`), et non collée à cette
 * limite.
 *
 * `NAVIGATION_BAR_SAFE_AREA_OVERLAP` (`23`) est donc dérivé de cet unique
 * point de référence (`insets.bottom=34`) — non confirmé indépendamment
 * contre un second appareil/inset à ce stade (`NON_VERIFIABLE_DEVICE`,
 * voir le rapport de mission). `NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL` (`11`)
 * sert de plancher explicite pour tout appareil dont `insets.bottom` est
 * inférieur à `23` (aucun indicateur d'accueil, ou Safe Area nulle) — la
 * barre garde alors un espace minimal avec le bord physique de l'écran
 * plutôt qu'un résiduel négatif.
 */
export const NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL = 11;
export const NAVIGATION_BAR_SAFE_AREA_OVERLAP = 23;

/** Résiduel entre le bord bas de la barre et le bord physique de l'écran, pour un `insets.bottom` donné. */
export function navigationBarBottomResidual(insetsBottom: number): number {
  return Math.max(insetsBottom - NAVIGATION_BAR_SAFE_AREA_OVERLAP, NAVIGATION_BAR_MIN_BOTTOM_RESIDUAL);
}

/**
 * Hauteur totale réellement occupée par la barre depuis le bord bas
 * physique de l'écran (résiduel + contenu) — source unique de vérité
 * réutilisée par tout écran consommateur pour réserver exactement cet
 * espace (`CatalogueScreen.tsx`, CAT-R04), sans appliquer une seconde fois
 * `insets.bottom` en plus (défaut précédent).
 */
export function navigationBarTotalHeight(insetsBottom: number): number {
  return navigationBarBottomResidual(insetsBottom) + NAVIGATION_CONTENT_HEIGHT;
}
