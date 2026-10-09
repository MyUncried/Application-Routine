import { useEffect, useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  EXECUTION_BOUNDS,
  isBilateral,
  seriesRowsOf,
  type ExecutionMode,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type SideOrder,
} from "@/domain/activities/ExecutionParameters";
import {
  applyRequestedTotal,
  commitSheetDraft,
  effectiveParameters,
  firstIncompleteSeries,
  isRequestedTotalEditable,
  isSingleSeries,
  moveRow,
  openSheetDraft,
  setCadenceBeep,
  setCountdown,
  setEnd,
  setMode,
  setRowPause,
  setRowTarget,
  setSeriesCount,
  setSideMode,
  setSideOrder,
  setSideRecovery,
  setUniformPause,
  setUniformTarget,
  setVariable,
  type ExecutionSheetDraft,
} from "@/domain/activities/ExecutionParametersDraft";
import { computeIntrinsicDuration, totalDurationRange } from "@/domain/activities/executionCalculations";
import { formatPhraseDuration } from "@/domain/activities/executionPhrase";
import type { SideMode } from "@/domain/sessions/sideMode";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import {
  WHEEL_EXERCISE_DURATION_SECONDS_MAX,
  WHEEL_TOTAL_DURATION_SECONDS_MAX,
} from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";
import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  EXECUTION_ACCELERATED_HOLD_POLICY,
  EXECUTION_UNIT_HOLD_POLICY,
  InlineStepper,
} from "@/shared/ui/ProfileStepper";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { TRANSIENT_NOTIFICATION_DURATION_MS } from "@/shared/ui/TransientNotification";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-3 (CE-UI-10, SPECIFICATION-PARAMETRES-MODALE-v13, DSF Séries
 * variables / Bip de cadence) — feuille « Paramètres d'exécution » :
 * sous-brouillon ISOLÉ du parent.
 *
 * - Ouverture : copie des paramètres du parent (`openSheetDraft`).
 * - ✕ / retour système : abandon de toute l'ouverture (`onCancel`).
 * - ✓ : **grisé tant que le mode ou une cible active exigée est invalide**
 *   (v13 §6) ; la cellule concernée est signalée et un message en ligne
 *   nomme la Série à renseigner, même tableau replié. Valide → `onApply`
 *   remplace atomiquement les paramètres du parent, sans écriture SQLite.
 * - Un seul contrôle en place ouvert à la fois (roulette native ou
 *   segmenté), démonté à la fermeture ; en-tête fixe, corps défilant.
 * - Tableau variable rattaché à l'interrupteur dans un groupe : poignée de
 *   glisser, numéro aligné à droite, steppers cible/Pause ; déplacement
 *   aussi offert par actions accessibles (même ordre métier).
 */
export type ExecutionParametersSheetProps = {
  readonly parent: ExecutionParametersInput;
  /** Pause entre les côtés du Profil, copiée à l'ACTIVATION du changement de côté (P3-10). */
  readonly profileSideRecoverySecondsDefault: number;
  readonly onApply: (parameters: ExecutionParameters) => void;
  readonly onCancel: () => void;
};

type InlineControl = "mode" | "uniformDuration" | "sideMode" | "sideOrder" | "total" | null;

const t = strings.executionParameters.sheet;

/** Hauteur de ligne du tableau variable (DSF : 42 à 402). */
export const TABLE_ROW_HEIGHT = 42;
/** Largeurs DSF des steppers à 402 : premier niveau 137, tableau 128. */
const STEPPER_WIDTH = 137;
const TABLE_STEPPER_WIDTH = 128;

/** Destination d'un glisser vertical de `dy` points depuis la ligne `from`, bornée au tableau. */
export function dragDestination(from: number, dy: number, rowHeight: number, count: number): number {
  return Math.min(count - 1, Math.max(0, from + Math.round(dy / rowHeight)));
}

function seriesLabel(count: number | null): string {
  if (count === null) return t.unset;
  return `${count} ${count === 1 ? t.seriesSingular : t.seriesPlural}`;
}

const secondsLabel = (value: number | null) => (value === null ? t.unset : formatPhraseDuration(value));
const pauseLabel = (value: number | null) => (value === null ? t.unset : value === 0 ? "0 s" : formatPhraseDuration(value));
const beepLabel = (value: number | null) => (value === null || value === 0 ? t.beepNone : `${value} s`);
const repetitionsLabel = (value: number | null) => (value === null ? t.unset : `${value} ${t.repetitionsUnit}`);

