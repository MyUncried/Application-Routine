import * as Crypto from "expo-crypto";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { activityDefinitionToDraftExercise, type ActivityDefinition } from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
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
 * Référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1,
 * UI-9C227EDDE427) — chargé une seule fois ici, au sommet de l'écran, et
 * transmis à chaque `SelectionRow` : jamais `BODY_ZONES`, qui n'est plus
 * l'autorité runtime, y compris en repli (revue indépendante 5928437619).
 *
 * Correction (device check Hermann, commentaire 5948936550) : l'application
 * réelle rend cet écran HORS de `<SQLiteProvider>` (architecture T01-S05,
 * préservée) — un accès direct à `useSQLiteContext` levait donc TOUJOURS en
 * production, dégradant silencieusement vers un référentiel VIDE. Le
 * référentiel transite désormais par `ActivityDefinitionService.listBodyZones`
 * (même connexion SQLite que `SessionService`, construite par
 * `SessionServiceProvider`), accessible ici via `useActivityDefinitionService()`.
 */
function useBodyZonesReferential(
  activityDefinitionService: ActivityDefinitionService,
): readonly BodyZone[] {
  const [zones, setZones] = useState<readonly BodyZone[]>([]);
  useEffect(() => {
    let cancelled = false;
    activityDefinitionService.listBodyZones().then(
      (result) => {
        if (!cancelled) {
          setZones(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les Zones corporelles.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService]);
  return zones;
}

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
  const activityDefinitionService = useActivityDefinitionService();
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService);
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
  // Revue indépendante 35529973203 (UI-CAT-R-003) : le retrait/recalcul
  // silencieux ne suffit pas — une information EXPLICITE et VISIBLE doit
  // accompagner la disparition d'un identifiant obsolète. Compteur DÉRIVÉ
  // (même principe que `availableSelectedIds`, jamais un état synchronisé
  // par effet) ; libellé local componentisé (aucune ressource de
  // localisation déjà approuvée ne couvre ce cas précis).
  const staleSelectionCount = selectedIds.length - availableSelectedIds.length;
  const staleSelectionNotice =
    staleSelectionCount > 0
      ? staleSelectionCount === 1
        ? "1 activité sélectionnée n’est plus disponible et a été retirée de la sélection."
        : `${staleSelectionCount} activités sélectionnées ne sont plus disponibles et ont été retirées de la sélection.`
      : null;

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
    let nextExercises = draft.exercises;
    for (const definition of orderedSelection) {
      // V2-PRE-1 (plan §3.2) : `postActivityRecoverySeconds` est une
      // propriété de l'OCCURRENCE, jamais dérivée de la définition.
      // PRE-3 (spécification du 07/10, P3-13/no-auto-R) : une nouvelle
      // occurrence ne reçoit AUCUNE Récupération automatique — le défaut du
      // Profil n'est utilisé que par l'ajout explicite d'une Récupération
      // (placement PRE-4). Copie complète : paramètres, Catégorie et médias
      // ordonnés (`activityDefinitionToDraftExercise`).
      const copy = activityDefinitionToDraftExercise(definition, Crypto.randomUUID(), 0);
      nextExercises = appendActivityAfterLastDisplayed(nextExercises, copy);
    }
    // Insertion atomique : une seule mutation du brouillon pour l'ensemble
    // des copies — toutes ou aucune.
    updateDraft({ exercises: nextExercises });
    router.back();
  }

  const canAdd = state.status === "ready" && availableSelectedIds.length > 0;
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 2) : libellé
  // EXACT `Ajouter 1 activité` / `Ajouter X activités` — jamais un compteur
  // entre parenthèses. `activitySingular`/`activityPlural`
  // (`strings.screens.sessions.card`) sont une ressource de localisation
  // DÉJÀ APPROUVÉE (réutilisée telle quelle, `fr.ts` hors périmètre
  // d'écriture de cette reprise) ; aucune nouvelle chaîne traduite n'est
  // ajoutée.
  const activityNoun =
    availableSelectedIds.length === 1
      ? strings.screens.sessions.card.activitySingular
      : strings.screens.sessions.card.activityPlural;
  const addLabel =
    availableSelectedIds.length > 0
      ? `${t.addAction} ${availableSelectedIds.length} ${activityNoun}`
      : t.addAction;

  return (
    <ScreenShell>
      <FixedHeader
        title={t.title}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      <View style={styles.body} testID="activity-selection-body">
        {staleSelectionNotice !== null ? (
          <View style={styles.staleNotice} testID="activity-selection-stale-notice">
            <Text style={styles.staleNoticeText}>{staleSelectionNotice}</Text>
          </View>
        ) : null}
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
                bodyZonesReferential={bodyZonesReferential}
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
 * V2-CAT-01 (UI-CAT-R-003), VISUAL_CORRECTION (revue indépendante
 * 5753653735, point 2) : carte alignée sur la carte CANONIQUE
 * (`ActivityCard.tsx`) — barre de couleur gauche, nom, Zones corporelles,
 * mode et cible, Séries et Pause (mêmes fonctions de présentation déjà
 * éprouvées par `ActivityCard.tsx`/`compositionPresentation.ts`, jamais
 * reformulées localement), synthèse NON tronquée. V2-PRE-1 (plan §3.1) :
 * aucune sous-carte Récupération — une `ActivityDefinition` ne porte plus
 * cette notion (exclusive de l'occurrence). Contour et fond sélectionnés
 * conformes au patron DSF déjà
 * établi (`CategoriesScreen.tagSelected` : `colors.selection`/
 * `colors.selectionSurface`). La checkbox reste un cadre vectoriel TOUJOURS
 * visible (coché/décoché), jamais une icône apparaissant seulement à la
 * sélection.
 */
function SelectionRow({
  definition,
  selected,
  onToggle,
  bodyZonesReferential,
}: {
  definition: ActivityDefinition;
  selected: boolean;
  onToggle: () => void;
  bodyZonesReferential: readonly BodyZone[];
}) {
  const bodyZones = formatExerciseBodyZones(definition.bodyZoneIds, bodyZonesReferential);
  const summary = formatExerciseRowSummary(definition);

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={definition.name}
      style={[styles.row, selected ? styles.rowSelected : null]}
      testID={`activity-selection-row-${definition.id}`}
    >
      <View style={styles.rowColorBar} testID={`activity-selection-row-color-bar-${definition.id}`} />
      <View style={styles.rowBody}>
        <View style={styles.rowMainArea}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel} numberOfLines={2}>
              {definition.name}
            </Text>
            {bodyZones !== null ? (
              <Text
                style={styles.rowSecondaryLine}
                testID={`activity-selection-row-body-zones-${definition.id}`}
              >
                {bodyZones}
              </Text>
            ) : null}
            {/* VISUAL_CORRECTION (point 2) : synthèse NON tronquée — retour à la ligne, jamais `numberOfLines`. */}
            <Text style={styles.rowSecondaryLine}>{summary}</Text>
          </View>
          <View
            style={[styles.checkbox, selected ? styles.checkboxSelected : null]}
            testID={`activity-selection-row-checkbox-${definition.id}`}
          >
            {selected ? (
              <KodjoIcon
                name="state-selected"
                size={20}
                testID={`activity-selection-row-checked-${definition.id}`}
              />
            ) : null}
          </View>
        </View>
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
  // V2-CAT-01 (UI-CAT-R-003) : information EXPLICITE et VISIBLE, jamais un
  // retrait silencieux, lorsque des identifiants sélectionnés deviennent
  // obsolètes et sont recalculés.
  staleNotice: {
    marginBottom: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  staleNoticeText: {
    ...type.body,
    color: colors.danger,
  },
  list: {
    gap: spacing[8],
    paddingBottom: spacing[16],
  },
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 2) : anatomie
  // alignée sur la carte CANONIQUE `ActivityCard.tsx` — conteneur ligne
  // (barre gauche + corps), `overflow: "hidden"` pour que la sous-carte
  // Récupération suive le rayon du bloc.
  row: {
    flexDirection: "row",
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: "hidden",
    minHeight: minTouchTarget,
  },
  // Patron DSF déjà établi pour un contour sélectionné
  // (`CategoriesScreen.tagSelected`) — jamais une couleur locale inventée.
  rowSelected: {
    borderColor: colors.selection,
    backgroundColor: colors.selectionSurface,
  },
  // Barre de couleur FIXE, même valeur que `ActivityCard.colorBar` — une
  // `ActivityDefinition` ne porte pas de couleur propre.
  rowColorBar: {
    alignSelf: "stretch",
    width: 4,
    backgroundColor: colors.primary,
  },
  rowBody: {
    flex: 1,
  },
  rowMainArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
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
  // Patron DSF déjà établi (`CategoriesScreen.tagSelected`), jamais
  // `colors.primary` inventé localement pour ce contour.
  checkboxSelected: {
    borderColor: colors.selection,
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
