import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { planningStrings } from "@/features/planning/planningStrings";
import { colors, layout, spacing } from "@/shared/ui/tokens";

/**
 * Carte d'une routine de l'Agenda (D-533, D-534 ; DSF Agenda — Planning § 5 ; Figma `12580:27335`, lignes d'agenda
 * `12593:27405` et suivantes) — une carte par occurrence de routine :
 * - bloc heure / durée à gauche (« 8h00 », chronomètre 14 et durée 13 gris), dans un cadre teinté sans liseré qui part du
 *   bord gauche de l'écran (coins droits arrondis à 10), avec un trait vertical épais de 6 à son bord gauche ;
 * - bande de la même teinte à 18 % jusqu'au bord droit de l'écran, avec le même trait épais à droite ;
 * - chevron 16 (droite fermé, bas déployé) devant le nom de la routine (16, semi-gras) ; ligne 2 alignée sur le chevron
 *   (13, gris) : zones corporelles ;
 * - à droite, « Démarrer » (pilule 76 × 24) ou l'étiquette de statut, alignés en bas avec la ligne 2.
 *
 * Recette du 19/11/2026 au soir (Hermann) :
 * - navigation (constat B) : le cadre de gauche ouvre la planification, le centre déploie, la droite porte l'action ;
 * - code couleur (constat D) : passée ou future exécutée complète → vert ; exécutée partielle → orange ; abandonnée
 *   (arrêtée) → gris ; passée non exécutée → rouge ; future non exécutée → bleu ;
 * - statut (s19-passees, constat G) : une occurrence non exécutée garde « Démarrer » ; une occurrence exécutée affiche
 *   « Complétée », « Partielle » ou « Arrêtée » selon le statut d'exécution de sa ou ses séances.
 * [Teinte grise unique « prévue », vert et rouge en attente du lien occurrence ↔ Exécution (D-525) — remplacé.]
 * La carte grandit avec le texte agrandi (hauteur minimale 52) au lieu de couper ses lignes (recette du 19/11/2026, h2).
 */

export type AgendaStatus = "UPCOMING" | "MISSED" | "COMPLETED" | "PARTIAL" | "STOPPED";

/** Cadre, trait et bande (bande = cadre à 18 %). Gris, vert et rouge : Figma ; bleu et orange : même construction. */
const TINTS: Readonly<Record<AgendaStatus, { readonly frame: string; readonly bar: string; readonly band: string }>> = {
  UPCOMING: { frame: "#E3ECFF", bar: "#8EAAE8", band: "rgba(227, 236, 255, 0.18)" },
  MISSED: { frame: "#FCE5E5", bar: "#E58F8F", band: "rgba(252, 229, 229, 0.18)" },
  COMPLETED: { frame: "#E0F5E8", bar: "#8FCCA8", band: "rgba(224, 245, 232, 0.18)" },
  PARTIAL: { frame: "#FDECD9", bar: "#EDB16E", band: "rgba(253, 236, 217, 0.18)" },
  STOPPED: { frame: "#F0F0F5", bar: "#B8BAC9", band: "rgba(240, 240, 245, 0.18)" },
};

/** Étiquette de statut d'une occurrence exécutée. */
const TAGS: Readonly<Partial<Record<AgendaStatus, { readonly label: string; readonly background: string; readonly text: string }>>> = {
  COMPLETED: { label: planningStrings.calendar.status.completed, background: "#E5F5ED", text: "#1A995C" },
  PARTIAL: { label: planningStrings.calendar.status.partial, background: "#FDECD9", text: "#B5620B" },
  STOPPED: { label: planningStrings.calendar.status.stopped, background: "#EDEEF3", text: "#6B6E80" },
};

export const AGENDA_ROW_HEIGHT = 52;
const FRAME_WIDTH = 80;
const BAR_WIDTH = 6;
const CHEVRON_SIZE = 16;
const CHRONOMETER = require("../../../assets/icons/icon-agenda-chronometre.svg");
const CHEVRON = require("../../../assets/icons/icon-suivant.svg");
/** Texte agrandi : la carte suit jusqu'à 1,6 fois, au-delà les lignes restent lisibles sans écraser la rangée. */
const MAX_SCALE = 1.6;