export function ExecutionParametersSheet({
  parent,
  profileSideRecoverySecondsDefault,
  onApply,
  onCancel,
}: ExecutionParametersSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState<ExecutionSheetDraft>(() => openSheetDraft(parent));
  const [openControl, setOpenControl] = useState<InlineControl>(null);
  const [isTableFolded, setIsTableFolded] = useState(false);
  const [adjustment, setAdjustment] = useState<{ message: string; previous: ExecutionSheetDraft } | null>(null);

  useEffect(() => {
    if (!adjustment) return;
    const timer = setTimeout(() => setAdjustment(null), TRANSIENT_NOTIFICATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [adjustment]);

  const effective = effectiveParameters(draft);
  const effectiveFirst = seriesRowsOf(effective)[0] ?? { target: null, pauseSeconds: 0 };
  const single = isSingleSeries(draft);
  const bilateral = isBilateral(draft.sideMode);
  const showVariableTable = draft.variable && !single;
  const totalEditable = isRequestedTotalEditable(draft);

  const validation = commitSheetDraft(draft);
  const incompleteSeries = validation.ok ? null : firstIncompleteSeries(validation.violations);
  const invalidRows = new Set(
    validation.ok
      ? []
      : validation.violations
          .filter((violation) => violation.field === "target" && violation.seriesNumber)
          .map((violation) => violation.seriesNumber! - 1),
  );
  const uniformTargetInvalid =
    !validation.ok && !showVariableTable && validation.violations.some((violation) => violation.field === "target");
  const message =
    validation.ok || effective.mode === null || effective.mode === "TO_FAILURE"
      ? null
      : showVariableTable && incompleteSeries !== null
        ? t.incompleteSeries[effective.mode].replace("{n}", String(incompleteSeries))
        : uniformTargetInvalid
          ? t.incompleteUniform[effective.mode]
          : null;

  // Total applicable (v13 §6 ligne 8) : Durée, ou Répétitions avec bip ; « — » si incomplet.
  const totalApplicable =
    effective.mode === "DURATION" || (effective.mode === "REPETITIONS" && effective.cadenceBeepIntervalSeconds > 0);
  const duration = totalApplicable && validation.ok ? computeIntrinsicDuration(effective) : null;
  const totalText = duration?.seconds !== undefined ? formatPhraseDuration(duration.seconds) : t.unset;

  function update(next: ExecutionSheetDraft) {
    setAdjustment(null);
    setDraft(next);
  }

  function toggle(control: Exclude<InlineControl, null>) {
    setOpenControl((current) => (current === control ? null : control));
  }

  function handleValidate() {
    if (validation.ok) {
      onApply(validation.value);
    }
  }

  function handleTotalValidated(requestedSeconds: number) {
    setOpenControl(null);
    const applied = applyRequestedTotal(draft, requestedSeconds);
    if (!applied) return;
    setDraft(applied.draft);
    setAdjustment(
      applied.inversion.adjusted
        ? { message: t.adjusted.replace("{duration}", formatPhraseDuration(applied.inversion.totalSeconds)), previous: draft }
        : null,
    );
  }

  const targetMax = effective.mode === "REPETITIONS" ? EXECUTION_BOUNDS.repetitionTarget.max : EXECUTION_BOUNDS.durationTarget.max;
  const targetMin = effective.mode === "REPETITIONS" ? EXECUTION_BOUNDS.repetitionTarget.min : EXECUTION_BOUNDS.durationTarget.min;
  const targetLabel = effective.mode === "REPETITIONS" ? repetitionsLabel : secondsLabel;
  const validateLabel = validation.ok
    ? t.validateAccessibilityLabel
    : `${t.validateAccessibilityLabel}, ${t.validateUnavailableSuffix}`;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onCancel} testID="execution-sheet-modal">
      <View style={styles.scrim} testID="execution-sheet-scrim">
        <View
          style={[styles.sheet, { maxHeight: windowHeight - insets.top - spacing[24], paddingBottom: insets.bottom }]}
          accessibilityViewIsModal
          testID="execution-sheet"
        >
          <View style={styles.handle} />
          <View style={styles.header} testID="execution-sheet-header">
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={t.cancelAccessibilityLabel}
              hitSlop={(minTouchTarget - 38) / 2}
              style={styles.cancelCircle}
              testID="execution-sheet-cancel"
            >
              <KodjoIcon name="wheel-action-cancel" />
            </Pressable>
            <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
              {t.title}
            </Text>
            <Pressable
              onPress={handleValidate}
              disabled={!validation.ok}
              accessibilityRole="button"
              accessibilityLabel={validateLabel}
              accessibilityState={{ disabled: !validation.ok }}
              hitSlop={(minTouchTarget - 38) / 2}
              style={[styles.validateCircle, validation.ok ? null : styles.validateCircleDisabled]}
              testID="execution-sheet-validate"
            >
              <KodjoIcon name="wheel-action-validate" />
            </Pressable>
          </View>
          <View style={styles.headerDivider} />

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            testID="execution-sheet-body"
          >
            <View style={styles.group}>
              {/* Mode d'exécution */}
              <Row label={t.mode} selected={openControl === "mode"} testID="execution-sheet-row-mode">
                <ValuePill
                  value={effective.mode === null ? t.unset : t.modes[effective.mode]}
                  accessibilityLabel={`${t.mode}, ${effective.mode === null ? t.unset : t.modes[effective.mode]}`}
                  expanded={openControl === "mode"}
                  onPress={() => toggle("mode")}
                  testID="execution-sheet-mode-value"
                />
              </Row>
              {openControl === "mode" ? (
                <View style={styles.inlineControl}>
                  <SegmentedControl<ExecutionMode>
                    options={[
                      { value: "DURATION", label: t.modes.DURATION },
                      { value: "REPETITIONS", label: t.modes.REPETITIONS },
                      { value: "TO_FAILURE", label: t.modes.TO_FAILURE },
                    ]}
                    value={(draft.mode ?? "DURATION") as ExecutionMode}
                    onChange={(mode) => update(setMode(draft, mode))}
                    accessibilityLabel={t.mode}
                    testID="execution-sheet-mode-control"
                  />
                </View>
              ) : null}
              <Separator />

              {/* Séries */}
              <Row label={t.series} testID="execution-sheet-row-series">
                <InlineStepper
                  value={draft.count}
                  min={EXECUTION_BOUNDS.seriesCount.min}
                  max={EXECUTION_BOUNDS.seriesCount.max}
                  policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                  formatValue={seriesLabel}
                  onChange={(count) => update(setSeriesCount(draft, count))}
                  accessibilityLabel={t.series}
                  width={STEPPER_WIDTH}
                  testID="execution-sheet-series"
                />
              </Row>

              {/* Groupe Séries variables : interrupteur + tableau rattaché (DSF). */}
              <View style={showVariableTable ? styles.variableGroup : null} testID="execution-sheet-variable-group">
                {showVariableTable ? null : <Separator indented />}
                <View style={[styles.indented, single ? styles.withoutEffect : null]}>
                  <View style={styles.row} testID="execution-sheet-row-variable">
                    <Text style={styles.label}>{t.variable}</Text>
                    {showVariableTable ? (
                      <DisclosureControl
                        expanded={!isTableFolded}
                        onPress={() => setIsTableFolded((folded) => !folded)}
                        accessibilityLabel={isTableFolded ? t.showTable : t.hideTable}
                        testID="execution-sheet-table-toggle"
                      />
                    ) : null}
                    <View style={styles.spacer} />
                    <Switch
                      value={draft.variable && !single}
                      disabled={single}
                      onValueChange={(next) => update(setVariable(draft, next))}
                      trackColor={{ false: colors.disabled, true: colors.selection }}
                      accessibilityLabel={single ? `${t.variable}, ${t.disabledSuffix}` : t.variable}
                      testID="execution-sheet-variable-switch"
                    />
                  </View>
                </View>
                {message && showVariableTable ? <InlineMessage text={message} /> : null}
                {showVariableTable && !isTableFolded ? (
                  <VariableTable
                    draft={draft}
                    mode={effective.mode}
                    targetMin={targetMin}
                    targetMax={targetMax}
                    formatTarget={targetLabel}
                    invalidRows={invalidRows}
                    onDraft={update}
                  />
                ) : null}
              </View>

              {!showVariableTable ? (
                <>
                  {effective.mode === "DURATION" ? (
                    <>
                      <Separator indented />
                      <Row
                        label={t.durationTarget}
                        indented
                        selected={openControl === "uniformDuration"}
                        testID="execution-sheet-row-target"
                      >
                        <ValuePill
                          value={secondsLabel(effectiveFirst.target)}
                          accessibilityLabel={`${t.durationTarget}, ${secondsLabel(effectiveFirst.target)}`}
                          expanded={openControl === "uniformDuration"}
                          invalid={uniformTargetInvalid}
                          onPress={() => toggle("uniformDuration")}
                          testID="execution-sheet-target-value"
                        />
                      </Row>
                      {openControl === "uniformDuration" ? (
                        <View style={styles.inlineControl} testID="execution-sheet-target-wheel">
                          <DurationWheelPicker
                            totalSeconds={effectiveFirst.target ?? 0}
                            maxTotalSeconds={WHEEL_EXERCISE_DURATION_SECONDS_MAX}
                            onValidate={(seconds) => {
                              setOpenControl(null);
                              update(setUniformTarget(draft, seconds >= 1 ? seconds : null));
                            }}
                            onCancel={() => setOpenControl(null)}
                            minutesAccessibilityLabel={strings.screens.exercise.wheelPicker.minutesAccessibilityLabel}
                            secondsAccessibilityLabel={strings.screens.exercise.wheelPicker.secondsAccessibilityLabel}
                            cancelAccessibilityLabel={strings.screens.exercise.wheelPicker.cancelAccessibilityLabel}
                            validateAccessibilityLabel={strings.screens.exercise.wheelPicker.validateAccessibilityLabel}
                          />
                        </View>
                      ) : null}
                    </>
                  ) : null}
                  {effective.mode === "REPETITIONS" ? (
                    <>
                      <Separator indented />
                      <Row label={t.repetitionsTarget} indented testID="execution-sheet-row-target">
                        <InlineStepper
                          value={effectiveFirst.target}
                          min={EXECUTION_BOUNDS.repetitionTarget.min}
                          max={EXECUTION_BOUNDS.repetitionTarget.max}
                          policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                          formatValue={repetitionsLabel}
                          onChange={(value) => update(setUniformTarget(draft, value))}
                          accessibilityLabel={t.repetitionsTarget}
                          emptyStart={1}
                          width={STEPPER_WIDTH}
                          invalid={uniformTargetInvalid}
                          testID="execution-sheet-target-stepper"
                        />
                      </Row>
                    </>
                  ) : null}
                  {message ? <InlineMessage text={message} /> : null}
                  <Separator indented />
                  <Row label={t.pause} indented testID="execution-sheet-row-pause">
                    <InlineStepper
                      value={effectiveFirst.pauseSeconds}
                      min={EXECUTION_BOUNDS.pauseSeconds.min}
                      max={EXECUTION_BOUNDS.pauseSeconds.max}
                      policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                      formatValue={pauseLabel}
                      onChange={(value) => update(setUniformPause(draft, value))}
                      accessibilityLabel={`${t.pause}, ${t.secondsUnit}`}
                      width={STEPPER_WIDTH}
                      testID="execution-sheet-pause"
                    />
                  </Row>
                </>
              ) : null}
              <Separator />

              {/* Changement de côté */}
              <Row label={t.sideMode} selected={openControl === "sideMode"} testID="execution-sheet-row-side">
                <ValuePill
                  value={t.sideModes[draft.sideMode ?? "UNILATERAL"]}
                  accessibilityLabel={`${t.sideMode}, ${t.sideModes[draft.sideMode ?? "UNILATERAL"]}`}
                  expanded={openControl === "sideMode"}
                  onPress={() => toggle("sideMode")}
                  testID="execution-sheet-side-value"
                />
              </Row>
              {openControl === "sideMode" ? (
                <View style={styles.inlineControl}>
                  <SegmentedControl<SideMode>
                    options={[
                      { value: "UNILATERAL", label: t.sideModes.UNILATERAL },
                      { value: "RIGHT_LEFT", label: t.sideModes.RIGHT_LEFT },
                      { value: "LEFT_RIGHT", label: t.sideModes.LEFT_RIGHT },
                    ]}
                    value={draft.sideMode ?? "UNILATERAL"}
                    onChange={(side) => update(setSideMode(draft, side, profileSideRecoverySecondsDefault))}
                    accessibilityLabel={t.sideMode}
                    testID="execution-sheet-side-control"
                  />
                </View>
              ) : null}
              {bilateral ? (
                <>
                  <Separator indented />
                  <View style={single ? styles.withoutEffect : null}>
                    <Row label={t.sideOrder} indented selected={openControl === "sideOrder"} testID="execution-sheet-row-order">
                      <ValuePill
                        value={t.sideOrders[effective.sideOrder]}
                        accessibilityLabel={
                          single
                            ? `${t.sideOrder}, ${t.sideOrders[effective.sideOrder]}, ${t.disabledSuffix}`
                            : `${t.sideOrder}, ${t.sideOrders[effective.sideOrder]}`
                        }
                        expanded={openControl === "sideOrder"}
                        disabled={single}
                        onPress={() => toggle("sideOrder")}
                        testID="execution-sheet-order-value"
                      />
                    </Row>
                  </View>
                  {openControl === "sideOrder" && !single ? (
                    <View style={styles.inlineControl}>
                      <SegmentedControl<SideOrder>
                        options={[
                          { value: "BY_SIDE", label: t.sideOrders.BY_SIDE },
                          { value: "BY_SERIES", label: t.sideOrders.BY_SERIES },
                        ]}
                        value={draft.sideOrder}
                        onChange={(order) => update(setSideOrder(draft, order))}
                        accessibilityLabel={t.sideOrder}
                        testID="execution-sheet-order-control"
                      />
                    </View>
                  ) : null}
                  <Separator indented />
                  <Row label={t.sideRecovery} indented longLabel testID="execution-sheet-row-side-recovery">
                    <InlineStepper
                      value={draft.sideRecoverySeconds}
                      min={EXECUTION_BOUNDS.sideRecoverySeconds.min}
                      max={EXECUTION_BOUNDS.sideRecoverySeconds.max}
                      policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                      formatValue={pauseLabel}
                      onChange={(value) => update(setSideRecovery(draft, value))}
                      accessibilityLabel={`${t.sideRecovery}, ${t.secondsUnit}`}
                      width={STEPPER_WIDTH}
                      testID="execution-sheet-side-recovery"
                    />
                  </Row>
                </>
              ) : null}
              <Separator />

              {/* Bip : premier niveau, immédiatement avant le total applicable, sinon avant Compte à rebours. */}
              <Row label={t.beep} testID="execution-sheet-row-beep">
                <InlineStepper
                  value={draft.cadenceBeepIntervalSeconds}
                  min={EXECUTION_BOUNDS.cadenceBeepIntervalSeconds.min}
                  max={EXECUTION_BOUNDS.cadenceBeepIntervalSeconds.max}
                  policy={EXECUTION_UNIT_HOLD_POLICY}
                  formatValue={beepLabel}
                  onChange={(value) => update(setCadenceBeep(draft, value))}
                  accessibilityLabel={`${t.beep}, ${t.secondsUnit}`}
                  width={STEPPER_WIDTH}
                  testID="execution-sheet-beep"
                />
              </Row>

              {totalApplicable ? (
                <>
                  <Separator />
                  <Row
                    label={duration?.kind === "estimated" ? t.totalEstimated : t.total}
                    selected={openControl === "total"}
                    testID="execution-sheet-row-total"
                  >
                    {totalEditable && duration?.seconds !== undefined ? (
                      <ValuePill
                        value={totalText}
                        accessibilityLabel={`${t.totalEditAccessibilityLabel}, ${totalText}`}
                        expanded={openControl === "total"}
                        onPress={() => toggle("total")}
                        testID="execution-sheet-total"
                      />
                    ) : (
                      <Text style={styles.staticValue} testID="execution-sheet-total-text">
                        {totalText}
                      </Text>
                    )}
                  </Row>
                  {openControl === "total" && totalEditable && duration?.seconds !== undefined ? (
                    <View style={styles.inlineControl} testID="execution-sheet-total-wheel">
                      <DurationWheelPicker
                        totalSeconds={Math.min(duration.seconds, WHEEL_TOTAL_DURATION_SECONDS_MAX)}
                        maxTotalSeconds={Math.min(totalDurationRange(effective).max, WHEEL_TOTAL_DURATION_SECONDS_MAX)}
                        onValidate={handleTotalValidated}
                        onCancel={() => setOpenControl(null)}
                        minutesAccessibilityLabel={strings.screens.exercise.wheelPicker.minutesAccessibilityLabel}
                        secondsAccessibilityLabel={strings.screens.exercise.wheelPicker.secondsAccessibilityLabel}
                        cancelAccessibilityLabel={strings.screens.exercise.wheelPicker.cancelAccessibilityLabel}
                        validateAccessibilityLabel={strings.screens.exercise.wheelPicker.validateAccessibilityLabel}
                      />
                    </View>
                  ) : null}
                  {adjustment ? (
                    <View style={styles.adjustment} accessibilityLiveRegion="polite" testID="execution-sheet-adjusted">
                      <Text style={styles.adjustmentText}>{adjustment.message}</Text>
                      <Pressable
                        onPress={() => {
                          const previous = adjustment.previous;
                          setAdjustment(null);
                          setDraft(previous);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={strings.screens.exercise.adjustedTotalDurationUndoAction}
                        hitSlop={8}
                        testID="execution-sheet-adjusted-undo"
                      >
                        <Text style={styles.adjustmentAction}>{strings.screens.exercise.adjustedTotalDurationUndoAction}</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </>
              ) : null}
              <Separator />

              <Row label={t.countdown} testID="execution-sheet-row-countdown">
                <InlineStepper
                  value={draft.countdownSeconds}
                  min={EXECUTION_BOUNDS.countdownSeconds.min}
                  max={EXECUTION_BOUNDS.countdownSeconds.max}
                  policy={EXECUTION_UNIT_HOLD_POLICY}
                  formatValue={pauseLabel}
                  onChange={(value) => update(setCountdown(draft, value))}
                  accessibilityLabel={`${t.countdown}, ${t.secondsUnit}`}
                  width={STEPPER_WIDTH}
                  testID="execution-sheet-countdown"
                />
              </Row>
              <Separator />
              <Row label={t.end} testID="execution-sheet-row-end">
                <InlineStepper
                  value={draft.endSeconds}
                  min={EXECUTION_BOUNDS.endSeconds.min}
                  max={EXECUTION_BOUNDS.endSeconds.max}
                  policy={EXECUTION_UNIT_HOLD_POLICY}
                  formatValue={pauseLabel}
                  onChange={(value) => update(setEnd(draft, value))}
                  accessibilityLabel={`${t.end}, ${t.secondsUnit}`}
                  width={STEPPER_WIDTH}
                  testID="execution-sheet-end"
                />
              </Row>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function VariableTable({
  draft,
  mode,
  targetMin,
  targetMax,
  formatTarget,
  invalidRows,
  onDraft,
}: {
  draft: ExecutionSheetDraft;
  mode: ExecutionMode | null;
  targetMin: number;
  targetMax: number;
  formatTarget: (value: number | null) => string;
  invalidRows: ReadonlySet<number>;
  onDraft: (next: ExecutionSheetDraft) => void;
}) {
  const rows = draft.rows;
  const hasTarget = mode === "DURATION" || mode === "REPETITIONS";
  return (
    <View style={styles.table} testID="execution-sheet-table">
      <View style={styles.tableHeader}>
        <View style={styles.rowNumberColumn} />
        {hasTarget ? <Text style={styles.columnHeader}>{t.columns[mode]}</Text> : <View style={styles.flex} />}
        <Text style={styles.columnHeader}>{t.columns.pause}</Text>
      </View>
      {rows.map((row, index) => (
        <DraggableRow
          key={draft.rowIds[index] ?? index}
          index={index}
          count={rows.length}
          onMove={(to) => onDraft(moveRow(draft, index, to))}
        >
          {hasTarget ? (
            <InlineStepper
              value={row.target}
              min={targetMin}
              max={targetMax}
              policy={EXECUTION_ACCELERATED_HOLD_POLICY}
              formatValue={formatTarget}
              onChange={(value) => onDraft(setRowTarget(draft, index, value))}
              accessibilityLabel={t.rowTarget.replace("{n}", String(index + 1)).replace("{field}", t.columns[mode])}
              emptyStart={mode === "DURATION" ? 30 : 1}
              width={TABLE_STEPPER_WIDTH}
              invalid={invalidRows.has(index)}
              testID={`execution-sheet-table-row-${index + 1}-target`}
            />
          ) : (
            <View style={styles.flex} />
          )}
          <InlineStepper
            value={row.pauseSeconds}
            min={EXECUTION_BOUNDS.pauseSeconds.min}
            max={EXECUTION_BOUNDS.pauseSeconds.max}
            policy={EXECUTION_ACCELERATED_HOLD_POLICY}
            formatValue={pauseLabel}
            onChange={(value) => onDraft(setRowPause(draft, index, value))}
            accessibilityLabel={t.rowPause.replace("{n}", String(index + 1))}
            width={TABLE_STEPPER_WIDTH}
            testID={`execution-sheet-table-row-${index + 1}-pause`}
          />
        </DraggableRow>
      ))}
    </View>
  );
}

/**
 * Ligne du tableau : poignée de glisser (geste vertical, destination bornée)
 * + numéro aligné à droite. La poignée expose aussi les actions accessibles
 * Monter / Descendre, qui produisent exactement le même déplacement métier.
 */
function DraggableRow({
  index,
  count,
  onMove,
  children,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  children: ReactNode;
}) {
  const number = index + 1;
  // Même mécanique que la Composition : responder natif + état de translation, sans bibliothèque.
  const [drag, setDrag] = useState<{ readonly startY: number; readonly dy: number } | null>(null);
  const actions = [
    ...(index > 0 ? [{ name: "moveUp", label: t.moveUp.replace("{n}", String(number)) }] : []),
    ...(index < count - 1 ? [{ name: "moveDown", label: t.moveDown.replace("{n}", String(number)) }] : []),
  ];
  return (
    <View
      style={[styles.tableRow, drag ? { transform: [{ translateY: drag.dy }] } : null]}
      testID={`execution-sheet-table-row-${number}`}
    >
      <View style={styles.rowNumberColumn}>
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(event) => setDrag({ startY: event.nativeEvent.pageY, dy: 0 })}
          onResponderMove={(event) =>
            setDrag((current) => (current ? { ...current, dy: event.nativeEvent.pageY - current.startY } : current))
          }
          onResponderRelease={(event) => {
            const dy = drag ? event.nativeEvent.pageY - drag.startY : 0;
            setDrag(null);
            const to = dragDestination(index, dy, TABLE_ROW_HEIGHT, count);
            if (to !== index) onMove(to);
          }}
          onResponderTerminate={() => setDrag(null)}
          accessible
          accessibilityLabel={t.moveHandle.replace("{n}", String(number))}
          accessibilityActions={actions}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "moveUp") onMove(index - 1);
            if (event.nativeEvent.actionName === "moveDown") onMove(index + 1);
          }}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={styles.dragHandle}
          testID={`execution-sheet-table-row-${number}-handle`}
        >
          {[0, 1, 2].map((line) => (
            <View key={line} style={styles.dragDotsLine}>
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
            </View>
          ))}
        </View>
        <Text style={styles.rowNumber} accessibilityLabel={t.row.replace("{n}", String(number))}>
          {number}
        </Text>
      </View>
      {children}
    </View>
  );
}

function InlineMessage({ text }: { text: string }) {
  return (
    <Text style={styles.inlineMessage} accessibilityLiveRegion="polite" testID="execution-sheet-message">
      {text}
    </Text>
  );
}

function Row({
  label,
  indented = false,
  selected = false,
  longLabel = false,
  children,
  testID,
}: {
  label: string;
  indented?: boolean;
  selected?: boolean;
  longLabel?: boolean;
  children: ReactNode;
  testID: string;
}) {
  return (
    <View style={[styles.row, indented ? styles.indented : null, selected ? styles.rowSelected : null]} testID={testID}>
      <Text style={[styles.label, longLabel ? styles.longLabel : null]}>{label}</Text>
      {children}
    </View>
  );
}

function ValuePill({
  value,
  accessibilityLabel,
  expanded,
  disabled = false,
  invalid = false,
  onPress,
  testID,
}: {
  value: string;
  accessibilityLabel: string;
  expanded: boolean;
  disabled?: boolean;
  invalid?: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={invalid ? t.invalidHint : undefined}
      accessibilityState={{ expanded, disabled }}
      hitSlop={{ top: 10, bottom: 10 }}
      style={[styles.valuePill, invalid ? styles.valuePillInvalid : null]}
      testID={testID}
    >
      <Text style={[styles.valuePillText, disabled ? styles.valuePillTextDisabled : null]} testID={`${testID}-text`}>
        {value}
      </Text>
    </Pressable>
  );
}

function Separator({ indented = false }: { indented?: boolean }) {
  return <View style={[styles.separator, indented ? styles.separatorIndented : null]} />;
}

/**
 * Géométrie de référence (402) : groupe à x24 (354), lignes de premier niveau
 * à x36 (séparateur 330), lignes indentées à x52 (séparateur 314) — traduites
 * en marges relatives pour 360/440.
 */
const GROUP_PADDING = 12;
const INDENT = 16;

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlayScrim,
  },
  // DSF : feuille blanche ancrée en bas, coins supérieurs 24, rognage.
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: fixedRadii[24],
    borderTopRightRadius: fixedRadii[24],
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 50,
    height: 4,
    borderRadius: 2,
    marginTop: spacing[8],
    backgroundColor: colors.disabled,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: spacing[12] + 5,
  },
  title: {
    ...type.modalTitle,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: "center",
  },
  cancelCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionCancelBackground,
  },
  validateCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.wheelActionValidateBackground,
  },
  validateCircleDisabled: {
    backgroundColor: colors.disabled,
  },
  headerDivider: {
    height: 1,
    marginHorizontal: spacing[12],
    backgroundColor: colors.divider,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[12],
    paddingBottom: spacing[24],
    gap: spacing[8],
  },
  group: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: fixedRadii[12],
    paddingHorizontal: GROUP_PADDING,
    paddingVertical: spacing[4],
  },
  // DSF Séries variables : fond et contour rattachent l'interrupteur au tableau.
  variableGroup: {
    marginHorizontal: -GROUP_PADDING,
    paddingHorizontal: GROUP_PADDING,
    borderRadius: fixedRadii[12],
    borderWidth: 1.5,
    borderColor: colors.selection,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
    gap: spacing[8],
  },
  // DSF : ligne sélectionnée (roulette ou segmenté) bord 2 primary, rayon 12.
  rowSelected: {
    backgroundColor: colors.stepperSurface,
    borderRadius: fixedRadii[12],
    borderWidth: 2,
    borderColor: colors.primary,
    marginHorizontal: -GROUP_PADDING,
    paddingHorizontal: GROUP_PADDING - 2,
  },
  indented: {
    marginLeft: INDENT,
  },
  withoutEffect: {
    opacity: 0.45,
  },
  label: {
    ...type.label,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  // DSF : « Pause entre les côtés » sur deux lignes, largeur 180 à 402.
  longLabel: {
    maxWidth: 180,
  },
  spacer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  valuePill: {
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
  },
  valuePillInvalid: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  valuePillText: {
    ...type.editableValue,
    color: colors.primary,
  },
  valuePillTextDisabled: {
    color: colors.disabled,
  },
  staticValue: {
    ...type.body,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  separatorIndented: {
    marginLeft: INDENT,
  },
  inlineControl: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },
  inlineMessage: {
    ...type.body,
    color: colors.danger,
    marginLeft: INDENT,
    paddingVertical: spacing[4],
  },
  // DSF : message temporaire sous la ligne concernée, à 4 pt ; fond snackbar, rayon 16.
  adjustment: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
    backgroundColor: colors.snackbar,
    borderRadius: fixedRadii[16],
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[16],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
  },
  adjustmentText: {
    ...type.body,
    color: colors.background,
    flex: 1,
  },
  adjustmentAction: {
    ...type.button,
    color: colors.background,
  },
  table: {
    marginLeft: INDENT,
    paddingBottom: spacing[8],
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    paddingVertical: spacing[4],
  },
  columnHeader: {
    ...type.supporting,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    color: colors.textSecondary,
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: TABLE_ROW_HEIGHT,
    gap: spacing[4],
  },
  rowNumberColumn: {
    width: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  dragHandle: {
    width: 12,
    height: 18,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  dragDotsLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textSecondary,
  },
  rowNumber: {
    ...type.label,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "right",
  },
});
