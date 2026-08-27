import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { FIXED_TOUR_REPEAT_COUNT } from "@/domain/sessions/defaults";
import { isSessionDraftDirty } from "@/domain/sessions/SessionDraft";
import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { ColorPalette } from "@/features/sessions/ColorPalette";
import {
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { colors, spacing, type } from "@/shared/ui/tokens";

type OverlayKind = "color" | "countdown" | "finalPhase";

/**
 * Écran `Composition d'une séance` (T01-S07, docs §06 Écran 3).
 *
 * Le brouillon vient de `SessionDraftProvider` (monté par
 * `app/(creation)/_layout.tsx`, au-dessus de cet écran) — cette route ne
 * connaît ni SQLite ni `SessionService` : aucun enregistrement n'a lieu
 * avant T01-S09.
 *
 * Un seul sélecteur intégré ouvert à la fois (couleur, Compte à rebours,
 * Fin de séance) — état `openOverlay` unique (plan §5). Toucher en dehors
 * d'un contrôle interactif ferme le sélecteur ouvert : l'écran entier est
 * enveloppé dans un `Pressable` qui ne reçoit le toucher que si aucun
 * contrôle imbriqué (ligne, roulette, palette) ne l'a déjà capté.
 *
 * `+ Ajouter une activité` (T01-S08) navigue vers l'écran Exercice
 * (`/exercise`) ; celui-ci lit lui-même `draft.exercise` pour déterminer
 * s'il s'agit d'un ajout ou d'une modification — aucun paramètre de route
 * n'est nécessaire. Le modèle `SessionDraft.exercise` restant un unique
 * champ nullable (pas un tableau, hors périmètre T01), le bouton d'ajout
 * est masqué dès qu'un Exercice existe : une ligne récapitulative le
 * remplace, pressable pour rouvrir l'écran en modification.
 */
export function CompositionScreen() {
  const router = useRouter();
  const { draft, updateDraft, resetDraft } = useSessionDraft();
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);

  const shouldBlockExit = isSessionDraftDirty(draft);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    resetDraft,
  );

  const closeOverlay = useCallback(() => setOpenOverlay(null), []);

  const toggleOverlay = useCallback((kind: OverlayKind) => {
    Keyboard.dismiss();
    setOpenOverlay((current) => (current === kind ? null : kind));
  }, []);

  const composition = strings.screens.composition;

  return (
    <Pressable style={styles.container} onPress={closeOverlay} accessible={false}>
      <View style={styles.header}>
        <TextInput
          value={draft.name}
          onChangeText={(text) => updateDraft({ name: text })}
          onFocus={closeOverlay}
          placeholder={composition.name}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={composition.name}
          maxLength={NAME_MAX_LENGTH}
          style={styles.nameInput}
        />
        <ColorPalette
          value={draft.color}
          onChange={(color) => {
            updateDraft({ color });
            closeOverlay();
          }}
          isOpen={openOverlay === "color"}
          onToggle={() => toggleOverlay("color")}
        />
      </View>

      <DurationRow
        label={composition.countdown.label}
        value={formatDurationRowValue(draft.initialCountdownSeconds)}
        onPress={() => toggleOverlay("countdown")}
      />
      {openOverlay === "countdown" ? (
        <DurationWheelPicker
          totalSeconds={draft.initialCountdownSeconds}
          onChange={(totalSeconds) => updateDraft({ initialCountdownSeconds: totalSeconds })}
          minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
          secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
        />
      ) : null}

      <DurationRow
        label={composition.finalPhase.label}
        value={formatDurationRowValue(draft.finalPhaseSeconds)}
        onPress={() => toggleOverlay("finalPhase")}
      />
      {openOverlay === "finalPhase" ? (
        <DurationWheelPicker
          totalSeconds={draft.finalPhaseSeconds}
          onChange={(totalSeconds) => updateDraft({ finalPhaseSeconds: totalSeconds })}
          minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
          secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
        />
      ) : null}

      <View
        style={styles.tourRow}
        accessibilityRole="button"
        accessibilityLabel={composition.tour.label}
        accessibilityState={{ disabled: true }}
      >
        <Text style={styles.rowLabel}>{composition.tour.label}</Text>
        <Text style={styles.rowValue}>×{FIXED_TOUR_REPEAT_COUNT}</Text>
      </View>

      {draft.exercise === null ? (
        <Pressable
          onPress={() => router.push("/exercise")}
          accessibilityRole="button"
          accessibilityState={{ disabled: false }}
          accessibilityLabel={composition.addActivity}
          style={styles.addActivityAction}
        >
          <Text style={styles.addActivityLabel}>+ {composition.addActivity}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push("/exercise")}
          accessibilityRole="button"
          accessibilityLabel={composition.exerciseRow.editAccessibilityLabel}
          style={styles.exerciseRow}
        >
          <Text style={styles.rowLabel}>{draft.exercise.name}</Text>
          <Text style={styles.exerciseRowSummary}>{formatExerciseRowSummary(draft.exercise)}</Text>
        </Pressable>
      )}

      <Text style={styles.summary}>
        {formatCompositionSummary({
          exercise: draft.exercise,
          initialCountdownSeconds: draft.initialCountdownSeconds,
          finalPhaseSeconds: draft.finalPhaseSeconds,
        })}
      </Text>

      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={composition.continueAction}
        style={styles.continueAction}
      >
        <Text style={styles.continueLabel}>{composition.continueAction}</Text>
      </Pressable>

      {isPendingExit ? <AbandonCreationModal onCancel={cancelExit} onConfirm={confirmExit} /> : null}
    </Pressable>
  );
}

function DurationRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.durationRow}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing[24],
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
  },
  nameInput: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing[8],
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  tourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    opacity: 0.6,
  },
  rowLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  rowValue: {
    ...type.body,
    color: colors.textSecondary,
  },
  addActivityAction: {
    alignSelf: "center",
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addActivityLabel: {
    ...type.button,
    color: colors.primary,
  },
  exerciseRow: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: spacing[4],
  },
  exerciseRowSummary: {
    ...type.supporting,
    color: colors.textSecondary,
  },
  summary: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  continueAction: {
    marginTop: "auto",
    marginBottom: spacing[16],
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.disabled,
  },
  continueLabel: {
    ...type.button,
    color: colors.background,
  },
});
