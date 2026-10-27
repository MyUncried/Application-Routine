import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  addMovementPhase,
  moveMovementPhase,
  removeMovementPhase,
  renameMovementPhase,
  type MovementPhaseList,
} from "@/domain/activities/movementPhaseList";
import { DraggableRow, InsertionGuide, RemoveRowButton, type DraggableRowLabels } from "@/features/activities/sheetTable";
import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (story B.2, CE-MVT-01 §7 et §12, Figma « DSF / Formulaires / Phases du mouvement »
 * `10450:24397`) — bloc « Phases du mouvement (pour minuter l'exécution) » de la fiche :
 * structure et libellés seulement, JAMAIS de durée (paramètres locaux des Exercices, MVT-09).
 *
 * Une ligne par phase (numéro, libellé au clavier texte, croix de retrait), puis une ligne
 * d'invite : « Nommez la première phase » à vide, « Phase suivante » ensuite, affichée comme
 * l'invite de la Description (seulement quand le bloc est en saisie, au-delà de la première).
 * Saisir dans l'invite crée la phase (compteur monotone, `movementPhaseList.ts`). L'ordre se
 * modifie par la poignée de glisser ou les actions accessibles Monter / Descendre des briques
 * partagées (`sheetTable.tsx`), sans copie. En lecture seule : libellés seuls, sans poignée,
 * croix ni invite. Aucune exigence de phase : un Mouvement peut n'en avoir aucune.
 */

const t = strings.screens.movement.phases;

const ROW_LABELS: DraggableRowLabels = {
  handle: t.moveHandle,
  row: t.row,
  moveUp: t.moveUp,
  moveDown: t.moveDown,
};

export type MovementPhasesEditorProps = {
  readonly value: MovementPhaseList;
  readonly onChange: (next: MovementPhaseList) => void;
  readonly editable: boolean;
  readonly testID?: string;
};

export function MovementPhasesEditor({ value, onChange, editable, testID = "movement-phases" }: MovementPhasesEditorProps) {
  const [active, setActive] = useState(false);
  const [drag, setDrag] = useState<{ readonly from: number; readonly to: number } | null>(null);
  // Une saisie dans l'invite crée la phase et y déplace le focus, curseur après le texte : la
  // suite de la frappe complète CETTE phase (jamais une phase par caractère).
  const inputs = useRef(new Map<number, TextInput>());
  const pendingFocus = useRef<number | null>(null);
  useEffect(() => {
    if (pendingFocus.current === null) return;
    inputs.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  }, [value.phases]);
  const phases = value.phases;
  const showInvite = editable && (phases.length === 0 || active);

  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.title} accessibilityRole="header" testID={`${testID}-title`}>
        {t.title}
      </Text>
      <View style={styles.block}>
        {phases.map((phase, index) => {
          const content = (
            <View style={styles.row}>
              <Text style={styles.number}>{`${index + 1}.`}</Text>
              {editable ? (
                <TextInput
                  ref={(node) => {
                    if (node) inputs.current.set(phase.id, node);
                    else inputs.current.delete(phase.id);
                  }}
                  value={phase.label}
                  onChangeText={(label) => onChange(renameMovementPhase(value, phase.id, label))}
                  onFocus={() => setActive(true)}
                  onBlur={() => setActive(false)}
                  style={styles.input}
                  accessibilityLabel={t.labelAccessibility.replace("{rank}", String(index + 1))}
                  testID={`${testID}-label-${index + 1}`}
                />
              ) : (
                <Text style={styles.readonlyLabel} testID={`${testID}-label-${index + 1}`}>
                  {phase.label}
                </Text>
              )}
              {editable ? (
                <RemoveRowButton
                  accessibilityLabel={t.remove.replace("{rank}", String(index + 1))}
                  closesFieldHint=""
                  disabled={false}
                  active={false}
                  onPress={() => onChange(removeMovementPhase(value, phase.id))}
                  testID={`${testID}-remove-${index + 1}`}
                />
              ) : null}
            </View>
          );
          return (
            <View key={phase.id}>
              {drag !== null && drag.to === index && drag.from !== index ? <InsertionGuide testID={`${testID}-insertion`} /> : null}
              <DraggableRow
                index={index}
                count={phases.length}
                onMove={(to) => onChange(moveMovementPhase(value, phase.id, to))}
                onDrag={setDrag}
                labels={ROW_LABELS}
                testIDPrefix={`${testID}-row`}
                movable={editable && phases.length > 1}
              >
                {content}
              </DraggableRow>
            </View>
          );
        })}
        {showInvite ? (
          <View style={styles.row}>
            <Text style={styles.number}>{`${phases.length + 1}.`}</Text>
            <TextInput
              value=""
              placeholder={phases.length === 0 ? t.firstPlaceholder : t.nextPlaceholder}
              placeholderTextColor={colors.textSecondary}
              onChangeText={(label) => {
                if (label.length === 0) return;
                pendingFocus.current = value.nextPhaseId;
                onChange(addMovementPhase(value, label));
              }}
              onFocus={() => setActive(true)}
              onBlur={() => setActive(false)}
              style={styles.input}
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
    gap: spacing[8],
  },
  title: {
    ...type.sectionTitle,
    color: colors.textPrimary,
  },
  block: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing[4],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
    gap: spacing[8],
    paddingHorizontal: spacing[16],
  },
  number: {
    ...type.body,
    color: colors.textSecondary,
    minWidth: 18,
  },
  input: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
  readonlyLabel: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 6,
  },
});
