import { useFocusEffect, useRouter } from "expo-router";
import { Fragment, useCallback, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import type { GuidanceEvent, VoiceAnnouncement } from "@/domain/preferences/guidanceSettings";
import { profileDurationBounds, profileGuidance, type Profile, type ProfileDurationSetting } from "@/domain/preferences/Profile";
import type { ProfilePreference } from "@/domain/preferences/ProfileRepository";
import { GuidanceSection, GuidanceSettingsForm, GuidanceSwitchRow } from "@/features/preferences/GuidanceSettingsForm";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import {
  getNotificationPermissionStatus,
  isNotificationPermissionDenied,
  type NotificationPermissionStatus,
} from "@/features/preferences/notificationPermission";
import { CatalogueNavigation } from "@/features/sessions/CatalogueNavigation";
import { strings } from "@/shared/i18n";
import { catalogueColors } from "@/shared/ui/catalogueContext";
import { navigationBarTotalHeight } from "@/shared/ui/navigationLayout";
import { ProfileNumberField } from "@/shared/ui/ProfileNumberField";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { layout, spacing } from "@/shared/ui/tokens";

/**
 * Profil › Préférences — Figma `1992:684` et `12093:25010` (deux positions de défilement), documentation publiée sur
 * main `ebe72f76` (CE-UI-07) ; demande de Hermann du 11/11/2026 (cahier, constat d) et précisions : « ne développe pas
 * l'écran Profil (navigation) - Profil (section), mais uniquement les écrans Profil (navigation) - Préférences » ; « tu
 * n'as pas utilisé la référence Figma pour le layout / La charte graphique, ni le contenu des préférences ou je vois
 * encore des anciennes entrées ».
 *
 * - Fond `#F7F7FF` ; en-tête : onglets Profil / Préférences / Communauté (même composant que les Catalogues, onglet
 *   sélectionné `#EAEAFF`), bande d'onglets de 14 fondue vers le fond.
 * - Contenu, dans l'ordre du Figma : Notifications, Séance (Compte à rebours de la séance, Fin de séance), Annonces
 *   vocales, Sons et vibrations. Sections espacées de 20, titre à 13 de son groupe.
 * - Onglet Profil : ouvre l'écran existant « Modifier le profil » (section Profil non développée). Onglet Communauté :
 *   hors MVP, indisponible.
 * [Remplacé le 11/11/2026 — bloc Identité en tête, groupes Exercice (Pause entre les côtés, Compte à rebours d'un
 * exercice, Fin d'exercice), Récupération après exercice, Guidage et Préférences (Sons, Vibration) : retirés de l'écran
 * (« anciennes entrées »). Les valeurs déjà enregistrées restent utilisées pour les nouveaux exercices.]
 * Retour de Hermann du 11/11/2026, 13 h 29 (cahier, y1) : « Supprimer le titre de section "Diagnostic des sons..." / Eloigner plus à gauche la colonne "Son", centrer le titre de la colonne / Compte à rebours et la fin de séance : utiliser le clavier et non pas le stepper / Remplacer "Toutes les X minutes" par "Toutes les minutes" (dans la modale et les préférences) »
 * - Compte à rebours de la séance et Fin de séance : saisie au clavier numérique (`ProfileNumberField`).
 *   [Stepper ouvert en place, un seul à la fois (D-227) — remplacé le 11/11/2026.]
 * - [Lien « Diagnostic des sons (développement) » en bas de l'écran — retiré le 11/11/2026.]
 */
const SESSION_SETTINGS: readonly ProfileDurationSetting[] = ["sessionInitialCountdownSecondsDefault", "sessionFinalPhaseSecondsDefault"];

/** Les six annonces vocales reprennent les bascules déjà enregistrées du Profil. */
const ANNOUNCEMENT_PREFERENCES: Readonly<Record<VoiceAnnouncement, ProfilePreference>> = {
  session: "announceSessionEnabled",
  names: "voiceAnnouncementsEnabled",
  phases: "announcePhasesEnabled",
  objective: "announceObjectiveEnabled",
  pauses: "announcePausesEnabled",
  sides: "announceSidesEnabled",
};

type ProfileTab = "profile" | "preferences" | "community";

/** Figma « Bande — Onglets » : 14 de haut, `#EAEAFF` sur 80 % puis fondu vers `#F7F7FF`. */
const TAB_BAND = { height: 14, solid: 11 } as const;
const TAB_BAND_FADE = [0.25, 0.5, 0.75] as const;

export function ProfileScreen() {
  const router = useRouter();
  const profileService = useProfileService();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>("undetermined");
  const t = strings.screens.profile;
  const palette = catalogueColors("sessions");

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
      setProfile(await profileService.setDefault(setting, value));
      return true;
    } catch (error) {
      console.error("Le réglage n'a pas pu être enregistré.", error);
      return false;
    }
  }

  async function commitPreference(preference: ProfilePreference, value: boolean) {
    if (!profile) return;
    setProfile({ ...profile, [preference]: value });
    try {
      setProfile(await profileService.setPreference(preference, value));
    } catch (error) {
      console.error("La préférence n'a pas pu être enregistrée.", error);
      setProfile((current) => (current ? { ...current, [preference]: !value } : current));
    }
  }

  async function commitVibration(event: GuidanceEvent, vibration: boolean) {
    if (!profile) return;
    const setting = { ...profile.guidanceEvents[event], vibration };
    setProfile({ ...profile, guidanceEvents: { ...profile.guidanceEvents, [event]: setting } });
    try {
      setProfile(await profileService.setGuidanceEvent(event, setting));
    } catch (error) {
      console.error("La vibration n'a pas pu être enregistrée.", error);
      reload();
    }
  }

  function renderDurationRow(setting: ProfileDurationSetting) {
    if (!profile) return null;
    const bounds = profileDurationBounds(setting);
    const label = setting === "sessionInitialCountdownSecondsDefault" ? t.settings.sessionInitialCountdown : t.settings.sessionFinalPhase;
    return (
      <ProfileNumberField
        key={setting}
        label={label.label}
        value={profile[setting]}
        min={bounds.min}
        max={bounds.max}
        onCommit={(value) => commitSetting(setting, value)}
        testID={`profile-setting-${setting}`}
      />
    );
  }

  const changeTab = (tab: ProfileTab) => {
    // Section Profil non développée (Hermann, 11/11/2026) : l'onglet ouvre l'écran existant Modifier le profil.
    if (tab === "profile") router.push("/profile-edit");
  };

  return (
    <ScreenShell backgroundColor={palette.background}>
      <FixedHeader
        title={t.title}
        content={
          <View style={styles.headerNavigation}>
            <CatalogueNavigation<ProfileTab>
              options={[
                { value: "profile", label: t.tabs.profile },
                { value: "preferences", label: t.tabs.preferences },
                { value: "community", label: t.tabs.community, disabled: true, accessibilityLabel: t.tabs.communityUnavailable },
              ]}
              value="preferences"
              onChange={changeTab}
              selectedColor={palette.context}
              testID="profile-tabs"
            />
          </View>
        }
      />
      <View style={[styles.tabBand, { backgroundColor: palette.context }]} pointerEvents="none" accessible={false} testID="profile-tab-band">
        {TAB_BAND_FADE.map((opacity, index) => (
          <View key={opacity} style={[styles.tabBandFade, { top: TAB_BAND.solid + index, backgroundColor: palette.background, opacity }]} />
        ))}
      </View>
      {profile ? (
        <ScrollView
          style={styles.body}
          // CE-UI-07 (R1) : la zone centrale défile au-dessus de la navigation basse fixe, marge finale = hauteur de la
          // navigation + 16 (même formule que `CatalogueScreen`).
          contentContainerStyle={[styles.bodyContent, { paddingBottom: navigationBarTotalHeight() + spacing[16] }]}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          testID="profile-screen-body"
        >
          <GuidanceSection title={t.groups.notifications} variant="screen" testID="profile-group-notifications">
            <GuidanceSwitchRow
              label={t.notifications.label}
              subtitle={t.notifications.subtitle}
              // T7 : un état de permission refusé n'affiche jamais Notifications actif.
              value={profile.notificationsEnabled && !isNotificationPermissionDenied(permissionStatus)}
              onChange={(value) => void commitPreference("notificationsEnabled", value)}
              variant="screen"
              testID="profile-preference-notificationsEnabled"
            />
          </GuidanceSection>
          <GuidanceSection title={t.groups.session} variant="screen" testID="profile-group-session">
            {withSeparators("profile-group-session", SESSION_SETTINGS.map(renderDurationRow))}
          </GuidanceSection>
          <GuidanceSettingsForm
            settings={profileGuidance(profile)}
            onAnnouncementChange={(announcement, value) => void commitPreference(ANNOUNCEMENT_PREFERENCES[announcement], value)}
            onVibrationChange={(event, value) => void commitVibration(event, value)}
            onOpenSound={(event) => router.push({ pathname: "/profile-sound", params: { event } })}
            testIDPrefix="profile-guidance"
            variant="screen"
          />
        </ScrollView>
      ) : null}
    </ScreenShell>
  );
}

/** D-267 : un séparateur entre deux lignes consécutives d'un même groupe, jamais avant la première ni après la dernière. */
function withSeparators(groupTestID: string, rows: readonly ReactNode[]): ReactNode {
  return rows.map((row, index) => (
    <Fragment key={index}>
      {index > 0 ? <View style={styles.divider} testID={`${groupTestID}-divider-${index}`} /> : null}
      {row}
    </Fragment>
  ));
}

const styles = StyleSheet.create({
  headerNavigation: {
    flex: 1,
    alignSelf: "stretch",
  },
  tabBand: {
    height: TAB_BAND.height,
    overflow: "hidden",
  },
  tabBandFade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
  body: {
    flex: 1,
  },
  // Figma : contenu à 16 des bords, première section à 10 sous la bande d'onglets ; sections espacées de 20.
  bodyContent: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: 10,
    gap: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E3E8",
  },
});
