import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { SHEET_ROW_SHIFT_MS, SheetMotionView, useSheetMotionReduced } from "@/features/activities/SheetMotion";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-5 story 2.6 (AD-27, FR-4, FR-29, UX-DR3) — briques partagées des tableaux de la
 * Feuille « Paramètres d'exécution » : tableau des séries variables (2.6) et tableau des
 * phases (`WorkPhasesTable`, 2.8), sans copie. Extraites de `ExecutionParametersSheet`
 * sans changement de comportement : glisser PRE-3 et actions accessibles (`DraggableRow`),
 * repère d'insertion (`InsertionGuide`), croix de retrait (`RemoveRowButton`), message
 * d'ajustement ou de retrait avec « Annuler » (`UndoMessage`). Libellés et identifiants de
 * test viennent de l'appelant : le module ne connaît ni les Séries ni les phases.
 *
 * Géométrie (relevé Figma `9290:17953`, tableau `9290:18003`, lecture seule, 19/10) en
 * constantes locales nommées, `tokens.ts` inchangé (NFR-3) :
 * - bloc à fond blanc, rayon 8, sans contour, à 8 des côtés du cadre et 12 en haut et
 *   en bas ; aucun espace sous la dernière ligne (recette du 19/10, RC-9, remplace la
 *   hauteur de ligne de PR-02) ;
 * - en-têtes de 32, Inter Medium 12 `#595E66`, centrés sur leur cellule ;
 * - lignes de 36 (`TABLE_ROW_HEIGHT`), séparateur de 1 en tête de chaque ligne, retrait 4 ;
 * - dans la ligne : poignée 12 × 18 à x 0, numéro Inter Medium 14 aligné à droite sur
 *   x 14-38, cellules 71 × 24 rayon 8 à x 58 puis 136 (Charge à 214, story 2.7), valeur
 *   Semi Bold 13 primaire, zone de la croix 36 × 36 au bord droit ;
 * - cellule active `#EAEAFF`.
 * En-têtes et lignes partagent la même suite de colonnes (amorce 38 + 20, cellules de 71
 * séparées de 7, espace souple, croix 36) : une colonne de plus (Charge, 2.7) n'ajoute
 * qu'une cellule. Cibles tactiles de 36 dans le tableau (AD-28), à vérifier sur iPhone
 * (R-2.6-01) avant toute autre géométrie.
 */

/** AD-28 : hauteur d'une ligne de tableau (44 ailleurs dans la Feuille). */
export const TABLE_ROW_HEIGHT = 36;
/** Bloc blanc : écart aux côtés du cadre, écart en haut et en bas, rayon. */
export const TABLE_BLOCK_SIDE_INSET = 8;
export const TABLE_BLOCK_VERTICAL_INSET = 12;
const TABLE_BLOCK_RADIUS = 8;
/** Hauteur de la ligne des en-têtes. */
const TABLE_HEADER_HEIGHT = 32;
/** Retrait des lignes (et de leur séparateur) dans le bloc blanc. */
export const TABLE_ROW_INSET = 4;
/** Amorce de ligne : poignée 12 × 18 à x 0, numéro aligné à droite sur x 14-38, puis 20 avant la 1re cellule. */
export const TABLE_LEAD_WIDTH = 38;
export const TABLE_LEAD_GAP = 20;
/**
 * PRE-5 story 2.7 (tenue à 375, `deferred-work.md`) : l'écart de 20 après l'amorce absorbe
 * presque tout le manque (pondération flexShrink × largeur, face au facteur 1 des cellules) ;
 * les cellules ne rétrécissent que de façon négligeable tant que l'écart n'est pas épuisé.
 * Même écart dans l'en-tête et les lignes, qui restent alignés.
 */
export const TABLE_LEAD_GAP_SHRINK = 1000;
const HANDLE_WIDTH = 12;
const HANDLE_HEIGHT = 18;
const NUMBER_LEFT = 14;
/** Cellule à valeur seule : 71 × 24, rayon 8, cellules séparées de 7. */
export const TABLE_CELL_WIDTH = 71;
export const TABLE_CELL_HEIGHT = 24;
const TABLE_CELL_RADIUS = 8;
export const TABLE_CELL_GAP = 7;
/**
 * Cellule active (relevé Figma `9292:18077` : cellule de charge en saisie, story 2.2) ;
 * partagée avec `KeyboardField`.
 */
