import * as Crypto from "expo-crypto";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { activityDefinitionToDraftExercise, type ActivityDefinition } from "@/domain/activities";
import { isBilateral } from "@/domain/activities/ExecutionParameters";
import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import { settleCircuitMembership } from "@/domain/sessions/circuitMembership";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { withLevelSuffix } from "@/features/activities/movementChoicePresentation";
import { useActivityCatalogue } from "@/features/activities/useActivityCatalogue";
import { useCategoriesReferential } from "@/features/activities/useCategoriesReferential";
import { catalogueDuration } from "@/features/activities/ActivityCard";
import {
  COMPACT_LIST_SEPARATOR,
  formatExerciseBodyZones,
  formatExerciseRowSummary,
  isIncompleteSummary,
  resolveOccurrenceCategory,
} from "@/features/sessions/compositionPresentation";
import { CircuitEntryConfirmModal } from "@/features/sessions/CircuitEntryConfirmModal";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { FINAL_ACTION_BUTTON_HEIGHT } from "@/shared/ui/finalAction";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

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
 * moment de la validation — jamais l'ordre des touchers (plan §4.4). PRE-7
 * (A4.1, D-439, CE-T03-07 §5) : cet ordre est l'ordre regroupé par geste de
 * `useActivityCatalogue` ; chaque `SelectionRow` désigne une définition
 * précise (aucune ligne de groupe), dont la copie reçoit le contenu résolu et
 * `sourceMovementId` (`activityDefinitionToDraftExercise`). Un frère
 * incomplet reste sélectionnable : son résumé « Paramètres à compléter. »
 * le signale, et `Continuer` reste inactif en Composition tant que
 * l'occurrence n'est pas complétée (D-389 : aucun message supplémentaire).
 */
