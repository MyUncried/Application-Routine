import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { isBodyZoneAssignable, BODY_ZONE_NAME_MAX_LENGTH, validateBodyZoneName } from "@/domain/body-zones/BodyZone";
import type { Silhouette } from "@/domain/preferences/Profile";
import { recordKeyboardJournal, startKeyboardJournal } from "@/features/diagnostics/keyboardJournal";
import { ReferenceValueDialog } from "@/features/reference-data/ReferenceValueDialog";
import {
  notifyBodyZonesReferentialChanged,
  useReferentialService,
} from "@/features/reference-data/ReferentialServiceContext";
import { BodyZoneSelector } from "@/features/sessions/BodyZoneSelector";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type BodyZonePickerModalProps = {
  selectedIds: readonly string[];
  /** « Confirmer » applique la sélection — jamais appelé en fermant sans confirmer (ABA5D2662CA69). */
  onConfirm: (ids: readonly string[]) => void;
  onClose: () => void;
  /**
   * Silhouette du Profil (CE-UI-09 L2805, T13). PRE-3 (Figma « Zones
   * corporelles ») : elle reste portée par le contrôle d'accès de l'éditeur,
   * jamais répétée dans chaque option — prop conservée pour les appelants.
   */
  silhouette?: Silhouette | null;
  /**
   * PRE-4 story 4.6 (FR-22-10, AC9) : présentation de la feuille, vraie par défaut (rendu
   * PRE-3). L'appelant qui rend le focus à son déclencheur APRÈS la fermeture garde la feuille
   * montée, passe `visible={false}` et attend `onDismissed` (`useReferenceSheet`).
   */
  visible?: boolean;
  /** `onDismiss` du `Modal` : fin de la fermeture animée (iOS). */
  onDismissed?: () => void;
  /**
   * Q53 (7) : une Zone supprimée depuis cette feuille quitte immédiatement la sélection de
   * l'Exercice courant, sans attendre ✓ — l'appelant la retire de son Brouillon. `undefined` :
   * seule la sélection de la feuille change (comportement PRE-3).
   */
  onZoneRetired?: (zoneId: string) => void;
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
  visible = true,
  onDismissed,
  onZoneRetired,
}: BodyZonePickerModalProps) {
  const referentialService = useReferentialService();
  const [zones, setZones] = useState<readonly BodyZone[] | null>(null);
  const [working, setWorking] = useState<readonly string[]>(selectedIds);
  const [isCreating, setIsCreating] = useState(false);
  // Recette 3 (N-01/N-02) : une seule création en vol ; des appuis répétés sur ↑
  // pendant l’écriture ne créent jamais de doublon.
  const isCreateInFlightRef = useRef(false);
  const [newName, setNewName] = useState("");
  const [longPressTarget, setLongPressTarget] = useState<BodyZone | null>(null);
  const [editTarget, setEditTarget] = useState<BodyZone | null>(null);
  // Recette 1 (F-03) : le formulaire de création/modification est en bas de la
  // liste ; il est ramené en vue à son ouverture et à l'apparition du clavier.
  const scrollRef = useRef<ScrollView>(null);
  const isEntryFormOpen = isCreating || editTarget !== null;
  // Recette 2 (N-01/N-02) : clavier ouvert → espace réduit entre le formulaire et le clavier.
  const [isKeyboardShown, setIsKeyboardShown] = useState(false);
  useEffect(() => {
    // Recette 3 (N-01) : journal observateur clavier / focus, lu par routine://diagnostic-updates.
    startKeyboardJournal();
    recordKeyboardJournal("Zones : feuille ouverte");
    const shown = Keyboard.addListener("keyboardWillShow", () => setIsKeyboardShown(true));
    const hidden = Keyboard.addListener("keyboardWillHide", () => setIsKeyboardShown(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  function revealEntryForm() {
    if (isEntryFormOpen) scrollRef.current?.scrollToEnd({ animated: true });
  }
  useEffect(() => {
    if (!isEntryFormOpen) return;
    const subscription = Keyboard.addListener("keyboardDidShow", () => scrollRef.current?.scrollToEnd({ animated: true }));
    return () => subscription.remove();
  }, [isEntryFormOpen]);
  const [editName, setEditName] = useState("");
  const [duplicateError, setDuplicateError] = useState(false);
  const [writeError, setWriteError] = useState(false);
  const [deleteTargetUsed, setDeleteTargetUsed] = useState(false);
  const [atLeastOneNotice, setAtLeastOneNotice] = useState(false);
  // R10 (CE-UI-09 L2840) : le focus d'accessibilité revient explicitement
  // à cette liste après Annuler/Supprimer confirmé (jamais après Modifier).
  const listRef = useRef<View>(null);
  // Story 4.6 : entrée visée par le menu ouvert (résultats asynchrones périmés ignorés) et
  // champ du formulaire (focus après `Modifier`).
  const menuTargetIdRef = useRef<string | null>(null);
  const entryInputRef = useRef<TextInput>(null);
  const t = strings.referenceData.bodyZone;

  // Q53 : Zones DÉJÀ retirées à l'ouverture de la feuille et affectées à cet Exercice —
  // relevées à la première lecture du référentiel, jamais recalculées. Une Zone supprimée
  // depuis cette feuille n'en fait jamais partie (Q53 (7)).
  const [retiredAtOpeningIds, setRetiredAtOpeningIds] = useState<readonly string[] | null>(null);

  function reload() {
    referentialService.listBodyZones().then((list) => {
      setZones(list);
      setRetiredAtOpeningIds(
        (current) =>
          current ?? list.filter((zone) => !isBodyZoneAssignable(zone) && selectedIds.includes(zone.id)).map((zone) => zone.id),
      );
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialService]);

  // R6 : relit cette modale ET notifie la Composition (`CompositionScreen`)
  // qu'une Zone a été créée, renommée ou supprimée — jamais appelé au
  // montage initial (`reload()` seul), uniquement après une écriture
  // réussie (D2/D4).
  function reloadAndNotify() {
    reload();
    notifyBodyZonesReferentialChanged();
  }

  // PRE-4, décision Q53 de Hermann (2026-10-18, remplace Q49 b pour les Zones) : une Zone
  // retirée AVANT l'ouverture (depuis un autre Exercice) et affectée à CET Exercice reste
  // listée, cochée et interactive (fond rouge clair, `BodyZoneSelector`) pour être conservée,
  // remplacée ou décochée ; décochée, elle reste listée jusqu'à la fermeture. Une Zone retirée
  // non affectée à cet Exercice n'est jamais proposée (D-210), ni une Zone supprimée depuis
  // cette feuille (Q53 (7)).
  const visibleZones = (zones ?? []).filter(
    (zone) => isBodyZoneAssignable(zone) || (retiredAtOpeningIds ?? []).includes(zone.id),
  );
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
    if (isCreateInFlightRef.current) {
      return;
    }
    const validated = validateBodyZoneName(newName);
    if (!validated.ok) {
      return;
    }
    setWriteError(false);
    isCreateInFlightRef.current = true;
    try {
      const result = await referentialService.createBodyZone({ name: validated.value });
      if (result.status === "DUPLICATE") {
        setDuplicateError(true);
        return;
      }
      reloadAndNotify();
      // Recette 3 (N-01/N-02) : le formulaire reste ouvert après ↑ — son champ garde
      // le focus, donc le clavier reste affiché ; le nom est vidé comme avant.
      setNewName("");
      setDuplicateError(false);
      if (result.status === "OK") {
        setWorking((current) =>
          current.includes(result.value.id) ? current : [...current, result.value.id],
        );
      }
    } catch (error) {
      console.error("La Zone n'a pas pu être créée.", error);
      setWriteError(true);
    } finally {
      isCreateInFlightRef.current = false;
    }
  }

  function openEdit(zone: BodyZone) {
    recordKeyboardJournal("Zones : Modifier");
    setEditTarget(zone);
    setEditName(zone.name);
    setDuplicateError(false);
    setWriteError(false);
    setLongPressTarget(null);
  }

  async function handleSaveEdit() {
    recordKeyboardJournal("Zones : Enregistrer");
    if (!editTarget) {
      return;
    }
    const validated = validateBodyZoneName(editName);
    if (!validated.ok) {
      return;
    }
    setWriteError(false);
    try {
      const renamed = await referentialService.renameBodyZone(editTarget.id, validated.value);
      if (renamed.status === "DUPLICATE") {
        setDuplicateError(true);
        return;
      }
      reloadAndNotify();
      setEditTarget(null);
      setDuplicateError(false);
    } catch (error) {
      console.error("La Zone n'a pas pu être modifiée.", error);
      setWriteError(true);
    }
  }

  async function openDeleteConfirm(zone: BodyZone) {
    const used = await referentialService.isBodyZoneUsed(zone.id);
    // Revue 4.6 : un résultat arrivé après le changement de cible (autre entrée) est périmé.
    if (menuTargetIdRef.current !== zone.id) return;
    setDeleteTargetUsed(used);
  }

  /** Menu d'appui long D-354, ouvert par l'appui long ou par son action accessible (story 4.6, AC8). */
  function openEntryMenu(zone: BodyZone) {
    recordKeyboardJournal(`Zones : appui long « ${zone.name} »`);
    menuTargetIdRef.current = zone.id;
    setDeleteTargetUsed(false);
    setLongPressTarget(zone);
    void openDeleteConfirm(zone);
  }

  /**
   * Story 4.6 (FR-22-09, AC8) : action accessible « Modifier ou supprimer », ignorée tant que
   * le formulaire de création ou de modification est ouvert, ou qu'un menu l'est déjà ;
   * l'appui long PRE-3 n'est pas concerné.
   */
  function runEntryMenuAction(zone: BodyZone) {
    if (isEntryFormOpen || longPressTarget !== null) return;
    openEntryMenu(zone);
  }

  // Story 4.6 (FR-22-10, AC9) : après `Modifier`, le focus VoiceOver va au champ de nom.
  useEffect(() => {
    if (editTarget !== null && entryInputRef.current) {
      AccessibilityInfo.sendAccessibilityEvent(entryInputRef.current, "focus");
    }
  }, [editTarget]);

  async function handleDelete() {
    if (!longPressTarget) {
      return;
    }
    try {
      await referentialService.retireBodyZone(longPressTarget.id);
      reloadAndNotify();
      // Q53 (7), précision de Hermann du 2026-10-18 : dans l'Exercice depuis lequel la
      // suppression est faite, la Zone disparaît immédiatement de la liste et de la sélection
      // (comportement PRE-3), et de la sélection de l'Exercice (`onZoneRetired`). Les AUTRES
      // Exercices qui l'avaient la gardent, affichée en rouge dans leur feuille. Sélection
      // vidée : avis « au moins une Zone » (règle existante) ; `Terminer` reste inactif.
      const retiredId = longPressTarget.id;
      const remaining = working.filter((id) => id !== retiredId);
      setWorking(remaining);
      if (remaining.length === 0 && working.length > 0) {
        setAtLeastOneNotice(true);
      }
      onZoneRetired?.(retiredId);
      setLongPressTarget(null);
    } catch (error) {
      console.error("La Zone n'a pas pu être supprimée.", error);
      setLongPressTarget(null);
      setWriteError(true);
    }
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} onDismiss={onDismissed}>
      {/* Recette 1 (F-03) : le clavier ne recouvre jamais la feuille ; le champ actif
          et ses actions restent visibles (spéc. 06 : « le champ actif et l'action finale
          restent accessibles »). */}
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        testID="body-zone-picker-backdrop"
      >
        <View style={[styles.card, isKeyboardShown ? styles.cardWithKeyboard : null]} accessibilityViewIsModal testID="body-zone-picker-sheet">
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader} testID="body-zone-picker-header">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.closeAccessibilityLabel}
              hitSlop={5}
              style={styles.sheetCancel}
              testID="body-zone-picker-close"
            >
              <KodjoIcon name="wheel-action-cancel" />
            </Pressable>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              {t.title}
            </Text>
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={t.confirmAction}
              hitSlop={5}
              style={styles.sheetValidate}
              testID="body-zone-picker-confirm"
            >
              <KodjoIcon name="wheel-action-validate" />
            </Pressable>
          </View>
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={revealEntryForm}
          contentContainerStyle={[styles.cardContent, isKeyboardShown ? styles.cardContentWithKeyboard : null]}
          keyboardShouldPersistTaps="handled"
          testID="body-zone-picker-card"
        >

          {writeError ? (
            <Text style={styles.errorText} testID="body-zone-picker-write-error">
              {strings.referenceData.writeError}
            </Text>
          ) : null}

          {atLeastOneNotice ? (
            <Text style={styles.notice} testID="body-zone-picker-at-least-one-notice">
              {t.atLeastOneRequired}
            </Text>
          ) : null}

          {/* Story 4.6 (FR-22-10, AC9) : menu ouvert, la liste est retirée de l'accessibilité sur
              Android (sur iOS, `accessibilityViewIsModal` du calque suffit). */}
          <View ref={listRef} importantForAccessibility={longPressTarget ? "no-hide-descendants" : "auto"}>
            <BodyZoneSelector
              zones={visibleZones}
              selectedIds={working}
              onToggle={handleToggle}
              accessibilityLabel={t.title}
              onLongPressZone={openEntryMenu}
              onEntryMenuAction={runEntryMenuAction}
            />
          </View>

          {/* Recette 3 (N-01) : UN SEUL champ pour la création et la modification. Passer de l’une
              à l’autre (Modifier, Annuler, Enregistrer) ne démonte jamais le champ focalisé : le clavier
              déjà affiché reste affiché, sans descendre ni remonter. La modification passe avant la
              création, dont le texte est conservé et revient ensuite. « Saisie inline » 4683:6336 : ↑ dans
              le champ en création ; en modification, Annuler / Enregistrer sous le champ. */}
          {isEntryFormOpen ? (
            <View style={styles.newEntryContainer} testID={editTarget ? "body-zone-picker-edit-row" : "body-zone-picker-new-row"}>
              <View style={styles.inlineField}>
                <TextInput
                  ref={entryInputRef}
                  value={editTarget ? editName : newName}
                  onChangeText={(text) => {
                    if (editTarget) {
                      setEditName(text);
                    } else {
                      setNewName(text);
                    }
                    setDuplicateError(false);
                  }}
                  placeholder={editTarget ? undefined : t.newEntry.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  accessibilityLabel={editTarget ? strings.referenceData.renameDialog.nameLabel : t.newEntry.placeholder}
                  maxLength={BODY_ZONE_NAME_MAX_LENGTH}
                  autoFocus
                  onFocus={() => recordKeyboardJournal("Zones : champ focus")}
                  onBlur={() => recordKeyboardJournal("Zones : champ blur")}
                  style={[styles.newEntryInput, editTarget ? null : styles.inlineFieldInput]}
                  testID={editTarget ? "body-zone-picker-edit-name-input" : "body-zone-picker-new-name-input"}
                />
                {editTarget ? null : (
                  <Pressable
                    disabled={!canAddZone}
                    onPress={handleCreate}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canAddZone }}
                    accessibilityLabel={t.newEntry.addAccessibilityLabel}
                    hitSlop={(minTouchTarget - INLINE_SEND_SIZE) / 2}
                    style={[styles.inlineSend, !canAddZone ? styles.inlineSendDisabled : null]}
                    testID="body-zone-picker-new-add"
                  >
                    <Text style={styles.inlineSendSymbol}>↑</Text>
                  </Pressable>
                )}
              </View>
              {duplicateError ? (
                <Text style={styles.errorText} testID={editTarget ? "body-zone-picker-edit-error" : "body-zone-picker-new-error"}>
                  {strings.referenceData.renameDialog.duplicateError}
                </Text>
              ) : null}
              {editTarget ? (
                <View style={styles.newEntryActionsRow}>
                  <Pressable
                    onPress={() => {
                      recordKeyboardJournal("Zones : Annuler la modification");
                      setEditTarget(null);
                      setDuplicateError(false);
                      setWriteError(false);
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
              ) : null}
            </View>
          ) : (
            <Pressable
              onPress={() => setIsCreating(true)}
              accessibilityRole="button"
              accessibilityLabel={t.createAction}
              hitSlop={CREATE_ACTION_HIT_SLOP}
              style={styles.createAction}
              testID="body-zone-picker-create-action"
            >
              <KodjoIcon name="action-add" size={16} testID="body-zone-picker-create-icon" />
              <Text style={styles.createActionLabel}>{strings.executionParameters.referenceSheets.zoneCreateAction}</Text>
            </Pressable>
          )}

        </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {longPressTarget ? (
        <ReferenceValueDialog
          // Revue 4.6 : une autre entrée remonte le dialogue (jamais l'étape `delete` d'une autre).
          key={longPressTarget.id}
          focusOnOpen
          name={longPressTarget.name}
          isUsed={deleteTargetUsed}
          // PRE-4 story 4.3 (FR-20-09, bilan §4.3) : message propre à une Zone utilisée ;
          // le reste de la suppression garde le comportement PRE-3 validé.
          usedMessage={strings.referenceData.deleteConfirm.bodyZoneUsedMessage}
          onCancel={() => setLongPressTarget(null)}
          onModify={() => openEdit(longPressTarget)}
          onDelete={handleDelete}
          testIDPrefix="body-zone-picker-long-press"
          returnFocusRef={listRef}
        />
      ) : null}
    </Modal>
  );
}

/** Action « Envoyer » figée (4683:6336) : cercle 32, marge interne droite 8. */
const INLINE_SEND_SIZE = 32;

/**
 * PRE-4 story 4.6 (FR-22-04, AC4) : cible de `Créer une zone corporelle` portée à 44 de haut
 * sans agrandir la pilule de 32 (rendu PRE-3 inchangé) — 12 sous la pilule, dans la marge
 * basse de 24 du contenu ; rien au-dessus : la cible des Zones (`hitSlop` 8) déborde déjà
 * dans l'écart de 16, et 8 restent entre les deux cibles.
 */
const CREATE_ACTION_HIT_SLOP = { top: 0, bottom: 12, left: 0, right: 0 } as const;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: "flex-end",
  },
  // PRE-3 (Figma « Modale — … de l'exercice ») : feuille ancrée en bas,
  // poignée, en-tête ✕ / titre / ✓ séparé par un trait, voile commun.
  sheetHandle: {
    alignSelf: "center",
    width: 50,
    height: 4,
    borderRadius: 2,
    marginTop: spacing[8],
    backgroundColor: colors.disabled,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Recette 1 (T-61) : hauteur minimale, jamais fixe — le titre agrandi n’est pas rogné.
    minHeight: 56,
    marginHorizontal: spacing[12],
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetTitle: {
    ...type.modalTitle,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
  sheetCancel: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
  },
  sheetValidate: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  card: {
    width: "100%",
    // R4 (CE-UI-09 L2796, L2808) : hauteur bornée — la liste des Zones et
    // la carte de création/renommage défilent toujours, quel que soit le
    // nombre d'entrées ou l'ouverture du clavier.
    maxHeight: "90%",
    borderTopLeftRadius: dimensions.standardCard.radius,
    borderTopRightRadius: dimensions.standardCard.radius,
    backgroundColor: colors.background,
    paddingBottom: spacing[24],
  },
  cardContentWithKeyboard: {
    paddingBottom: spacing[8],
  },
  cardWithKeyboard: {
    paddingBottom: 0,
  },
  cardContent: {
    padding: spacing[24],
    gap: spacing[16],
  },
  notice: {
    ...type.body,
    color: colors.danger,
  },
  // PRE-3 (Figma « Créer une … ») : pilule 32, contour primarySoft, Regular 12 primary, icône 16.
  createAction: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
    height: 32,
    paddingHorizontal: spacing[8],
    borderRadius: fixedRadii[16],
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.background,
  },
  createActionLabel: {
    ...type.supporting,
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
  inlineField: {
    justifyContent: "center",
  },
  inlineFieldInput: {
    paddingRight: INLINE_SEND_SIZE + spacing[8] * 2,
  },
  inlineSend: {
    position: "absolute",
    right: spacing[8],
    width: INLINE_SEND_SIZE,
    height: INLINE_SEND_SIZE,
    borderRadius: INLINE_SEND_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  inlineSendDisabled: {
    backgroundColor: colors.disabled,
  },
  inlineSendSymbol: {
    ...type.button,
    color: colors.background,
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
});
