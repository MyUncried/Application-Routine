import { dimensions, spacing, type } from "@/shared/ui/tokens";

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
 * `NAVIGATION_CONTENT_HEIGHT` reste la hauteur du seul CONTENU d'un item de
 * navigation (slot d'icône + écart + hauteur de ligne du libellé +
 * espacement vertical DS), dérivée par construction plutôt qu'estimée. La
 * hauteur RÉELLE de la barre elle-même (`NAVIGATION_BAR_HEIGHT`, plus bas)
 * est un token DSF distinct — voir sa note de tête pour l'historique de
 * cette distinction (SHELL-R02-E, puis la revue iPhone qui l'a révisée).
 */
// N-01 (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03
// CUMULATIVE CORRECTION`, 2026-09-03) : réduit légèrement et uniformément
// depuis `24` — les quatre icônes de navigation restaient jugées trop
// grandes au rendu réel. `tabItem.minHeight` (`app/(tabs)/_layout.tsx`)
// reste `minTouchTarget` (`48`), indépendant de ce slot : la cible tactile
// n'est jamais réduite par ce changement.
export const NAVIGATION_ICON_SLOT = 20;
export const NAVIGATION_LABEL_GAP = spacing[4];
export const NAVIGATION_ITEM_VERTICAL_PADDING = spacing[8];

export const NAVIGATION_CONTENT_HEIGHT =
  NAVIGATION_ICON_SLOT +
  NAVIGATION_LABEL_GAP +
  type.navLabel.lineHeight +
  NAVIGATION_ITEM_VERTICAL_PADDING * 2;

/**
 * VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 1) : la
 * hauteur RÉELLE de la barre (`tabsGroup`) redevient
 * `dimensions.mainNavigation.visualHeight` (`66`) — le token canonique
 * abandonné par SHELL-R02-E au profit de `NAVIGATION_CONTENT_HEIGHT`
 * (`56`, hauteur du seul CONTENU d'un item, jamais celle de la barre elle-
 * même). La contre-recette avait alors jugé ce token « jamais vérifié
 * contre un rendu réel » ; la revue iPhone la plus récente constate au
 * contraire une marge insuffisante entre le haut des icônes et le bord
 * supérieur du cadre — la barre doit donc rester strictement plus haute que
 * son contenu, pour ménager cette marge par construction (`alignItems:
 * "center"` centre alors le contenu dans l'espace excédentaire), plutôt que
 * d'égaler exactement sa hauteur.
 *
 * Le cadre actif (`activeIndicator`, `app/(tabs)/_layout.tsx`) reprend la
 * hauteur `dimensions.activeDestination.visualHeight` (`56`, exactement
 * `NAVIGATION_CONTENT_HEIGHT`) et reste centré verticalement dans ce cadre
 * global désormais plus haut — jamais étiré sur toute sa hauteur.
 */
export const NAVIGATION_BAR_HEIGHT = dimensions.mainNavigation.visualHeight;

/**
 * Marge horizontale de la rangée de navigation (gauche/droite) et écart
 * entre le groupe des quatre destinations et Recherche.
 *
 * N-02 (même revue que N-01) : `NAVIGATION_ROW_GAP` élargi depuis
 * `spacing[12]` — resserre légèrement la largeur du cadre des quatre
 * destinations (`tabsGroup`, `flex: 1`, dérive donc sa largeur de l'espace
 * réellement disponible moins Recherche et cet écart) sans toucher aux
 * marges extérieures ni à Recherche elle-même, et sans risque de
 * chevauchement (propriété flexbox, valable à toute largeur d'écran — voir
 * `TabsLayoutSearch.integration.test.tsx`).
 */
export const NAVIGATION_ROW_HORIZONTAL_MARGIN = spacing[16];
export const NAVIGATION_ROW_GAP = spacing[16];

/**
 * Résiduel bas — correction `N-03` (même revue). **Remplace** la formule
 * précédente (`navigationBarBottomResidual`, fonction de `insets.bottom`,
 * dérivée d'un unique point de référence canevas `402×874` et jugée trop
 * basse au rendu réel — « cadre désormais trop bas », remonter).
 *
 * Nouveau critère, mesuré sur la capture de référence de cette revue : la
 * marge entre le bord bas de la barre et le bord bas de l'écran doit être
 * visuellement égale à la marge horizontale entre son coin inférieur
 * gauche et le coin inférieur gauche de l'écran — donc **exactement**
 * `NAVIGATION_ROW_HORIZONTAL_MARGIN`, par construction (même constante),
 * plutôt qu'une fonction de `insets.bottom` (explicitement écartée par
 * cette revue : « ne pas l'obtenir par une constante arbitraire liée à un
 * seul appareil »). Non confirmé indépendamment contre un second appareil
 * (`NON_VERIFIABLE_DEVICE`, voir le rapport de mission) — mais désormais
 * une relation mesurée plutôt qu'un point de référence unique isolé.
 */
export const NAVIGATION_BAR_BOTTOM_RESIDUAL = NAVIGATION_ROW_HORIZONTAL_MARGIN;

/**
 * Hauteur totale réellement occupée par la barre depuis le bord bas
 * physique de l'écran (résiduel + contenu) — source unique de vérité
 * réutilisée par tout écran consommateur pour réserver exactement cet
 * espace (`CatalogueScreen.tsx`, CAT-R04).
 */
export function navigationBarTotalHeight(): number {
  return NAVIGATION_BAR_BOTTOM_RESIDUAL + NAVIGATION_BAR_HEIGHT;
}
