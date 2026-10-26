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

import {
  validateForSave,
  type ExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
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
import type { AnchoredPanelPlacement } from "@/features/activities/AnchoredPanel";
import { DESCRIPTION_STEP_GUTTER, DescriptionSteps } from "@/features/activities/DescriptionSteps";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import {
  MOVEMENT_LEVEL_PANEL_GAP,
  MovementLevelMenu,
  MovementLevelPanel,
  type EditorLevel,
} from "@/features/activities/MovementLevelMenu";
import { BodyZonePickerModal } from "@/features/reference-data/BodyZonePickerModal";
import { useReferenceSheet } from "@/features/reference-data/useReferenceSheet";
import { strings } from "@/shared/i18n";
import { BodyZoneIcon } from "@/shared/ui/BodyZoneIcon";
import { FINAL_ACTION_SIDE_MARGIN_MIN_WIDTH, finalActionSideMargin } from "@/shared/ui/finalAction";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
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
 *
 * PRE-5 story 3.2 (R-14, FR-36 à FR-38, AD-30) : présentation seulement — Carte allégée
 * (Phrase seule, sans Compte à rebours, Fin ni filet), `Terminer` à 24 du bas de l'écran,
 * titres de section et Classification Catégorie / Zones selon les frames Figma
 * `8328:35698`, `8328:36853` et `8328:37022` (relevé du 19/10, lecture seule).
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
   * PRE-6 story 3.3 (AD-37, AD-44) : occurrence d'un Circuit de Séries — N hérité, transmis
   * à la Feuille (`openSheetDraft(parent, { inheritedSeriesCount })`). Défaut `false`. Lu par la
   * Feuille à son montage (chaque ouverture) ; l'appelant le fige pour la vie de l'éditeur.
   */
  inheritedSeriesCount?: boolean;
  /**
   * PRE-7 (A2.1, D-438, MFN-09) : structure des phases verrouillée dans la Feuille (occurrence de
   * Séance copiée d'un geste) ; durées modifiables. Défaut `false`. Transmise à chaque ouverture.
   */
  phaseStructureLocked?: boolean;
  /**
   * PRE-7 (A2.2, D-437, D-438, MFN-08, MFN-09 ; CE-T03-04 §3) : contenu du geste en lecture
   * seule — nom, description, médias (consultation conservée), Catégorie, Zones corporelles et
   * structure des phases. Occurrence copiée d'un geste (sans déverrouillage), ou création sur un
   * geste repris avant le crayon « Modifier le geste ». Les paramètres restent modifiables.
   * Défaut `false`.
   */
  contentLocked?: boolean;
  /**
   * PRE-7 (A2.1, MFN-02, MFN/AC30) : compteur de phase du Mouvement de la définition éditée,
   * transmis à la Feuille (`openSheetDraft`) ; absent : max(`id`) + 1.
   */
  nextPhaseId?: number;
  /**
   * PRE-7 (A2.3, MFN-06) : fin de la saisie du nom (clavier fermé, champ quitté ou validé) —
   * l'adaptateur y propose un geste proche. Absent : rien.
   */
  onNameEndEditing?: () => void;
  /**
   * PRE-7 (A2.3, MFN-06 « recherche explicite accessible indépendamment de la similarité du nom,
   * avant la saisie détaillée ») : lien de recherche des gestes, en tête du contenu ; `null`
   * (défaut) : absent. Emplacement sans frame Figma (NON VÉRIFIABLE), style du lien
   * « Rechercher un autre geste » de `9882:19141`.
   */
  movementSearchAction?: { readonly label: string; readonly onPress: () => void } | null;
  /**
   * PRE-7 (A3.1, D-439, MFN-05, MFN-07 ; CE-T03-04 §9, Figma `9029:18363`) : pastille de Niveau, en
   * troisième position de la rangée de classification, et popover « Changer de niveau / Ajouter un
   * niveau » quand `menu` est fourni. `null` (défaut) : rangée Catégorie / Zones inchangée (création
   * sans geste, export `8328:35698` ; Séance).
   */
  level?: EditorLevel | null;
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
export const EDITOR_SIDE_MARGIN_MIN_WIDTH = FINAL_ACTION_SIDE_MARGIN_MIN_WIDTH;
/** PRE-6 story 7.10 (D-444) : même règle que la zone d'action principale (`shared/ui/finalAction`). */
export function editorSideMargin(windowWidth: number): number {
  return finalActionSideMargin(windowWidth);
}

/**
 * PRE-4 story 4.2 (FR-02-03, FR-02-04 ; D-327, DSF-INTERFACE §0.1) : grille
 * verticale de l'Éditeur, appliquée à ses quatre relations, jamais aux espaces
 * internes des composants.
 *
 * PRE-5 story 3.2, arbitrage G-2 de Hermann du 19/10 : pour cet écran seulement,
 * les espacements du Figma actuel (`8328:35698`, « Contenu du formulaire » :
 * `pt` 14, écart 16 ; titre → contenu 10) remplacent 18 / 20 / 13 de D-327 ; la
 * grille globale n'est pas modifiée. 12 (dernier bloc → `Terminer`) est conservé.
 */
export const EDITOR_VERTICAL_GRID = {
  /** Bas géométrique du dégradé de la zone de contexte → première section. */
  contextToFirstText: spacing[14],
  /** Dernier élément d'une section → section suivante. */
  blockToNextTitle: spacing[16],
  /** Titre de section → son contenu. */
  titleToBlock: spacing[10],
  /** Bloc → bloc sans titre entre eux (dernier bloc → `Terminer`). */
  blockToBlock: spacing[12],
} as const;

/**
 * PRE-5 story 3.2, arbitrage G-1 de Hermann du 19/10 (Figma `5544:4503`, état
 * Fermer) : en-tête propre à l'Éditeur d'Exercice, passé à `FixedHeader` par ses
 * props locales (les autres écrans sont inchangés). Cible 48 du ✕ à 12 du bord,
 * titre à 4 après la cible (x64) ; cercle visible 38 et icône 24
 * (`dimensions.backAction`) ; fond `#FCFCFE`, liseré blanc 1 et ombre « KODJO / DSF /
 * Effet observé / 01 » (`#1A1A26` 8 %, (0, 2), flou 10) ; titre Inter Medium 17
 * `#3A3A3F`. Valeurs sans jeton exact : constantes locales.
 */
const EDITOR_HEADER_TARGET_INSET = spacing[12];
const EDITOR_HEADER_TITLE_GAP = spacing[4];
const EDITOR_HEADER_BACK_HIT_SLOP = (dimensions.backAction.touchTarget - dimensions.backAction.visualCircle) / 2;
export const EDITOR_HEADER = {
  /** Retrait gauche du cercle visible : cible à 12 du bord, cercle centré dans la cible. */
  paddingLeft: EDITOR_HEADER_TARGET_INSET + EDITOR_HEADER_BACK_HIT_SLOP,
  /** Écart cercle → titre : titre à 4 après la cible de 48. */
  gap: EDITOR_HEADER_BACK_HIT_SLOP + EDITOR_HEADER_TITLE_GAP,
  /** Abscisse du centre du ✕ (centre du halo de la zone de contexte). */
  backCenterX: EDITOR_HEADER_TARGET_INSET + dimensions.backAction.touchTarget / 2,
  title: {
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 17,
    color: "#3A3A3F",
  },
  /** Trait du ✕ de l'instance Figma (`#14141A`, l'export du maître étant `#141414`). */
  closeIconTint: "#14141A",
  backCircle: {
    backgroundColor: "#FCFCFE",
    borderWidth: 1,
    borderColor: colors.background,
    shadowColor: "#1A1A26",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
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
  inheritedSeriesCount = false,
  phaseStructureLocked = false,
  contentLocked = false,
  nextPhaseId,
  onNameEndEditing,
  movementSearchAction = null,
  level = null,
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
  const sideMargin = editorSideMargin(useWindowDimensions().width);
  // PRE-6 story 7.10 (D-444) : `Terminer` est porté par la zone d'action principale fixe
  // (`PrimaryActionZone` : zone protégée, bouton centré — correctif J6f —, dégradé) ; le corps réserve sa hauteur.
  const actionZone = usePrimaryActionZone();
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
  // PRE-7 (A3.1) : panneau de repli du popover de niveau (Android, web), hébergé par une vue qui
  // couvre l'Éditeur (un toucher hors des limites du parent n'atteint pas ses enfants sur Android).
  const levelAnchorRef = useRef<View>(null);
  const levelPanelHostRef = useRef<View>(null);
  const [levelPanelPlacement, setLevelPanelPlacement] = useState<AnchoredPanelPlacement | null>(null);
  const levelMenu = level?.menu ?? null;
  const accessHitSlop = level ? LEVEL_ROW_ACCESS_HIT_SLOP : ACCESS_HIT_SLOP;

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

  // PRE-7 (A2.3, revue) : une fin de saisie du nom PROVOQUÉE par l'ouverture d'une feuille
  // (Paramètres, Catégorie, Zones) ne propose pas de geste proche — sinon la feuille de suggestion
  // se présenterait par-dessus cette feuille (deux présentations natives simultanées sur iOS).
  const nameEndSuppressedRef = useRef(false);
  // Recette JA, décision de Hermann du 26/10/2026 (« un appui sur une zone de l'écran doit fermer
  // le clavier et ne doit pas ouvrir les paramètres ou éditer la zone de description ») : tant que
  // le Nom a le focus, le corps défilant passe en `keyboardShouldPersistTaps="never"` — la
  // ScrollView native capture le premier appui hors champ de saisie et ne fait que fermer le
  // clavier — et la zone des étapes de Description ne reçoit pas le toucher (sinon l'appui sur
  // un champ d'étape, exclu de cette capture, y déplacerait la saisie). Hors saisie du Nom,
  // `handled` est inchangé (barre d'accessoire, ↑ de la Description D-351, étapes D-425).
  const [isNameFocused, setIsNameFocused] = useState(false);

  function openSheet() {
    nameEndSuppressedRef.current = true;
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
        {/* Story 4.2 (AC5) : halo concentrique au ✕ ; PRE-5 3.2 (G-1) : centre du ✕ de l'en-tête
            de l'Éditeur (`EDITOR_HEADER.backCenterX`, cible à 12 du bord). */}
        <View
          pointerEvents="none"
          style={[styles.backHalo, { left: EDITOR_HEADER.backCenterX - BACK_HALO_DIAMETER / 2 }]}
          testID="exercise-context-band-halo"
        />
        <TextInput
          value={value.name}
          onChangeText={(text) => onChange({ name: text })}
          placeholder={editor.name}
          // PRE-5 story 3.2, arbitrage G-3 de Hermann du 19/10 : placeholder `textPrimary` (Figma `8328:35698`).
          placeholderTextColor={colors.textPrimary}
          accessibilityLabel={editor.name}
          maxLength={NAME_MAX_LENGTH}
          // PRE-7 (A2.2, MFN/AC28) : nom du geste verrouillé — primitive native non modifiable.
          editable={!contentLocked}
          onFocus={() => {
            nameEndSuppressedRef.current = false;
            setIsNameFocused(true);
          }}
          onBlur={() => setIsNameFocused(false)}
          {...(onNameEndEditing
            ? {
                onEndEditing: () => {
                  if (nameEndSuppressedRef.current) {
                    nameEndSuppressedRef.current = false;
                    return;
                  }
                  onNameEndEditing();
                },
              }
            : {})}
          style={styles.nameInput}
          testID="exercise-name-input"
        />
        {/* PRE-4 story 4.3 (FR-02-05, P35 ; AC2) : chaque accès est un bouton icône +
            libellé (`Catégorie`, `Zone corporelle`) quand il n'est pas renseigné ; renseigné,
            glyphe + nom (Catégorie) ou silhouette + noms des Zones avec le séparateur de la
            capture `8328:37022`. Une seule silhouette, celle du Profil. PRE-5 story 3.2, arbitrage
            G-5 de Hermann du 19/10 : glyphes pleins au repos (instances « Icône — Catégorie » et
            « Zone corporelle — glyphe » de `8328:35698`), à la place du contour au repos de
            PRE-4 4.3 ; l'ouverture reste annoncée par `expanded`.
            PRE-5 story 3.2 (FR-38, E-V7, E-V8, E-V10) : une seule forme pour les deux registres
            (`styles.referenceAccess`) — « à renseigner » : voile blanc, glyphe et libellé
            `primary` ; « renseigné » : sans fond, libellé `textPrimary`, glyphe Catégorie plein
            teinté de sa couleur. Rien ne bouge entre les deux. Cible ≥ 44 de haut étendue vers
            le bas, sans recouvrir le Nom (`ACCESS_HIT_SLOP`, FR-22-04). */}
        <View style={[styles.referenceRow, level ? styles.referenceRowWithLevel : null]} testID="exercise-reference-row">
          <Pressable
            ref={categoryAccess}
            onPress={() => {
              nameEndSuppressedRef.current = true;
              onOpenCategory();
            }}
            // PRE-7 (A2.2, MFN-09) : Catégorie du geste verrouillé, affichée sans accès.
            {...(contentLocked ? { disabled: true } : {})}
            accessibilityRole="button"
            accessibilityLabel={
              category ? `${editor.category.label} ${category.name}` : editor.category.unsetAccessibilityLabel
            }
            // Revue 4.3 : feuille ouverte annoncée « développé », Catégorie renseignée comprise
            // (le glyphe d'une Catégorie renseignée n'a pas d'état ouvert visuel : écart E-V12).
            accessibilityState={contentLocked ? { expanded: isCategoryPickerOpen, disabled: true } : { expanded: isCategoryPickerOpen }}
            hitSlop={accessHitSlop}
            style={[styles.referenceAccess, category ? null : styles.referenceAccessUnset]}
            testID="activity-editor-category-button"
          >
            {category ? (
              <>
                {/* Sans couleur de Catégorie : glyphe non teinté (couleur du tracé source). */}
                <KodjoIcon
                  name="icon-categorie-plein"
                  size={ACCESS_GLYPH_SIZE}
                  tintColor={category.color ? category.color : undefined}
                  testID="activity-editor-category-glyph"
                />
                <Text style={[styles.referenceLabel, styles.referenceLabelSet]}>{category.name}</Text>
              </>
            ) : (
              <>
                <KodjoIcon name="icon-categorie-plein" size={ACCESS_GLYPH_SIZE} testID="activity-editor-category-icon" />
                <Text style={styles.referenceLabel} testID="activity-editor-category-label">
                  {editor.category.label}
                </Text>
              </>
            )}
          </Pressable>
          <Pressable
            ref={bodyZonesAccessRef}
            onPress={() => {
              nameEndSuppressedRef.current = true;
              Keyboard.dismiss();
              bodyZonesSheet.open();
            }}
            // PRE-7 (A2.2, MFN-09) : Zones du geste verrouillé, affichées sans accès.
            {...(contentLocked ? { disabled: true } : {})}
            accessibilityRole="button"
            // Revue 4.3 (WCAG 2.5.3) : le nom accessible contient le texte visible —
            // « Zone corporelle — non renseignée » au repos, comme la Catégorie ; renseigné,
            // les noms affichés, précédés du nom de l'accès.
            accessibilityLabel={
              zoneNames.length > 0
                ? `${t.bodyZones.accessibilityLabel} ${zoneNames.join(", ")}`
                : t.bodyZones.unsetAccessibilityLabel
            }
            accessibilityState={contentLocked ? { expanded: isBodyZonePickerOpen, disabled: true } : { expanded: isBodyZonePickerOpen }}
            hitSlop={accessHitSlop}
            style={[
              styles.referenceAccess,
              zoneNames.length > 0 ? null : styles.referenceAccessUnset,
              level ? styles.referenceAccessElastic : null,
            ]}
            testID="exercise-body-zones-open"
          >
            <BodyZoneIcon
              silhouette={silhouette}
              size={ACCESS_GLYPH_SIZE}
              filled
              testID="exercise-body-zones-icon"
            />
            <Text
              style={[styles.referenceLabel, zoneNames.length > 0 ? styles.referenceLabelSet : null]}
              numberOfLines={1}
              testID="exercise-body-zones-label"
            >
              {zoneNames.length > 0 ? zoneNames.join(t.bodyZones.bandSeparator) : t.bodyZones.unsetLabel}
            </Text>
          </Pressable>
          {level ? (
            <MovementLevelMenu
              level={level}
              accessStyles={{
                access: styles.referenceAccess,
                accessUnset: styles.referenceAccessUnset,
                label: styles.referenceLabel,
                labelSet: styles.referenceLabelSet,
              }}
              hitSlop={LEVEL_ROW_ACCESS_HIT_SLOP}
              anchorRef={levelAnchorRef}
              isPanelOpen={levelPanelPlacement !== null}
              onClosePanel={() => setLevelPanelPlacement(null)}
              onOpenPanel={(anchor) => {
                nameEndSuppressedRef.current = true;
                Keyboard.dismiss();
                const host = levelPanelHostRef.current;
                if (!host) return;
                host.measureInWindow((hostX, hostY, hostWidth) => {
                  setLevelPanelPlacement({
                    top: anchor.y - hostY + anchor.height + MOVEMENT_LEVEL_PANEL_GAP,
                    right: Math.max(0, hostX + hostWidth - (anchor.x + anchor.width)),
                  });
                });
              }}
              testID="activity-editor-level"
            />
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={bodyScrollRef}
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingHorizontal: sideMargin, paddingBottom: actionZone.scrollReserve }]}
          scrollIndicatorInsets={{ bottom: actionZone.scrollReserve }}
          // Recette JA (26/10/2026) : `never` pendant la saisie du Nom seulement (voir `isNameFocused`).
          keyboardShouldPersistTaps={isNameFocused ? "never" : "handled"}
          onLayout={(event) => {
            bodyHeightRef.current = event.nativeEvent.layout.height;
            if (isDescriptionFocused) revealDescription();
          }}
          testID="exercise-body"
        >
          {movementSearchAction ? (
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                movementSearchAction.onPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={movementSearchAction.label}
              style={styles.movementSearchLink}
              testID="activity-editor-movement-search"
            >
              <Text style={styles.movementSearchLinkLabel}>{movementSearchAction.label}</Text>
            </Pressable>
          ) : null}
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
              // Recette JA (26/10/2026) : aucun toucher pendant la saisie du Nom (voir `isNameFocused`).
              pointerEvents={isNameFocused ? "none" : "auto"}
              onLayout={(event) => {
                descriptionLayoutRef.current.stepsY = event.nativeEvent.layout.y;
                if (isDescriptionFocused) revealDescription();
              }}
              testID="exercise-description-steps-area"
            >
              <DescriptionSteps
                steps={value.instructionSteps}
                onChange={(steps) => onChange({ instructionSteps: steps })}
                editable={!contentLocked}
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
            {/* PRE-5 story 3.2 (R-14, FR-36) : la Carte ne porte plus que la Phrase — ni Compte à
                rebours, ni Fin, ni filet, à l'écran comme dans le nom accessible (la Feuille et
                les données les gardent). */}
            <Pressable
              ref={parametersCardRef}
              onPress={openSheet}
              accessibilityRole="button"
              accessibilityLabel={phrase ? `${card.openAccessibilityLabel}. ${phrase}` : `${card.openAccessibilityLabel}.`}
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
            </Pressable>
          </View>

          {/* PRE-5 story 3.2, arbitrage G-7 de Hermann du 19/10 : aucun titre « Médias » visible
              (Figma `8328:35698`) ; le titre reste un en-tête VoiceOver, sans place à l'écran. */}
          <View style={[styles.section, styles.followingSection]} testID="activity-editor-section-media">
            <Text style={styles.accessibilityOnlyTitle} accessibilityRole="header" testID="activity-editor-media-title">
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
              editable={!contentLocked}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Recette 2 (N-05) : hors de la zone qui évite le clavier — Terminer ne remonte
          jamais avec le clavier (Android : zone masquée clavier ouvert, revue 7.10) ; il redevient
          accessible dès sa fermeture (D-349).
          PRE-6 story 7.10 (D-444, remplace FR-37 « 24 du bord de l'écran ») : zone d'action
          principale fixe (zone protégée, bouton centré, correctif J6f), dégradé blanc. */}
      <PrimaryActionZone onContentHeightChange={actionZone.onContentHeightChange} testID={finishSlotTestID}>
        {errorMessage ? (
          <Text style={styles.saveErrorText} accessibilityLiveRegion="polite" testID={errorTestID}>
            {errorMessage}
          </Text>
        ) : null}
        <PrimaryActionButton label={finishLabel} onPress={onFinish} disabled={finishDisabled} testID={finishActionTestID} />
      </PrimaryActionZone>

      {isSheetOpen ? (
        <ExecutionParametersSheet
          parent={parameters}
          baseline={baselineParameters}
          profileSideRecoverySecondsDefault={profileSideRecoverySecondsDefault}
          exerciseSignals={exerciseSignals}
          inheritedSeriesCount={inheritedSeriesCount}
          // PRE-7 (A2.2) : la structure des phases fait partie du contenu verrouillé.
          phaseStructureLocked={phaseStructureLocked || contentLocked}
          nextPhaseId={nextPhaseId}
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

      {levelMenu && Platform.OS !== "ios" ? (
        <View ref={levelPanelHostRef} pointerEvents="box-none" style={styles.levelPanelHost} testID="activity-editor-level-panel-host">
          {levelPanelPlacement !== null ? (
            <MovementLevelPanel
              menu={levelMenu}
              placement={levelPanelPlacement}
              onDismiss={() => setLevelPanelPlacement(null)}
              testID="activity-editor-level-panel"
            />
          ) : null}
        </View>
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
 * PRE-5 story 3.2 (FR-38, E-V7, E-V8, E-V10) : Classification Catégorie / Zones, relevé Figma
 * `8328:35698` (à renseigner), `8328:36853` et `8328:37022` (renseigné), lecture seule du 19/10.
 * Propriétés de présentation sans jeton, constantes locales (AD-11 : `tokens.ts` inchangé).
 * Mêmes valeurs dans les deux registres : rien ne bouge entre « à renseigner » et « renseigné ».
 */
/** Glyphes des accès (Catégorie contour / plein, silhouette des Zones). */
const ACCESS_GLYPH_SIZE = 18;
/** Hauteur et rayon d’un accès. */
const ACCESS_HEIGHT = 26;
const ACCESS_RADIUS = 13;
/** Paddings d’un accès et écart glyphe → libellé. */
const ACCESS_PADDING_LEFT = 8;
const ACCESS_PADDING_RIGHT = 10;
const ACCESS_GLYPH_GAP = 6;
/** Retrait de la rangée et écart entre les deux accès. */
const ACCESS_ROW_PADDING_LEFT = 6;
const ACCESS_COLUMN_GAP = 20;
/** Registre « à renseigner » : voile blanc à 35 % (sans jeton). */
const ACCESS_UNSET_VEIL = "rgba(255, 255, 255, 0.35)";
/** Hauteur de la rangée (Figma « Sélecteurs — Catégorie / Zones corporelles ») : 32. */
const ACCESS_ROW_HEIGHT = 32;
/** FR-22-04 : cible minimale des accès (44 pt de haut). */
const ACCESS_MIN_TARGET = 44;
/**
 * FR-22-04 (cible ≥ 44 sans recouvrement) : l’accès (26) est centré dans la rangée (32), 3 sous
 * son haut. L’écart Nom → rangée étant nul (E-V4), la cible déborde de 1 vers le haut, soit
 * 2 sous le cadre du Nom (jamais sur lui), et s’étend vers le bas : 1 + 26 + 17 = 44 ; son
 * débord sous la rangée (17 − 3 = 14) reste dans la marge basse de la zone de contexte (16,
 * `overflow: hidden`). Horizontalement, la frontière entre les deux accès est au milieu de
 * leur écart de 20.
 */
const ACCESS_HIT_SLOP = {
  top: 1,
  bottom: ACCESS_MIN_TARGET - ACCESS_HEIGHT - 1,
  left: ACCESS_COLUMN_GAP / 2,
  right: ACCESS_COLUMN_GAP / 2,
} as const;
/**
 * PRE-7 (A3.1, CE-T03-04 §9, Figma `9029:18363`) : rangée Catégorie / Zones / Niveau — écart 12
 * (au lieu de 20), Zones élastiques et tronquées, Niveau à droite ; la frontière horizontale des
 * cibles reste au milieu de l'écart.
 */
const LEVEL_ROW_COLUMN_GAP = 12;
const LEVEL_ROW_ACCESS_HIT_SLOP = {
  ...ACCESS_HIT_SLOP,
  left: LEVEL_ROW_COLUMN_GAP / 2,
  right: LEVEL_ROW_COLUMN_GAP / 2,
} as const;
/** Débord de la cible sous la rangée : 17 − (32 − 26) / 2 = 14. */
const ACCESS_TARGET_OVERFLOW_BELOW_ROW = ACCESS_HIT_SLOP.bottom - (ACCESS_ROW_HEIGHT - ACCESS_HEIGHT) / 2;
/** Rangée repliée sur deux lignes : l’écart couvre le débord bas de la ligne du dessus. */
const ACCESS_ROW_GAP = ACCESS_TARGET_OVERFLOW_BELOW_ROW;

/** G-4 : interligne du Nom (Figma `6981:14889`). */
const NAME_LINE_HEIGHT = 22;
/** G-6 : interligne de la Phrase (Figma « Phrase — texte »). */
const PHRASE_LINE_HEIGHT = 20;

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
    // PRE-5 story 3.2 (E-V4) : écart Nom → rangée des accès nul (12 en PRE-4).
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
    // Centre = centre du ✕ de l’en-tête (centré dans la hauteur de contenu 48 juste
    // au-dessus de la zone) ; `left` est calculé au rendu (`EDITOR_HEADER.backCenterX`).
    top: -dimensions.header.contentHeight / 2 - BACK_HALO_DIAMETER / 2,
  },
  // Recette 2 (T-49, décision du 12/10) : aucun liseré autour du champ Nom.
  // PRE-5 story 3.2, arbitrage G-4 de Hermann du 19/10 : Inter Semi Bold 20 (`type.screenTitle`),
  // interligne local 22 (Figma `8328:35698`).
  nameInput: {
    ...type.screenTitle,
    lineHeight: NAME_LINE_HEIGHT,
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
    minHeight: ACCESS_ROW_HEIGHT,
    paddingLeft: ACCESS_ROW_PADDING_LEFT,
    columnGap: ACCESS_COLUMN_GAP,
    rowGap: ACCESS_ROW_GAP,
  },
  // PRE-5 story 3.2 : géométrie commune aux deux registres (seuls fond et couleurs changent).
  referenceAccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: ACCESS_GLYPH_GAP,
    // Hauteur minimale (PRE-4 4.6 AC5 : texte agrandi jamais plafonné ni rogné).
    minHeight: ACCESS_HEIGHT,
    maxWidth: "100%",
    paddingLeft: ACCESS_PADDING_LEFT,
    paddingRight: ACCESS_PADDING_RIGHT,
    borderRadius: ACCESS_RADIUS,
  },
  // PRE-7 (A3.1) : rangée à trois accès, sur une ligne — Zones élastiques et tronquées pour
  // préserver Catégorie et Niveau (relevé Figma MFN du 23/10).
  referenceRowWithLevel: {
    flexWrap: "nowrap",
    columnGap: LEVEL_ROW_COLUMN_GAP,
  },
  referenceAccessElastic: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  levelPanelHost: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  referenceAccessUnset: {
    backgroundColor: ACCESS_UNSET_VEIL,
  },
  referenceLabel: {
    ...type.exerciseFieldValue,
    color: colors.primary,
    flexShrink: 1,
  },
  referenceLabelSet: {
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
  },
  // Story 4.2 (AC4, AC5) ; PRE-5 3.2 (G-2) : 14 du bas du dégradé à la première section.
  // PRE-6 story 7.10 (D-444, remplace la réserve de 12 au-dessus de `Terminer`) : réserve de
  // défilement = hauteur de la zone d'action fixe, appliquée au rendu avec la marge latérale.
  bodyContent: {
    flexGrow: 1,
    paddingTop: EDITOR_VERTICAL_GRID.contextToFirstText,
  },
  // PRE-5 story 3.2 (FR-38) : titres de section en Regular 11 secondaire.
  sectionTitle: {
    ...type.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  // PRE-5 story 3.2 (FR-38, E-V10) : bloc `surfaceSubtle`, rayon 12, sans liseré ; texte au
  // fer de celui des étapes de la Description (`DESCRIPTION_STEP_GUTTER`).
  parametersCard: {
    borderRadius: fixedRadii[12],
    paddingHorizontal: DESCRIPTION_STEP_GUTTER,
    paddingVertical: spacing[12],
    backgroundColor: colors.surfaceSubtle,
  },
  // Phrase : valeurs Semi Bold ; hauteur intrinsèque, jamais tronquée. PRE-5 story 3.2,
  // arbitrage G-6 de Hermann du 19/10 : Inter Regular 14 (`type.body`), interligne local 20,
  // à la place de la taille 13 de FR-02-06.
  phrase: {
    ...type.body,
    lineHeight: PHRASE_LINE_HEIGHT,
    color: colors.textPrimary,
  },
  phraseBold: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
  },
  // PRE-5 3.2 (G-2, à la place de D-327 pour cet écran) : 10 entre un titre de section et
  // son contenu ; 16 entre deux sections.
  section: {
    gap: EDITOR_VERTICAL_GRID.titleToBlock,
  },
  // PRE-7 (A2.3) : lien de recherche des gestes — style de « Rechercher un autre geste »
  // (`9882:19141` : Medium 15, `primary`) ; cible ≥ 44 ; emplacement NON VÉRIFIABLE.
  movementSearchLink: {
    alignSelf: "flex-start",
    minHeight: minTouchTarget,
    justifyContent: "center",
    marginBottom: EDITOR_VERTICAL_GRID.blockToBlock,
  },
  movementSearchLinkLabel: {
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 15,
    lineHeight: 18,
    color: colors.primary,
  },
  followingSection: {
    marginTop: EDITOR_VERTICAL_GRID.blockToNextTitle,
  },
  // G-7 : titre lu par VoiceOver, sans place à l'écran (hors flux, 1 × 1, texte transparent,
  // opacité conservée pour rester un élément d'accessibilité).
  accessibilityOnlyTitle: {
    ...type.caption,
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    color: "transparent",
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
  // PRE-5 story 3.2, arbitrages G-8 et G-10 (Figma `8328:35738`) : gabarit de `Terminer`, devenu
  // celui de tous les boutons d'action principaux (`shared/ui/finalAction`, D-444, story 7.10).
  saveErrorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing[8],
  },
});

export const EDITOR_MIN_TOUCH_TARGET = minTouchTarget;
