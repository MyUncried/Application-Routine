import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputKeyPressEventData,
  type ViewStyle,
} from "react-native";

import { insertPastedText, instructionStepsLength, splitStepAt } from "@/domain/activities/instructionSteps";
import { INSTRUCTION_MAX_LENGTH } from "@/domain/sessions/validation";
import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-5 story 3.1 (FR-33, FR-34, AD-22, D-425, PRD §9-6) — Description de
 * l'Éditeur en étapes numérotées. Une ligne par étape (numéro + `TextInput`
 * natif), puis une ligne d'invite grise ; l'utilisateur ne gère jamais la
 * numérotation. Toute saisie passe par le codec unique de 1.1
 * (`splitStepAt`, `insertPastedText`, `instructionStepsLength`) : ce
 * composant ne réimplémente ni le découpage, ni l'encodage, ni la mesure.
 * Aucun réordonnancement (modèle A) ni bouton Ajouter.
 */

/** Position du curseur à donner à une ligne après une saisie (unités UTF-16). */
export type StepFocus = { readonly index: number; readonly cursor: number };

export type StepChange = { readonly steps: string[]; readonly focus: StepFocus | null };

/**
 * Lignes affichées (AC1) : les étapes, plus une ligne d'invite vide quand la
 * liste est vide ou que la dernière étape est remplie. Une dernière étape vide
 * (créée par Entrée) porte elle-même l'invite : jamais de seconde invite.
 */
export function displayedStepRows(steps: readonly string[]): readonly string[] {
  return steps.length === 0 || steps[steps.length - 1] !== "" ? [...steps, ""] : steps;
}

/**
 * PRE-7 story B.2 (B1, D-445, arbitrage A1) : lignes réellement rendues. La
 * ligne d'invite (dernière ligne de `displayedStepRows`, toujours vide) n'est
 * rendue au repos qu'au rang 1 (« Décrivez la première étape ») ; au rang > 1,
 * « Étape suivante » n'apparaît que lorsqu'une ligne de la Description a le
 * focus. La liste des étapes n'est jamais modifiée : une dernière étape vide
 * masquée reste dans `steps` (et n'est pas enregistrée, `encodeInstructionSteps`).
 */
export function renderedStepRows(steps: readonly string[], active: boolean): readonly string[] {
  const rows = displayedStepRows(steps);
  return active || rows.length <= 1 ? rows : rows.slice(0, -1);
}

/** Ligne de la liste affichée, matérialisée en étape si c'est la ligne d'invite. */
function withRow(steps: readonly string[], index: number): string[] {
  return index === steps.length ? [...steps, ""] : [...steps];
}

/**
 * Saisie dans la ligne `index` (`index === steps.length` : ligne d'invite),
 * dont le texte natif devient `nextText` (PRD §9-6, AC2, AC3). Le diff du
 * préfixe et du suffixe communs isole le texte inséré :
 * - sans saut de ligne : l'étape prend le texte, en place ;
 * - un `"\n"` seul inséré (Entrée) : `splitStepAt` au curseur, le curseur passe
 *   au début de l'étape suivante ;
 * - sinon (collage multiligne, `\n` ou `\r\n`) : `insertPastedText` à la place
 *   de la sélection remplacée, curseur à la fin du texte collé.
 * Limite (QN-1) : une saisie qui porterait `instructionStepsLength` au-delà de
 * `INSTRUCTION_MAX_LENGTH` est refusée en entier (`null`, aucune étape
 * modifiée) ; un raccourcissement reste admis. Aucun changement : `null`.
 */
