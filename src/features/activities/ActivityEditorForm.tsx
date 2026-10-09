import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  findNodeHandle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  validateExecutionParameters,
  type ExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { moveDraftMedia, type DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem, ImportResult } from "@/domain/media/ActivityMediaImportService";
import type { Silhouette } from "@/domain/preferences/Profile";
import { INSTRUCTION_MAX_LENGTH, NAME_MAX_LENGTH, validateExerciseName } from "@/domain/sessions/validation";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityMediaList, type MediaNotice } from "@/features/activities/ActivityMediaList";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { BodyZonePickerModal } from "@/features/reference-data/BodyZonePickerModal";
import { strings } from "@/shared/i18n";
import { BodyZoneIcon } from "@/shared/ui/BodyZoneIcon";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Éditeur COMMUN d'un Exercice (CE-T03-04, PRE-3) — partagé par les quatre
 * parcours créer/modifier × définition Catalogue / copie de Séance
 * (`ExerciseScreen.tsx`). Composant contrôlé : il ne connaît ni la cible
 * d'enregistrement ni la Séance ; chaque adaptateur fournit `value` /
 * `onChange` et décide seul de « Terminer ».
 *
 * PRE-3 :
 * - zone bleue : Nom, puis Catégorie et Zones corporelles (pilules) ;
 * - carte « Paramètres d'exécution » : phrase COMPLÈTE générée à
 *   l'affichage (segments `{texte, gras}` en `Text` imbriqués, en flux, sans
 *   troncature), Compte à rebours et Fin ; la zone entière ouvre la feuille ;
 * - la feuille (`ExecutionParametersSheet`) est un sous-brouillon : ✓
 *   remplace atomiquement `executionParameters`, ✕ ne change rien ;
 * - Description ; Médias ordonnés importés depuis la photothèque.
 */
export type ActivityEditorFormValue = {
  readonly name: string;
  readonly instruction: string | null;
  readonly executionParameters: ExecutionParametersInput;
  readonly bodyZoneIds: readonly string[];
  readonly media: readonly DraftMediaItem[];
};

export type EditorCategory = { readonly name: string; readonly color: string | null } | null;

export type ActivityEditorFormProps = {
  value: ActivityEditorFormValue;
  onChange: (patch: Partial<ActivityEditorFormValue>) => void;
  /** Référentiel persistant des Zones corporelles (chargé par l'appelant). */
  bodyZones: readonly BodyZone[];
  onBodyZonesPickerClose?: () => void;
  silhouette?: Silhouette | null;
  /** Catégorie affichée (résolue par l'adaptateur) et ouverture de son sélecteur. */
  category: EditorCategory;
  onOpenCategory: () => void;
  /** Pause entre les côtés du Profil, copiée à l'activation du changement de côté. */
  profileSideRecoverySecondsDefault: number;
  /** Service portant l'import de médias ; `null` : section en lecture seule. */
  mediaService: ActivityDefinitionService | null;
  /** Identité stable du brouillon (prêts des fichiers préparés). */
  mediaDraftId: string;
  finishLabel: string;
  onFinish: () => void;
  isFinishDisabled?: boolean;
  errorMessage?: string | null;
  finishSlotTestID: string;
  finishActionTestID: string;
  errorTestID?: string;
};

/**
 * Validité du brouillon d'Exercice : Nom valide et paramètres canoniques
 * valides (mode et cibles actifs complets). `requireReferences` (nouvel
 * Exercice, et toute définition Catalogue) exige aussi une Catégorie et au
 * moins une Zone (périmètre §5).
 */
export function isActivityEditorFormValid(
  value: ActivityEditorFormValue,
  options: { readonly requireReferences: boolean; readonly hasCategory: boolean } = {
    requireReferences: false,
    hasCategory: true,
  },
): boolean {
  if (!validateExerciseName(value.name).ok) {
    return false;
  }
  if (!validateExecutionParameters(value.executionParameters).ok) {
    return false;
  }
  if (options.requireReferences && (!options.hasCategory || value.bodyZoneIds.length === 0)) {
    return false;
  }
  return true;
}

const card = strings.executionParameters.card;