export const TABLE_CELL_ACTIVE_BACKGROUND = "#EAEAFF";
/**
 * Recette du 19/10 (RC-5) — ligne saisie par la poignée : opaque, fond teinté (couleur
 * existante de la Feuille, cellule active `#EAEAFF`) et légère élévation avec ombre, dès la
 * saisie et jusqu'à la fin de son insertion.
 */
const TABLE_ROW_LIFTED_BACKGROUND = "#EAEAFF";
const TABLE_ROW_LIFTED_SHADOW_COLOR = "#000000";
const TABLE_ROW_LIFTED_SHADOW_OPACITY = 0.18;
const TABLE_ROW_LIFTED_SHADOW_RADIUS = 6;
const TABLE_ROW_LIFTED_SHADOW_OFFSET_Y = 2;
const TABLE_ROW_LIFTED_ELEVATION = 4;
/**
 * RC-5 — insertion de la ligne déposée à sa place : même durée que le décalage des autres
 * lignes (`SHEET_ROW_SHIFT_MS`, transition de place de leur cadre) et même courbe.
 */
export const TABLE_ROW_DROP_MS = SHEET_ROW_SHIFT_MS;
const TABLE_ROW_DROP_EASING = Easing.out(Easing.cubic);
/** Zone de la croix au bord droit ; disque accepté de 28 (story 3.6) conservé. */
const TABLE_REMOVE_ZONE = 36;
const TABLE_REMOVE_DISC = 28;

/**
 * NFR-7, AD-28 : cibles tactiles de 36 dans le tableau sans agrandir le dessin. Poignée
 * 12 × 18 : +9 en haut et en bas, 4 à gauche (dans le retrait de ligne, `bleed`) et 20 à
 * droite (sur le numéro, non tactile). Croix 28 × 28 : +4 de chaque côté. Cellule 71 × 24 :
 * +6 en haut et en bas.
 */
export const HANDLE_HIT_SLOP = {
  top: (TABLE_ROW_HEIGHT - HANDLE_HEIGHT) / 2,
  bottom: (TABLE_ROW_HEIGHT - HANDLE_HEIGHT) / 2,
  left: TABLE_ROW_INSET,
  right: TABLE_ROW_HEIGHT - HANDLE_WIDTH - TABLE_ROW_INSET,
};
export const REMOVE_HIT_SLOP = (TABLE_ROW_HEIGHT - TABLE_REMOVE_DISC) / 2;
const CELL_HIT_SLOP = { top: (TABLE_ROW_HEIGHT - TABLE_CELL_HEIGHT) / 2, bottom: (TABLE_ROW_HEIGHT - TABLE_CELL_HEIGHT) / 2 };

/** Destination d'un glisser vertical de `dy` points depuis la ligne `from`, bornée au tableau. */
export function dragDestination(from: number, dy: number, rowHeight: number, count: number): number {
  return Math.min(count - 1, Math.max(0, from + Math.round(dy / rowHeight)));
}

/**
 * Story 3.6 — identité de la ligne de rang `index` (AD-2). Les identités et les lignes du
 * Brouillon sont alignées ; si elles ne l'étaient pas (`rowIds` plus court), la ligne n'a
 * pas d'identité : `null`, jamais son rang (un rang ne se mélange pas à une identité).
 */
export function tableRowIdentity(rowIds: readonly number[], index: number): number | null {
  return Number.isInteger(index) && index >= 0 && index < rowIds.length ? rowIds[index]! : null;
}

const fill = (template: string, number: number) => template.replace("{n}", String(number));

/**
 * Recette 2 (T-15) — repère d’insertion : trait bleu Kodjo de 2 entre deux lignes,
 * à l’endroit où la ligne sera déposée. Hauteur nulle dans le flux : les lignes
 * ne bougent pas.
 */
export function InsertionGuide({ testID }: { testID: string }) {
  return (
    <View
      style={styles.insertionGuideSlot}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      <View style={styles.insertionGuideLine} />
    </View>
  );
}

/** Libellés d'une ligne déplaçable, gabarits à `{n}` (numéro affiché de la ligne). */
export type DraggableRowLabels = {
  readonly handle: string;
  readonly row: string;
  readonly moveUp: string;
  readonly moveDown: string;
};

