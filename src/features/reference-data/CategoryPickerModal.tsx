import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
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

import {
  isCategoryAssignable,
  type Category,
  type CategoryColor,
} from "@/domain/categories/Category";
import { CATEGORY_NAME_MAX_LENGTH, validateCategoryName } from "@/domain/categories/validation";
import { SESSION_COLORS } from "@/domain/sessions/Session";
import { recordKeyboardJournal, startKeyboardJournal } from "@/features/diagnostics/keyboardJournal";
import { ReferenceValueDialog } from "@/features/reference-data/ReferenceValueDialog";
import { useReduceMotion } from "@/features/activities/ExecutionParametersSheet";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { strings } from "@/shared/i18n";
import { ENTRY_MENU_ACTION } from "@/shared/ui/entryMenuAction";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type CategoryPickerModalProps = {
  /** Catégorie actuellement affectée — `null` si aucune (D-211 : toujours requise avant `Terminer`, mais l'ouverture de la modale ne présuppose rien). */
  selectedId: string | null;
  /**
   * Décision propriétaire D-8 (12/10, remplace AC873C19CD5A9 et D-222 pour la
   * Catégorie) : appelé UNIQUEMENT par ✓, avec la Catégorie marquée dans la feuille.
   */
  onSelect: (id: string) => void;
  onClose: () => void;
  /**
   * PRE-4 story 4.6 (FR-22-10, AC9) : présentation de la feuille, vraie par défaut (rendu
   * PRE-3). L'appelant qui veut rendre le focus à son déclencheur APRÈS la fermeture garde la
   * feuille montée, passe `visible={false}` à la fermeture et attend `onDismissed`
   * (`useReferenceSheet`).
   */
  visible?: boolean;
  /** `onDismiss` du `Modal` : fin de la fermeture animée (iOS). */
  onDismissed?: () => void;
  /**
   * Q53 (8) : la Catégorie de l'Exercice courant a été supprimée depuis cette feuille — elle
   * quitte immédiatement la sélection : l'appelant la retire de son Brouillon (`Terminer` reste
   * inactif tant qu'aucune Catégorie n'est choisie).
   */
  onCategoryRetired?: (categoryId: string) => void;
};

/**
 * Modale de sélection Catégorie (V2-PRE-2, plan §6.5, D-211 ; CE-UI-09
 * L2769-2857, §4.10 L128-145) : choix unique au toucher, création avec
 * palette, modification (nom, couleur) et suppression logique par appui
 * long (D4/D-259), réactivation D2. Les dix Catégories prédéfinies sont
 * administrables exactement comme les Catégories créées (§4.10 L137 :
 * aucune garde sur `isPredefined`).
 */
