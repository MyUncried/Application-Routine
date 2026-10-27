import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
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
import Reanimated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import {
  hasMissingPhaseDuration,
  validateForSave,
  type ExecutionParameters,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { generateExecutionPhrase, phraseText } from "@/domain/activities/executionPhrase";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { MovementPhaseList } from "@/domain/activities/movementPhaseList";
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
import { MovementPhasesEditor } from "@/features/activities/MovementPhasesEditor";
import { BodyZonePickerModal } from "@/features/reference-data/BodyZonePickerModal";
import { useReferenceSheet } from "@/features/reference-data/useReferenceSheet";
import { isIncompleteSummary } from "@/features/sessions/compositionPresentation";
import { strings } from "@/shared/i18n";
import { BodyZoneIcon } from "@/shared/ui/BodyZoneIcon";
import { FINAL_ACTION_SIDE_MARGIN_MIN_WIDTH, finalActionSideMargin } from "@/shared/ui/finalAction";
import { PrimaryActionButton, PrimaryActionZone, usePrimaryActionZone } from "@/shared/ui/PrimaryActionZone";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

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
   * PRE-7 (A2.3, MFN-06) : fin de la saisie du nom (clavier fermé, champ quitté ou validé).
   * PRE-7 (R-5, R04) : l'adaptateur y ferme le panneau sous le nom — Entrée ne sélectionne jamais
   * un résultat. Absent : rien.
   */
  onNameEndEditing?: () => void;
  /**
   * PRE-7 (R-5, v7 §6 R03-R04, C01) : assistance du nom — panneau des résultats et message « nom
   * déjà utilisé » (`useMovementOriginChoice`), superposé sous le champ du nom. Absent : rien.
   */
  nameAssist?: ReactNode;
  /**
   * PRE-7 (R-5, D-445 C02) : invite grise affichée après le nom conservé d'une variante
   * (« (compléter le nom) »), hors de la valeur. Absent ou `null` : aucune.
   */
  nameHint?: string | null;
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
  /**
   * PRE-8 (B.2, CE-MVT-01) : `"movement"` rend la fiche Mouvement — contenu partagé seul :
   * médias dans le gabarit photo pleine largeur en tête du corps, Description, puis bloc « Phases
   * du mouvement » (`movementPhases`, libellés sans durée) ; aucune carte ni Feuille des
   * paramètres d'exécution, aucun accordéon de médias en bas. Mêmes nom, assistance, Catégorie,
   * Zones, Niveau, médias (mêmes commandes) et `Terminer`. Défaut `"exercise"` : éditeur
   * d'Exercice inchangé.
   */
  variant?: "exercise" | "movement";
  /** PRE-8 (B.2) : structure des phases du Mouvement (variante `"movement"` seulement). */
  movementPhases?: { readonly value: MovementPhaseList; readonly onChange: (next: MovementPhaseList) => void } | null;
  /** Recette A/B B.10 (remarque 5) : le Nom prend le focus à l'ouverture (création). Défaut `false`. */
  autoFocusName?: boolean;
  /**
   * Recette A/B B.10 (b2-5) : nom déjà utilisé en création — Nom seul modifiable ; Catégorie, Zones,
   * Description, phases et médias non modifiables (consultation des médias conservée). Défaut `false`.
   */
  bodyLocked?: boolean;
  /** Recette A/B B.10 (b2-5) : Entrée garde le clavier et le focus sur le Nom (aucune fin de saisie). */
  keepNameFocusOnSubmit?: boolean;
};

/** PRE-8 (B.2, CE-MVT-01 §9) : gabarit photo de référence, 402 × 329, mis à la largeur du terminal. */
export const MOVEMENT_PHOTO_TEMPLATE = { width: 402, height: 329 } as const;

/**
 * PRE-8, recette A/B (F01) : le gabarit photo commence SOUS la zone de contexte (Figma `10453:23030` :
 * contexte 115, gabarit à y 94 dans le formulaire), dont le dégradé recouvre ses 21 premiers points.
 */
export const MOVEMENT_PHOTO_UNDER_CONTEXT = 21;

/**
 * PRE-8, correction UX « clavier » de la fiche Mouvement (KBD, 27/10/2026, remplace la remontée du
 * gabarit photo de B.10) : la zone de contexte et le gabarit photo restent FIXES ; pendant la saisie
 * de la Description ou des Phases, la couche éditable (zone qui évite le clavier et son défilement)
 * remonte devant le média jusqu'au bas de la zone de contexte, sur une surface claire translucide
 * (`colors.movementEditableSurface`), puis le champ actif est recadré au-dessus du clavier. Elle
 * redescend à la fermeture du clavier. Durée de la transition native du clavier iOS quand l'évènement
 * la donne (`MOVEMENT_EDITOR_LIFT_MS` sinon) ; « Réduire les animations » : immédiat.
 */
