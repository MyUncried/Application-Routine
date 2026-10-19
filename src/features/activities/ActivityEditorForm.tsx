import { useEffect, useRef, useState, type RefObject } from "react";
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
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  validateForSave,
  type ExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import {
  moveDraftMedia,
  placeRetriedMedia,
  selectionNeighbours,
  type DraftMediaItem,
  type MediaSelectionNeighbours,
} from "@/domain/media/ActivityMedia";
import type { ImportItem, ImportResult } from "@/domain/media/ActivityMediaImportService";
import type { Silhouette } from "@/domain/preferences/Profile";
import { NAME_MAX_LENGTH, validateExerciseName } from "@/domain/sessions/validation";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityMediaList, type MediaNotice } from "@/features/activities/ActivityMediaList";
import { DescriptionSteps } from "@/features/activities/DescriptionSteps";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { BodyZonePickerModal } from "@/features/reference-data/BodyZonePickerModal";
import { useReferenceSheet } from "@/features/reference-data/useReferenceSheet";
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
 *
 * PRE-4 story 4.2 (FR-02-02 à FR-02-06) : ordre P7 — bandeau (Nom, accès),
 * Description, Carte, Médias, puis `Terminer` ; Carte seule zone touchable,
 * sans bouton de Mode (Q23), invite sur la Carte vide (H22) ; grille
 * verticale de D-327 et marge latérale 24 / 16 selon la largeur (FR-02-04).
 *
 * PRE-5 story 3.1 (FR-33, AD-22, D-425) : la Description est une liste
 * d'étapes (`instructionSteps`, sans numéro) ; les adaptateurs la décodent à
 * l'ouverture (`decodeInstructionSteps`) et l'encodent à `Terminer` seulement
 * (`encodeInstructionSteps`). Stockage inchangé.
 */
