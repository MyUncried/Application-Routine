import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import { strings } from "@/shared/i18n";
import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type ActivityCardProps = {
  definition: ActivityDefinition;
  /** Ouvre l'édition de la définition — surface principale de la carte (plan §4.1). */
  onOpen?: () => void;
};

/**
 * Carte condensée d'une `ActivityDefinition` (V2-CAT-01) — même anatomie que
 * `SessionCard` (bordure/rayon `standardCard`, `DisclosureControl` partagé),
 * sans barre de couleur (une Activité du Catalogue n'en porte pas). `Déployer`
 * et `Lecture` sont visibles mais désactivés, sans handler fonctionnel — la
 * même zone est réservée sur toutes les cartes (plan §4.1).
 */
export function ActivityCard({ definition, onOpen }: ActivityCardProps) {
  const t = strings.screens.activities.card;

  return (
    <View style={styles.container} testID={`activity-card-${definition.id}`}>
      <ActivityCardMainArea onOpen={onOpen}>
        <Text style={styles.name} numberOfLines={2}>
          {definition.name}
        </Text>
      </ActivityCardMainArea>
      <View style={styles.actions}>
        <DisclosureControl
          expanded={false}
          disabled
          accessibilityLabel={t.deployAccessibilityLabel}
          testID="activity-card-disclosure"
        />
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel={t.playAccessibilityLabel}
          style={styles.playButton}
          testID="activity-card-play"
        >
          <KodjoIcon name="action-start" opacity={0.55} testID="activity-card-play-icon" />
        </Pressable>
      </View>
    </View>
  );
}

function ActivityCardMainArea({
  onOpen,
  children,
}: {
  onOpen?: () => void;
  children: ReactNode;
}) {
  if (!onOpen) {
    return <View style={styles.content}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={strings.screens.activities.card.openAccessibilityLabel}
      style={styles.content}
      testID="activity-card-open"
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.standardCard.radius,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    gap: spacing[4],
  },
  name: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[12],
  },
  playButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: minTouchTarget / 2,
  },
});
