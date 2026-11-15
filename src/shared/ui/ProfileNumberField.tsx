import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";

import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * Durée du Profil saisie au clavier numérique natif — retour de Hermann du 11/11/2026 (cahier, y1) : « Compte à rebours
 * et la fin de séance : utiliser le clavier et non pas le stepper ».
 *
 * - Ligne de 42 (Figma `1992:684`) : libellé à gauche, pastille de valeur « 10″ » à droite (même dessin que la valeur
 *   du stepper fermé, `DSF / Forms / Valeur modifiable`).
 * - Toucher la ligne ou la pastille ouvre le clavier numérique ; la saisie remplace la valeur affichée.
 * - À la fermeture du clavier, la saisie est ramenée dans les bornes du réglage puis enregistrée une seule fois ;
 *   une saisie vide ou inchangée n'enregistre rien. Un échec d'enregistrement restitue la dernière valeur confirmée.
 * [Remplace le stepper (`ProfileStepper`) pour ces deux réglages.]
 */
export function ProfileNumberField({
  label,
  value,
  min,
  max,
  onCommit,
  testID,
}: {
  readonly label: string;
  /** Valeur confirmée, en secondes. */
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onCommit: (value: number) => Promise<boolean>;
  readonly testID: string;
}) {
  const input = useRef<TextInput>(null);
  const [editing, setEditing] = useState<string | null>(null);

  function finish(text: string) {
    setEditing(null);
    const typed = Number.parseInt(text, 10);
    if (Number.isNaN(typed)) return;
    const next = Math.min(max, Math.max(min, typed));
    if (next !== value) void onCommit(next);
  }

  return (
    <Pressable
      onPress={() => input.current?.focus()}
      accessible={false}
      style={styles.row}
      testID={testID}
    >
      <Text style={styles.label} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {label}
      </Text>
      <TextInput
        ref={input}
        value={editing ?? `${value}″`}
        onFocus={() => setEditing("")}
        onChangeText={(text) => setEditing(text.replace(/\D/g, "").slice(0, 3))}
        onBlur={() => finish(editing ?? "")}
        keyboardType="number-pad"
        returnKeyType="done"
        maxLength={3}
        placeholder={`${value}″`}
        placeholderTextColor={colors.textSecondary}
        caretHidden
        contextMenuHidden
        accessibilityLabel={`${label}, ${value} secondes`}
        accessibilityHint={`Entre ${min} et ${max} secondes`}
        style={[styles.value, editing !== null ? styles.valueEditing : null]}
        testID={`${testID}-value`}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
    gap: spacing[8],
  },
  label: {
    ...type.label,
    flexShrink: 1,
    color: colors.textPrimary,
  },
  value: {
    ...type.editableValue,
    color: colors.primary,
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    overflow: "hidden",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
    minWidth: 44,
    textAlign: "center",
  },
  valueEditing: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing[4] - 1,
    paddingHorizontal: spacing[10] - 1,
  },
});