/**
 * Ligne de tableau de 36 : séparateur de 1 en tête, poignée de glisser (geste vertical,
 * destination bornée) et numéro aligné à droite, puis les cellules (`children`). La
 * poignée expose aussi les actions accessibles Monter / Descendre, qui produisent
 * exactement le même déplacement métier. Identifiants : `${testIDPrefix}-${n}` (ligne) et
 * `${testIDPrefix}-${n}-handle` (poignée).
 *
 * Recette du 19/10 (RC-5) : dès la saisie, la ligne est opaque et soulevée (fond teinté,
 * ombre) ; `onLiftedChange` le signale à l'appelant, qui place le cadre de la ligne
 * au-dessus des autres et lui retire sa transition de place. À la dépose, la ligne prend sa
 * nouvelle place dans le même rendu que le déplacement métier, décalée de l'écart qui
 * reste entre le doigt et cette place, puis glisse jusqu'à elle (`TABLE_ROW_DROP_MS`) ;
 * les autres lignes se décalent par la transition de place de leur cadre. Translation
 * portée par l'état du composant (rendu atomique avec la nouvelle place, aucun saut) ;
 * « Réduire les animations » : aucune glissade, ligne posée.
 */
export function DraggableRow({
  index,
  count,
  onMove,
  onDrag,
  onLiftedChange,
  labels,
  testIDPrefix,
  children,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onDrag: (state: { readonly from: number; readonly to: number } | null) => void;
  /** RC-5 : la ligne est saisie (de l'appui sur la poignée à la fin de son insertion). */
  onLiftedChange?: (lifted: boolean) => void;
  labels: DraggableRowLabels;
  testIDPrefix: string;
  children: ReactNode;
}) {
  const number = index + 1;
  const reduceMotion = useSheetMotionReduced();
  // Même mécanique que la Composition : responder natif + état de translation, sans bibliothèque.
  // Le renderer recycle l'événement du responder (`nativeEvent` remis à null
  // après le gestionnaire) : la position est lue de façon synchrone, jamais
  // dans une mise à jour d'état différée (recette 1, F-01).
  const [dragDy, setDragDy] = useState<number | null>(null);
  const [lifted, setLifted] = useState(false);
  const startYRef = useRef<number | null>(null);
  const lastDyRef = useRef(0);
  const settleFrameRef = useRef<number | null>(null);
  const onLiftedChangeRef = useRef(onLiftedChange);
  useEffect(() => {
    onLiftedChangeRef.current = onLiftedChange;
  });
  function stopSettle() {
    if (settleFrameRef.current !== null) cancelAnimationFrame(settleFrameRef.current);
    settleFrameRef.current = null;
  }
  useEffect(() => stopSettle, []);
  function lift(next: boolean) {
    setLifted(next);
    onLiftedChangeRef.current?.(next);
  }
  /** RC-5 : la ligne glisse de `offset` (écart à sa place) jusqu'à sa place, puis est reposée. */
  function settle(offset: number) {
    stopSettle();
    if (reduceMotion || offset === 0) {
      setDragDy(null);
      lift(false);
      return;
    }
    setDragDy(offset);
    const start = Date.now();
    const step = () => {
      const progress = Math.min(1, (Date.now() - start) / TABLE_ROW_DROP_MS);
      if (progress >= 1) {
        settleFrameRef.current = null;
        setDragDy(null);
        lift(false);
        return;
      }
      setDragDy(offset * (1 - TABLE_ROW_DROP_EASING(progress)));
      settleFrameRef.current = requestAnimationFrame(step);
    };
    settleFrameRef.current = requestAnimationFrame(step);
  }
  const actions = [
    ...(index > 0 ? [{ name: "moveUp", label: fill(labels.moveUp, number) }] : []),
    ...(index < count - 1 ? [{ name: "moveDown", label: fill(labels.moveDown, number) }] : []),
  ];
  return (
    <View
      style={[
        styles.tableRow,
        lifted ? styles.tableRowLifted : null,
        dragDy !== null ? { transform: [{ translateY: dragDy }] } : null,
      ]}
      testID={`${testIDPrefix}-${number}`}
    >
      <View style={styles.leadColumn}>
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(event) => {
            stopSettle();
            startYRef.current = event.nativeEvent.pageY;
            lastDyRef.current = 0;
            setDragDy(0);
            lift(true);
            onDrag({ from: index, to: index });
          }}
          onResponderMove={(event) => {
            const startY = startYRef.current;
            if (startY === null) return;
            const dy = event.nativeEvent.pageY - startY;
            lastDyRef.current = dy;
            setDragDy(dy);
            onDrag({ from: index, to: dragDestination(index, dy, TABLE_ROW_HEIGHT, count) });
          }}
          onResponderRelease={(event) => {
            const startY = startYRef.current;
            const dy = startY === null ? 0 : event.nativeEvent.pageY - startY;
            startYRef.current = null;
            onDrag(null);
            const to = dragDestination(index, dy, TABLE_ROW_HEIGHT, count);
            if (to !== index) onMove(to);
            // RC-5 : dans le même rendu, la ligne est à sa nouvelle place, encore sous le doigt.
            settle(dy - (to - index) * TABLE_ROW_HEIGHT);
          }}
          onResponderTerminate={() => {
            startYRef.current = null;
            onDrag(null);
            settle(lastDyRef.current);
          }}
          accessible
          accessibilityLabel={fill(labels.handle, number)}
          accessibilityActions={actions}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "moveUp") onMove(index - 1);
            if (event.nativeEvent.actionName === "moveDown") onMove(index + 1);
          }}
          // AD-28 : poignée dessinée 12 × 18, cible tactile 36 × 36.
          hitSlop={HANDLE_HIT_SLOP}
          style={styles.dragHandle}
          testID={`${testIDPrefix}-${number}-handle`}
        >
          {[0, 1, 2].map((line) => (
            <View key={line} style={styles.dragDotsLine}>
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
            </View>
          ))}
        </View>
        <Text style={styles.rowNumber} accessibilityLabel={fill(labels.row, number)}>
          {number}
        </Text>
      </View>
      {/* PRE-5 story 2.7 : écart d'amorce rétrécissable, identique à celui de l'en-tête. */}
      <View style={tableStyles.leadGap} testID={`${testIDPrefix}-${number}-lead-gap`} />
      {children}
    </View>
  );
}

