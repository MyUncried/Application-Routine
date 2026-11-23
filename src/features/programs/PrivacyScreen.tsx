import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { PROFILE_UNIFORM_PALETTE, profileTabs } from "@/features/preferences/profileTabs";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { TabbedScreen } from "@/shared/ui/TabbedScreen";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

import { formatDayMonthYear, usedByLine } from "./programPresentation";
import type { PainTrackingState } from "./ProgramService";
import { useProgramService } from "./ProgramServiceContext";
import { programStrings } from "./programStrings";

/**
 * Profil › Confidentialité (CE-PRF-01 ; D-551, D-552 ; Figma « Profil — Confidentialité » `12839:4036`).
 *
 * - Suivi de la douleur, état déduit des programmes : sans accord, « Non utilisé », sans réglage ; avec accord, « Accordé le
 *   … », « Utilisé par N programme(s) · noms », « Retirer mon accord » (bleu : efface l'accord et désactive le suivi dans tous
 *   les programmes), « Effacer mes relevés » (rouge, confirmation ; grisé tant qu'aucun relevé n'existe — Hermann,
 *   21/11/2026, point 4), mention.
 * - Partage communautaire : section affichée grisée et inactive, mention « Disponible avec la gestion des comptes » ; valeurs
 *   du Figma (mission PROG-CAT-01 §5).
 */
const t = programStrings.privacy;
/** Figma `12839:4036` : rangées sur fond blanc, cartes #F9FAFC au liseré blanc, rayon 12. */
const DISABLED_OPACITY = 0.45;