export function applyStepTextChange(steps: readonly string[], index: number, nextText: string): StepChange | null {
  if (!Number.isInteger(index) || index < 0 || index > steps.length) {
    return null;
  }
  const base = withRow(steps, index);
  const previous = base[index]!;
  if (nextText === previous) {
    return null;
  }
  let next: string[];
  let focus: StepFocus | null = null;
  if (!nextText.includes("\n")) {
    next = base.map((step, position) => (position === index ? nextText : step));
  } else {
    let prefix = 0;
    const shortest = Math.min(previous.length, nextText.length);
    while (prefix < shortest && previous[prefix] === nextText[prefix]) prefix += 1;
    let suffix = 0;
    while (
      suffix < shortest - prefix &&
      previous[previous.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
    ) {
      suffix += 1;
    }
    const inserted = nextText.slice(prefix, nextText.length - suffix);
    const removedEnd = previous.length - suffix;
    if ((inserted === "\n" || inserted === "\r\n") && removedEnd === prefix) {
      next = splitStepAt(base, index, prefix);
      focus = { index: index + 1, cursor: 0 };
    } else {
      next = insertPastedText(base, index, { start: prefix, end: removedEnd }, inserted);
      const lines = inserted.split(/\r?\n/);
      const last = lines[lines.length - 1]!;
      focus = { index: index + lines.length - 1, cursor: lines.length === 1 ? prefix + last.length : last.length };
    }
  }
  const nextLength = instructionStepsLength(next);
  if (nextLength > INSTRUCTION_MAX_LENGTH && nextLength > instructionStepsLength(steps)) {
    return null;
  }
  return { steps: next, focus };
}

/**
 * Retour arrière sur la ligne vide `index` (AC2) : une étape vide n > 1 est
 * supprimée et le curseur passe en fin de l'étape n − 1 ; sur la ligne
 * d'invite, seul le curseur remonte. Ligne 1 ou ligne non vide : `null`
 * (comportement natif ; pas de fusion d'étapes).
 */
export function applyStepBackspace(steps: readonly string[], index: number): StepChange | null {
  if (!Number.isInteger(index) || index < 1 || index > steps.length) {
    return null;
  }
  const previous = steps[index - 1]!;
  const focus = { index: index - 1, cursor: previous.length };
  if (index === steps.length) {
    return { steps: [...steps], focus };
  }
  if (steps[index] !== "") {
    return null;
  }
  return { steps: steps.filter((_, position) => position !== index), focus };
}

/**
 * Relevé Figma `9071:53260` / composant `Description / Étape` `9002:15555`
 * (lecture seule, 19/10) : propriétés de présentation, jamais des règles.
 */
/** Écart vertical entre deux étapes. */
const STEP_ROW_GAP = spacing[8];
/** Écart entre le numéro et le texte d'une étape. */
const STEP_NUMBER_GAP = spacing[8];
/** Largeur du numéro, aligné à droite (s'élargit au-delà de 9 étapes, jamais tronqué). */
const STEP_NUMBER_WIDTH = 16;
/**
 * PRE-5 story 3.2 (FR-38) : gouttière du texte des étapes (numéro + écart, 16 + 8 = 24),
 * reprise par le padding horizontal de la Carte des paramètres pour l'aligner au fer du texte.
 */
export const DESCRIPTION_STEP_GUTTER = STEP_NUMBER_WIDTH + STEP_NUMBER_GAP;
/** Numéro et texte de l'invite : `#AEB3BA`, sans jeton (AD-11 : `tokens.ts` inchangé). */
const STEP_PROMPT_COLOR = "#AEB3BA";

type InputHandle = {
  focus?: () => void;
  setSelection?: (start: number, end: number) => void;
};

export type DescriptionStepsProps = {
  readonly steps: readonly string[];
  readonly onChange: (steps: readonly string[]) => void;
  /** Une ligne de la Description a le focus (↑, recadrage au-dessus du clavier). */
  readonly onFocusChange: (focused: boolean) => void;
  /** Bas de la ligne active, relatif au haut de la liste, à chaque changement de ligne ou de mesure. */
  readonly onActiveRowBottomChange: (bottom: number) => void;
  readonly style?: StyleProp<ViewStyle>;
};

export function DescriptionSteps({ steps, onChange, onFocusChange, onActiveRowBottomChange, style }: DescriptionStepsProps) {
  const t = strings.screens.exercise.instruction;
  // B1 : une ligne a le focus. Posé au focus, retiré par la même perte de focus
  // différée que ↑ : un passage de ligne à ligne ne démonte jamais l'invite.
  const [active, setActive] = useState(false);
  const rows = displayedStepRows(steps);
  const visibleRows = renderedStepRows(steps, active);
  const inputRefs = useRef<(InputHandle | null)[]>([]);
  const rowLayouts = useRef<{ y: number; height: number }[]>([]);
  const pendingFocus = useRef<StepFocus | null>(null);
  const focusedIndex = useRef<number | null>(null);
  const onActiveRef = useRef(onActiveRowBottomChange);
  const onFocusChangeRef = useRef(onFocusChange);
  const pendingBlur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    onActiveRef.current = onActiveRowBottomChange;
    onFocusChangeRef.current = onFocusChange;
  });
  useEffect(
    () => () => {
      if (pendingBlur.current !== null) clearTimeout(pendingBlur.current);
    },
    [],
  );

  function cancelPendingBlur() {
    if (pendingBlur.current === null) return;
    clearTimeout(pendingBlur.current);
    pendingBlur.current = null;
  }

  function reportActive(index: number | null) {
    if (index === null) return;
    const layout = rowLayouts.current[index];
    if (layout) onActiveRef.current(layout.y + layout.height);
  }

  // Après le rendu de la nouvelle liste : la ligne ciblée reçoit le focus et le curseur.
  useEffect(() => {
    const requested = pendingFocus.current;
    if (requested === null) return;
    pendingFocus.current = null;
    const input = inputRefs.current[requested.index];
    input?.focus?.();
    input?.setSelection?.(requested.cursor, requested.cursor);
  });

  function apply(change: StepChange | null) {
    if (change === null) return;
    pendingFocus.current = change.focus;
    onChange(change.steps);
  }

  function handleKeyPress(index: number, event: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (event.nativeEvent.key !== "Backspace" || rows[index] !== "") return;
    apply(applyStepBackspace(steps, index));
  }

  return (
    <View style={[styles.list, style]} testID="exercise-instruction-steps">
      {visibleRows.map((text, index) => {
        // `rows` : lignes logiques (invite comprise) ; `visibleRows` : lignes rendues (B1). La
        // seule ligne rendue porte aussi l'invite (`["", ""]` au repos : « Décrivez la première étape »).
        const isLast = index === rows.length - 1 || visibleRows.length === 1;
        const isEmpty = text === "";
        const placeholder = isEmpty && isLast ? (index === 0 ? t.firstStepPlaceholder : t.nextStepPlaceholder) : undefined;
        const number = index + 1;
        return (
          <View
            key={index}
            style={styles.row}
            onLayout={(event) => {
              rowLayouts.current[index] = { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height };
              if (focusedIndex.current === index) reportActive(index);
            }}
            testID={`exercise-instruction-row-${number}`}
          >
            {/* AC6 : le numéro est porté par le nom du champ (« Étape n ») ; il n'est pas lu en double. */}
            <Text
              style={[styles.number, isEmpty ? styles.promptNumber : null]}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              testID={`exercise-instruction-step-number-${number}`}
            >
              {`${number}.`}
            </Text>
            <TextInput
              ref={(node) => {
                inputRefs.current[index] = node as InputHandle | null;
              }}
              value={text}
              onChangeText={(nextText) => apply(applyStepTextChange(steps, index, nextText))}
              onKeyPress={(event) => handleKeyPress(index, event)}
              placeholder={placeholder}
              placeholderTextColor={STEP_PROMPT_COLOR}
              accessibilityLabel={t.stepAccessibilityLabel.replace("{n}", String(number))}
              multiline
              scrollEnabled={false}
              onFocus={() => {
                cancelPendingBlur();
                focusedIndex.current = index;
                setActive(true);
                onFocusChange(true);
                reportActive(index);
              }}
              onBlur={() => {
                // Passage à une autre ligne : seul le dernier focus compte. Sur iOS, la perte
                // de focus de l'ancienne ligne peut précéder le focus de la nouvelle : elle est
                // différée, et annulée par ce focus (↑ reste monté, sans clignotement).
                if (focusedIndex.current !== index) return;
                cancelPendingBlur();
                pendingBlur.current = setTimeout(() => {
                  pendingBlur.current = null;
                  if (focusedIndex.current !== index) return;
                  focusedIndex.current = null;
                  setActive(false);
                  onFocusChangeRef.current(false);
                }, 0);
              }}
              style={styles.text}
              testID={index === 0 ? "exercise-instruction-input" : `exercise-instruction-step-${number}`}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Sans contenant (§9-2) : ni fond, ni contour, ni padding.
  list: {
    gap: STEP_ROW_GAP,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: STEP_NUMBER_GAP,
  },
  number: {
    ...type.label,
    color: colors.textSecondary,
    minWidth: STEP_NUMBER_WIDTH,
    textAlign: "right",
  },
  promptNumber: {
    color: STEP_PROMPT_COLOR,
  },
  text: {
    ...type.body,
    color: colors.textPrimary,
    flex: 1,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "top",
  },
});
