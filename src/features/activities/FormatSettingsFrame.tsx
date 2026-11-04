import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import type { ExecutionMode } from "@/domain/activities/ExecutionParameters";
import type { CircuitRole, ElementFormatKey, FormatSettings } from "@/domain/sessions/formats";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-9 — réglages de Format dans la modale de l'Exercice (CE-FMT-04 ; référence Formats §3, §6, §10 à §12, §14 ;
 * mise à jour consolidée des écrans Formats du 04/11/2026 §4.4, §6 bis 2). [Suspendus le 03/11/2026 sur décision de
 * Hermann (« les règles vont changer de toute façon ») ; suspension levée le 04/11/2026 pour appliquer la cible
 * documentée.]
 *
 * Cadre de la feuille des paramètres d'exécution, selon le porteur :
 * - AMRAP : Exercice autonome — Durée de l'exercice, Incrément par tour ; membre — Rôle (Buy-in | Tour),
 *   Incrément par tour, toujours présent, « + 0 » par défaut, dans l'unité de l'objectif, grisé pour un buy-in
 *   ou à l'échec ;
 * - For time : Exercice autonome — Durée maximum du For time (« Aucune ») ; membre — Rôle (Buy-in | Tour |
 *   Buy-out), Durée de l'exercice héritée du Circuit, grisée ;
 * - EMOM : Intervalle (Exercice autonome ou d'un Circuit standard) ;
 * - Death by : Intervalle (autonome, membre alterné), Incrément par intervalle (≥ + 1), Condition d'arrêt À
 *   l'échec imposée.
 * Les valeurs restent locales jusqu'au ✓ de la feuille (✕ : rien n'est appliqué). Contrôle EMOM des durées :
 * message, cadre rouge, ✓ indisponible (seuil inclusif).
 */

export type FormatSheetRow = "role" | "increment" | "interval" | "duration" | "timeCap" | "inheritedCap" | "stopImposed";

export type FormatSheetContext = {
  readonly key: ElementFormatKey;
  readonly rows: readonly FormatSheetRow[];
  readonly settings: FormatSettings;
  /** Rôle dans le circuit : admis par le Format, disponibles (dernier membre de la boucle : Tour seul). */
  readonly role?: { readonly current: CircuitRole; readonly admitted: readonly CircuitRole[]; readonly available: readonly CircuitRole[] };
  /** For time membre : borne héritée du Circuit, affichée grisée (« Sans limite », « ≤ 15 min »). */
  readonly inheritedCapText?: string;
  /**
   * Contrôle EMOM des durées : intervalle porté par le Circuit (`windowSeconds`, dans chaque intervalle) et
   * travail prévu des autres membres ; absent : l'intervalle est celui de l'Exercice (`intervalSeconds`).
   */
  readonly emom?: { readonly windowSeconds: number | null; readonly othersWorkSeconds: number };
  readonly onApply: (settings: FormatSettings, role: CircuitRole | null) => void;
};

export type FormatSheetValue = { readonly settings: FormatSettings; readonly role: CircuitRole | null };

export function initialFormatSheetValue(context: FormatSheetContext): FormatSheetValue {
  return { settings: context.settings, role: context.role?.current ?? null };
}

/** Intervalle effectif du contrôle EMOM (celui du Circuit, sinon celui de l'Exercice). */
export function emomIntervalOf(context: FormatSheetContext, value: FormatSheetValue): number | null {
  if (context.key !== "EMOM" || context.emom === undefined) return null;
  if (context.emom.windowSeconds !== null) return context.emom.windowSeconds;
  const own = value.settings.intervalSeconds;
  return typeof own === "number" ? own : null;
}

/** Dépassement EMOM au seuil inclusif : travail prévu (de l'Exercice, plus celui des autres membres) ≥ intervalle. */
export function emomOverflowOf(context: FormatSheetContext, value: FormatSheetValue, plannedWorkSeconds: number): boolean {
  const interval = emomIntervalOf(context, value);
  if (interval === null || plannedWorkSeconds <= 0) return false;
  return plannedWorkSeconds + (context.emom?.othersWorkSeconds ?? 0) >= interval;
}

const t = () => strings.executionParameters.format;

const VALUE_COLOR = colors.primary;
const LOCKED_COLOR = "#B4B8C2";
const ROLE_LABELS = (): Readonly<Record<CircuitRole, string>> => ({ BUY_IN: t().roles.BUY_IN, TOUR: t().roles.TOUR, BUY_OUT: t().roles.BUY_OUT });

