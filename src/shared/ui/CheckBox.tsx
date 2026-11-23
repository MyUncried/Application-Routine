import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/shared/ui/tokens";

/**
 * `DSF / Controls / Case à cocher` (`5544:4750` ; états « Cochée » `5544:4745`, « Non cochée » `5544:4748`) : case de 20,
 * rayon 6 ; cochée : fond primaire, « ✓ » blanc (Inter 14 semi-gras) ; non cochée : fond blanc, bord 1,5 #C8C8D0.
 * Visuel seul : la zone tactile et l'accessibilité appartiennent à la ligne qui la porte. Première utilisation : filtre par
 * routine de l'Agenda (D-539, 20/11/2026).
 */
export function CheckBox({ checked, testID }: { readonly checked: boolean; readonly testID: string }) {
  return (
    <View style={[styles.box, checked ? styles.checked : styles.unchecked]} testID={`${testID}-${checked ? "checked" : "unchecked"}`}>
      {checked ? (
        <Text style={styles.mark} allowFontScaling={false}>
          ✓
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  checked: { backgroundColor: colors.primary },
  unchecked: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: "#C8C8D0" },
  mark: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: colors.background },
});
