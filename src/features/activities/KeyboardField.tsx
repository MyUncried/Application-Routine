import { useEffect, useRef, useState } from "react";
import { TextInput, type Insets, type StyleProp, type TextStyle } from "react-native";

import { TABLE_CELL_ACTIVE_BACKGROUND } from "@/features/activities/sheetTable";

/**
 * PRE-5 story 2.2 (AD-26, FR-23 à FR-25, FR-6 composant) — champ clavier UNIQUE de la
 * Feuille « Paramètres d'exécution », sur le `TextInput` de React Native (clavier natif,
 * aucun clavier personnalisé) :
 * - `decimal` : charge, clavier numérique décimal standard (`decimal-pad`) ; la barre
 *   Précédent / Suivant / « Fermer » est rendue par la Feuille au-dessus du clavier
 *   (recette du 19/10, RC-1 : `InputAccessoryView` ne s'affiche pas dans la `Modal`) ;
 *   toute la valeur est sélectionnée quand le champ prend le focus (RC-3), y compris par
 *   Précédent / Suivant ;
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
  /** Rappel de référence de l'entrée (`useSheetKeyboard.register`). */
  inputRef?: (input: TextInput | null) => void;
  accessibilityLabel: string;
  /** Extension de la zone tactile (cellule de tableau : cible de 36). */
  hitSlop?: Insets;
  style?: StyleProp<TextStyle>;
  testID: string;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const decimal = mode === "decimal";
  const ownRef = useRef<TextInput | null>(null);
  // RC-3 : sélection de toute la valeur demandée au focus, posée après le rendu qui remplace
  // la valeur affichée (« 20 kg ») par le texte d'édition (« 20 »).
  const selectAllRef = useRef(false);
  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current = false;
    const input = ownRef.current;
    if (text.length > 0 && input !== null && typeof input.setSelection === "function") input.setSelection(0, text.length);
  });
  return (
    <TextInput
      ref={(input) => {
        ownRef.current = input;
        inputRef?.(input);
      }}
      value={focused ? text : displayValue}
      onFocus={() => {
        setText(editText);
        setFocused(true);
        selectAllRef.current = decimal;
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
      selectTextOnFocus={decimal}
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