/**
 * Cellule à valeur seule (71 × 24, rayon 8) : son appui ouvre le seul sélecteur de la
 * cellule (roue, champ ±, clavier) ; aucun stepper permanent (FR-29). Active : fond
 * `#EAEAFF` ; valeur à renseigner : fond rouge pâle (`#FFF1F0`, Q35). Cible tactile de 36.
 */
export function TableCell({
  value,
  accessibilityLabel,
  spokenValue,
  accessibilityHint,
  active,
  invalid = false,
  onPress,
  toggleRef,
  testID,
  valueTestID,
}: {
  value: string;
  /** Nom de la cellule (ligne et colonne) ; la valeur est annoncée à part (`spokenValue`). */
  accessibilityLabel: string;
  spokenValue: string;
  accessibilityHint?: string;
  active: boolean;
  invalid?: boolean;
  onPress: (() => void) | undefined;
  toggleRef?: Ref<View>;
  testID: string;
  /** Identifiant du texte de la valeur (par défaut `${testID}-value`). */
  valueTestID?: string;
}) {
  return (
    <Pressable
      ref={toggleRef}
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: spokenValue }}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ expanded: active }}
      hitSlop={CELL_HIT_SLOP}
      style={[styles.cell, active ? styles.cellActive : invalid ? styles.cellInvalid : null]}
      testID={testID}
    >
      <Text style={styles.cellValue} testID={valueTestID ?? `${testID}-value`}>
        {value}
      </Text>
    </Pressable>
  );
}

/**
 * Story 3.6 (FR-12-05 ; maître `8129:31604`) — croix de retrait d'une ligne : disque 28
 * (`#FCFCFE`, liseré blanc), croix bleu Kodjo, dans une zone de 36 au bord droit, portée à
 * 36 par `hitSlop` (AD-28). Son effet (retrait, ou rangement de l'outil ouvert) est décidé
 * par l'appelant ; non active (`active` faux), elle annonce `closesFieldHint` : un appui
 * ferme d'abord le champ ouvert, au lieu d'un retrait.
 */
