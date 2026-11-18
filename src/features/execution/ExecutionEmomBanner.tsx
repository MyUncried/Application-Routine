import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ModalValidateAction } from "@/shared/ui/ModalHeaderActions";
import { EXECUTION_UNIT_HOLD_POLICY, InlineStepper } from "@/shared/ui/ProfileStepper";
import { colors, spacing, type } from "@/shared/ui/tokens";

import { executionStrings as t } from "./executionStrings";

/**
 * PRE-11 (T2) — bandeau non bloquant d'une fenêtre EMOM non terminée (décision Q1 de Hermann du 02/11/2026, conception consolidée
 * §2 bis : « Au début de la fenêtre suivante, bandeau non bloquant « Fenêtre k non terminée — répétitions faites : [valeur
 * préremplie] · Passer », qui disparaît seul ; le chronomètre ne s'arrête jamais. Ce qui n'est pas saisi est redemandé à la
 * Clôture de l'EMOM »).
 *
 * Valeur proposée 0 (RM-PRE5-02 : « Valeur initiale proposée 0 […] Zéro proposé n'est pas une mesure avant validation »), réglée par
 * le stepper standard ; la coche enregistre la valeur, « Passer » ferme le bandeau sans rien enregistrer. Le bandeau disparaît seul à
 * la fin de la fenêtre qui suit. Interprétation (À CLARIFIER) : la coche, absente de la phrase de Q1, rend la saisie explicite.
 */
export function ExecutionEmomBanner({
  window,
  onDeclare,
  onSkip,
}: {
  readonly window: number;
  readonly onDeclare: (repetitions: number) => void;
  readonly onSkip: () => void;
}) {
  const [value, setValue] = useState(0);
  return (
    <View style={styles.banner} accessibilityLiveRegion="polite" testID="execution-emom-banner">
      <Text style={styles.text} numberOfLines={2} testID="execution-emom-banner-text">
        {t.emomBanner(window)}
      </Text>
      <View style={styles.row}>
        <InlineStepper
          value={value}
          min={0}
          max={999}
          policy={EXECUTION_UNIT_HOLD_POLICY}
          formatValue={(current) => `${current ?? 0}`}
          onChange={setValue}
          accessibilityLabel={t.emomBannerValue}
          testID="execution-emom-banner-value"
        />
        <ModalValidateAction onPress={() => onDeclare(value)} enabled accessibilityLabel={t.validate} testID="execution-emom-banner-validate" />
        <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={12} testID="execution-emom-banner-skip">
          <Text style={styles.skip}>{t.emomSkip}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing[16],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "#FFD194",
    gap: spacing[8],
  },
  text: { ...type.body, color: colors.textPrimary },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[12] },
  skip: { ...type.body, color: colors.primary },
});