export function ActivitySelectionScreen() {
  const router = useRouter();
  const actionZone = usePrimaryActionZone();
  const { draft, updateDraft } = useSessionDraft();
  const { state, reload, cancelPending } = useActivityCatalogue();
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  // PRE-6 (story 2.3) : ajout adapté au Circuit de Séries, en attente de confirmation de perte.
  const [pendingAdd, setPendingAdd] = useState<{
    readonly enteringCount: number;
    readonly targetCount: number;
  } | null>(null);
  const activityDefinitionService = useActivityDefinitionService();
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService);
  const categoriesReferential = useCategoriesReferential(activityDefinitionService);
  const t = strings.screens.activities.selection;
  // PRE-8 (epic E, E.8-a, option 1 de Hermann du 28/10) : verrou du double appui sur Modifier, réarmé
  // au retour de l'éditeur (focus suivant).
  const isOpeningEditorRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isOpeningEditorRef.current = false;
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

  /**
   * PRE-8 (E.8-a) : accès TRANSITOIRE aux anciennes définitions d'Exercices (`activity_definitions`),
   * le segment Exercices du Catalogue étant retiré. Ouvre l'éditeur existant par sa route de
   * modification ; l'éditeur des définitions ne lit ni n'écrit le brouillon de Séance, et cet écran
   * reste monté dessous : sélections et brouillon sont conservés, la liste est relue au retour
   * (`useFocusEffect`). Retiré quand l'epic C remplacera ce parcours (E.8-b).
   */
  function openDefinitionEditor(id: string) {
    if (isOpeningEditorRef.current) return;
    isOpeningEditorRef.current = true;
    router.push({ pathname: "/exercise", params: { catalogueDefinitionId: id } });
  }

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  /**
   * Plan de l'ajout de la sélection courante au brouillon COURANT : copies insérées puis
   * réglées vis-à-vis du Circuit. `null` si rien n'est à ajouter.
   */
  function planAdd() {
    if (state.status !== "ready" || availableSelectedIds.length === 0) {
      return null;
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
      // ordonnés (`activityDefinitionToDraftExercise`). PRE-6 (story 1.1,
      // AD-35) : l'occurrence naît sans récupération (`null`, absente).
      const copy = activityDefinitionToDraftExercise(definition, Crypto.randomUUID(), null);
      nextExercises = appendActivityAfterLastDisplayed(nextExercises, copy);
    }
    // PRE-6 (story 2.3, AD-39) : copies arrivées dans un Circuit de Séries adaptées à N ; si au
    // moins une perd des séries, confirmation unique AVANT toute mutation (Annuler : rien
    // n'est ajouté, la sélection reste). Le Catalogue n'est jamais modifié.
    const settled = settleCircuitMembership(draft, nextExercises);
    const enteringCount = settled.exercises.filter(
      (exercise) =>
        exercise.structuralPosition === "IN_TOUR" && !draft.exercises.some((existing) => existing.id === exercise.id),
    ).length;
    return { ...settled, enteringCount };
  }

  function handleAdd() {
    const plan = planAdd();
    if (plan === null) {
      return;
    }
    if (plan.losses.length > 0) {
      // Seuls le compte et N sont retenus : « Confirmer » rejoue l'ajout sur le brouillon courant.
      setPendingAdd({ enteringCount: plan.enteringCount, targetCount: plan.targetCount });
      return;
    }
    commitAdd(plan.exercises);
  }

  // Insertion atomique : une seule mutation du brouillon pour l'ensemble des copies — toutes
  // ou aucune — puis retour à la Composition.
  function commitAdd(exercises: readonly SessionDraftExercise[]) {
    updateDraft({ exercises });
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
          <View style={[styles.centeredBody, { paddingBottom: actionZone.scrollReserve }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        {state.status === "empty" ? (
          <View style={[styles.centeredBody, { paddingBottom: actionZone.scrollReserve }]}>
            <Text style={styles.emptyMessage}>{t.empty.message}</Text>
          </View>
        ) : null}
        {state.status === "error" ? (
          <View style={[styles.centeredBody, { paddingBottom: actionZone.scrollReserve }]}>
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
                onEdit={() => openDefinitionEditor(item.id)}
                bodyZonesReferential={bodyZonesReferential}
                categoriesReferential={categoriesReferential}
                levelPosition={state.levelPositions?.get(item.movementId) ?? null}
              />
            )}
            // PRE-6 story 7.10 (D-444) : réserve de défilement = zone d'action fixe.
            contentContainerStyle={[styles.list, { paddingBottom: actionZone.scrollReserve }]}
            scrollIndicatorInsets={{ bottom: actionZone.scrollReserve }}
            testID="activity-selection-list"
          />
        ) : null}
      </View>

      {/* PRE-6 story 7.10 (D-444) : barre Annuler / Ajouter dans la zone d'action principale fixe
          (zone protégée, bouton centré, dégradé) ; « Ajouter » au format `Terminer`. */}
      <PrimaryActionZone
        onContentHeightChange={actionZone.onContentHeightChange}
        contentStyle={styles.bottomAction}
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
        <PrimaryActionButton
          label={addLabel}
          onPress={handleAdd}
          disabled={!canAdd}
          style={styles.addAction}
          testID="activity-selection-add"
          labelTestID="activity-selection-add-label"
        />
      </PrimaryActionZone>

      {pendingAdd !== null ? (
        <CircuitEntryConfirmModal
          kind="ADD"
          seriesCount={pendingAdd.targetCount}
          exerciseCount={pendingAdd.enteringCount}
          onCancel={() => setPendingAdd(null)}
          onConfirm={() => {
            setPendingAdd(null);
            // Ajout rejoué sur le brouillon et la sélection courants : rien n'est écrasé.
            const plan = planAdd();
            if (plan !== null) {
              commitAdd(plan.exercises);
            }
          }}
        />
      ) : null}
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
 * établi (`CategoriesScreen.tagSelected`, écran supprimé par Q54 : `colors.selection`/
 * `colors.selectionSurface`). La checkbox reste un cadre vectoriel TOUJOURS
 * visible (coché/décoché), jamais une icône apparaissant seulement à la
 * sélection.
 */
function SelectionRow({
  definition,
  selected,
  onToggle,
  onEdit,
  bodyZonesReferential,
  categoriesReferential,
  levelPosition,
}: {
  definition: ActivityDefinition;
  selected: boolean;
  onToggle: () => void;
  /** PRE-8 (E.8-a) : commande Modifier, distincte de la sélection. */
  onEdit: () => void;
  bodyZonesReferential: readonly BodyZone[];
  categoriesReferential: readonly Category[];
  /** PRE-7 (R-6, C06) : carte sans pastille — suffixe « - Nn » du mouvement groupé. */
  levelPosition: MovementLevelPosition | null;
}) {
  const displayedName = withLevelSuffix(definition.name, levelPosition);
  const bodyZones = formatExerciseBodyZones(definition.bodyZoneIds, bodyZonesReferential);
  const summary = formatExerciseRowSummary(definition);
  // PRE-6 (story 2.2, contexte « Choix composition » `8328:28445`, ch13 PR #390).
  const category = resolveOccurrenceCategory(definition.categoryId, categoriesReferential);
  const hasSideChange = isBilateral(definition.sideMode);
  const duration = catalogueDuration(definition);
  const hasClassification = category !== null || bodyZones !== null || hasSideChange;

  return (
    <View style={styles.rowFrame}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={displayedName}
        style={[styles.row, selected ? styles.rowSelected : null]}
        testID={`activity-selection-row-${definition.id}`}
      >
        <View style={styles.rowColorBar} testID={`activity-selection-row-color-bar-${definition.id}`} />
        <View style={styles.rowBody}>
          <View style={styles.rowMainArea}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel} numberOfLines={2}>
                {displayedName}
              </Text>
              {/*
               * PRE-6 (story 2.2, ch13 PR #390) : Catégorie et Zones corporelles sur UNE ligne,
               * zones tronquées sans augmenter la hauteur ; icône neutre de changement de côté
               * (16) sur cette ligne, 8 après le texte, si l'exercice en a un (RM-243).
               */}
              {hasClassification ? (
                <View style={styles.rowClassification} testID={`activity-selection-row-classification-${definition.id}`}>
                  {category !== null ? (
                    <View
                      style={[styles.rowCategoryDot, { backgroundColor: category.color }]}
                      testID={`activity-selection-row-category-dot-${definition.id}`}
                    />
                  ) : null}
                  <Text style={[styles.rowSecondaryLine, styles.rowClassificationText]} numberOfLines={1}>
                    {category !== null ? <Text style={styles.rowCategoryName}>{category.name}</Text> : null}
                    {category !== null && bodyZones !== null ? COMPACT_LIST_SEPARATOR : null}
                    {bodyZones !== null ? (
                      <Text testID={`activity-selection-row-body-zones-${definition.id}`}>{bodyZones}</Text>
                    ) : null}
                  </Text>
                  {hasSideChange ? (
                    <KodjoIcon name="side-change" testID={`activity-selection-row-side-change-${definition.id}`} />
                  ) : null}
                </View>
              ) : null}
              {/*
               * VISUAL_CORRECTION (point 2) : synthèse NON tronquée — retour à la ligne, jamais `numberOfLines`.
               * PRE-6 (story 2.2) : durée totale (même règle que le Catalogue, `catalogueDuration`)
               * alignée à gauche dans une réserve de 68, à 8 du sablier ; absente si la durée l'est.
               */}
              <View style={styles.rowSummaryLine}>
                {/* PRE-7 (D-448, point 7) : « Paramètres à compléter. » en `colors.danger`. */}
                <Text
                  style={[
                    styles.rowSecondaryLine,
                    styles.rowSummaryText,
                    isIncompleteSummary(summary) ? styles.rowSummaryIncomplete : null,
                  ]}
                  testID={`activity-selection-row-summary-${definition.id}`}
                >
                  {summary}
                </Text>
                {duration !== null ? (
                  <View style={styles.rowDuration} testID={`activity-selection-row-duration-${definition.id}`}>
                    <KodjoIcon name="duration-hourglass" />
                    <Text style={styles.rowDurationText} numberOfLines={1}>
                      {duration}
                    </Text>
                  </View>
                ) : null}
              </View>
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
      {/* PRE-8 (E.8-a) : commande Modifier sœur de la ligne de sélection — élément accessible
          propre, cible 44, sans effet sur la case. */}
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={strings.screens.activities.selection.editAccessibilityLabel.replace("{name}", displayedName)}
        style={styles.rowEdit}
        testID={`activity-selection-row-edit-${definition.id}`}
      >
        <KodjoIcon name="edit-movement" />
      </Pressable>
    </View>
  );
}

