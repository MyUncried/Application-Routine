import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import {
  formatActivityRecoveryLabel,
  formatExerciseBodyZones,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
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
 * Carte condensée d'une `ActivityDefinition` (V2-CAT-01, UI-CAT-R-002) —
 * même anatomie que `SessionCard` (bordure/rayon `standardCard`,
 * `DisclosureControl` partagé) avec une marque de couleur FIXE
 * (`colors.primary`, une `ActivityDefinition` ne porte pas de couleur
 * propre — à la différence d'une Séance). Affiche le nom dynamique, les
 * Zones corporelles, le mode et la cible, les Séries, la Pause et la
 * Récupération — mêmes fonctions de présentation déjà éprouvées par la
 * carte Activité de Composition (`compositionPresentation.ts`), jamais
 * reformulées localement. `Déployer` et `Lecture` sont visibles mais
 * désactivés, sans handler fonctionnel — la même zone est réservée sur
 * toutes les cartes (plan §4.1). Aucun swipe ni action de gestion.
 */
export function ActivityCard({ definition, onOpen }: ActivityCardProps) {
  const t = strings.screens.activities.card;
  const bodyZones = formatExerciseBodyZones(definition.bodyZoneIds);
  const summary = formatExerciseRowSummary(definition);
  const recoveryLabel = formatActivityRecoveryLabel(definition.recoverySeconds);

  return (
    <View style={styles.container} testID={`activity-card-${definition.id}`}>
      <View style={styles.colorBar} testID={`activity-card-color-bar-${definition.id}`} />
      <ActivityCardMainArea onOpen={onOpen}>
        <Text style={styles.name} numberOfLines={2}>
          {definition.name}
        </Text>
        {bodyZones !== null ? (
          <Text
            style={styles.secondaryLine}
            numberOfLines={1}
            testID={`activity-card-body-zones-${definition.id}`}
          >
            {bodyZones}
          </Text>
        ) : null}
        <Text style={styles.secondaryLine} numberOfLines={1}>
          {summary}
        </Text>
        {recoveryLabel !== null ? (
          <Text
            style={styles.secondaryLine}
            numberOfLines={1}
            testID={`activity-card-recovery-${definition.id}`}
          >
            {recoveryLabel}
          </Text>
        ) : null}
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
  // UI-CAT-R-002 : marque de couleur FIXE (`colors.primary`) — une
  // `ActivityDefinition` ne porte pas de couleur propre, à la différence
  // d'une Séance (`SessionCard.colorBar`, `session.color`).
  colorBar: {
    alignSelf: "stretch",
    width: 4,
    backgroundColor: colors.primary,
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
  // Même hiérarchie typographique que `Boundary Activity`
  // (`boundaryRowSecondaryLine`, `CompositionScreen.tsx`) — réutilisée,
  // jamais redéfinie localement.
  secondaryLine: {
    ...type.caption,
    color: colors.textSecondary,
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
