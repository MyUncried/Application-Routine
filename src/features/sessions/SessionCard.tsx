import { Image } from "expo-image";
import { useCallback, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { MediaPreview, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { AgendaPlayButton, AGENDA_ICON_TOUCH, AGENDA_ICON_SIZE } from "@/features/planning/AgendaStatusIcon";
import { formatActivityCount } from "@/features/sessions/formatSessionSummary";
import { formatCatalogueSessionDuration, type SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { FREE_SESSION_FORMAT, sessionFormatOf } from "@/features/sessions/sessionFormats";
import { MOSAIC_SIZE, mosaicLayout } from "@/features/sessions/sessionMosaic";
import { strings } from "@/shared/i18n";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors, fixedRadii, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (epic E, story E.2) — carte UNIQUE d'une Séance dans le Catalogue. Présentation pure : elle ne lit ni n'écrit rien ;
 * elle affiche la projection de lecture (`projectSessionForCatalogue`, E.1).
 *
 * D-600, D-601 et D-602 (Hermann, 24-25/11/2026 ; DSF Carte de séance — visuel en mosaïque et informations ; Figma
 * `DSF / Cards / Séance — catalogue`, variantes `Repliée` `13168:28159` et `Sélection` `13186:50543`) :
 * - Carte repliée de 72, trois lignes, sans chevron. Visuel : mosaïque des images des mouvements (64, coins 8, à 4 des
 *   bords) ; sans image, vignette du format de la séance, sinon Libre (fin de l'ancienne cascade).
 * - Ligne 1 : nom. Ligne 2 : chronomètre, durée (règles inchangées, « ≥ » compris), point médian, noms des formats en
 *   semi-gras (« Libre » sans format). Ligne 3 : haltère, noms des mouvements distincts séparés par des virgules, sur une
 *   ligne ; ce qui ne tient pas devient « +N ».
 * - Démarrer : icône ronde de 28 à droite, centrée en hauteur, relief et état appuyé de D-599 (D-566 de la branche de
 *   documentation), ombre de la couleur du fond de la zone de contexte (`catalogueSessionsContext`). Action inchangée.
 * - Variante « Sélection » (`context="planning"`, modale « Planifier une séance — Sélectionner une séance ») : identique,
 *   sans Démarrer ; la pastille de la modale occupe la droite.
 * - Retirés de la carte repliée : chevron, catégories, nombre d'exercices, nombre de circuits, volume.
 * [Avant (D-504 à D-506, 06/11/2026) : photo du premier exercice, chevron à gauche du nom, durée en haut à droite, ligne
 * des catégories, ligne « N circuits · N exercices », pilule « Démarrer » de 24 en bas à droite — remplacé le 25/11/2026.]
 *
 * Zones de toucher (D-602) : toucher la carte (hors Démarrer) ouvre la composition en modification — porté par l'appelant
 * (`SwipeActionsRow` du catalogue) ; le visuel garde son comportement (`onOpen`) ; Démarrer intercepte son toucher
 * (`onStart`). Sans `onStart`, Démarrer reste présent, désactivé et annoncé indisponible (CE-T03-01).
 * Variante Déployée (conservée, D-602) : `expanded` + `children` rendent un contenu sous l'en-tête ; aucun écran du
 * catalogue ne l'ouvre.
 */

/** Contexte d'affichage — `planning` (modales de sélection) : variante « Sélection », sans Démarrer. */
export type SessionCardContext = "catalogue" | "planning";

export type SessionCardProps = {
  readonly projection: SessionCatalogueProjection;
  /** Variante Déployée conservée (D-602) : contenu `children` rendu sous l'en-tête. Aucun écran du catalogue ne l'ouvre. */
  readonly expanded?: boolean;
  /** Toucher du visuel (et de la zone déployée) — ouvre la Séance en modification. */
  readonly onOpen?: () => void;
  /** Démarrer exécute la Séance ; absent, Démarrer reste présent et indisponible. */
  readonly onStart?: () => void;
  readonly context?: SessionCardContext;
  readonly children?: ReactNode;
  /** Heure d'une occurrence, en gras devant la durée (ligne 2). Absente : rendu du Catalogue. */
  readonly timeLabel?: string;
};

// Recette iPhone du 26/11/2026 (Hermann : « Il faut que les traits du chronomètre soient aussi fins que les traits de
// l'haltère ») : même tracé que le chronomètre de l'Agenda, trait de 0,6 au lieu de 1,5 ; la carte de routine garde le sien.
const CHRONOMETER_ICON = require("../../../assets/icons/icon-carte-seance-chronometre.svg");
const MOVEMENTS_ICON = require("../../../assets/icons/icon-carte-seance-haltere.svg");

const t = strings.screens.sessions.catalogueCard;
const MIDDLE_DOT = " · ";

/**
 * D-505 (Hermann, 06/11/2026) : « N circuits · N exercices ». [D-601 (25/11/2026) : retiré de la carte repliée — conservé
 * pour ses appelants (accessibilité, tests).]
 */
export function formatSessionStructureLine(projection: Pick<SessionCatalogueProjection, "shownCircuitCount" | "exerciseCount">): string {
  const exercises = formatActivityCount(projection.exerciseCount);
  const circuits = projection.shownCircuitCount;
  if (circuits === null) return exercises;
  return fillTemplate(t.structureLine, {
    circuits: `${circuits} ${circuits === 1 ? t.circuitUnit.singular : t.circuitUnit.plural}`,
    exercises,
  });
}

/**
 * Nombre de noms affichés entiers sur la largeur `available`, « +N » pour les autres, jamais tronqués en milieu de mot.
 * `nameWidths` : largeur de chaque nom ; `separatorWidth` : largeur du séparateur ; `overflowWidth(n)` : largeur de « +n »
 * précédé de son espace. Au moins un nom reste affiché (il est alors tronqué par le texte). Ligne des mouvements (D-601) ;
 * à l'origine ligne des catégories (spécification du 27/10 §1).
 */
export function fitCategoryCount(
  nameWidths: readonly number[],
  separatorWidth: number,
  overflowWidth: (hidden: number) => number,
  available: number,
): number {
  const total = nameWidths.length;
  for (let shown = total; shown >= 1; shown -= 1) {
    const names = nameWidths.slice(0, shown).reduce((sum, width) => sum + width, 0) + separatorWidth * (shown - 1);
    const hidden = total - shown;
    if (names + (hidden > 0 ? overflowWidth(hidden) : 0) <= available) return shown;
  }
  return Math.min(total, 1);
}

/** Ligne 2 (D-601) : noms des formats, ou « Libre » sans format. */
export function sessionFormatsLabel(projection: Pick<SessionCatalogueProjection, "formatNames">): string {
  return projection.formatNames.length > 0 ? projection.formatNames.join(t.listSeparator) : sessionFormatOf(FREE_SESSION_FORMAT).label;
}

export function SessionCard({ projection, expanded = false, onOpen, onStart, context = "catalogue", children, timeLabel }: SessionCardProps) {
  const archived = projection.status === "ARCHIVED";
  const incomplete = projection.incomplete;
  // PRE-9, contre-recette n° 3 (cr4-verifier) : carte orange « Paramètre à vérifier » ; le rouge prime.
  const toVerify = !incomplete && projection.toVerify;
  const flagged = incomplete || toVerify;
  const border = flagged ? INCOMPLETE_BORDER : CARD_BORDER;
  const id = projection.id;
  const duration = formatCatalogueSessionDuration(projection.duration, projection.forTimeBound);
  // Démarrer masqué sur une carte archivée et dans la variante « Sélection ».
  const showStart = !archived && context !== "planning";
  const startAvailable = onStart !== undefined;

  return (
    <View
      style={[styles.card, archived ? styles.cardArchived : null, incomplete ? styles.cardIncomplete : toVerify ? styles.cardToVerify : null]}
      testID={`session-card-${id}`}
    >
      <View style={[styles.header, { height: SESSION_CARD_HEADER_HEIGHT - 2 * border }]} testID={`session-card-${id}-header`}>
        {/* Le visuel ouvre la Séance en modification (comportement conservé). Pour VoiceOver, la carte reste un seul élément. */}
        <Pressable
          onPress={onOpen}
          accessible={false}
          style={{ marginLeft: PHOTO_EDGE - border, marginTop: PHOTO_EDGE - border }}
          testID={`session-card-${id}-visual-open`}
        >
          <CardVisual projection={projection} />
        </Pressable>
        <View
          style={[
            styles.texts,
            { paddingTop: TEXT_EDGE - border, marginRight: (showStart ? START_COLUMN : context === "planning" ? SELECTION_COLUMN : RIGHT_EDGE) - border },
          ]}
          testID={`session-card-${id}-texts`}
        >
          <Text style={styles.name} numberOfLines={1} testID={`session-card-${id}-name`}>
            {projection.name}
          </Text>
          {/* Ligne 2 (D-601) : chronomètre, durée · formats (semi-gras). */}
          <View style={styles.durationRow} testID={`session-card-${id}-duration-line`}>
            <Image source={CHRONOMETER_ICON} style={styles.chronometerIcon} contentFit="contain" accessible={false} />
            <Text style={styles.meta} numberOfLines={1}>
              {timeLabel !== undefined ? (
                <Text style={styles.time} testID={`session-card-${id}-time`}>
                  {`${timeLabel}${MIDDLE_DOT}`}
                </Text>
              ) : null}
              <Text testID={`session-card-${id}-duration`}>{duration}</Text>
              {MIDDLE_DOT}
              <Text style={styles.formats} testID={`session-card-${id}-formats`}>
                {sessionFormatsLabel(projection)}
              </Text>
            </Text>
          </View>
          {/* Ligne 3 (D-601) : haltère, mouvements distincts, « +N » pour ce qui ne tient pas. */}
          <MovementLine names={projection.movementNames} testID={`session-card-${id}-movements`} />
        </View>
      </View>
      {showStart ? (
        // Démarrer intercepte son toucher, jamais transmis à la carte. Icône ronde de 28 (D-599), centrée en hauteur, bord
        // droit à 12 ; emplacement de toucher de 44 centré sur l'icône.
        <AgendaPlayButton
          onPress={onStart ?? (() => undefined)}
          disabled={!startAvailable}
          accessibilityLabel={startAvailable ? t.start : t.startUnavailableAccessibilityLabel}
          shadowColor={colors.catalogueSessionsContext}
          style={[styles.start, { top: (SESSION_CARD_HEADER_HEIGHT - AGENDA_ICON_TOUCH) / 2 - border, right: START_SLOT_RIGHT - border }]}
          testID={`session-card-${id}-start`}
        />
      ) : null}
      {expanded ? (
        // Variante Déployée (conservée) : toute la zone déployée ouvre la Séance en modification.
        <Pressable onPress={onOpen} accessible={false} testID={`session-card-${id}-expanded-open`}>
          {children}
        </Pressable>
      ) : null}
    </View>
  );
}

/** Visuel (D-600) : mosaïque des images des mouvements ; sans image, vignette du format, sinon Libre. */
function CardVisual({ projection }: { readonly projection: SessionCatalogueProjection }) {
  const resolveUri = useMediaUriResolver();
  const id = projection.id;
  // Recette iPhone du 26/11/2026 (Hermann, ligne « Séance sans photo » : « L'image est un cadre gris sans symbole ») : une
  // image définitivement illisible (fichier absent, photo en erreur, vidéo sans affiche) est traitée comme un mouvement sans
  // photo — ignorée de la mosaïque (D-600) ; sans aucune image lisible, vignette du format Libre, jamais un cadre gris vide.
  const [unavailable, setUnavailable] = useState<ReadonlySet<string>>(() => new Set());
  const imageId = (image: SessionCatalogueProjection["mosaic"][number]) => `${image.key}|${image.uri}`;
  const markUnavailable = useCallback((imageKey: string) => {
    setUnavailable((current) => (current.has(imageKey) ? current : new Set([...current, imageKey])));
  }, []);
  const images = projection.mosaic.filter((image) => !unavailable.has(imageId(image)));
  if (images.length === 0) {
    const format = projection.visual.kind === "FORMAT" ? projection.visual.format : FREE_SESSION_FORMAT;
    return (
      <View style={styles.visual}>
        <Image source={sessionFormatOf(format).thumbnail} style={styles.visualFull} accessible={false} testID={`session-card-${id}-format-${format}`} />
      </View>
    );
  }
  const layout = mosaicLayout(images.length);
  return (
    <View style={styles.visual} testID={`session-card-${id}-mosaic-${Math.min(images.length, 5)}`}>
      {layout.cells.map((cell, index) => {
        const image = images[index]!;
        const box = { width: cell.width, height: cell.height };
        return (
          <View key={image.key} style={[styles.cell, cell]} testID={`session-card-${id}-mosaic-cell-${index}`}>
            <MediaPreview
              uri={resolveUri(image.uri)}
              isVideo={image.isVideo}
              imageStyle={box}
              fallbackStyle={[box, styles.visualFallback]}
              crop={{ box, view: image.view }}
              onUnavailable={() => markUnavailable(imageId(image))}
              imageTestID={`session-card-${id}-photo-${index}`}
              fallbackTestID={`session-card-${id}-photo-${index}-fallback`}
            />
          </View>
        );
      })}
      {layout.counter ? (
        <View style={[styles.cell, layout.counter.cell, styles.counter]} testID={`session-card-${id}-mosaic-counter`}>
          <Text style={styles.counterLabel}>{fillTemplate(t.mosaicOverflow, { count: String(layout.counter.hidden) })}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Ligne des mouvements : noms entiers séparés par des virgules, « +N » mesuré sur la largeur disponible. */
function MovementLine({ names, testID }: { readonly names: readonly string[]; readonly testID: string }) {
  const [available, setAvailable] = useState<number | null>(null);
  const [widths, setWidths] = useState<Readonly<Record<string, number>>>({});
  const measure = (key: string) => (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setWidths((current) => (current[key] === width ? current : { ...current, [key]: width }));
  };
  const overflowLabel = (hidden: number) => fillTemplate(t.movementsOverflow, { count: String(hidden) });
  const measured = available !== null && names.every((_, index) => widths[`n:${index}`] !== undefined) && widths.sep !== undefined;
  const shown = measured
    ? fitCategoryCount(
        names.map((_, index) => widths[`n:${index}`]!),
        widths.sep!,
        (hidden) => widths[`o:${hidden}`] ?? Number.POSITIVE_INFINITY,
        available,
      )
    : names.length;
  const hidden = names.length - shown;
  return (
    <View style={styles.movementsRow} testID={testID}>
      <Image source={MOVEMENTS_ICON} style={styles.movementsIcon} contentFit="contain" accessible={false} />
      <View style={styles.movementTexts} onLayout={(event) => setAvailable(event.nativeEvent.layout.width)} testID={`${testID}-texts`}>
        <Text style={styles.meta} numberOfLines={1} testID={`${testID}-label`}>
          {names.slice(0, shown).join(t.listSeparator)}
          {hidden > 0 ? ` ${overflowLabel(hidden)}` : ""}
        </Text>
        {/* Mesures hors écran : chaque nom, le séparateur et chaque « +N » possible. */}
        <View style={styles.measure} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {names.map((name, index) => (
            <Text key={`n:${index}`} style={styles.meta} onLayout={measure(`n:${index}`)} testID={`${testID}-measure-name-${index}`}>
              {name}
            </Text>
          ))}
          <Text style={styles.meta} onLayout={measure("sep")} testID={`${testID}-measure-separator`}>
            {t.listSeparator}
          </Text>
          {names.slice(1).map((_, index) => (
            <Text key={`o:${index + 1}`} style={styles.meta} onLayout={measure(`o:${index + 1}`)} testID={`${testID}-measure-overflow-${index + 1}`}>
              {` ${overflowLabel(index + 1)}`}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const CARD_BORDER = 0.5;
/** Contre-recette du 30/10/2026 : liseré d'une Séance incomplète, celui de la carte d'Exercice à compléter. */
const INCOMPLETE_BORDER = 1;
/** D-501 / D-504 : liseré existant à 50 % d'opacité — valeurs dérivées, sans jeton dédié. */
const CARD_BORDER_COLOR = "rgba(204, 209, 224, 0.5)";
const CARD_ARCHIVED_BORDER_COLOR = "rgba(217, 217, 217, 0.5)";
/** Figma `13168:28159` : mosaïque à 4 des bords gauche, haut et bas ; textes à 8 de la mosaïque et du haut. */
const PHOTO_EDGE = spacing[4];
const VISUAL_TEXT_GAP = spacing[8];
const TEXT_EDGE = spacing[8];
/** Bord droit de l'icône Démarrer à 12 de la carte ; textes arrêtés à 8 avant elle. */
const RIGHT_EDGE = spacing[12];
const START_COLUMN = RIGHT_EDGE + AGENDA_ICON_SIZE + spacing[8];
/** L'emplacement de toucher de 44 dépasse l'icône de 8 de chaque côté. */
const START_SLOT_RIGHT = RIGHT_EDGE - (AGENDA_ICON_TOUCH - AGENDA_ICON_SIZE) / 2;
/** Case ronde de la sélection de planification (`PlanningSelection` : 24, à 12 du bord droit) et 8 d'écart. */
const SELECTION_COLUMN = 24 + spacing[12] + spacing[8];
const LINE_HEIGHT = 16;
/** Hauteur de la carte repliée (D-601 : 72 ; Figma `13168:28159`). */
export const SESSION_CARD_HEADER_HEIGHT = 72;

const styles = StyleSheet.create({
  // D-501 / D-504 : fond blanc, liseré 0,5 à 50 %, rayon 12, ombre existante 8 % 0/2/10.
  card: {
    borderRadius: fixedRadii[12],
    borderWidth: CARD_BORDER,
    borderColor: CARD_BORDER_COLOR,
    backgroundColor: colors.background,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardArchived: {
    backgroundColor: colors.surface,
    borderColor: CARD_ARCHIVED_BORDER_COLOR,
  },
  // Contre-recette du 30/10/2026 : même rendu qu'un exercice incomplet (fond rouge, liseré rouge).
  cardIncomplete: {
    backgroundColor: colors.dangerSurface,
    borderWidth: INCOMPLETE_BORDER,
    borderColor: colors.danger,
  },
  // PRE-9 (cr4-verifier) : carte orange « à vérifier », sans liseré (08/11/2026).
  cardToVerify: {
    backgroundColor: toVerifyColors.surface,
    borderWidth: INCOMPLETE_BORDER,
    borderColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  visual: {
    width: MOSAIC_SIZE,
    height: MOSAIC_SIZE,
    borderRadius: fixedRadii[8],
    overflow: "hidden",
  },
  visualFull: {
    width: MOSAIC_SIZE,
    height: MOSAIC_SIZE,
  },
  cell: {
    position: "absolute",
    overflow: "hidden",
  },
  visualFallback: {
    backgroundColor: colors.surface,
  },
  // Figma `13169:28168` / `13169:28169` : case « +N », fond #E3E6F2, Inter Semi Bold 14 #404573.
  counter: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sessionMosaicCounterSurface,
  },
  counterLabel: {
    ...type.listCardTitle,
    fontSize: 14,
    lineHeight: undefined,
    color: colors.sessionMosaicCounterText,
  },
  // Colonne de texte : à 8 de la mosaïque, jusqu'à Démarrer (ou la case de sélection). Lignes espacées de 2.
  texts: {
    flex: 1,
    minWidth: 0,
    marginLeft: VISUAL_TEXT_GAP,
    gap: spacing[2],
  },
  // Inter Semi Bold 15, #14171C ; sans interligne fixe (recette du 28/10/2026, e2-10 : bas des lettres non rogné).
  name: {
    ...type.listCardTitle,
    lineHeight: undefined,
    color: colors.catalogueSessionTitle,
  },
  durationRow: {
    height: LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  chronometerIcon: {
    width: 14,
    height: 14,
  },
  // Figma : Inter Regular 12, #595E66.
  meta: {
    ...type.supporting,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  formats: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  // Heure d'une occurrence en gras (Figma `1992:5101`).
  time: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    color: colors.textPrimary,
  },
  // Figma `13178:28148` : ligne des mouvements, retrait 2, écart 6 ; haltère 12 × 16.
  movementsRow: {
    height: LINE_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 1,
    gap: spacing[6] - 1,
  },
  movementsIcon: {
    width: 12,
    height: 16,
  },
  movementTexts: {
    flex: 1,
    minWidth: 0,
  },
  measure: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  start: {
    position: "absolute",
  },
});
