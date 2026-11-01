import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Movement } from "@/domain/activities/Movement";
import { computeStructuredSessionDuration } from "@/domain/sessions/calculations";
import {
  initialModelSettings,
  isFormatModel,
  modelArrangement,
  modelDraftPatch,
  modelExecutionParameters,
  modelFormat,
  modelParameters,
  proposesOrganisation,
  withModelSetting,
  type ModelOrganisation,
  type ModelParameter,
  type ModelSettings,
  type ParametrizedModelKey,
} from "@/domain/sessions/sessionModels";
import type { SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { formatSessionDurationEstimate } from "@/features/sessions/compositionPresentation";
import { exerciseOfMovement, takeMovementsHandedToComposition } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { DOMAIN_DEFAULTS, profileDefaultsOf } from "@/features/sessions/useMovementExerciseIntake";
import { strings } from "@/shared/i18n";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-9 C.3 — paramètres d'un modèle et récapitulatif (CE-FMT-02 ; Figma `8624:30306`, `8624:30392`,
 * `8656:35062`, lecture seule).
 *
 * Atteint depuis « Créer » (C.2) après le choix des Mouvements dans le Catalogue (ARB-22a, D-22/D-23 :
 * aucun Mouvement présélectionné). Constantes du Format affichées grisées avec leur raison ; valeurs
 * initiales réglables ; durée totale recalculée à chaque réglage (CE-FMT-02 §12), jamais saisie ;
 * organisation « À la suite / En alternance » proposée à partir du deuxième Exercice pour Tabata,
 * EMOM et Progression (D-13), sans changer le volume. « Enregistrer dans la séance » remplit le
 * brouillon (C.4 : Exercices porteurs du Format, nom suggéré = nom du Format, ARB-15) et ouvre la
 * Composition.
 */

const MODEL_COLORS: Readonly<Record<ParametrizedModelKey, { readonly background: string; readonly band: string }>> = {
  TABATA: { background: "#FDECEC", band: "#FAD8D8" },
  INTERVALS_30_30: { background: "#E6F5EF", band: "#CDEBDF" },
  EMOM: { background: "#E8F3FB", band: "#D3E7F7" },
  AMRAP: { background: "#E6EBFB", band: "#D0DAF7" },
  FOR_TIME: { background: "#EEF7E8", band: "#D9EFCC" },
  DEATH_BY: { background: "#FAEAF3", band: "#F2CFE4" },
  STRENGTH: { background: "#F3E9FA", band: "#E7D4F5" },
  SUPERSET: { background: "#E3F4F6", band: "#C9E9ED" },
  PROGRESSION: { background: "#FBF3E4", band: "#F6E6C8" },
  UNTIL_FAILURE: { background: "#FDEFE6", band: "#F9DCC8" },
};
const PANEL_COLOR = "#F5F6F9";
const VALUE_COLOR = "#0508E5";
const ACCENT = "#5B5BF0";

const MODEL_KEYS: readonly ParametrizedModelKey[] = [
  "TABATA",
  "INTERVALS_30_30",
  "EMOM",
  "AMRAP",
  "FOR_TIME",
  "DEATH_BY",
  "STRENGTH",
  "SUPERSET",
  "PROGRESSION",
  "UNTIL_FAILURE",
];

function isModelKey(value: unknown): value is ParametrizedModelKey {
  return typeof value === "string" && (MODEL_KEYS as readonly string[]).includes(value);
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

function valueLabel(parameter: ModelParameter, value: number): string {
  return parameter.unit === "SECONDS" ? formatSeconds(value) : String(value);
}

function Stepper({
  label,
  value,
  onChange,
  min,
  step,
  testID,
}: {
  label: string;
  value: string;
  onChange: (delta: number) => void;
  min: boolean;
  step: number;
  testID: string;
}) {
  const t = strings.screens.formatParameters;
  return (
    <View style={styles.stepper} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ text: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => onChange(event.nativeEvent.actionName === "increment" ? step : -step)}
      testID={testID}
    >
      <Pressable onPress={() => onChange(-step)} disabled={min} accessibilityLabel={t.decrease} hitSlop={8} testID={`${testID}-decrease`}>
        <Text style={[styles.stepperSign, min ? styles.stepperSignDisabled : null]}>−</Text>
      </Pressable>
      <Text style={styles.adjustableValue} testID={`${testID}-value`}>
        {value}
      </Text>
      <Pressable onPress={() => onChange(step)} accessibilityLabel={t.increase} hitSlop={8} testID={`${testID}-increase`}>
        <Text style={styles.stepperSign}>+</Text>
      </Pressable>
    </View>
  );
}