export function CategoryPickerModal({
  selectedId,
  onSelect,
  onClose,
  visible = true,
  onDismissed,
  onCategoryRetired,
}: CategoryPickerModalProps) {
  const referentialService = useReferentialService();
  const [categories, setCategories] = useState<readonly Category[] | null>(null);
  // D-8 : le toucher (ou ↑ en création) MARQUE le choix, sans fermer ; ✓ confirme
  // l’affectation, ✕ abandonne et conserve la Catégorie précédente de l’Exercice.
  const [chosenId, setChosenId] = useState<string | null>(selectedId);
  const reduceMotion = useReduceMotion();
  const [closing] = useState(() => new Animated.Value(1));
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // Recette 3 (N-01/N-02) : une seule création en vol ; des appuis répétés sur ↑
  // pendant l’écriture ne créent jamais de doublon.
  const isCreateInFlightRef = useRef(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<CategoryColor>(SESSION_COLORS[0]!);
  const [longPressTarget, setLongPressTarget] = useState<Category | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  // Recette 1 (F-03) : le formulaire de création/modification est en bas de la
  // liste ; il est ramené en vue à son ouverture et à l'apparition du clavier.
  const scrollRef = useRef<ScrollView>(null);
  const isEntryFormOpen = isCreating || editTarget !== null;
  // Recette 2 (N-01/N-02) : clavier ouvert → espace réduit entre le formulaire et le clavier.
  const [isKeyboardShown, setIsKeyboardShown] = useState(false);
  useEffect(() => {
    // Recette 3 (N-01) : journal observateur clavier / focus, lu par routine://diagnostic-updates.
    startKeyboardJournal();
    recordKeyboardJournal("Catégorie : feuille ouverte");
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
  const [editColor, setEditColor] = useState<CategoryColor>(SESSION_COLORS[0]!);
  const [duplicateError, setDuplicateError] = useState(false);
  const [writeError, setWriteError] = useState(false);
  const [retiredNotice, setRetiredNotice] = useState(false);
  const [deleteTargetUsed, setDeleteTargetUsed] = useState(false);
  // R10 (CE-UI-09 L2840) : le focus d'accessibilité revient explicitement
  // à cette liste après Annuler/Supprimer confirmé dans le dialogue d'appui
  // long (jamais après Modifier, cf. `ReferenceValueDialog`).
  const tagRowRef = useRef<View>(null);
  // Story 4.6 : entrée visée par le menu ouvert (résultats asynchrones périmés ignorés) et
  // champ du formulaire (focus après `Modifier`).
  const menuTargetIdRef = useRef<string | null>(null);
  const entryInputRef = useRef<TextInput>(null);
  const t = strings.referenceData.category;

  // Q53 (8) : Catégorie DÉJÀ retirée à l'ouverture (depuis un autre Exercice) et affectée à
  // cet Exercice — relevée à la première lecture, jamais recalculée ; une Catégorie supprimée
  // depuis cette feuille n'en fait jamais partie.
  const [retiredAtOpeningId, setRetiredAtOpeningId] = useState<string | null | undefined>(undefined);

  function reload() {
    referentialService.listCategories().then((list) => {
      setCategories(list);
      setRetiredAtOpeningId((current) =>
        current !== undefined
          ? current
          : (list.find((category) => !isCategoryAssignable(category) && category.id === selectedId)?.id ?? null),
      );
    });
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialService]);

  // Q53 (8) : Catégories actives, plus la Catégorie retirée avant l'ouverture et affectée à cet
  // Exercice (choisie, fond rouge clair, sans menu) ; une Catégorie retirée non affectée, ou
  // supprimée depuis cette feuille, n'est jamais proposée (D-210).
  const activeCategories = (categories ?? []).filter(
    (category) => isCategoryAssignable(category) || category.id === retiredAtOpeningId,
  );
  const canAddCategory = validateCategoryName(newName).ok;
  const canSaveEdit = validateCategoryName(editName).ok;

  function handleSelect(category: Category) {
    setChosenId(category.id);
  }

  /** D-8 : ✓ confirme l’affectation puis ferme progressivement (immédiatement si « Réduire les animations »). */
  function handleConfirm() {
    if (chosenId === null || isConfirming) {
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
    const validated = validateCategoryName(newName);
    if (!validated.ok) {
      return;
    }
    setWriteError(false);
    isCreateInFlightRef.current = true;
    try {
      const result = await referentialService.createCategory({ name: validated.value, color: newColor });
      if (result.status === "DUPLICATE") {
        setDuplicateError(true);
        return;
      }
      reload();
      // Recette 3 (N-01/N-02) : le formulaire reste ouvert après ↑ — son champ garde
      // le focus, donc le clavier reste affiché ; le nom est vidé comme avant.
      setNewName("");
      setDuplicateError(false);
      if (result.status === "OK") {
        // D-8 : la nouvelle Catégorie est créée dans le référentiel et MARQUÉE comme
        // choisie ; seule ✓ l’affecte. ✕ ne la supprime pas du référentiel.
        setChosenId(result.value.id);
      }
    } catch (error) {
      console.error("La Catégorie n'a pas pu être créée.", error);
      setWriteError(true);
    } finally {
      isCreateInFlightRef.current = false;
    }
  }

  function openEdit(category: Category) {
    recordKeyboardJournal("Catégorie : Modifier");
    setEditTarget(category);
    setEditName(category.name);
    setEditColor(category.color);
    setDuplicateError(false);
    setWriteError(false);
    setLongPressTarget(null);
  }

  // Story 4.6 (FR-22-10, AC9) : après `Modifier`, le menu disparaît ; le focus VoiceOver va au
  // champ de nom du formulaire d'édition (le clavier, lui, suit l'`autoFocus` PRE-3 ou reste
  // sur le champ déjà affiché).
  useEffect(() => {
    if (editTarget !== null && entryInputRef.current) {
      AccessibilityInfo.sendAccessibilityEvent(entryInputRef.current, "focus");
    }
  }, [editTarget]);

  async function handleSaveEdit() {
    recordKeyboardJournal("Catégorie : Enregistrer");
    if (!editTarget) {
      return;
    }
    const validated = validateCategoryName(editName);
    if (!validated.ok) {
      return;
    }
    setWriteError(false);
    try {
      const renamed = await referentialService.renameCategory(editTarget.id, validated.value);
      if (renamed.status === "DUPLICATE") {
        setDuplicateError(true);
        return;
      }
      await referentialService.recolorCategory(editTarget.id, editColor);
      reload();
      setEditTarget(null);
      setDuplicateError(false);
    } catch (error) {
      console.error("La Catégorie n'a pas pu être modifiée.", error);
      setWriteError(true);
    }
  }

  async function openDeleteConfirm(category: Category) {
    const used = await referentialService.isCategoryUsed(category.id);
    // Revue 4.6 : un résultat arrivé après le changement de cible (autre entrée) est périmé.
    if (menuTargetIdRef.current !== category.id) return;
    setDeleteTargetUsed(used);
  }

  /** Menu d'appui long D-354, ouvert par l'appui long ou par son action accessible (story 4.6, AC8). */
  function openEntryMenu(category: Category) {
    recordKeyboardJournal(`Catégorie : appui long « ${category.name} »`);
    // Revue 4.6 : l'usage de l'entrée précédente ne vaut jamais pour celle-ci, le temps que
    // la lecture asynchrone réponde.
    menuTargetIdRef.current = category.id;
    setDeleteTargetUsed(false);
    setLongPressTarget(category);
    void openDeleteConfirm(category);
  }

  /**
   * Story 4.6 (FR-22-09, AC8) : action accessible « Modifier ou supprimer ». Ignorée tant
   * que le formulaire de création ou de modification est ouvert, ou qu'un menu l'est déjà
   * (la liste est alors masquée à l'accessibilité) ; l'appui long PRE-3 n'est pas concerné.
   */
  function runEntryMenuAction(category: Category) {
    if (isEntryFormOpen || longPressTarget !== null) return;
    openEntryMenu(category);
  }

  async function handleDelete() {
    if (!longPressTarget) {
      return;
    }
    const wasSelected = selectedId === longPressTarget.id;
    const wasChosen = chosenId === longPressTarget.id;
    const target = longPressTarget;
    try {
      await referentialService.retireCategory(target.id);
      reload();
      setLongPressTarget(null);
      if (wasSelected) {
        // Q53 (8), règle de Hermann : dans l'Exercice depuis lequel la suppression est faite, la
        // Catégorie disparaît immédiatement du sélecteur et de la sélection (feuille et Brouillon,
        // `onCategoryRetired`), qu'elle soit utilisée ailleurs ou non ; « Choisissez-en une
        // autre » est alors exact, et `Terminer` reste inactif tant qu'aucune n'est choisie. Les
        // AUTRES Exercices qui l'avaient la gardent, en rouge dans leur feuille.
        setRetiredNotice(true);
        setChosenId((current) => (current === target.id ? null : current));
        onCategoryRetired?.(target.id);
      }
      // Un choix non confirmé qui disparaît revient à l’affectation actuelle de l’Exercice
      // (une affectation existante retirée reste conservable, CE-UI-09 §5).
      if (wasChosen && !wasSelected) {
        setChosenId(selectedId);
      }
    } catch (error) {
      console.error("La Catégorie n'a pas pu être supprimée.", error);
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
        testID="category-picker-backdrop"
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
          testID="category-picker-sheet"
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader} testID="category-picker-header">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t.closeAccessibilityLabel}
              hitSlop={5}
              style={styles.sheetCancel}
              testID="category-picker-close"
            >
              <KodjoIcon name="wheel-action-cancel" />
            </Pressable>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              {strings.executionParameters.referenceSheets.categoryTitle}
            </Text>
            <Pressable
              onPress={handleConfirm}
              disabled={chosenId === null}
              accessibilityRole="button"
              accessibilityLabel={strings.executionParameters.referenceSheets.categoryConfirmAction}
              accessibilityState={{ disabled: chosenId === null }}
              hitSlop={5}
              style={[styles.sheetValidate, chosenId === null ? styles.sheetValidateDisabled : null]}
              testID="category-picker-confirm"
            >
              <KodjoIcon name="wheel-action-validate" />
            </Pressable>
          </View>
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={revealEntryForm}
          contentContainerStyle={[styles.cardContent, isKeyboardShown ? styles.cardContentWithKeyboard : null]}
          keyboardShouldPersistTaps="handled"
          testID="category-picker-card"
        >

          {retiredNotice ? (
            <Text style={styles.retiredNotice} testID="category-picker-retired-notice">
              {strings.referenceData.retiredValueMessage}
            </Text>
          ) : null}

          {writeError ? (
            <Text style={styles.errorText} testID="category-picker-write-error">
              {strings.referenceData.writeError}
            </Text>
          ) : null}

          {/* Story 4.6 (FR-22-10, AC9) : menu ouvert, la liste est retirée de l'accessibilité sur
              Android (sur iOS, `accessibilityViewIsModal` du calque suffit). */}
          <View
            ref={tagRowRef}
            style={styles.tagRow}
            importantForAccessibility={longPressTarget ? "no-hide-descendants" : "auto"}
            testID="category-picker-tag-row"
          >
            {activeCategories.map((category) => {
              const isSelected = category.id === chosenId;
              // Q53 (8) : Catégorie retirée encore affectée — fond rouge clair, sans mention
              // visible, état porté par le nom accessible, ni appui long ni action de menu.
              const isRetired = !isCategoryAssignable(category);
              const name = isRetired
                ? strings.referenceData.retiredEntryAccessibilityLabel.replace("{name}", () => category.name)
                : category.name;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleSelect(category)}
                  onLongPress={isRetired ? undefined : () => openEntryMenu(category)}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}${isSelected ? ` ${strings.screens.categories.tagAccessibility.selectedSuffix}` : ""}`}
                  accessibilityState={{ selected: isSelected }}
                  // PRE-4 story 4.6 (FR-22-09, AC8) : alternative accessible à l'appui long —
                  // le même menu ✕ / Modifier / Supprimer, sans glisser ni maintien. Ajout
                  // seul : le toucher (marquer) et l'appui long PRE-3 sont inchangés.
                  accessibilityActions={
                    isRetired ? undefined : [{ name: ENTRY_MENU_ACTION, label: strings.referenceData.longPressDialog.accessibilityAction }]
                  }
                  onAccessibilityAction={
                    isRetired
                      ? undefined
                      : (event) => {
                          if (event.nativeEvent.actionName === ENTRY_MENU_ACTION) runEntryMenuAction(category);
                        }
                  }
                  style={[styles.tag, isSelected ? styles.tagSelected : null, isRetired ? styles.tagRetired : null]}
                  testID={`category-picker-tag-${category.id}`}
                >
                  <View style={[styles.swatch, { backgroundColor: category.color }]} />
                  <Text style={styles.tagLabel}>{category.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Recette 3 (N-01) : UN SEUL champ pour la création et la modification. Passer de l’une
              à l’autre (Modifier, Annuler, Enregistrer) ne démonte jamais le champ focalisé : le clavier
              déjà affiché reste affiché, sans descendre ni remonter. La modification passe avant la
              création, dont le texte est conservé et revient ensuite. « Saisie inline » 4474:7157 : ↑ dans
              le champ en création ; en modification, Annuler / Enregistrer sous le champ. */}
          {isEntryFormOpen ? (
            <View style={styles.newEntryContainer} testID={editTarget ? "category-picker-edit-row" : "category-picker-new-row"}>
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
                  maxLength={CATEGORY_NAME_MAX_LENGTH}
                  autoFocus
                  onFocus={() => recordKeyboardJournal("Catégorie : champ focus")}
                  onBlur={() => recordKeyboardJournal("Catégorie : champ blur")}
                  style={[styles.newEntryInput, editTarget ? null : styles.inlineFieldInput]}
                  testID={editTarget ? "category-picker-edit-name-input" : "category-picker-new-name-input"}
                />
                {editTarget ? null : (
                  <Pressable
                    disabled={!canAddCategory}
                    onPress={handleCreate}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canAddCategory }}
                    accessibilityLabel={t.newEntry.addAccessibilityLabel}
                    hitSlop={(minTouchTarget - INLINE_SEND_SIZE) / 2}
                    style={[styles.inlineSend, !canAddCategory ? styles.inlineSendDisabled : null]}
                    testID="category-picker-new-add"
                  >
                    <Text style={styles.inlineSendSymbol}>↑</Text>
                  </Pressable>
                )}
              </View>
              <CategoryColorBand
                value={editTarget ? editColor : newColor}
                onChange={editTarget ? setEditColor : setNewColor}
                testID={editTarget ? "category-picker-edit-color-band" : "category-picker-new-color-band"}
              />
              {duplicateError ? (
                <Text style={styles.errorText} testID={editTarget ? "category-picker-edit-error" : "category-picker-new-error"}>
                  {strings.referenceData.renameDialog.duplicateError}
                </Text>
              ) : null}
              {editTarget ? (
                <View style={styles.newEntryActionsRow}>
                  <Pressable
                    onPress={() => {
                      recordKeyboardJournal("Catégorie : Annuler la modification");
                      setEditTarget(null);
                      setDuplicateError(false);
                      setWriteError(false);
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
              ) : null}
            </View>
          ) : (
            <Pressable
              onPress={() => setIsCreating(true)}
              accessibilityRole="button"
              accessibilityLabel={t.createAction}
              hitSlop={CREATE_ACTION_HIT_SLOP}
              style={styles.createAction}
              testID="category-picker-create-action"
            >
              <KodjoIcon name="action-add" size={16} testID="category-picker-create-icon" />
              <Text style={styles.createActionLabel}>{t.createAction}</Text>
            </Pressable>
          )}

        </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {longPressTarget ? (
        <ReferenceValueDialog
          // Revue 4.6 : une autre entrée remonte le dialogue (jamais l'étape `delete` d'une autre).
          key={longPressTarget.id}
          focusOnOpen
          name={longPressTarget.name}
          isUsed={deleteTargetUsed}
          usedMessage={strings.referenceData.deleteConfirm.categoryUsedMessage}
          onCancel={() => setLongPressTarget(null)}
          onModify={() => openEdit(longPressTarget)}
          onDelete={handleDelete}
          testIDPrefix="category-picker-long-press"
          returnFocusRef={tagRowRef}
        />
      ) : null}
    </Modal>
  );
}

/** D-8 : fermeture progressive après ✓ (convention 220 ms des contrôles animés). */
const CONFIRM_CLOSE_MS = 220;
const CONFIRM_CLOSE_OFFSET = 48;

/** Action « Envoyer » figée (4474:7157) : cercle 32, marge interne droite 8. */
const INLINE_SEND_SIZE = 32;

/**
 * PRE-4 story 4.6 (FR-22-04, AC4) : cible de `Créer une catégorie` portée à 44 de haut
 * sans agrandir la pilule de 32 (rendu PRE-3 inchangé) — 12 sous la pilule, dans la
 * marge basse de 24 du contenu ; rien au-dessus, pour garder au moins 8 avec la liste.
 */
const CREATE_ACTION_HIT_SLOP = { top: 0, bottom: 12, left: 0, right: 0 } as const;

/**
 * Recette 1 (T-34/T-59) — « Nuancier — Bandeau couleurs de catégorie » figé
 * (4474:7157, CE-UI-09 §9) : bandeau horizontal 40 de hauteur, segments
 * contigus de 32, segment choisi agrandi (+8, rayon 3, contour blanc 2).
 * Les couleurs restent celles de la palette décidée (D-026, 12 couleurs) : les
 * teintes d’exemple de Figma ne deviennent pas des règles (PRE-3 l.26).
 * Recette 3 (N-03) : exporté, rendu inchangé, pour la création d’Étiquette.
 */
export function CategoryColorBand({
  value,
  onChange,
  testID,
}: {
  value: CategoryColor;
  onChange: (color: CategoryColor) => void;
  testID: string;
}) {
  const t = strings.screens.composition.colorPicker;
  return (
    <View style={styles.colorBand} accessibilityRole="radiogroup" accessibilityLabel={t.paletteAccessibilityLabel} testID={testID}>
      {SESSION_COLORS.map((color) => {
        const selected = color === value;
        return (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t.swatchAccessibilityLabel} ${color}`}
            style={[styles.colorBandSegment, { backgroundColor: color }, selected ? styles.colorBandSegmentSelected : null]}
            testID={`${testID}-${color}`}
          />
        );
      })}
    </View>
  );
}

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
  // D-8 : ✓ de confirmation (même rendu que la feuille Zones).
  sheetValidate: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  sheetValidateDisabled: {
    backgroundColor: colors.disabled,
  },
  card: {
    width: "100%",
    // R4 (§4.10 L133 ; CE-UI-09 L2808) : hauteur bornée — la liste des
    // Catégories et la carte de création/modification défilent toujours,
    // quel que soit le nombre d'entrées ou l'ouverture du clavier.
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
  retiredNotice: {
    ...type.body,
    color: colors.danger,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[8],
  },
  // PRE-3 (Figma « Visual / Pill ») : pastille 30, rayon 16, fond
  // surface-subtle, libellé Regular 12 ; sélection lavande, contour primarySoft.
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    height: dimensions.categoryTag.visualHeight,
    paddingHorizontal: spacing[8],
    borderRadius: fixedRadii[16],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  // Q53 (8) : fond d'une Catégorie retirée encore affectée (choisie ou non).
  tagRetired: {
    backgroundColor: colors.dangerSurface,
  },
  tagSelected: {
    borderColor: colors.primarySoft,
    backgroundColor: colors.selectionSurface,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  tagLabel: {
    ...type.supporting,
    color: colors.textPrimary,
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
  colorBand: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
  },
  colorBandSegment: {
    flex: 1,
    height: 32,
  },
  colorBandSegmentSelected: {
    height: 40,
    marginHorizontal: -4,
    zIndex: 1,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: colors.background,
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
