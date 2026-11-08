import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { MediaPreview, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { formatActivityCount } from "@/features/sessions/formatSessionSummary";
import { formatCatalogueSessionDuration, type CatalogueCategoryRef, type SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { sessionFormatOf } from "@/features/sessions/sessionFormats";
import { strings } from "@/shared/i18n";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (epic E, story E.2) — carte UNIQUE d'une Séance dans le Catalogue (spécification « Carte de
 * séance et catalogue des séances » du 27/10 §1 et §3 ; DSF `Contexte=Catalogue` : `6214:3572`
 * replié, `6214:3625` archivé, `6214:3696` déployé). Une seule disposition, qu'une Séance contienne
 * un Exercice ou plusieurs (D-449 §6). Présentation pure : elle ne lit ni n'écrit rien ; elle affiche
 * la projection de lecture (`projectSessionForCatalogue`, E.1).
 *
 * D-504 à D-506 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §5 ; Figma
 * « DSF / Cards / Séance » `6214:7276`) :
 * - Carte de 72 (repliée et archivée), en-tête de 72 dans la dépliée. Photo 64 à 4 du bord gauche,
 *   haut et bas, rayon 8. Colonne des symboles à 8 de la photo, symboles centrés dans 10 (chevron,
 *   catégorie, haltère) ; textes alignés après cette colonne, à 8 du haut et du bas.
 * - Chevron à gauche du nom sur TOUTES les cartes : → repliée, ↓ dépliée ; cible ≥ 44 (`minTouchTarget`, 48).
 * - Durée en haut à droite, à 12 du bord, sans sablier, sur la ligne de base du nom ; le nom est
 *   tronqué (« … ») avant la durée.
 * - Ligne 3 « N circuits · N exercices » (`formatSessionStructureLine`, D-505).
 * - Démarrer : pilule de 24 en bas à droite (12 du bord droit, 8 du bas), fond `background` du
 *   catalogue des séances, texte bleu KODJO 12 Medium, sans liseré, ombre 0/2/4 noir 14 %, cible ≥ 44
 *   (`minTouchTarget`, 48).
 *   Masqué sur une carte archivée et dans les modales de planification (`context="planning"`).
 * - Fond blanc, liseré existant à 50 %, ombre existante (0/2/10, 8 %).
 * [Avant : carte de 80, visuel à 8 du bord, chevron après le nom, sablier, synthèse « format ou
 * volume » (« jamais 1 exercice »), action lecture ronde de 48 à droite — remplacé le 06/11/2026.]
 *
 * Zones de toucher (D-504, précision de Hermann du 06/11/2026 : « toucher la photo ouvre la
 * composition de séance en modification ; Démarrer exécute la séance ; le chevron et toute la zone
 * centrale de la carte déploient/replient la séance ; toucher toute la zone déployée ouvre la séance
 * en modification. Ces cibles sont distinctes. ») : la photo et la zone déployée interceptent leur
 * toucher (`onOpen`) ; Démarrer intercepte le sien (`onStart`) ; le chevron déploie
 * (`onToggleExpanded`) ; le reste de la zone centrale et le glissé sont portés par l'appelant
 * (`SwipeActionsRow`, E.5), qui déploie ou replie.
 * - Démarrer sans `onStart` : présent, désactivé et annoncé indisponible (CE-T03-01 : aucune
 *   Exécution livrée) ; son toucher est intercepté et n'ouvre rien.
 */

/** D-504 : contexte d'affichage — `planning` (modales de planification) masque Démarrer. */
export type SessionCardContext = "catalogue" | "planning";

export type SessionCardProps = {
  readonly projection: SessionCatalogueProjection;
  readonly expanded?: boolean;
  readonly onToggleExpanded?: () => void;
  /** D-504 : toucher de la photo ou de la composition déployée — ouvre la Séance en modification. */
  readonly onOpen?: () => void;
  /** D-504 : Démarrer exécute la Séance ; absent, Démarrer reste présent et indisponible. */
  readonly onStart?: () => void;
  /** D-504 : `planning` (« Choisir une séance », « Sélectionner une/plusieurs séances ») masque Démarrer. */
  readonly context?: SessionCardContext;
  /** E.3 : composition déployée, rendue sous l'en-tête. */
  readonly children?: ReactNode;
};