export function FormatParametersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ model?: string }>();
  const model: ParametrizedModelKey = isModelKey(params.model) ? params.model : "STRENGTH";
  const t = strings.screens.formatParameters;
  const modelName = strings.screens.sessionModels.cards[model].title;
  const { updateDraft, suggestDraftName } = useSessionDraft();
  const profileService = useContext(ProfileServiceContext);
  const actionZone = usePrimaryActionZone();

  // Mouvements choisis dans le Catalogue (remis une seule fois), puis Exercices de base du Profil.
  const [movements] = useState<readonly Movement[]>(() => takeMovementsHandedToComposition() ?? []);
  const [bases, setBases] = useState<readonly SessionDraftExercise[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    const read = profileService
      ? profileService.getProfile().then(profileDefaultsOf, () => DOMAIN_DEFAULTS)
      : Promise.resolve(DOMAIN_DEFAULTS);
    void read.then((defaults) => {
      if (!cancelled) setBases(movements.map((movement) => exerciseOfMovement(movement, Crypto.randomUUID(), defaults)));
    });
    return () => {
      cancelled = true;
    };
  }, [movements, profileService]);

  const [settings, setSettings] = useState<ModelSettings>(() => initialModelSettings(model));
  const [organisation, setOrganisation] = useState<ModelOrganisation>("SEQUENCE");
  const [name, setName] = useState(isFormatModel(model) ? modelName : "");
  const busyRef = useRef(false);

  const exercises = useMemo(() => {
    if (bases === null) return [];
    const format = modelFormat(model, settings);
    return bases.map((base) => ({
      ...base,
      executionParameters: modelExecutionParameters(model, settings, base.executionParameters),
      ...(format !== null ? { format } : {}),
    }));
  }, [bases, model, settings]);
  const arrangement = modelArrangement(model, settings, organisation, exercises);
  const patch = modelDraftPatch(exercises, arrangement);
  const duration = useMemo(
    () =>
      computeStructuredSessionDuration({
        beforeTour: patch.exercises.filter((exercise) => exercise.structuralPosition === "BEFORE_TOUR"),
        inTour: patch.exercises.filter((exercise) => exercise.structuralPosition === "IN_TOUR"),
        afterTour: [],
        tourRepeatCount: patch.tourRepeatCount ?? 1,
        ...(patch.circuitNature !== undefined ? { circuitNature: patch.circuitNature } : {}),
      }),
    [patch],
  );

  const save = () => {
    if (busyRef.current || exercises.length === 0) return;
    busyRef.current = true;
    updateDraft({ ...patch, origin: model });
    // ARB-15 / B.9 : nom du Format proposé, modifiable ; un nom saisi ici est personnalisé.
    if (name.trim().length > 0) {
      if (isFormatModel(model) && name === modelName) suggestDraftName?.(name);
      else updateDraft({ name });
    }
    router.replace({ pathname: "/composition", params: { keepDraft: "1" } });
  };

  const colorsOf = MODEL_COLORS[model];
  const rows = modelParameters(model);
  return (
    <ScreenShell>
      <FixedHeader
        title={`${t.titlePrefix} ${modelName}`}
        onBack={() => router.back()}
        backAccessibilityLabel={t.backAccessibilityLabel}
        closeIcon
      />
      <ScrollView contentContainerStyle={{ paddingBottom: actionZone.scrollReserve }} testID="format-parameters">
        <View style={[styles.band, { backgroundColor: colorsOf.background }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={strings.screens.composition.name}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel={strings.screens.composition.name}
            style={styles.name}
            testID="format-parameters-name"
          />
        </View>

        <Text style={styles.sectionLabel}>{t.movements}</Text>
        <View style={styles.cards}>
          {movements.map((movement) => (
            <View key={movement.id} style={styles.card} testID={`format-parameters-movement-${movement.id}`}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {movement.name}
              </Text>
              {movement.description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {movement.description}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t.parameters}</Text>
        <View style={styles.panel} testID="format-parameters-panel">
          {rows.map((parameter) => {
            const label = t.parameterLabels[parameter.id as keyof typeof t.parameterLabels] ?? parameter.id;
            const raw = settings[parameter.id];
            if (Array.isArray(raw)) {
              return raw.map((value, index) => (
                <View key={`${parameter.id}-${index}`} style={styles.row}>
                  <Text style={styles.rowLabel}>{`${label} ${index + 1}`}</Text>
                  <Stepper
                    label={`${label} ${index + 1}`}
                    value={String(value)}
                    min={value <= parameter.min}
                    step={1}
                    onChange={(delta) =>
                      setSettings((current) =>
                        withModelSetting(model, current, parameter.id, raw.map((item, at) => (at === index ? item + delta : item))),
                      )
                    }
                    testID={`format-parameters-${parameter.id}-${index}`}
                  />
                </View>
              ));
            }
            const value = typeof raw === "number" ? raw : 0;
            return (
              <View key={parameter.id} style={styles.row}>
                <Text style={styles.rowLabel}>{label}</Text>
                {parameter.lock === "LOCKED" ? (
                  <Text
                    style={styles.lockedValue}
                    accessibilityLabel={`${label}, ${valueLabel(parameter, value)}, ${t.lockedReason}`}
                    testID={`format-parameters-${parameter.id}-locked`}
                  >
                    {valueLabel(parameter, value)}
                  </Text>
                ) : (
                  <Stepper
                    label={label}
                    value={valueLabel(parameter, value)}
                    min={value <= parameter.min}
                    step={parameter.step ?? 1}
                    onChange={(delta) => setSettings((current) => withModelSetting(model, current, parameter.id, value + delta))}
                    testID={`format-parameters-${parameter.id}`}
                  />
                )}
              </View>
            );
          })}
          {rows.some((parameter) => parameter.lock === "LOCKED") ? (
            <Text style={styles.lockedNote}>{t.lockedReason}</Text>
          ) : null}
          <View style={[styles.row, styles.rowSeparated]}>
            <Text style={styles.rowLabel}>{t.totalDuration}</Text>
            <Text style={styles.totalValue} accessibilityLiveRegion="polite" testID="format-parameters-total">
              {exercises.length === 0 ? "—" : formatSessionDurationEstimate(duration)}
            </Text>
          </View>
          {proposesOrganisation(model, exercises.length) ? (
            <View style={[styles.row, styles.rowSeparated]}>
              <Text style={styles.rowLabel}>{t.execution}</Text>
              <View style={styles.segment} accessibilityRole="radiogroup" testID="format-parameters-organisation">
                {(["SEQUENCE", "ALTERNATED"] as const).map((option) => {
                  const selected = organisation === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setOrganisation(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[styles.segmentOption, selected ? styles.segmentSelected : null]}
                      testID={`format-parameters-organisation-${option}`}
                    >
                      <Text style={[styles.segmentLabel, selected ? styles.segmentLabelSelected : null]}>{t.organisation[option]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} testID="format-parameters-bottom-action">
        <PrimaryActionButton label={t.save} onPress={save} disabled={exercises.length === 0} testID="format-parameters-save" />
      </PrimaryActionZone>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  band: {
    paddingHorizontal: spacing[16],
    paddingTop: spacing[16],
    paddingBottom: spacing[24],
  },
  name: {
    ...type.screenTitle,
    color: colors.textPrimary,
    padding: 0,
  },
  sectionLabel: {
    ...type.supporting,
    color: colors.textSecondary,
    marginTop: spacing[16],
    marginBottom: spacing[8],
    marginHorizontal: spacing[16],
  },
  cards: {
    gap: spacing[8],
    marginHorizontal: spacing[16],
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E3E5EB",
    padding: spacing[12],
    gap: spacing[4],
  },
  cardTitle: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  cardDescription: {
    ...type.supporting,
    color: colors.textSecondary,
  },
  panel: {
    marginHorizontal: spacing[16],
    borderRadius: 16,
    backgroundColor: PANEL_COLOR,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[8],
  },
  rowSeparated: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D9DCE3",
  },
  rowLabel: {
    ...type.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  lockedValue: {
    ...type.editableValue,
    color: colors.textSecondary,
  },
  lockedNote: {
    ...type.supporting,
    color: colors.textSecondary,
    marginBottom: spacing[4],
  },
  totalValue: {
    ...type.editableValue,
    color: colors.textPrimary,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
  },
  stepperSign: {
    ...type.sectionTitle,
    color: VALUE_COLOR,
    minWidth: 20,
    textAlign: "center",
  },
  stepperSignDisabled: {
    color: colors.textSecondary,
    opacity: 0.4,
  },
  adjustableValue: {
    ...type.editableValue,
    color: VALUE_COLOR,
    minWidth: 48,
    textAlign: "center",
  },
  segment: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  segmentOption: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
  },
  segmentSelected: {
    backgroundColor: ACCENT,
  },
  segmentLabel: {
    ...type.segmentedCompactLabel,
    color: ACCENT,
  },
  segmentLabelSelected: {
    color: "#FFFFFF",
  },
});