export type ActivityEditorFormValue = {
  readonly name: string;
  readonly instructionSteps: readonly string[];
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
  /**
   * PRE-4 story 4.3 (FR-02-05) : la feuille de Catégorie, montée par
   * l'adaptateur, est ouverte — l'icône de l'accès passe à l'état plein, puis
   * revient au contour à sa fermeture (✓ ou ✕). Absent : `false`.
   */
  isCategoryPickerOpen?: boolean;
  /**
   * PRE-4 story 4.6 (FR-22-10, AC9) : référence posée sur l'accès Catégorie, fournie par
   * l'adaptateur qui tient la feuille, pour y rendre le focus après sa fermeture
   * (`useReferenceSheet`). Absente : référence interne, sans retour du focus.
   */
  categoryAccessRef?: RefObject<View | null>;
  /** Pause entre les côtés du Profil, copiée à l'activation du changement de côté. */
  profileSideRecoverySecondsDefault: number;
  /**
   * PRE-5 story 2.5 (AC4, D-409, RM-218) : Compte à rebours et Fin dans la Feuille —
   * `"absent"` pour un Exercice ouvert depuis une Séance (ni lignes ni chevron) ; défaut
   * `"present"`. La Carte de l'Éditeur est inchangée.
   */
  exerciseSignals?: "present" | "absent";
  /**
   * PRE-4 (story 1.1, AD-13) : ligne de base des paramètres, relue à
   * l'ouverture de l'Éditeur (`null` en création) — transmise au ✓ de la
   * Feuille pour la validation unique `validateForSave` (H25).
   */
  baselineParameters?: ExecutionParametersInput | null;
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
 * Validité du brouillon d'Exercice : Nom valide et paramètres valides par la
 * validation unique `validateForSave` avec la ligne de base relue à
 * l'ouverture de l'Éditeur (PRE-4, AD-13 : `null` en création ; une valeur
 * héritée hors bornes non modifiée reste enregistrable, H25 ; une Cible
 * `UNSET` bloque `Terminer`). `requireReferences` (nouvel Exercice, et
 * toute définition Catalogue) exige aussi une Catégorie et au moins une Zone
 * (périmètre §5).
 */
export function isActivityEditorFormValid(
  value: ActivityEditorFormValue,
  options: {
    readonly requireReferences: boolean;
    readonly hasCategory: boolean;
    readonly baseline?: ExecutionParametersInput | null;
  } = {
    requireReferences: false,
    hasCategory: true,
  },
): boolean {
  if (!validateExerciseName(value.name).ok) {
    return false;
  }
  if (!validateForSave(value.executionParameters, options.baseline ?? null).ok) {
    return false;
  }
  if (options.requireReferences && (!options.hasCategory || value.bodyZoneIds.length === 0)) {
    return false;
  }
  return true;
}

const card = strings.executionParameters.card;

/**
 * PRE-4 story 4.2 (FR-02-04, AC5 ; `S/13…:74-78`) : marge latérale de
 * l'Éditeur — 24 à partir de la largeur 390, 16 en dessous. Partagée par
 * l'en-tête (prop de `FixedHeader`), la zone de contexte, le corps, `Terminer`
 * et le halo. Valeurs de la règle écrite, jamais une coordonnée Figma.
 */
export const EDITOR_SIDE_MARGIN_MIN_WIDTH = 390;
export function editorSideMargin(windowWidth: number): number {
  return windowWidth >= EDITOR_SIDE_MARGIN_MIN_WIDTH ? spacing[24] : spacing[16];
}

/**
 * PRE-4 story 4.2 (FR-02-03, FR-02-04 ; D-327, DSF-INTERFACE §0.1) : grille
 * verticale commune, appliquée exactement à ses quatre relations, jamais aux
 * espaces internes des composants. 18 et 13 n'ont pas de jeton d'espacement :
 * constantes nommées de la règle écrite, `tokens.ts` restant intouché (AD-11).
 */
export const EDITOR_VERTICAL_GRID = {
  /** Bas géométrique du dégradé de la zone de contexte → première ligne de texte. */
  contextToFirstText: 18,
  /** Dernier élément d'un bloc → titre de la section suivante. */
  blockToNextTitle: spacing[20],
  /** Titre de section → son bloc. */
  titleToBlock: 13,
  /** Bloc → bloc sans titre entre eux (dernier bloc → `Terminer`). */
  blockToBlock: spacing[12],
} as const;

/**
 * Phrase v1 §5 : « retour de ligne de présentation avant Durée totale sans
 * changement de grammaire ». Seul le rendu change ; le texte canonique
 * (recette, libellé accessible) garde l'espace du corpus v15.
 */
const TOTAL_CLAUSE = / Durée totale : $/;
function presentationText(texte: string): string {
  return texte.replace(TOTAL_CLAUSE, "\nDurée totale : ");
}

export function ActivityEditorForm({
  value,
  onChange,
  bodyZones,
  onBodyZonesPickerClose,
  silhouette = null,
  category,
  onOpenCategory,
  isCategoryPickerOpen = false,
  categoryAccessRef,
  profileSideRecoverySecondsDefault,
  exerciseSignals = "present",
  baselineParameters = null,
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
  const sideMargin = editorSideMargin(useWindowDimensions().width);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const parametersCardRef = useRef<View>(null);
  // PRE-4 story 4.6 (FR-22-10, AC9) : à la fermeture d'une feuille de référentiel, le focus
  // VoiceOver revient à l'accès qui l'a ouverte, une fois la fermeture finie
  // (`useReferenceSheet`). Zones : feuille tenue ici. Catégorie : feuille tenue par
  // l'adaptateur, qui passe la référence de l'accès (`categoryAccessRef`).
  const ownCategoryAccessRef = useRef<View>(null);
  const categoryAccess = categoryAccessRef ?? ownCategoryAccessRef;
  const bodyZonesAccessRef = useRef<View>(null);
  const bodyZonesSheet = useReferenceSheet(bodyZonesAccessRef);
  const isBodyZonePickerOpen = bodyZonesSheet.isOpen;
  const media = useMediaImport(mediaService, mediaDraftId, value.media, (next) => onChange({ media: next }));

  const t = strings.screens.exercise;
  const editor = strings.screens.activities.editor;
  const parameters = value.executionParameters;
  // Recette 2 (N-05) : pendant la saisie de la Description, la ligne active reste juste
  // au-dessus du clavier. PRE-5 story 3.1 (AC2, D-349) : l'étape active (et non plus le
  // champ entier, dont la hauteur bornée est retirée) est recadrée à l'ouverture du
  // clavier, à chaque changement d'étape et à chaque changement de sa hauteur.
  // Terminer reste en bas, sous le clavier.
  const bodyScrollRef = useRef<ScrollView>(null);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const descriptionLayoutRef = useRef({ sectionY: 0, stepsY: 0, activeRowBottom: 0 });
  const bodyHeightRef = useRef(0);
  function revealDescription() {
    const { sectionY, stepsY, activeRowBottom } = descriptionLayoutRef.current;
    const viewport = bodyHeightRef.current;
    if (viewport <= 0) return;
    const bottom = sectionY + stepsY + activeRowBottom + DESCRIPTION_KEYBOARD_GAP;
    bodyScrollRef.current?.scrollTo({ y: Math.max(0, bottom - viewport), animated: true });
  }
  useEffect(() => {
    if (!isDescriptionFocused) return;
    const subscription = Keyboard.addListener("keyboardDidShow", () => revealDescription());
    return () => subscription.remove();
  }, [isDescriptionFocused]);
  const segments = parameters.mode === null ? null : generateExecutionPhrase(parameters);
  // Recette iPhone du 2026-10-18 (E-21, décision de Hermann) : l'invite H22 de la Carte
  // vide est retirée ; sans Mode validé, la Carte reste vide comme en PRE-3 (Phrase vide).
  const phrase = segments ? phraseText(segments) : parameters.mode === null ? "" : card.incomplete;
  const zoneNames = bodyZones.filter((zone) => value.bodyZoneIds.includes(zone.id)).map((zone) => zone.name);
  // Q53 (9), décision de Hermann du 2026-10-18 : aucun avis textuel ni annonce VoiceOver pour
  // une Zone ou une Catégorie retirée encore affectée (« ce n'est pas un besoin ») ; restent le
  // fond `#FFF1F0` et le nom accessible « …, retirée de la liste des choix » dans les feuilles.
  // Q53 (7) : « au moins une Zone requise » — la suppression de la seule Zone de l'Exercice
  // depuis sa feuille rend `Terminer` inactif jusqu'au choix d'une autre Zone, y compris pour
  // une Copie existante (dont l'adaptateur n'exige pas de Zone : données antérieures sans Zone).
  const [zonesEmptiedByDeletion, setZonesEmptiedByDeletion] = useState(false);
  const finishDisabled = isFinishDisabled || (zonesEmptiedByDeletion && value.bodyZoneIds.length === 0);

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
      <View style={[styles.contextBand, { paddingHorizontal: sideMargin }]} testID="exercise-context-band">
        {/* Recette 1 (T-49) — effets figés de la « Zone bleue » (3542:4656, ch. 12 l.1490) :
            fondu vers le fond de l’écran sur les 20 % inférieurs, puis « Halo blanc —
            bouton Annuler » (5752:4044, Ø 59,28) concentrique au bouton Retour de
            l’en-tête, dont seule la partie qui déborde dans la zone est visible. Tous deux
            sous le contenu, sans interaction. */}
        <View pointerEvents="none" style={styles.contextBandFade} testID="exercise-context-band-fade">
          {CONTEXT_BAND_FADE_LAYERS.map((layer) => (
            <View key={layer.top} style={[styles.contextBandFadeLayer, { top: layer.top, opacity: layer.opacity }]} />
          ))}
        </View>
        {/* Story 4.2 (AC5) : le halo suit la marge de l'en-tête pour rester concentrique au ✕. */}
        <View
          pointerEvents="none"
          style={[styles.backHalo, { left: sideMargin + dimensions.backAction.visualCircle / 2 - BACK_HALO_DIAMETER / 2 }]}
          testID="exercise-context-band-halo"
        />
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
        {/* PRE-4 story 4.3 (FR-02-05, P35 ; AC2) : chaque accès est un bouton icône +
            libellé (`Catégorie`, `Zone corporelle`) quand il n'est pas renseigné ; renseigné,
            pastille + nom (Catégorie) ou silhouette + noms des Zones avec le séparateur de la
            capture `8328:37022`. Icône au contour au repos, pleine pendant l'ouverture de sa
            feuille (planche `7245:13718`, même tracé ; la pilule ne change pas). Une seule
            silhouette, celle du Profil. Cible ≥ 44 × 44 par `ACCESS_HIT_SLOP` (FR-22-04). */}
        <View style={styles.referenceRow} testID="exercise-reference-row">
          <Pressable
            ref={categoryAccess}
            onPress={onOpenCategory}
            accessibilityRole="button"
            accessibilityLabel={
              category ? `${editor.category.label} ${category.name}` : editor.category.unsetAccessibilityLabel
            }
            // Revue 4.3 : feuille ouverte annoncée « développé », Catégorie renseignée comprise
            // (la pilule pastille + nom n'a pas d'état ouvert visuel : écart E-V12).
            accessibilityState={{ expanded: isCategoryPickerOpen }}
            hitSlop={ACCESS_HIT_SLOP}
            style={styles.referencePill}
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
              <>
                {isCategoryPickerOpen ? (
                  <KodjoIcon name="icon-categorie-plein" size={CATEGORY_ICON_SIZE} testID="activity-editor-category-icon-filled" />
                ) : (
                  <KodjoIcon name="icon-categorie" size={CATEGORY_ICON_SIZE} testID="activity-editor-category-icon" />
                )}
                <Text style={styles.referenceLabel} testID="activity-editor-category-label">
                  {editor.category.label}
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            ref={bodyZonesAccessRef}
            onPress={() => {
              Keyboard.dismiss();
              bodyZonesSheet.open();
            }}
            accessibilityRole="button"
            // Revue 4.3 (WCAG 2.5.3) : le nom accessible contient le texte visible —
            // « Zone corporelle — non renseignée » au repos, comme la Catégorie ; renseigné,
            // les noms affichés, précédés du nom de l'accès.
            accessibilityLabel={
              zoneNames.length > 0
                ? `${t.bodyZones.accessibilityLabel} ${zoneNames.join(", ")}`
                : t.bodyZones.unsetAccessibilityLabel
            }
            accessibilityState={{ expanded: isBodyZonePickerOpen }}
            hitSlop={ACCESS_HIT_SLOP}
            style={styles.referencePill}
            testID="exercise-body-zones-open"
          >
            <BodyZoneIcon
              silhouette={silhouette}
              size={BODY_ZONE_ACCESS_ICON_SIZE}
              filled={isBodyZonePickerOpen}
              testID={isBodyZonePickerOpen ? "exercise-body-zones-icon-filled" : "exercise-body-zones-icon"}
            />
            <Text style={styles.referenceLabel} numberOfLines={1} testID="exercise-body-zones-label">
              {zoneNames.length > 0 ? zoneNames.join(t.bodyZones.bandSeparator) : t.bodyZones.unsetLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={bodyScrollRef}
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingHorizontal: sideMargin }]}
          keyboardShouldPersistTaps="handled"
          onLayout={(event) => {
            bodyHeightRef.current = event.nativeEvent.layout.height;
            if (isDescriptionFocused) revealDescription();
          }}
          testID="exercise-body"
        >
          {/* P7 (FR-02-02, AC3) : la Description précède la Carte Paramètres d'exécution. */}
          <View
            style={styles.section}
            onLayout={(event) => {
              descriptionLayoutRef.current.sectionY = event.nativeEvent.layout.y;
            }}
            testID="exercise-section-description"
          >
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {t.instruction.label}
            </Text>
            {/* PRE-5 story 3.1 (FR-33, D-425) : étapes numérotées, sans contenant (§9-2) ;
                Entrée crée l'étape suivante. La place de ↑ reste réservée à droite. */}
            <View
              style={styles.descriptionStepsWithSend}
              onLayout={(event) => {
                descriptionLayoutRef.current.stepsY = event.nativeEvent.layout.y;
                if (isDescriptionFocused) revealDescription();
              }}
              testID="exercise-description-steps-area"
            >
              <DescriptionSteps
                steps={value.instructionSteps}
                onChange={(steps) => onChange({ instructionSteps: steps })}
                onFocusChange={setIsDescriptionFocused}
                onActiveRowBottomChange={(bottom) => {
                  descriptionLayoutRef.current.activeRowBottom = bottom;
                  revealDescription();
                }}
              />
            </View>
            {/* Recette 3 (N-05) : ↑ dans la Description pendant la saisie — le texte est déjà
                dans le brouillon ; ↑ ferme seulement le clavier (aucun enregistrement,
                Terminer inchangé), D-351. */}
            {isDescriptionFocused ? (
              <Pressable
                onPress={() => Keyboard.dismiss()}
                accessibilityRole="button"
                accessibilityLabel={card.descriptionSubmitAccessibilityLabel}
                hitSlop={(minTouchTarget - DESCRIPTION_SEND_SIZE) / 2}
                style={styles.descriptionSend}
                testID="exercise-instruction-submit"
              >
                <Text style={styles.descriptionSendSymbol}>↑</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Q23 (AC14) : aucun bouton ni nom du Mode à droite du titre ; la Carte est la
              seule zone touchable et le seul focus (AC6) ; le Mode se choisit dans la Feuille. */}
          <View style={[styles.section, styles.followingSection]} testID="exercise-section-parameters">
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {card.title}
            </Text>
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
                        presentationText(segment.texte)
                      ),
                    )
                  : phrase}
              </Text>
              <View style={styles.cardSeparator} />
              <View style={styles.phasesRow}>
                <View style={styles.phase}>
                  <Text style={styles.phaseLabel}>{card.countdown}</Text>
                  <Text style={styles.phaseValue} testID="exercise-parameters-countdown">
                    {formatPhraseDuration(parameters.countdownSeconds)}
                  </Text>
                </View>
                <View style={styles.phase}>
                  <Text style={styles.phaseLabel}>{card.end}</Text>
                  <Text style={styles.phaseValue} testID="exercise-parameters-end">
                    {formatPhraseDuration(parameters.endSeconds)}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          <View style={[styles.section, styles.followingSection]} testID="activity-editor-section-media">
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
      </KeyboardAvoidingView>

      {/* Recette 2 (N-05) : hors de la zone qui évite le clavier — Terminer ne remonte
          jamais avec le clavier ; il redevient accessible dès sa fermeture. */}
      <View
        style={[styles.finishActionSlot, { marginHorizontal: sideMargin, marginBottom: insets.bottom + spacing[16] }]}
        testID={finishSlotTestID}
      >
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

      {isSheetOpen ? (
        <ExecutionParametersSheet
          parent={parameters}
          baseline={baselineParameters}
          profileSideRecoverySecondsDefault={profileSideRecoverySecondsDefault}
          exerciseSignals={exerciseSignals}
          onApply={applyParameters}
          onCancel={closeSheet}
        />
      ) : null}

      {bodyZonesSheet.isMounted ? (
        <BodyZonePickerModal
          key={bodyZonesSheet.generation}
          visible={bodyZonesSheet.isOpen}
          onDismissed={bodyZonesSheet.dismissed}
          selectedIds={value.bodyZoneIds}
          onConfirm={(ids) => onChange({ bodyZoneIds: ids })}
          onZoneRetired={(zoneId) => {
            // Q53 (7) : la Zone supprimée depuis cet Exercice quitte immédiatement sa sélection,
            // même si la feuille est ensuite fermée par ✕.
            if (!value.bodyZoneIds.includes(zoneId)) return;
            const remaining = value.bodyZoneIds.filter((id) => id !== zoneId);
            if (remaining.length === 0) setZonesEmptiedByDeletion(true);
            onChange({ bodyZoneIds: remaining });
          }}
          onClose={() => {
            bodyZonesSheet.close();
            onBodyZonesPickerClose?.();
          }}
          silhouette={silhouette}
        />
      ) : null}
    </>
  );
}

