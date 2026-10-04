import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  isCategoryAssignable,
  type Category,
  type CategoryColor,
} from "@/domain/categories/Category";
import { CATEGORY_NAME_MAX_LENGTH, validateCategoryName } from "@/domain/categories/validation";
import { SESSION_COLORS } from "@/domain/sessions/Session";
import { ColorPalette } from "@/features/sessions/ColorPalette";
import { ReferenceValueDialog } from "@/features/reference-data/ReferenceValueDialog";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

export type CategoryPickerModalProps = {
  /** Catégorie actuellement affectée — `null` si aucune (D-211 : toujours requise avant `Terminer`, mais l'ouverture de la modale ne présuppose rien). */
  selectedId: string | null;
  /** Appui court sur une Catégorie active : sélectionne et ferme (AC873C19CD5A9) — jamais de bouton de validation supplémentaire. */
  onSelect: (id: string) => void;
  onClose: () => void;
};

/**
 * Modale de sélection Catégorie (V2-PRE-2, plan §6.5, D-211 ; CE-UI-09
 * L2769-2857, §4.10 L128-145) : choix unique au toucher, création avec
 * palette, modification (nom, couleur) et suppression logique par appui
 * long (D4/D-259), réactivation D2. Les dix Catégories prédéfinies sont
 * administrables exactement comme les Catégories créées (§4.10 L137 :
 * aucune garde sur `isPredefined`).
 */
