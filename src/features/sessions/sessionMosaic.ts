export { cropFrame, type CropFrame } from "@/features/activities/mediaCrop";

/**
 * Mosaïque de la carte de séance du catalogue (D-600, Hermann, 24/11/2026 ; DSF Carte de séance § 1 ; Figma
 * `DSF / Cards / Séance — mosaïque` `13169:28171`). Fonctions pures : disposition fixée par le nombre d'images, jamais par
 * la forme des photos, et recadrage de la vue retenue dans une case.
 */

/** Côté de la mosaïque (carré de 64, coins 8). */
export const MOSAIC_SIZE = 64;
/** Écart entre les cases. */
export const MOSAIC_GAP = 2;
const HALF = (MOSAIC_SIZE - MOSAIC_GAP) / 2;
const FAR = HALF + MOSAIC_GAP;

export type MosaicCell = { readonly left: number; readonly top: number; readonly width: number; readonly height: number };

export type MosaicLayout = {
  /** Cases des images, dans l'ordre des images. */
  readonly cells: readonly MosaicCell[];
  /** Case « +N » (5 images et plus) : N = nombre d'images − 3. */
  readonly counter: { readonly cell: MosaicCell; readonly hidden: number } | null;
};

const cell = (left: number, top: number, width: number, height: number): MosaicCell => ({ left, top, width, height });

/**
 * Disposition selon le nombre d'images : 1 pleine ; 2 deux colonnes ; 3 une colonne à gauche et deux carrés à droite ;
 * 4 en 2 × 2 ; 5 et plus : trois images et une quatrième case « +N ». Aucune image : aucune case (repli de l'appelant).
 */
export function mosaicLayout(imageCount: number): MosaicLayout {
  const count = Math.max(0, Math.floor(imageCount));
  switch (count) {
    case 0:
      return { cells: [], counter: null };
    case 1:
      return { cells: [cell(0, 0, MOSAIC_SIZE, MOSAIC_SIZE)], counter: null };
    case 2:
      return { cells: [cell(0, 0, HALF, MOSAIC_SIZE), cell(FAR, 0, HALF, MOSAIC_SIZE)], counter: null };
    case 3:
      return { cells: [cell(0, 0, HALF, MOSAIC_SIZE), cell(FAR, 0, HALF, HALF), cell(FAR, FAR, HALF, HALF)], counter: null };
    case 4:
      return { cells: [cell(0, 0, HALF, HALF), cell(FAR, 0, HALF, HALF), cell(0, FAR, HALF, HALF), cell(FAR, FAR, HALF, HALF)], counter: null };
    default:
      return {
        cells: [cell(0, 0, HALF, HALF), cell(FAR, 0, HALF, HALF), cell(0, FAR, HALF, HALF)],
        counter: { cell: cell(FAR, FAR, HALF, HALF), hidden: count - 3 },
      };
  }
}
