import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import {
  isGridBasedSetting,
  profileDurationBounds,
  type Profile,
  type ProfileDurationSetting,
} from "@/domain/preferences/Profile";
import type { ProfilePreference } from "@/domain/preferences/ProfileRepository";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import {
  getNotificationPermissionStatus,
  isNotificationPermissionDenied,
  type NotificationPermissionStatus,
} from "@/features/preferences/notificationPermission";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { ProfileStepper } from "@/shared/ui/ProfileStepper";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

const EXERCISE_SETTINGS: readonly ProfileDurationSetting[] = [
  "sideChangeRecoverySecondsDefault",
  "exerciseCountdownSecondsDefault",
  "exerciseEndSecondsDefault",
];

const SESSION_SETTINGS: readonly ProfileDurationSetting[] = [
  "postActivityRecoverySecondsDefault",
  "sessionInitialCountdownSecondsDefault",
  "sessionFinalPhaseSecondsDefault",
];

const PREFERENCE_ROWS: readonly {
  readonly preference: ProfilePreference;
  readonly labelKey: "sounds" | "voiceAnnouncements" | "vibration" | "notifications";
}[] = [
  { preference: "soundsEnabled", labelKey: "sounds" },
  { preference: "voiceAnnouncementsEnabled", labelKey: "voiceAnnouncements" },
  { preference: "vibrationEnabled", labelKey: "vibration" },
  { preference: "notificationsEnabled", labelKey: "notifications" },
];

/**
 * Écran Profil (V2-PRE-2, plan §6.5, CE-UI-07 L2495-2583) : six réglages
 * ajustables par `ProfileStepper` (un seul ouvert à la fois, D-227), quatre
 * préférences locales à bascule indépendante, et l'accès à Modifier le
 * profil. Aucune roulette d'Exercice (`DurationWheelPicker`/
 * `NumberWheelPicker`) n'est rendue ici (CE-UI-07 L2533).
 */
export function ProfileScreen() {
  const router = useRouter();
  const profileService = useProfileService();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>("undetermined");
  const [openStepper, setOpenStepper] = useState<ProfileDurationSetting | null>(null);
  const t = strings.screens.profile;

  const reload = useCallback(() => {
    profileService.getProfile().then(setProfile, (error: unknown) => {
      console.error("Le Profil n'a pas pu être chargé.", error);
    });
    // T7 : lecture d'état seule, jamais une demande de permission.
    getNotificationPermissionStatus().then(setPermissionStatus, (error: unknown) => {
      console.error("L'état de permission Notifications n'a pas pu être lu.", error);
    });
  }, [profileService]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function commitSetting(setting: ProfileDurationSetting, value: number): Promise<boolean> {
    try {
      const next = await profileService.setDefault(setting, value);
      setProfile(next);
      return true;
    } catch (error) {
      console.error("Le réglage n'a pas pu être enregistré.", error);
      return false;
    }
  }

  async function commitPreference(preference: ProfilePreference, value: boolean) {
    if (!profile) {
      return;
    }
    setProfile({ ...profile, [preference]: value });
    try {
      const next = await profileService.setPreference(preference, value);
      setProfile(next);
    } catch (error) {
      console.error("La préférence n'a pas pu être enregistrée.", error);
      setProfile((current) => (current ? { ...current, [preference]: !value } : current));
    }
  }

  function renderDurationRow(setting: ProfileDurationSetting) {
    if (!profile) {
      return null;
    }
    const bounds = profileDurationBounds(setting);
    const { label, unit } = settingStrings(setting);
    return (
      <ProfileStepper
        key={setting}
        label={label}
        unit={unit}
        value={profile[setting]}
        min={bounds.min}
        max={bounds.max}
        gridBased={isGridBasedSetting(setting)}
        isOpen={openStepper === setting}
        onToggle={() =>
          setOpenStepper((current) => (current === setting ? null : setting))
        }
        onCommit={(value) => commitSetting(setting, value)}
        testID={`profile-setting-${setting}`}
      />
    );
  }

  function settingStrings(setting: ProfileDurationSetting): { label: string; unit: string } {
    switch (setting) {
      case "sideChangeRecoverySecondsDefault":
        return t.settings.sideChangeRecovery;
      case "postActivityRecoverySecondsDefault":
        return t.settings.postActivityRecovery;
      case "exerciseCountdownSecondsDefault":
        return t.settings.exerciseCountdown;
      case "exerciseEndSecondsDefault":
        return t.settings.exerciseEnd;
      case "sessionInitialCountdownSecondsDefault":
        return t.settings.sessionInitialCountdown;
      case "sessionFinalPhaseSecondsDefault":
        return t.settings.sessionFinalPhase;
    }
  }

  return (
    <ScreenShell>
      <FixedHeader title={t.title} />
      <HeaderSeparator />
      {profile ? (
        <View style={styles.body} testID="profile-screen-body">
          <View style={styles.group} testID="profile-group-exercise">
            <Text style={styles.groupTitle}>{t.groups.exercise}</Text>
            {EXERCISE_SETTINGS.map(renderDurationRow)}
          </View>
          <View style={styles.group} testID="profile-group-session">
            <Text style={styles.groupTitle}>{t.groups.session}</Text>
            {SESSION_SETTINGS.map(renderDurationRow)}
          </View>
          <View style={styles.group} testID="profile-group-preferences">
            <Text style={styles.groupTitle}>{t.groups.preferences}</Text>
            {PREFERENCE_ROWS.map(({ preference, labelKey }) => {
              const label = t.preferencesSwitches[labelKey];
              const rawValue = profile[preference];
              // T7 : un état de permission refusé n'affiche jamais Notifications actif.
              const displayedValue =
                preference === "notificationsEnabled"
                  ? rawValue && !isNotificationPermissionDenied(permissionStatus)
                  : rawValue;
              return (
                <View key={preference} style={styles.switchRow} testID={`profile-preference-${preference}`}>
                  <Text style={styles.label}>{label}</Text>
                  <Switch
                    value={displayedValue}
                    onValueChange={(next) => commitPreference(preference, next)}
                    accessibilityLabel={`${label}, ${displayedValue ? "activé" : "désactivé"}`}
                    testID={`profile-preference-${preference}-switch`}
                  />
                </View>
              );
            })}
          </View>
          <Pressable
            onPress={() => router.push("/profile-edit")}
            accessibilityRole="button"
            accessibilityLabel={t.editProfileAction}
            style={styles.editProfileAction}
            testID="profile-edit-action"
          >
            <Text style={styles.editProfileActionLabel}>{t.editProfileAction}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    gap: spacing[16],
  },
  // CE-UI-07 L2533 : fond #FCFCFE, liseré blanc de 1, rayon 12, ombre non
  // rognée — valeurs du chapitre 13 propres aux GROUPES du Profil (jamais
  // le bord 0,5/rayon 8 de DSF-CARTES L30, qui ne concerne que les cartes).
  group: {
    backgroundColor: "#FCFCFE",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 12,
    padding: spacing[16],
    gap: spacing[4],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  groupTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing[8],
  },
  label: {
    ...type.body,
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: minTouchTarget,
  },
  editProfileAction: {
    alignSelf: "center",
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[24],
  },
  editProfileActionLabel: {
    ...type.button,
    color: colors.primary,
  },
});
