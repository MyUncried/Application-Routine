import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/shared/ui/tokens";

/**
 * Icônes d'état de la ligne d'agenda (D-599, Hermann, 24/11/2026 ; DSF Agenda — Planning § 8, passage « Remplacé le
 * 24/11/2026 » ; Figma « P-Calendrier — Semaine — Icônes d'état (essai) » `13149:26608` et légende `13149:26915`, colonnes
 * « Option 2 » et « Appuyé »). Icône ronde de 28, sans libellé visible, à la place de la pastille textuelle :
 * - Démarrer et Rattraper (identiques, le cadre les distingue) : disque blanc en relief (dégradé #FFFFFF → #E3E5F0, filet
 *   #D6D9E3, ombre large et ombre serrée), triangle bleu ; seuls interactifs, avec un état appuyé (disque réduit à 94 %, fond
 *   #E8EBF5, ombre interne en haut, ombre extérieure réduite) ;
 * - Arrêtée : disque rouge, carré blanc ; Complétée : disque vert, coche blanche ; Partielle : anneau fixe (piste grise, arc
 *   orange sur trois quarts depuis 12 h, sens horaire, sans valeur de progression) ; Supprimée : disque gris, croix blanche ;
 *   Expirée : disque gris, horloge blanche. Toutes à plat.
 * L'état ne repose pas sur la couleur seule : chaque icône porte son libellé d'accessibilité.
 * [Écart Figma consigné : le disque appuyé de la légende mesure 24,64 (88 %) ; la règle écrite (DSF § 8, D-599) dit 94 %,
 * retenue.]
 */
export type AgendaIconKind = "START" | "CATCH_UP" | "COMPLETED" | "PARTIAL" | "STOPPED" | "DELETED" | "EXPIRED";

export const AGENDA_ICON_SIZE = 28;
/** Zone de toucher minimale de Démarrer / Rattraper. */
export const AGENDA_ICON_TOUCH = 44;
/** Disque appuyé : 94 % (DSF § 8). */
export const AGENDA_ICON_PRESSED_SCALE = 0.94;
/** Anneau de Partielle : rayon intérieur à 64 % (Figma `innerRadius` 0,64). */
const RING_WIDTH = (AGENDA_ICON_SIZE / 2) * (1 - 0.64);

const PLAY = require("../../../assets/icons/agenda-etat-lecture.svg");
const CHECK = require("../../../assets/icons/agenda-etat-coche.svg");
const CROSS = require("../../../assets/icons/agenda-etat-croix.svg");
const CLOCK = require("../../../assets/icons/agenda-etat-horloge.svg");

/** Icône à plat d'un état (non interactive). */
export function AgendaStateIcon({ kind, accessibilityLabel, testID }: { readonly kind: Exclude<AgendaIconKind, "START" | "CATCH_UP">; readonly accessibilityLabel: string; readonly testID: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.box} testID={testID}>
      {kind === "PARTIAL" ? (
        <>
          <View style={[styles.disc, styles.ringTrack]} testID={`${testID}-track`} />
          <View style={[styles.disc, styles.ringArc]} testID={`${testID}-arc`} />
        </>
      ) : (
        <View style={[styles.disc, { backgroundColor: DISC[kind] }]} testID={`${testID}-disc`}>
          {kind === "STOPPED" ? <View style={styles.square} /> : null}
          {kind === "COMPLETED" ? <Image source={CHECK} style={styles.check} tintColor={colors.agendaIconGlyph} accessible={false} /> : null}
          {kind === "DELETED" ? <Image source={CROSS} style={styles.cross} tintColor={colors.agendaIconGlyph} accessible={false} /> : null}
          {kind === "EXPIRED" ? <Image source={CLOCK} style={styles.clock} tintColor={colors.agendaIconGlyph} accessible={false} /> : null}
        </View>
      )}
    </View>
  );
}