export function RemoveRowButton({
  accessibilityLabel,
  closesFieldHint,
  disabled,
  disabledHint,
  active,
  onPress,
  testID,
}: {
  accessibilityLabel: string;
  closesFieldHint: string;
  disabled: boolean;
  /** PRE-6 story 3.3 : raison annoncée d'une croix indisponible (N imposé par le Circuit). */
  disabledHint?: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <View style={styles.removeZone}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={disabled ? disabledHint : active ? undefined : closesFieldHint}
        accessibilityState={{ disabled }}
        hitSlop={REMOVE_HIT_SLOP}
        style={[styles.removeDisc, disabled ? styles.unselected : null]}
        testID={testID}
      >
        <KodjoIcon name="wheel-action-cancel" tintColor={colors.primary} />
      </Pressable>
    </View>
  );
}

/**
 * D-5, T-58 — message temporaire d'ajustement ou de retrait (« Série supprimée —
 * Annuler ») : toucher le message le ferme SANS annuler ; seul « Annuler » (capsule claire
 * sur le fond sombre) restaure. Le conteneur n'est pas un élément VoiceOver : texte et
 * Annuler restent accessibles séparément. Q41 : apparition et disparition par le bas, sans
 * fondu. Identifiants : `${testID}-motion`, `testID`, `${testID}-undo`.
 */
export function UndoMessage({
  message,
  undoLabel,
  onDismiss,
  onUndo,
  testID,
}: {
  message: string;
  undoLabel: string;
  onDismiss: () => void;
  onUndo: () => void;
  testID: string;
}) {
  return (
    <SheetMotionView testID={`${testID}-motion`}>
      <Pressable
        onPress={onDismiss}
        accessible={false}
        style={styles.adjustment}
        accessibilityLiveRegion="polite"
        testID={testID}
      >
        <Text style={styles.adjustmentText}>{message}</Text>
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel={undoLabel}
          hitSlop={8}
          style={styles.adjustmentActionFrame}
          testID={`${testID}-undo`}
        >
          <Text style={styles.adjustmentAction}>{undoLabel}</Text>
        </Pressable>
      </Pressable>
    </SheetMotionView>
  );
}

/** T-58 : marge égale entre la capsule Annuler et les bords droit, haut et bas du message. */
const ADJUSTMENT_ACTION_INSET = 8;

/**
 * Styles de mise en page partagés par les tableaux (bloc, en-têtes, colonnes) : même suite
 * de colonnes pour les en-têtes et les lignes.
 */
export const tableStyles = StyleSheet.create({
  // Bloc blanc, sans contour ; marges horizontales posées par l'appelant (cadre).
  block: {
    backgroundColor: colors.background,
    borderRadius: TABLE_BLOCK_RADIUS,
    marginVertical: TABLE_BLOCK_VERTICAL_INSET,
    paddingHorizontal: TABLE_ROW_INSET,
    // Recette du 19/10 (RC-9) : plus d'espace d'une hauteur de ligne sous la dernière ligne
    // (remplace cette partie de PR-02) ; vaut pour les tableaux des séries et des phases.
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    // Hauteur minimale : un texte agrandi n'est jamais rogné (story 3.8, AC7).
    minHeight: TABLE_HEADER_HEIGHT,
  },
  // Amorce de l'en-tête : place de la poignée et du numéro ; l'écart avant la 1re cellule
  // suit (`leadGap`), comme dans les lignes (PRE-5 story 2.7).
  headerLead: {
    width: TABLE_LEAD_WIDTH,
  },
  // PRE-5 story 2.7 : écart de 20 après l'amorce (en-tête et lignes), rétrécissable en premier.
  leadGap: {
    width: TABLE_LEAD_GAP,
    flexShrink: TABLE_LEAD_GAP_SHRINK,
  },
  columnHeader: {
    ...type.supporting,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    color: colors.textSecondary,
    width: TABLE_CELL_WIDTH,
    flexShrink: 1,
    textAlign: "center",
  },
  // Colonne vide (cellule absente, par ex. Mode non renseigné) : garde la suite de colonnes.
  emptyCell: {
    width: TABLE_CELL_WIDTH,
    flexShrink: 1,
  },
  // Écart entre deux cellules (et entre deux en-têtes).
  cellGap: {
    width: TABLE_CELL_GAP,
  },
  // Espace souple avant la croix.
  spacer: {
    flex: 1,
  },
  // Place de la colonne des croix dans l'en-tête.
  removeColumn: {
    width: TABLE_REMOVE_ZONE,
  },
});

