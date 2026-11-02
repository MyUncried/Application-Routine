import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { strings } from "@/shared/i18n";

/**
 * PRE-9 C.4 (référence Formats du 02/11/2026 §7.5, §11) — roulette de la durée portée par un Circuit
 * porteur : durée de chaque bloc (AMRAP), durée de chaque tour (EMOM, Death by groupé), temps limite
 * (For time, avec « Sans limite »). Roulette native existante (\`DurationWheelPicker\`) dans une feuille
 * sur voile ; borne basse 1 s ; rien n'est écrit avant ✓.
 */

const SCRIM = "rgba(31, 33, 41, 0.42)";

export function CarrierDurationSheet({
  seconds,
  allowsNone,
  onValidate,
  onCancel,
}: {
  readonly seconds: number | null;
  /** For time : « Sans limite » (aucun temps limite). */
  readonly allowsNone: boolean;
  readonly onValidate: (seconds: number | null) => void;
  readonly onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const wheel = strings.screens.exercise.wheelPicker;
  const t = strings.screens.composition.carrier;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={[StyleSheet.absoluteFill, styles.scrim]} onPress={onCancel} accessibilityRole="button" accessibilityLabel={wheel.cancelAccessibilityLabel} testID="carrier-duration-scrim" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} accessibilityViewIsModal testID="carrier-duration-sheet">
          <DurationWheelPicker
            totalSeconds={seconds ?? 0}
            targetBounds={{ min: 1, max: 180 * 60 }}
            maxTotalSeconds={180 * 60}
            onValidate={(value) => onValidate(value)}
            onCancel={onCancel}
            minutesAccessibilityLabel={wheel.minutesAccessibilityLabel}
            secondsAccessibilityLabel={wheel.secondsAccessibilityLabel}
            cancelAccessibilityLabel={wheel.cancelAccessibilityLabel}
            validateAccessibilityLabel={wheel.validateAccessibilityLabel}
          />
          {allowsNone ? (
            <Pressable onPress={() => onValidate(null)} accessibilityRole="button" style={styles.none} testID="carrier-duration-none">
              <Text style={styles.noneText}>{t.noLimit}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { backgroundColor: SCRIM },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingHorizontal: 16 },
  none: { alignSelf: "center", paddingVertical: 12, paddingHorizontal: 16 },
  noneText: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 15, color: "#0508E5" },
});