/** PRE-6 (story 2.2, `8328:28445`) : réserve de la durée totale, illustrée par « 25 min 39 s ». */
const SELECTION_DURATION_RESERVE_WIDTH = 68;
/** Pastille de Catégorie (6) et icône de changement de côté (16), comme la carte d'occurrence. */
const SELECTION_CATEGORY_DOT_SIZE = 6;
const SELECTION_SIDE_CHANGE_ICON_SIZE = 16;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    // A01 (recette PRE-8 A/B) : marge standard partagée.
    paddingHorizontal: layout.screenGutter,
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
  // PRE-8 (E.8-a) : ligne de sélection puis commande Modifier, côte à côte.
  rowFrame: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  rowEdit: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: "hidden",
    minHeight: minTouchTarget,
  },
  // Patron DSF déjà établi pour un contour sélectionné
  // (`CategoriesScreen.tagSelected`, écran supprimé par Q54) — jamais une couleur locale inventée.
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
  // PRE-6 (story 2.2) : ligne de classement — pastille 6, texte tronqué, icône de côté à 8.
  rowClassification: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    minHeight: SELECTION_SIDE_CHANGE_ICON_SIZE,
  },
  // Pastille à 6 du texte (l'écart de la ligne est de 8).
  rowCategoryDot: {
    width: SELECTION_CATEGORY_DOT_SIZE,
    height: SELECTION_CATEGORY_DOT_SIZE,
    borderRadius: SELECTION_CATEGORY_DOT_SIZE / 2,
    marginRight: spacing[6] - spacing[8],
  },
  rowClassificationText: {
    flexShrink: 1,
  },
  rowCategoryName: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  rowSummaryLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[8],
  },
  rowSummaryText: {
    flex: 1,
  },
  rowSummaryIncomplete: {
    color: colors.danger,
  },
  // Sablier 16, puis la durée à 8, alignée à gauche dans sa réserve de 68.
  rowDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  rowDurationText: {
    ...type.cardDuration,
    minWidth: SELECTION_DURATION_RESERVE_WIDTH,
    textAlign: "left",
    color: colors.textPrimary,
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
  // Patron DSF déjà établi (`CategoriesScreen.tagSelected`, écran supprimé par Q54), jamais
  // `colors.primary` inventé localement pour ce contour.
  checkboxSelected: {
    borderColor: colors.selection,
  },
  // PRE-6 story 7.10 : contenu de la zone d'action — Annuler et Ajouter côte à côte, hauteur 48.
  bottomAction: {
    flexDirection: "row",
    gap: spacing[12],
  },
  cancelAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: FINAL_ACTION_BUTTON_HEIGHT,
    borderRadius: 24,
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  cancelLabel: {
    ...type.button,
    color: colors.dialogNeutralActionText,
  },
  addAction: {
    flex: 1,
  },
});
