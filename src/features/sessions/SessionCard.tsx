import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { MediaPreview, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";
import { formatActivityCount } from "@/features/sessions/formatSessionSummary";
import type { CatalogueCategoryRef, SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { sessionFormatOf } from "@/features/sessions/sessionFormats";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (epic E, story E.2) — carte UNIQUE d'une Séance dans le Catalogue (spécification « Carte de
 * séance et catalogue des séances » du 27/10 §1 et §3 ; DSF `Contexte=Catalogue` : `6214:3572`
 * replié, `6214:3625` archivé, `6214:3696` déployé). Une seule disposition, qu'une Séance contienne
 * un Exercice ou plusieurs (D-449 §6). Présentation pure : elle ne lit ni n'écrit rien ; elle affiche
 * la projection de lecture (`projectSessionForCatalogue`, E.1).
 *
 * - Visuel carré 64 à 8 du bord (média de l'Exercice, sinon vignette Libre) ; texte à 84.
 * - Nom, suivi du chevron SEULEMENT pour plusieurs Exercices ; ce chevron est le seul contrôle de
 *   déploiement (E.3) ; il pointe vers le haut une fois ouvert.
 * - Catégories précédées de leur pastille, dédupliquées, « +N » quand elles dépassent la largeur,
 *   jamais coupées au milieu d'un mot (`fitCategoryCount`). Ni étiquette ni zone sur la carte.
 * - Synthèse : format, sinon N exercices, sinon volume ; puis la durée de séance (format D-443 de
 *   la Composition, `formatSessionDurationEstimate`).
 * - Lecture : présente sur toute carte active, cible 48 à 8 du bord, DÉSACTIVÉE et annoncée
 *   indisponible (aucune Exécution ; CE-T03-01). Un toucher sur elle n'ouvre rien.
 * - Archivée : aucune action directe ; la colonne de texte va jusqu'à la marge.
 *
 * Le toucher de la carte (ouvrir la Composition) et le glissé sont portés par l'appelant
 * (`SwipeActionsRow`, E.5) ; le chevron et Lecture interceptent leur propre toucher.
 */

export type SessionCardProps = {
  readonly projection: SessionCatalogueProjection;
  readonly expanded?: boolean;
  readonly onToggleExpanded?: () => void;
  /** E.3 : composition déployée, rendue sous l'en-tête. */
  readonly children?: ReactNode;
};

const CHEVRON_ICON = require("../../../assets/icons/icon-catalogue-chevron.svg");
const CATEGORY_ICON = require("../../../assets/icons/icon-catalogue-categorie.svg");
const EXERCISES_ICON = require("../../../assets/icons/icon-catalogue-haltere.svg");
const DURATION_ICON = require("../../../assets/icons/icon-catalogue-sablier.svg");

const t = strings.screens.sessions.catalogueCard;
const CATEGORY_SEPARATOR = " · ";

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

export function SessionCard({ projection, expanded = false, onToggleExpanded, children }: SessionCardProps) {
  const archived = projection.status === "ARCHIVED";
  const id = projection.id;
  const duration = formatSessionDurationEstimate(projection.duration);
  const summary =
    projection.summary.kind === "FORMAT"
      ? projection.summary.label
      : projection.summary.kind === "VOLUME"
        ? projection.summary.volume
        : formatActivityCount(projection.summary.count);

  return (
    <View style={[styles.card, archived ? styles.cardArchived : null]} testID={`session-card-${id}`}>
      <View style={styles.header}>
        <CardVisual projection={projection} />
        <View style={[styles.texts, archived ? styles.textsArchived : null]}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1} testID={`session-card-${id}-name`}>
              {projection.name}
            </Text>
            {projection.expandable ? (
              <Pressable
                onPress={onToggleExpanded}
                accessibilityRole="button"
                accessibilityLabel={fillTemplate(expanded ? t.collapseAccessibilityLabel : t.expandAccessibilityLabel, {
                  name: projection.name,
                })}
                accessibilityState={{ expanded }}
                hitSlop={CHEVRON_HIT_SLOP}
                style={styles.chevron}
                testID={`session-card-${id}-disclosure`}
              >
                <Image
                  source={CHEVRON_ICON}
                  style={[styles.chevronIcon, expanded ? styles.chevronOpen : null]}
                  accessible={false}
                  testID={`session-card-${id}-chevron${expanded ? "-open" : ""}`}
                />
              </Pressable>
            ) : null}
          </View>
          <CategoryLine categories={projection.categories} testID={`session-card-${id}-categories`} />
          <View style={styles.synthesisRow}>
            <View style={styles.synthesisStart}>
              <Image source={EXERCISES_ICON} style={styles.icon16} accessible={false} />
              <Text style={styles.meta} numberOfLines={1} testID={`session-card-${id}-summary`}>
                {summary}
              </Text>
            </View>
            <View style={styles.durationBlock}>
              <Image source={DURATION_ICON} style={styles.icon16} accessible={false} />
              <Text style={styles.duration} numberOfLines={1} testID={`session-card-${id}-duration`}>
                {duration}
              </Text>
            </View>
          </View>
        </View>
      </View>
      {!archived ? (
        // Présente et désactivée (CE-T03-01) : le toucher est intercepté, jamais transmis à la carte.
        <Pressable
          onPress={() => undefined}
          accessibilityRole="button"
          accessibilityLabel={t.playUnavailableAccessibilityLabel}
          accessibilityState={{ disabled: true }}
          style={styles.play}
          testID={`session-card-${id}-play`}
        >
          <KodjoIcon name="action-start" opacity={0.55} />
        </Pressable>
      ) : null}
      {expanded ? children : null}
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
    return <View style={styles.categoryRow} testID={`${testID}-empty`} />;
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
    <View style={styles.categoryRow} testID={testID}>
      <View style={styles.categoryBadge}>
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
const VISUAL_SIZE = 64;
/** Spécification §1 : visuel et zone de Lecture à 8 du bord. */
const EDGE = spacing[8];
/** Texte à 84 du bord (64 + 8 + 12). */
const TEXT_GAP = spacing[12];
const PLAY_TARGET = 48;
const CHEVRON_SIZE = 20;
const CHEVRON_SLOP = (minTouchTarget - CHEVRON_SIZE) / 2;
const CHEVRON_HIT_SLOP = { top: CHEVRON_SLOP, bottom: CHEVRON_SLOP, left: CHEVRON_SLOP, right: CHEVRON_SLOP } as const;
/** Hauteur de l'en-tête replié (Figma : carte 80). */
export const SESSION_CARD_HEADER_HEIGHT = 80;

const styles = StyleSheet.create({
  // Tokens de carte de B.9 : fond `#F9FAFC`, bordure 0,5 `#CCD1E0`, rayon 12, ombre 8 % 0/2/10.
  card: {
    borderRadius: fixedRadii[12],
    borderWidth: CARD_BORDER,
    borderColor: colors.cardsBorder,
    backgroundColor: colors.surfaceSubtle,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardArchived: {
    borderColor: colors.cardsArchiveBorder,
  },
  header: {
    minHeight: SESSION_CARD_HEADER_HEIGHT - 2 * CARD_BORDER,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: EDGE - CARD_BORDER,
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
  // Colonne de texte : de 84 jusqu'à 8 avant la zone de Lecture (306 au gabarit 402), ou jusqu'à la
  // marge pour une carte archivée (aucune action).
  texts: {
    flex: 1,
    minWidth: 0,
    marginLeft: TEXT_GAP,
    marginRight: PLAY_TARGET + EDGE,
  },
  textsArchived: {
    marginRight: 0,
  },
  titleRow: {
    minHeight: CHEVRON_SIZE,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    marginBottom: spacing[6],
  },
  name: {
    ...type.listCardTitle,
    flexShrink: 1,
    color: colors.catalogueSessionTitle,
  },
  chevron: {
    width: CHEVRON_SIZE,
    height: CHEVRON_SIZE,
  },
  chevronIcon: {
    width: CHEVRON_SIZE,
    height: CHEVRON_SIZE,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  categoryRow: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  categoryBadge: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[8],
  },
  categoryIcon: {
    width: 14,
    height: 14,
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
  meta: {
    ...type.supporting,
    color: colors.movementCardDescription,
  },
  synthesisRow: {
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[8],
  },
  synthesisStart: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[10],
    paddingLeft: 1,
  },
  durationBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  icon16: {
    width: 16,
    height: 16,
  },
  duration: {
    ...type.cardDuration,
    color: colors.textPrimary,
  },
  // Zone de Lecture : cible 48, à 8 du bord droit, centrée sur l'en-tête replié (Figma y 16).
  play: {
    position: "absolute",
    top: (SESSION_CARD_HEADER_HEIGHT - PLAY_TARGET) / 2 - CARD_BORDER,
    right: EDGE - CARD_BORDER,
    width: PLAY_TARGET,
    height: PLAY_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});