function durationStep(seconds: number, direction: 1 | -1): number {
  const probe = direction > 0 ? seconds : seconds - 1;
  return probe < 60 ? 5 : probe < 300 ? 15 : 60;
}

function Stepper({
  label,
  text,
  locked = false,
  alert = false,
  canDecrease,
  canIncrease,
  onStep,
  testID,
}: {
  readonly label: string;
  readonly text: string;
  readonly locked?: boolean;
  readonly alert?: boolean;
  readonly canDecrease: boolean;
  readonly canIncrease: boolean;
  readonly onStep: (direction: 1 | -1) => void;
  readonly testID: string;
}) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text }}
      accessibilityState={{ disabled: locked }}
      accessibilityActions={locked ? [] : [{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "increment" && canIncrease) onStep(1);
        if (event.nativeEvent.actionName === "decrement" && canDecrease) onStep(-1);
      }}
      testID={`${testID}-row`}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        {locked ? null : (
          <Pressable onPress={() => onStep(-1)} disabled={!canDecrease} hitSlop={8} testID={`${testID}-decrease`}>
            <Text style={[styles.sign, canDecrease ? null : styles.signDisabled]}>−</Text>
          </Pressable>
        )}
        <View style={[styles.badge, alert ? styles.badgeAlert : null]}>
          <Text style={[styles.value, locked ? styles.valueLocked : null]} testID={testID}>
            {text}
          </Text>
        </View>
        {locked ? null : (
          <Pressable onPress={() => onStep(1)} disabled={!canIncrease} hitSlop={8} testID={`${testID}-increase`}>
            <Text style={[styles.sign, canIncrease ? null : styles.signDisabled]}>+</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function FormatSettingsFrame({
  context,
  value,
  onChange,
  mode,
  atFailure,
  emomOverflow,
}: {
  readonly context: FormatSheetContext;
  readonly value: FormatSheetValue;
  readonly onChange: (value: FormatSheetValue) => void;
  /** Mode courant de la feuille : unité de l'Incrément par tour (AMRAP). */
  readonly mode: ExecutionMode | null;
  /** Condition d'arrêt À l'échec : Incrément par tour grisé (AMRAP). */
  readonly atFailure: boolean;
  readonly emomOverflow: boolean;
}) {
  const settings = value.settings;
  const set = (id: string, next: number | null) => {
    const { [id]: _previous, ...rest } = settings;
    onChange({ ...value, settings: next === null ? rest : { ...rest, [id]: next } });
  };
  const numberOf = (id: string, fallback: number) => (typeof settings[id] === "number" ? (settings[id] as number) : fallback);
  const rows: React.ReactNode[] = [];
  for (const row of context.rows) {
    switch (row) {
      case "role": {
        const role = context.role;
        if (role === undefined || value.role === null) break;
        rows.push(
          <View key="role" style={styles.row} testID="execution-sheet-format-role-row">
            <Text style={styles.label}>{t().role}</Text>
            <View style={styles.segments} accessibilityRole="radiogroup">
              {role.admitted.map((option) => {
                const available = role.available.includes(option);
                const selected = value.role === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => onChange({ ...value, role: option })}
                    disabled={!available}
                    accessibilityRole="radio"
                    accessibilityLabel={ROLE_LABELS()[option]}
                    accessibilityState={{ selected, disabled: !available }}
                    style={[styles.segment, selected ? styles.segmentOn : null]}
                    testID={`execution-sheet-format-role-${option}`}
                  >
                    <Text style={[styles.segmentText, selected ? styles.segmentTextOn : null, available ? null : styles.valueLocked]}>{ROLE_LABELS()[option]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>,
        );
        if (role.available.length === 1 && role.admitted.length > 1) {
          rows.push(
            <Text key="role-hint" style={styles.hint} testID="execution-sheet-format-role-hint">
              {t().lastTourHint}
            </Text>,
          );
        }
        break;
      }
      case "increment": {
        const deathBy = context.key === "DEATH_BY";
        const current = numberOf("incrementPerRound", deathBy ? 1 : 0);
        // AMRAP : grisé pour un buy-in ou à l'échec (rien à augmenter) ; valeur conservée sans effet.
        const locked = !deathBy && (value.role === "BUY_IN" || value.role === "BUY_OUT" || atFailure);
        const unit = !deathBy && mode === "DURATION" ? formatPhraseDuration(current) : `${current} ${t().repetitionsUnit}`;
        rows.push(
          <Stepper
            key="increment"
            label={deathBy ? t().incrementPerInterval : t().incrementPerRound}
            text={`+ ${unit}`}
            locked={locked}
            canDecrease={current > (deathBy ? 1 : 0)}
            canIncrease={current < 999}
            onStep={(direction) => set("incrementPerRound", Math.max(deathBy ? 1 : 0, current + direction * (!deathBy && mode === "DURATION" ? 5 : 1)))}
            testID="execution-sheet-format-increment"
          />,
        );
        break;
      }
      case "interval": {
        const current = numberOf("intervalSeconds", 60);
        rows.push(
          <Stepper
            key="interval"
            label={t().interval}
            text={formatPhraseDuration(current)}
            alert={emomOverflow}
            canDecrease={current > 5}
            canIncrease={current < 3600}
            onStep={(direction) => set("intervalSeconds", Math.min(3600, Math.max(5, current + direction * durationStep(current, direction))))}
            testID="execution-sheet-format-interval"
          />,
        );
        break;
      }
      case "duration": {
        const current = numberOf("durationSeconds", 12 * 60);
        rows.push(
          <Stepper
            key="duration"
            label={t().duration}
            text={formatPhraseDuration(current)}
            canDecrease={current > 60}
            canIncrease={current < 180 * 60}
            onStep={(direction) => set("durationSeconds", Math.min(180 * 60, Math.max(60, current + direction * 60)))}
            testID="execution-sheet-format-duration"
          />,
        );
        break;
      }
      case "timeCap": {
        const cap = typeof settings.timeCapSeconds === "number" ? settings.timeCapSeconds : null;
        rows.push(
          <Stepper
            key="timeCap"
            label={t().timeCap}
            text={cap === null ? t().noCap : formatPhraseDuration(cap)}
            canDecrease={cap !== null}
            canIncrease={cap === null || cap < 180 * 60}
            onStep={(direction) => set("timeCapSeconds", cap === null ? (direction > 0 ? 60 : null) : cap + direction * 60 < 60 ? null : cap + direction * 60)}
            testID="execution-sheet-format-time-cap"
          />,
        );
        break;
      }
      case "inheritedCap":
        rows.push(
          <View key="inheritedCap" style={styles.row} testID="execution-sheet-format-inherited-cap-row">
            <Text style={styles.label}>{t().duration}</Text>
            <Text style={[styles.value, styles.valueLocked]} testID="execution-sheet-format-inherited-cap">
              {context.inheritedCapText ?? t().noLimit}
            </Text>
          </View>,
        );
        break;
      case "stopImposed":
        rows.push(
          <View key="stopImposed" style={styles.row} testID="execution-sheet-format-stop-row">
            <Text style={styles.label}>{t().stopCondition}</Text>
            <Text style={[styles.value, styles.valueLocked]}>{t().atFailure}</Text>
          </View>,
        );
        break;
      default:
        break;
    }
  }
  if (rows.length === 0) return null;
  return (
    <View style={styles.frame} testID="execution-sheet-frame-format">
      <Text style={styles.title}>{t().title.replace("{format}", t().names[context.key])}</Text>
      {rows}
      {emomOverflow ? (
        <Text style={styles.alert} accessibilityRole="alert" testID="execution-sheet-format-emom-overflow">
          {t().emomOverflow}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { marginHorizontal: 16, marginTop: 8, borderRadius: 16, backgroundColor: "#F9FAFC", paddingHorizontal: 16, paddingVertical: 6, gap: 2 },
  title: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#595E66", marginTop: 4 },
  row: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { flexShrink: 1, fontFamily: "Inter_400Regular", fontSize: 14, color: "#141414" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  sign: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: VALUE_COLOR, minWidth: 18, textAlign: "center" },
  signDisabled: { color: LOCKED_COLOR },
  badge: { backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeAlert: { backgroundColor: colors.dangerSurface },
  value: { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 14, color: VALUE_COLOR },
  valueLocked: { color: LOCKED_COLOR },
  segments: { flexDirection: "row", gap: 4 },
  segment: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#FFFFFF" },
  segmentOn: { backgroundColor: VALUE_COLOR },
  segmentText: { fontFamily: "Inter_500Medium", fontSize: 13, color: VALUE_COLOR },
  segmentTextOn: { color: "#FFFFFF" },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#595E66", marginBottom: 4 },
  alert: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 16, color: colors.danger, marginBottom: 6 },
});
