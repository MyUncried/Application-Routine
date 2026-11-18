import { Host, HStack, Picker as SwiftUIPicker, Text as SwiftUIText } from "@expo/ui/swift-ui";
import { accessibilityLabel as accessibilityLabelModifier, foregroundStyle, frame, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { colors, layout, spacing } from "@/shared/ui/tokens";

/**
 * Roulette native en popover près du champ (D-520, CE-UI-12 §3 ; Figma `12652:28447` nombre de semaines, `12652:28306`
 * Rappel personnalisé) : fond grisé, ni titre, ni bouton, ni unité. Chaque cran de la roulette applique la valeur ; un
 * toucher sur le fond grisé ferme.
 *
 * Primitive native (`.github/AI_ORCHESTRATION.md`, « Priorité aux primitives natives ») : sur iOS, `Picker` SwiftUI de
 * `@expo/ui` en `pickerStyle("wheel")`, une colonne par valeur (heures, minutes). Ce composant n'est qu'un conteneur de
 * positionnement autour de la primitive : voile en fondu (`Modal` transparent, comme `WheelPickerOverlay`) et panneau
 * blanc posé sous le champ. iOS n'offre pas de popover natif sans flèche ni titre (voir `AnchoredPanel`).
 *
 * Android : `@expo/ui/swift-ui` est réservé à iOS. La branche Android rend explicitement `android` (le sélecteur partagé
 * de l'application, avec sa barre ✕ / ✓) dans le même panneau — chemin Android déjà retenu par `NumberWheelPicker` et
 * `DurationWheelPicker`, jamais une imitation de la roulette sur iOS.
 */

export type WheelColumn = {
  readonly values: readonly number[];
  readonly selected: number;
  readonly onChange: (value: number) => void;
  readonly format?: (value: number) => string;
  readonly accessibilityLabel: string;
  readonly testID: string;
};

/** Rectangle du champ déclencheur, dans la fenêtre (`measureInWindow`). */
export type PopoverAnchor = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

const COLUMN_WIDTH = 72;
const PANEL_GAP = 6;
const PANEL_PADDING = spacing[8];

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
  if (anchor === null) return null;
  const width = Platform.OS === "ios" ? columns.length * COLUMN_WIDTH + PANEL_PADDING * 2 : window.width - layout.screenGutter * 2;
  const centered = anchor.x + anchor.width / 2 - width / 2;
  const left = Math.max(layout.screenGutter, Math.min(window.width - layout.screenGutter - width, centered));
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss} testID={testID}>
      <Pressable style={styles.scrim} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Fermer" testID={`${testID}-scrim`} />
      <View
        accessibilityViewIsModal
        onAccessibilityEscape={onDismiss}
        style={[styles.panel, { top: anchor.y + anchor.height + PANEL_GAP, left, width }]}
        testID={`${testID}-panel`}
      >
        {Platform.OS === "ios" ? (
          <Host matchContents>
            <HStack spacing={0} alignment="center">
              {columns.map((column) => (
                <SwiftUIPicker
                  key={column.testID}
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
              ))}
            </HStack>
          </Host>
        ) : (
          android
        )}
      </View>
    </Modal>
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
