import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Fragment, useCallback, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import {
  isGridBasedSetting,
  profileDurationBounds,
  type Profile,
  type ProfileDurationSetting,
} from "@/domain/preferences/Profile";
import type { ProfilePreference } from "@/domain/preferences/ProfileRepository";
import { computeInitials } from "@/features/preferences/ProfileEditScreen";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import {
  getNotificationPermissionStatus,
  isNotificationPermissionDenied,
  type NotificationPermissionStatus,
} from "@/features/preferences/notificationPermission";
import { profilePhotoFileExists } from "@/features/preferences/profilePhoto";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
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

  const hasPhoto = profile !== null && profilePhotoFileExists(profile.photoUri);

  return (
    <ScreenShell>
      <FixedHeader title={t.title} />
      <HeaderSeparator />
      {profile ? (
        <ScrollView
          style={styles.body}
          // CE-UI-07 L2536 (R1) : la zone centrale défile au-dessus de la
          // navigation basse fixe, marge finale = hauteur de la navigation + 16
          // — même formule que `CatalogueScreen` (`navigationBarTotalHeight()`).
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: navigationBarTotalHeight() + spacing[16] },
          ]}
          showsVerticalScrollIndicator={false}
          testID="profile-screen-body"
        >
          {/* R1 (CE-UI-07 L2522) : bloc Identité en tête — photo ou
           * initiales, nom d'affichage, action Modifier le profil. Mêmes
           * aides que `ProfileEditScreen` (photo/initiales), aucune
           * duplication de logique. La photo/les initiales et le nom
           * forment un groupe informatif unique (`accessible`, libellé =
           * le nom ou son repli) ; l'action Modifier reste un bouton
           * distinct, pour ne jamais fusionner une information et une
           * action sous un même libellé accessible. */}
          <View style={styles.identityRow} testID="profile-identity-row">
            <View
              style={styles.identityInfo}
              accessible
              accessibilityLabel={profile.displayName ?? t.identity.unsetDisplayNameAccessibilityLabel}
              testID="profile-identity-info"
            >
              <View style={styles.identityAvatar} testID="profile-identity-avatar">
                {hasPhoto ? (
                  <Image
                    source={{ uri: profile.photoUri! }}
                    style={styles.identityAvatarImage}
                    testID="profile-identity-avatar-image"
                  />
                ) : (
                  <Text style={styles.identityAvatarInitials} testID="profile-identity-avatar-initials">
                    {computeInitials(profile.displayName ?? "")}
                  </Text>
                )}
              </View>
              <Text style={styles.identityName} testID="profile-identity-name">
                {profile.displayName ?? t.identity.unsetDisplayNameAccessibilityLabel}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/profile-edit")}
              accessibilityRole="button"
              accessibilityLabel={t.editProfileAction}
              style={styles.identityEditAction}
              testID="profile-identity-edit-action"
            >
              <Text style={styles.identityEditLabel}>{t.editProfileAction}</Text>
            </Pressable>
          </View>

          <View style={styles.group} testID="profile-group-exercise">
            <Text style={styles.groupTitle}>{t.groups.exercise}</Text>
            {withSeparators("profile-group-exercise", EXERCISE_SETTINGS.map(renderDurationRow))}
          </View>
          <View style={styles.group} testID="profile-group-session">
            <Text style={styles.groupTitle}>{t.groups.session}</Text>
            {withSeparators("profile-group-session", SESSION_SETTINGS.map(renderDurationRow))}
          </View>
          <View style={styles.group} testID="profile-group-preferences">
            <Text style={styles.groupTitle}>{t.groups.preferences}</Text>
            {withSeparators(
              "profile-group-preferences",
              PREFERENCE_ROWS.map(({ preference, labelKey }) => {
                const label = t.preferencesSwitches[labelKey];
                const rawValue = profile[preference];
                // T7 : un état de permission refusé n'affiche jamais Notifications actif.
                const displayedValue =
                  preference === "notificationsEnabled"
                    ? rawValue && !isNotificationPermissionDenied(permissionStatus)
                    : rawValue;
                return (
                  // R10 : la ligne forme un SEUL élément accessible de rôle
                  // interrupteur (nom + état) — le libellé et le `Switch`
                  // natif internes sont retirés de l'arbre d'accessibilité
                  // (`importantForAccessibility`/`accessibilityElementsHidden`),
                  // jamais deux nœuds superposés.
                  <Pressable
                    key={preference}
                    onPress={() => commitPreference(preference, !displayedValue)}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: displayedValue }}
                    accessibilityLabel={label}
                    style={styles.switchRow}
                    testID={`profile-preference-${preference}`}
                  >
                    <Text
                      style={styles.label}
                      importantForAccessibility="no-hide-descendants"
                      accessibilityElementsHidden
                    >
                      {label}
                    </Text>
                    <Switch
                      value={displayedValue}
                      onValueChange={(next) => commitPreference(preference, next)}
                      importantForAccessibility="no-hide-descendants"
                      accessibilityElementsHidden
                      testID={`profile-preference-${preference}-switch`}
                    />
                  </Pressable>
                );
              }),
            )}
          </View>
        </ScrollView>
      ) : null}
    </ScreenShell>
  );
}

/**
 * D-267 (CE-UI-07 L2532) : un séparateur `colors.divider` entre deux lignes
 * CONSÉCUTIVES d'un même groupe — jamais avant la première ni après la
 * dernière.
 */
function withSeparators(groupTestID: string, rows: readonly ReactNode[]): ReactNode {
  return rows.map((row, index) => (
    <Fragment key={index}>
      {index > 0 ? (
        <View style={styles.divider} testID={`${groupTestID}-divider-${index}`} />
      ) : null}
      {row}
    </Fragment>
  ));
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    gap: spacing[16],
  },
  // R1 (CE-UI-07 L2522) : bloc Identité en tête — photo/initiales, nom,
  // action Modifier le profil ; mêmes gabarits que `ProfileEditScreen`
  // (avatar circulaire, initiales de repli).
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
    minHeight: minTouchTarget,
  },
  identityInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
  },
  identityAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  identityAvatarImage: {
    width: 56,
    height: 56,
  },
  identityAvatarInitials: {
    ...type.label,
    color: colors.textSecondary,
  },
  identityName: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
  },
  identityEditAction: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  identityEditLabel: {
    ...type.button,
    color: colors.primary,
  },
  // CE-UI-07 L2533 : fond #FCFCFE, liseré blanc de 1, rayon 12, ombre non
  // rognée — valeurs du chapitre 13 propres aux GROUPES du Profil (jamais
  // le bord 0,5/rayon 8 de DSF-CARTES L30, qui ne concerne que les cartes).
  // Alignement DSF 07/10 (annexe F) : `#FCFCFE` est ramené au token
  // canonique le plus proche, `surfaceSubtle` (`#F9FAFC`).
  group: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: 12,
    padding: spacing[16],
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
  // D-267 (CE-UI-07 L2532) : séparateur entre deux lignes consécutives d'un
  // même groupe — jamais avant la première ni après la dernière.
  divider: {
    height: 1,
    backgroundColor: colors.divider,
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
    paddingVertical: spacing[8],
  },
});
