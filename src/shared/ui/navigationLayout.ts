import { spacing, type } from "@/shared/ui/tokens";

/**
 * Géométrie de la barre de navigation basse — source unique partagée entre
 * `app/(tabs)/_layout.tsx` (qui dimensionne réellement la barre) et tout écran
 * qui réserve l'espace qu'elle occupe (`CatalogueScreen.tsx`, `ProfileScreen
 * .tsx`, via `navigationBarTotalHeight()`).
 *
 * PRE-8, recette A/B (E01) : barre `Navigation / Bottom — 5 onglets` (Figma
 * `6513:20151`, instance `10579:21585` relevée à 402) — Catalogues, Calendrier,
 * Suivi, Communauté (visible, désactivée), Profil ; plus aucune bulle
 * Recherche. Remplace la barre à quatre destinations + Recherche (SHELL-R02 à
 * N-03, dont l'historique reste dans les rapports de mission de septembre).
 * Valeurs relevées à 402 :
 *
 * - barre `354 × 62` à `x = 24`, rayon `33`, bord bas à `16` du bord physique
 *   de l'écran (874 − 858) — la barre est une exception explicite à la marge
 *   standard de 16 (A01) : elle garde sa propre marge latérale de 24 ;
 * - cinq emplacements égaux (`354 / 5 = 70,8`), boîte d'icône `32` (icône
 *   `24` à `4`) centrée dans chacun ;
 * - cadre actif `66 × 50`, rayon `28`, centré dans l'emplacement actif et
 *   verticalement dans la barre ;
 * - icône inactive : boîte à `y = 13` du haut de la barre ; icône active
 *   relevée à `y = 9`, libellé (Inter Regular 11) centré à `y = 45`.
 *
 * N-03 (résiduel bas égal à la marge horizontale) ne tient plus : le Figma
 * actuel donne 24 à l'horizontale et 16 en bas.
 */
export const NAVIGATION_BAR_HEIGHT = 62;
export const NAVIGATION_BAR_RADIUS = 33;
export const NAVIGATION_ROW_HORIZONTAL_MARGIN = spacing[24];
export const NAVIGATION_BAR_BOTTOM_RESIDUAL = spacing[16];

/** Boîte d'icône (`32`) et icône (`24`) de chaque destination. */
export const NAVIGATION_ICON_BOX = 32;
export const NAVIGATION_ICON_SLOT = 24;
/** Haut de la boîte d'icône depuis le haut de la barre : inactive / active (relevée pour le libellé). */
export const NAVIGATION_ICON_BOX_TOP = 13;
export const NAVIGATION_ICON_BOX_TOP_ACTIVE = 9;
/** Centre vertical du libellé actif depuis le haut de la barre. */
export const NAVIGATION_LABEL_CENTER_Y = 45;

/** Cadre actif (`Navigation compacte — actif`). */
export const NAVIGATION_ACTIVE_FRAME = { width: 66, height: 50, radius: 28, color: "rgba(5, 8, 229, 0.1)" } as const;

/** Ombre de la barre (Figma `0 / 2`, flou `10`, `#1A1A26` à 8 %), sans jeton d'ombre. */
export const NAVIGATION_BAR_SHADOW = { color: "#1A1A26", opacity: 0.08, offsetY: 2, radius: 10, elevation: 3 } as const;

/** Hauteur du contenu de la destination active (boîte d'icône relevée jusqu'au bas du libellé). */
export const NAVIGATION_CONTENT_HEIGHT =
  NAVIGATION_LABEL_CENTER_Y + type.navLabel.lineHeight / 2 - NAVIGATION_ICON_BOX_TOP_ACTIVE;

/**
 * Hauteur totale réellement occupée par la barre depuis le bord bas physique
 * de l'écran (résiduel + barre) — réutilisée par tout écran consommateur pour
 * réserver exactement cet espace.
 */
export function navigationBarTotalHeight(): number {
  return NAVIGATION_BAR_BOTTOM_RESIDUAL + NAVIGATION_BAR_HEIGHT;
}
