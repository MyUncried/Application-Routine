import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View, type AccessibilityActionEvent } from "react-native";

import { WORK_PHASE_LIMITS } from "@/domain/activities/ExecutionParameters";
import {
  addMovementPhase,
  moveMovementPhase,
  removeMovementPhase,
  renameMovementPhase,
  type MovementPhaseList,
} from "@/domain/activities/movementPhaseList";
import { codePointLength } from "@/domain/sessions/validation";
import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

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

/** Libellé admis (F06) : au plus `WORK_PHASE_LIMITS.labelMaxLength` points de code. */
export function isPhaseLabelWithinLimit(label: string): boolean {
  return codePointLength(label) <= WORK_PHASE_LIMITS.labelMaxLength;
}

export type MovementPhasesEditorProps = {
  readonly value: MovementPhaseList;
  readonly onChange: (next: MovementPhaseList) => void;
  readonly editable: boolean;
  readonly testID?: string;
};

export function MovementPhasesEditor({ value, onChange, editable, testID = "movement-phases" }: MovementPhasesEditorProps) {
  const [active, setActive] = useState(false);
  // Une saisie dans l'invite crée la phase et y déplace le focus : la suite de la frappe complète
  // CETTE phase (jamais une phase par caractère). Clé `"invite"` : la ligne d'invite.
  const inputs = useRef(new Map<number | "invite", TextInput>());
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    inputs.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  });
  const phases = value.phases;
  const showInvite = editable && (phases.length === 0 || active);

  function removeAt(index: number) {
    const phase = phases[index];
    if (!phase) return;
    const previous = phases[index - 1];
    pendingFocus.current = previous ? previous.id : null;
    onChange(removeMovementPhase(value, phase.id));
  }

  function onAccessibilityAction(index: number, event: AccessibilityActionEvent) {
    const phase = phases[index];
    if (!phase) return;
    if (event.nativeEvent.actionName === "moveUp") onChange(moveMovementPhase(value, phase.id, index - 1));
    else if (event.nativeEvent.actionName === "moveDown") onChange(moveMovementPhase(value, phase.id, index + 1));
    else if (event.nativeEvent.actionName === "remove") removeAt(index);
  }

  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.title} accessibilityRole="header" testID={`${testID}-title`}>
        {t.title}
      </Text>
      <View style={styles.list}>
        {phases.map((phase, index) => {
          const rank = String(index + 1);
          const actions = [
            ...(index > 0 ? [{ name: "moveUp", label: t.moveUp }] : []),
            ...(index < phases.length - 1 ? [{ name: "moveDown", label: t.moveDown }] : []),
            { name: "remove", label: t.remove.replace("{rank}", rank) },
          ];
          return (
            <View key={phase.id} style={styles.row} testID={`${testID}-row-${rank}`}>
              <Text style={styles.number} accessible={false} importantForAccessibility="no-hide-descendants">
                {`${rank}.`}
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
                  // Entrée : la ligne d'invite (rendue tant que le bloc est en saisie) prend le focus.
                  onSubmitEditing={() => inputs.current.get("invite")?.focus()}
                  submitBehavior="submit"
                  returnKeyType="next"
                  onFocus={() => setActive(true)}
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
            </View>
          );
        })}
        {showInvite ? (
          <View style={styles.row} testID={`${testID}-invite-row`}>
            <Text style={[styles.number, styles.promptNumber]} accessible={false} importantForAccessibility="no-hide-descendants">
              {`${phases.length + 1}.`}
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
                onChange(addMovementPhase(value, label));
              }}
              onKeyPress={(event) => {
                const last = phases[phases.length - 1];
                if (event.nativeEvent.key === "Backspace" && last) inputs.current.get(last.id)?.focus();
              }}
              onFocus={() => setActive(true)}
              onBlur={() => setActive(false)}
              style={styles.text}
              accessibilityLabel={phases.length === 0 ? t.firstPlaceholder : t.nextPlaceholder}
              testID={`${testID}-invite`}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
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
  text: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    padding: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
});
