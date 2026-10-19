import { useState, type Ref } from "react";
import { Platform, TextInput, type Insets, type StyleProp, type TextStyle } from "react-native";

import { TABLE_CELL_ACTIVE_BACKGROUND } from "@/features/activities/sheetTable";

/**
 * PRE-5 story 2.2 (AD-26, FR-23 à FR-25, FR-6 composant) — champ clavier UNIQUE de la
 * Feuille « Paramètres d'exécution », sur le `TextInput` de React Native (clavier natif,
 * aucun clavier personnalisé) :
 * - `decimal` : charge, clavier numérique décimal standard (`decimal-pad`) ; sur iOS, la
 *   barre Précédent / Suivant / « Fermer » est rattachée par `inputAccessoryViewID` ;
 * - `text` : libellé de phase (story 2.8), clavier texte, au plus 20 points de code (une
 *   saisie plus longue est refusée), fermé par Retour, sans barre.
 *
 * Le champ garde un texte LOCAL pendant le focus (initialisé par `editText` au focus) et
 * affiche `displayValue` hors focus ; il n'applique rien lui-même : l'appelant applique la
 * saisie à la sortie (`useSheetKeyboard`). Actif : fond `#EAEAFF` (Figma `9292:18077`) et
 * état « sélectionné » annoncé. Le gabarit (cellule de tableau ou pastille de ligne) est
 * fourni par l'appelant.
 */

/** Longueur maximale d'un libellé de phase, en points de code (FR-6). */
export const KEYBOARD_TEXT_MAX_CODE_POINTS = 20;

export type KeyboardFieldMode = "decimal" | "text";

export function KeyboardField({
  mode,
  displayValue,
  editText,
  active,
  onFocus,
  onBlur,
  onChangeText,
  inputRef,
  accessoryID,
  accessibilityLabel,
  hitSlop,
  style,
  testID,
}: {
  mode: KeyboardFieldMode;
  /** Valeur affichée hors focus (ex. « 20 kg »). */
  displayValue: string;
  /** Texte d'édition au focus (ex. « 20 », vide pour 0). */
  editText: string;
  active: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  inputRef?: Ref<TextInput>;
  /** iOS, mode décimal : identifiant de la barre (`InputAccessoryView`). */
  accessoryID?: string;
  accessibilityLabel: string;
  /** Extension de la zone tactile (cellule de tableau : cible de 36). */
  hitSlop?: Insets;
  style?: StyleProp<TextStyle>;
  testID: string;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const decimal = mode === "decimal";
  return (
    <TextInput
      ref={inputRef}
      value={focused ? text : displayValue}
      onFocus={() => {
        setText(editText);
        setFocused(true);
        onFocus();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur();
      }}
      onChangeText={(next) => {
        // Mode texte : au plus 20 points de code ; une saisie plus longue est refusée.
        if (!decimal && [...next].length > KEYBOARD_TEXT_MAX_CODE_POINTS) return;
        setText(next);
        onChangeText(next);
      }}
      keyboardType={decimal ? "decimal-pad" : "default"}
      inputAccessoryViewID={decimal && Platform.OS === "ios" ? accessoryID : undefined}
      returnKeyType={decimal ? undefined : "done"}
      submitBehavior={decimal ? undefined : "blurAndSubmit"}
      autoCorrect={false}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={hitSlop}
      style={[style, active ? { backgroundColor: TABLE_CELL_ACTIVE_BACKGROUND } : null]}
      testID={testID}
    />
  );
}
