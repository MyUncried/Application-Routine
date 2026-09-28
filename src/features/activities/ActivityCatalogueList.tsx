import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityCatalogueState } from "@/features/activities/useActivityCatalogue";
import { ActivityCard } from "@/features/activities/ActivityCard";
import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

export type ActivityCatalogueListProps = {
  state: ActivityCatalogueState;
  onRetry: () => void;
  onOpenDefinition: (definitionId: string) => void;
};

/**
 * Corps du segment `Activités` du Catalogue (V2-CAT-01, plan §4.1/§7 étape 5)
 * — mêmes quatre états que `CatalogueScreen` (`loading`/`empty`/`error`/
 * `ready`), rendus indépendamment de la navigation (fournie par l'écran
 * hôte). La liste est déjà triée par `updatedAt DESC` par le Repository —
 * jamais retriée ici.
 */
export function ActivityCatalogueList({
  state,
  onRetry,
  onOpenDefinition,
}: ActivityCatalogueListProps) {
  const t = strings.screens.activities;

  if (state.status === "loading") {
    return (
      <View style={styles.centeredBody}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (state.status === "empty") {
    return (
      <View style={styles.centeredBody}>
        <View style={styles.emptyStateFrame} testID="activity-catalogue-empty-frame">
          <Text style={styles.emptyMessage}>{t.empty.message}</Text>
        </View>
      </View>
    );
  }

  if (state.status === "error") {
    return (
      <View style={styles.centeredBody}>
        <Text style={styles.errorMessage}>{t.error.message}</Text>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={t.error.retry}
          style={styles.retryAction}
        >
          <Text style={styles.retryLabel}>{t.error.retry}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={state.definitions}
      keyExtractor={(definition) => definition.id}
      renderItem={({ item }) => (
        <ActivityCard definition={item} onOpen={() => onOpenDefinition(item.id)} />
      )}
      scrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      testID="activity-catalogue-list"
    />
  );
}

const styles = StyleSheet.create({
  centeredBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[16],
  },
  emptyStateFrame: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[32],
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  retryLabel: {
    ...type.button,
    color: colors.background,
  },
  list: {
    gap: spacing[8],
    paddingBottom: spacing[16],
  },
});
