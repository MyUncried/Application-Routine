import { Fragment, useRef } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import {
  GUIDANCE_EVENTS,
  LIBRARY_SOUNDS,
  soundOf,
  VOICE_ANNOUNCEMENTS,
  type GuidanceEvent,
  type GuidanceSettings,
  type LibrarySound,
  type SoundChoice,
  type VoiceAnnouncement,
} from "@/domain/preferences/guidanceSettings";
import { ExecutionSounds } from "@/infrastructure/audio/ExecutionSounds";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, minTouchTarget, spacing, switchOffColors, type } from "@/shared/ui/tokens";

/**
 * Réglages du guidage sonore, communs au Profil (Préférences, enregistrés immédiatement) et à la modale « Guidage
 * sonore » de la Composition (brouillon validé pour la séance) — demande de Hermann du 11/11/2026 (cahier, constat d) :
 * « Réutilise les mêmes contrôles dans les Préférences et dans la modale, avec une cible d’enregistrement propre à
 * chaque contexte. » Figma `1992:684`, `12093:25010`, `12132:27436`, `12175:25882` : groupe « Annonces vocales » (six
 * interrupteurs), groupe « Sons et vibrations » (colonnes Son et Vibration, neuf événements).
 */
export function GuidanceSettingsForm({
  settings,
  onAnnouncementChange,
  onVibrationChange,
  onOpenSound,
  testIDPrefix,
}: {
  readonly settings: GuidanceSettings;
  readonly onAnnouncementChange: (announcement: VoiceAnnouncement, value: boolean) => void;
  readonly onVibrationChange: (event: GuidanceEvent, value: boolean) => void;
  readonly onOpenSound: (event: GuidanceEvent) => void;
  readonly testIDPrefix: string;
}) {
  const t = strings.screens.soundGuidance;
  return (
    <>
      <View style={styles.section} testID={`${testIDPrefix}-announcements`}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t.announcementsTitle}
        </Text>
        <View style={styles.group}>
          {VOICE_ANNOUNCEMENTS.map((announcement, index) => (
            <Fragment key={announcement}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <SwitchRow
                label={t.announcements[announcement]}
                value={settings.announcements[announcement]}
                onChange={(value) => onAnnouncementChange(announcement, value)}
                testID={`${testIDPrefix}-announcement-${announcement}`}
              />
            </Fragment>
          ))}
        </View>
      </View>
      <View style={styles.section} testID={`${testIDPrefix}-events`}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t.eventsTitle}
        </Text>
        <View style={styles.group}>
          <View style={styles.columnsRow} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Text style={[styles.column, styles.soundColumn]}>{t.soundColumn}</Text>
            <Text style={[styles.column, styles.vibrationColumn]}>{t.vibrationColumn}</Text>
          </View>
          {GUIDANCE_EVENTS.map((event) => {
            const setting = settings.events[event];
            const label = t.events[event];
            const soundValue = soundChoiceLabel(setting.sound);
            return (
              <Fragment key={event}>
                <View style={styles.divider} />
                <View style={styles.eventRow} testID={`${testIDPrefix}-event-${event}`}>
                  <Text style={styles.label} numberOfLines={1} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                    {label}
                  </Text>
                  <Pressable
                    onPress={() => onOpenSound(event)}
                    accessibilityRole="button"
                    accessibilityLabel={t.soundLabel.replace("{event}", label)}
                    accessibilityValue={{ text: soundValue }}
                    accessibilityHint={t.soundHint}
                    hitSlop={{ top: 8, bottom: 8 }}
                    style={styles.soundButton}
                    testID={`${testIDPrefix}-event-${event}-sound`}
                  >
                    <Text style={styles.soundValue} numberOfLines={1}>
                      {soundValue}
                    </Text>
                    <KodjoIcon name="chevron-aller" />
                  </Pressable>
                  <Switch
                    {...switchOffColors}
                    value={setting.vibration}
                    onValueChange={(value) => onVibrationChange(event, value)}
                    accessibilityLabel={t.vibrationLabel.replace("{event}", label)}
                    testID={`${testIDPrefix}-event-${event}-vibration`}
                  />
                </View>
              </Fragment>
            );
          })}
        </View>
      </View>
    </>
  );
}

/** Valeur affichée dans la colonne Son : « Par défaut », « Non » (Figma) ou le nom du son choisi. */
export function soundChoiceLabel(choice: SoundChoice): string {
  const t = strings.screens.soundGuidance;
  if (choice === "DEFAULT" || choice === "NONE") return t.soundValue[choice];
  return t.librarySounds[choice];
}

