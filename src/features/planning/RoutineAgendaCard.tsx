import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ParcoursBadge } from "@/features/planning/ParcoursBadge";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { strings } from "@/shared/i18n";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";

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
 *
 * D-553 (21/11/2026 ; Figma `12906:47`) : une carte par Séance, au même format pour toutes — titre = nom de la Séance ; dans un
 * parcours, cadre décalé de 10 (70 de large, même bord droit) pour que le lien vertical passe sur les traits ; Exécution hors
 * planification : « Hors planification » en tête de la ligne 2 ; Séance suivante d'un parcours non lancé : aucune action.
 */

/** D-540 : `EXPIRED` — créneau manqué dont le délai de rattrapage est passé. */
/** D-568 / RM-276 : `DELETED` — occurrence (ou Séance de parcours) supprimée depuis l'Agenda, gardée comme trace. */
export type AgendaStatus = "UPCOMING" | "MISSED" | "EXPIRED" | "COMPLETED" | "PARTIAL" | "STOPPED" | "DELETED";

/** Cadre, trait et bande (bande = cadre à 18 %). Gris, vert et rouge : Figma ; bleu et orange : même construction. */
const TINTS: Readonly<Record<AgendaStatus, { readonly frame: string; readonly bar: string; readonly band: string }>> = {
  UPCOMING: { frame: "#E3ECFF", bar: "#8EAAE8", band: "rgba(227, 236, 255, 0.18)" },
  MISSED: { frame: "#FCE5E5", bar: "#E58F8F", band: "rgba(252, 229, 229, 0.18)" },
  // D-540 (DSF Agenda § 10) : le créneau expiré garde le cadre, la bande et les traits rouges de la séance manquée.
  EXPIRED: { frame: "#FCE5E5", bar: "#E58F8F", band: "rgba(252, 229, 229, 0.18)" },
  COMPLETED: { frame: "#E0F5E8", bar: "#8FCCA8", band: "rgba(224, 245, 232, 0.18)" },
  PARTIAL: { frame: "#FDECD9", bar: "#EDB16E", band: "rgba(253, 236, 217, 0.18)" },
  STOPPED: { frame: "#F0F0F5", bar: "#B8BAC9", band: "rgba(240, 240, 245, 0.18)" },
  // D-568 (Figma `12906:124`, « Dos et mobilité (occurrence supprimée) ») : cadre, traits et bande gris.
  DELETED: { frame: "#F6F6F9", bar: "#D9DBE3", band: "rgba(246, 246, 249, 0.18)" },
};

/** D-568 (Figma `12906:124`) : texte de la carte supprimée en gris (heure, durée, nom, ligne 2). */
const DELETED_TEXT = "#8F949E";

/** Étiquette de statut d'une occurrence exécutée. */
const TAGS: Readonly<Partial<Record<AgendaStatus, { readonly label: string; readonly background: string; readonly text: string }>>> = {
  COMPLETED: { label: strings.planning.calendar.status.completed, background: "#E5F5ED", text: "#1A995C" },
  PARTIAL: { label: strings.planning.calendar.status.partial, background: "#FDECD9", text: "#B5620B" },
  STOPPED: { label: strings.planning.calendar.status.stopped, background: "#EDEEF3", text: "#6B6E80" },
  // D-540 (DSF Agenda § 10, Figma « P-Calendrier — Semaine — Créneau expiré (proposition) ») : étiquette 76 × 24, fond #FCE6E6,
  // texte #B33838, à la place de « Rattraper ».
  EXPIRED: { label: strings.planning.calendar.status.expired, background: "#FCE6E6", text: "#B33838" },
  // D-568 (Figma `12906:133`) : pastille grise « Supprimée » à la place de l'action.
  DELETED: { label: strings.planning.calendar.status.deleted, background: "#EDF0F2", text: "#737882" },
};

export const AGENDA_ROW_HEIGHT = 52;
const FRAME_WIDTH = 80;
/** Traits verticaux épais du cadre (gauche) et de la bande (droite). */
export const AGENDA_BAR_WIDTH = 6;
const BAR_WIDTH = AGENDA_BAR_WIDTH;
/** D-553 (Figma `12906:75`) : décalage du cadre d'une Séance de parcours, donc de son trait de gauche. */
export const AGENDA_PARCOURS_FRAME_OFFSET = 10;

