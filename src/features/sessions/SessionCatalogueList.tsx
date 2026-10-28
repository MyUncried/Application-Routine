import { Pressable, StyleSheet, Text } from "react-native";

import { SheetMotionProvider, SheetMotionScrollView, SheetMotionView } from "@/features/activities/SheetMotion";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";
import { formatActivityCount } from "@/features/sessions/formatSessionSummary";
import { SessionCard } from "@/features/sessions/SessionCard";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { strings } from "@/shared/i18n";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * PRE-8 (epic E) — liste du segment Séances du Catalogue unifié : cartes uniques (E.2), 12 entre deux
 * cartes quelle que soit leur hauteur, marge 16 (spécification §4). Toucher une carte ouvre la
 * Composition existante (E.7) ; le chevron et Lecture interceptent leur propre toucher.
 */

const t = strings.screens.sessions;

export function sessionCardAccessibilityLabel(projection: SessionCatalogueProjection): string {
  const summary =
    projection.summary.kind === "FORMAT"
      ? projection.summary.label
      : projection.summary.kind === "VOLUME"
        ? projection.summary.volume
        : formatActivityCount(projection.summary.count);
  return [
    projection.name,
    projection.categories.map((category) => category.name).join(", "),
    summary,
    formatSessionDurationEstimate(projection.duration),
    projection.status === "ARCHIVED" ? t.catalogueCard.archivedAccessibility : null,
  ]
    .filter((part) => part !== null && part.length > 0)
    .join(", ");
}

export function SessionCatalogueList({
  sessions,
  emptyMessage,
  onOpenSession,
}: {
  readonly sessions: readonly SessionCatalogueProjection[];
  /** Q-E6 : message de la liste sans résultat après filtrage ; `null` si la liste n'est pas vide. */
  readonly emptyMessage: string | null;
  readonly onOpenSession: (sessionId: string) => void;
}) {
  const reduceMotion = useReduceMotion();
  return (
    <SheetMotionProvider reduceMotion={reduceMotion}>
      <SheetMotionScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        testID="catalogue-session-list"
      >
        {sessions.length === 0 && emptyMessage !== null ? (
          <Text style={styles.message} testID="catalogue-session-no-match">
            {emptyMessage}
          </Text>
        ) : null}
        {sessions.map((projection) => (
          <SheetMotionView key={projection.id} bleed={layout.screenGutter} style={styles.item} testID={`catalogue-session-item-${projection.id}`}>
            <Pressable
              onPress={() => onOpenSession(projection.id)}
              accessibilityRole="button"
              accessibilityLabel={sessionCardAccessibilityLabel(projection)}
              accessibilityHint={t.card.openAccessibilityLabel}
              testID={`session-card-${projection.id}-open`}
            >
              <SessionCard projection={projection} />
            </Pressable>
          </SheetMotionView>
        ))}
      </SheetMotionScrollView>
    </SheetMotionProvider>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  // Spécification §4 : 12 entre deux cartes, quelle que soit leur hauteur.
  item: {
    paddingBottom: spacing[12],
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing[24],
  },
});
