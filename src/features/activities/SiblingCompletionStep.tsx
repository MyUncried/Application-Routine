import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EXECUTION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import type { MovementPhase } from "@/domain/activities/Movement";
import {
  buildSiblingCompletions,
  completionEntriesReady,
  initialCompletionEntries,
  type SiblingCompletion,
  type SiblingCompletionEntry,
  type SiblingGap,
} from "@/domain/activities/sharedCorrection";
import { cellDurationSeconds, composeCellEntry, formatMmss, type CellEntryState } from "@/features/activities/cellEntry";
import { strings } from "@/shared/i18n";
import { UNSELECTED_OPACITY } from "@/shared/ui/opacity";
import { PrimaryActionButton } from "@/shared/ui/PrimaryActionZone";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type SiblingCompletionStepProps = {
  /** Frères dont des durées manquent avec la nouvelle structure (`CorrectionAssessment.siblingGaps`). */
  readonly gaps: readonly SiblingGap[];
  /** Nouvelle structure (identités allouées) : libellés des phases manquantes. */
  readonly phases: readonly MovementPhase[];
  /**
   * Désignation de chaque frère, par identifiant : les frères partagent le nom du geste, le résumé
   * de leurs paramètres les distingue (MFN-10 « aucun alias »).
   */
  readonly siblingLabels: Readonly<Record<string, string>>;
  /** « Terminer » : complétions prêtes (durées saisies, ou `null` pour un frère passé). */
  readonly onFinish: (completions: readonly SiblingCompletion[]) => void;
  /** « Annuler » (et retour système) : retour au brouillon appelant, sans écriture. */
  readonly onCancel: () => void;
};

const t = strings.screens.activities.editor.siblingCompletion;
const durationTargetLabel = strings.executionParameters.sheet.durationTarget;

/**
 * PRE-7 story A2.2 (MFN-08 « Étape d'écran après choix de correction structurelle », MFN/AC23,
 * MFN/AC24 ; CE-T03-04 §11 et §14) — étape DISTINCTE de la question d'identité : pour chaque
 * Exercice frère concerné, ses durées manquantes sont présentées, visibles et modifiables, toutes
 * vides au départ (aucune valeur inventée). « Passer » laisse ce frère incomplet (complétion
 * explicitement passée) ; « Terminer » n'est disponible que lorsque chaque frère est renseigné ou
 * passé. L'Exercice édité, lui, est déjà complet (validation de l'éditeur).
 *
 * Aucune frame Figma : `NON VÉRIFIABLE` (ch. 13 §11). Composée de primitives natives (`Modal`
 * présentée en feuille de page sur iOS, `TextInput` au clavier numérique) et de la saisie
 * « MM:SS » des cellules de la Feuille (`cellEntry.ts`, D-434), sans composant graphique nouveau.
 */
