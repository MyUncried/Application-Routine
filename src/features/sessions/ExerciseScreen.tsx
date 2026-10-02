import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  activityDefinitionToInput,
  createEmptyActivityDefinitionDraft,
} from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import {
  isCategoryAssignable,
  type Category,
  type CategoryColor,
  type CreateCategoryInput,
} from "@/domain/categories/Category";
import { findCategoryMatch } from "@/domain/categories/matching";
import { CATEGORY_NAME_MAX_LENGTH, canonicalCategoryKey, validateCategoryName } from "@/domain/categories/validation";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import { DEFAULT_SIDE_MODE } from "@/domain/sessions/defaults";
import { createExerciseDraft, exerciseEquals, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import {
  ActivityEditorForm,
  type ActivityEditorFormValue,
} from "@/features/activities/ActivityEditorForm";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

/**
 * Référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1,
 * UI-1652FFC3B512) — partagé par les deux adaptateurs de cet écran
 * (`CatalogueActivityEditorScreen`/`CompositionExerciseEditor`), tous deux
 * fournissant `bodyZones` à `ActivityEditorForm` : jamais `BODY_ZONES`, qui
 * n'est plus l'autorité runtime.
 *
 * Correction (device check Hermann, commentaire 5948936550) : l'application
 * réelle monte `ActivityDefinitionServiceProvider`/`SessionServiceContext`
 * AUTOUR du `children` applicatif, mais celui-ci est rendu HORS de
 * `<SQLiteProvider>` (architecture T01-S05, préservée) — un accès direct à
 * `useSQLiteContext` depuis cet écran levait donc TOUJOURS en production,
 * dégradant silencieusement vers un référentiel VIDE (jamais une erreur
 * visible). Le référentiel transite désormais par `ActivityDefinitionService`
 * (`listBodyZones`, même connexion SQLite que `SessionService`, construite
 * par `SessionServiceProvider`), déjà accessible ici via
 * `useActivityDefinitionService()` — même patron de chargement que
 * `listCategories()` ci-dessous. Jamais `BODY_ZONES` (revue indépendante
 * 5930269937) — ce module statique n'est plus l'autorité runtime, y compris
 * en repli ; il ne reste que la source du seed historique consommée par
 * `migration007`.
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
 * Couleur par défaut d'une Catégorie créée depuis l'éditeur d'Activité
 * (V2-PRE-1, D-211) : aucune interaction de couleur n'est documentée pour
 * cette création (`08 – Conception fonctionnelle détaillée.md` l.978 ne
 * décrit qu'une icône/pilule, jamais de sélecteur de couleur) — la couleur
 * neutre déjà établie ailleurs pour « aucune valeur assignée »
 * (`DEFAULT_SESSION_COLOR`, `#8E8E93`) est réutilisée telle quelle plutôt
 * qu'une teinte inventée.
 */
const NEW_CATEGORY_DEFAULT_COLOR: CategoryColor = "#8E8E93";

/**
 * Route `Ajouter / Modifier une activité` (T02-S02 ; V2-CAT-01, revue
 * indépendante 5732014381, obligation 5 — formulaire commun) : point
 * d'entrée unique de `app/(creation)/exercise.tsx`. Un paramètre
 * `catalogueDefinitionId` bascule vers l'adaptateur Catalogue
 * (`CatalogueActivityEditorScreen`, persistance dans une
 * `ActivityDefinition`) ; son absence préserve le flux Composition
 * (`CompositionExerciseEditor`, écriture dans le brouillon `SessionActivity`
 * uniquement). `"new"` signifie une création ; toute autre valeur est
 * l'identifiant d'une `ActivityDefinition` à modifier.
 *
 * Les deux adaptateurs partagent désormais un SEUL formulaire
 * (`@/features/activities/ActivityEditorForm` — roulettes, sections
 * repliables, rangée de paramètres, contrôle `Côté`, pilotage `Séries ↔
 * Durée totale`, synthèse) : aucune règle de validation ou de présentation
 * n'est dupliquée entre les deux éditeurs.
 */
export function ExerciseScreen() {
  const params = useLocalSearchParams<{ exerciseId?: string; catalogueDefinitionId?: string }>();
  if (params.catalogueDefinitionId !== undefined) {
    return (
      <CatalogueActivityEditorScreen
        definitionId={params.catalogueDefinitionId === "new" ? null : params.catalogueDefinitionId}
      />
    );
  }
  return <CompositionExerciseEditor />;
}

/**
 * Adaptateur Catalogue (V2-CAT-01) : crée ou modifie une `ActivityDefinition`
 * persistante via `ActivityDefinitionService` — jamais le brouillon de
 * Séance. Préremplie exactement en modification (`activityDefinitionToInput`).
 *
 * Revue 5732014381, obligation 4 : toute exception LEVÉE par le service
 * (échec technique du Repository, ex. transaction annulée) est désormais
 * CAPTURÉE — jamais seulement les résultats structurés `{ok:false}`/
 * `{status:"INVALID"}` — le brouillon local reste intact, un message
 * d'erreur devient visible et le verrou de sauvegarde est RÉARMÉ, permettant
 * une nouvelle tentative immédiate.
 */
function CatalogueActivityEditorScreen({ definitionId }: { definitionId: string | null }) {
  const router = useRouter();
  const activityDefinitionService = useActivityDefinitionService();
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService);
  const isEditingExisting = definitionId !== null;
  const [value, setValue] = useState<ActivityEditorFormValue>(() => {
    const draft = createEmptyActivityDefinitionDraft();
    return {
      name: draft.name,
      instruction: draft.description,
      executionMode: draft.executionMode,
      durationSeconds: draft.durationSeconds,
      repetitionCount: draft.repetitionCount,
      seriesCount: draft.seriesCount,
      pauseSeconds: draft.pauseSeconds,
      bodyZoneIds: draft.bodyZoneIds,
      sideMode: draft.sideMode ?? DEFAULT_SIDE_MODE,
    };
  });
  // V2-PRE-1 (plan §3.1, D-211) : la Catégorie et la pause de changement de
  // côté n'appartiennent pas à `ActivityEditorFormValue` (formulaire commun,
  // partagé avec la Composition qui n'en a pas besoin) — transportées ici,
  // séparément, jamais affectées automatiquement (`category: null` tant
  // qu'aucune sélection explicite n'a eu lieu).
  const [category, setCategory] = useState<CreateCategoryInput | null>(null);
  const [sideRecoverySeconds, setSideRecoverySeconds] = useState(0);
  const [categoriesState, setCategoriesState] = useState<
    | { status: "loading" }
    | { status: "ready"; categories: readonly Category[] }
    | { status: "error" }
  >({ status: "loading" });
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  // V2-CAT-01 (UI-CAT-R-008) : `"error"` couvre à la fois une définition
  // ABSENTE (`getActivityDefinition` résolu à `null` — supprimée ou
  // identifiant invalide) et un échec TECHNIQUE de chargement (promesse
  // rejetée) — dans les deux cas, l'écran ne doit jamais rester bloqué en
  // chargement indéfini ; `Réessayer` relance exactement le même chargement.
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    isEditingExisting ? "loading" : "ready",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const isSavingRef = useRef(false);
  const t = strings.screens.activities.editor;
  const loadErrorStrings = strings.screens.activities.error;

  /**
   * N'appelle JAMAIS `setLoadState("loading")` elle-même — l'appelant en
   * décide : l'effet de montage part déjà de `"loading"` (initialiseur de
   * `useState` ci-dessus), et `handleRetryLoad` la redemande explicitement
   * avant d'invoquer cette fonction, pour rester hors d'un corps d'effet
   * (`react-hooks/set-state-in-effect`).
   */
  const fetchDefinition = useCallback(
    (isCancelled: () => boolean) => {
      if (definitionId === null) {
        return;
      }
      activityDefinitionService
        .getActivityDefinition(definitionId)
        .then((definition) => {
          if (isCancelled()) {
            return;
          }
          if (!definition) {
            setLoadState("error");
            return;
          }
          const input = activityDefinitionToInput(definition);
          setValue({
            name: input.name,
            instruction: input.description,
            executionMode: input.executionMode,
            durationSeconds: input.durationSeconds,
            repetitionCount: input.repetitionCount,
            seriesCount: input.seriesCount,
            pauseSeconds: input.pauseSeconds,
            bodyZoneIds: input.bodyZoneIds,
            sideMode: input.sideMode ?? DEFAULT_SIDE_MODE,
          });
          setCategory(input.category);
          setSideRecoverySeconds(input.sideRecoverySeconds);
          setLoadState("ready");
        })
        .catch((error: unknown) => {
          if (isCancelled()) {
            return;
          }
          console.error("L'activité n'a pas pu être chargée.", error);
          setLoadState("error");
        });
    },
    [activityDefinitionService, definitionId],
  );

  useEffect(() => {
    let cancelled = false;
    fetchDefinition(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchDefinition]);

  // V2-PRE-1 (plan §3.1, D-211) : Catégories disponibles pour la modale de
  // sélection — même patron de chargement que `fetchDefinition` ci-dessus.
  useEffect(() => {
    let cancelled = false;
    activityDefinitionService.listCategories().then(
      (categories) => {
        if (!cancelled) {
          setCategoriesState({ status: "ready", categories });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les catégories.", error);
          setCategoriesState({ status: "error" });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService]);

  const handleRetryLoad = useCallback(() => {
    setLoadState("loading");
    fetchDefinition(() => false);
  }, [fetchDefinition]);

  function patch(next: Partial<ActivityEditorFormValue>) {
    setSaveError(false);
    setValue((current) => ({ ...current, ...next }));
  }

  const availableTags: readonly { readonly id: string; readonly name: string }[] =
    categoriesState.status === "ready" ? categoriesState.categories.filter(isCategoryAssignable) : [];
  const selectedCategoryName =
    category?.kind === "EXISTING"
      ? (categoriesState.status === "ready"
          ? categoriesState.categories.find((candidate) => candidate.id === category.categoryId)?.name
          : undefined)
      : category?.kind === "NEW"
        ? category.name
        : undefined;

  function openCategoryPicker() {
    setSaveError(false);
    setIsCategoryPickerOpen(true);
  }

  function closeCategoryPicker() {
    setIsCategoryPickerOpen(false);
    setIsCreatingCategory(false);
    setNewCategoryName("");
  }

  function openCreateCategoryRow() {
    setIsCreatingCategory(true);
    setNewCategoryName("");
  }

  function cancelCreateCategoryRow() {
    setIsCreatingCategory(false);
    setNewCategoryName("");
  }

  const canAddCategory = validateCategoryName(newCategoryName).ok;

  function selectCategory(id: string) {
    setCategory({ kind: "EXISTING", categoryId: id });
    closeCategoryPicker();
  }

  function handleAddCategory() {
    const validated = validateCategoryName(newCategoryName);
    if (!validated.ok) {
      return;
    }
    const normalizedName = validated.value;
    const candidates = availableTags.map((tag) => ({
      id: tag.id,
      canonicalKey: canonicalCategoryKey(tag.name),
    }));
    const match = findCategoryMatch(candidates, normalizedName);
    if (match) {
      selectCategory(match.id);
      return;
    }
    setCategory({ kind: "NEW", name: normalizedName, color: NEW_CATEGORY_DEFAULT_COLOR });
    closeCategoryPicker();
  }

  async function handleFinish() {
    if (isSavingRef.current) {
      return;
    }
    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(false);

    const definitionInput = {
      name: value.name,
      description: value.instruction,
      executionMode: value.executionMode,
      durationSeconds: value.durationSeconds,
      repetitionCount: value.repetitionCount,
      seriesCount: value.seriesCount,
      pauseSeconds: value.pauseSeconds,
      category: category ?? { kind: "EXISTING" as const, categoryId: "" },
      bodyZoneIds: value.bodyZoneIds,
      sideMode: value.sideMode,
      sideRecoverySeconds,
    };

    try {
      const succeeded =
        definitionId !== null
          ? (await activityDefinitionService.updateActivityDefinition(definitionId, definitionInput))
              .status === "UPDATED"
          : (await activityDefinitionService.createActivityDefinition(definitionInput)).ok;

      if (!succeeded) {
        isSavingRef.current = false;
        setIsSaving(false);
        setSaveError(true);
        return;
      }
      router.back();
    } catch (error) {
      // Défense de dernier recours (même patron que `CategoriesScreen.handleSave`) :
      // une erreur TECHNIQUE du service (ex. transaction annulée) ne doit
      // jamais laisser l'écran bloqué ni perdre le brouillon local — le
      // verrou de sauvegarde est réarmé, une nouvelle tentative reste
      // possible.
      console.error("L'activité n'a pas pu être enregistrée.", error);
      isSavingRef.current = false;
      setIsSaving(false);
      setSaveError(true);
    }
  }

  return (
    <ScreenShell>
      <FixedHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />
      {loadState === "loading" ? null : null}
      {loadState === "error" ? (
        <View style={styles.loadErrorBody} testID="activity-editor-load-error">
          <Text style={styles.loadErrorMessage}>{loadErrorStrings.message}</Text>
          <Pressable
            onPress={handleRetryLoad}
            accessibilityRole="button"
            accessibilityLabel={loadErrorStrings.retry}
            style={styles.loadErrorRetry}
            testID="activity-editor-load-retry"
          >
            <Text style={styles.loadErrorRetryLabel}>{loadErrorStrings.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {loadState === "ready" ? (
        <>
          {/*
           * V2-PRE-1 (plan §3.1, D-211 ; `08` l.978 / `13` §4.10) : bouton
           * ouvrant la modale de sélection de Catégorie — icône dans l'état
           * non renseigné, pilule avec le nom après sélection. Contrat de
           * modale déjà validé (appui court = sélectionner), réutilisé sans
           * nouvelle conception.
           */}
          <View style={styles.categoryRow} testID="activity-editor-category-row">
            <Pressable
              onPress={openCategoryPicker}
              accessibilityRole="button"
              accessibilityLabel={
                selectedCategoryName
                  ? `${t.category.label} ${selectedCategoryName}`
                  : t.category.unsetAccessibilityLabel
              }
              style={[styles.categoryPill, selectedCategoryName ? styles.categoryPillSet : null]}
              testID="activity-editor-category-button"
            >
              {selectedCategoryName ? (
                <Text style={styles.categoryPillLabel}>{selectedCategoryName}</Text>
              ) : (
                <KodjoIcon name="icon-tour" testID="activity-editor-category-icon" />
              )}
            </Pressable>
          </View>

          <ActivityEditorForm
            value={value}
            onChange={patch}
            bodyZones={bodyZonesReferential}
            showMediaSection
            finishLabel={t.finishAction}
            onFinish={handleFinish}
            isFinishDisabled={isSaving || category === null}
            errorMessage={saveError ? t.saveError : null}
            finishSlotTestID="activity-editor-finish-slot"
            finishActionTestID="activity-editor-finish-action"
            errorTestID="activity-editor-save-error"
          />
        </>
      ) : null}

      {isCategoryPickerOpen ? (
        <View style={styles.categoryModalOverlay} testID="activity-editor-category-modal">
          <View style={styles.categoryModalBody}>
            <Text style={styles.categoryModalTitle}>{t.category.modalTitle}</Text>
            <View style={styles.tagRow} testID="activity-editor-category-tag-row">
              {availableTags.map((tag) => (
                <Pressable
                  key={tag.id}
                  onPress={() => selectCategory(tag.id)}
                  accessibilityRole="button"
                  accessibilityLabel={tag.name}
                  style={styles.tag}
                  testID={`activity-editor-category-tag-${tag.id}`}
                >
                  <Text style={styles.tagLabel}>{tag.name}</Text>
                </Pressable>
              ))}
            </View>
            {isCreatingCategory ? (
              <View style={styles.newCategoryContainer} testID="activity-editor-category-new-row">
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder={t.category.newCategory.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel={t.category.newCategory.placeholder}
                  maxLength={CATEGORY_NAME_MAX_LENGTH}
                  autoFocus
                  style={styles.newCategoryInput}
                  testID="activity-editor-category-new-name-input"
                />
                <View style={styles.newCategoryActionsRow}>
                  <Pressable
                    onPress={cancelCreateCategoryRow}
                    accessibilityRole="button"
                    accessibilityLabel={t.category.newCategory.cancelAccessibilityLabel}
                    style={styles.newCategoryCancelAction}
                  >
                    <Text style={styles.newCategoryCancelLabel}>
                      {t.category.newCategory.cancelAccessibilityLabel}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={!canAddCategory}
                    onPress={handleAddCategory}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canAddCategory }}
                    accessibilityLabel={t.category.newCategory.addAccessibilityLabel}
                    style={[
                      styles.newCategoryAddAction,
                      !canAddCategory ? styles.newCategoryAddActionDisabled : null,
                    ]}
                  >
                    <Text style={styles.newCategoryAddLabel}>
                      {t.category.newCategory.addAccessibilityLabel}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={openCreateCategoryRow}
                accessibilityRole="button"
                accessibilityLabel={t.category.createAction}
                style={styles.createCategoryAction}
                testID="activity-editor-category-create-action"
              >
                <KodjoIcon name="action-add" testID="activity-editor-category-create-icon" />
                <Text style={styles.createCategoryActionLabel}>{t.category.createAction}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={closeCategoryPicker}
              accessibilityRole="button"
              accessibilityLabel={t.category.closeAccessibilityLabel}
              style={styles.categoryModalClose}
              testID="activity-editor-category-close"
            >
              <Text style={styles.categoryModalCloseLabel}>{t.category.closeAccessibilityLabel}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  // V2-CAT-01 (UI-CAT-R-008) : définition absente ou échec de chargement —
  // jamais un chargement indéfini. `Réessayer` relance le même chargement ;
  // `Retour` (en-tête, toujours visible) reste la sortie garantie.
  loadErrorBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  loadErrorMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadErrorRetry: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  loadErrorRetryLabel: {
    ...type.button,
    color: colors.background,
  },
  // V2-PRE-1 (plan §3.1, D-211) : rangée portant le bouton/pilule de
  // Catégorie, au-dessus du formulaire commun.
  categoryRow: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[12],
  },
  categoryPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    height: dimensions.categoryTag.visualHeight,
    paddingHorizontal: spacing[12],
    borderRadius: dimensions.categoryTag.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryPillSet: {
    borderColor: colors.selection,
    backgroundColor: colors.selectionSurface,
  },
  categoryPillLabel: {
    ...type.label,
    color: colors.selection,
  },
  categoryModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[24],
  },
  categoryModalBody: {
    width: "100%",
    maxWidth: 420,
    borderRadius: dimensions.standardCard.radius,
    backgroundColor: colors.background,
    padding: spacing[24],
    gap: spacing[16],
  },
  categoryModalTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    height: dimensions.categoryTag.visualHeight,
    paddingHorizontal: spacing[12],
    borderRadius: dimensions.categoryTag.radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagLabel: {
    ...type.label,
    color: colors.textPrimary,
  },
  createCategoryAction: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
    height: dimensions.compactSecondaryButton.visualHeight,
    paddingHorizontal: spacing[16],
    borderRadius: dimensions.compactSecondaryButton.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  createCategoryActionLabel: {
    ...type.button,
    color: colors.primary,
  },
  newCategoryContainer: {
    gap: spacing[12],
  },
  newCategoryInput: {
    ...type.body,
    width: "100%",
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.exerciseTextField.radius,
    paddingHorizontal: dimensions.exerciseTextField.paddingHorizontal,
    height: dimensions.exerciseTextField.height,
  },
  newCategoryActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[12],
  },
  newCategoryCancelAction: {
    height: dimensions.categoryTag.visualHeight,
    borderRadius: dimensions.categoryTag.visualHeight / 2,
    paddingHorizontal: spacing[16],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  newCategoryCancelLabel: {
    ...type.button,
    color: colors.dialogNeutralActionText,
  },
  newCategoryAddAction: {
    height: dimensions.categoryTag.visualHeight,
    borderRadius: dimensions.categoryTag.visualHeight / 2,
    paddingHorizontal: spacing[16],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  newCategoryAddActionDisabled: {
    backgroundColor: colors.disabled,
  },
  newCategoryAddLabel: {
    ...type.button,
    color: colors.background,
  },
  categoryModalClose: {
    alignSelf: "center",
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
  },
  categoryModalCloseLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
});

/**
 * Flux Composition (T02-S02, D-137) — écrit exclusivement dans le brouillon
 * `SessionActivity` (`SessionDraftContext`), jamais dans une
 * `ActivityDefinition` persistante : aucune Activité créée directement
 * depuis la Composition ne crée jamais de définition Catalogue (plan §4.4).
 */
function CompositionExerciseEditor() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();
  const activityDefinitionService = useActivityDefinitionService();
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService);
  const params = useLocalSearchParams<{ exerciseId?: string }>();

  const requestedExerciseId = params.exerciseId;
  const existingExercise =
    typeof requestedExerciseId === "string"
      ? (draft.exercises.find((exercise) => exercise.id === requestedExerciseId) ?? null)
      : null;
  const isEditingExisting = existingExercise !== null;

  const [initialSnapshot] = useState<SessionDraftExercise>(
    () => existingExercise ?? createExerciseDraft(Crypto.randomUUID()),
  );
  const [local, setLocal] = useState<SessionDraftExercise>(initialSnapshot);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);

  const shouldBlockExit = !isFinishing && !exerciseEquals(local, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    () => {},
  );

  useEffect(() => {
    if (isFinishing && !shouldBlockExit) {
      router.back();
    }
  }, [isFinishing, shouldBlockExit, router]);

  function patchLocal(patch: Partial<SessionDraftExercise>) {
    setLocal((current) => ({ ...current, ...patch }));
  }

  function handleTerminer() {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    const alreadyPresent = draft.exercises.some((exercise) => exercise.id === local.id);
    const nextExercises = alreadyPresent
      ? draft.exercises.map((exercise) => (exercise.id === local.id ? local : exercise))
      : appendActivityAfterLastDisplayed(draft.exercises, local);
    updateDraft({ exercises: nextExercises });
    setIsFinishing(true);
  }

  const t = strings.screens.exercise;

  return (
    <ScreenShell>
      <FixedHeader
        title={isEditingExisting ? t.titleEdit : t.titleAdd}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
      />
      <HeaderSeparator />

      <ActivityEditorForm
        value={local}
        onChange={patchLocal}
        bodyZones={bodyZonesReferential}
        finishLabel={t.finishAction}
        onFinish={handleTerminer}
        finishSlotTestID="exercise-finish-action-slot"
        finishActionTestID="exercise-finish-action"
      />

      {isPendingExit ? (
        <ExerciseExitConfirmModal onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}
    </ScreenShell>
  );
}