/** Couleur des traits verticaux d'une carte selon son statut. */
export function agendaBarColor(status: AgendaStatus): string {
  return TINTS[status].bar;
}
const CHEVRON_SIZE = 16;
const CHRONOMETER = require("../../../assets/icons/icon-agenda-chronometre.svg");
const CHEVRON = require("../../../assets/icons/icon-suivant.svg");
/** Texte agrandi : la carte suit jusqu'à 1,6 fois, au-delà les lignes restent lisibles sans écraser la rangée. */
const MAX_SCALE = 1.6;

export function RoutineAgendaCard({
  time,
  duration,
  name,
  parcours = false,
  inParcours = false,
  detailPrefix = "",
  timeMarked = false,
  startable = true,
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
  /** Routine à plusieurs séances : repère « P » devant le nom (recette du 20/11/2026, constat A). */
  readonly parcours?: boolean;
  /** D-553 : carte d'une Séance de parcours (cadre décalé, Figma `12906:73`). */
  readonly inParcours?: boolean;
  /** D-553 : début de la ligne 2 — « Hors planification » (à la place de la spécialité, Figma `12906:106`). */
  readonly detailPrefix?: string;
  /**
   * D-560 (22/11/2026), développé le 23/11/2026 : séance hors de la répétition d'une routine — petite astérisque collée à
   * l'heure (« 17h05* »), même couleur, plus petite ; sans légende.
   */
  readonly timeMarked?: boolean;
  /** D-553 (arbitrage 5) : faux — aucune action à droite (Séance suivante d'un parcours non lancé). */
  readonly startable?: boolean;
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
  const muted = status === "DELETED" ? styles.deletedText : null;
  return (
    <View style={styles.row} testID={testID}>
      <View style={[styles.band, { backgroundColor: colorsOf.band }]} testID={`${testID}-band`} />
      <View style={[styles.bar, styles.barRight, { backgroundColor: colorsOf.bar }]} />
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={strings.planning.calendar.openRoutine}
        style={[styles.frame, inParcours ? styles.frameInParcours : null, { backgroundColor: colorsOf.frame }]}
        testID={`${testID}-frame`}
      >
        <View style={[styles.bar, { backgroundColor: colorsOf.bar }]} testID={`${testID}-status-${status}`} />
        <Text style={[styles.time, muted]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} adjustsFontSizeToFit testID={`${testID}-time`}>
          {/* Heure seule quand la séance n'est pas marquée (contenu inchangé). */}
          {timeMarked
            ? [
                time,
                <Text key="mark" style={styles.timeMark} testID={`${testID}-time-mark`}>
                  *
                </Text>,
              ]
            : time}
        </Text>
        {duration === "" ? null : (
          <View style={styles.durationLine}>
            <View style={styles.chronometerBox}>
              <Image source={CHRONOMETER} style={styles.chronometer} accessible={false} />
            </View>
            <Text style={[styles.secondary, muted]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} adjustsFontSizeToFit testID={`${testID}-duration`}>
              {duration}
            </Text>
          </View>
        )}
      </Pressable>
      <View style={styles.body}>
        <Pressable
          onPress={onToggleExpanded}
          accessibilityRole="button"
          accessibilityLabel={expanded ? strings.planning.calendar.collapseRoutine : strings.planning.calendar.expandRoutine}
          accessibilityState={{ expanded }}
          style={styles.center}
          testID={`${testID}-disclosure`}
        >
          <View style={styles.titleLine}>
            <Image source={CHEVRON} style={[styles.chevron, expanded ? styles.chevronDown : null]} accessible={false} testID={`${testID}-chevron${expanded ? "-open" : ""}`} />
            {/* Recette du 20/11/2026 (Hermann) : « mettre le symbole du Parcours après le nom, pas avant, et affiner le trait
                du cercle ». [Repère devant le nom, trait de 1,5 — remplacé.] [Trait de 1 : valeur technique.] */}
            <Text style={[styles.name, muted]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-name`}>
              {name}
            </Text>
            {parcours ? <ParcoursBadge placement="after" stroke={1} testID={`${testID}-parcours`} /> : null}
          </View>
          {/* Même recette : « mettre le symbole de la zone corporelle avant le texte de la deuxième ligne » (pastille des zones
              de la carte du Journal). */}
          <View style={styles.detailLine}>
            {detailPrefix === "" ? null : (
              <Text style={[styles.secondary, muted]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-detail-prefix`}>
                {detail === "" ? detailPrefix : `${detailPrefix} ·`}
              </Text>
            )}
            {detail === "" ? null : <KodjoIcon name="card-body-zone-badge" testID={`${testID}-zones-badge`} />}
            <Text style={[styles.secondary, styles.detail, muted]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1} testID={`${testID}-detail`}>
              {detail}
            </Text>
          </View>
        </Pressable>
        {/* Recette du 20/11/2026 (Hermann) : « La zone tactile doit être découpée en trois zones (toute la hauteur de la
            carte) : gauche (carte), centre (zone du nom et de la ligne du dessous), droit (zone de la pastille) » ; « lorsque
            la pastille à droite n'est pas "Démarrer", appuyer sur cette zone ne doit pas ouvrir un écran mais elle ne doit
            rien faire ». [Pastille seule tactile, le reste de la droite ouvrait la planification — remplacé.] */}
        {tag !== undefined ? (
          <Pressable onPress={() => undefined} accessible={false} style={styles.action} testID={`${testID}-action-zone`}>
            <View style={[styles.tag, { backgroundColor: tag.background }]} accessible accessibilityLabel={tag.label} testID={`${testID}-status-tag`}>
              <Text style={[styles.tagLabel, { color: tag.text }]} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1}>
                {tag.label}
              </Text>
            </View>
          </Pressable>
        ) : !startable ? (
          // D-553 (arbitrage 5) : on lance le parcours depuis sa première Séance ; zone droite sans effet.
          <Pressable onPress={() => undefined} accessible={false} style={styles.action} testID={`${testID}-action-zone`} />
        ) : (
          // D-536, point 5 (20/11/2026) : « Rattraper » sur une occurrence passée non commencée, « Démarrer » sinon.
          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel={status === "MISSED" ? strings.planning.calendar.catchUp : strings.planning.calendar.start}
            style={styles.action}
            testID={`${testID}-start`}
          >
            <View style={styles.start}>
              <Text style={styles.startLabel} maxFontSizeMultiplier={MAX_SCALE} numberOfLines={1}>
                {status === "MISSED" ? strings.planning.calendar.catchUp : strings.planning.calendar.start}
              </Text>
            </View>
          </Pressable>
        )}
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
  // Figma `12906:75` : cadre d'une Séance de parcours à x = 10 de l'écran, 70 de large.
  frameInParcours: { marginLeft: AGENDA_PARCOURS_FRAME_OFFSET, width: FRAME_WIDTH - AGENDA_PARCOURS_FRAME_OFFSET },
  time: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 15, color: colors.textPrimary },
  // D-560 (22/11/2026), développé le 23/11/2026 : astérisque de l'heure — 11 pour une heure de 15 ; couleur héritée de l'heure.
  timeMark: { fontSize: 11 },
  durationLine: { flexDirection: "row", alignItems: "center", gap: 3 },
  chronometerBox: { width: 14, height: 14, alignItems: "center", justifyContent: "center" },
  chronometer: { width: 10.8333, height: 12.5833 },
  // DSF Agenda § 5 (décision de Hermann du 20/11/2026) : tailles des cartes des catalogues — « Card name » = `type.listCardTitle`
  // (Inter Semi Bold 15), « Card metadata » = `type.supporting` (Inter Regular 12), sans interligne fixe comme la carte de
  // séance (`SessionCard`) : hauteurs inchangées. [16 et 13 en dur — remplacés.]
  secondary: { ...type.supporting, lineHeight: undefined, color: colors.textSecondary, flexShrink: 1 },
  // Trois zones tactiles sur toute la hauteur : les marges appartiennent au centre (gauche) et à la zone droite.
  body: { flex: 1, flexDirection: "row", alignItems: "stretch" },
  center: { flex: 1, paddingLeft: spacing[8], paddingVertical: spacing[4], justifyContent: "center", gap: 2 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 2 },
  chevron: { width: CHEVRON_SIZE, height: CHEVRON_SIZE },
  chevronDown: { transform: [{ rotate: "90deg" }] },
  // Nom à sa largeur (au plus la place disponible) : le repère « P » le suit immédiatement.
  name: { flexShrink: 1, ...type.listCardTitle, lineHeight: undefined, color: colors.textPrimary },
  detailLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  detail: {},
  // Action alignée en bas avec la ligne 2.
  action: { justifyContent: "flex-end", paddingVertical: spacing[4], paddingLeft: spacing[8], paddingRight: layout.screenGutter },
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
  deletedText: { color: DELETED_TEXT },
});