export function CategoryPickerModal({ selectedId, onSelect, onClose }: CategoryPickerModalProps) {
  const referentialService = useReferentialService();
  const [categories, setCategories] = useState<readonly Category[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CategoryColor>(SESSION_COLORS[0]!);
  const [isNewPaletteOpen, setIsNewPaletteOpen] = useState(false);
  const [longPressTarget, setLongPressTarget] = useState<Category | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<CategoryColor>(SESSION_COLORS[0]!);
  const [isEditPaletteOpen, setIsEditPaletteOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [retiredNotice, setRetiredNotice] = useState(false);
  const [deleteTargetUsed, setDeleteTargetUsed] = useState(false);
  const t = strings.referenceData.category;

  function reload() {
    referentialService.listCategories().then(setCategories);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialService]);

  const activeCategories = (categories ?? []).filter(isCategoryAssignable);
  const canAddCategory = validateCategoryName(newName).ok;
  const canSaveEdit = validateCategoryName(editName).ok;

  function handleSelect(category: Category) {
    onSelect(category.id);
    onClose();
  }

  async function handleCreate() {
    const validated = validateCategoryName(newName);
    if (!validated.ok) {
      return;
    }
    const result = await referentialService.createCategory({ name: validated.value, color: newColor });
    if (result.status === "DUPLICATE") {
      setDuplicateError(true);
      return;
    }
    reload();
    setIsCreating(false);
    setNewName("");
    setDuplicateError(false);
    if (result.status === "OK") {
      onSelect(result.value.id);
      onClose();
    }
  }

  function openEdit(category: Category) {
    setEditTarget(category);
    setEditName(category.name);
    setEditColor(category.color);
    setDuplicateError(false);
    setLongPressTarget(null);
  }

  async function handleSaveEdit() {
    if (!editTarget) {
      return;
    }
    const validated = validateCategoryName(editName);
    if (!validated.ok) {
      return;
    }
    const renamed = await referentialService.renameCategory(editTarget.id, validated.value);
    if (renamed.status === "DUPLICATE") {
      setDuplicateError(true);
      return;
    }
    await referentialService.recolorCategory(editTarget.id, editColor);
    reload();
    setEditTarget(null);
    setDuplicateError(false);
  }

  async function openDeleteConfirm(category: Category) {
    const used = await referentialService.isCategoryUsed(category.id);
    setDeleteTargetUsed(used);
  }

  async function handleDelete() {
    if (!longPressTarget) {
      return;
    }
    const wasSelected = selectedId === longPressTarget.id;
    await referentialService.retireCategory(longPressTarget.id);
    reload();
    setLongPressTarget(null);
    if (wasSelected) {
      setRetiredNotice(true);
    }
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} testID="category-picker-backdrop">
        <View style={styles.card} testID="category-picker-card">
          <Text style={styles.title}>{t.title}</Text>

          {retiredNotice ? (
            <Text style={styles.retiredNotice} testID="category-picker-retired-notice">
              {strings.referenceData.retiredValueMessage}
            </Text>
          ) : null}

          <View style={styles.tagRow} testID="category-picker-tag-row">
            {activeCategories.map((category) => {
              const isSelected = category.id === selectedId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleSelect(category)}
                  onLongPress={() => {
                    setLongPressTarget(category);
                    void openDeleteConfirm(category);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.name}${isSelected ? ` ${strings.screens.categories.tagAccessibility.selectedSuffix}` : ""}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.tag, isSelected ? styles.tagSelected : null]}
                  testID={`category-picker-tag-${category.id}`}
                >
                  <View style={[styles.swatch, { backgroundColor: category.color }]} />
                  <Text style={styles.tagLabel}>{category.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {isCreating ? (
            <View style={styles.newEntryContainer} testID="category-picker-new-row">
              <TextInput
                value={newName}
                onChangeText={(text) => {
                  setNewName(text);
                  setDuplicateError(false);
                }}
                placeholder={t.newEntry.placeholder}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel={t.newEntry.placeholder}
                maxLength={CATEGORY_NAME_MAX_LENGTH}
                autoFocus
                style={styles.newEntryInput}
                testID="category-picker-new-name-input"
              />
              <ColorPalette
                value={newColor}
                onChange={setNewColor}
                isOpen={isNewPaletteOpen}
                onToggle={() => setIsNewPaletteOpen((current) => !current)}
              />
              {duplicateError ? (
                <Text style={styles.errorText} testID="category-picker-new-error">
                  {strings.referenceData.renameDialog.duplicateError}
                </Text>
              ) : null}
              <View style={styles.newEntryActionsRow}>
                <Pressable
                  onPress={() => {
                    setIsCreating(false);
                    setNewName("");
                    setDuplicateError(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t.newEntry.cancelAccessibilityLabel}
                  style={styles.neutralAction}
                  testID="category-picker-new-cancel"
                >
                  <Text style={styles.neutralActionLabel}>{t.newEntry.cancelAccessibilityLabel}</Text>
                </Pressable>
                <Pressable
                  disabled={!canAddCategory}
                  onPress={handleCreate}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canAddCategory }}
                  accessibilityLabel={t.newEntry.addAccessibilityLabel}
                  style={[styles.primaryAction, !canAddCategory ? styles.primaryActionDisabled : null]}
                  testID="category-picker-new-add"
                >
                  <Text style={styles.primaryActionLabel}>{t.newEntry.addAccessibilityLabel}</Text>
                </Pressable>
              </View>
            </View>
          ) : editTarget ? (
            <View style={styles.newEntryContainer} testID="category-picker-edit-row">
              <TextInput
                value={editName}
                onChangeText={(text) => {
                  setEditName(text);
                  setDuplicateError(false);
                }}
                accessibilityLabel={strings.referenceData.renameDialog.nameLabel}
                maxLength={CATEGORY_NAME_MAX_LENGTH}
                autoFocus
                style={styles.newEntryInput}
                testID="category-picker-edit-name-input"
              />
              <ColorPalette
                value={editColor}
                onChange={setEditColor}
                isOpen={isEditPaletteOpen}
                onToggle={() => setIsEditPaletteOpen((current) => !current)}
              />
              {duplicateError ? (
                <Text style={styles.errorText} testID="category-picker-edit-error">
                  {strings.referenceData.renameDialog.duplicateError}
                </Text>
              ) : null}
              <View style={styles.newEntryActionsRow}>
                <Pressable
                  onPress={() => {
                    setEditTarget(null);
                    setDuplicateError(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={strings.referenceData.renameDialog.cancelAction}
                  style={styles.neutralAction}
                  testID="category-picker-edit-cancel"
                >
                  <Text style={styles.neutralActionLabel}>{strings.referenceData.renameDialog.cancelAction}</Text>
                </Pressable>
                <Pressable
                  disabled={!canSaveEdit}
                  onPress={handleSaveEdit}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canSaveEdit }}
                  accessibilityLabel={strings.referenceData.renameDialog.saveAction}
                  style={[styles.primaryAction, !canSaveEdit ? styles.primaryActionDisabled : null]}
                  testID="category-picker-edit-save"
                >
                  <Text style={styles.primaryActionLabel}>{strings.referenceData.renameDialog.saveAction}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsCreating(true)}
              accessibilityRole="button"
              accessibilityLabel={t.createAction}
              style={styles.createAction}
              testID="category-picker-create-action"
            >
              <KodjoIcon name="action-add" testID="category-picker-create-icon" />
              <Text style={styles.createActionLabel}>{t.createAction}</Text>
            </Pressable>
          )}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.closeAccessibilityLabel}
            style={styles.closeAction}
            testID="category-picker-close"
          >
            <Text style={styles.closeActionLabel}>{t.closeAccessibilityLabel}</Text>
          </Pressable>
        </View>
      </View>

      {longPressTarget ? (
        <ReferenceValueDialog
          name={longPressTarget.name}
          isUsed={deleteTargetUsed}
          onCancel={() => setLongPressTarget(null)}
          onModify={() => openEdit(longPressTarget)}
          onDelete={handleDelete}
          testIDPrefix="category-picker-long-press"
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[24],
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: dimensions.standardCard.radius,
    backgroundColor: colors.background,
    padding: spacing[24],
    gap: spacing[16],
  },
  title: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  retiredNotice: {
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
    gap: spacing[6],
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
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagLabel: {
    ...type.label,
    color: colors.textPrimary,
  },
  createAction: {
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
  createActionLabel: {
    ...type.button,
    color: colors.primary,
  },
  newEntryContainer: {
    gap: spacing[12],
  },
  newEntryInput: {
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
  newEntryActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[12],
  },
  errorText: {
    ...type.caption,
    color: colors.danger,
  },
  neutralAction: {
    height: dimensions.categoryTag.visualHeight,
    borderRadius: dimensions.categoryTag.visualHeight / 2,
    paddingHorizontal: spacing[16],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  neutralActionLabel: {
    ...type.button,
    color: colors.dialogNeutralActionText,
  },
  primaryAction: {
    height: dimensions.categoryTag.visualHeight,
    borderRadius: dimensions.categoryTag.visualHeight / 2,
    paddingHorizontal: spacing[16],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  primaryActionDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryActionLabel: {
    ...type.button,
    color: colors.background,
  },
  closeAction: {
    alignSelf: "center",
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[16],
  },
  closeActionLabel: {
    ...type.button,
    color: colors.textSecondary,
  },
});
