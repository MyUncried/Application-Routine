import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { isLabelAssignable, LABEL_NAME_MAX_LENGTH, validateLabelName, type Label, type LabelColor } from "@/domain/labels/Label";
import { SESSION_COLORS } from "@/domain/sessions/Session";
import { ColorPalette } from "@/features/sessions/ColorPalette";
import { ReferenceValueDialog } from "@/features/reference-data/ReferenceValueDialog";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

export type LabelPickerModalProps = {
  /** Étiquette actuellement affectée au brouillon — `null` si aucune. */
  selectedId: string | null;
  /**
   * Appui sur une Étiquette : sélectionne et ferme ; un nouveau toucher sur
   * l'Étiquette déjà sélectionnée la retire (A3409468666E5). `null` retire
   * l'affectation. L'enregistrement réel n'a lieu qu'à `Continuer` — cette
   * modale ne fait jamais qu'écrire dans le brouillon en mémoire.
   */
  onSelect: (id: string | null) => void;
  onClose: () => void;
};

/**
 * Modale de sélection Étiquette (V2-PRE-2, plan §6.5 ; CE-T03-16
 * L1606-1692, CE-T03-08 L880-928, §4.10) : zéro ou une, choix au toucher,
 * désaffectation par nouveau toucher, administration du référentiel avec
 * couleur (création, modification, suppression logique par appui long,
 * réactivation D2).
 */
export function LabelPickerModal({ selectedId, onSelect, onClose }: LabelPickerModalProps) {
  const referentialService = useReferentialService();
  const [labels, setLabels] = useState<readonly Label[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>(SESSION_COLORS[0]!);
  const [isNewPaletteOpen, setIsNewPaletteOpen] = useState(false);
  const [longPressTarget, setLongPressTarget] = useState<Label | null>(null);
  const [editTarget, setEditTarget] = useState<Label | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<LabelColor>(SESSION_COLORS[0]!);
  const [isEditPaletteOpen, setIsEditPaletteOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [deleteTargetUsed, setDeleteTargetUsed] = useState(false);
  const t = strings.referenceData.label;

  function reload() {
    referentialService.listLabels().then(setLabels);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialService]);

  const activeLabels = (labels ?? []).filter(isLabelAssignable);
  const canAddLabel = validateLabelName(newName).ok;
  const canSaveEdit = validateLabelName(editName).ok;

  function handlePress(label: Label) {
    if (label.id === selectedId) {
      onSelect(null);
      onClose();
      return;
    }
    onSelect(label.id);
    onClose();
  }

  async function handleCreate() {
    const validated = validateLabelName(newName);
    if (!validated.ok) {
      return;
    }
    const result = await referentialService.createLabel({ name: validated.value, color: newColor });
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

  function openEdit(label: Label) {
    setEditTarget(label);
    setEditName(label.name);
    setEditColor(label.color);
    setDuplicateError(false);
    setLongPressTarget(null);
  }

  async function handleSaveEdit() {
    if (!editTarget) {
      return;
    }
    const validated = validateLabelName(editName);
    if (!validated.ok) {
      return;
    }
    const renamed = await referentialService.renameLabel(editTarget.id, validated.value);
    if (renamed.status === "DUPLICATE") {
      setDuplicateError(true);
      return;
    }
    await referentialService.recolorLabel(editTarget.id, editColor);
    reload();
    setEditTarget(null);
    setDuplicateError(false);
  }

  async function openDeleteConfirm(label: Label) {
    const used = await referentialService.isLabelUsed(label.id);
    setDeleteTargetUsed(used);
  }

  async function handleDelete() {
    if (!longPressTarget) {
      return;
    }
    await referentialService.retireLabel(longPressTarget.id);
    reload();
    setLongPressTarget(null);
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} testID="label-picker-backdrop">
        <View style={styles.card} testID="label-picker-card">
          <Text style={styles.title}>{t.title}</Text>

          <View style={styles.tagRow} testID="label-picker-tag-row">
            {activeLabels.map((label) => {
              const isSelected = label.id === selectedId;
              return (
                <Pressable
                  key={label.id}
                  onPress={() => handlePress(label)}
                  onLongPress={() => {
                    setLongPressTarget(label);
                    void openDeleteConfirm(label);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${label.name}${isSelected ? ` — ${strings.screens.categories.tagAccessibility.selectedSuffix}` : ""}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[styles.tag, isSelected ? styles.tagSelected : null]}
                  testID={`label-picker-tag-${label.id}`}
                >
                  <View style={[styles.swatch, { backgroundColor: label.color }]} />
                  <Text style={styles.tagLabel}>{label.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {isCreating ? (
            <View style={styles.newEntryContainer} testID="label-picker-new-row">
              <TextInput
                value={newName}
                onChangeText={(text) => {
                  setNewName(text);
                  setDuplicateError(false);
                }}
                placeholder={t.newEntry.placeholder}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel={t.newEntry.placeholder}
                maxLength={LABEL_NAME_MAX_LENGTH}
                autoFocus
                style={styles.newEntryInput}
                testID="label-picker-new-name-input"
              />
              <ColorPalette
                value={newColor}
                onChange={setNewColor}
                isOpen={isNewPaletteOpen}
                onToggle={() => setIsNewPaletteOpen((current) => !current)}
              />
              {duplicateError ? (
                <Text style={styles.errorText} testID="label-picker-new-error">
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
                  testID="label-picker-new-cancel"
                >
                  <Text style={styles.neutralActionLabel}>{t.newEntry.cancelAccessibilityLabel}</Text>
                </Pressable>
                <Pressable
                  disabled={!canAddLabel}
                  onPress={handleCreate}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canAddLabel }}
                  accessibilityLabel={t.newEntry.addAccessibilityLabel}
                  style={[styles.primaryAction, !canAddLabel ? styles.primaryActionDisabled : null]}
                  testID="label-picker-new-add"
                >
                  <Text style={styles.primaryActionLabel}>{t.newEntry.addAccessibilityLabel}</Text>
                </Pressable>
              </View>
            </View>
          ) : editTarget ? (
            <View style={styles.newEntryContainer} testID="label-picker-edit-row">
              <TextInput
                value={editName}
                onChangeText={(text) => {
                  setEditName(text);
                  setDuplicateError(false);
                }}
                accessibilityLabel={strings.referenceData.renameDialog.nameLabel}
                maxLength={LABEL_NAME_MAX_LENGTH}
                autoFocus
                style={styles.newEntryInput}
                testID="label-picker-edit-name-input"
              />
              <ColorPalette
                value={editColor}
                onChange={setEditColor}
                isOpen={isEditPaletteOpen}
                onToggle={() => setIsEditPaletteOpen((current) => !current)}
              />
              {duplicateError ? (
                <Text style={styles.errorText} testID="label-picker-edit-error">
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
                  testID="label-picker-edit-cancel"
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
                  testID="label-picker-edit-save"
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
              testID="label-picker-create-action"
            >
              <KodjoIcon name="action-add" testID="label-picker-create-icon" />
              <Text style={styles.createActionLabel}>{t.createAction}</Text>
            </Pressable>
          )}

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.closeAccessibilityLabel}
            style={styles.closeAction}
            testID="label-picker-close"
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
          testIDPrefix="label-picker-long-press"
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