export function SiblingCompletionStep({ gaps, phases, siblingLabels, onFinish, onCancel }: SiblingCompletionStepProps) {
  const [entries, setEntries] = useState<readonly SiblingCompletionEntry[]>(() => initialCompletionEntries(gaps));
  const ready = completionEntriesReady(gaps, entries);

  function update(definitionId: string, change: (entry: SiblingCompletionEntry) => SiblingCompletionEntry) {
    setEntries((current) => current.map((entry) => (entry.definitionId === definitionId ? change(entry) : entry)));
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]} testID="sibling-completion-step">
        <View style={styles.header}>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={t.cancel}
            style={styles.headerAction}
            testID="sibling-completion-cancel"
          >
            <Text style={styles.cancelLabel}>{t.cancel}</Text>
          </Pressable>
        </View>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title} accessibilityRole="header">
              {t.title}
            </Text>
            {gaps.map((gap) => {
              const entry = entries.find((candidate) => candidate.definitionId === gap.definitionId);
              if (!entry) return null;
              return (
                <View key={gap.definitionId} style={styles.sibling} testID={`sibling-completion-${gap.definitionId}`}>
                  <Text style={styles.siblingLabel}>{siblingLabels[gap.definitionId] ?? ""}</Text>
                  {gap.missingPhaseIds.map((phaseId) => {
                    const label = phases.find((phase) => phase.id === phaseId)?.label ?? String(phaseId);
                    return (
                      <DurationRow
                        key={phaseId}
                        label={label}
                        disabled={entry.skipped}
                        onValue={(seconds) =>
                          update(gap.definitionId, (current) => ({
                            ...current,
                            phaseDurations: current.phaseDurations.map((item) =>
                              item.phaseId === phaseId ? { ...item, durationSeconds: seconds } : item,
                            ),
                          }))
                        }
                        testID={`sibling-completion-${gap.definitionId}-phase-${phaseId}`}
                      />
                    );
                  })}
                  {gap.missingSeriesDuration ? (
                    <DurationRow
                      label={durationTargetLabel}
                      disabled={entry.skipped}
                      onValue={(seconds) => update(gap.definitionId, (current) => ({ ...current, seriesDurationSeconds: seconds }))}
                      testID={`sibling-completion-${gap.definitionId}-series`}
                    />
                  ) : null}
                  <View style={styles.skipRow}>
                    {entry.skipped ? (
                      <Text style={styles.skippedText} testID={`sibling-completion-${gap.definitionId}-skipped`}>
                        {strings.executionParameters.card.incomplete}
                      </Text>
                    ) : (
                      <View />
                    )}
                    <View style={styles.skipControl}>
                      <Text style={styles.skipLabel} accessible={false}>
                        {t.skip}
                      </Text>
                      {/* Revue A2.2 : interrupteur natif (primitive de la plate-forme), annoncé « Passer ». */}
                      <Switch
                        value={entry.skipped}
                        onValueChange={(skipped) => update(gap.definitionId, (current) => ({ ...current, skipped }))}
                        accessibilityLabel={t.skip}
                        trackColor={{ true: colors.primary, false: colors.divider }}
                        testID={`sibling-completion-${gap.definitionId}-skip`}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryActionButton
              label={t.finish}
              disabled={!ready}
              onPress={() => {
                if (!completionEntriesReady(gaps, entries)) return;
                onFinish(buildSiblingCompletions(gaps, entries));
              }}
              testID="sibling-completion-finish"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Revue A2.2 : valeur transmise d'une saisie « MMSS » — secondes reportées (`01:75` → 135, comme
 * les cellules), mais JAMAIS ramenées dans les bornes : « 00:00 » ou une durée au-delà de la Cible
 * Durée maximale restent à renseigner (`null`, `Terminer` indisponible) au lieu d'enregistrer en
 * silence une autre valeur que celle affichée.
 */
export function durationEntryValue(digits: string): number | null {
  const seconds = cellDurationSeconds(digits, { min: 0, max: Number.MAX_SAFE_INTEGER });
  if (seconds === null) return null;
  const { min, max } = EXECUTION_BOUNDS.durationTarget;
  return seconds >= min && seconds <= max ? seconds : null;
}

/**
 * Durée manquante : champ au clavier numérique natif, saisie « MM:SS » (`composeCellEntry`,
 * D-434) ; vide = « — » (à renseigner).
 */
function DurationRow({
  label,
  disabled,
  onValue,
  testID,
}: {
  label: string;
  disabled: boolean;
  onValue: (seconds: number | null) => void;
  testID: string;
}) {
  const [entry, setEntry] = useState<CellEntryState>({ text: "", fresh: true });
  const shown = entry.text === "" ? "" : formatMmss(entry.text);
  // Revue A2.2 : un frère passé n'affiche aucune durée (rien n'est transmis pour lui) ; la saisie
  // reste en mémoire et réapparaît si le passage est retiré.
  const displayed = disabled ? "" : shown;
  return (
    <View style={styles.durationRow}>
      <Text style={styles.durationLabel} numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        value={displayed}
        placeholder={t.unset}
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        editable={!disabled}
        onChangeText={(next) => {
          const composed = composeCellEntry("duration", entry, shown, next);
          setEntry(composed);
          onValue(durationEntryValue(composed.text));
        }}
        accessibilityLabel={t.durationAccessibilityLabel.replace("{label}", () => label)}
        accessibilityState={{ disabled }}
        style={[styles.durationInput, disabled ? styles.durationInputDisabled : null]}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing[16],
    minHeight: minTouchTarget,
    alignItems: "center",
  },
  headerAction: {
    minHeight: minTouchTarget,
    justifyContent: "center",
  },
  cancelLabel: {
    ...type.button,
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[24],
    gap: spacing[16],
  },
  title: {
    ...type.screenTitle,
    color: colors.textPrimary,
  },
  sibling: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: fixedRadii[12],
    padding: spacing[16],
    gap: spacing[8],
  },
  siblingLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
    minHeight: minTouchTarget,
  },
  durationLabel: {
    ...type.body,
    color: colors.textPrimary,
    flex: 1,
  },
  durationInput: {
    ...type.body,
    color: colors.textPrimary,
    minWidth: 88,
    minHeight: minTouchTarget,
    textAlign: "right",
    paddingHorizontal: spacing[12],
    borderRadius: fixedRadii[8],
    backgroundColor: colors.surface,
  },
  durationInputDisabled: {
    opacity: UNSELECTED_OPACITY,
  },
  skipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[12],
  },
  skippedText: {
    ...type.body,
    color: colors.textSecondary,
    flex: 1,
  },
  skipControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    minHeight: minTouchTarget,
  },
  skipLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
  },
});
