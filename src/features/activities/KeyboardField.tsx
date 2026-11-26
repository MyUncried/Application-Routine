import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View, type Insets, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import {
  cellEntryDisplay,
  cellEntryEmpty,
  composeCellEntry,
  type CellEntryKind,
  type CellEntryState,
} from "@/features/activities/cellEntry";
import { TABLE_CELL_ACTIVE_BACKGROUND } from "@/features/activities/sheetTable";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-5 story 2.2 (AD-26, FR-23 à FR-25, FR-6 composant) — champ clavier UNIQUE de la
 * Feuille « Paramètres d'exécution », sur le `TextInput` de React Native (clavier natif,
 * aucun clavier personnalisé) :
 * - `text` : libellé de phase (story 2.8), clavier texte, au plus 20 points de code (une
 *   saisie plus longue est refusée), fermé par Retour, sans barre ;
 * - D-434 (décision de Hermann du 19/10, QD-434-1 à 4) — cellules des tableaux :
 *   `cellDuration` (Cible en mode Durée, Pause ; durée de phase en 2.8), « MM:SS » au clavier
 *   numérique (`number-pad`) ; `cellInteger` (Cible en mode Répétitions), entier au clavier
 *   numérique ; `cellDecimal` (Charge d'une ligne), clavier décimal.
 * - Recette du 20/10 (RC-14) : la charge commune (séries identiques, dans l'option Avec) suit
 *   le même mécanisme, `cellDecimal` ; l'ancien mode `decimal` (édition native, sélection de
 *   toute la valeur au focus, RC-3) est retiré.
 *
 * Cellule (D-434, §3) : la valeur est rendue par un `Text` de la cellule ; le `TextInput`
 * natif, posé sur la cellule, est transparent et ne reçoit aucun toucher (`pointerEvents`
 * « none » sur son conteneur) : il ne porte que le focus et le clavier. Le toucher de la
 * cellule (`Pressable`, cible de 36) lui donne le focus. Ainsi aucune sélection native ni
 * poignée iOS n'apparaît (aucun geste de sélection ne l'atteint, aucune sélection n'est
 * posée par le code), le curseur est masqué et le menu d'édition (coller) désactivé. La
 * saisie est composée par `composeCellEntry` : la première frappe remplace la valeur, les
 * suivantes composent, Retour arrière supprime le dernier chiffre. Saisie vide d'une durée ou
 * d'un entier (Cible à l'échec ou à renseigner, cellule vidée) : « 00:00 » ou « 0 » atténué.
 *
 * Le champ garde un texte LOCAL pendant le focus (initialisé par `editText` au focus, et de
 * nouveau quand `entryGeneration` change : « À l'échec ») et affiche `displayValue` hors
 * focus ; il n'applique rien lui-même : l'appelant applique la saisie à la sortie
 * (`useSheetKeyboard`). Actif : fond `#EAEAFF` (Figma `9292:18077`) et état « sélectionné »
 * annoncé ; valeur à renseigner : fond `#FFF1F0` (Q35). Le gabarit est fourni par l'appelant.
 */

/**
 * Recette iPhone du 26/11/2026 (après-midi), point B, Hermann : « Le champ et son cadre grossissent légèrement pendant le focus et la
 * frappe. » — fourni par la modale « Paramètres d'exécution » (`ExecutionParametersSheet`) : une cellule active y est agrandie
 * (`FIELD_GROW_SCALE`, transformation seule, aucune mise en page déplacée). Absent (`null`, autres écrans) : rendu inchangé.
 * `reduceMotion` : agrandissement immédiat, sans animation (D-7).
 */
export const KeyboardFieldGrowContext = createContext<{ readonly reduceMotion: boolean } | null>(null);
/**
 * Point B du 26/11/2026 : agrandissement du champ actif et durée de son animation. Recette iPhone du 26/11/2026 (soir), Hermann :
 * « Augmenter encore la taille et mettre un liseré bleu au champ du focus » — 1,15 et liseré `colors.primary` (`styles.grownFrame`).
 * [1,08 (« légèrement », 26/11/2026 après-midi) — remplacé.]
 */
export const FIELD_GROW_SCALE = 1.15;
const FIELD_GROW_MS = 160;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Longueur maximale d'un libellé de phase, en points de code (FR-6). */
export const KEYBOARD_TEXT_MAX_CODE_POINTS = 20;

/** Mode natif (édition par le `TextInput` visible) et modes de cellule (D-434, RC-14). */
type NativeMode = "text";
type CellMode = "cellDuration" | "cellInteger" | "cellDecimal";
export type KeyboardFieldMode = NativeMode | CellMode;

const CELL_ENTRY_KIND: Readonly<Record<CellMode, CellEntryKind>> = {
  cellDuration: "duration",
  cellInteger: "integer",
  cellDecimal: "decimal",
};

type CommonProps = {
  /** Valeur affichée hors focus (ex. « 20 kg », « 1 min 5 s »). */
  displayValue: string;
  /** Texte d'édition au focus (ex. « 20 », « 0105 » ; vide pour 0 kg, une Cible à l'échec ou à renseigner). */
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
  testID: string;
};

type NativeProps = CommonProps & { mode: NativeMode; style?: StyleProp<TextStyle> };

type CellProps = CommonProps & {
  mode: CellMode;
  /** Gabarit de la cellule (`tableCellStyle`). */
  style?: StyleProp<ViewStyle>;
  /** Style du texte de la valeur (`tableCellValueStyle`). */
  valueStyle?: StyleProp<TextStyle>;
  /** Annonce de la valeur hors focus, si elle diffère de `displayValue` (« — » annoncé « aucune valeur »). */
  spokenDisplayValue?: string;
  /** Valeur à renseigner ou invalide : fond `#FFF1F0` (l'indice est annoncé par `accessibilityHint`). */
  invalid?: boolean;
  /**
   * PRE-9, recette iPhone n° 2 du 31/10/2026 (constat e) : valeur « à vérifier » (durée reprise d'une
   * valeur par défaut du Mouvement) — fond orange pâle (`toVerifyColors.surface`) ; `invalid` prime.
   */
  toVerify?: boolean;
  /**
   * Recette du 16/11/2026 (mp-charge-vide, Hermann : « Charge avec - pas de liseré rouge ») : une valeur à renseigner
   * reste rouge pendant la saisie, tant que rien n'est tapé ; au premier chiffre, couleur du champ actif.
   */
  invalidWhileEmpty?: boolean;
  accessibilityHint?: string;
  /** D-434 : génération de la saisie (`useSheetKeyboard.entryGeneration`). */
  entryGeneration?: number;
  // [Retiré le 31/10/2026, PRE-9 — contrôle de la recette n° 2 (cr2-phases KO) : `onSubmitEditing`
  // (touche « Next » du clavier numérique, fiche Mouvement) ; l'utilisateur touche lui-même le champ
  // suivant.]
};

export function KeyboardField(props: NativeProps | CellProps) {
  if (props.mode === "text") return <NativeEntryField {...props} mode={props.mode} />;
  return <CellEntryField {...props} mode={props.mode} />;
}

/** Libellé de phase (`text`) : `TextInput` visible, édition native. */
function NativeEntryField({
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
}: NativeProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  return (
    <TextInput
      ref={(input) => inputRef?.(input)}
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
        // Au plus 20 points de code ; une saisie plus longue est refusée.
        if ([...next].length > KEYBOARD_TEXT_MAX_CODE_POINTS) return;
        setText(next);
        onChangeText(next);
      }}
      keyboardType="default"
      selectTextOnFocus={false}
      returnKeyType="done"
      submitBehavior="blurAndSubmit"
      autoCorrect={false}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      hitSlop={hitSlop}
      style={[style, active ? { backgroundColor: TABLE_CELL_ACTIVE_BACKGROUND } : null]}
      testID={testID}
    />
  );
}

