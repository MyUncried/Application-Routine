import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Category } from "@/domain/categories/Category";
import { findCategoryMatch } from "@/domain/categories/matching";
import {
  CATEGORY_NAME_MAX_LENGTH,
  canonicalCategoryKey,
  validateCategoryName,
} from "@/domain/categories/validation";
import type { SessionDraftCategorySelection } from "@/domain/sessions/SessionDraft";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useSessionService } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/** Un tag affiché : soit une Catégorie déjà connue (prédéfinie ou persistée), soit une Catégorie créée dans ce même parcours (jamais encore persistée). */
type CategoryTag = { readonly key: string; readonly name: string; readonly selection: SessionDraftCategorySelection };

type CategoriesLoadState =
  | { status: "loading" }
  | { status: "ready"; categories: readonly Category[] }
  | { status: "error" };

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error" };

function selectionMatches(a: SessionDraftCategorySelection, b: SessionDraftCategorySelection): boolean {
  if (a.kind !== b.kind) {
    return false;
  }
  return a.kind === "EXISTING" && b.kind === "EXISTING" ? a.categoryId === b.categoryId : a.kind === "NEW" && b.kind === "NEW" && a.id === b.id;
}

/**
 * Écran `Catégories de la séance` (T01-S09, CE-T01-11/CE-T01-12,
 * D-106/D-107). Le brouillon vient de `SessionDraftProvider` (même Provider
 * que `CompositionScreen`, monté par `app/(creation)/_layout.tsx`) — cette
 * route ne connaît ni SQLite ni Repository directement, uniquement
 * `SessionService` via `useSessionService()` (lecture des Catégories,
 * enregistrement final).
 *
 * Aucun texte introductif : le libellé de section (`Catégories`) et les
 * tags suffisent (D-106). `Retour` (en-tête) revient à la Composition sans
 * rien réinitialiser — les sélections temporaires restent dans le
 * brouillon partagé, par construction (aucune action locale n'y touche).
 */
