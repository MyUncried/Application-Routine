import { Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";

import { painColor, painDigitColor } from "./beforeSession";

/**
 * Échelle de douleur 0–10 (D-427 ; DSF Avant la séance § 4 ; D-578 / D-580 pour la fin de séance) : onze cases 30 × 44 colorées du
 * vert au rouge, sans légende, sans présélection (`value` nul : aucune case choisie, jamais 0 par défaut). Case choisie 40 × 58,
 * chiffre 22, ombre portée noire 45 %, sans liseré. `outlined` (séance arrêtée, D-580) : contour blanc fin 0,75 pt sur les cases.
 * Accessibilité : groupe radio nommé, chaque case annoncée (« Douleur 3 sur 10 », sélectionnée) ; le chiffre est toujours écrit.
 */
const PAIN_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function PainScale({
  value,
  onChange,
  label,
  outlined = false,
  testID,
}: {
  readonly value: number | null;
  readonly onChange: (value: number) => void;
  /** Nom accessible du groupe (libellé de la rubrique). */
  readonly label: string;
  readonly outlined?: boolean;
  readonly testID: string;
}) {
  return (
    <View style={styles.scale} accessibilityRole="radiogroup" accessibilityLabel={label} testID={testID}>
      {PAIN_VALUES.map((cell) => {
        const selected = value === cell;
        return (
          <Pressable
            key={cell}
            onPress={() => onChange(cell)}
            accessibilityRole="radio"
            accessibilityLabel={strings.execution.beforeSession.painValue(cell)}
            accessibilityState={{ selected, checked: selected }}
            style={[styles.cell, { backgroundColor: painColor(cell) }, outlined ? styles.outlined : null, selected ? styles.cellSelected : null]}
            testID={`${testID.replace(/-scale$/, "")}-${cell}`}
          >
            <Text style={[styles.digit, { color: painDigitColor(cell) }, selected ? styles.digitSelected : null]} allowFontScaling={false}>
              {cell}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scale: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 44 },
  cell: { width: 30, height: 44, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  outlined: { borderWidth: 0.75, borderColor: "#FFFFFF" },
  cellSelected: { width: 40, height: 58, marginHorizontal: -5, borderRadius: 8, borderWidth: 0, boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.45)", zIndex: 1 },
  digit: { fontSize: 14, fontWeight: "700" },
  digitSelected: { fontSize: 22 },
});