const DISC: Readonly<Record<"COMPLETED" | "STOPPED" | "DELETED" | "EXPIRED", string>> = {
  COMPLETED: colors.agendaIconCompleted,
  STOPPED: colors.agendaIconStopped,
  DELETED: colors.agendaIconMuted,
  EXPIRED: colors.agendaIconMuted,
};

/** Démarrer / Rattraper : disque en relief, triangle bleu ; état appuyé pendant le toucher. */
export function AgendaPlayIcon({ pressed, testID }: { readonly pressed: boolean; readonly testID: string }) {
  return (
    <View style={styles.box} testID={testID}>
      <View style={[styles.disc, pressed ? styles.playPressed : styles.playRaised]} testID={`${testID}-disc${pressed ? "-pressed" : ""}`}>
        <Image source={PLAY} style={styles.play} tintColor={colors.primary} accessible={false} />
      </View>
    </View>
  );
}

/** Bouton Démarrer / Rattraper : zone de toucher ≥ 44, icône en relief, état appuyé. */
export function AgendaPlayButton({
  onPress,
  accessibilityLabel,
  style,
  testID,
}: {
  readonly onPress: () => void;
  readonly accessibilityLabel: string;
  readonly style?: object;
  readonly testID: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={[styles.touch, style]} testID={testID}>
      {({ pressed }) => <AgendaPlayIcon pressed={pressed} testID={`${testID}-icon`} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { width: AGENDA_ICON_SIZE, height: AGENDA_ICON_SIZE, alignItems: "center", justifyContent: "center" },
  touch: { minWidth: AGENDA_ICON_TOUCH, minHeight: AGENDA_ICON_TOUCH, alignItems: "center", justifyContent: "center" },
  disc: {
    width: AGENDA_ICON_SIZE,
    height: AGENDA_ICON_SIZE,
    borderRadius: AGENDA_ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  playRaised: {
    borderWidth: 1,
    borderColor: colors.agendaIconRaisedStroke,
    experimental_backgroundImage: `linear-gradient(to bottom, ${colors.agendaIconRaisedTop} 0%, ${colors.agendaIconRaisedBottom} 100%)`,
    // Figma : ombre large (0, 2,5, flou 3,5, noir 30 %) et ombre serrée (0, 0,8, flou 1, noir 22 %).
    boxShadow: "0px 2.5px 3.5px rgba(0, 0, 0, 0.3), 0px 0.8px 1px rgba(0, 0, 0, 0.22)",
  },
  playPressed: {
    borderWidth: 1,
    borderColor: colors.agendaIconRaisedStroke,
    backgroundColor: colors.agendaIconPressed,
    // Figma (colonne « Appuyé ») : ombre interne en haut (0, 1,5, flou 2, noir 28 %), ombre extérieure réduite (0, 0,5, flou 0,8, noir 10 %).
    boxShadow: "inset 0px 1.5px 2px rgba(0, 0, 0, 0.28), 0px 0.5px 0.8px rgba(0, 0, 0, 0.1)",
    transform: [{ scale: AGENDA_ICON_PRESSED_SCALE }],
  },
  // Triangle 10 × 12 posé à x = 11 dans le disque de 28 (centre optique décalé de 1 vers la droite).
  play: { width: 10, height: 12, marginLeft: 2 },
  square: { width: 9, height: 9, borderRadius: 1.5, backgroundColor: colors.agendaIconGlyph },
  check: { width: 14, height: 11 },
  cross: { width: 10, height: 10 },
  clock: { width: 16, height: 16 },
  ringTrack: { position: "absolute", borderWidth: RING_WIDTH, borderColor: colors.agendaIconPartialTrack },
  // Arc de trois quarts depuis 12 h, sens horaire : bords haut, droit et bas colorés, tournés de 45° (le bord haut couvre
  // alors 12 h → 3 h).
  ringArc: {
    position: "absolute",
    borderWidth: RING_WIDTH,
    borderTopColor: colors.agendaIconPartial,
    borderRightColor: colors.agendaIconPartial,
    borderBottomColor: colors.agendaIconPartial,
    borderLeftColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },
});
