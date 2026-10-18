import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
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

import { isLabelAssignable, LABEL_NAME_MAX_LENGTH, validateLabelName, type Label, type LabelColor } from "@/domain/labels/Label";
import { SESSION_COLORS } from "@/domain/sessions/Session";
import { useReduceMotion } from "@/features/activities/ExecutionParametersSheet";
import { CategoryColorBand } from "@/features/reference-data/CategoryPickerModal";
import { recordKeyboardJournal, startKeyboardJournal } from "@/features/diagnostics/keyboardJournal";
import { ReferenceValueDialog } from "@/features/reference-data/ReferenceValueDialog";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type LabelPickerModalProps = {
  /** Étiquette actuellement affectée au brouillon — `null` si aucune. */
  selectedId: string | null;
  /**
   * Recette 3 (N-03, ARB-R3-1 option B, D-355) : appelé UNIQUEMENT par ✓, avec
   * l'Étiquette marquée dans la feuille — `null` confirme l'absence d'Étiquette.
   * L'enregistrement réel n'a lieu qu'à `Continuer` : cette feuille n'écrit
   * jamais que dans le brouillon en mémoire.
   */
  onSelect: (id: string | null) => void;
  onClose: () => void;
  /**
   * Q53 (8) : une Étiquette supprimée depuis cette feuille quitte immédiatement la sélection
   * de la Séance courante — l'appelant la retire de son Brouillon.
   */
  onLabelRetired?: (labelId: string) => void;
};

/**
 * Feuille Étiquette de Séance (CE-T03-16), alignée sur la feuille Catégorie
 * (recette 3, N-03, EXT-R3-3) : ancrée en bas, pleine largeur, hauteur ajustée
 * au contenu (défilement au-delà), en-tête ✕ / titre / ✓ avec séparateur,
 * création inline avec ↑ dans le champ et barre de 12 couleurs (D-026), sans
 * boutons inférieurs. Comportement (D-355) : toucher marque (toucher l'Étiquette
 * marquée la démarque) ; ↑ crée et marque sans fermer ; ✓ applique et ferme
 * progressivement ; ✕ abandonne et conserve l'Étiquette antérieure ; une
 * Étiquette créée reste au référentiel. Administration par appui long
 * (modification, suppression logique, D4/D-259), réactivation D2.
 */