/**
 * D-434 — cellule saisie au clavier numérique, sans sélection native. Identifiants :
 * `testID` (cellule touchable, nom et valeur annoncés), `${testID}-value` (valeur affichée),
 * `${testID}-input` (entrée native transparente : focus, clavier, texte reçu).
 */
function CellEntryField({
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
  valueStyle,
  spokenDisplayValue,
  invalid = false,
  toVerify = false,
  invalidWhileEmpty = false,
  accessibilityHint,
  entryGeneration = 0,
  testID,
}: CellProps) {
  const kind = CELL_ENTRY_KIND[mode];
  const [focused, setFocused] = useState(false);
  const [entry, setEntryState] = useState<CellEntryState>({ text: "", fresh: true });
  // Revue D-434 : la saisie la plus récente, lue par les événements natifs successifs (frappes
  // rapides avant un nouveau rendu).
  const entryRef = useRef(entry);
  const setEntry = (next: CellEntryState) => {
    entryRef.current = next;
    setEntryState(next);
  };
  const ownRef = useRef<TextInput | null>(null);
  // « À l'échec » (D-434) : la valeur du champ actif a été remplacée sans sortie du champ ;
  // la saisie repart du nouveau texte d'édition, la frappe suivante remplace (état ajusté
  // pendant le rendu, sans effet).
  const [seenGeneration, setSeenGeneration] = useState(entryGeneration);
  if (seenGeneration !== entryGeneration) {
    setSeenGeneration(entryGeneration);
    if (focused) setEntryState({ text: editText, fresh: true });
  }
  useEffect(() => {
    entryRef.current = entry;
  }, [entry]);
  const shown = focused ? cellEntryDisplay(kind, entry.text) : displayValue;
  const empty = focused && cellEntryEmpty(kind, entry.text);
  // Point B du 26/11/2026 : champ actif agrandi dans la modale « Paramètres d'exécution » (`KeyboardFieldGrowContext`).
  const growContext = useContext(KeyboardFieldGrowContext);
  const growEnabled = growContext !== null;
  const growImmediate = growContext === null || growContext.reduceMotion;
  const grown = growEnabled && active;
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const target = grown ? FIELD_GROW_SCALE : 1;
    if (growImmediate) {
      scale.setValue(target);
      return undefined;
    }
    const animation = Animated.timing(scale, { toValue: target, duration: FIELD_GROW_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [grown, growImmediate, scale]);
  return (
    <AnimatedPressable
      onPress={() => ownRef.current?.focus()}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: focused ? shown : (spokenDisplayValue ?? displayValue) }}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: active }}
      hitSlop={hitSlop}
      style={[
        style,
        // Recette du 16/11/2026 (mq-charge-rouge, Hermann : « Activation de Avec Charge : le champ a un fond bleu et un liseré rouge. Il doit
        // avoir un fond rouge et sans liseré ») : tant que la valeur reste à renseigner (au focus : saisie vide ou nulle), le fond rouge prime.
        // [Fond actif au focus dès qu'une saisie décimale existait (« 0 » compris) — remplacé.]
        active && !(invalid && invalidWhileEmpty && (!focused || !(Number(entry.text.replace(",", ".")) > 0))) ? styles.active : invalid ? styles.invalid : toVerify ? styles.toVerify : null,
        growEnabled ? { transform: [{ scale }] } : null,
      ]}
      testID={testID}
    >
      {/* Recette iPhone du 26/11/2026 (soir) : liseré bleu du champ en saisie (modale seulement, `KeyboardFieldGrowContext`) — calque
          superposé au gabarit, de son rayon, pour ne déplacer aucune mise en page. */}
      {grown ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.grownFrame, { borderRadius: StyleSheet.flatten(style)?.borderRadius }]}
          testID={`${testID}-focus-frame`}
        />
      ) : null}
      <Text style={[valueStyle, empty ? styles.emptyValue : null]} testID={`${testID}-value`}>
        {shown}
      </Text>
      {/* Entrée native : focus et clavier seulement ; transparente et hors des touchers. Pour
          VoiceOver, la cellule (`Pressable`, élément accessible) regroupe son contenu. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <TextInput
          ref={(input) => {
            ownRef.current = input;
            inputRef?.(input);
          }}
          // Revue D-434 : l'entrée native porte le texte brut de la saisie (chiffres seuls, sans
          // zéros de remplissage ni « : ») ; la composition compare le texte natif reçu à ce
          // texte brut, jamais à l'affichage formaté.
          value={focused ? entry.text : ""}
          onFocus={() => {
            setEntry({ text: editText, fresh: true });
            setFocused(true);
            onFocus();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          onChangeText={(next) => {
            const current = entryRef.current;
            const composed = composeCellEntry(kind, current, current.text, next);
            if (composed === current) return;
            setEntry(composed);
            if (composed.text !== current.text) onChangeText(composed.text);
          }}
          keyboardType={kind === "decimal" ? "decimal-pad" : "number-pad"}
          selectTextOnFocus={false}
          contextMenuHidden
          caretHidden
          autoCorrect={false}
          spellCheck={false}
          accessible={false}
          style={styles.input}
          testID={`${testID}-input`}
        />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: TABLE_CELL_ACTIVE_BACKGROUND,
  },
  // Valeur à renseigner : fond rouge léger (Q35 ; jeton `color.dangerSurface`, #FFF1F0).
  invalid: {
    backgroundColor: colors.dangerSurface,
  },
  // PRE-9, recette iPhone n° 2 (constat e) : valeur « à vérifier », fond orange pâle (rendu choisi).
  toVerify: {
    backgroundColor: toVerifyColors.surface,
  },
  // Recette iPhone du 26/11/2026 (soir), Hermann : « mettre un liseré bleu au champ du focus » — trait de 1 en couleur primaire,
  // calque posé sur le gabarit de la cellule (aucune mise en page déplacée ; le rayon est celui du gabarit).
  grownFrame: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  // « 00:00 » ou « 0 » d'une saisie vide (Cible à l'échec ou à renseigner, cellule vidée).
  emptyValue: {
    color: colors.textSecondary,
  },
  // Entrée transparente : ni texte, ni curseur, ni sélection visibles.
  input: {
    flex: 1,
    opacity: 0,
    padding: 0,
  },
});