export function RoutineAgendaCard({
  time,
  duration,
  name,
  detail,
  status,
  expanded,
  onOpen,
  onToggleExpanded,
  onStart,
  testID,
}: {
  readonly time: string;
  readonly duration: string;
  readonly name: string;
  readonly detail: string;
  readonly status: AgendaStatus;
  readonly expanded: boolean;
  /** Cadre de gauche : ouvrir la planification. */
  readonly onOpen: () => void;
  /** Centre : déployer / replier. */
  readonly onToggleExpanded: () => void;
  /** Droite : Démarrer (occurrence non exécutée). */
  readonly onStart: () => void;
  readonly testID: string;
}) {
  const colorsOf = TINTS[status];
  const tag = TAGS[status];
  return (
    <View style={styles.row} testID={testID}>
      <View style={[styles.band, { backgroundColor: colorsOf.band }]} testID={`${testID}-band`} />
      <View style={[styles.bar, styles.barRight, { backgroundColor: colorsOf.bar }]} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={planningStrings.calendar.openRoutine}
        style={[styles.frame, { backgroundColor: colorsOf.frame }]}
        testID={`${testID}-frame`}
      >
        <View style={[styles.bar, { backgroundColor: colorsOf.bar }]} testID={`${testID}-status-${status}`} />
        <Text style={styles.time} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} adjustsFontSizeToFit testID={`${testID}-time`}>
          {time}
        </Text>
        {duration === "" ? null : (
          <View style={styles.durationLine}>
            <View style={styles.chronometerBox}>
              <Image source={CHRONOMETER} style={styles.chronometer} accessible={false} />
            </View>
            <Text style={styles.secondary} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} adjustsFontSizeToFit testID={`${testID}-duration`}>
              {duration}
            </Text>
          </View>
        )}
      </Pressable>
      <View style={styles.body}>
        <Pressable
          onPress={onToggleExpanded}
          accessibilityRole="button"
          accessibilityLabel={expanded ? planningStrings.calendar.collapseRoutine : planningStrings.calendar.expandRoutine}
          accessibilityState={{ expanded }}
          style={styles.center}
          testID={`${testID}-disclosure`}
        >
          <View style={styles.titleLine}>
            <Image source={CHEVRON} style={[styles.chevron, expanded ? styles.chevronDown : null]} accessible={false} testID={`${testID}-chevron${expanded ? "-open" : ""}`} />
            <Text style={styles.name} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-name`}>
              {name}
            </Text>
          </View>
          <Text style={[styles.secondary, styles.detail]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-detail`}>
            {detail}
          </Text>
        </Pressable>
        <View style={styles.action}>
          {tag !== undefined ? (
            <View style={[styles.tag, { backgroundColor: tag.background }]} testID={`${testID}-status-tag`}>
              <Text style={[styles.tagLabel, { color: tag.text }]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1}>
                {tag.label}
              </Text>
            </View>
          ) : (
            <Pressable onPress={onStart} accessibilityRole="button" accessibilityLabel={planningStrings.calendar.start} hitSlop={8} style={styles.start} testID={`${testID}-start`}>
              <Text style={styles.startLabel} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1}>
                {planningStrings.calendar.start}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const pill = { minWidth: 76, minHeight: 24, borderRadius: 12, paddingHorizontal: spacing[10], alignItems: "center", justifyContent: "center" } as const;

const styles = StyleSheet.create({
  // Rangée pleine largeur d'écran : le cadre et la bande touchent les bords (DSF § 5).
  row: { flexDirection: "row", minHeight: AGENDA_ROW_HEIGHT, backgroundColor: colors.background },
  // Bande : prolonge le cadre (sous son arrondi) jusqu'au bord droit.
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
    gap: 2,
    overflow: "hidden",
  },
  time: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 15, color: colors.textPrimary },
  durationLine: { flexDirection: "row", alignItems: "center", gap: 3 },
  chronometerBox: { width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  chronometer: { width: 10.8333, height: 12.5833 },
  secondary: { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  body: { flex: 1, flexDirection: "row", alignItems: "stretch", paddingLeft: spacing[8], paddingRight: layout.screenGutter, gap: spacing[8] },
  center: { flex: 1, paddingVertical: spacing[4], justifyContent: "center", gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 2 },
  chevron: { width: CHEVRON_SIZE, height: CHEVRON_SIZE },
  chevronDown: { transform: [{ rotate: "90deg" }] },
  name: { flex: 1, fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 16, color: colors.textPrimary },
  detail: {},
  // Action alignée en bas avec la ligne 2.
  action: { justifyContent: "flex-end", paddingVertical: spacing[4] },
  // Pilule « Démarrer » (D-504) : 76 × 24, fond #F7F7FF, ombre des actions contextuelles.
  start: {
    ...pill,
    backgroundColor: colors.catalogueSessionsBackground,
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  startLabel: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12, color: colors.primary },
  tag: pill,
  tagLabel: { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 12 },
});