const MOVEMENT_EDITOR_LIFT_MS = 250;
const movementEditorLiftTiming = (duration: number) => ({
  duration,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
});

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
  nameAssist = null,
  nameHint = null,
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
  variant = "exercise",
  movementPhases = null,
  autoFocusName = false,
  bodyLocked = false,
  keepNameFocusOnSubmit = false,
}: ActivityEditorFormProps) {
  const isMovement = variant === "movement";
  const windowSize = useWindowDimensions();
  const sideMargin = editorSideMargin(windowSize.width);
  const movementPhotoHeight = Math.round((windowSize.width * MOVEMENT_PHOTO_TEMPLATE.height) / MOVEMENT_PHOTO_TEMPLATE.width);
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
  // KBD : focus d'une étape de Description ou d'une Phase, clavier (haut dans la fenêtre, durée),
  // cadre de la couche éditable (haut au repos, bas fixe) et remontée courante, en points.
  const editableFocusRef = useRef({ description: false, phases: false });
  const movementKeyboardRef = useRef({
    shown: false,
    top: 0,
    duration: MOVEMENT_EDITOR_LIFT_MS,
    restTop: 0,
    bottom: 0,
    lift: 0,
    scrollY: 0,
  });
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const descriptionLayoutRef = useRef({ sectionY: 0, stepsY: 0, activeRowBottom: 0 });
  const bodyHeightRef = useRef(0);
  // Recadrages courants, relus par les écoutes du clavier (mis à jour après chaque rendu).
  const revealRefs = useRef({ description: () => undefined as void, phases: () => undefined as void });
  function revealDescription() {
    // KBD : fiche Mouvement — remontée de la couche puis défilement complémentaire.
    if (isMovement) {
      adjustMovementLayer();
      return;
    }
    const { sectionY, stepsY, activeRowBottom } = descriptionLayoutRef.current;
    const viewport = bodyHeightRef.current;
    if (viewport <= 0) return;
    const bottom = sectionY + stepsY + activeRowBottom + DESCRIPTION_KEYBOARD_GAP;
    bodyScrollRef.current?.scrollTo({ y: Math.max(0, bottom - viewport), animated: true });
  }
  useEffect(() => {
    if (!isDescriptionFocused) return;
    const subscription = Keyboard.addListener("keyboardDidShow", () => revealRefs.current.description());
    return () => subscription.remove();
  }, [isDescriptionFocused]);
  // Recette A/B B.10 (b2-4) : Phases du mouvement — même recadrage que la Description, sur le bas
  // du bloc (la ligne d'invite, dernière, est la ligne en saisie ou juste sous elle).
  const [isPhasesFocused, setIsPhasesFocused] = useState(false);
  const phasesLayoutRef = useRef({ y: 0, height: 0 });
  // Recette du 27/10 (r11-remontee) : bas de la phase en saisie, relatif au haut du bloc (0 : inconnu).
  const phasesActiveBottomRef = useRef(0);
  function revealPhases() {
    if (isMovement) {
      adjustMovementLayer();
      return;
    }
    const { y, height } = phasesLayoutRef.current;
    const viewport = bodyHeightRef.current;
    if (viewport <= 0) return;
    bodyScrollRef.current?.scrollTo({ y: Math.max(0, y + height + DESCRIPTION_KEYBOARD_GAP - viewport), animated: true });
  }
  useEffect(() => {
    if (!isPhasesFocused) return;
    const subscription = Keyboard.addListener("keyboardDidShow", () => revealRefs.current.phases());
    return () => subscription.remove();
  }, [isPhasesFocused]);
  // KBD (voir `MOVEMENT_EDITOR_LIFT_MS`) : remontée de la couche éditable devant le média fixe.
  // Recette du 27/10 (r10-kbd-description, r10-kbd-derniere) : la couche ne remonte que de ce qu'il
  // faut pour poser le champ actif (étape en saisie, ou bas des Phases) juste au-dessus du clavier,
  // au plus jusqu'au bas de la zone de contexte ; au-delà, le contenu défile. La réserve basse du
  // défilement est la part de la couche recouverte par le clavier, mesurée dans la fenêtre (la zone
  // d'évitement du clavier, en coordonnées relatives, ne la calculait plus une fois la couche
  // déplacée). « Réduire les animations » : remontée immédiate.
  const reduceMotion = useReduceMotion();
  const editableLift = useSharedValue(0);
  const editableLayerRef = useRef<View>(null);
  // État rendu de la remontée (recalcule le style animé ; lisible par les tests).
  const [editableLiftPx, setEditableLiftPx] = useState(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [isMovementKeyboardShown, setIsMovementKeyboardShown] = useState(false);
  // Recette A/B B.10 (b2-5) : fiche Mouvement — panneau posé sous la zone de contexte, au-dessus
  // d'elle dans l'ordre d'affichage (elle passe au-dessus du média depuis F01). Hauteur relue aussi
  // par la limite de remontée de la couche éditable (r11-remontee).
  const [bandHeight, setBandHeight] = useState(0);
  function setMovementLift(target: number) {
    const k = movementKeyboardRef.current;
    // Recette du 27/10 (r11-remontee) : la couche monte au plus jusqu'à la part opaque de la zone de
    // contexte — elle glisse sous son fondu, qui se pose sur le fond blanc translucide du formulaire.
    const liftMax = Math.max(
      0,
      movementPhotoHeight - MOVEMENT_PHOTO_UNDER_CONTEXT + Math.round(bandHeight * CONTEXT_BAND_FADE_RATIO),
    );
    const next = Math.round(Math.max(0, Math.min(liftMax, target)));
    if (Math.abs(next - k.lift) < 1) return;
    k.lift = next;
    setEditableLiftPx(next);
    editableLift.set(reduceMotion ? next : withTiming(next, movementEditorLiftTiming(k.duration)));
  }
  function movementKeyboardInset(): number {
    const k = movementKeyboardRef.current;
    return k.shown ? Math.max(0, k.bottom - k.top) : 0;
  }
  function adjustMovementLayer() {
    const k = movementKeyboardRef.current;
    const focus = editableFocusRef.current;
    if (!k.shown || (!focus.description && !focus.phases)) return;
    const description = descriptionLayoutRef.current;
    const phases = phasesLayoutRef.current;
    const descriptionActiveBottom = description.sectionY + description.stepsY + description.activeRowBottom;
    // Hauteur visible du défilement, couche au repos, clavier ouvert.
    const restVisible = k.bottom - k.restTop - movementKeyboardInset();
    // Recette du 27/10 (r11-remontee, demande de Hermann) : la couche remonte jusqu'à poser le bas des
    // Phases (ligne d'invite comprise) juste au-dessus du clavier, et y reste tant que le clavier est
    // ouvert, quels que soient les changements de champ ou de contenu (elle ne redescend jamais ;
    // elle peut encore monter si le contenu s'allonge), au plus jusqu'à la part opaque de la zone de
    // contexte. Au-delà, le défilement prend la main.
    const contentBottom = (phases.height > 0 ? phases.y + phases.height : descriptionActiveBottom) + DESCRIPTION_KEYBOARD_GAP;
    setMovementLift(Math.max(k.lift, contentBottom - k.scrollY - restVisible));
    // Défilement complémentaire, seulement si la ligne en saisie (Entrée : la ligne qui suit) est cachée.
    const activeBottom =
      (focus.description
        ? descriptionActiveBottom
        : phases.y + (phasesActiveBottomRef.current > 0 ? phasesActiveBottomRef.current : phases.height)) +
      DESCRIPTION_KEYBOARD_GAP;
    const overflow = activeBottom - (k.scrollY + restVisible + k.lift);
    if (overflow > 1) bodyScrollRef.current?.scrollTo({ y: k.scrollY + overflow, animated: !reduceMotion });
  }
  const adjustMovementLayerRef = useRef(adjustMovementLayer);
  const setMovementLiftRef = useRef(setMovementLift);
  useEffect(() => {
    adjustMovementLayerRef.current = adjustMovementLayer;
    setMovementLiftRef.current = setMovementLift;
    revealRefs.current = { description: revealDescription, phases: revealPhases };
  });
  useEffect(() => {
    if (!isMovement) return;
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", (event) => {
      const k = movementKeyboardRef.current;
      k.shown = true;
      k.top = event.endCoordinates.screenY;
      if (event.duration > 0) k.duration = event.duration;
      setKeyboardInset(Math.max(0, k.bottom - k.top));
      setIsMovementKeyboardShown(true);
      adjustMovementLayerRef.current();
    });
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", (event) => {
      const k = movementKeyboardRef.current;
      k.shown = false;
      if (event.duration > 0) k.duration = event.duration;
      setKeyboardInset(0);
      setIsMovementKeyboardShown(false);
      setMovementLiftRef.current(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [isMovement]);
  function measureEditableLayer() {
    editableLayerRef.current?.measureInWindow((_x, y, _width, height) => {
      const k = movementKeyboardRef.current;
      if (height <= 0) return;
      k.bottom = y + height;
      // Haut au repos : relevé seulement couche non remontée.
      if (k.lift === 0) k.restTop = y;
    });
  }
  const editableLayerStyle = useAnimatedStyle(() => ({ marginTop: -editableLift.get() }), [editableLiftPx]);
  const onDescriptionFocusChange = (focused: boolean) => {
    setIsDescriptionFocused(focused);
    editableFocusRef.current.description = focused;
    if (focused) adjustMovementLayer();
  };
  const onPhasesFocusChange = (focused: boolean) => {
    setIsPhasesFocused(focused);
    editableFocusRef.current.phases = focused;
    if (focused) adjustMovementLayer();
  };
  // Recette A/B B.10 (b2-5) : contenu hors Nom verrouillé tant que le nom saisi est déjà utilisé.
  const isBodyLocked = contentLocked || bodyLocked;
  // PRE-7 (D-446, MFN-08) : durée de phase manquante → « Paramètres à compléter. », comme lorsque
  // la Cible d'un frère incomplet était forcée à `UNSET` (phrase `null`) avant D-446.
  const segments = parameters.mode === null || hasMissingPhaseDuration(parameters) ? null : generateExecutionPhrase(parameters);
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

  // PRE-7 (R-5) : la garde A2.3 `nameEndSuppressedRef` est retirée — le panneau sous le nom n'est
  // plus une présentation native (`nameAssist`), une fin de saisie le ferme toujours sans risque.
  // PRE-7 (R-5, R04) : position du panneau sous le nom, relevée par `onLayout` (bandeau dans son
  // parent, champ dans le bandeau) ; l'hôte en surimpression couvre le même parent.
  const [bandY, setBandY] = useState(0);
  const [nameLayout, setNameLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  // PRE-7 (R-5, R04) : hauteur du panneau bornée par l'espace disponible au-dessus du clavier
  // (haut du panneau dans la fenêtre, hauteur du clavier) — ses cartes y défilent, clavier ouvert.
  const nameAssistRef = useRef<View>(null);
  const [nameAssistTop, setNameAssistTop] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", (event) => setKeyboardHeight(event.endCoordinates.height));
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  const nameAssistMaxHeight = Math.max(NAME_ASSIST_MIN_HEIGHT, windowSize.height - keyboardHeight - nameAssistTop - NAME_ASSIST_GAP);
  // Recette JA, décision de Hermann du 26/10/2026 (« un appui sur une zone de l'écran doit fermer
  // le clavier et ne doit pas ouvrir les paramètres ou éditer la zone de description ») : tant que
  // le Nom a le focus, le corps défilant passe en `keyboardShouldPersistTaps="never"` — la
  // ScrollView native capture le premier appui hors champ de saisie et ne fait que fermer le
  // clavier — et la zone des étapes de Description ne reçoit pas le toucher (sinon l'appui sur
  // un champ d'étape, exclu de cette capture, y déplacerait la saisie). Hors saisie du Nom,
  // `handled` est inchangé (barre d'accessoire, ↑ de la Description D-351, étapes D-425).
  const [isNameFocused, setIsNameFocused] = useState(false);
  // Recette du 27/10 (remarque 3) : menu Niveau natif (iOS) affiché — voile transparent qui absorbe
  // le toucher hors du menu (le système ferme le menu) ; il se retire aussi au premier toucher.
  const [isNativeLevelMenuOpen, setIsNativeLevelMenuOpen] = useState(false);
  // Recette du 27/10 (r11-menu-dehors) : le signal d'apparition du menu ne venait qu'à la première
  // ouverture — à chaque fermeture, l'hôte natif du menu est recréé (génération suivante) pour que
  // l'ouverture suivante le signale de nouveau.
  const [levelMenuGeneration, setLevelMenuGeneration] = useState(0);
  function onNativeLevelMenuVisibilityChange(visible: boolean) {
    setIsNativeLevelMenuOpen(visible);
    if (!visible) setLevelMenuGeneration((generation) => generation + 1);
  }
  // Recette du 27/10 (r11-remontee, demande de Hermann) : clavier ouvert sur la Description ou les
  // Phases, Nom, Catégorie, Zones et Niveau sont inactifs — un toucher sur la zone de contexte ferme
  // seulement le clavier (et le formulaire reprend sa place).
  const isEditableKeyboardOpen = isMovement && (isDescriptionFocused || isPhasesFocused) && isMovementKeyboardShown;
  // Recette du 27/10 (r13-limite, demande de Hermann) : fiche Mouvement, clavier ouvert — le défilement
  // s'arrête quand la dernière ligne des Phases est juste au-dessus du clavier : la réserve de la zone
  // d'action (masquée par le clavier) est remplacée par l'écart au clavier.
  const bodyBottomReserve = isMovement && isMovementKeyboardShown ? DESCRIPTION_KEYBOARD_GAP : actionZone.scrollReserve;

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

  function renderMediaList(template?: { readonly width: number; readonly height: number }) {
    return (
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
        editable={!isBodyLocked}
        {...(template ? { template } : {})}
      />
    );
  }

  function applyParameters(next: ExecutionParameters) {
    onChange({ executionParameters: next });
    closeSheet();
  }

  return (
    <>
      <View
        style={[styles.contextBand, isMovement ? styles.movementContextBand : null, { paddingHorizontal: sideMargin }]}
        onLayout={(event) => {
          setBandY(event.nativeEvent.layout.y);
          setBandHeight(event.nativeEvent.layout.height);
        }}
        testID="exercise-context-band"
      >
        {/* PRE-8, recette A/B (F01) : sur la fiche Mouvement, la « Zone bleue » se fond dans le média
            qui passe dessous (`#EAEAFF` → transparent, Figma `10453:23033`), sans bande blanche. */}
        {isMovement ? (
          <View pointerEvents="none" style={styles.movementContextBandFill} testID="movement-context-band-fill">
            <View style={styles.movementContextBandSolid} />
            <View style={styles.contextBandFade}>
              {MOVEMENT_CONTEXT_BAND_FADE_LAYERS.map((layer) => (
                <View key={layer.bottom} style={[styles.movementContextBandFadeLayer, { bottom: layer.bottom, opacity: layer.opacity }]} />
              ))}
            </View>
          </View>
        ) : null}
        {/* Recette 1 (T-49) — effets figés de la « Zone bleue » (3542:4656, ch. 12 l.1490) :
            fondu vers le fond de l’écran sur les 20 % inférieurs, puis « Halo blanc —
            bouton Annuler » (5752:4044, Ø 59,28) concentrique au bouton Retour de
            l’en-tête, dont seule la partie qui déborde dans la zone est visible. Tous deux
            sous le contenu, sans interaction. */}
        {isMovement ? null : (
          <View pointerEvents="none" style={styles.contextBandFade} testID="exercise-context-band-fade">
            {CONTEXT_BAND_FADE_LAYERS.map((layer) => (
              <View key={layer.top} style={[styles.contextBandFadeLayer, { top: layer.top, opacity: layer.opacity }]} />
            ))}
          </View>
        )}
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
            setIsNameFocused(true);
            // KBD : la saisie du Nom n'est pas concernée — la couche éditable reprend sa place.
            setMovementLift(0);
          }}
          onBlur={() => setIsNameFocused(false)}
          autoFocus={autoFocusName}
          // Recette A/B B.10 (b2-5) : nom déjà utilisé — Entrée ne quitte pas le Nom (clavier conservé).
          {...(keepNameFocusOnSubmit ? { submitBehavior: "submit" as const } : {})}
          {...(onNameEndEditing ? { onEndEditing: onNameEndEditing } : {})}
          // PRE-7 (R-5, C02) : l'invite grise est annoncée, sans entrer dans la valeur.
          {...(nameHint ? { accessibilityHint: nameHint } : {})}
          onLayout={(event) => setNameLayout(event.nativeEvent.layout)}
          style={styles.nameInput}
          testID="exercise-name-input"
        />
        {nameHint ? (
          // PRE-7 (R-5, D-445 C02 ; `10187:20340`) : invite grise « (compléter le nom) » après le nom
          // conservé — un texte superposé au champ (nom transparent puis invite), jamais une partie
          // de la valeur : elle n'est ni persistée ni comptée dans l'unicité, et disparaît à la
          // reprise de saisie (l'adaptateur retire `nameHint`) sans effacer le nom.
          <View
            pointerEvents="none"
            style={[
              styles.nameHintOverlay,
              { left: nameLayout.x, top: nameLayout.y, width: nameLayout.width, height: nameLayout.height },
            ]}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            testID="exercise-name-hint"
          >
            <Text style={styles.nameHintText} numberOfLines={1}>
              <Text style={styles.nameHintMask}>{value.name}</Text>
              <Text style={styles.nameHintLabel}>{` ${nameHint}`}</Text>
            </Text>
          </View>
        ) : null}
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
            onPress={onOpenCategory}
            // PRE-7 (A2.2, MFN-09) : Catégorie du geste verrouillé, affichée sans accès.
            {...(isBodyLocked ? { disabled: true } : {})}
            accessibilityRole="button"
            accessibilityLabel={
              category ? `${editor.category.label} ${category.name}` : editor.category.unsetAccessibilityLabel
            }
            // Revue 4.3 : feuille ouverte annoncée « développé », Catégorie renseignée comprise
            // (le glyphe d'une Catégorie renseignée n'a pas d'état ouvert visuel : écart E-V12).
            accessibilityState={isBodyLocked ? { expanded: isCategoryPickerOpen, disabled: true } : { expanded: isCategoryPickerOpen }}
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
              Keyboard.dismiss();
              bodyZonesSheet.open();
            }}
            // PRE-7 (A2.2, MFN-09) : Zones du geste verrouillé, affichées sans accès.
            {...(isBodyLocked ? { disabled: true } : {})}
            accessibilityRole="button"
            // Revue 4.3 (WCAG 2.5.3) : le nom accessible contient le texte visible —
            // « Zone corporelle — non renseignée » au repos, comme la Catégorie ; renseigné,
            // les noms affichés, précédés du nom de l'accès.
            accessibilityLabel={
              zoneNames.length > 0
                ? `${t.bodyZones.accessibilityLabel} ${zoneNames.join(", ")}`
                : t.bodyZones.unsetAccessibilityLabel
            }
            accessibilityState={isBodyLocked ? { expanded: isBodyZonePickerOpen, disabled: true } : { expanded: isBodyZonePickerOpen }}
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
              onNativeMenuVisibilityChange={onNativeLevelMenuVisibilityChange}
              nativeMenuGeneration={levelMenuGeneration}
              testID="activity-editor-level"
            />
          ) : null}
        </View>
        {isEditableKeyboardOpen ? (
          <Pressable
            onPress={() => Keyboard.dismiss()}
            accessible={false}
            importantForAccessibility="no"
            style={styles.contextKeyboardShield}
            testID="movement-context-keyboard-shield"
          />
        ) : null}
      </View>

      {isMovement ? (
        // PRE-8 (B.2, CE-MVT-01 §7, §9) ; recette A/B (F01, F02) : média pleine largeur, fixe, sous la
        // zone de contexte (qui le recouvre de `MOVEMENT_PHOTO_UNDER_CONTEXT`) et hors du défilement du
        // contenu inférieur. Le gabarit garde sa hauteur sans média (ajout depuis le gabarit vide).
        // La hauteur suit la largeur du terminal (402 × 329 en référence).
        // KBD (27/10) : le gabarit ne bouge jamais avec le clavier ; la couche éditable passe devant.
        <View style={[styles.movementPhotoTemplate, { height: movementPhotoHeight }]} testID="movement-photo-template">
          {renderMediaList({ width: windowSize.width, height: movementPhotoHeight })}
        </View>
      ) : null}

      {/* KBD : couche éditable — au-dessus du média (ordre d'affichage), sous la zone de contexte
          (`zIndex` 1) ; sa marge haute animée la fait remonter devant le média pendant la saisie. */}
      <Reanimated.View
        style={[styles.flex, isMovement ? [styles.movementEditableLayer, editableLayerStyle] : null]}
        testID={editableLiftPx > 0 ? "movement-editable-layer-lifted" : "movement-editable-layer"}
      >
      <View ref={editableLayerRef} style={styles.flex} onLayout={isMovement ? measureEditableLayer : undefined}>
      {/* KBD : fiche Mouvement — réserve basse mesurée dans la fenêtre (`keyboardInset`) à la place de
          l'évitement relatif du clavier ; Éditeur d'Exercice inchangé.
          Recette du 27/10 (r12-limite) : sans comportement pour la fiche Mouvement — en `padding`, la
          zone d'évitement, même désactivée, remplaçait cette réserve par 0 : le défilement passait sous
          le clavier et la fin du contenu restait inatteignable. */}
      <KeyboardAvoidingView
        style={[styles.flex, isMovement ? { paddingBottom: keyboardInset } : null]}
        behavior={Platform.OS === "ios" && !isMovement ? "padding" : undefined}
        enabled={!isMovement}
        testID="editor-keyboard-reserve"
      >
        <ScrollView
          ref={bodyScrollRef}
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingHorizontal: sideMargin, paddingBottom: bodyBottomReserve }]}
          scrollIndicatorInsets={{ bottom: bodyBottomReserve }}
          // Recette JA (26/10/2026) : `never` pendant la saisie du Nom seulement (voir `isNameFocused`).
          // Recette du 27/10 (r10-kbd-description) : fiche Mouvement — toucher le formulaire hors d'un
          // champ (titre de section…) ne ferme pas le clavier (`always`) ; Éditeur d'Exercice inchangé.
          keyboardShouldPersistTaps={isNameFocused ? "never" : isMovement ? "always" : "handled"}
          onScroll={(event) => {
            movementKeyboardRef.current.scrollY = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
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
            {/* PRE-8, recette A/B (F03) : « Description du mouvement » sur la fiche Mouvement (Figma
                `10453:23036`) ; libellé de l'Éditeur d'Exercice inchangé. */}
            <Text style={styles.sectionTitle} accessibilityRole="header" testID="activity-editor-description-title">
              {isMovement ? strings.screens.movement.descriptionTitle : t.instruction.label}
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
                editable={!isBodyLocked}
                onFocusChange={onDescriptionFocusChange}
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

          {isMovement ? (
            // PRE-8 (B.2, CE-MVT-01 §7) : phases du Mouvement (libellés, ordre), jamais de durée.
            movementPhases ? (
              <View
                style={[styles.section, styles.followingSection]}
                onLayout={(event) => {
                  phasesLayoutRef.current = { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height };
                  if (isPhasesFocused) revealPhases();
                }}
                testID="movement-section-phases"
              >
                {/* Recette A/B B.10 (b2-4) : même place réservée et même ↑ que la Description (D-351) :
                    ↑ ferme seulement le clavier, rien n'est enregistré. */}
                <View style={styles.descriptionStepsWithSend}>
                  <MovementPhasesEditor
                    value={movementPhases.value}
                    onChange={movementPhases.onChange}
                    editable={!isBodyLocked}
                    onFocusChange={onPhasesFocusChange}
                    onActiveRowBottomChange={(bottom) => {
                      phasesActiveBottomRef.current = bottom;
                      if (isPhasesFocused) revealPhases();
                    }}
                  />
                </View>
                {isPhasesFocused ? (
                  <Pressable
                    onPress={() => Keyboard.dismiss()}
                    accessibilityRole="button"
                    accessibilityLabel={strings.screens.movement.phasesSubmitAccessibilityLabel}
                    hitSlop={(minTouchTarget - DESCRIPTION_SEND_SIZE) / 2}
                    style={styles.descriptionSend}
                    testID="movement-phases-submit"
                  >
                    <Text style={styles.descriptionSendSymbol}>↑</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null
          ) : (
            <>
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
              <Text
                // PRE-7 (D-448, point 7) : « Paramètres à compléter. » en `colors.danger`.
                style={[styles.phrase, isIncompleteSummary(phrase) ? styles.phraseIncomplete : null]}
                testID="exercise-parameters-phrase"
              >
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
            </>
          )}

          {/* PRE-5 story 3.2, arbitrage G-7 de Hermann du 19/10 : aucun titre « Médias » visible
              (Figma `8328:35698`) ; le titre reste un en-tête VoiceOver, sans place à l'écran.
              PRE-8 (B.2) : section absente de la fiche Mouvement (médias dans le gabarit photo). */}
          {isMovement ? null : (
          <View style={[styles.section, styles.followingSection]} testID="activity-editor-section-media">
            <Text style={styles.accessibilityOnlyTitle} accessibilityRole="header" testID="activity-editor-media-title">
              {strings.executionParameters.media.section}
            </Text>
            {renderMediaList()}
          </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
      </Reanimated.View>

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

      {isNativeLevelMenuOpen ? (
        <Pressable
          onPress={() => onNativeLevelMenuVisibilityChange(false)}
          accessible={false}
          importantForAccessibility="no"
          style={styles.levelMenuShield}
          testID="activity-editor-level-menu-shield"
        />
      ) : null}

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

      {nameAssist ? (
        // PRE-7 (R-5, v7 §6 R03-R04 ; `9882:19049`) : panneau superposé sous le nom, clavier visible,
        // dans un hôte qui couvre l'Éditeur (un toucher hors des limites du parent n'atteint pas ses
        // enfants sur Android) ; l'hôte laisse passer les touchers hors du panneau.
        <View pointerEvents="box-none" style={[styles.levelPanelHost, isMovement ? styles.movementOverlayHost : null]} testID="exercise-name-assist-host">
          <View
            ref={nameAssistRef}
            onLayout={() => nameAssistRef.current?.measureInWindow((_x, y) => setNameAssistTop(y))}
            style={[
              styles.nameAssist,
              {
                top: isMovement ? bandY + bandHeight : bandY + nameLayout.y + nameLayout.height,
                left: sideMargin,
                right: sideMargin,
                maxHeight: nameAssistMaxHeight,
              },
            ]}
            testID="exercise-name-assist"
          >
            {nameAssist}
          </View>
        </View>
      ) : null}

      {levelMenu && Platform.OS !== "ios" ? (
        <View
          ref={levelPanelHostRef}
          pointerEvents="box-none"
          style={[styles.levelPanelHost, isMovement ? styles.movementOverlayHost : null]}
          testID="activity-editor-level-panel-host"
        >
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
/** PRE-7 (R-5, R04) : écart entre le panneau sous le nom et le clavier ; hauteur minimale du panneau. */
const NAME_ASSIST_GAP = 8;
const NAME_ASSIST_MIN_HEIGHT = 120;
/** PRE-7 (R-5, C02) : gris de l'invite « (compléter le nom) », lu sur `10187:20340`. */
const NAME_HINT_COLOR = "#7A7A80";
/** G-6 : interligne de la Phrase (Figma « Phrase — texte »). */
const PHRASE_LINE_HEIGHT = 20;

/** Halo figé sous le bouton Retour (« Halo blanc — bouton Annuler », 5752:4044). */
const BACK_HALO_DIAMETER = 59.28;
/** Fondu figé : opaque jusqu’à 80 %, transparent à 100 % (GRADIENT_LINEAR de la « Zone bleue »). */
const CONTEXT_BAND_FADE_SHARE = "20%";
/** Même part, en fraction de la hauteur de la zone (limite haute de la couche éditable, r11-remontee). */
const CONTEXT_BAND_FADE_RATIO = 0.2;
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

/**
 * PRE-8, recette A/B (F01) : rampe inverse de `CONTEXT_BAND_FADE_LAYERS` — couches `#EAEAFF`
 * superposées, ancrées en haut de la part fondue, dont l'opacité cumulée descend de 1 à 0.
 */
const MOVEMENT_CONTEXT_BAND_FADE_LAYERS = Array.from({ length: CONTEXT_BAND_FADE_LAYER_COUNT }, (_, index) => {
  const before = index / CONTEXT_BAND_FADE_LAYER_COUNT;
  const after = (index + 1) / CONTEXT_BAND_FADE_LAYER_COUNT;
  return {
    bottom: `${(before * 100).toFixed(4)}%` as `${number}%`,
    opacity: Number((1 - (1 - after) / (1 - before)).toFixed(4)),
  };
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  // F01 : fond porté par le dégradé ; la zone passe au-dessus du média qui la prolonge.
  movementContextBand: {
    backgroundColor: "transparent",
    zIndex: 1,
  },
  movementContextBandFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  movementContextBandSolid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: CONTEXT_BAND_FADE_SHARE,
    backgroundColor: colors.exerciseEditorContextBand,
  },
  movementContextBandFadeLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.exerciseEditorContextBand,
  },
  movementPhotoTemplate: {
    marginTop: -MOVEMENT_PHOTO_UNDER_CONTEXT,
    overflow: "hidden",
    backgroundColor: colors.mediaSurface,
  },
  // r11-remontee (27/10) : voile de la zone de contexte clavier ouvert, sans rendu.
  contextKeyboardShield: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  // Remarque 3 (27/10) : voile du menu Niveau natif, au-dessus de tout l'écran, sans rendu.
  levelMenuShield: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
  },
  // KBD : surface claire translucide de la couche éditable, qui recouvre le média quand elle remonte.
  movementEditableLayer: {
    backgroundColor: colors.movementEditableSurface,
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
  nameAssist: {
    position: "absolute",
  },
  nameHintOverlay: {
    position: "absolute",
    justifyContent: "center",
    paddingHorizontal: dimensions.exerciseTextField.paddingHorizontal,
  },
  nameHintText: {
    ...type.screenTitle,
    lineHeight: NAME_LINE_HEIGHT,
  },
  nameHintMask: {
    color: "transparent",
  },
  nameHintLabel: {
    // Gris de l'invite relevé sur `10187:20340` (valeur de rendu, `tokens.ts` inchangé).
    color: NAME_HINT_COLOR,
  },
  levelPanelHost: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  // Recette A/B B.10 (b2-5) : au-dessus de la zone de contexte de la fiche Mouvement (`zIndex` 1, F01).
  movementOverlayHost: {
    zIndex: 2,
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
  phraseIncomplete: {
    color: colors.danger,
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
