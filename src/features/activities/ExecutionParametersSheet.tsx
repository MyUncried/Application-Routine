import { useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
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
import {
  computeIntrinsicDuration,
  isTotalDurationInvertible,
  totalDurationRange,
} from "@/domain/activities/executionCalculations";
import { formatPhraseDuration } from "@/domain/activities/executionPhrase";
import type { SideMode } from "@/domain/sessions/sideMode";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import {
  WHEEL_EXERCISE_DURATION_SECONDS_MAX,
  WHEEL_TOTAL_DURATION_SECONDS_MAX,
} from "@/features/sessions/wheelPickerMath";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import {
  EXECUTION_ACCELERATED_HOLD_POLICY,
  EXECUTION_UNIT_HOLD_POLICY,
  InlineStepper,
} from "@/shared/ui/ProfileStepper";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-3 (CE-UI-10, SPECIFICATION-PARAMETRES-MODALE-v13) — feuille
 * « Paramètres d'exécution » : sous-brouillon ISOLÉ du parent.
 *
 * - Ouverture : copie des paramètres du parent (`openSheetDraft`).
 * - ✕ / retour système : abandon de toute l'ouverture (`onCancel`), parent
 *   inchangé, réserves temporaires détruites avec le composant.
 * - ✓ : validation de l'état EFFECTIF (`commitSheetDraft`) ; succès →
 *   `onApply` remplace atomiquement les paramètres du parent, SANS aucune
 *   écriture SQLite ni appel de service ; échec → message nommant la Série,
 *   tableau redéployé pour rendre la correction atteignable.
 * - Un seul contrôle en place ouvert à la fois (roulette native ou
 *   segmenté), démonté à la fermeture ; en-tête fixe, corps défilant.
 * - Steppers en place : politique PRE-3 (accélération 1/5/10, Bip / Compte
 *   à rebours / Fin au pas 1), sans écriture.
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
  const [message, setMessage] = useState<string | null>(null);
  const [adjustment, setAdjustment] = useState<{ message: string; previousCount: number } | null>(null);

  const effective = effectiveParameters(draft);
  const single = isSingleSeries(draft);
  const bilateral = isBilateral(draft.sideMode);
  const duration = effective.mode === null ? null : computeIntrinsicDuration(effective);
  const invertible = isTotalDurationInvertible(effective);

  function update(next: ExecutionSheetDraft) {
    setMessage(null);
    setAdjustment(null);
    setDraft(next);
  }

  function toggle(control: Exclude<InlineControl, null>) {
    setOpenControl((current) => (current === control ? null : control));
  }

  function handleValidate() {
    const result = commitSheetDraft(draft);
    if (result.ok) {
      onApply(result.value);
      return;
    }
    const series = firstIncompleteSeries(result.violations);
    const text =
      effective.mode === null
        ? t.incompleteMode
        : series !== null && effective.mode !== "TO_FAILURE"
          ? t.incompleteSeries[effective.mode].replace("{n}", String(series))
          : t.incompleteMode;
    // Le repli ne masque jamais une correction : le tableau est redéployé.
    setIsTableFolded(false);
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
  }

  function handleTotalValidated(requestedSeconds: number) {
    setOpenControl(null);
    const previousCount = draft.count;
    const applied = applyRequestedTotal(draft, requestedSeconds);
    if (!applied) return;
    setMessage(null);
    setDraft(applied.draft);
    setAdjustment(
      applied.inversion.adjusted
        ? { message: t.adjusted.replace("{duration}", formatPhraseDuration(applied.inversion.totalSeconds)), previousCount }
        : null,
    );
  }

  const targetMax = effective.mode === "REPETITIONS" ? EXECUTION_BOUNDS.repetitionTarget.max : EXECUTION_BOUNDS.durationTarget.max;
  const targetMin = effective.mode === "REPETITIONS" ? EXECUTION_BOUNDS.repetitionTarget.min : EXECUTION_BOUNDS.durationTarget.min;
  const targetLabel = effective.mode === "REPETITIONS" ? repetitionsLabel : secondsLabel;
  const showVariableTable = draft.variable && !single;

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
              accessibilityRole="button"
              accessibilityLabel={t.validateAccessibilityLabel}
              hitSlop={(minTouchTarget - 38) / 2}
              style={styles.validateCircle}
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
            {message ? (
              <Text style={styles.errorMessage} accessibilityLiveRegion="polite" testID="execution-sheet-message">
                {message}
              </Text>
            ) : null}

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
                  testID="execution-sheet-series"
                />
              </Row>
              <Separator indented />
              <View style={[styles.indented, single ? styles.withoutEffect : null]}>
                <View style={styles.row} testID="execution-sheet-row-variable">
                  <Text style={styles.label}>{t.variable}</Text>
                  {showVariableTable ? (
                    <Pressable
                      onPress={() => setIsTableFolded((folded) => !folded)}
                      accessibilityRole="button"
                      accessibilityLabel={isTableFolded ? t.showTable : t.hideTable}
                      accessibilityState={{ expanded: !isTableFolded }}
                      hitSlop={8}
                      style={styles.foldButton}
                      testID="execution-sheet-table-toggle"
                    >
                      <KodjoIcon name={isTableFolded ? "control-chevron-down" : "control-chevron-up"} />
                    </Pressable>
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

              {showVariableTable && !isTableFolded ? (
                <VariableTable
                  draft={draft}
                  mode={effective.mode}
                  targetMin={targetMin}
                  targetMax={targetMax}
                  formatTarget={targetLabel}
                  onDraft={update}
                />
              ) : null}

              {!showVariableTable ? (
                <>
                  {effective.mode === "DURATION" ? (
                    <>
                      <Separator indented />
                      <Row label={t.durationTarget} indented testID="execution-sheet-row-target">
                        <ValuePill
                          value={secondsLabel(draft.uniform.target)}
                          accessibilityLabel={`${t.durationTarget}, ${secondsLabel(draft.uniform.target)}`}
                          expanded={openControl === "uniformDuration"}
                          onPress={() => toggle("uniformDuration")}
                          testID="execution-sheet-target-value"
                        />
                      </Row>
                      {openControl === "uniformDuration" ? (
                        <View style={styles.inlineControl} testID="execution-sheet-target-wheel">
                          <DurationWheelPicker
                            totalSeconds={draft.uniform.target ?? 0}
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
                          value={draft.uniform.target}
                          min={EXECUTION_BOUNDS.repetitionTarget.min}
                          max={EXECUTION_BOUNDS.repetitionTarget.max}
                          policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                          formatValue={repetitionsLabel}
                          onChange={(value) => update(setUniformTarget(draft, value))}
                          accessibilityLabel={t.repetitionsTarget}
                          emptyStart={1}
                          testID="execution-sheet-target-stepper"
                        />
                      </Row>
                    </>
                  ) : null}
                  <Separator indented />
                  <Row label={t.pause} indented testID="execution-sheet-row-pause">
                    <InlineStepper
                      value={draft.uniform.pauseSeconds}
                      min={EXECUTION_BOUNDS.pauseSeconds.min}
                      max={EXECUTION_BOUNDS.pauseSeconds.max}
                      policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                      formatValue={pauseLabel}
                      onChange={(value) => update(setUniformPause(draft, value))}
                      accessibilityLabel={`${t.pause}, ${t.secondsUnit}`}
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
                  <Row label={t.sideRecovery} indented testID="execution-sheet-row-side-recovery">
                    <InlineStepper
                      value={draft.sideRecoverySeconds}
                      min={EXECUTION_BOUNDS.sideRecoverySeconds.min}
                      max={EXECUTION_BOUNDS.sideRecoverySeconds.max}
                      policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                      formatValue={pauseLabel}
                      onChange={(value) => update(setSideRecovery(draft, value))}
                      accessibilityLabel={`${t.sideRecovery}, ${t.secondsUnit}`}
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
                  testID="execution-sheet-beep"
                />
              </Row>

              {duration && duration.kind !== "omitted" && duration.seconds !== undefined ? (
                <>
                  <Separator />
                  <Row
                    label={duration.kind === "estimated" ? t.totalEstimated : t.total}
                    selected={openControl === "total"}
                    testID="execution-sheet-row-total"
                  >
                    {invertible ? (
                      <ValuePill
                        value={formatPhraseDuration(duration.seconds)}
                        accessibilityLabel={`${t.totalEditAccessibilityLabel}, ${formatPhraseDuration(duration.seconds)}`}
                        expanded={openControl === "total"}
                        onPress={() => toggle("total")}
                        testID="execution-sheet-total"
                      />
                    ) : (
                      <Text style={styles.staticValue} testID="execution-sheet-total-text">
                        {formatPhraseDuration(duration.seconds)}
                      </Text>
                    )}
                  </Row>
                  {openControl === "total" && invertible ? (
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
                  testID="execution-sheet-end"
                />
              </Row>
            </View>
          </ScrollView>

          <View style={styles.notificationSlot} pointerEvents="box-none">
            <TransientNotification
              message={adjustment?.message ?? null}
              actionLabel={strings.screens.exercise.adjustedTotalDurationUndoAction}
              onAction={() => {
                const previous = adjustment?.previousCount;
                setAdjustment(null);
                if (previous !== undefined) setDraft((current) => setSeriesCount(current, previous));
              }}
              onDismiss={() => setAdjustment(null)}
              testID="execution-sheet-adjusted"
            />
          </View>
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
  onDraft,
}: {
  draft: ExecutionSheetDraft;
  mode: ExecutionMode | null;
  targetMin: number;
  targetMax: number;
  formatTarget: (value: number | null) => string;
  onDraft: (next: ExecutionSheetDraft) => void;
}) {
  const rows = seriesRowsOf({ series: { kind: "VARIABLE", rows: draft.rows } });
  const hasTarget = mode === "DURATION" || mode === "REPETITIONS";
  return (
    <View style={styles.table} testID="execution-sheet-table">
      <View style={styles.tableHeader}>
        <View style={styles.rowNumberColumn} />
        {hasTarget ? <Text style={styles.columnHeader}>{t.columns[mode]}</Text> : <View style={styles.flex} />}
        <Text style={styles.columnHeader}>{t.columns.pause}</Text>
      </View>
      {rows.map((row, index) => {
        const number = index + 1;
        return (
          <View key={index} style={styles.tableRow} testID={`execution-sheet-table-row-${number}`}>
            <View style={styles.rowNumberColumn}>
              <Pressable
                disabled={index === 0}
                onPress={() => onDraft(moveRow(draft, index, index - 1))}
                accessibilityRole="button"
                accessibilityLabel={t.moveUp.replace("{n}", String(number))}
                accessibilityState={{ disabled: index === 0 }}
                hitSlop={6}
                testID={`execution-sheet-table-row-${number}-up`}
              >
                <KodjoIcon name="control-chevron-up" size={16} opacity={index === 0 ? 0.3 : 1} />
              </Pressable>
              <Text style={styles.rowNumber} accessibilityLabel={t.row.replace("{n}", String(number))}>
                {number}
              </Text>
              <Pressable
                disabled={index === rows.length - 1}
                onPress={() => onDraft(moveRow(draft, index, index + 1))}
                accessibilityRole="button"
                accessibilityLabel={t.moveDown.replace("{n}", String(number))}
                accessibilityState={{ disabled: index === rows.length - 1 }}
                hitSlop={6}
                testID={`execution-sheet-table-row-${number}-down`}
              >
                <KodjoIcon name="control-chevron-down" size={16} opacity={index === rows.length - 1 ? 0.3 : 1} />
              </Pressable>
            </View>
            {hasTarget ? (
              <InlineStepper
                value={row.target}
                min={targetMin}
                max={targetMax}
                policy={EXECUTION_ACCELERATED_HOLD_POLICY}
                formatValue={formatTarget}
                onChange={(value) => onDraft(setRowTarget(draft, index, value))}
                accessibilityLabel={t.rowTarget.replace("{n}", String(number)).replace("{field}", t.columns[mode])}
                emptyStart={mode === "DURATION" ? 30 : 1}
                testID={`execution-sheet-table-row-${number}-target`}
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
              accessibilityLabel={t.rowPause.replace("{n}", String(number))}
              testID={`execution-sheet-table-row-${number}-pause`}
            />
          </View>
        );
      })}
    </View>
  );
}

function Row({
  label,
  indented = false,
  selected = false,
  children,
  testID,
}: {
  label: string;
  indented?: boolean;
  selected?: boolean;
  children: ReactNode;
  testID: string;
}) {
  return (
    <View style={[styles.row, indented ? styles.indented : null, selected ? styles.rowSelected : null]} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ValuePill({
  value,
  accessibilityLabel,
  expanded,
  disabled = false,
  onPress,
  testID,
}: {
  value: string;
  accessibilityLabel: string;
  expanded: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded, disabled }}
      hitSlop={{ top: 10, bottom: 10 }}
      style={styles.valuePill}
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
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: fixedRadii[16] + 8,
    borderTopRightRadius: fixedRadii[16] + 8,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 42,
    gap: spacing[8],
  },
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
  spacer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  foldButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  valuePill: {
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
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
    minHeight: 42,
    gap: spacing[4],
  },
  rowNumberColumn: {
    width: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rowNumber: {
    ...type.label,
    color: colors.textPrimary,
    minWidth: 14,
    textAlign: "center",
  },
  errorMessage: {
    ...type.body,
    color: colors.danger,
  },
  notificationSlot: {
    position: "absolute",
    left: spacing[24],
    right: spacing[24],
    bottom: spacing[24],
  },
});
