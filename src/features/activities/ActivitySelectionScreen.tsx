import * as Crypto from "expo-crypto";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { activityDefinitionToDraftExercise, type ActivityDefinition } from "@/domain/activities";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import { DEFAULT_TOUR_SIDE_MODE } from "@/domain/sessions/defaults";
import { useActivityCatalogue } from "@/features/activities/useActivityCatalogue";
import {
  formatExerciseBodyZones,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Écran `Une activité existante` (V2-CAT-01, plan §4.4/§6.1) — sélection
 * multiple des `ActivityDefinition` persistantes, copiées de façon atomique
 * et indépendante dans le brouillon de Composition à la validation. Aucune
 * `ActivityDefinition` n'est créée ni modifiée par ce parcours.
 *
 * L'ordre d'insertion suit l'ordre COURANT de présentation de la liste au
 * moment de la validation — jamais l'ordre des touchers (plan §4.4).
 */
export function ActivitySelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft } = useSessionDraft();
  const { state, reload, cancelPending } = useActivityCatalogue();
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const t = strings.screens.activities.selection;

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => cancelPending();
    }, [reload, cancelPending]),
  );

  // V2-CAT-01 (UI-CAT-R-003) : retrait et recalcul des identifiants
  // OBSOLÈTES — une définition sélectionnée peut disparaître (suppression
  // concurrente hors périmètre de suppression de cette tranche, mais déjà
  // possible via une autre session) entre l'ouverture de cet écran et sa
  // validation. Valeur DÉRIVÉE (jamais un état séparé synchronisé par effet,
  // `react-hooks/set-state-in-effect`) : le compteur et le CTA dynamique
  // restent exacts pendant toute la durée de l'écran, pas seulement à
  // l'instant de l'appui sur `Ajouter`, dès que la liste actualisée arrive.
  const availableSelectedIds =
    state.status === "ready"
      ? selectedIds.filter((id) => state.definitions.some((definition) => definition.id === id))
      : selectedIds;

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function handleAdd() {
    if (state.status !== "ready" || availableSelectedIds.length === 0) {
      return;
    }
    // Ordre de la liste au moment de la validation — jamais l'ordre des
    // touchers (`availableSelectedIds`, déjà purgée des identifiants
    // obsolètes).
    const orderedSelection = state.definitions.filter((definition) =>
      availableSelectedIds.includes(definition.id),
    );
    const tourSideMode = draft.tourSideMode ?? DEFAULT_TOUR_SIDE_MODE;
    let nextExercises = draft.exercises;
    for (const definition of orderedSelection) {
      const copy = activityDefinitionToDraftExercise(definition, Crypto.randomUUID());
      nextExercises = appendActivityAfterLastDisplayed(nextExercises, copy, tourSideMode);
    }
    // Insertion atomique : une seule mutation du brouillon pour l'ensemble
    // des copies — toutes ou aucune.
    updateDraft({ exercises: nextExercises });
    router.back();
  }

  const canAdd = state.status === "ready" && availableSelectedIds.length > 0;
  // V2-CAT-01 (UI-CAT-R-003) : CTA dynamique — le libellé de base
  // (`t.addAction`, seule chaîne traduite existante) porte désormais le
  // compteur de la sélection courante (purgée des identifiants obsolètes)
  // entre parenthèses dès qu'elle n'est pas vide ; aucune nouvelle chaîne
  // traduite n'est ajoutée.
  const addLabel =
    availableSelectedIds.length > 0 ? `${t.addAction} (${availableSelectedIds.length})` : t.addAction;

  return (
    <ScreenShell>
      <FixedHeader
        title={t.title}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      <View style={styles.body} testID="activity-selection-body">
        {state.status === "loading" ? (
          <View style={styles.centeredBody}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        {state.status === "empty" ? (
          <View style={styles.centeredBody}>
            <Text style={styles.emptyMessage}>{t.empty.message}</Text>
          </View>
        ) : null}
        {state.status === "error" ? (
          <View style={styles.centeredBody}>
            <Text style={styles.emptyMessage}>{strings.screens.activities.error.message}</Text>
          </View>
        ) : null}
        {state.status === "ready" ? (
          <FlatList
            data={state.definitions}
            keyExtractor={(definition) => definition.id}
            renderItem={({ item }) => (
              <SelectionRow
                definition={item}
                selected={selectedIds.includes(item.id)}
                onToggle={() => toggle(item.id)}
              />
            )}
            contentContainerStyle={styles.list}
            testID="activity-selection-list"
          />
        ) : null}
      </View>

      <View
        style={[styles.bottomAction, { marginBottom: insets.bottom + spacing[16] }]}
        testID="activity-selection-bottom-action"
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.cancelAccessibilityLabel}
          style={styles.cancelAction}
          testID="activity-selection-cancel"
        >
          <Text style={styles.cancelLabel}>{t.cancelAccessibilityLabel}</Text>
        </Pressable>
        <Pressable
          disabled={!canAdd}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          accessibilityLabel={addLabel}
          style={[styles.addAction, !canAdd ? styles.addActionDisabled : null]}
          testID="activity-selection-add"
        >
          <Text style={styles.addLabel} testID="activity-selection-add-label">
            {addLabel}
          </Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

/**
 * V2-CAT-01 (UI-CAT-R-003) : carte DÉTAILLÉE — nom, Zones corporelles, mode
 * et cible, Séries et Pause (mêmes fonctions de présentation déjà éprouvées
 * par `ActivityCard.tsx`/`compositionPresentation.ts`, jamais reformulées
 * localement) — jamais seulement le nom. La checkbox reste un cadre
 * vectoriel TOUJOURS visible (coché/décoché), jamais une icône apparaissant
 * seulement à la sélection.
 */
function SelectionRow({
  definition,
  selected,
  onToggle,
}: {
  definition: ActivityDefinition;
  selected: boolean;
  onToggle: () => void;
}) {
  const bodyZones = formatExerciseBodyZones(definition.bodyZoneIds);
  const summary = formatExerciseRowSummary(definition);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={definition.name}
      style={styles.row}
      testID={`activity-selection-row-${definition.id}`}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {definition.name}
        </Text>
        {bodyZones !== null ? (
          <Text
            style={styles.rowSecondaryLine}
            numberOfLines={1}
            testID={`activity-selection-row-body-zones-${definition.id}`}
          >
            {bodyZones}
          </Text>
        ) : null}
        <Text style={styles.rowSecondaryLine} numberOfLines={1}>
          {summary}
        </Text>
      </View>
      <View
        style={[styles.checkbox, selected ? styles.checkboxSelected : null]}
        testID={`activity-selection-row-checkbox-${definition.id}`}
      >
        {selected ? (
          <KodjoIcon name="state-selected" size={20} testID={`activity-selection-row-checked-${definition.id}`} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
  },
  centeredBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  list: {
    gap: spacing[8],
    paddingBottom: spacing[16],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minHeight: minTouchTarget,
  },
  rowContent: {
    flex: 1,
    gap: spacing[4],
  },
  rowLabel: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  // Même hiérarchie typographique que `Boundary Activity`
  // (`boundaryRowSecondaryLine`, `CompositionScreen.tsx`) — réutilisée,
  // jamais redéfinie localement.
  rowSecondaryLine: {
    ...type.caption,
    color: colors.textSecondary,
  },
  // V2-CAT-01 (UI-CAT-R-003) : cadre vectoriel TOUJOURS visible — coché
  // (icône `state-selected`) ou décoché (cadre vide) — jamais une icône
  // apparaissant seulement à la sélection.
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: colors.primary,
  },
  bottomAction: {
    flexDirection: "row",
    marginHorizontal: spacing[24],
    gap: spacing[12],
  },
  cancelAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  cancelLabel: {
    ...type.button,
    color: colors.dialogNeutralActionText,
  },
  addAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  addActionDisabled: {
    backgroundColor: colors.disabled,
  },
  addLabel: {
    ...type.button,
    color: colors.background,
  },
});
