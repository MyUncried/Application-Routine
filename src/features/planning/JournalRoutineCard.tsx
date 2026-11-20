import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ParcoursBadge } from "@/features/planning/ParcoursBadge";
import { planningStrings } from "@/features/planning/planningStrings";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, layout, spacing } from "@/shared/ui/tokens";

/**
 * Carte d'une routine du Journal (D-535, DSF Journal § 3 ; Figma « Calendrier — Journal — MVP » `1992:5510`) — même
 * famille que la carte de l'Agenda (DSF Agenda § 5), hauteur 72 :
 * - cadre : date de création (« 12 nov. », 15 semi-gras) et année (13, gris) ;
 * - ligne 1 : chevron + nom de la routine (16) ; ligne 2 : zones corporelles (13, gris) ; ligne 3 : récurrence (13, gris) ;
 * - à droite : bouton carré « Modifier la planification » (crayon).
 *
 * Recette du 19/11/2026 au soir (Hermann) :
 * - navigation (constat B) : le cadre de gauche ouvre la planification, le centre déploie, la droite porte l'action ;
 * - code couleur (constat E) : routine planifiée (au moins une occurrence à venir) → bleu, comme une occurrence à venir
 *   de l'Agenda ; sinon (rien de planifié ni d'exécuté, ou séances exécutées sans rien à venir) → gris ;
 * - glissé vers la gauche : Dupliquer et Supprimer (constat C), porté par l'écran.
 * [Teinte unique #EAEAFF ; toucher la carte entière la déployait ; ni glissement — remplacé.]
 *
 * Recette du 20/11/2026 (r20-j-deploye, r20-j-navigation — Hermann) : « Retirer le crayon » ; « Mettre le symbole des
 * zones corporelles avant le texte de la deuxième ligne » ; « Mettre en troisième ligne le texte du nombre
 * d'occurrences », formulé « N créneaux, du X mois au Y mois » (`journalSlotsLine`). [Ligne 3 : récurrence ; crayon à
 * droite — remplacé.]
 */

export const JOURNAL_ROW_HEIGHT = 72;
const FRAME_WIDTH = 80;
const BAR_WIDTH = 6;
/** Mêmes teintes que l'Agenda : bleu (à venir) et gris. */
const TINTS = {
  planned: { frame: "#E3ECFF", bar: "#8EAAE8", band: "rgba(227, 236, 255, 0.18)" },
  idle: { frame: "#F0F0F5", bar: "#B8BAC9", band: "rgba(240, 240, 245, 0.18)" },
} as const;
const CHEVRON = require("../../../assets/icons/icon-suivant.svg");
const MAX_SCALE = 1.6;

export function JournalRoutineCard({
  date,
  year,
  name,
  parcours = false,
  detail,
  slots,
  planned,
  expanded,
  onOpen,
  onToggleExpanded,
  testID,
}: {
  readonly date: string;
  readonly year: string;
  readonly name: string;
  /** Routine à plusieurs séances : repère « P » devant le nom (recette du 20/11/2026, constat A). */
  readonly parcours?: boolean;
  readonly detail: string;
  /** Ligne 3 : créneaux à venir (« 12 créneaux, du 26 nov. au 28 déc. »). */
  readonly slots: string;
  /** Au moins une occurrence à venir : teinte bleue. */
  readonly planned: boolean;
  readonly expanded: boolean;
  /** Cadre de gauche : ouvrir la planification. */
  readonly onOpen: () => void;
  readonly onToggleExpanded: () => void;
  readonly testID: string;
}) {
  const t = planningStrings.journal;
  const tint = planned ? TINTS.planned : TINTS.idle;
  return (
    <View style={styles.row} testID={testID}>
      <View style={[styles.band, { backgroundColor: tint.band }]} />
      <View style={[styles.bar, styles.barRight, { backgroundColor: tint.bar }]} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${t.edit}, ${name}`}
        style={[styles.frame, { backgroundColor: tint.frame }]}
        testID={`${testID}-frame`}
      >
        <View style={[styles.bar, { backgroundColor: tint.bar }]} testID={`${testID}-${planned ? "planned" : "idle"}`} />
        <Text style={styles.date} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} adjustsFontSizeToFit testID={`${testID}-date`}>
          {date}
        </Text>
        <Text style={styles.secondary} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-year`}>
          {year}
        </Text>
      </Pressable>
      <Pressable
        onPress={onToggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={[name, detail, slots].filter((part) => part !== "").join(", ")}
        accessibilityHint={expanded ? t.collapse : t.expand}
        accessibilityState={{ expanded }}
        style={styles.body}
        testID={`${testID}-toggle`}
      >
        <View style={styles.titleLine}>
          <Image source={CHEVRON} style={[styles.chevron, expanded ? styles.chevronDown : null]} accessible={false} testID={`${testID}-chevron${expanded ? "-open" : ""}`} />
          {parcours ? <ParcoursBadge testID={`${testID}-parcours`} /> : null}
          <Text style={styles.name} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-name`}>
            {name}
          </Text>
        </View>
        {detail === "" ? null : (
          <View style={styles.zonesLine}>
            <KodjoIcon name="card-body-zone-badge" testID={`${testID}-zones-badge`} />
            <Text style={[styles.secondary, styles.zones]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-detail`}>
              {detail}
            </Text>
          </View>
        )}
        {/* Recette du 20/11/2026 (r21-j-carte — Hermann : « Ligne 3 : il faut le symbole du calendrier »). */}
        <View style={styles.zonesLine}>
          <KodjoIcon name="navigation-calendar-inactive" size={13} testID={`${testID}-slots-badge`} />
          <Text style={[styles.secondary, styles.zones]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-slots`}>
            {slots}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "stretch", minHeight: JOURNAL_ROW_HEIGHT, backgroundColor: colors.background },
  band: { position: "absolute", top: 0, bottom: 0, left: FRAME_WIDTH - 10, right: 0 },
  bar: { position: "absolute", top: 0, bottom: 0, left: 0, width: BAR_WIDTH },
  barRight: { left: undefined, right: 0 },
  frame: {
    width: FRAME_WIDTH,
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
  body: { flex: 1, paddingLeft: spacing[8], paddingRight: layout.screenGutter + BAR_WIDTH, paddingVertical: spacing[4], justifyContent: "center", gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 2 },
  chevron: { width: 16, height: 16 },
  chevronDown: { transform: [{ rotate: "90deg" }] },
  name: { flex: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16, color: colors.textPrimary },
  // Pastille des zones devant la ligne 2, comme la carte de mouvement sélectionné.
  zonesLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  zones: { flexShrink: 1 },
});
