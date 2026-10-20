import { loadTextWidth } from "@/features/activities/loadOptionWidth";
import { INLINE_OPTION_WIDTHS } from "@/shared/ui/SegmentedControl";

/**
 * Recette du 20/10 (RC-15) — largeurs du segmenté de la ligne « Séries » (RC-17 ; ex-« Type de
 * série ») qui porte le nombre de séries dans son option sélectionnée. Relevés Figma (lecture
 * seule, 20/10) : `9439:18349` (« 3 séries identiques », 127 × 26, marge 8), `9445:18450`
 * (« 3 séries variables » + chevron 10, écart 6, 134 × 26), `9436:18506` (stepper ouvert
 * 138 × 28 : cercles 28, écart 8, valeur Semi Bold 13 de
 * 66 avec marge 8). Mesures : avances d'Inter de l'application (`loadTextWidth`, Semi Bold 12 ;
 * Semi Bold 13 au prorata de la taille). Constantes locales, aucun jeton modifié (NFR-3).
 */
export const SERIES_LABEL_INSET = 8;
export const SERIES_CHEVRON_GAP = 6;
const SERIES_CHEVRON_FRAME = 10;
export const SERIES_STEPPER_CIRCLE = 28;
export const SERIES_STEPPER_GAP = 8;
export const SERIES_STEPPER_VALUE_INSET = 8;
/** Largeur minimale de la valeur d'`InlineStepper` (`STEPPER_VALUE_WIDTH`, inchangée). */
const STEPPER_VALUE_MIN_WIDTH = 50;
const STEPPER_VALUE_FONT_SIZE = 13;
const MEASURE_FONT_SIZE = 12;

/** Segmenté `inline` : marges 3, écart 2 entre options (relevé UX-DR1, inchangé). */
const CONTROL_PADDING = 3;
const CONTROL_GAP = 2;
/** Libellés non sélectionnés (Inter Regular 12) : « Variables » 52,76, « Identiques » 59,26 ; marge minimale 3 (Figma, px 3). */
const UNSELECTED_TEXT_WIDTH = { VARIABLE: 52.76, UNIFORM: 59.26 } as const;
const UNSELECTED_MIN_INSET = 3;
/**
 * Place minimale du libellé de la ligne. Recette du 20/10 (RC-17) : « Séries » (Inter Regular 12,
 * 35,45, un seul mot, sur une ligne) → 36 ; remplace « Type de série » (77,7 ; 47 sur deux lignes).
 */
export const SERIES_TYPE_LABEL_MIN_WIDTH = 36;

/**
 * Largeur de l'option sélectionnée : fermée, le libellé (« 3 séries identiques ») avec sa marge de
 * 8 de chaque côté ; ouverte, le stepper (− | « 3 séries » | +). Le chevron du tableau (Variables)
 * ajoute l'écart 6 et son cadre de 10.
 */
export function seriesSelectedOptionWidth({
  label,
  stepperValue,
  open,
  chevron,
}: {
  readonly label: string;
  readonly stepperValue: string;
  readonly open: boolean;
  readonly chevron: boolean;
}): number {
  const content = open
    ? SERIES_STEPPER_CIRCLE * 2 +
      SERIES_STEPPER_GAP * 2 +
      Math.max(
        STEPPER_VALUE_MIN_WIDTH,
        Math.ceil((loadTextWidth(stepperValue) * STEPPER_VALUE_FONT_SIZE) / MEASURE_FONT_SIZE + SERIES_STEPPER_VALUE_INSET * 2),
      )
    : Math.ceil(loadTextWidth(label)) + SERIES_LABEL_INSET * 2;
  return content + (chevron ? SERIES_CHEVRON_GAP + SERIES_CHEVRON_FRAME : 0);
}

/**
 * Largeur de l'option non sélectionnée : 106 (`wide`, Figma) tant que le libellé de la ligne garde
 * sa place minimale ; sinon réduite au strict nécessaire pour ne pas déborder (son texte avec une
 * marge de 3 de chaque côté au moins). `rowWidth` : place du libellé et du contrôle dans la ligne.
 */
export function seriesUnselectedOptionWidth(
  type: keyof typeof UNSELECTED_TEXT_WIDTH,
  selectedWidth: number,
  rowWidth: number,
): number {
  const minimum = Math.ceil(UNSELECTED_TEXT_WIDTH[type] + UNSELECTED_MIN_INSET * 2);
  const room = Math.floor(rowWidth - SERIES_TYPE_LABEL_MIN_WIDTH - CONTROL_PADDING * 2 - CONTROL_GAP - selectedWidth);
  return Math.max(minimum, Math.min(INLINE_OPTION_WIDTHS.wide, room));
}
