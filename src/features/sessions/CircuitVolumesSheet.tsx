import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CircuitVolumes } from "@/domain/sessions/circuit";
import {
  SheetMotionProvider,
  SheetMotionView,
} from "@/features/activities/SheetMotion";
import { formatCircuitVolumes } from "@/features/sessions/circuitVolumesPresentation";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  colors,
  fixedRadii,
  minTouchTarget,
  spacing,
  type,
} from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * Géométrie de la grille (Figma `8328:35116`, relevé du 21/10) : colonne « Exercice » 130
 * (elle prend la place libre), colonnes S 53, « Unité » 40 ; en-têtes sur 34 puis trait 1 ;
 * lignes de 36 à partir de 7 sous le trait ; 16 sous la dernière ligne. Constantes locales,
 * `tokens.ts` inchangé.
 */
export const VOLUMES_EXERCISE_COLUMN_WIDTH = 130;
export const VOLUMES_SERIES_COLUMN_WIDTH = 53;
export const VOLUMES_UNIT_COLUMN_WIDTH = 40;
export const VOLUMES_ROW_HEIGHT = 36;
const VOLUMES_HEADER_HEIGHT = 34;
const VOLUMES_HEADER_TEXT_TOP = 13;
const VOLUMES_ROWS_TOP_GAP = 7;
/** Haut de la première ligne dans la grille : en-têtes, trait, écart. */
const VOLUMES_ROWS_TOP = VOLUMES_HEADER_HEIGHT + 1 + VOLUMES_ROWS_TOP_GAP;
/** Fond alterné léger des colonnes S impaires (Figma `8328:35117`, `8328:35118`). */
export const VOLUMES_ALTERNATE_COLUMN_BACKGROUND = "#F9FBFB";

/** En-tête de la feuille : 60 (Figma `8328:35110`), poignée 50 × 4 à 8 du haut. */
const SHEET_HEADER_HEIGHT = 60;
const SHEET_HANDLE = { width: 50, height: 4, top: spacing[8] } as const;
const SHEET_CLOSE_CIRCLE = 38;
/** Montée de la feuille : même ouverture que la Feuille des paramètres (0,25 s, ease-out). */
const SHEET_ENTRY_DURATION_MS = 250;
/** Glisser vers le bas de la poignée : au-delà de 80 (ou d'un geste rapide), la feuille se ferme. */
const DRAG_DISMISS_DISTANCE = 80;
const DRAG_DISMISS_VELOCITY = 0.5;

/** Glisser relâché : vrai s’il ferme la feuille (distance ou vitesse vers le bas). */
export function shouldDismissSheetDrag(dy: number, vy: number): boolean {
  return dy > DRAG_DISMISS_DISTANCE || vy > DRAG_DISMISS_VELOCITY;
}

/** Medium 12 (en-têtes, unité) et Medium 13 (nom) : graisse de `type.label`, sans jeton propre. */
const MEDIUM_12 = {
  fontFamily: type.label.fontFamily,
  fontWeight: type.label.fontWeight,
  fontSize: 12,
  lineHeight: 15,
} as const;
const MEDIUM_13 = {
  fontFamily: type.label.fontFamily,
  fontWeight: type.label.fontWeight,
  fontSize: 13,
  lineHeight: 16,
} as const;

export type CircuitVolumesSheetProps = {
  /** Grille du Domaine (`circuitVolumes`) : la feuille ne lit rien d'autre et n'écrit rien. */
  readonly volumes: CircuitVolumes;
  /** X, voile, glisser vers le bas ou retour système : fermeture sans aucune modification. */
  readonly onClose: () => void;
  /**
   * Affichage de la `Modal` (vrai par défaut). L'écran garde la feuille montée pendant sa
   * disparition native, puis la démonte sur `onDismissed`.
   */
  readonly visible?: boolean;
  /**
   * Disparition terminée : `onDismiss` de la `Modal` sur iOS (fin de l'animation native), dès le
   * passage à `visible={false}` ailleurs. L'écran y rend le focus à l'œil.
   */
  readonly onDismissed?: () => void;
  readonly testID?: string;
};

