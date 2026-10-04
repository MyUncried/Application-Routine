import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { isBodyZoneAssignable, BODY_ZONE_NAME_MAX_LENGTH, validateBodyZoneName } from "@/domain/body-zones/BodyZone";
import type { Silhouette } from "@/domain/preferences/Profile";
import { ReferenceValueDialog } from "@/features/reference-data/ReferenceValueDialog";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, spacing, type } from "@/shared/ui/tokens";

export type BodyZonePickerModalProps = {
  selectedIds: readonly string[];
  /** « Confirmer » applique la sélection — jamais appelé en fermant sans confirmer (ABA5D2662CA69). */
  onConfirm: (ids: readonly string[]) => void;
  onClose: () => void;
  /** Silhouette du Profil — icône de Zone (CE-UI-09 L2805, T13). */
  silhouette?: Silhouette | null;
};

/**
 * Modale de sélection des Zones corporelles (V2-PRE-2, plan §6.5 ; CE-UI-09
 * L2769-2857, §4.10 L128-145) : sélection multiple, validée explicitement
 * par `Confirmer` — fermer sans confirmer restaure la sélection précédente.
 * Création, renommage et suppression logique par appui long (D4/D-259) ;
 * aucune couleur n'est jamais proposée ni stockée pour une Zone.
 */
