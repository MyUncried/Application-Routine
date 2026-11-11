import { Fragment, useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import {
  DEFAULT_EVENT_SOUNDS,
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
import { colors, switchOffColors } from "@/shared/ui/tokens";

/**
 * Réglages du guidage sonore, communs au Profil (Préférences, enregistrés immédiatement) et à la modale « Guidage
 * sonore » de la Composition (brouillon validé pour la séance) — demande de Hermann du 11/11/2026 (cahier, constat d) :
 * « Réutilise les mêmes contrôles dans les Préférences et dans la modale, avec une cible d’enregistrement propre à
 * chaque contexte. »
 *
 * Deux présentations relevées dans Figma (recette du 11/11/2026, Hermann : « tu n'as pas utilisé la référence Figma pour
 * le layout / La charte graphique ») :
 * - `screen` — Profil › Préférences `1992:684` / `12093:25010` : titre Inter SemiBold 16, groupe `#F9FAFC` liseré blanc
 *   et ombre `0 2 10 rgba(26,26,38,0.08)`, lignes de 42, valeur du son Inter Medium 13 `#7A7A80`, chevron 6 × 12 ;
 * - `sheet` — modale `12132:27436` / `12175:25882` : titre Inter SemiBold 14, groupe `#F9FAFC` bordé `#E0E3E8` sans
 *   ombre, lignes de 40, valeur du son Inter Regular 12 `#7A7A80`, chevron 4 × 10.
 * Communs : libellés Inter Medium 14 `#141414`, marges intérieures 12, séparateurs `#E0E3E8`, en-tête de colonnes
 * « Son » / « Vibration » Inter Medium 11 `#7A7A80` sur 32, interrupteur natif (vert à l'état actif, DSF `5544:4632`).
 */
export type GuidanceFormVariant = "screen" | "sheet";

const SECONDARY_TEXT = "#7A7A80";
const BORDER = "#E0E3E8";

export function GuidanceSettingsForm({
  settings,
  onAnnouncementChange,
  onVibrationChange,
  onOpenSound,
  testIDPrefix,
  variant = "screen",
}: {
  readonly settings: GuidanceSettings;
  readonly onAnnouncementChange: (announcement: VoiceAnnouncement, value: boolean) => void;
  readonly onVibrationChange: (event: GuidanceEvent, value: boolean) => void;
  readonly onOpenSound: (event: GuidanceEvent) => void;
  readonly testIDPrefix: string;
  readonly variant?: GuidanceFormVariant;
}) {
  const t = strings.screens.soundGuidance;
  const v = variants[variant];
  return (
    <View style={v.form}>
      <GuidanceSection title={t.announcementsTitle} variant={variant} testID={`${testIDPrefix}-announcements`}>
        {VOICE_ANNOUNCEMENTS.map((announcement, index) => (
          <Fragment key={announcement}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <GuidanceSwitchRow
              label={t.announcements[announcement]}
              value={settings.announcements[announcement]}
              onChange={(value) => onAnnouncementChange(announcement, value)}
              variant={variant}
              testID={`${testIDPrefix}-announcement-${announcement}`}
            />
          </Fragment>
        ))}
      </GuidanceSection>
      <GuidanceSection title={t.eventsTitle} variant={variant} testID={`${testIDPrefix}-events`}>
        <View style={[styles.row, styles.columnsRow]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <View style={styles.labelBlock} />
          <Text style={[styles.column, styles.soundCell, v.soundCell]}>{t.soundColumn}</Text>
          <Text style={[styles.column, styles.vibrationColumn]}>{t.vibrationColumn}</Text>
        </View>
        {GUIDANCE_EVENTS.map((event) => {
          const setting = settings.events[event];
          const label = t.events[event];
          const soundValue = soundChoiceLabel(setting.sound);
          return (
            <Fragment key={event}>
              <View style={styles.divider} />
              <View style={[styles.row, v.row]} testID={`${testIDPrefix}-event-${event}`}>
                <Text style={[styles.label, styles.labelBlock]} numberOfLines={1} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  {label}
                </Text>
                <Pressable
                  onPress={() => onOpenSound(event)}
                  accessibilityRole="button"
                  accessibilityLabel={t.soundLabel.replace("{event}", label)}
                  accessibilityValue={{ text: soundValue }}
                  accessibilityHint={t.soundHint}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.soundButton, styles.soundCell, v.soundCell]}
                  testID={`${testIDPrefix}-event-${event}-sound`}
                >
                  <Text style={[v.soundValue, styles.soundValueText]} numberOfLines={1}>
                    {soundValue}
                  </Text>
                  <KodjoIcon name={variant === "sheet" ? "chevron-aller-modale" : "chevron-aller"} />
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
      </GuidanceSection>
    </View>
  );
}

/** Section : titre au-dessus d'un groupe (Figma « Fond — Groupe … »). */
export function GuidanceSection({
  title,
  variant,
  testID,
  children,
}: {
  readonly title: string;
  readonly variant: GuidanceFormVariant;
  readonly testID: string;
  readonly children: ReactNode;
}) {
  const v = variants[variant];
  return (
    <View style={v.section} testID={testID}>
      <Text style={v.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={v.group}>{children}</View>
    </View>
  );
}

/** Ligne à interrupteur : un seul élément accessible de rôle interrupteur (même patron que le Profil, R10). */
export function GuidanceSwitchRow({
  label,
  subtitle,
  value,
  onChange,
  variant,
  testID,
}: {
  readonly label: string;
  readonly subtitle?: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
  readonly variant: GuidanceFormVariant;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      {...(subtitle === undefined ? {} : { accessibilityHint: subtitle })}
      style={[styles.row, variants[variant].row]}
      testID={testID}
    >
      <View style={styles.labelBlock} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {subtitle === undefined ? null : <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
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

/**
 * Valeur affichée dans la colonne Son : « Par défaut », « Aucun » ou le nom du son choisi.
 * [« Non » (Figma) — remplacé le 11/11/2026, retour de Hermann (y3) : « son nom doit être "Aucun" ».]
 */
export function soundChoiceLabel(choice: SoundChoice): string {
  const t = strings.screens.soundGuidance;
  if (choice === "DEFAULT" || choice === "NONE") return t.soundValue[choice];
  return t.librarySounds[choice];
}

/** Écoute d'un son de la liste (toucher un son le fait entendre, Figma `12068:25044`). */
export function useSoundPreview(): (sound: LibrarySound) => void {
  const player = useRef<ExecutionSounds | null>(null);
  return (sound) => {
    player.current ??= new ExecutionSounds();
    player.current.play(sound, 0.6);
  };
}

/**
 * Choix d'un son (Figma « Préférences — Choix d’un son (modale) » `12068:25044`) : indication Inter Regular 13
 * `#7A7A80`, lignes de 44 séparées `#E0E3E8` ; « Par défaut » Inter Medium 16 et coche bleue ; titre de groupe Inter
 * SemiBold 13 `#7A7A80` ; sons Inter Regular 16. « Aucun » (demande de Hermann : « propose « Aucun » pour les neuf
 * événements, y compris « Mi-temps » ») suit « Par défaut », même style. Toucher un son le coche et le fait entendre.
 * [À CLARIFIER : le design liste des « Sons du système » (Aurore, Bambou…) ; iOS ne donne pas accès à ses sons d'alerte
 * aux applications : la liste propose les sons de KODJO.]
 * Retour de Hermann du 11/11/2026 (cahier, y3) : « Supprimer le texte "Toucher un son..." » ; « quand "Par défaut" est
 * sélectionné, le son par défaut de l'application doit aussi être coché en même temps, cela permet de savoir lequel
 * c'est. » [Indication « Touchez un son pour l'écouter. » en tête de liste — retirée.]
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
  // « Par défaut » choisi : le son par défaut de l'événement est coché lui aussi (y3).
  const isChecked = (choice: SoundChoice) => value === choice || (value === "DEFAULT" && choice === DEFAULT_EVENT_SOUNDS[event]);
  const option = (choice: SoundChoice, label: string, emphasized: boolean) => (
    <Pressable
      key={choice}
      onPress={() => choose(choice)}
      accessibilityRole="radio"
      accessibilityState={{ checked: isChecked(choice) }}
      accessibilityLabel={label}
      style={styles.choiceRow}
      testID={`${testIDPrefix}-choice-${choice}`}
    >
      <Text style={emphasized ? styles.choiceLabelEmphasized : styles.choiceLabel}>{label}</Text>
      {isChecked(choice) ? <KodjoIcon name="check-sound-chosen" testID={`${testIDPrefix}-choice-${choice}-check`} /> : null}
    </Pressable>
  );
  return (
    <View testID={`${testIDPrefix}-choices`}>
      {option("DEFAULT", t.picker.default, true)}
      <View style={styles.divider} />
      {option("NONE", t.picker.none, true)}
      <View style={styles.divider} />
      <Text style={styles.pickerSection} accessibilityRole="header">
        {t.picker.librarySection}
      </Text>
      {LIBRARY_SOUNDS.map((sound, index) => (
        <Fragment key={sound}>
          {index > 0 ? <View style={styles.divider} /> : null}
          {option(sound, t.librarySounds[sound], false)}
        </Fragment>
      ))}
    </View>
  );
}

const inter = {
  regular: { fontFamily: "Inter_400Regular", fontWeight: "400" },
  medium: { fontFamily: "Inter_500Medium", fontWeight: "500" },
  semiBold: { fontFamily: "Inter_600SemiBold", fontWeight: "600" },
} as const;

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: BORDER,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelBlock: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...inter.medium,
    fontSize: 14,
    lineHeight: 17,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  subtitle: {
    ...inter.regular,
    fontSize: 11,
    lineHeight: 13,
    color: colors.textSecondary,
  },
  // Retour de Hermann du 11/11/2026 (y1) : colonne « Son » éloignée de l'interrupteur, titre centré sur la colonne.
  // [Valeurs alignées à droite contre l'interrupteur, titre « Son » posé à 80 / 75 du bord — remplacé.]
  columnsRow: {
    height: 32,
  },
  column: {
    ...inter.medium,
    fontSize: 11,
    lineHeight: 13,
    color: SECONDARY_TEXT,
  },
  soundCell: {
    marginRight: 20,
    textAlign: "center",
  },
  vibrationColumn: {
    width: 51,
    textAlign: "right",
  },
  // Recette du 11/11/2026 (Hermann, y3) : « Décaler plus à droite les clamps de la colonne "Son", centrer le titre de la colonne » Chevrons alignés au bord droit de la colonne, valeur
  // centrée dans la place restante, titre « Son » centré sur la colonne. [Valeur et chevron centrés ensemble — remplacé.]
  soundButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 7,
    alignSelf: "stretch",
  },
  soundValueText: {
    flex: 1,
    textAlign: "center",
  },
  pickerSection: {
    ...inter.semiBold,
    fontSize: 13,
    lineHeight: 16,
    color: SECONDARY_TEXT,
    marginTop: 18,
    marginBottom: 8,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
  },
  choiceLabel: {
    ...inter.regular,
    fontSize: 16,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  choiceLabelEmphasized: {
    ...inter.medium,
    fontSize: 16,
    lineHeight: 19,
    color: colors.textPrimary,
  },
});

const variants = {
  screen: StyleSheet.create({
    form: { gap: 20 },
    section: { gap: 13 },
    sectionTitle: { ...inter.semiBold, fontSize: 16, lineHeight: 19, color: colors.textPrimary },
    group: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: "#FFFFFF",
      borderRadius: 12,
      paddingHorizontal: 12,
      shadowColor: "#1A1A26",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 2,
    },
    row: { height: 42 },
    soundCell: { width: 112 },
    soundValue: { ...inter.medium, fontSize: 13, lineHeight: 16, color: SECONDARY_TEXT },
  }),
  sheet: StyleSheet.create({
    form: { gap: 12 },
    section: { gap: 7 },
    sectionTitle: { ...inter.semiBold, fontSize: 14, lineHeight: 17, color: colors.textPrimary },
    group: {
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    row: { height: 40 },
    soundCell: { width: 104 },
    soundValue: { ...inter.regular, fontSize: 12, lineHeight: 15, color: SECONDARY_TEXT },
  }),
} as const;
