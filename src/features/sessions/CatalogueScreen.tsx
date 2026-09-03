import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SessionSummary } from "@/domain/sessions/Session";
import { SessionCard } from "@/features/sessions/SessionCard";
import { useSessionCatalogue } from "@/features/sessions/useSessionCatalogue";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Écran du Catalogue des séances (T01-S06). Seul point d'appel à
 * `useFocusEffect` de la feature — `useSessionCatalogue` reste pur et ne
 * connaît pas la navigation.
 *
 * Le cadre commun (en-tête, sélecteur de filtres, bouton `+ Créer`) reste
 * affiché dans les quatre états ; seul le corps central varie. Confirmé par
 * `catalogue-vide.png`, qui montre ce cadre conservé même à vide (voir le
 * plan d'implémentation).
 *
 * Correction LAY-01 (Phase 1, `2026-09-03_P0-plan-correction-layout-controls.md`,
 * `[ChatGPT] PLAN_APPROVED — PHASE 1 ONLY — CATALOGUE VIDE`) : l'écran est
 * désormais recomposé selon `Shell / Screen — Context=On, Bottom=Navigation`
 * (doc12 §12.26) — Header fixe (titre) → séparateur → bande Context (bleu
 * très pâle, `colors.selectionSurface`, seul token pâle déjà existant dans
 * ce code) contenant le sélecteur de filtres et `+ Créer` → corps. La
 * hauteur du Header utilise `dimensions.header.contentHeight` (déjà défini,
 * jamais utilisé jusqu'ici) plutôt qu'une valeur locale improvisée ; les
 * insets système réels remplacent la réserve `0–92` du gabarit Figma, comme
 * l'exige doc12 §12.26 (« les insets système réels remplacent les réserves
 * de Safe Area lors de l'implémentation »). Aucune logique de données
 * modifiée — uniquement la structure visuelle et le regroupement des
 * éléments déjà existants.
 */
export function CatalogueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, reload, cancelPending } = useSessionCatalogue();

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        cancelPending();
      };
    }, [reload, cancelPending]),
  );

  return (
    <View style={styles.container}>
      <View
        testID="catalogue-header"
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + dimensions.header.contentHeight },
        ]}
      >
        <Text style={styles.title} accessibilityRole="header">
          {strings.screens.sessions.title}
        </Text>
      </View>

      <View testID="catalogue-header-separator" style={styles.headerSeparator} />

      <View testID="catalogue-context-band" style={styles.contextBand}>
        <FilterSelector />
        <CreateAction onPress={() => router.push("/composition")} />
      </View>

      <View style={styles.body}>
        {state.status === "loading" ? <LoadingBody /> : null}
        {state.status === "empty" ? <EmptyBody /> : null}
        {state.status === "error" ? <ErrorBody onRetry={reload} /> : null}
        {state.status === "ready" ? <ReadyBody sessions={state.sessions} /> : null}
      </View>
    </View>
  );
}

/**
 * Sélecteur `Toutes` / `Planifiées` / `Archivées`. Seule `Toutes` est
 * fonctionnelle dans T01-S06 : `Planifiées` et `Archivées` n'ont aucune
 * capacité Repository/Service à appeler (aucune méthode `listArchived()`,
 * aucun domaine Routine/planification) — elles restent visibles pour ne
 * pas altérer la structure de référence, mais désactivées. Aucune
 * sous-étape connue ne les active à ce jour.
 */
