import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { planningStrings } from "@/features/planning/planningStrings";
import { EditSquareButton } from "@/shared/ui/EditSquareButton";
import { colors, layout, spacing } from "@/shared/ui/tokens";

/**
 * Carte d'une routine du Journal (D-535, DSF Journal § 3 ; Figma « Calendrier — Journal — MVP » `1992:5510`) — même
 * famille que la carte de l'Agenda (DSF Agenda § 5), hauteur 72 :
 * - teinte unique #EAEAFF (couleur de l'onglet Journal sélectionné) pour le cadre et la bande à 18 %, repères épais
 *   gauche et droite #B0B0F2 ;
 * - cadre : date de création (« 12 nov. », 15 semi-gras) et année (13, gris) ;
 * - ligne 1 : chevron + nom de la routine (16) ; ligne 2 : zones corporelles (13, gris) ; ligne 3 : récurrence (13, gris) ;
 * - à droite : bouton carré « Modifier la planification » (crayon). Ni Démarrer, ni Terminer, ni glissement.
 * Toucher la carte (ou le chevron) la déploie ; le crayon ouvre la routine.
 */

export const JOURNAL_ROW_HEIGHT = 72;
const FRAME_WIDTH = 80;
const BAR_WIDTH = 6;
const TINT = { frame: "#EAEAFF", bar: "#B0B0F2", band: "rgba(234, 234, 255, 0.18)" } as const;
const CHEVRON = require("../../../assets/icons/icon-suivant.svg");
const MAX_SCALE = 1.6;

export function JournalRoutineCard({
  date,
  year,
  name,
  detail,
  recurrence,
  expanded,
  onToggleExpanded,
  onEdit,
  testID,
}: {
  readonly date: string;
  readonly year: string;
  readonly name: string;
  readonly detail: string;
  readonly recurrence: string;
  readonly expanded: boolean;
  readonly onToggleExpanded: () => void;
  readonly onEdit: () => void;
  readonly testID: string;
}) {
  const t = planningStrings.journal;
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.band} />
      <View style={[styles.bar, styles.barRight]} />
      <Pressable
        onPress={onToggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={[name, detail, recurrence].filter((part) => part !== "").join(", ")}
        accessibilityHint={expanded ? t.collapse : t.expand}
        accessibilityState={{ expanded }}
        style={styles.pressable}
        testID={`${testID}-toggle`}
      >
        <View style={styles.frame} testID={`${testID}-frame`}>
          <View style={styles.bar} />
          <Text style={styles.date} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} adjustsFontSizeToFit testID={`${testID}-date`}>
            {date}
          </Text>
          <Text style={styles.secondary} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-year`}>
            {year}
          </Text>
        </View>
        <View style={styles.body}>
          <View style={styles.titleLine}>
            <Image source={CHEVRON} style={[styles.chevron, expanded ? styles.chevronDown : null]} accessible={false} testID={`${testID}-chevron${expanded ? "-open" : ""}`} />
            <Text style={styles.name} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-name`}>
              {name}
            </Text>
          </View>
          {detail === "" ? null : (
            <Text style={styles.secondary} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-detail`}>
              {detail}
            </Text>
          )}
          <Text style={styles.secondary} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-recurrence`}>
            {recurrence}
          </Text>
        </View>
      </Pressable>
      <View style={styles.edit}>
        <EditSquareButton onPress={onEdit} accessibilityLabel={`${t.edit}, ${name}`} testID={`${testID}-edit`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch", minHeight: JOURNAL_ROW_HEIGHT, backgroundColor: colors.background },
  band: { position: "absolute", top: 0, bottom: 0, left: FRAME_WIDTH - 10, right: 0, backgroundColor: TINT.band },
  bar: { position: "absolute", top: 0, bottom: 0, left: 0, width: BAR_WIDTH, backgroundColor: TINT.bar },
  barRight: { left: undefined, right: 0 },
  pressable: { flex: 1, flexDirection: "row" },
  frame: {
    width: FRAME_WIDTH,
    backgroundColor: TINT.frame,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingLeft: layout.screenGutter,
    paddingRight: spacing[4],
    paddingVertical: spacing[4],
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  date: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 15, color: colors.textPrimary },
  secondary: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, color: colors.textSecondary },
  body: { flex: 1, paddingLeft: spacing[8], paddingRight: spacing[8], paddingVertical: spacing[4], justifyContent: "center", gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 2 },
  chevron: { width: 16, height: 16 },
  chevronDown: { transform: [{ rotate: "90deg" }] },
  name: { flex: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16, color: colors.textPrimary },
  // Crayon à 16 du bord droit de l'écran (Figma : x = 338 dans la liste de 370), centré verticalement.
  edit: { justifyContent: "center", paddingRight: layout.screenGutter },
});
