import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SessionSummary } from "@/domain/sessions/Session";
import {
  formatActivityCount,
  formatEstimatedDuration,
  formatTourCount,
} from "@/features/sessions/formatSessionSummary";
import { strings } from "@/shared/i18n";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type SessionCardProps = {
  session: SessionSummary;
};

/**
 * Carte condensée d'une Séance active (T01-S06). Présentation pure : ne
 * charge rien, n'appelle jamais `SessionService`.
 *
 * Le chevron et le bouton `Démarrer` sont visuellement présents — les
 * captures Catalogue (`catalogue-seances.png` et les autres cartes non
 * glissées de `catalogue-condense-actions.png`) les montrent tous les deux
 * sur chaque carte condensée, sans qu'aucune interaction n'ait eu lieu — ce
 * sont donc des éléments structurants de la carte, pas des révélations
 * d'interaction. Ils restent néanmoins désactivés dans cette sous-étape :
 * aucun écran de détail (déploiement) ni d'Exécution n'existe encore, donc
 * ni navigation, ni chargement de détail, ni callback métier n'y sont
 * câblés.
 *
 * Le corps de la carte n'est pas pressable : aucune route de modification
 * (`Composition d'une séance`) n'existe avant T01-S07.
 */
export function SessionCard({ session }: SessionCardProps) {
  const summaryLine = [
    formatActivityCount(session.activityCount),
    formatEstimatedDuration(session.estimatedDurationSeconds),
    formatTourCount(session.tourRepeatCount),
  ].join(" · ");

  return (
    <View style={styles.container}>
      <View style={[styles.colorBar, { backgroundColor: session.color }]} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {session.name}
        </Text>
        <Text style={styles.summary}>{summaryLine}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true, expanded: false }}
          accessibilityLabel={strings.screens.sessions.card.expandAccessibilityLabel}
          style={styles.chevronButton}
        >
          <Text style={styles.chevronIcon}>⌄</Text>
        </Pressable>
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel={strings.screens.sessions.card.startAccessibilityLabel}
          style={styles.startButton}
        >
          <Text style={styles.startIcon}>▶</Text>
        </Pressable>
      </View>
    </View>
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
  colorBar: {
    alignSelf: "stretch",
    width: 4,
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
  summary: {
    ...type.body,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingHorizontal: spacing[12],
  },
  chevronButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: fixedRadii[8],
  },
  chevronIcon: {
    ...type.body,
    color: colors.disabled,
  },
  startButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: minTouchTarget / 2,
    backgroundColor: colors.disabled,
  },
  startIcon: {
    ...type.body,
    color: colors.background,
  },
});