const styles = StyleSheet.create({
  insertionGuideSlot: {
    height: 0,
    zIndex: 2,
  },
  insertionGuideLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  // Ligne de 36, séparateur de 1 en tête (compris dans les 36).
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    height: TABLE_ROW_HEIGHT,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  // RC-5 : ligne saisie, opaque et soulevée.
  tableRowLifted: {
    backgroundColor: TABLE_ROW_LIFTED_BACKGROUND,
    shadowColor: TABLE_ROW_LIFTED_SHADOW_COLOR,
    shadowOpacity: TABLE_ROW_LIFTED_SHADOW_OPACITY,
    shadowRadius: TABLE_ROW_LIFTED_SHADOW_RADIUS,
    shadowOffset: { width: 0, height: TABLE_ROW_LIFTED_SHADOW_OFFSET_Y },
    elevation: TABLE_ROW_LIFTED_ELEVATION,
  },
  leadColumn: {
    width: TABLE_LEAD_WIDTH,
    flexDirection: "row",
    alignItems: "center",
  },
  dragHandle: {
    width: HANDLE_WIDTH,
    height: HANDLE_HEIGHT,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  dragDotsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textSecondary,
  },
  // Numéro Inter Medium 14, aligné à droite sur x 14-38.
  rowNumber: {
    ...type.label,
    color: colors.textPrimary,
    marginLeft: NUMBER_LEFT - HANDLE_WIDTH,
    flex: 1,
    textAlign: "right",
  },
  cell: {
    width: TABLE_CELL_WIDTH,
    // Hauteur minimale (texte agrandi, story 3.8 AC7) ; la ligne de 36 reste l'exception consignée.
    minHeight: TABLE_CELL_HEIGHT,
    flexShrink: 1,
    borderRadius: TABLE_CELL_RADIUS,
    // Figma `9290:18003` : aucun fond au repos (seulement actif ou à renseigner).
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  cellActive: {
    backgroundColor: TABLE_CELL_ACTIVE_BACKGROUND,
  },
  // Valeur à renseigner : fond rouge léger, sans liseré (Q35 ; jeton `color.dangerSurface`, #FFF1F0).
  cellInvalid: {
    backgroundColor: colors.dangerSurface,
  },
  cellValue: {
    ...type.editableValue,
    color: colors.primary,
  },
  removeZone: {
    width: TABLE_REMOVE_ZONE,
    height: TABLE_REMOVE_ZONE,
    alignItems: "center",
    justifyContent: "center",
  },
  // Story 3.6 (`8129:31604`) : disque 28 `#FCFCFE` à liseré blanc, croix centrée.
  removeDisc: {
    width: TABLE_REMOVE_DISC,
    height: TABLE_REMOVE_DISC,
    borderRadius: TABLE_REMOVE_DISC / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.parametersSegmentedOption,
    borderWidth: 1,
    borderColor: colors.background,
  },
  // AD-11 : élément sans effet (croix de retrait indisponible).
  unselected: {
    opacity: UNSELECTED_OPACITY,
  },
  // DSF : message temporaire sous la ligne concernée, à 4 pt ; fond snackbar, rayon 16.
  // Recette 2 (T-58) : la capsule Annuler s’étire sur la hauteur intérieure, avec
  // des marges droite, haute et basse égales (ADJUSTMENT_ACTION_INSET).
  adjustment: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.snackbar,
    borderRadius: fixedRadii[16],
    paddingVertical: ADJUSTMENT_ACTION_INSET,
    paddingRight: ADJUSTMENT_ACTION_INSET,
    paddingLeft: spacing[16],
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing[12],
  },
  adjustmentText: {
    ...type.body,
    color: colors.background,
    flex: 1,
    alignSelf: "center",
    paddingVertical: spacing[2],
  },
  adjustmentAction: {
    ...type.button,
    color: colors.background,
  },
  // D-5 précisé par la recette 2 (T-58) : capsule sans contour, blanc transparent
  // à 90 %, extrémités en demi-cercle, plus grande.
  adjustmentActionFrame: {
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[16],
    borderRadius: 999,
    backgroundColor: colors.snackbarActionSurface,
  },
});

/**
 * PRE-5 story 2.2 : gabarit de la cellule (71 × 24, rayon 8, valeur Semi Bold 13 primaire),
 * réutilisé par la cellule Charge (`KeyboardField`) sans copie des mesures.
 */
export const tableCellStyle = styles.cell;
export const tableCellValueStyle = styles.cellValue;