const CHEVRON_ICON = require("../../../assets/icons/icon-catalogue-chevron.svg");
const CATEGORY_ICON = require("../../../assets/icons/icon-catalogue-categorie.svg");
const EXERCISES_ICON = require("../../../assets/icons/icon-catalogue-haltere.svg");

const t = strings.screens.sessions.catalogueCard;
const CATEGORY_SEPARATOR = " · ";

/**
 * D-505 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §5) : ligne 3
 * « N circuits · N exercices » ; le nombre de circuits est omis sans circuit ou pour un seul circuit
 * joué une seule fois (`shownCircuitCount`) ; « 1 exercice » pour une Séance d'un seul Exercice ;
 * « 0 exercice » pour une Séance vide (Q-E6). [Avant : format, sinon N exercices, sinon volume de
 * l'Exercice unique, « jamais 1 exercice » — remplacé.]
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
 * Nombre de catégories affichées entières sur la largeur `available` (spécification §1 : « +N »
 * lorsqu'elles dépassent, jamais tronquées en milieu de mot). `nameWidths` : largeur de chaque nom ;
 * `separatorWidth` : largeur du séparateur ; `overflowWidth(n)` : largeur de « +n » précédé de son
 * espace. Au moins une catégorie reste affichée (le nom seul est alors tronqué par le texte).
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

export function SessionCard({
  projection,
  expanded = false,
  onToggleExpanded,
  onOpen,
  onStart,
  context = "catalogue",
  children,
}: SessionCardProps) {
  const archived = projection.status === "ARCHIVED";
  const incomplete = projection.incomplete;
  // PRE-9, contre-recette n° 3 (cr4-verifier) : carte orange « Paramètre à vérifier » ; le rouge prime.
  const toVerify = !incomplete && projection.toVerify;
  const flagged = incomplete || toVerify;
  const id = projection.id;
  const duration = formatCatalogueSessionDuration(projection.duration);
  // D-504 : Démarrer masqué sur une carte archivée et dans les modales de planification.
  const showStart = !archived && context !== "planning";
  const startAvailable = onStart !== undefined;

  return (
    <View
      style={[
        styles.card,
        archived ? styles.cardArchived : null,
        incomplete ? styles.cardIncomplete : toVerify ? styles.cardToVerify : null,
      ]}
      testID={`session-card-${id}`}
    >
      <View style={[styles.header, flagged ? styles.headerFlagged : null]} testID={`session-card-${id}-header`}>
        {/* D-504 : la photo ouvre la Séance en modification. Pour VoiceOver, la carte reste un seul
            élément (ouverture : action nommée de l'appelant). */}
        <Pressable
          onPress={onOpen}
          accessible={false}
          style={[styles.visualTarget, flagged ? styles.visualTargetFlagged : null]}
          testID={`session-card-${id}-visual-open`}
        >
          <CardVisual projection={projection} />
        </Pressable>
        <View style={[styles.texts, flagged ? styles.textsFlagged : null]} testID={`session-card-${id}-texts`}>
          <View style={styles.titleRow}>
            {/* D-504 : chevron à gauche du nom sur toute carte ; → repliée, ↓ dépliée. */}
            <Pressable
              onPress={onToggleExpanded}
              accessibilityRole="button"
              accessibilityLabel={fillTemplate(expanded ? t.collapseAccessibilityLabel : t.expandAccessibilityLabel, {
                name: projection.name,
              })}
              accessibilityState={{ expanded }}
              hitSlop={CHEVRON_HIT_SLOP}
              style={styles.symbolColumn}
              testID={`session-card-${id}-disclosure`}
            >
              <Image
                source={CHEVRON_ICON}
                style={[styles.chevronIcon, expanded ? styles.chevronDown : styles.chevronRight]}
                accessible={false}
                testID={`session-card-${id}-chevron${expanded ? "-open" : ""}`}
              />
            </Pressable>
            {/* D-506 : durée sur la ligne de base du nom ; le nom est tronqué avant elle. */}
            <View style={styles.nameAndDuration}>
              <Text style={styles.name} numberOfLines={1} testID={`session-card-${id}-name`}>
                {projection.name}
              </Text>
              <Text style={styles.duration} numberOfLines={1} testID={`session-card-${id}-duration`}>
                {duration}
              </Text>
            </View>
          </View>
          <View style={[styles.metaRows, showStart ? styles.besideStart : null]}>
            <CategoryLine categories={projection.categories} testID={`session-card-${id}-categories`} />
            <View style={styles.metaRow}>
              <View style={styles.symbolColumn}>
                <Image source={EXERCISES_ICON} style={styles.exercisesIcon} accessible={false} />
              </View>
              <Text style={styles.meta} numberOfLines={1} testID={`session-card-${id}-summary`}>
                {formatSessionStructureLine(projection)}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {showStart ? (
        // D-504 : Démarrer intercepte son toucher, jamais transmis à la carte. Sans `onStart`, présent
        // et désactivé (CE-T03-01, aucune Exécution livrée).
        <Pressable
          onPress={startAvailable ? onStart : () => undefined}
          accessibilityRole="button"
          accessibilityLabel={startAvailable ? t.start : t.startUnavailableAccessibilityLabel}
          accessibilityState={startAvailable ? undefined : { disabled: true }}
          hitSlop={START_HIT_SLOP}
          style={[styles.start, flagged ? styles.startFlagged : null]}
          testID={`session-card-${id}-start`}
        >
          <Text style={[styles.startLabel, startAvailable ? null : styles.startLabelUnavailable]} numberOfLines={1}>
            {t.start}
          </Text>
        </Pressable>
      ) : null}
      {expanded ? (
        // D-504 : toute la zone déployée ouvre la Séance en modification.
        <Pressable onPress={onOpen} accessible={false} testID={`session-card-${id}-expanded-open`}>
          {children}
        </Pressable>
      ) : null}
    </View>
  );
}