export function LabelPickerModal({ selectedId, onSelect, onClose, onLabelRetired }: LabelPickerModalProps) {
  const referentialService = useReferentialService();
  const [labels, setLabels] = useState<readonly Label[] | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(selectedId);
  const reduceMotion = useReduceMotion();
  const [closing] = useState(() => new Animated.Value(1));
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // Une seule création en vol : des appuis répétés sur ↑ ne créent pas de doublon (D-350).
  const isCreateInFlightRef = useRef(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>(SESSION_COLORS[0]!);
  const [longPressTarget, setLongPressTarget] = useState<Label | null>(null);
  const [editTarget, setEditTarget] = useState<Label | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<LabelColor>(SESSION_COLORS[0]!);
  const [duplicateError, setDuplicateError] = useState(false);
  const [writeError, setWriteError] = useState(false);
  const [deleteTargetUsed, setDeleteTargetUsed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const isEntryFormOpen = isCreating || editTarget !== null;
  const [isKeyboardShown, setIsKeyboardShown] = useState(false);
  // R10 (CE-T03-16 L1677) : le focus d'accessibilité revient à cette liste après
  // ✕ / Supprimer confirmé dans le dialogue d'appui long (jamais après Modifier).
  const tagRowRef = useRef<View>(null);
  const t = strings.referenceData.label;
  const sheet = strings.executionParameters.referenceSheets;

  useEffect(() => {
    // Recette 3 (N-01) : journal observateur clavier / focus, lu par routine://diagnostic-updates.
    startKeyboardJournal();
    recordKeyboardJournal("Étiquette : feuille ouverte");
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

  // Q53 (8) : Étiquette DÉJÀ retirée à l'ouverture (depuis une autre Séance) et affectée à
  // cette Séance — relevée à la première lecture ; une Étiquette supprimée depuis cette feuille
  // n'en fait jamais partie.
  const [retiredAtOpeningId, setRetiredAtOpeningId] = useState<string | null | undefined>(undefined);

  function reload() {
    referentialService.listLabels().then((list) => {
      setLabels(list);
      setRetiredAtOpeningId((current) =>
        current !== undefined ? current : (list.find((label) => !isLabelAssignable(label) && label.id === selectedId)?.id ?? null),
      );
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialService]);

  // Q53 (8) : Étiquettes actives, plus l'Étiquette retirée avant l'ouverture et affectée à cette
  // Séance (fond rouge clair, sans menu) ; jamais une Étiquette retirée non affectée (D-210).
  const activeLabels = (labels ?? []).filter((label) => isLabelAssignable(label) || label.id === retiredAtOpeningId);
  const canAddLabel = validateLabelName(newName).ok;
  const canSaveEdit = validateLabelName(editName).ok;

  /** D-355 : toucher marque ; toucher l'Étiquette marquée la démarque (aucune Étiquette). */
  function handlePress(label: Label) {
    setChosenId((current) => (current === label.id ? null : label.id));
  }

  /** D-355 : ✓ applique le choix (ou le retrait) puis ferme progressivement (immédiatement si « Réduire les animations »). */
  function handleConfirm() {
    if (isConfirming) {
      return;
    }
    const confirmedId = chosenId;
    const finish = () => {
      onSelect(confirmedId);
      onClose();
    };
    if (reduceMotion) {
      finish();
      return;
    }
    setIsConfirming(true);
    Animated.timing(closing, {
      toValue: 0,
      duration: CONFIRM_CLOSE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => finish());
  }

  async function handleCreate() {
    if (isCreateInFlightRef.current) {
      return;
    }
    const validated = validateLabelName(newName);
    if (!validated.ok) {
      return;
    }
    setWriteError(false);
    isCreateInFlightRef.current = true;
    try {
      const result = await referentialService.createLabel({ name: validated.value, color: newColor });
      if (result.status === "DUPLICATE") {
        setDuplicateError(true);
        return;
      }
      reload();
      // Formulaire maintenu (champ focalisé, clavier affiché) ; nom vidé comme pour la Catégorie (D-350).
      setNewName("");
      setDuplicateError(false);
      if (result.status === "OK") {
        // Créée dans le référentiel et MARQUÉE ; seule ✓ l'affecte. ✕ ne la supprime pas.
        setChosenId(result.value.id);
      }
    } catch (error) {
      console.error("L'Étiquette n'a pas pu être créée.", error);
      setWriteError(true);
    } finally {
      isCreateInFlightRef.current = false;
    }
  }

  function openEdit(label: Label) {
    recordKeyboardJournal("Étiquette : Modifier");
    setEditTarget(label);
    setEditName(label.name);
    setEditColor(label.color);
    setDuplicateError(false);
    setWriteError(false);
    setLongPressTarget(null);
  }

  async function handleSaveEdit() {
    recordKeyboardJournal("Étiquette : Enregistrer");
    if (!editTarget) {
      return;
    }
    const validated = validateLabelName(editName);
    if (!validated.ok) {
      return;
    }
    setWriteError(false);
    try {
      const renamed = await referentialService.renameLabel(editTarget.id, validated.value);
      if (renamed.status === "DUPLICATE") {
        setDuplicateError(true);
        return;
      }
      await referentialService.recolorLabel(editTarget.id, editColor);
      reload();
      setEditTarget(null);
      setDuplicateError(false);
    } catch (error) {
      console.error("L'Étiquette n'a pas pu être modifiée.", error);
      setWriteError(true);
    }
  }

  async function openDeleteConfirm(label: Label) {
    const used = await referentialService.isLabelUsed(label.id);
    setDeleteTargetUsed(used);
  }

  async function handleDelete() {
    if (!longPressTarget) {
      return;
    }
    const wasSelected = selectedId === longPressTarget.id;
    const wasChosen = chosenId === longPressTarget.id;
    const retiredId = longPressTarget.id;
    try {
      await referentialService.retireLabel(retiredId);
      reload();
      setLongPressTarget(null);
      // Q53 (8), même règle que les Zones : dans la Séance depuis laquelle la suppression est
      // faite, l'Étiquette disparaît de la liste et de la sélection (feuille et Brouillon) ;
      // les AUTRES Séances qui l'avaient la gardent, en rouge dans leur feuille.
      if (wasSelected) {
        setChosenId((current) => (current === retiredId ? null : current));
        onLabelRetired?.(retiredId);
      } else if (wasChosen) {
        // Un choix non confirmé qui disparaît revient à l'affectation actuelle de la Séance.
        setChosenId(selectedId);
      }
    } catch (error) {
      console.error("L'Étiquette n'a pas pu être supprimée.", error);
      setLongPressTarget(null);
      setWriteError(true);
    }
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        testID="label-picker-backdrop"
      >
        <Animated.View
          style={[
            styles.card,
            isKeyboardShown ? styles.cardWithKeyboard : null,
            {
              opacity: closing,
              transform: [{ translateY: closing.interpolate({ inputRange: [0, 1], outputRange: [CONFIRM_CLOSE_OFFSET, 0] }) }],
            },
          ]}
          accessibilityViewIsModal
          testID="label-picker-sheet"
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader} testID="label-picker-header">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.closeAccessibilityLabel}
              hitSlop={5}
              style={styles.sheetCancel}
              testID="label-picker-close"
            >
              <KodjoIcon name="wheel-action-cancel" />
            </Pressable>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              {t.title}
            </Text>
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={sheet.labelConfirmAction}
              hitSlop={5}
              style={styles.sheetValidate}
              testID="label-picker-confirm"
            >
              <KodjoIcon name="wheel-action-validate" />
            </Pressable>
          </View>
          <ScrollView
            ref={scrollRef}
            onContentSizeChange={revealEntryForm}
            contentContainerStyle={[styles.cardContent, isKeyboardShown ? styles.cardContentWithKeyboard : null]}
            keyboardShouldPersistTaps="handled"
            testID="label-picker-card"
          >
            {writeError ? (
              <Text style={styles.errorText} testID="label-picker-write-error">
                {strings.referenceData.writeError}
              </Text>
            ) : null}

            <View ref={tagRowRef} style={styles.tagRow} testID="label-picker-tag-row">
              {activeLabels.map((label) => {
                const isSelected = label.id === chosenId;
                // Q53 (8) : Étiquette retirée encore affectée — fond rouge clair, sans mention
                // visible, état porté par le nom accessible, sans appui long.
                const isRetired = !isLabelAssignable(label);
                const name = isRetired
                  ? strings.referenceData.retiredEntryAccessibilityLabel.replace("{name}", () => label.name)
                  : label.name;
                return (
                  <Pressable
                    key={label.id}
                    onPress={() => handlePress(label)}
                    onLongPress={
                      isRetired
                        ? undefined
                        : () => {
                            recordKeyboardJournal(`Étiquette : appui long « ${label.name} »`);
                            setLongPressTarget(label);
                            void openDeleteConfirm(label);
                          }
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${name}${isSelected ? ` — ${strings.screens.categories.tagAccessibility.selectedSuffix}` : ""}`}
                    accessibilityHint={isSelected ? t.retireActionHint : t.chooseActionHint}
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.tag, isSelected ? styles.tagSelected : null, isRetired ? styles.tagRetired : null]}
                    testID={`label-picker-tag-${label.id}`}
                  >
                    <View style={[styles.swatch, { backgroundColor: label.color }]} testID={`label-picker-tag-${label.id}-swatch`} />
                    <Text style={styles.tagLabel}>{label.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Recette 3 (N-01) : UN SEUL champ pour la création et la modification. Passer de l’une
                à l’autre (Modifier, Annuler, Enregistrer) ne démonte jamais le champ focalisé : le clavier
                déjà affiché reste affiché, sans descendre ni remonter. La modification passe avant la
                création, dont le texte est conservé et revient ensuite. « Saisie inline » 4640:6308 : ↑ dans
                le champ en création ; en modification, Annuler / Enregistrer sous le champ. */}
            {isEntryFormOpen ? (
              <View style={styles.newEntryContainer} testID={editTarget ? "label-picker-edit-row" : "label-picker-new-row"}>
                <View style={styles.inlineField}>
                  <TextInput
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
                    maxLength={LABEL_NAME_MAX_LENGTH}
                    autoFocus
                    onFocus={() => recordKeyboardJournal("Étiquette : champ focus")}
                    onBlur={() => recordKeyboardJournal("Étiquette : champ blur")}
                    style={[styles.newEntryInput, editTarget ? null : styles.inlineFieldInput]}
                    testID={editTarget ? "label-picker-edit-name-input" : "label-picker-new-name-input"}
                  />
                  {editTarget ? null : (
                    <Pressable
                      disabled={!canAddLabel}
                      onPress={handleCreate}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canAddLabel }}
                      accessibilityLabel={t.newEntry.addAccessibilityLabel}
                      hitSlop={(minTouchTarget - INLINE_SEND_SIZE) / 2}
                      style={[styles.inlineSend, !canAddLabel ? styles.inlineSendDisabled : null]}
                      testID="label-picker-new-add"
                    >
                      <Text style={styles.inlineSendSymbol}>↑</Text>
                    </Pressable>
                  )}
                </View>
                <CategoryColorBand
                  value={editTarget ? editColor : newColor}
                  onChange={editTarget ? setEditColor : setNewColor}
                  testID={editTarget ? "label-picker-edit-color-band" : "label-picker-new-color-band"}
                />
                {duplicateError ? (
                  <Text style={styles.errorText} testID={editTarget ? "label-picker-edit-error" : "label-picker-new-error"}>
                    {strings.referenceData.renameDialog.duplicateError}
                  </Text>
                ) : null}
                {editTarget ? (
                  <View style={styles.newEntryActionsRow}>
                    <Pressable
                      onPress={() => {
                        recordKeyboardJournal("Étiquette : Annuler la modification");
                        setEditTarget(null);
                        setDuplicateError(false);
                        setWriteError(false);
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
                ) : null}
              </View>
            ) : (
              <Pressable
                onPress={() => setIsCreating(true)}
                accessibilityRole="button"
                accessibilityLabel={t.createAction}
                style={styles.createAction}
                testID="label-picker-create-action"
              >
                <KodjoIcon name="action-add" size={16} testID="label-picker-create-icon" />
                <Text style={styles.createActionLabel}>{t.createAction}</Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {longPressTarget ? (
        <ReferenceValueDialog
          name={longPressTarget.name}
          isUsed={deleteTargetUsed}
          onCancel={() => setLongPressTarget(null)}
          onModify={() => openEdit(longPressTarget)}
          onDelete={handleDelete}
          testIDPrefix="label-picker-long-press"
          returnFocusRef={tagRowRef}
        />
      ) : null}
    </Modal>
  );
}

/** D-355 : fermeture progressive après ✓ (même convention que la Catégorie, 220 ms). */
const CONFIRM_CLOSE_MS = 220;
const CONFIRM_CLOSE_OFFSET = 48;

/** Action « Envoyer » (4640:6308) : cercle 32, marge interne droite 8. */
const INLINE_SEND_SIZE = 32;

/** Pastille de la pilule (4640:6308 mesuré) : Ø 12 dans une pilule de 30 → marges 9 à gauche, en haut et en bas. */
const TAG_SWATCH_SIZE = 12;
const TAG_BORDER_WIDTH = 1;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: "flex-end",
  },
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
    // Hauteur minimale, jamais fixe : le titre agrandi n’est pas rogné.
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
    // Hauteur ajustée au contenu, bornée : la liste et le formulaire défilent au-delà.
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
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
  },
  // Pilule 30 (contour 1) : pastille 12 à 9 du bord à gauche, en haut et en bas.
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    height: dimensions.categoryTag.visualHeight,
    paddingLeft: (dimensions.categoryTag.visualHeight - TAG_SWATCH_SIZE) / 2 - TAG_BORDER_WIDTH,
    paddingRight: spacing[8],
    borderRadius: fixedRadii[16],
    borderWidth: TAG_BORDER_WIDTH,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  // Q53 (8) : fond d'une Étiquette retirée encore affectée (choisie ou non).
  tagRetired: {
    backgroundColor: colors.dangerSurface,
  },
  tagSelected: {
    borderColor: colors.primarySoft,
    backgroundColor: colors.selectionSurface,
  },
  swatch: {
    width: TAG_SWATCH_SIZE,
    height: TAG_SWATCH_SIZE,
    borderRadius: TAG_SWATCH_SIZE / 2,
  },
  tagLabel: {
    ...type.supporting,
    color: colors.textPrimary,
  },
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
