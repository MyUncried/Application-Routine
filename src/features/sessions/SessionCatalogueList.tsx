import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";

import { SheetMotionProvider, SheetMotionScrollView, SheetMotionView } from "@/features/activities/SheetMotion";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";
import { formatActivityCount } from "@/features/sessions/formatSessionSummary";
import { SessionCard } from "@/features/sessions/SessionCard";
import { compositionAccessibilityText, SessionCompositionTree } from "@/features/sessions/SessionCompositionTree";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { strings } from "@/shared/i18n";
import { colors, layout, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

/**
 * PRE-8 (epic E) — liste du segment Séances du Catalogue unifié : cartes uniques (E.2), 12 entre deux
 * cartes quelle que soit leur hauteur, marge 16 (spécification §4). Toucher une carte ouvre la
 * Composition existante (E.7) ; le chevron et Lecture interceptent leur propre toucher.
 *
 * E.3 : le chevron du nom déploie la composition (état de l'écran, jamais persisté, conservé pendant
 * la session). Pour VoiceOver, la carte est un seul élément : le déploiement y est une action
 * d'accessibilité nommée et la composition déployée s'ajoute à son nom accessible.
 */

const t = strings.screens.sessions;

export function sessionCardAccessibilityLabel(projection: SessionCatalogueProjection, expanded = false): string {
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
    expanded && projection.tree.length > 0 ? compositionAccessibilityText(projection.tree) : null,
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
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (sessionId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
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
        {sessions.map((projection) => {
          const isExpanded = projection.expandable && expanded.has(projection.id);
          const toggleLabel = fillTemplate(
            isExpanded ? t.catalogueCard.collapseAccessibilityLabel : t.catalogueCard.expandAccessibilityLabel,
            { name: projection.name },
          );
          return (
            <SheetMotionView key={projection.id} bleed={layout.screenGutter} style={styles.item} testID={`catalogue-session-item-${projection.id}`}>
              <Pressable
                onPress={() => onOpenSession(projection.id)}
                accessibilityRole="button"
                accessibilityLabel={sessionCardAccessibilityLabel(projection, isExpanded)}
                accessibilityHint={t.card.openAccessibilityLabel}
                accessibilityState={projection.expandable ? { expanded: isExpanded } : undefined}
                accessibilityActions={projection.expandable ? [{ name: "toggleComposition", label: toggleLabel }] : undefined}
                onAccessibilityAction={(event) => {
                  if (event.nativeEvent.actionName === "toggleComposition") toggle(projection.id);
                }}
                testID={`session-card-${projection.id}-open`}
              >
                <SessionCard projection={projection} expanded={isExpanded} onToggleExpanded={() => toggle(projection.id)}>
                  <SessionCompositionTree tree={projection.tree} testID={`session-card-${projection.id}-composition`} />
                </SessionCard>
              </Pressable>
            </SheetMotionView>
          );
        })}
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