/**
 * Import de médias du brouillon (P3-23, D-335). Chaque sélection garde son
 * identité et sa place : les éléments prêts sont ajoutés en fin, dans
 * l'ordre de sélection ; un élément en échec mémorise ses voisins de
 * sélection et, une fois réessayé avec succès, est réinséré avant le premier
 * voisin suivant encore présent (sinon après le dernier précédent) — un
 * réordonnancement ou un retrait explicite de l'utilisateur n'est jamais
 * annulé (REV-03). Les échecs d'imports antérieurs restent visibles avec
 * Réessayer ; une annulation est neutre. Aucune écriture SQLite :
 * l'enregistrement reste celui de « Terminer ».
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
  const neighboursRef = useRef(new Map<string, MediaSelectionNeighbours>());
  useEffect(() => {
    mediaRef.current = media;
    onMediaRef.current = onMedia;
  });

  function commit(next: readonly DraftMediaItem[]) {
    mediaRef.current = next;
    onMediaRef.current(next);
  }

  function append(items: readonly DraftMediaItem[]) {
    const known = new Set(mediaRef.current.map((item) => item.assetId));
    const fresh = items.filter((item) => !known.has(item.assetId));
    if (fresh.length > 0) commit([...mediaRef.current, ...fresh]);
  }

  function insertRetried(item: DraftMediaItem) {
    const neighbours = neighboursRef.current.get(item.assetId);
    neighboursRef.current.delete(item.assetId);
    const next = placeRetriedMedia(mediaRef.current, item, neighbours);
    if (next !== mediaRef.current) commit(next);
  }

  /** Remplace/ajoute les éléments d'un lot sans perdre les échecs des lots précédents. */
  function mergeBatch(batch: readonly ImportItem[], keepReady: boolean) {
    setPending((current) => {
      const batchKeys = new Set(batch.map((entry) => entry.key));
      const others = current.filter((entry) => !batchKeys.has(entry.key));
      return [...others, ...batch.filter((entry) => keepReady || entry.state !== "READY")];
    });
  }

  function handleResult(result: ImportResult | null) {
    if (!result) return;
    if (result.status === "CANCELED") {
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
    const keys = result.items.map((item) => item.key);
    for (const item of result.items) {
      if (item.state === "FAILED") {
        neighboursRef.current.set(item.key, selectionNeighbours(keys, item.key));
      }
    }
    append(result.items.flatMap((item) => (item.state === "READY" ? [item.media] : [])));
    mergeBatch(result.items, false);
  }

  // Android : un résultat du sélecteur en attente (activité recréée) est importé une seule fois.
  useEffect(() => {
    if (!service) return;
    service.leaseDraftMedia(draftId, mediaRef.current.map((item) => item.assetId));
    service.importPendingMedia(draftId, (items) => mergeBatch(items, true)).then(handleResult, () => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, draftId]);

  return {
    pending,
    notice,
    importFromLibrary: () => {
      if (!service) return;
      setNotice(null);
      service.importMedia(draftId, (items) => mergeBatch(items, true)).then(handleResult, () => setNotice("ERROR"));
    },
    retry: (item: ImportItem) => {
      if (!service) return;
      setPending((current) =>
        current.map((entry) => (entry.key === item.key ? { key: entry.key, state: "IMPORTING", picked: entry.picked } : entry)),
      );
      service.retryMediaImport(draftId, item).then(
        (result) => {
          if (result.state === "READY") {
            insertRetried(result.media);
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

/** N-05 : marge entre le bas de la Description et le clavier pendant la saisie. */
const DESCRIPTION_KEYBOARD_GAP = 12;
/** Recette 3 (N-05) : bouton d’envoi standard des champs (32, comme « Saisie inline »). */
const DESCRIPTION_SEND_SIZE = 32;

/**
 * Taille d’affichage de l’icône de l’accès Catégorie, commune à ses deux états (story 4.3) :
 * contour = maître `icon/categorie` (`6296:10530`, `icon-categorie`) ; plein = « Catégorie —
 * pleine » de la planche `7245:13718` (`7286:13728`, `icon-categorie-plein`). La valeur 20
 * vient de la recette PRE-3 (X-2) ; le nœud figé d’où elle avait été relevée a disparu de
 * Figma et n’est associé à aucun état.
 */
const CATEGORY_ICON_SIZE = 20;
/** Silhouette de l’accès Zones : taille PRE-3 conservée (26), contour et plein superposables. */
const BODY_ZONE_ACCESS_ICON_SIZE = 26;
/** Hauteur minimale des pilules d’accès (`styles.referencePill`). */
const ACCESS_PILL_MIN_HEIGHT = 32;
/** FR-22-04 : cible minimale des accès (44 × 44 pt). */
const ACCESS_MIN_TARGET = 44;
/** Écarts de la rangée des accès : 8 entre deux accès (PRE-3), 12 entre deux lignes. */
const ACCESS_COLUMN_GAP = spacing[8];
const ACCESS_ROW_GAP = spacing[12];
/**
 * PRE-4 story 4.3 (FR-22-04, AC2) : cible d’au moins 44 × 44 sans recouvrement —
 * verticalement 6 + 32 + 6 = 44, et l’écart entre deux lignes (12, quand les pilules
 * passent à la ligne) couvre les débords bas et haut ; horizontalement la moitié de
 * l’écart entre deux accès (la largeur d’une pilule icône + libellé dépasse déjà 44).
 */
const ACCESS_HIT_SLOP = {
  top: (ACCESS_MIN_TARGET - ACCESS_PILL_MIN_HEIGHT) / 2,
  bottom: (ACCESS_MIN_TARGET - ACCESS_PILL_MIN_HEIGHT) / 2,
  left: ACCESS_COLUMN_GAP / 2,
  right: ACCESS_COLUMN_GAP / 2,
} as const;

/** Halo figé sous le bouton Retour (« Halo blanc — bouton Annuler », 5752:4044). */
const BACK_HALO_DIAMETER = 59.28;
/** Fondu figé : opaque jusqu’à 80 %, transparent à 100 % (GRADIENT_LINEAR de la « Zone bleue »). */
const CONTEXT_BAND_FADE_SHARE = "20%";
/**
 * Recette 2 (T-49) : couches SUPERPOSÉES, chacune de son seuil jusqu’au bas de la
 * zone — aucun interstice entre bandes, donc aucun trait parasite. L’opacité de
 * chaque couche est calculée pour que l’opacité cumulée suive la rampe 0 → 1.
 */
const CONTEXT_BAND_FADE_LAYER_COUNT = 12;
const CONTEXT_BAND_FADE_LAYERS = Array.from({ length: CONTEXT_BAND_FADE_LAYER_COUNT }, (_, index) => {
  const before = index / CONTEXT_BAND_FADE_LAYER_COUNT;
  const after = (index + 1) / CONTEXT_BAND_FADE_LAYER_COUNT;
  return {
    top: `${((index / CONTEXT_BAND_FADE_LAYER_COUNT) * 100).toFixed(4)}%` as `${number}%`,
    opacity: Number((1 - (1 - after) / (1 - before)).toFixed(4)),
  };
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contextBand: {
    // Le halo déborde au-dessus de la zone : seule la partie interne est dessinée.
    overflow: "hidden",
    // X-3 (12/10) : « Zone bleue » figée #EAEAFF ; le token partagé de la Composition est inchangé.
    backgroundColor: colors.exerciseEditorContextBand,
    // Marge latérale appliquée au rendu (`editorSideMargin`, story 4.2).
    minHeight: dimensions.contextBand.height,
    paddingTop: dimensions.contextBand.paddingTop,
    paddingBottom: dimensions.contextBand.paddingBottom,
    gap: spacing[12],
  },
  contextBandFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: CONTEXT_BAND_FADE_SHARE,
  },
  contextBandFadeLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  backHalo: {
    position: "absolute",
    width: BACK_HALO_DIAMETER,
    height: BACK_HALO_DIAMETER,
    borderRadius: BACK_HALO_DIAMETER / 2,
    backgroundColor: colors.background,
    // Centre = centre du ✕ de l’en-tête partagé (cercle 38 après la marge latérale,
    // centré dans la hauteur de contenu 48 juste au-dessus de la zone) ; `left` est
    // calculé au rendu depuis la marge (story 4.2, AC5).
    top: -dimensions.header.contentHeight / 2 - BACK_HALO_DIAMETER / 2,
  },
  // Recette 2 (T-49, décision du 12/10) : aucun liseré autour du champ Nom.
  nameInput: {
    ...type.screenTitle,
    color: colors.textPrimary,
    backgroundColor: "transparent",
    borderRadius: fixedRadii[10],
    minHeight: 42,
    paddingHorizontal: dimensions.exerciseTextField.paddingHorizontal,
  },
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: ACCESS_COLUMN_GAP,
    rowGap: ACCESS_ROW_GAP,
  },
  referencePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    minHeight: ACCESS_PILL_MIN_HEIGHT,
    maxWidth: "100%",
    paddingLeft: spacing[4],
    paddingRight: spacing[12],
    borderRadius: fixedRadii[16],
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
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
  // Story 4.2 (AC4, AC5) : grille de D-327 — 18 du bas du dégradé au premier titre,
  // 12 du dernier bloc (Médias) à `Terminer` ; marge latérale appliquée au rendu.
  bodyContent: {
    flexGrow: 1,
    paddingTop: EDITOR_VERTICAL_GRID.contextToFirstText,
    paddingBottom: EDITOR_VERTICAL_GRID.blockToBlock,
  },
  sectionTitle: {
    ...type.sectionTitle,
    color: colors.textPrimary,
    flexShrink: 1,
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
  // D-327 : 13 entre un titre de section et son bloc ; 20 entre le dernier élément
  // d'un bloc et le titre de la section suivante.
  section: {
    gap: EDITOR_VERTICAL_GRID.titleToBlock,
  },
  followingSection: {
    marginTop: EDITOR_VERTICAL_GRID.blockToNextTitle,
  },
  // Recette 3 (N-05) : place réservée à ↑ (le texte ne passe jamais dessous).
  // PRE-5 story 3.1 : sans contenant, la réserve porte sur la liste des étapes.
  descriptionStepsWithSend: {
    paddingRight: DESCRIPTION_SEND_SIZE + spacing[8],
  },
  // La liste est le dernier bloc de sa section : ↑ s’ancre dans son coin bas droit.
  descriptionSend: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: DESCRIPTION_SEND_SIZE,
    height: DESCRIPTION_SEND_SIZE,
    borderRadius: DESCRIPTION_SEND_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  descriptionSendSymbol: {
    ...type.button,
    color: colors.background,
  },
  // Story 4.2 : 12 (bloc → bloc, D-327) portés par le bas du corps ; marge latérale au rendu.
  finishActionSlot: {
    position: "relative",
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