export function BodyZonePickerModal({
  selectedIds,
  onConfirm,
  onClose,
  silhouette,
}: BodyZonePickerModalProps) {
  const referentialService = useReferentialService();
  const [zones, setZones] = useState<readonly BodyZone[] | null>(null);
  const [working, setWorking] = useState<readonly string[]>(selectedIds);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [longPressTarget, setLongPressTarget] = useState<BodyZone | null>(null);
  const [editTarget, setEditTarget] = useState<BodyZone | null>(null);
  const [editName, setEditName] = useState("");
  const [duplicateError, setDuplicateError] = useState(false);
  const [deleteTargetUsed, setDeleteTargetUsed] = useState(false);
  const [atLeastOneNotice, setAtLeastOneNotice] = useState(false);
  const t = strings.referenceData.bodyZone;

  function reload() {
    referentialService.listBodyZones().then(setZones);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialService]);

  const activeZones = (zones ?? []).filter(isBodyZoneAssignable);
  const canAddZone = validateBodyZoneName(newName).ok;
  const canSaveEdit = validateBodyZoneName(editName).ok;

  function handleToggle(zoneId: string) {
    setAtLeastOneNotice(false);
    setWorking((current) => {
      if (current.includes(zoneId)) {
        if (current.length <= 1) {
          setAtLeastOneNotice(true);
          return current;
        }
        return current.filter((id) => id !== zoneId);
      }
      return [...current, zoneId];
    });
  }

  function handleConfirm() {
    onConfirm(working);
    onClose();
  }

  async function handleCreate() {
    const validated = validateBodyZoneName(newName);
    if (!validated.ok) {
      return;
    }
    const result = await referentialService.createBodyZone({ name: validated.value });
    if (result.status === "DUPLICATE") {
      setDuplicateError(true);
      return;
    }
    reload();
    setIsCreating(false);
    setNewName("");
    setDuplicateError(false);
    if (result.status === "OK") {
      setWorking((current) => (current.includes(result.value.id) ? current : [...current, result.value.id]));
    }
  }

  function openEdit(zone: BodyZone) {
    setEditTarget(zone);
    setEditName(zone.name);
    setDuplicateError(false);
    setLongPressTarget(null);
  }

  async function handleSaveEdit() {
    if (!editTarget) {
      return;
    }
    const validated = validateBodyZoneName(editName);
    if (!validated.ok) {
      return;
    }
    const renamed = await referentialService.renameBodyZone(editTarget.id, validated.value);
    if (renamed.status === "DUPLICATE") {
      setDuplicateError(true);
      return;
    }
    reload();
    setEditTarget(null);
    setDuplicateError(false);
  }

  async function openDeleteConfirm(zone: BodyZone) {
    const used = await referentialService.isBodyZoneUsed(zone.id);
    setDeleteTargetUsed(used);
  }

  async function handleDelete() {
    if (!longPressTarget) {
      return;
    }
    await referentialService.retireBodyZone(longPressTarget.id);
    reload();
    setWorking((current) => current.filter((id) => id !== longPressTarget.id));
    setLongPressTarget(null);
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} testID="body-zone-picker-backdrop">
        <View style={styles.card} testID="body-zone-picker-card">
          <Text style={styles.title}>{t.title}</Text>

          {atLeastOneNotice ? (
            <Text style={styles.notice} testID="body-zone-picker-at-least-one-notice">
              {t.atLeastOneRequired}
            </Text>
          ) : null}

          <BodyZoneSelector
            zones={activeZones}
            selectedIds={working}
            onToggle={handleToggle}
            accessibilityLabel={t.title}
            silhouette={silhouette ?? null}
            onLongPressZone={(zone) => {
              setLongPressTarget(zone);
              void openDeleteConfirm(zone);
            }}
          />

          {isCreating ? (
            <View style={styles.newEntryContainer} testID="body-zone-picker-new-row">
              <TextInput
                value={newName}
                onChangeText={(text) => {
                  setNewName(text);
                  setDuplicateError(false);
                }}
                placeholder={t.newEntry.placeholder}
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel={t.newEntry.placeholder}
                maxLength={BODY_ZONE_NAME_MAX_LENGTH}
                autoFocus
                style={styles.newEntryInput}
                testID="body-zone-picker-new-name-input"
              />
              {duplicateError ? (
                <Text style={styles.errorText} testID="body-zone-picker-new-error">
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
                  testID="body-zone-picker-new-cancel"
                >
                  <Text style={styles.neutralActionLabel}>{t.newEntry.cancelAccessibilityLabel}</Text>
                </Pressable>
                <Pressable
                  disabled={!canAddZone}
                  onPress={handleCreate}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !canAddZone }}
                  accessibilityLabel={t.newEntry.addAccessibilityLabel}
                  style={[styles.primaryAction, !canAddZone ? styles.primaryActionDisabled : null]}
                  testID="body-zone-picker-new-add"
                >
                  <Text style={styles.primaryActionLabel}>{t.newEntry.addAccessibilityLabel}</Text>
                </Pressable>
              </View>
            </View>
          ) : editTarget ? (
            <View style={styles.newEntryContainer} testID="body-zone-picker-edit-row">
              <TextInput
                value={editName}
                onChangeText={(text) => {
                  setEditName(text);
                  setDuplicateError(false);
                }}
                accessibilityLabel={strings.referenceData.renameDialog.nameLabel}
                maxLength={BODY_ZONE_NAME_MAX_LENGTH}
                autoFocus
                style={styles.newEntryInput}
                testID="body-zone-picker-edit-name-input"
              />
              {duplicateError ? (
                <Text style={styles.errorText} testID="body-zone-picker-edit-error">
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
                  testID="body-zone-picker-edit-cancel"
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
                  testID="body-zone-picker-edit-save"
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
              testID="body-zone-picker-create-action"
            >
              <KodjoIcon name="action-add" testID="body-zone-picker-create-icon" />
              <Text style={styles.createActionLabel}>{t.createAction}</Text>
            </Pressable>
          )}

          <View style={styles.bottomActionsRow}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.closeAccessibilityLabel}
              style={styles.neutralAction}
              testID="body-zone-picker-close"
            >
              <Text style={styles.neutralActionLabel}>{t.closeAccessibilityLabel}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={t.confirmAction}
              style={styles.primaryAction}
              testID="body-zone-picker-confirm"
            >
              <Text style={styles.primaryActionLabel}>{t.confirmAction}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {longPressTarget ? (
        <ReferenceValueDialog
          name={longPressTarget.name}
          isUsed={deleteTargetUsed}
          onCancel={() => setLongPressTarget(null)}
          onModify={() => openEdit(longPressTarget)}
          onDelete={handleDelete}
          testIDPrefix="body-zone-picker-long-press"
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
  notice: {
    ...type.body,
    color: colors.danger,
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
  bottomActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[12],
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
});
