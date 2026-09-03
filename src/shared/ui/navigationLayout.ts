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
