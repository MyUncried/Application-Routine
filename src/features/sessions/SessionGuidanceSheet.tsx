import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import type { Profile } from "@/domain/preferences/Profile";
import { effectiveSetting, normalizedGuidance, PROFILE_GUIDANCE, type SessionGuidance } from "@/domain/sessions/sessionGuidance";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { strings } from "@/shared/i18n";
import { ModalHeader } from "@/shared/ui/ModalHeaderActions";
import { colors, minTouchTarget, spacing, switchOffColors, type } from "@/shared/ui/tokens";

type Setting = keyof SessionGuidance;

const ROWS: readonly { readonly setting: Setting; readonly label: () => string; readonly profile: (profile: Profile) => boolean }[] = [
  { setting: "soundsEnabled", label: () => strings.screens.composition.guidance.sounds, profile: (profile) => profile.soundsEnabled },
  {
    setting: "voiceEnabled",
    label: () => strings.screens.composition.guidance.voice,
    // Interrupteur Voix de l'Exécution : actif au démarrage si au moins une catégorie est annoncée (Profil).
    profile: (profile) =>
      profile.voiceAnnouncementsEnabled ||
      profile.announceObjectiveEnabled ||
      profile.announcePausesEnabled ||
      profile.announceSessionEnabled ||
      profile.announceSidesEnabled ||
      profile.announcePhasesEnabled,
  },
  { setting: "announceObjective", label: () => strings.screens.composition.guidance.objective, profile: (profile) => profile.announceObjectiveEnabled },
];

/**
 * Fin de PRE-10 — feuille « Guidage de la séance » (spec `spec-guidage-reglages` §3.2 ; Hermann, 10/11/2026 : « Élément
 * Guidage (Recommandé) », écran proposé par Claude sans maquette Figma). Trois bascules (Sons, Annonces vocales, Annoncer
 * les répétitions ou la durée) ; chacune affiche la valeur effective (Séance, sinon Profil) et son origine. « Revenir au
 * Profil » efface les réglages propres. ✓ applique au brouillon de la Composition (enregistré avec la Séance) ; ✕ ferme
 * sans rien changer.
 */
export function SessionGuidanceSheet({
  initial,
  onApply,
  onClose,
  onMeasure,
}: {
  readonly initial: SessionGuidance | undefined;
  readonly onApply: (guidance: SessionGuidance | undefined) => void;
  readonly onClose: () => void;
  readonly onMeasure?: (height: number) => void;
}) {
  const t = strings.screens.composition.guidance;
  const profileService = useProfileService();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guidance, setGuidance] = useState<SessionGuidance>(initial ?? PROFILE_GUIDANCE);

  useEffect(() => {
    let cancelled = false;
    profileService
      .getProfile()
      .then((loaded) => {
        if (!cancelled) setProfile(loaded);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [profileService]);

  const set = (setting: Setting, value: boolean) => setGuidance((current) => ({ ...current, [setting]: value }));
  const own = normalizedGuidance(guidance) !== undefined;

  return (
    <View style={styles.root} onLayout={(event) => onMeasure?.(event.nativeEvent.layout.height)} testID="session-guidance-sheet">
      <ModalHeader
        title={t.sheetTitle}
        onCancel={onClose}
        cancelLabel={t.cancel}
        onValidate={() => onApply(normalizedGuidance(guidance))}
        validateEnabled
        validateLabel={t.validate}
        testIDPrefix="session-guidance"
      />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.intro}>{t.intro}</Text>
        {ROWS.map(({ setting, label, profile: profileValue }) => {
          const value = effectiveSetting(guidance[setting], profile === null ? true : profileValue(profile));
          const origin = guidance[setting] === null ? t.rowFollowsProfile : t.rowOwn;
          return (
            <Pressable
              key={setting}
              onPress={() => set(setting, !value)}
              accessibilityRole="switch"
              accessibilityState={{ checked: value }}
              accessibilityLabel={label()}
              accessibilityHint={origin}
              style={styles.row}
              testID={`session-guidance-${setting}`}
            >
              <View style={styles.rowText} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <Text style={styles.label}>{label()}</Text>
                <Text style={[styles.origin, guidance[setting] === null ? null : styles.originOwn]} testID={`session-guidance-${setting}-origin`}>
                  {origin}
                </Text>
              </View>
              <Switch
                {...switchOffColors}
                value={value}
                onValueChange={(next) => set(setting, next)}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
                testID={`session-guidance-${setting}-switch`}
              />
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setGuidance(PROFILE_GUIDANCE)}
          disabled={!own}
          accessibilityRole="button"
          accessibilityState={{ disabled: !own }}
          style={styles.reset}
          testID="session-guidance-reset"
        >
          <Text style={[styles.resetText, own ? null : styles.resetTextDisabled]}>{t.resetToProfile}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: spacing[16], paddingBottom: spacing[24], gap: spacing[4] },
  intro: { ...type.body, color: colors.textSecondary, paddingVertical: spacing[8] },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: minTouchTarget, paddingVertical: spacing[8], gap: spacing[12] },
  rowText: { flex: 1, gap: 2 },
  label: { ...type.body, color: colors.textPrimary },
  origin: { ...type.caption, color: colors.textSecondary },
  originOwn: { color: colors.primary },
  reset: { alignSelf: "flex-start", minHeight: minTouchTarget, justifyContent: "center", marginTop: spacing[8] },
  resetText: { ...type.label, color: colors.primary },
  resetTextDisabled: { color: colors.textSecondary },
});