function CardVisual({ projection }: { readonly projection: SessionCatalogueProjection }) {
  const resolveUri = useMediaUriResolver();
  const id = projection.id;
  if (projection.visual.kind === "MEDIA") {
    return (
      <View style={styles.visual}>
        <MediaPreview
          uri={resolveUri(projection.visual.source.uri)}
          isVideo={projection.visual.source.isVideo}
          imageStyle={styles.visualImage}
          fallbackStyle={[styles.visualImage, styles.visualFallback]}
          imageTestID={`session-card-${id}-photo`}
          fallbackTestID={`session-card-${id}-photo-fallback`}
        />
      </View>
    );
  }
  return (
    <View style={styles.visual}>
      <Image
        source={sessionFormatOf(projection.visual.format).thumbnail}
        style={styles.visualImage}
        accessible={false}
        testID={`session-card-${id}-format-${projection.visual.format}`}
      />
    </View>
  );
}

/** Ligne des catégories : pastille, noms entiers, « +N » mesuré sur la largeur disponible. */
function CategoryLine({ categories, testID }: { readonly categories: readonly CatalogueCategoryRef[]; readonly testID: string }) {
  const [available, setAvailable] = useState<number | null>(null);
  const [widths, setWidths] = useState<Readonly<Record<string, number>>>({});
  if (categories.length === 0) {
    return <View style={styles.metaRow} testID={`${testID}-empty`} />;
  }
  const measure = (key: string) => (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setWidths((current) => (current[key] === width ? current : { ...current, [key]: width }));
  };
  const names = categories.map((category) => category.name);
  const overflowLabel = (hidden: number) => fillTemplate(t.categoriesOverflow, { count: String(hidden) });
  const measured =
    available !== null && names.every((name) => widths[`n:${name}`] !== undefined) && widths.sep !== undefined;
  const shown = measured
    ? fitCategoryCount(
        names.map((name) => widths[`n:${name}`]!),
        widths.sep!,
        (hidden) => widths[`o:${hidden}`] ?? Number.POSITIVE_INFINITY,
        available,
      )
    : names.length;
  const hidden = names.length - shown;
  const label = names.slice(0, shown).join(CATEGORY_SEPARATOR);
  return (
    <View style={styles.metaRow} testID={testID}>
      <View style={styles.symbolColumn}>
        <Image source={CATEGORY_ICON} style={styles.categoryIcon} accessible={false} />
      </View>
      <View
        style={styles.categoryTexts}
        onLayout={(event) => setAvailable(event.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={names.join(", ")}
        testID={`${testID}-texts`}
      >
        <Text style={styles.meta} numberOfLines={1} testID={`${testID}-label`}>
          {label}
          {hidden > 0 ? ` ${overflowLabel(hidden)}` : ""}
        </Text>
        {/* Mesures hors écran : chaque nom, le séparateur et chaque « +N » possible. */}
        <View style={styles.measure} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {names.map((name, index) => (
            <Text key={`n:${name}`} style={styles.meta} onLayout={measure(`n:${name}`)} testID={`${testID}-measure-name-${index}`}>
              {name}
            </Text>
          ))}
          <Text style={styles.meta} onLayout={measure("sep")} testID={`${testID}-measure-separator`}>
            {CATEGORY_SEPARATOR}
          </Text>
          {names.slice(1).map((_, index) => (
            <Text
              key={`o:${index + 1}`}
              style={styles.meta}
              onLayout={measure(`o:${index + 1}`)}
              testID={`${testID}-measure-overflow-${index + 1}`}
            >
              {` ${overflowLabel(index + 1)}`}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const CARD_BORDER = 0.5;
/**
 * Contre-recette du 30/10/2026 : liseré d'une Séance incomplète, celui de la carte d'Exercice à
 * compléter de la Composition (`OCCURRENCE_CARD_BORDER_WIDTH`, `occurrenceCardIncompleteSurface`).
 */
const INCOMPLETE_BORDER = 1;
/**
 * D-501 / D-504 (Hermann, 06/11/2026 ; §3 et §5) : liseré existant (`colors.cardsBorder` #CCD1E0,
 * `colors.cardsArchiveBorder` #D9D9D9) à 50 % d'opacité — valeurs dérivées, sans jeton dédié.
 */
const CARD_BORDER_COLOR = "rgba(204, 209, 224, 0.5)";
const CARD_ARCHIVED_BORDER_COLOR = "rgba(217, 217, 217, 0.5)";
const VISUAL_SIZE = 64;
/** D-504 : photo à 4 du bord gauche, haut et bas (rayon 8, concentrique : 12 − 4). */
const PHOTO_EDGE = spacing[4];
/** D-504 : colonne des symboles à 8 de la photo ; symboles centrés dans 10. */
const SYMBOL_GAP = spacing[8];
const SYMBOL_COLUMN = 10;
/** Figma `6214:3572` : textes à 7 de la colonne des symboles (6,92 à 7,08 selon la ligne). */
const SYMBOL_TEXT_GAP = 7;
/** D-504 : textes à 8 du haut et du bas ; durée et Démarrer à 12 du bord droit. */
const TEXT_EDGE = spacing[8];
const RIGHT_EDGE = spacing[12];
const TITLE_ROW_HEIGHT = 20;
const META_ROW_HEIGHT = 16;
const ROW_GAP = spacing[2];
/** D-504 : pilule Démarrer de 24 (Figma 76 de large, 10 de marge interne), à 8 du bas de l'en-tête. */
const START_HEIGHT = 24;
const START_WIDTH = 76;
const START_BOTTOM = spacing[8];
const START_SLOP = (minTouchTarget - START_HEIGHT) / 2;
const START_HIT_SLOP = { top: START_SLOP, bottom: START_SLOP, left: 0, right: 0 } as const;
/** Glyphe du chevron (20 × 20, `icon-catalogue-chevron.svg`) centré dans la colonne de 10. */
const CHEVRON_GLYPH = 20;
/**
 * D-504 / §9 : cible du chevron portée à `minTouchTarget` (48, au moins les 44 exigés) ; à gauche, elle s'arrête au bord de la photo (8) pour
 * garder les cibles distinctes, le complément passe à droite.
 */
const CHEVRON_HIT_SLOP = {
  top: (minTouchTarget - TITLE_ROW_HEIGHT) / 2,
  bottom: (minTouchTarget - TITLE_ROW_HEIGHT) / 2,
  left: SYMBOL_GAP,
  right: minTouchTarget - SYMBOL_COLUMN - SYMBOL_GAP,
} as const;
/** Hauteur de l'en-tête replié (D-504 : carte de 72 ; Figma `6214:3572`). [Avant : 80 — remplacé.] */
export const SESSION_CARD_HEADER_HEIGHT = 72;

const styles = StyleSheet.create({
  // D-501 / D-504 : fond blanc, liseré 0,5 à 50 %, rayon 12, ombre existante 8 % 0/2/10.
  // [Avant : fond `surfaceSubtle` #F9FAFC, liseré plein — remplacé le 06/11/2026.]
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
  // Figma `6214:3625` (archivée) : fond `color/surface`, liseré d'archive.
  cardArchived: {
    backgroundColor: colors.surface,
    borderColor: CARD_ARCHIVED_BORDER_COLOR,
  },
  // Contre-recette iPhone du 30/10/2026 (Hermann : « Une séance incomplète doit avoir le même format
  // qu'un exercice incomplet (fond rouge liseré rouge) ») : mêmes jetons que la carte d'Exercice à
  // compléter (`colors.dangerSurface`, bord 1 `colors.danger`) ; le contenu ne bouge pas (marges
  // compensées du demi-point de bord en plus).
  cardIncomplete: {
    backgroundColor: colors.dangerSurface,
    borderWidth: INCOMPLETE_BORDER,
    borderColor: colors.danger,
  },
  // PRE-9, contre-recette n° 3 du 31/10/2026 (cr4-verifier, Hermann : « La carte de la séance dans le
  // catalogue de séances doit aussi être orange. ») : mêmes jetons que la carte d'Exercice « à
  // vérifier » de la Composition (`occurrenceCardToVerifySurface` : `toVerifyColors`, bord 1), même
  // compensation des marges que la carte à compléter. Rendu choisi sans maquette. Sans liseré depuis le 08/11/2026, comme la carte
  // d'Exercice (Hermann : « pas de liseré orange ») ; bord transparent. [Liseré `toVerifyColors.border` — retiré.]
  cardToVerify: {
    backgroundColor: toVerifyColors.surface,
    borderWidth: INCOMPLETE_BORDER,
    borderColor: "transparent",
  },
  header: {
    height: SESSION_CARD_HEADER_HEIGHT - 2 * CARD_BORDER,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  // Carte à compléter ou à vérifier : cotes compensées du bord 1.
  headerFlagged: {
    height: SESSION_CARD_HEADER_HEIGHT - 2 * INCOMPLETE_BORDER,
  },
  visualTarget: {
    marginLeft: PHOTO_EDGE - CARD_BORDER,
    marginTop: PHOTO_EDGE - CARD_BORDER,
  },
  visualTargetFlagged: {
    marginLeft: PHOTO_EDGE - INCOMPLETE_BORDER,
    marginTop: PHOTO_EDGE - INCOMPLETE_BORDER,
  },
  visual: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
    borderRadius: fixedRadii[8],
    overflow: "hidden",
  },
  visualImage: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
  },
  visualFallback: {
    backgroundColor: colors.surface,
  },
  // Colonne de texte : de la colonne des symboles (8 après la photo) jusqu'à 12 du bord droit.
  texts: {
    flex: 1,
    minWidth: 0,
    marginLeft: SYMBOL_GAP,
    paddingTop: TEXT_EDGE - CARD_BORDER,
    paddingRight: RIGHT_EDGE - CARD_BORDER,
    gap: ROW_GAP,
  },
  textsFlagged: {
    paddingTop: TEXT_EDGE - INCOMPLETE_BORDER,
    paddingRight: RIGHT_EDGE - INCOMPLETE_BORDER,
  },
  // Lignes 2 et 3 : arrêtées à 8 avant Démarrer quand il est affiché.
  metaRows: {
    gap: ROW_GAP,
  },
  besideStart: {
    marginRight: START_WIDTH + spacing[8],
  },
  titleRow: {
    height: TITLE_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: SYMBOL_TEXT_GAP,
  },
  symbolColumn: {
    width: SYMBOL_COLUMN,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  // Glyphe 20 × 20 centré dans 10 ; pivoté : → repliée, ↓ dépliée (D-504).
  chevronIcon: {
    width: CHEVRON_GLYPH,
    height: CHEVRON_GLYPH,
    marginHorizontal: (SYMBOL_COLUMN - CHEVRON_GLYPH) / 2,
  },
  chevronRight: {
    transform: [{ rotate: "-90deg" }],
  },
  chevronDown: {
    transform: [{ rotate: "0deg" }],
  },
  nameAndDuration: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[6],
  },
  // Recette du 28/10/2026 (e2-10, texte agrandi) : sans interligne fixe, la ligne suit la taille de
  // la police et le bas des lettres n'est plus rogné.
  name: {
    ...type.listCardTitle,
    lineHeight: undefined,
    flexShrink: 1,
    color: colors.catalogueSessionTitle,
  },
  duration: {
    ...type.cardDuration,
    lineHeight: undefined,
    marginLeft: "auto",
    color: colors.textPrimary,
  },
  metaRow: {
    height: META_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: SYMBOL_TEXT_GAP,
  },
  categoryIcon: {
    width: 14,
    height: 14,
    marginHorizontal: (SYMBOL_COLUMN - 14) / 2,
  },
  // D-504 : haltère 12 de large, centré dans la colonne de 10.
  exercisesIcon: {
    width: 12,
    height: 12,
    marginHorizontal: (SYMBOL_COLUMN - 12) / 2,
  },
  categoryTexts: {
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
  // Figma `6214:3572` : métadonnées Inter Regular 12, `#595E66` (`colors.textSecondary`).
  // [Avant : `colors.movementCardDescription` — remplacé le 06/11/2026.]
  meta: {
    ...type.supporting,
    flexShrink: 1,
    color: colors.textSecondary,
  },
  // D-504 : pilule Démarrer — fond `color/catalogue/seances/background`, sans liseré, ombre des
  // actions contextuelles (0 / 2 / 4, noir 14 %), à 12 du bord droit et 8 du bas de l'en-tête.
  start: {
    position: "absolute",
    top: SESSION_CARD_HEADER_HEIGHT - START_BOTTOM - START_HEIGHT - CARD_BORDER,
    right: RIGHT_EDGE - CARD_BORDER,
    width: START_WIDTH,
    height: START_HEIGHT,
    borderRadius: START_HEIGHT / 2,
    paddingHorizontal: spacing[10],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.catalogueSessionsBackground,
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  startFlagged: {
    top: SESSION_CARD_HEADER_HEIGHT - START_BOTTOM - START_HEIGHT - INCOMPLETE_BORDER,
    right: RIGHT_EDGE - INCOMPLETE_BORDER,
  },
  // Inter Medium 12 (même style que `movementCardLevel`), bleu KODJO.
  startLabel: {
    ...type.movementCardLevel,
    lineHeight: undefined,
    color: colors.primary,
  },
  // CE-T03-01 : aucune Exécution livrée — même atténuation que l'ancienne action lecture (0,55).
  startLabelUnavailable: {
    opacity: 0.55,
  },
});
