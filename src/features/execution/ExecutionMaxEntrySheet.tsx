import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { ModalCancelAction, ModalValidateAction } from "@/shared/ui/ModalHeaderActions";
import { colors, spacing, type } from "@/shared/ui/tokens";

import { executionStrings as t } from "./executionStrings";

/**
 * D-531 / RM-272 (Hermann, 19/11/2026) — AMRAP à un seul mouvement en Max : « à chaque échec, Suivant puis saisie de la série au clavier
 * numérique ; les séries s'additionnent ». Feuille de saisie de la série close, pendant que le chronomètre du bloc continue : en-tête de
 * modale standard (croix, titre, coche — règle du 05/11/2026), nom de l'exercice et numéro de série, champ numérique natif (clavier
 * numérique d'iOS, `keyboardType="number-pad"`). La croix referme sans valeur : la série est redemandée à la fin du bloc.
 *
 * Écart signalé : les autres saisies de l'écran d'exécution (Arrêt, Fin du bloc) utilisent la demi-roulette ; ici, le clavier numérique
 * demandé par Hermann.
 */
export function ExecutionMaxEntrySheet({
  exerciseName,
  series,
  onConfirm,
  onCancel,
  testID = "execution-max-entry",
}: {
  readonly exerciseName: string | null;
  readonly series: number | null;
  readonly onConfirm: (repetitions: number) => void;
  readonly onCancel: () => void;
  readonly testID?: string;
}) {
  const [text, setText] = useState("");
  const value = /^\d{1,3}$/.test(text) ? Number(text) : null;
  const confirm = () => {
    if (value !== null) onConfirm(value);
  };
  return (
    <View style={styles.layer} testID={testID}>
      <View style={styles.veil} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.avoider}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <ModalCancelAction onPress={onCancel} accessibilityLabel={t.close} testID={`${testID}-cancel`} />
            <Text style={styles.title} accessibilityRole="header" testID={`${testID}-title`}>
              {t.amrapMaxEntryTitle}
            </Text>
            <ModalValidateAction onPress={confirm} enabled={value !== null} accessibilityLabel={t.validate} testID={`${testID}-validate`} />
          </View>
          <View style={styles.headerDivider} />
          <Text style={styles.name} numberOfLines={1} testID={`${testID}-name`}>
            {series === null ? (exerciseName ?? "") : `${exerciseName ?? ""} · ${t.amrapMaxEntryLabel(series)}`}
          </Text>
          <View style={styles.row}>
            <TextInput
              value={text}
              onChangeText={(next) => setText(next.replace(/\D/g, "").slice(0, 3))}
              keyboardType="number-pad"
              autoFocus
              maxLength={3}
              placeholder="0"
              returnKeyType="done"
              onSubmitEditing={confirm}
              style={styles.input}
              accessibilityLabel={t.amrapMaxEntryTitle}
              testID={`${testID}-input`}
            />
            <Text style={styles.unit}>{t.repetitionsUnit}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const TEXT_SIZE = 18;

const styles = StyleSheet.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  veil: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlayScrim },
  avoider: { flex: 1, justifyContent: "flex-end" },
  sheet: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "#FFFFFF", borderRadius: 40, paddingBottom: 24, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56, paddingHorizontal: spacing[12] + 5 },
  title: { ...type.modalTitle, color: colors.textPrimary, flexShrink: 1, textAlign: "center" },
  headerDivider: { height: 1, marginHorizontal: spacing[12], backgroundColor: colors.divider },
  name: { marginTop: 17, marginHorizontal: 16, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: TEXT_SIZE, color: colors.textPrimary, textAlign: "center" },
  row: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  input: {
    minWidth: 96,
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#F0F0F7",
    textAlign: "center",
    fontFamily: "RobotoCondensed_700Bold",
    fontWeight: "700",
    fontSize: 28,
    color: colors.textPrimary,
  },
  unit: { marginLeft: 8, fontFamily: "Inter_400Regular", fontSize: TEXT_SIZE, color: "#7A7A80" },
});