/**
 * Feuille basse « Volumes du circuit » (PRE-6 story 3.4, CE-CIR-03, Figma `8328:34965` Séries,
 * `8328:35135` Tours) — lecture seule : aucune cellule interactive, aucune écriture du brouillon.
 *
 * - Même patron que les feuilles basses existantes (`Modal` + voile + `SheetMotion`) : poignée,
 *   en-tête 60 avec X à gauche et titre centré, trait 1 ; hauteur selon le contenu, bornée par
 *   l'écran (défilement vertical au-delà) ; marge de la zone sûre du bas.
 * - Grille : « Exercice » et « Unité » fixes, colonnes S1…Smax défilant horizontalement si
 *   nécessaire ; colonnes S impaires sur fond alterné. Valeurs formatées par
 *   `formatCircuitVolumes` (fonction pure testée).
 * - Accessibilité : la grille visuelle est masquée ; chaque ligne est un seul élément lu
 *   « {exercice}, série 1 : 10 répétitions, … » (calque transparent, sans toucher).
 * - Circuit vide : « Aucun exercice dans le circuit », sans valeur fictive.
 */
export function CircuitVolumesSheet({
  volumes,
  onClose,
  visible = true,
  onDismissed,
  testID = "circuit-volumes",
}: CircuitVolumesSheetProps) {
  const t = strings.screens.composition.circuit.volumes;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const presentation = useMemo(() => formatCircuitVolumes(volumes), [volumes]);
  const [sheetEntry] = useState(() => new Animated.Value(windowHeight));
  const [drag] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => Animated.add(sheetEntry, drag));

  useEffect(() => {
    // D-7 : « Réduire les animations » → feuille en place, sans montée.
    if (reduceMotion) {
      sheetEntry.stopAnimation();
      sheetEntry.setValue(0);
      return;
    }
    const animation = Animated.timing(sheetEntry, {
      toValue: 0,
      duration: SHEET_ENTRY_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [sheetEntry, reduceMotion]);

  // Hors iOS, `onDismiss` n'est pas fiable : la disparition est signalée au passage à masqué.
  useEffect(() => {
    if (!visible && Platform.OS !== "ios") onDismissed?.();
  }, [visible, onDismissed]);

  // Glisser vers le bas depuis la poignée (et l'en-tête) : la feuille suit le doigt ; relâchée
  // au-delà du seuil, elle se ferme ; sinon elle revient. Un toucher simple (X) n'est pas capté.
  const panResponder = useMemo(() => {
    // Retour en place après un glisser court ; immédiat sous « Réduire les animations » (D-7).
    const resetDrag = () => {
      if (reduceMotion) {
        drag.setValue(0);
        return;
      }
      Animated.timing(drag, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) =>
        gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_event, gesture) =>
        drag.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_event, gesture) => {
        if (shouldDismissSheetDrag(gesture.dy, gesture.vy)) {
          onClose();
          return;
        }
        resetDrag();
      },
      onPanResponderTerminate: resetDrag,
    });
  }, [drag, onClose, reduceMotion]);

  const isEmpty = presentation.rows.length === 0;
  const seriesCount = presentation.seriesColumns.length;

  return (
    <Modal
      transparent
      visible={visible}
      // D-7 : sans fondu sous « Réduire les animations ».
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onClose}
      onDismiss={Platform.OS === "ios" ? onDismissed : undefined}
      testID={`${testID}-modal`}
    >
      <View style={styles.scrim}>
        {/* Toucher du voile : fermeture sans modification ; hors de l'arbre VoiceOver (X, échappement). */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
          testID={`${testID}-scrim`}
        />
        <Animated.View
          style={[styles.sheetFrame, { transform: [{ translateY }] }]}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          testID={`${testID}-sheet`}
        >
          <SheetMotionProvider reduceMotion={reduceMotion}>
            <SheetMotionView
              appear={false}
              style={[
                styles.sheet,
                {
                  maxHeight: windowHeight - insets.top - spacing[24],
                  paddingBottom: insets.bottom,
                },
              ]}
              testID={`${testID}-surface`}
            >
              <View
                {...panResponder.panHandlers}
                testID={`${testID}-drag-zone`}
              >
                <View style={styles.header} testID={`${testID}-header`}>
                  <View style={styles.handle} testID={`${testID}-handle`} />
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel={t.closeAccessibilityLabel}
                    hitSlop={(minTouchTarget - SHEET_CLOSE_CIRCLE) / 2}
                    style={styles.closeCircle}
                    testID={`${testID}-close`}
                  >
                    <KodjoIcon name="wheel-action-cancel" />
                  </Pressable>
                  <Text
                    style={styles.title}
                    accessibilityRole="header"
                    numberOfLines={1}
                    testID={`${testID}-title`}
                  >
                    {t.title}
                  </Text>
                  <View style={styles.headerBalance} />
                </View>
              </View>

              <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyContent}
                testID={`${testID}-body`}
              >
                {isEmpty ? (
                  <Text style={styles.empty} testID={`${testID}-empty`}>
                    {t.empty}
                  </Text>
                ) : (
                  <View style={styles.grid} testID={`${testID}-grid`}>
                    {/* Grille visuelle, masquée pour VoiceOver : les lignes sont lues par le calque ci-dessous. */}
                    <View
                      style={styles.gridColumns}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      <View
                        style={styles.exerciseColumn}
                        testID={`${testID}-exercise-column`}
                      >
                        <HeaderCell text={t.columns.exercise} align="left" />
                        {presentation.rows.map((row) => (
                          <View
                            key={row.occurrenceId}
                            style={styles.nameCell}
                            testID={`${testID}-name-${row.occurrenceId}`}
                          >
                            <Text
                              style={styles.name}
                              numberOfLines={1}
                              testID={`${testID}-name-${row.occurrenceId}-text`}
                            >
                              {row.name}
                            </Text>
                            {row.isBilateral ? (
                              <View style={styles.sideChange}>
                                <KodjoIcon
                                  name="side-change"
                                  testID={`${testID}-side-change-${row.occurrenceId}`}
                                />
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </View>
                      <ScrollView
                        horizontal
                        style={[
                          styles.seriesScroll,
                          { width: seriesCount * VOLUMES_SERIES_COLUMN_WIDTH },
                        ]}
                        showsHorizontalScrollIndicator
                        testID={`${testID}-series-scroll`}
                      >
                        {presentation.seriesColumns.map((label, column) => (
                          <View
                            key={label}
                            style={styles.seriesColumn}
                            testID={`${testID}-column-${column + 1}`}
                          >
                            <HeaderCell text={label} align="center" />
                            <View
                              style={
                                column % 2 === 0 ? styles.alternateBody : null
                              }
                              testID={`${testID}-column-${column + 1}-body`}
                            >
                              {presentation.rows.map((row) => (
                                <View
                                  key={row.occurrenceId}
                                  style={styles.valueCell}
                                >
                                  <Text
                                    style={styles.value}
                                    numberOfLines={1}
                                    testID={`${testID}-cell-${row.occurrenceId}-${column + 1}`}
                                  >
                                    {row.cells[column]?.text ?? t.missingValue}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                      <View
                        style={styles.unitColumn}
                        testID={`${testID}-unit-column`}
                      >
                        <HeaderCell text={t.columns.unit} align="center" />
                        {presentation.rows.map((row) => (
                          <View key={row.occurrenceId} style={styles.valueCell}>
                            <Text
                              style={styles.unit}
                              numberOfLines={1}
                              testID={`${testID}-unit-${row.occurrenceId}`}
                            >
                              {row.unit}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View style={styles.accessibilityLayer}>
                      {presentation.rows.map((row, index) => (
                        <View
                          key={row.occurrenceId}
                          accessible
                          accessibilityLabel={row.accessibilityLabel}
                          style={[
                            styles.accessibilityRow,
                            {
                              top:
                                VOLUMES_ROWS_TOP + index * VOLUMES_ROW_HEIGHT,
                            },
                          ]}
                          testID={`${testID}-row-${row.occurrenceId}`}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </SheetMotionView>
          </SheetMotionProvider>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** En-tête de colonne (Medium 12, texte secondaire) suivi du trait et de l'écart avant les lignes. */
function HeaderCell({
  text,
  align,
}: {
  text: string;
  align: "left" | "center";
}) {
  return (
    <>
      <View style={styles.headerCell}>
        <Text
          style={[styles.columnHeader, { textAlign: align }]}
          numberOfLines={1}
        >
          {text}
        </Text>
      </View>
      <View style={styles.separator} />
      <View style={styles.rowsTopGap} />
    </>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlayScrim,
  },
  sheetFrame: {
    flex: 1,
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: fixedRadii[24],
    borderTopRightRadius: fixedRadii[24],
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: SHEET_HEADER_HEIGHT,
    marginHorizontal: spacing[12],
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  handle: {
    position: "absolute",
    top: SHEET_HANDLE.top,
    left: "50%",
    marginLeft: -SHEET_HANDLE.width / 2,
    width: SHEET_HANDLE.width,
    height: SHEET_HANDLE.height,
    borderRadius: SHEET_HANDLE.height / 2,
    backgroundColor: colors.disabled,
  },
  closeCircle: {
    width: SHEET_CLOSE_CIRCLE,
    height: SHEET_CLOSE_CIRCLE,
    borderRadius: SHEET_CLOSE_CIRCLE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionCancelBackground,
  },
  title: {
    flex: 1,
    ...type.modalTitle,
    color: colors.textPrimary,
    textAlign: "center",
  },
  // Contrepoids du X : le titre reste centré sur la feuille.
  headerBalance: {
    width: SHEET_CLOSE_CIRCLE,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing[12] + spacing[24],
    paddingBottom: spacing[16],
  },
  empty: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing[24],
  },
  grid: {
    position: "relative",
  },
  gridColumns: {
    flexDirection: "row",
  },
  exerciseColumn: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: VOLUMES_EXERCISE_COLUMN_WIDTH,
  },
  seriesScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  seriesColumn: {
    width: VOLUMES_SERIES_COLUMN_WIDTH,
  },
  unitColumn: {
    width: VOLUMES_UNIT_COLUMN_WIDTH,
    flexShrink: 0,
  },
  headerCell: {
    height: VOLUMES_HEADER_HEIGHT,
    paddingTop: VOLUMES_HEADER_TEXT_TOP,
  },
  columnHeader: {
    ...MEDIUM_12,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  rowsTopGap: {
    height: VOLUMES_ROWS_TOP_GAP,
  },
  nameCell: {
    height: VOLUMES_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing[8],
  },
  name: {
    ...MEDIUM_13,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  sideChange: {
    marginLeft: spacing[4],
    flexShrink: 0,
  },
  alternateBody: {
    backgroundColor: VOLUMES_ALTERNATE_COLUMN_BACKGROUND,
  },
  valueCell: {
    height: VOLUMES_ROW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    ...type.editableValue,
    color: colors.textPrimary,
    textAlign: "center",
  },
  unit: {
    ...MEDIUM_12,
    color: colors.textSecondary,
    textAlign: "center",
  },
  accessibilityLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    // Calque de lecture seule : aucun toucher (le défilement horizontal passe dessous).
    pointerEvents: "none",
  },
  accessibilityRow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: VOLUMES_ROW_HEIGHT,
  },
});
