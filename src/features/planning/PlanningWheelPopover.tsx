import { Host, HStack, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { accessibilityLabel as accessibilityLabelModifier, foregroundStyle, frame, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useState, type ReactNode } from "react";
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, layout, spacing } from "@/shared/ui/tokens";

/**
 * Sélecteurs de la planification en popover près du champ (D-520, CE-UI-12 §3 ; Figma `12652:28447` nombre de semaines,
 * `12652:28306` Rappel personnalisé, `12652:28155` date) : fond grisé, ni titre ni bouton. Chaque cran ou chaque jour
 * touché s'applique ; un toucher sur le fond grisé ferme.
 *
 * Recette du 19/11/2026 (k19, k13, e2) : mêmes popovers pour la date et l'heure (« retirer les boutons et le titre,
 * réajuster la hauteur des modales ; cliquer sur le voile gris en dehors de la modale ferme la modale ») ; le panneau
 * passe au-dessus du champ quand il ne tient pas dessous et reste dans l'écran (« la roulette s'affiche en bas à droite
 * et est tronquée ») ; unités affichées à côté des roues du rappel (« ajouter à la modale les unités »).
 *
 * Primitives natives (`.github/AI_ORCHESTRATION.md`, « Priorité aux primitives natives ») : sur iOS, `Picker` SwiftUI de
 * `@expo/ui` en `pickerStyle("wheel")` et `DatePicker` graphique, dans un `Host` en apparence claire (le panneau est
 * blanc : en mode sombre, le calendrier écrivait en blanc sur blanc, recette k19). Ce composant n'est qu'un conteneur de
 * positionnement : voile en fondu (`Modal` transparent) et panneau blanc posé près du champ.
 *
 * Android : `@expo/ui/swift-ui` est réservé à iOS. La branche Android rend explicitement `android` (le sélecteur partagé
 * de l'application) dans le même panneau, jamais une imitation de la roulette sur iOS.
 */

export type WheelColumn = {
  readonly values: readonly number[];
  readonly selected: number;
  readonly onChange: (value: number) => void;
  readonly format?: (value: number) => string;
  /** Unité écrite à droite de la roue (« heures », « minutes »). */
  readonly unit?: string;
  readonly accessibilityLabel: string;
  readonly testID: string;
};

/** Rectangle du champ déclencheur, dans la fenêtre (`measureInWindow`). */
export type PopoverAnchor = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

const COLUMN_WIDTH = 72;
const UNIT_WIDTH = 76;
const PANEL_GAP = 6;
const PANEL_PADDING = spacing[8];

/**
 * Position du panneau : centré horizontalement sur l'écran (recette du 19/11/2026 au soir, s19-popover et s19-date-heure :
 * « Centrer la modale horizontalement sur l'écran » ; [centré sur le champ, dans les marges — remplacé]) ; sous le champ
 * s'il y tient, sinon au-dessus ; toujours dans la zone utile de l'écran.
 */
export function popoverPosition(
  anchor: PopoverAnchor,
  panel: { readonly width: number; readonly height: number },
  screen: { readonly width: number; readonly height: number; readonly top: number; readonly bottom: number },
): { readonly left: number; readonly top: number } {
  const left = Math.max(0, (screen.width - panel.width) / 2);
  const minTop = screen.top + PANEL_GAP;
  const maxTop = screen.height - screen.bottom - PANEL_GAP - panel.height;
  const below = anchor.y + anchor.height + PANEL_GAP;
  const above = anchor.y - PANEL_GAP - panel.height;
  const top = below <= maxTop ? below : above >= minTop ? above : Math.max(minTop, maxTop);
  return { left, top };
}

/** Conteneur : voile grisé en fondu, panneau blanc posé près du champ ; un toucher sur le voile ferme. */
export function PlanningPopover({
  anchor,
  width,
  onDismiss,
  children,
  testID,
}: {
  readonly anchor: PopoverAnchor | null;
  readonly width: number;
  readonly onDismiss: () => void;
  readonly children: ReactNode;
  readonly testID: string;
}) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState<number | null>(null);
  if (anchor === null) return null;
  const panelWidth = Math.min(width, window.width - layout.screenGutter * 2);
  const position = popoverPosition(anchor, { width: panelWidth, height: height ?? 0 }, { width: window.width, height: window.height, top: insets.top, bottom: insets.bottom });
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss} testID={testID}>
      <Pressable style={styles.scrim} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Fermer" testID={`${testID}-scrim`} />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onDismiss}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        // Panneau invisible le temps de connaître sa hauteur : il s'affiche directement à sa place.
        style={[styles.panel, { top: position.top, left: position.left, width: panelWidth, opacity: height === null ? 0 : 1 }]}
        testID={`${testID}-panel`}
      >
        {children}
      </View>
    </Modal>
  );
}

export function PlanningWheelPopover({
  anchor,
  columns,
  onDismiss,
  android,
  testID,
}: {
  readonly anchor: PopoverAnchor | null;
  readonly columns: readonly WheelColumn[];
  readonly onDismiss: () => void;
  /** Sélecteur rendu à la place de la roulette SwiftUI hors iOS. */
  readonly android: ReactNode;
  readonly testID: string;
}) {
  const window = useWindowDimensions();
  const width =
    Platform.OS === "ios"
      ? columns.reduce((total, column) => total + COLUMN_WIDTH + (column.unit === undefined ? 0 : UNIT_WIDTH), 0) + PANEL_PADDING * 2
      : window.width - layout.screenGutter * 2;
  return (
    <PlanningPopover anchor={anchor} width={width} onDismiss={onDismiss} testID={testID}>
      {Platform.OS === "ios" ? (
        <Host matchContents colorScheme="light">
          <HStack spacing={0} alignment="center">
            {columns.map((column) => (
              <HStack key={column.testID} spacing={0} alignment="center">
                <SwiftUIPicker
                  selection={column.selected}
                  onSelectionChange={(value: number) => column.onChange(value)}
                  modifiers={[pickerStyle("wheel"), frame({ width: COLUMN_WIDTH }), accessibilityLabelModifier(column.accessibilityLabel)]}
                  testID={column.testID}
                >
                  {column.values.map((value) => (
                    <SwiftUIText key={value} modifiers={[tag(value), foregroundStyle(colors.textPrimary)]}>
                      {column.format ? column.format(value) : String(value)}
                    </SwiftUIText>
                  ))}
                </SwiftUIPicker>
                {column.unit === undefined ? null : (
                  <SwiftUIText modifiers={[frame({ width: UNIT_WIDTH, alignment: "leading" }), foregroundStyle(colors.textPrimary)]} testID={`${column.testID}-unit`}>
                    {column.unit}
                  </SwiftUIText>
                )}
              </HStack>
            ))}
          </HStack>
        </Host>
      ) : (
        android
      )}
    </PlanningPopover>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlayScrim },
  panel: {
    position: "absolute",
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: PANEL_PADDING,
    alignItems: "center",
  },
});