function FilterSelector() {
  return (
    <View style={styles.filterRow} accessibilityRole="tablist">
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
        accessibilityLabel={strings.screens.sessions.filters.all}
        style={[styles.filterOption, styles.filterOptionSelected]}
      >
        <Text style={[styles.filterLabel, styles.filterLabelSelected]}>
          {strings.screens.sessions.filters.all}
        </Text>
      </Pressable>
      <Pressable
        disabled
        accessibilityRole="tab"
        accessibilityState={{ disabled: true, selected: false }}
        accessibilityLabel={strings.screens.sessions.filters.scheduled}
        style={styles.filterOption}
      >
        <Text style={styles.filterLabel}>{strings.screens.sessions.filters.scheduled}</Text>
      </Pressable>
      <Pressable
        disabled
        accessibilityRole="tab"
        accessibilityState={{ disabled: true, selected: false }}
        accessibilityLabel={strings.screens.sessions.filters.archived}
        style={styles.filterOption}
      >
        <Text style={styles.filterLabel}>{strings.screens.sessions.filters.archived}</Text>
      </Pressable>
    </View>
  );
}

/**
 * `+ Créer`. Activé depuis T01-S07 : navigue vers `Composition d'une
 * séance` (`app/(creation)/composition.tsx`), qui n'existait pas avant
 * cette sous-étape (RM-014).
 *
 * Correction UI-CAT-001 (cycle de correction après contre-recette iPhone,
 * 2026-09-03, CE-T01-02) : cadre visuel exact `90 × 32`, rayon du token
 * `dimensions.compactSecondaryButton` (16, pas la valeur improvisée
 * précédente 20) — la cible tactile réelle (`minTouchTarget`, 48×48) est
 * obtenue via `hitSlop`, jamais en agrandissant la boîte visuelle
 * elle-même (doc12 §Dimensions structurantes, doc13 §3.3).
 */
function CreateAction({ onPress }: { onPress: () => void }) {
  const horizontalHitSlop = (minTouchTarget - CREATE_ACTION_WIDTH) / 2;
  const verticalHitSlop = (minTouchTarget - dimensions.compactSecondaryButton.visualHeight) / 2;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={strings.screens.sessions.createAction}
      hitSlop={{
        top: verticalHitSlop,
        bottom: verticalHitSlop,
        left: horizontalHitSlop,
        right: horizontalHitSlop,
      }}
      style={styles.createAction}
    >
      <KodjoIcon name="action-add" testID="catalogue-create-icon" />
      <Text style={styles.createActionLabel}>{strings.screens.sessions.createAction}</Text>
    </Pressable>
  );
}

const CREATE_ACTION_WIDTH = 90;

function LoadingBody() {
  return (
    <View style={styles.centeredBody}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        accessibilityLabel={strings.screens.sessions.loading.accessibilityLabel}
      />
    </View>
  );
}

function EmptyBody() {
  return (
    <View style={styles.centeredBody}>
      <Text style={styles.emptyMessage}>{strings.screens.sessions.empty.message}</Text>
    </View>
  );
}

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredBody}>
      <Text style={styles.errorMessage}>{strings.screens.sessions.error.message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={strings.screens.sessions.error.retry}
        style={styles.retryAction}
      >
        <Text style={styles.retryLabel}>{strings.screens.sessions.error.retry}</Text>
      </Pressable>
    </View>
  );
}

function ReadyBody({ sessions }: { sessions: readonly SessionSummary[] }) {
  return (
    <FlatList
      data={sessions}
      keyExtractor={(session) => session.id}
      renderItem={({ item }) => <SessionCard session={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    justifyContent: "center",
    paddingHorizontal: spacing[24],
  },
  title: {
    ...type.screenTitle,
    color: colors.textPrimary,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  contextBand: {
    backgroundColor: colors.selectionSurface,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[16],
    gap: spacing[16],
  },
  filterRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing[4],
    gap: spacing[4],
  },
  filterOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[8],
    borderRadius: 20,
  },
  filterOptionSelected: {
    backgroundColor: colors.selection,
  },
  filterLabel: {
    ...type.label,
    color: colors.textSecondary,
  },
  filterLabelSelected: {
    color: colors.background,
  },
  createAction: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
    width: CREATE_ACTION_WIDTH,
    height: dimensions.compactSecondaryButton.visualHeight,
    borderRadius: dimensions.compactSecondaryButton.radius,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  createActionLabel: {
    ...type.button,
    color: colors.primary,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
  },
  centeredBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[16],
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
