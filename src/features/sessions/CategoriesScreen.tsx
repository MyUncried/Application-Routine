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
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useSessionService } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";
import { FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/** Un tag affiché : soit une Catégorie déjà connue (prédéfinie ou persistée), soit une Catégorie créée dans ce même parcours (jamais encore persistée). Son existence (présence dans cette liste) est indépendante de son état sélectionné. */
type CategoryTag = { readonly id: string; readonly name: string };

type CategoriesLoadState =
  | { status: "loading" }
  | { status: "ready"; categories: readonly Category[] }
  | { status: "error" };

type SaveState = { status: "idle" } | { status: "saving" } | { status: "error" };

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
 * brouillon partagé, par construction (aucune action locale n'y touche) ;
 * revenir ensuite sur cet écran restitue exactement le même état (Catégories
 * personnalisées créées et sélection), le brouillon survivant à la
 * navigation entre écrans du même `Stack`.
 *
 * **Correction du BLOCKING_POINT (revue 5551813745, T01-S09 correction
 * VISUAL tentative 2)** : l'existence d'une Catégorie personnalisée dans le
 * brouillon (`draft.categoryDrafts`) est désormais explicitement séparée de
 * son état sélectionné (`draft.selectedCategoryIds`) — désélectionner un tag
 * `NEW` ne le fait plus disparaître : il reste affiché, non sélectionné, et
 * peut être resélectionné sans jamais être recréé en double (voir
 * `SessionDraft.ts`, `SessionDraftCategoryDraft`).
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
      ? categoriesState.categories.map((category) => ({ id: category.id, name: category.name }))
      : [];

  // Les Catégories créées dans ce même parcours (jamais encore persistées)
  // s'ajoutent après les prédéfinies et après les personnalisées déjà
  // connues (D-107) : simplement en fin de liste, puisque `persistedTags`
  // est déjà dans cet ordre et qu'une Catégorie fraîchement créée est par
  // construction la plus récente. Leur EXISTENCE (`draft.categoryDrafts`)
  // ne dépend jamais de leur sélection courante — voir la note de tête.
  const draftOnlyTags: readonly CategoryTag[] = draft.categoryDrafts;

  const tags: readonly CategoryTag[] = [...persistedTags, ...draftOnlyTags];

  function isSelected(id: string): boolean {
    return draft.selectedCategoryIds.includes(id);
  }

  function toggleTag(id: string) {
    updateDraft({
      selectedCategoryIds: isSelected(id)
        ? draft.selectedCategoryIds.filter((current) => current !== id)
        : [...draft.selectedCategoryIds, id],
    });
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

  function selectId(id: string) {
    if (!isSelected(id)) {
      updateDraft({ selectedCategoryIds: [...draft.selectedCategoryIds, id] });
    }
  }

  function handleAddCategory() {
    const validated = validateCategoryName(newCategoryName);
    if (!validated.ok) {
      return;
    }
    const normalizedName = validated.value;

    // Candidats de correspondance canonique (D-106) : Catégories déjà
    // persistées (prédéfinies ou d'une Séance antérieure) ET Catégories
    // déjà créées dans CE brouillon, dans ce même parcours — qu'elles
    // soient actuellement sélectionnées ou non (une Catégorie
    // désélectionnée reste un candidat valide, jamais recréée en double).
    const candidates = tags.map((tag) => ({ id: tag.id, canonicalKey: canonicalCategoryKey(tag.name) }));
    const match = findCategoryMatch(candidates, normalizedName);

    if (match) {
      // Doublon canonique (D-106) : sélectionne l'existante — qu'elle soit
      // déjà persistée ou déjà présente dans `categoryDrafts` — et ferme la
      // ligne, sans jamais créer de nouvelle entrée ni afficher d'erreur.
      selectId(match.id);
      cancelCreateRow();
      return;
    }

    const newId = Crypto.randomUUID();
    updateDraft({
      categoryDrafts: [...draft.categoryDrafts, { id: newId, name: normalizedName }],
      selectedCategoryIds: [...draft.selectedCategoryIds, newId],
    });
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
            const selected = isSelected(tag.id);
            return (
              <Pressable
                key={tag.id}
                onPress={() => toggleTag(tag.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={
                  selected ? `${tag.name} ${t.tagAccessibility.selectedSuffix}` : tag.name
                }
                hitSlop={CATEGORY_TAG_HIT_SLOP}
                style={[styles.tag, selected ? styles.tagSelected : null]}
                testID={`category-tag-${tag.id}`}
              >
                <Text style={[styles.tagLabel, selected ? styles.tagLabelSelected : null]}>{tag.name}</Text>
                {selected ? (
                  <KodjoIcon name="state-selected" size={14} testID={`category-tag-selected-icon-${tag.id}`} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {isCreatingCategory ? (
          <View style={styles.newCategoryContainer} testID="categories-new-row">
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
            <View style={styles.newCategoryActionsRow} testID="categories-new-actions-row">
              <Pressable
                onPress={cancelCreateRow}
                accessibilityRole="button"
                accessibilityLabel={t.newCategory.cancelAccessibilityLabel}
                hitSlop={NEW_CATEGORY_ACTION_HIT_SLOP}
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
                hitSlop={NEW_CATEGORY_ACTION_HIT_SLOP}
                style={[styles.newCategoryAddAction, !canAddCategory ? styles.newCategoryAddActionDisabled : null]}
              >
                <Text style={styles.newCategoryAddLabel}>{t.newCategory.addAccessibilityLabel}</Text>
              </Pressable>
            </View>
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

/**
 * Hauteur visuelle des actions `Annuler`/`Ajouter` de la ligne de création
 * (correction VISUAL, point C) : identique à la pilule des tags de
 * Catégorie/Zones corporelles (`dimensions.categoryTag.visualHeight`,
 * elle-même déjà alignée sur `BodyZoneSelector`), extrémités en demi-cercle
 * (`borderRadius = hauteur / 2`) — jamais une nouvelle géométrie locale.
 * Cible tactile minimale préservée séparément via `hitSlop`.
 */
const NEW_CATEGORY_BUTTON_HEIGHT = dimensions.categoryTag.visualHeight;
const NEW_CATEGORY_ACTION_HIT_SLOP = Math.max(
  0,
  Math.ceil((minTouchTarget - NEW_CATEGORY_BUTTON_HEIGHT) / 2),
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
  // Correction VISUAL, point C : le champ occupe désormais seul toute la
  // largeur utile (`newCategoryContainer` remplace l'ancienne rangée
  // horizontale unique champ+actions) ; `Annuler`/`Ajouter` forment une
  // rangée distincte EN DESSOUS, centrée horizontalement
  // (`newCategoryActionsRow`).
  newCategoryContainer: {
    gap: spacing[12],
  },
  // Hauteur canonique d'un champ de saisie (`dimensions.exerciseTextField
  // .height`, déjà réutilisée telle quelle ailleurs — jamais une valeur
  // locale improvisée) ; police exactement celle des tags/pastilles de
  // Zones corporelles existants (`type.body`, `BodyZoneSelector.tsx`).
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
  // `Annuler` gris (neutre) — réutilise les tokens déjà établis pour une
  // action neutre (`DecisionDialog`/`AbandonCreationModal`), jamais une
  // nouvelle couleur locale.
  newCategoryCancelAction: {
    height: NEW_CATEGORY_BUTTON_HEIGHT,
    borderRadius: NEW_CATEGORY_BUTTON_HEIGHT / 2,
    paddingHorizontal: spacing[16],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  newCategoryCancelLabel: {
    ...type.button,
    color: colors.dialogNeutralActionText,
  },
  // `Ajouter` conserve la couleur d'action principale (`colors.primary`,
  // bleu DSF) — reconfirmé explicitement par la correction VISUAL, 2e
  // contre-recette (T01-S09, point C, commentaire de revue 5551083690) :
  // déjà conforme, aucune modification de code nécessaire ici, seule la
  // couverture de test dédiée (`CategoriesScreen.test.tsx`) était manquante.
  newCategoryAddAction: {
    height: NEW_CATEGORY_BUTTON_HEIGHT,
    borderRadius: NEW_CATEGORY_BUTTON_HEIGHT / 2,
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