export function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionService = useSessionService();
  const { draft, updateDraft, resetDraft } = useSessionDraft();

  const [categoriesState, setCategoriesState] = useState<CategoriesLoadState>({ status: "loading" });
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const isSavingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // Pas de `setCategoriesState({ status: "loading" })` ici : l'état
    // initial (`useState`) vaut déjà `{ status: "loading" }" — l'écrire à
    // nouveau au tout premier rendu de cet effet déclencherait un second
    // rendu synchrone évitable (règle `react-hooks/set-state-in-effect`).
    // `sessionService` reste une référence stable pour toute la durée de
    // vie de cet écran (fournie par le contexte, jamais recréée) : cet
    // effet ne s'exécute donc en pratique qu'une seule fois.
    sessionService.listCategories().then(
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
  }, [sessionService]);

  const t = strings.screens.categories;

  const persistedTags: readonly CategoryTag[] =
    categoriesState.status === "ready"
      ? categoriesState.categories.map((category) => ({
          key: `existing-${category.id}`,
          name: category.name,
          selection: { kind: "EXISTING", categoryId: category.id },
        }))
      : [];

  // Les Catégories créées dans ce même parcours (jamais encore persistées)
  // s'ajoutent après les prédéfinies et après les personnalisées déjà
  // connues (D-107) : simplement en fin de liste, puisque `persistedTags`
  // est déjà dans cet ordre et qu'une Catégorie fraîchement créée est par
  // construction la plus récente.
  const draftOnlyTags: readonly CategoryTag[] = draft.categorySelections
    .filter((selection): selection is Extract<SessionDraftCategorySelection, { kind: "NEW" }> => selection.kind === "NEW")
    .map((selection) => ({ key: `new-${selection.id}`, name: selection.name, selection }));

  const tags: readonly CategoryTag[] = [...persistedTags, ...draftOnlyTags];

  function isSelected(selection: SessionDraftCategorySelection): boolean {
    return draft.categorySelections.some((current) => selectionMatches(current, selection));
  }

  function toggleTag(tag: CategoryTag) {
    if (isSelected(tag.selection)) {
      updateDraft({
        categorySelections: draft.categorySelections.filter(
          (current) => !selectionMatches(current, tag.selection),
        ),
      });
      return;
    }
    updateDraft({ categorySelections: [...draft.categorySelections, tag.selection] });
  }

  function openCreateRow() {
    setIsCreatingCategory(true);
    setNewCategoryName("");
  }

  function cancelCreateRow() {
    setIsCreatingCategory(false);
    setNewCategoryName("");
  }

  const canAddCategory = validateCategoryName(newCategoryName).ok;

  function handleAddCategory() {
    const validated = validateCategoryName(newCategoryName);
    if (!validated.ok) {
      return;
    }
    const normalizedName = validated.value;

    // Candidats de correspondance canonique (D-106) : Catégories déjà
    // persistées (prédéfinies ou d'une Séance antérieure) ET Catégories
    // déjà créées dans CE brouillon, dans ce même parcours.
    const candidates = [
      ...persistedTags.map((tag) => ({
        id: tag.selection.kind === "EXISTING" ? tag.selection.categoryId : "",
        canonicalKey: canonicalCategoryKey(tag.name),
      })),
      ...draftOnlyTags.map((tag) => ({
        id: tag.selection.kind === "NEW" ? tag.selection.id : "",
        canonicalKey: canonicalCategoryKey(tag.name),
      })),
    ];
    const match = findCategoryMatch(candidates, normalizedName);

    if (match) {
      // Doublon canonique (D-106) : sélectionne l'existante (si elle ne
      // l'est pas déjà — une Catégorie NEW l'est nécessairement, une
      // EXISTING peut ne pas l'être) et ferme la ligne, sans créer aucune
      // nouvelle entrée ni afficher d'erreur.
      const existingSelection = persistedTags.find(
        (tag) => tag.selection.kind === "EXISTING" && tag.selection.categoryId === match.id,
      )?.selection;
      if (existingSelection && !isSelected(existingSelection)) {
        updateDraft({ categorySelections: [...draft.categorySelections, existingSelection] });
      }
      cancelCreateRow();
      return;
    }

    const newSelection: SessionDraftCategorySelection = {
      kind: "NEW",
      id: Crypto.randomUUID(),
      name: normalizedName,
    };
    updateDraft({ categorySelections: [...draft.categorySelections, newSelection] });
    cancelCreateRow();
  }

  async function handleSave() {
    if (isSavingRef.current) {
      return;
    }
    isSavingRef.current = true;
    setSaveState({ status: "saving" });

    try {
      const result = await sessionService.createSession(draft);
      if (!result.ok) {
        // Défense de dernier recours : le brouillon devrait déjà être
        // valide à ce stade (Composition n'autorise `Continuer` que pour un
        // brouillon valide) — un échec de validation ici ne peut provenir
        // que d'un état incohérent imprévu, traité comme tout autre échec
        // d'enregistrement (D-107, même message).
        isSavingRef.current = false;
        setSaveState({ status: "error" });
        return;
      }
      resetDraft();
      router.dismissTo("/");
    } catch (error) {
      console.error("La séance n'a pas pu être enregistrée.", error);
      isSavingRef.current = false;
      setSaveState({ status: "error" });
    }
  }

  const isSaving = saveState.status === "saving";

  return (
    <ScreenShell>
      <FixedHeader title={t.title} onBack={() => router.back()} backAccessibilityLabel={t.backAccessibilityLabel} />
      <HeaderSeparator />

      <ScrollView contentContainerStyle={styles.bodyContent} testID="categories-body">
        <Text style={styles.sectionLabel}>{t.sectionLabel}</Text>

        {categoriesState.status === "loading" ? (
          <Text accessibilityLabel={t.loading.accessibilityLabel} style={styles.helperText}>
            {t.loading.accessibilityLabel}
          </Text>
        ) : null}

        {categoriesState.status === "error" ? (
          <Text style={styles.errorText}>{t.error.message}</Text>
        ) : null}

        <View style={styles.tagRow} testID="categories-tag-row">
          {tags.map((tag) => {
            const selected = isSelected(tag.selection);
            return (
              <Pressable
                key={tag.key}
                onPress={() => toggleTag(tag)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={
                  selected ? `${tag.name} ${t.tagAccessibility.selectedSuffix}` : tag.name
                }
                hitSlop={CATEGORY_TAG_HIT_SLOP}
                style={[styles.tag, selected ? styles.tagSelected : null]}
                testID={`category-tag-${tag.key}`}
              >
                <Text style={[styles.tagLabel, selected ? styles.tagLabelSelected : null]}>{tag.name}</Text>
                {selected ? (
                  <KodjoIcon name="state-selected" size={14} testID={`category-tag-selected-icon-${tag.key}`} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {isCreatingCategory ? (
          <View style={styles.newCategoryRow} testID="categories-new-row">
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder={t.newCategory.placeholder}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t.newCategory.placeholder}
              maxLength={CATEGORY_NAME_MAX_LENGTH}
              autoFocus
              style={styles.newCategoryInput}
              testID="categories-new-name-input"
            />
            <Pressable
              onPress={cancelCreateRow}
              accessibilityRole="button"
              accessibilityLabel={t.newCategory.cancelAccessibilityLabel}
              style={styles.newCategoryCancelAction}
            >
              <Text style={styles.newCategoryCancelLabel}>{t.newCategory.cancelAccessibilityLabel}</Text>
            </Pressable>
            <Pressable
              disabled={!canAddCategory}
              onPress={handleAddCategory}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canAddCategory }}
              accessibilityLabel={t.newCategory.addAccessibilityLabel}
              style={[styles.newCategoryAddAction, !canAddCategory ? styles.newCategoryAddActionDisabled : null]}
            >
              <Text style={styles.newCategoryAddLabel}>{t.newCategory.addAccessibilityLabel}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={openCreateRow}
            accessibilityRole="button"
            accessibilityLabel={t.createAction}
            style={styles.createAction}
            testID="categories-create-action"
          >
            <KodjoIcon name="action-add" testID="categories-create-action-icon" />
            <Text style={styles.createActionLabel}>{t.createAction}</Text>
          </Pressable>
        )}
      </ScrollView>

      <View
        testID="categories-bottom-action"
        style={[styles.bottomAction, { marginBottom: insets.bottom + spacing[16] }]}
      >
        {saveState.status === "error" ? (
          <Text style={styles.saveErrorText} testID="categories-save-error">
            {t.saveError}
          </Text>
        ) : null}
        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving }}
          accessibilityLabel={t.saveAction}
          style={[styles.saveAction, isSaving ? styles.saveActionDisabled : null]}
        >
          <Text style={styles.saveActionLabel}>{t.saveAction}</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const CATEGORY_TAG_HIT_SLOP = Math.max(
  0,
  Math.ceil((minTouchTarget - dimensions.categoryTag.visualHeight) / 2),
);

const styles = StyleSheet.create({
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
    gap: spacing[16],
  },
  sectionLabel: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  helperText: {
    ...type.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...type.body,
    color: colors.danger,
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
  tagSelected: {
    borderColor: colors.selection,
    backgroundColor: colors.selectionSurface,
  },
  tagLabel: {
    ...type.label,
    color: colors.textPrimary,
  },
  tagLabelSelected: {
    color: colors.selection,
  },
  createAction: {
    alignSelf: "flex-start",
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
  createActionLabel: {
    ...type.button,
    color: colors.primary,
  },
  newCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  newCategoryInput: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing[12],
    height: 42,
  },
  newCategoryCancelAction: {
    paddingHorizontal: spacing[8],
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  newCategoryCancelLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
  newCategoryAddAction: {
    paddingHorizontal: spacing[12],
    height: 42,
    borderRadius: 8,
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
  bottomAction: {
    marginHorizontal: spacing[24],
    gap: spacing[12],
  },
  saveErrorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
  },
  saveAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  saveActionDisabled: {
    backgroundColor: colors.disabled,
  },
  saveActionLabel: {
    ...type.button,
    color: colors.background,
  },
});
