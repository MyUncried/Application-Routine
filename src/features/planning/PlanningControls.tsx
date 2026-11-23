import { DatePicker, Host } from "@expo/ui/swift-ui";
import { datePickerStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { formatLocalDate, occurrenceInstant, type LocalDate } from "@/domain/planning/Routine";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * Contrôles partagés de l'écran de planification (lot 5, 23/11/2026, points « calendrier » et y4) : valeur modifiable
 * (`Pill`) et calendrier natif du popover de date (`DateCalendar`), repris tels quels par la modale du programme — Hermann :
 * « Pour le calendrier du programme utilisé exactement celui de la planification (format, dimensions) » ; « prendre
 * l'exemple du format de texte de l'écran de planification ». Déplacés de `PlanningScreen.tsx` sans changement.
 */

/** Calendrier natif de « Début le » et de « jusqu'au » (recette du 18/11/2026, k8). */
const CALENDAR_MODIFIERS = [datePickerStyle("graphical"), tint(colors.primary)];
/** Largeur du calendrier graphique d'iOS dans son panneau. */
export const DATE_PANEL_WIDTH = 360;

/** Valeur modifiable, en bleu KODJO — dates et heure comprises (recette du 19/11/2026, k8, remplace le noir du 17/11). */
export function Pill({
  label,
  onPress,
  accessibilityLabel,
  testID,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly testID: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={6} style={controlStyles.pill} testID={testID}>
      <Text style={controlStyles.pillText}>{label}</Text>
    </Pressable>
  );
}

/**
 * Calendrier natif (`DatePicker` graphique) du popover de date : le jour touché s'applique. Apparence claire forcée : le
 * panneau est blanc, et en mode sombre le calendrier écrivait en blanc sur blanc (recette du 19/11/2026, k19 : « on ne
 * voit rien … aucun texte, sauf la date du jour »).
 * Lot 5, 23/11/2026 (point « calendrier ») : `minimum` facultatif — le début d'un programme n'a pas de borne basse.
 */
export function DateCalendar({
  value,
  minimum,
  maximum,
  onChange,
  testID = "planning-date-panel",
}: {
  readonly value: LocalDate;
  /** Absent : aucune borne basse. */
  readonly minimum?: LocalDate;
  /** PROG-CAT-01 : fin du programme ; absent : aucune borne haute. */
  readonly maximum?: LocalDate;
  readonly onChange: (value: LocalDate) => void;
  readonly testID?: string;
}) {
  if (Platform.OS !== "ios") return null;
  const range =
    minimum === undefined
      ? maximum === undefined
        ? undefined
        : { end: occurrenceInstant(maximum, "23:59") }
      : maximum === undefined
        ? { start: occurrenceInstant(minimum, "00:00") }
        : { start: occurrenceInstant(minimum, "00:00"), end: occurrenceInstant(maximum, "23:59") };
  return (
    <View style={controlStyles.calendar} testID={testID}>
      <Host matchContents colorScheme="light">
        <DatePicker
          selection={occurrenceInstant(value, "12:00")}
          displayedComponents={["date"]}
          {...(range === undefined ? {} : { range })}
          onDateChange={(date) => onChange(formatLocalDate(date))}
          modifiers={CALENDAR_MODIFIERS}
        />
      </Host>
    </View>
  );
}

export const controlStyles = StyleSheet.create({
  pill: { minHeight: 32, paddingHorizontal: spacing[8], borderRadius: 8, backgroundColor: colors.border, justifyContent: "center" },
  pillText: { ...type.segmentedLabel, color: colors.primary },
  calendar: { alignItems: "center" },
});