export function ActivityEditorForm({
  value,
  onChange,
  bodyZones,
  onBodyZonesPickerClose,
  silhouette = null,
  category,
  onOpenCategory,
  profileSideRecoverySecondsDefault,
  mediaService,
  mediaDraftId,
  finishLabel,
  onFinish,
  isFinishDisabled = false,
  errorMessage = null,
  finishSlotTestID,
  finishActionTestID,
  errorTestID,
}: ActivityEditorFormProps) {
  const insets = useSafeAreaInsets();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isBodyZonePickerOpen, setIsBodyZonePickerOpen] = useState(false);
  const parametersCardRef = useRef<View>(null);
  const media = useMediaImport(mediaService, mediaDraftId, value.media, (next) => onChange({ media: next }));

  const t = strings.screens.exercise;
  const editor = strings.screens.activities.editor;
  const parameters = value.executionParameters;
  const segments = parameters.mode === null ? null : generateExecutionPhrase(parameters);
  const phrase = segments ? phraseText(segments) : parameters.mode === null ? "" : card.incomplete;
  const zoneNames = bodyZones.filter((zone) => value.bodyZoneIds.includes(zone.id)).map((zone) => zone.name);
  const finishDisabled = isFinishDisabled;

  function openSheet() {
    Keyboard.dismiss();
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    // Le focus revient au déclencheur (P3-21).
    const node = findNodeHandle(parametersCardRef.current);
    if (node !== null) {
      AccessibilityInfo.setAccessibilityFocus(node);
    }
  }

  function applyParameters(next: ExecutionParameters) {
    onChange({ executionParameters: next });
    closeSheet();
  }

  return (
    <>
      <View style={styles.contextBand} testID="exercise-context-band">
        <TextInput
          value={value.name}
          onChangeText={(text) => onChange({ name: text })}
          placeholder={editor.name}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={editor.name}
          maxLength={NAME_MAX_LENGTH}
          style={styles.nameInput}
          testID="exercise-name-input"
        />
        <View style={styles.referenceRow}>
          <Pressable
            onPress={onOpenCategory}
            accessibilityRole="button"
            accessibilityLabel={
              category ? `${editor.category.label} ${category.name}` : editor.category.unsetAccessibilityLabel
            }
            hitSlop={5}
            style={[styles.referencePill, category ? null : styles.referenceIconOnly]}
            testID="activity-editor-category-button"
          >
            {category ? (
              <>
                {category.color ? (
                  <View style={[styles.categorySwatch, { backgroundColor: category.color }]} testID="activity-editor-category-swatch" />
                ) : null}
                <Text style={styles.referenceLabel}>{category.name}</Text>
              </>
            ) : (
              <KodjoIcon name="icon-tour" testID="activity-editor-category-icon" />
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setIsBodyZonePickerOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={
              zoneNames.length > 0
                ? `${t.bodyZones.accessibilityLabel} ${zoneNames.join(", ")}`
                : t.bodyZones.accessibilityLabel
            }
            hitSlop={5}
            style={[styles.referencePill, zoneNames.length > 0 ? null : styles.referenceIconOnly]}
            testID="exercise-body-zones-open"
          >
            {zoneNames.length > 0 ? (
              <Text style={styles.referenceLabel} numberOfLines={1}>
                {zoneNames.join(" · ")}
              </Text>
            ) : (
              <BodyZoneIcon silhouette={silhouette} size={26} />
            )}
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
          testID="exercise-body"
        >
          <View style={styles.parametersBlock}>
            <View style={styles.parametersHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">
                {card.title}
              </Text>
              <Pressable
                onPress={openSheet}
                accessibilityRole="button"
                accessibilityLabel={card.openAccessibilityLabel}
                hitSlop={9}
                style={styles.valuePill}
                testID="exercise-parameters-mode"
              >
                <Text style={styles.valuePillText}>
                  {parameters.mode === null ? card.chooseMode : strings.executionParameters.sheet.modes[parameters.mode]}
                </Text>
              </Pressable>
            </View>
            <Pressable
              ref={parametersCardRef}
              onPress={openSheet}
              accessibilityRole="button"
              accessibilityLabel={`${card.openAccessibilityLabel}. ${phrase} ${card.countdown} ${parameters.countdownSeconds} s, ${card.end} ${parameters.endSeconds} s.`}
              style={styles.parametersCard}
              testID="exercise-parameters-card"
            >
              <Text style={styles.phrase} testID="exercise-parameters-phrase">
                {segments
                  ? segments.map((segment, index) =>
                      segment.gras ? (
                        <Text key={index} style={styles.phraseBold}>
                          {segment.texte}
                        </Text>
                      ) : (
                        segment.texte
                      ),
                    )
                  : phrase}
              </Text>
              <View style={styles.cardSeparator} />
              <View style={styles.phasesRow}>
                <View style={styles.phase}>
                  <Text style={styles.phaseLabel}>{card.countdown}</Text>
                  <Text style={styles.phaseValue} testID="exercise-parameters-countdown">
                    {`${parameters.countdownSeconds} s`}
                  </Text>
                </View>
                <View style={styles.phase}>
                  <Text style={styles.phaseLabel}>{card.end}</Text>
                  <Text style={styles.phaseValue} testID="exercise-parameters-end">
                    {`${parameters.endSeconds} s`}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          <View style={styles.section} testID="exercise-section-description">
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {t.instruction.label}
            </Text>
            <TextInput
              value={value.instruction ?? ""}
              onChangeText={(text) => onChange({ instruction: text.length > 0 ? text : null })}
              placeholder={card.descriptionPlaceholder}
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel={t.instruction.label}
              maxLength={INSTRUCTION_MAX_LENGTH}
              multiline
              style={styles.instructionInput}
              testID="exercise-instruction-input"
            />
          </View>

          <View style={styles.section} testID="activity-editor-section-media">
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {strings.executionParameters.media.section}
            </Text>
            <ActivityMediaList
              media={value.media}
              pending={media.pending}
              notice={media.notice}
              canImport={mediaService !== null && mediaService.supportsMediaImport}
              resolveUri={(uri) => (mediaService ? mediaService.resolveMediaUri(uri) : uri)}
              onAdd={media.importFromLibrary}
              onRemove={(index) => onChange({ media: value.media.filter((_, position) => position !== index) })}
              onMove={(from, to) => onChange({ media: moveDraftMedia(value.media, from, to) })}
              onRetry={media.retry}
            />
          </View>
        </ScrollView>

        <View style={[styles.finishActionSlot, { marginBottom: insets.bottom + spacing[16] }]} testID={finishSlotTestID}>
          {errorMessage ? (
            <Text style={styles.saveErrorText} accessibilityLiveRegion="polite" testID={errorTestID}>
              {errorMessage}
            </Text>
          ) : null}
          <Pressable
            disabled={finishDisabled}
            onPress={onFinish}
            accessibilityRole="button"
            accessibilityState={{ disabled: finishDisabled }}
            accessibilityLabel={finishLabel}
            style={[styles.primaryAction, finishDisabled ? styles.primaryActionDisabled : null]}
            testID={finishActionTestID}
          >
            <Text style={styles.primaryActionLabel}>{finishLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {isSheetOpen ? (
        <ExecutionParametersSheet
          parent={parameters}
          profileSideRecoverySecondsDefault={profileSideRecoverySecondsDefault}
          onApply={applyParameters}
          onCancel={closeSheet}
        />
      ) : null}

      {isBodyZonePickerOpen ? (
        <BodyZonePickerModal
          selectedIds={value.bodyZoneIds}
          onConfirm={(ids) => onChange({ bodyZoneIds: ids })}
          onClose={() => {
            setIsBodyZonePickerOpen(false);
            onBodyZonesPickerClose?.();
          }}
          silhouette={silhouette}
        />
      ) : null}
    </>
  );
}

/**
 * Import de médias du brouillon : éléments prêts AJOUTÉS EN FIN de la liste
 * (ordre de sélection conservé), éléments en cours / en erreur gardés à part
 * avec Réessayer ; annulation sans effet ; refus d'accès actionnable.
 * Aucune écriture SQLite : l'enregistrement reste celui de « Terminer ».
 */
function useMediaImport(
  service: ActivityDefinitionService | null,
  draftId: string,
  media: readonly DraftMediaItem[],
  onMedia: (next: readonly DraftMediaItem[]) => void,
) {
  const [pending, setPending] = useState<readonly ImportItem[]>([]);
  const [notice, setNotice] = useState<MediaNotice>(null);
  const mediaRef = useRef(media);
  const onMediaRef = useRef(onMedia);
  useEffect(() => {
    mediaRef.current = media;
    onMediaRef.current = onMedia;
  });

  function append(items: readonly DraftMediaItem[]) {
    if (items.length === 0) return;
    const known = new Set(mediaRef.current.map((item) => item.assetId));
    const next = [...mediaRef.current, ...items.filter((item) => !known.has(item.assetId))];
    mediaRef.current = next;
    onMediaRef.current(next);
  }

  function handleResult(result: ImportResult | null) {
    if (!result) return;
    if (result.status === "CANCELED") {
      setPending([]);
      return;
    }
    if (result.status === "PERMISSION_DENIED") {
      setNotice(result.canAskAgain ? "PERMISSION_DENIED" : "PERMISSION_DENIED_FINAL");
      return;
    }
    if (result.status === "ERROR") {
      setNotice("ERROR");
      return;
    }
    setNotice(result.limitedAccess ? "LIMITED" : null);
    append(result.items.flatMap((item) => (item.state === "READY" ? [item.media] : [])));
    setPending(result.items.filter((item) => item.state === "FAILED"));
  }

  // Android : un résultat du sélecteur en attente (activité recréée) est importé une seule fois.
  useEffect(() => {
    if (!service) return;
    service.leaseDraftMedia(draftId, mediaRef.current.map((item) => item.assetId));
    service.importPendingMedia(draftId, setPending).then(handleResult, () => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, draftId]);

  return {
    pending,
    notice,
    importFromLibrary: () => {
      if (!service) return;
      setNotice(null);
      service.importMedia(draftId, setPending).then(handleResult, () => setNotice("ERROR"));
    },
    retry: (item: ImportItem) => {
      if (!service) return;
      setPending((current) =>
        current.map((entry) => (entry.key === item.key ? { key: entry.key, state: "IMPORTING", picked: entry.picked } : entry)),
      );
      service.retryMediaImport(draftId, item).then(
        (result) => {
          if (result.state === "READY") {
            append([result.media]);
            setPending((current) => current.filter((entry) => entry.key !== item.key));
          } else {
            setPending((current) => current.map((entry) => (entry.key === item.key ? result : entry)));
          }
        },
        () => setPending((current) => current.map((entry) => (entry.key === item.key ? item : entry))),
      );
    },
  };
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contextBand: {
    backgroundColor: colors.exerciseContextBandBackground,
    paddingHorizontal: spacing[24],
    minHeight: dimensions.contextBand.height,
    paddingTop: dimensions.contextBand.paddingTop,
    paddingBottom: dimensions.contextBand.paddingBottom,
    gap: spacing[12],
  },
  nameInput: {
    ...type.screenTitle,
    color: colors.textPrimary,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.sessionNameBorder,
    borderRadius: fixedRadii[10],
    minHeight: 42,
    paddingHorizontal: dimensions.exerciseTextField.paddingHorizontal,
  },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[8],
  },
  referencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    minHeight: 32,
    maxWidth: "100%",
    paddingLeft: spacing[4],
    paddingRight: spacing[12],
    borderRadius: fixedRadii[16],
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  referenceIconOnly: {
    width: 34,
    height: 34,
    paddingLeft: 0,
    paddingRight: 0,
    borderRadius: fixedRadii[17],
    justifyContent: "center",
  },
  categorySwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  referenceLabel: {
    ...type.button,
    color: colors.primary,
    flexShrink: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[14],
    paddingBottom: spacing[12],
    gap: spacing[16],
  },
  parametersBlock: {
    gap: spacing[8],
  },
  parametersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[8],
  },
  sectionTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  valuePill: {
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[10],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[10],
  },
  valuePillText: {
    ...type.button,
    lineHeight: 18,
    color: colors.primary,
  },
  parametersCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: fixedRadii[12],
    paddingHorizontal: spacing[14],
    paddingVertical: spacing[12],
    gap: spacing[4],
    backgroundColor: colors.background,
  },
  // Phrase : Inter 13, interligne 20, valeurs Semi Bold ; hauteur intrinsèque, jamais tronquée.
  phrase: {
    ...type.exerciseFieldValue,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  phraseBold: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  cardSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing[4],
  },
  phasesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing[24],
    rowGap: spacing[4],
    paddingTop: spacing[4],
  },
  phase: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
  },
  phaseLabel: {
    ...type.exerciseFieldValue,
    color: colors.textPrimary,
  },
  phaseValue: {
    ...type.editableValue,
    color: colors.primary,
    backgroundColor: colors.surface,
    borderRadius: fixedRadii[6],
    overflow: "hidden",
    paddingHorizontal: spacing[8],
    paddingVertical: 2,
  },
  section: {
    gap: spacing[8],
  },
  instructionInput: {
    ...type.exerciseFieldValue,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.disabled,
    borderRadius: fixedRadii[8],
    padding: spacing[14],
    minHeight: 44,
    textAlignVertical: "top",
  },
  finishActionSlot: {
    position: "relative",
    marginTop: spacing[8],
    marginHorizontal: spacing[24],
  },
  primaryAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  primaryActionDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryActionLabel: {
    ...type.button,
    color: colors.background,
  },
  saveErrorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing[8],
  },
});

export const EDITOR_MIN_TOUCH_TARGET = minTouchTarget;
