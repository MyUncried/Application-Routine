import { useEffect, useRef, useState, type ReactElement } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View, type AccessibilityActionEvent } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { WORK_PATTERN_DURATION_BOUNDS, WORK_PHASE_LIMITS } from "@/domain/activities/ExecutionParameters";
import { movementPhaseDefaultDuration } from "@/domain/activities/Movement";
import {
  addMovementPhase,
  moveMovementPhase,
  removeMovementPhase,
  renameMovementPhase,
  setMovementPhaseDuration,
  type MovementPhaseList,
} from "@/domain/activities/movementPhaseList";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { codePointLength } from "@/domain/sessions/validation";
import { strings } from "@/shared/i18n";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (story B.2, CE-MVT-01 §7 et §12, Figma « DSF / Formulaires / Phases du mouvement »
 * `10450:24387`) — bloc « Phases du mouvement (pour minuter l'exécution) » de la fiche :
 * structure et libellés seulement, JAMAIS de durée (paramètres locaux des Exercices, MVT-09).
 *
 * Recette A/B (F04, F05, F06) : liste d'étapes textuelles présentée comme la Description
 * (`DescriptionSteps`) — titre Regular 11 secondaire, numéro aligné à droite puis libellé, sans
 * contenant, sans poignée ni croix ni ligne de tableau. Une ligne par phase, puis une ligne
 * d'invite : « Nommez la première phase » à vide, « Phase suivante » ensuite, seulement quand le
 * bloc est en saisie au-delà de la première. Saisir dans l'invite crée la phase (compteur
 * monotone, `movementPhaseList.ts`) ; Entrée passe à l'invite ; retour arrière sur une phase vide
 * la retire (règle de la Description). L'ordre reste explicite (numéros) ; Monter, Descendre et
 * Retirer restent disponibles comme actions VoiceOver. Libellé limité à
 * `WORK_PHASE_LIMITS.labelMaxLength` points de code (20), la limite du modèle d'exécution, en
 * création comme en modification : une saisie qui la dépasse est refusée. En lecture seule :
 * libellés seuls, sans invite. Aucune exigence de phase : un Mouvement peut n'en avoir aucune.
 *
 * [Remplacé le 31/10/2026, PRE-9 A.2b — décision de Hermann du 30/10/2026 : « les durées de la phase
 * peuvent faire partie du mouvement, si elles sont renseignées elles sont reprises par défaut et
 * peuvent être changées dans la séance ». « JAMAIS de durée » ci-dessus est remplacé : chaque phase
 * porte une durée FACULTATIVE, affichée à droite de son libellé (« Durée » en invite si elle est
 * vide). La toucher ouvre, sous la ligne, la roulette de durée partagée (`DurationWheelPicker`,
 * bornes 1..3535 s, `WORK_PATTERN_DURATION_BOUNDS`, ouverture sur `00:00` quand elle est vide) ;
 * « Sans durée » la retire. En lecture seule : durée renseignée affichée, rien sinon. Aucun rendu
 * Figma de cette durée (`10450:24387` n'en montre pas) : rendu CHOISI, à valider en recette.]
 */

const t = strings.screens.movement.phases;

/** Relevé Figma `10450:24382` : mêmes valeurs que `Description / Étape` (`DescriptionSteps`). */
const ROW_GAP = spacing[8];
const NUMBER_GAP = spacing[8];
const NUMBER_WIDTH = 16;
/** Titre → liste : 10 (Figma `10450:24387`, comme la Description, `EDITOR_VERTICAL_GRID.titleToBlock`). */
const TITLE_TO_LIST = spacing[10];
/** Numéro et texte de l'invite, comme la Description (`#AEB3BA`, sans jeton). */
const PROMPT_COLOR = "#AEB3BA";

/** PRE-9 A.2b : largeur de la valeur de durée, celle d'une cellule Durée du tableau des phases (76). */
const DURATION_WIDTH = 76;
/** Hauteur de la valeur de durée (ligne de texte) ; cible portée à 44 par `hitSlop`. */
const DURATION_TOUCH_HEIGHT = 20;

/** Libellé admis (F06) : au plus `WORK_PHASE_LIMITS.labelMaxLength` points de code. */
export function isPhaseLabelWithinLimit(label: string): boolean {
  return codePointLength(label) <= WORK_PHASE_LIMITS.labelMaxLength;
}

export type MovementPhasesEditorProps = {
  readonly value: MovementPhaseList;
  readonly onChange: (next: MovementPhaseList) => void;
  readonly editable: boolean;
  /**
   * Recette A/B B.10 (b2-4) : bloc en saisie ou non (gabarit photo remonté, ↑ de fermeture du
   * clavier). Le passage d'une ligne à l'autre n'est pas une fin de saisie (perte de focus différée,
   * comme `DescriptionSteps`).
   */
  readonly onFocusChange?: (focused: boolean) => void;
  /**
   * Recette du 27/10 (r11-remontee) : bas de la ligne en saisie, relatif au haut du bloc, à chaque
   * changement de ligne ou de mesure (recadrage au-dessus du clavier, comme la Description).
   */
  readonly onActiveRowBottomChange?: (bottom: number) => void;
  readonly testID?: string;
};

export function MovementPhasesEditor({
  value,
  onChange,
  editable,
  onFocusChange,
  onActiveRowBottomChange,
  testID = "movement-phases",
}: MovementPhasesEditorProps) {
  const [active, setActiveState] = useState(false);
  const onFocusChangeRef = useRef(onFocusChange);
  const onActiveRowBottomRef = useRef(onActiveRowBottomChange);
  useEffect(() => {
    onFocusChangeRef.current = onFocusChange;
    onActiveRowBottomRef.current = onActiveRowBottomChange;
  });
  // Ligne en saisie et cadres des lignes (dans la liste), pour le recadrage au-dessus du clavier.
  const focusedKey = useRef<number | "invite" | null>(null);
  const rowLayouts = useRef(new Map<number | "invite", { y: number; height: number }>());
  const listY = useRef(0);
  function reportActive(key: number | "invite" | null) {
    if (key === null) return;
    const layout = rowLayouts.current.get(key);
    if (layout) onActiveRowBottomRef.current?.(listY.current + layout.y + layout.height);
  }
  function recordRowLayout(key: number | "invite", layout: { y: number; height: number }) {
    rowLayouts.current.set(key, { y: layout.y, height: layout.height });
    if (focusedKey.current === key) reportActive(key);
  }
  const pendingBlur = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pendingBlur.current !== null) clearTimeout(pendingBlur.current);
    },
    [],
  );
  function setActive(next: boolean) {
    if (pendingBlur.current !== null) {
      clearTimeout(pendingBlur.current);
      pendingBlur.current = null;
    }
    if (next) {
      setActiveState(true);
      onFocusChangeRef.current?.(true);
      return;
    }
    // Sur iOS, la perte de focus de l'ancienne ligne peut précéder le focus de la nouvelle : différée,
    // et annulée par ce focus.
    pendingBlur.current = setTimeout(() => {
      pendingBlur.current = null;
      setActiveState(false);
      onFocusChangeRef.current?.(false);
    }, 0);
  }
  // Une saisie dans l'invite crée la phase et y déplace le focus : la suite de la frappe complète
  // CETTE phase (jamais une phase par caractère). Clé `"invite"` : la ligne d'invite.
  const inputs = useRef(new Map<number | "invite", TextInput>());
  const pendingFocus = useRef<number | "invite" | null>(null);
  // Recette du 27/10 (remarque 2, accord de Hermann) : comme la Description, Entrée sur une phase
  // ouvre la phase suivante JUSTE APRÈS elle — l'invite se place sous la phase (`null` : en fin).
  const [inviteAfter, setInviteAfter] = useState<number | null>(null);
  // PRE-9 A.2b : phase dont la roulette de durée est ouverte (une seule à la fois).
  const [durationOpen, setDurationOpen] = useState<number | null>(null);
  const openDurationPhase = editable && value.phases.some((phase) => phase.id === durationOpen) ? durationOpen : null;
  useEffect(() => {
    if (pendingFocus.current === null) return;
    inputs.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });
  const phases = value.phases;
  const showInvite = editable && (phases.length === 0 || active);
  // Place de l'invite : sous la phase `inviteAfter` si elle existe encore, sinon en fin de liste.
  const inviteIndex = inviteAfter !== null && inviteAfter < phases.length - 1 ? inviteAfter : null;

  function removeAt(index: number) {
    const phase = phases[index];
    if (!phase) return;
    const previous = phases[index - 1];
    pendingFocus.current = previous ? previous.id : null;
    // Recette du 27/10 (r11-entree-phases) : le focus passe à la phase précédente AVANT le retrait de
    // la ligne en saisie — retirer un champ qui a le focus ferme puis rouvre le clavier.
    if (previous) inputs.current.get(previous.id)?.focus();
    onChange(removeMovementPhase(value, phase.id));
  }

  function onAccessibilityAction(index: number, event: AccessibilityActionEvent) {
    const phase = phases[index];
    if (!phase) return;
    if (event.nativeEvent.actionName === "moveUp") onChange(moveMovementPhase(value, phase.id, index - 1));
    else if (event.nativeEvent.actionName === "moveDown") onChange(moveMovementPhase(value, phase.id, index + 1));
    else if (event.nativeEvent.actionName === "remove") removeAt(index);
  }

  // Recette du 27/10 (r11-entree-phases) : lignes et invite dans UNE liste à clés — l'invite garde son
  // champ (jamais démonté pendant la saisie, sinon le clavier se ferme puis se rouvre) où qu'elle soit.
  const items: ReactElement[] = phases.flatMap((phase, index) => {
          const rank = String(index + 1);
          // Numéro affiché : décalé d'un rang sous une invite insérée (l'invite porte le rang suivant).
          const shownRank = String(index + 1 + (showInvite && inviteIndex !== null && index > inviteIndex ? 1 : 0));
          const actions = [
            ...(index > 0 ? [{ name: "moveUp", label: t.moveUp }] : []),
            ...(index < phases.length - 1 ? [{ name: "moveDown", label: t.moveDown }] : []),
            { name: "remove", label: t.remove.replace("{rank}", rank) },
          ];
          const row = (
            <View
              key={phase.id}
              style={styles.row}
              onLayout={(event) => recordRowLayout(phase.id, event.nativeEvent.layout)}
              testID={`${testID}-row-${rank}`}
            >
              <Text style={styles.number} accessible={false} importantForAccessibility="no-hide-descendants">
                {`${shownRank}.`}
              </Text>
              {editable ? (
                <TextInput
                  ref={(node) => {
                    if (node) inputs.current.set(phase.id, node);
                    else inputs.current.delete(phase.id);
                  }}
                  value={phase.label}
                  onChangeText={(label) => {
                    // F06 : une saisie au-delà de la limite est refusée en entier (le libellé reste).
                    if (!isPhaseLabelWithinLimit(label)) return;
                    onChange(renameMovementPhase(value, phase.id, label));
                  }}
                  onKeyPress={(event) => {
                    if (event.nativeEvent.key === "Backspace" && phase.label === "") removeAt(index);
                  }}
                  // Entrée : l'invite s'ouvre juste après cette phase et prend le focus (comme la
                  // Description, touche « retour » du clavier).
                  onSubmitEditing={() => {
                    pendingFocus.current = "invite";
                    setInviteAfter(index);
                  }}
                  submitBehavior="submit"
                  returnKeyType="default"
                  onFocus={() => {
                    focusedKey.current = phase.id;
                    setActive(true);
                    reportActive(phase.id);
                  }}
                  onBlur={() => setActive(false)}
                  style={styles.text}
                  accessibilityLabel={t.labelAccessibility.replace("{rank}", rank)}
                  accessibilityActions={actions}
                  onAccessibilityAction={(event) => onAccessibilityAction(index, event)}
                  testID={`${testID}-label-${rank}`}
                />
              ) : (
                <Text style={styles.text} testID={`${testID}-label-${rank}`}>
                  {phase.label}
                </Text>
              )}
              {renderDuration(phase.id, movementPhaseDefaultDuration(phase), rank)}
            </View>
          );
          const withWheel = openDurationPhase === phase.id ? [row, renderDurationWheel(phase.id, rank)] : [row];
          return showInvite && inviteIndex === index ? [...withWheel, renderInvite()] : withWheel;
  });
  if (showInvite && inviteIndex === null) items.push(renderInvite());

  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.title} accessibilityRole="header" testID={`${testID}-title`}>
        {t.title}
      </Text>
      <View
        style={styles.list}
        onLayout={(event) => {
          listY.current = event.nativeEvent.layout.y;
        }}
      >
        {items}
      </View>
    </View>
  );

  /** PRE-9 A.2b : durée par défaut de la phase, à droite du libellé. */
  function renderDuration(phaseId: number, seconds: number | null, rank: string) {
    const shown = seconds === null ? null : formatPhraseDuration(seconds);
    if (!editable) {
      return shown === null ? null : (
        <Text style={styles.duration} testID={`${testID}-duration-${rank}`}>
          {shown}
        </Text>
      );
    }
    const slop = (minTouchTarget - DURATION_TOUCH_HEIGHT) / 2;
    return (
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setDurationOpen((current) => (current === phaseId ? null : phaseId));
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t.durationAccessibility.replace("{rank}", rank)}, ${shown ?? t.durationNone}`}
        accessibilityState={{ expanded: openDurationPhase === phaseId }}
        hitSlop={{ top: slop, bottom: slop }}
        style={styles.durationButton}
        testID={`${testID}-duration-${rank}`}
      >
        <Text style={[styles.duration, shown === null ? styles.durationPrompt : null]}>{shown ?? t.durationPrompt}</Text>
      </Pressable>
    );
  }

  /** PRE-9 A.2b : roulette de durée sous la ligne de la phase ; ✓ applique, ✕ ferme sans rien changer. */
  function renderDurationWheel(phaseId: number, rank: string) {
    const phase = phases.find((candidate) => candidate.id === phaseId);
    const current = phase === undefined ? null : movementPhaseDefaultDuration(phase);
    const wheelLabels = strings.screens.exercise.wheelPicker;
    return (
      <View key={`duration-${phaseId}`} style={styles.wheel} testID={`${testID}-duration-wheel-${rank}`}>
        <DurationWheelPicker
          totalSeconds={current ?? 0}
          targetBounds={WORK_PATTERN_DURATION_BOUNDS}
          title={t.durationWheelTitle}
          onValidate={(seconds) => {
            setDurationOpen(null);
            onChange(setMovementPhaseDuration(value, phaseId, seconds));
          }}
          onCancel={() => setDurationOpen(null)}
          minutesAccessibilityLabel={wheelLabels.minutesAccessibilityLabel}
          secondsAccessibilityLabel={wheelLabels.secondsAccessibilityLabel}
          cancelAccessibilityLabel={wheelLabels.cancelAccessibilityLabel}
          validateAccessibilityLabel={wheelLabels.validateAccessibilityLabel}
        />
        {current !== null ? (
          <Pressable
            onPress={() => {
              setDurationOpen(null);
              onChange(setMovementPhaseDuration(value, phaseId, null));
            }}
            accessibilityRole="button"
            accessibilityLabel={t.durationClear}
            style={styles.clearButton}
            testID={`${testID}-duration-clear-${rank}`}
          >
            <Text style={styles.clearLabel}>{t.durationClear}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function renderInvite() {
    const position = inviteIndex === null ? phases.length : inviteIndex + 1;
    return (
          <View
            key="invite"
            style={styles.row}
            onLayout={(event) => recordRowLayout("invite", event.nativeEvent.layout)}
            testID={`${testID}-invite-row`}
          >
            <Text style={[styles.number, styles.promptNumber]} accessible={false} importantForAccessibility="no-hide-descendants">
              {`${position + 1}.`}
            </Text>
            <TextInput
              ref={(node) => {
                if (node) inputs.current.set("invite", node);
                else inputs.current.delete("invite");
              }}
              value=""
              placeholder={phases.length === 0 ? t.firstPlaceholder : t.nextPlaceholder}
              placeholderTextColor={PROMPT_COLOR}
              onChangeText={(label) => {
                if (label.length === 0 || !isPhaseLabelWithinLimit(label)) return;
                pendingFocus.current = value.nextPhaseId;
                // L'invite reste juste sous la phase créée, qui prend le focus (r11-entree-phases).
                setInviteAfter(position);
                const added = addMovementPhase(value, label);
                onChange(position < phases.length ? moveMovementPhase(added, value.nextPhaseId, position) : added);
              }}
              onKeyPress={(event) => {
                const previous = phases[position - 1];
                if (event.nativeEvent.key !== "Backspace" || !previous) return;
                setInviteAfter(null);
                inputs.current.get(previous.id)?.focus();
              }}
              submitBehavior="submit"
              returnKeyType="default"
              onFocus={() => {
                focusedKey.current = "invite";
                setActive(true);
                reportActive("invite");
              }}
              onBlur={() => setActive(false)}
              style={styles.text}
              accessibilityLabel={phases.length === 0 ? t.firstPlaceholder : t.nextPlaceholder}
              testID={`${testID}-invite`}
            />
          </View>
    );
  }
}

const styles = StyleSheet.create({
  section: {
    gap: TITLE_TO_LIST,
  },
  // F04 : même titre que « Description du mouvement » (Regular 11 secondaire, Figma `10450:24381`).
  title: {
    ...type.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  // Sans contenant, comme la Description : ni fond, ni contour, ni padding.
  list: {
    gap: ROW_GAP,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: NUMBER_GAP,
  },
  number: {
    ...type.label,
    color: colors.textSecondary,
    minWidth: NUMBER_WIDTH,
    textAlign: "right",
  },
  promptNumber: {
    color: PROMPT_COLOR,
  },
  // PRE-9 A.2b (rendu choisi) : valeur de durée alignée à droite, sur la largeur d'une cellule Durée.
  durationButton: {
    width: DURATION_WIDTH,
    minHeight: DURATION_TOUCH_HEIGHT,
    alignItems: "flex-end",
  },
  duration: {
    ...type.body,
    color: colors.textPrimary,
    textAlign: "right",
  },
  durationPrompt: {
    color: PROMPT_COLOR,
  },
  wheel: {
    alignItems: "center",
    gap: spacing[8],
  },
  clearButton: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[8],
  },
  clearLabel: {
    ...type.body,
    color: colors.primary,
  },
  text: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
