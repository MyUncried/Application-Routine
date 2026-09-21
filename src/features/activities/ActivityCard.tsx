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
      <View style={styles.body}>
        <View style={styles.mainRow}>
          <ActivityCardMainArea onOpen={onOpen}>
            <Text style={styles.name} numberOfLines={2}>
              {definition.name}
            </Text>
            {bodyZones !== null ? (
              <Text
                style={styles.secondaryLine}
                testID={`activity-card-body-zones-${definition.id}`}
              >
                {bodyZones}
              </Text>
            ) : null}
            {/*
             * VISUAL_CORRECTION (revue indépendante 5753653735, point 1) :
             * synthèse NON tronquée — retour à la ligne, jamais
             * `numberOfLines`, qui coupait la clause Pause/mode/cible sur
             * une carte compacte.
             */}
            <Text style={styles.secondaryLine}>{summary}</Text>
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
        {/*
         * VISUAL_CORRECTION (revue indépendante 5753653735, point 1) :
         * présentation de la Récupération ALIGNÉE sur la carte Composition
         * (`CompositionScreen.activityRecoveryCard`/`activityRecoveryLabel`)
         * — sous-carte dédiée (liseré supérieur, fond `colors.surface`,
         * libellé `compactCardTitle` Semi Bold), jamais une simple ligne
         * secondaire parmi les autres.
         */}
        {recoveryLabel !== null ? (
          <View
            style={styles.recoveryCard}
            testID={`activity-card-recovery-${definition.id}`}
          >
            <Text style={styles.recoveryLabel} numberOfLines={1}>
              {recoveryLabel}
            </Text>
          </View>
        ) : null}
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.standardCard.radius,
    overflow: "hidden",
  },
  // UI-CAT-R-002 : marque de couleur FIXE (`colors.primary`) — une
  // `ActivityDefinition` ne porte pas de couleur propre, à la différence
  // d'une Séance (`SessionCard.colorBar`, `session.color`). `alignSelf:
  // "stretch"` couvre toute la hauteur RÉELLE de la carte, Récupération
  // comprise (VISUAL_CORRECTION, revue indépendante 5753653735, point 1).
  colorBar: {
    alignSelf: "stretch",
    width: 4,
    backgroundColor: colors.primary,
  },
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 1) : colonne
  // portant la rangée principale (nom/Zones/synthèse + actions) PUIS,
  // conditionnellement, la sous-carte Récupération — jamais un simple
  // empilement de lignes dans la seule zone pressable.
  body: {
    flex: 1,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
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
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 1) :
  // présentation ALIGNÉE sur `CompositionScreen.activityRecoveryCard` —
  // sous-carte `24` points, liseré supérieur, fond `colors.surface`.
  // `paddingLeft` s'aligne sur le texte de la rangée principale
  // (`content.paddingHorizontal`, la carte Activité n'a pas de slot de
  // poignée `28×28` contrairement à la carte Composition).
  recoveryCard: {
    height: dimensions.compositionActivityRow.recoveryCardHeight,
    justifyContent: "center",
    paddingLeft: spacing[16],
    paddingRight: spacing[16],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Graisse SEMI BOLD (`type.compactCardTitle`), même token que
  // `CompositionScreen.activityRecoveryLabel` — distingue le libellé
  // `Récupération` des lignes secondaires régulières de la carte.
  recoveryLabel: {
    ...type.compactCardTitle,
    color: colors.textSecondary,
  },
});