export function PrivacyScreen() {
  const router = useRouter();
  const programs = useProgramService();
  const [state, setState] = useState<PainTrackingState | null>(null);
  const [readings, setReadings] = useState(0);
  const [confirmErase, setConfirmErase] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    programs.painTrackingState().then(setState, () => setFailed(true));
    programs.painReadingCount().then(setReadings, () => undefined);
  }, [programs]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /**
   * Contre-recette du 23/11/2026 (constat b, Hermann) : « Retirer mon accord » demande confirmation en nommant les programmes
   * qui activent le suivi. Aucun programme concerné : le message n'aurait rien à nommer ; l'accord est retiré directement,
   * comme avant [question posée à Hermann].
   */
  const askWithdraw = () => {
    if (state?.kind === "GRANTED" && state.programs.length > 0) setConfirmWithdraw(true);
    else withdraw();
  };
  const withdraw = () => {
    setConfirmWithdraw(false);
    setFailed(false);
    programs.withdrawPainConsent().then(load, () => {
      setFailed(true);
      load();
    });
  };
  const erase = () => {
    setConfirmErase(false);
    programs.erasePainReadings().then(load, () => setFailed(true));
  };

  return (
    <TabbedScreen title={t.tab} palette={PROFILE_UNIFORM_PALETTE} tabs={profileTabs("privacy", router)}>
      <ScrollView
        style={styles.body}
        contentContainerStyle={[styles.content, { paddingBottom: navigationBarTotalHeight() + spacing[16] }]}
        showsVerticalScrollIndicator={false}
        testID="privacy-body"
      >
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t.painTitle}
        </Text>
        {state === null ? null : state.kind === "NONE" ? (
          <View style={styles.card} testID="privacy-pain-none">
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t.painUnused}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card} testID="privacy-pain-granted">
            <View style={[styles.row, styles.twoLines]}>
              <Text style={styles.rowLabel} testID="privacy-pain-granted-on">
                {t.grantedOn.replace("{date}", formatDayMonthYear(state.grantedAt.slice(0, 10)))}
              </Text>
              <Text style={styles.rowHint} testID="privacy-pain-used-by">
                {usedByLine(state.programs)}
              </Text>
            </View>
            <View style={styles.separator} />
            <Pressable onPress={askWithdraw} accessibilityRole="button" style={styles.row} testID="privacy-withdraw">
              <Text style={[styles.rowLabel, styles.blue]}>{t.withdraw}</Text>
            </Pressable>
            <View style={styles.separator} />
            <Pressable
              onPress={() => setConfirmErase(true)}
              disabled={readings === 0}
              accessibilityRole="button"
              accessibilityState={{ disabled: readings === 0 }}
              style={[styles.row, readings === 0 ? styles.disabled : null]}
              testID="privacy-erase"
            >
              <Text style={[styles.rowLabel, styles.red]}>{t.erase}</Text>
            </Pressable>
          </View>
        )}
        {failed ? <Text style={styles.error}>{t.withdrawFailed}</Text> : null}
        <Text style={styles.note}>{t.painNote}</Text>

        {/* Partage communautaire : grisé et inactif tant que la gestion des comptes n'existe pas (mission §5). */}
        <Text style={[styles.sectionTitle, styles.secondSection]} accessibilityRole="header">
          {t.communityTitle}
        </Text>
        <View style={[styles.card, styles.disabled]} accessibilityState={{ disabled: true }} testID="privacy-community">
          <View style={[styles.row, styles.twoLines, styles.switchRow]}>
            <View style={styles.flex}>
              <Text style={styles.rowLabel}>{t.visibleExecutions}</Text>
              <Text style={styles.rowHint}>{t.visibleExecutionsHint}</Text>
            </View>
            <Switch value disabled accessibilityLabel={t.visibleExecutions} testID="privacy-community-switch" />
          </View>
          {[
            [t.pseudo, t.pseudoValue],
            [t.displayName, t.displayNameValue],
            [t.profile, t.profileValue],
            [t.painReadings, t.painReadingsValue],
          ].map(([label, value]) => (
            <View key={label}>
              <View style={styles.separator} />
              <View style={[styles.row, styles.valueRow]}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{value}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.unavailable} testID="privacy-community-unavailable">
          {t.unavailable}
        </Text>
        <Text style={[styles.note, styles.disabled]}>{t.communityNote}</Text>
      </ScrollView>
      {confirmErase ? (
        // Mission PROG-CAT-01 §5 : « Effacer mes relevés » demande une confirmation (développée pour la future saisie, Hermann,
        // 21/11/2026, point 4). « Retirer mon accord » : confirmation propre ci-dessous (contre-recette du 23/11/2026, constat b).
        <DecisionDialog
          title={t.eraseConfirmTitle}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={t.eraseConfirmMessage}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={t.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={t.eraseConfirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setConfirmErase(false)}
          onConfirm={erase}
          testIDPrefix="privacy-erase-confirm"
        />
      ) : null}
      {confirmWithdraw && state?.kind === "GRANTED" ? (
        // Contre-recette du 23/11/2026 (constat b) : même dialogue partagé, mêmes styles que « Effacer mes relevés ».
        <DecisionDialog
          title={t.withdrawConfirmTitle}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={t.withdrawConfirmMessage.replace("{names}", state.programs.map((program) => program.name).join(", "))}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={t.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={t.withdrawConfirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setConfirmWithdraw(false)}
          onConfirm={withdraw}
          testIDPrefix="privacy-withdraw-confirm"
        />
      ) : null}
    </TabbedScreen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: { paddingHorizontal: layout.screenGutter, paddingTop: spacing[16] },
  // Figma : titres Inter Semi Bold 16 #141414 ; carte 32 sous le titre (titre compris).
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16, color: colors.textPrimary, marginBottom: spacing[12] },
  secondSection: { marginTop: spacing[24] },
  card: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#1A1A26",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  row: { minHeight: 42, justifyContent: "center", paddingHorizontal: spacing[12] },
  twoLines: { backgroundColor: colors.background, paddingVertical: 5 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: spacing[12] },
  valueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[12] },
  flex: { flex: 1 },
  rowLabel: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 14, color: colors.textPrimary },
  rowHint: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  rowValue: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 14, color: colors.textSecondary, flexShrink: 1, textAlign: "right" },
  blue: { color: colors.primary },
  red: { color: colors.danger },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[12] },
  note: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 12, color: colors.textSecondary, marginTop: spacing[8], paddingHorizontal: spacing[12] },
  unavailable: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, color: colors.textSecondary, marginTop: spacing[8], paddingHorizontal: spacing[12] },
  disabled: { opacity: DISABLED_OPACITY },
  error: { ...type.supporting, color: colors.danger, marginTop: spacing[8] },
});