function SwitchRow({
  label,
  value,
  onChange,
  testID,
}: {
  readonly label: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
  readonly testID: string;
}) {
  return (
    // Une ligne = un seul élément accessible de rôle interrupteur (même patron que le Profil, R10).
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={styles.switchRow}
      testID={testID}
    >
      <Text style={styles.label} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {label}
      </Text>
      <Switch
        {...switchOffColors}
        value={value}
        onValueChange={onChange}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        testID={`${testID}-switch`}
      />
    </Pressable>
  );
}

/** Écoute d'un son de la liste (« Touchez un son pour l'écouter », Figma `12068:25044`). */
export function useSoundPreview(): (sound: LibrarySound) => void {
  const player = useRef<ExecutionSounds | null>(null);
  return (sound) => {
    player.current ??= new ExecutionSounds();
    player.current.play(sound, 0.6);
  };
}

/**
 * Choix d'un son (Figma « Préférences — Choix d’un son (modale) » `12068:25044`) : « Par défaut », « Aucun » (demande de
 * Hermann : « propose « Aucun » pour les neuf événements, y compris « Mi-temps » »), puis les sons de l'application.
 * Toucher un son le sélectionne et le fait entendre. [À CLARIFIER : le design liste des « Sons du système » (Aurore,
 * Bambou…) ; iOS ne donne pas accès à ses sons d'alerte aux applications : la liste propose les sons de KODJO.]
 */
export function SoundChoiceList({
  event,
  value,
  onChange,
  testIDPrefix,
}: {
  readonly event: GuidanceEvent;
  readonly value: SoundChoice;
  readonly onChange: (choice: SoundChoice) => void;
  readonly testIDPrefix: string;
}) {
  const t = strings.screens.soundGuidance;
  const preview = useSoundPreview();
  const choose = (choice: SoundChoice) => {
    onChange(choice);
    const sound = soundOf(event, { sound: choice, vibration: false });
    if (sound !== null) preview(sound);
  };
  const option = (choice: SoundChoice, label: string) => (
    <Pressable
      key={choice}
      onPress={() => choose(choice)}
      accessibilityRole="radio"
      accessibilityState={{ checked: value === choice }}
      accessibilityLabel={label}
      style={styles.choiceRow}
      testID={`${testIDPrefix}-choice-${choice}`}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      {value === choice ? <Text style={styles.check}>✓</Text> : null}
    </Pressable>
  );
  return (
    <View testID={`${testIDPrefix}-choices`}>
      <Text style={styles.pickerHint}>{t.picker.hint}</Text>
      {option("DEFAULT", t.picker.default)}
      <View style={styles.choiceDivider} />
      {option("NONE", t.picker.none)}
      <View style={styles.choiceDivider} />
      <Text style={styles.pickerSection} accessibilityRole="header">
        {t.picker.librarySection}
      </Text>
      {LIBRARY_SOUNDS.map((sound, index) => (
        <Fragment key={sound}>
          {index > 0 ? <View style={styles.choiceDivider} /> : null}
          {option(sound, t.librarySounds[sound])}
        </Fragment>
      ))}
    </View>
  );
}

// Figma `12093:25010` : groupe fond #F9FAFC, liseré blanc 1, rayon 12, ombre 0 2 10 rgba(26,26,38,0.08) ; lignes de 42,
// marges 12 ; libellé Inter Medium 14 ; colonnes et valeur de son Inter Medium 11 et 13 #7A7A80 ; séparateurs #E0E3E8.
const SECONDARY_TEXT = "#7A7A80";

const styles = StyleSheet.create({
  section: {
    gap: spacing[16],
  },
  sectionTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  group: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: "#1A1A26",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: minTouchTarget,
    gap: spacing[8],
  },
  label: {
    ...type.label,
    flex: 1,
    color: colors.textPrimary,
  },
  columnsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    height: 31,
  },
  column: {
    ...type.label,
    fontSize: 11,
    lineHeight: 13,
    color: SECONDARY_TEXT,
  },
  soundColumn: {
    marginRight: 42,
  },
  vibrationColumn: {
    width: 47,
    textAlign: "right",
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: minTouchTarget,
    gap: spacing[8],
  },
  soundButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: minTouchTarget,
  },
  soundValue: {
    ...type.label,
    fontSize: 13,
    lineHeight: 16,
    color: SECONDARY_TEXT,
  },
  pickerHint: {
    ...type.body,
    fontSize: 13,
    lineHeight: 16,
    color: SECONDARY_TEXT,
    marginBottom: spacing[8],
  },
  pickerSection: {
    ...type.label,
    fontSize: 13,
    lineHeight: 16,
    color: SECONDARY_TEXT,
    marginTop: spacing[16],
    marginBottom: spacing[4],
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: minTouchTarget,
  },
  choiceLabel: {
    ...type.body,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  check: {
    fontSize: 18,
    color: colors.primary,
  },
  choiceDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
