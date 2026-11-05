import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import {
  cloneExecutionParameters,
  createEmptyExecutionParameters,
  executionParametersEqual,
  validateForSave,
  type ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import { decodeInstructionSteps, encodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { repriseExecutionParameters } from "@/domain/activities/Movement";
import type { MovementPhaseList } from "@/domain/activities/movementPhaseList";
import { variantLevelPosition } from "@/domain/activities/movementSuggestion";
import {
  decideMovementSave,
  movementContentChanged,
  movementContentOf,
  type MovementContentSnapshot,
  type MovementSaveDecision,
} from "@/domain/activities/movementSave";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import {
  DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
  DEFAULT_EXERCISE_END_SECONDS,
  DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
  DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
  type Silhouette,
} from "@/domain/preferences/Profile";
import { exitCircuit } from "@/domain/sessions/circuit";
import { settleCircuitMembership, type CircuitMembershipSettlement } from "@/domain/sessions/circuitMembership";
import { appendActivityAfterLastDisplayed } from "@/domain/sessions/composition";
import {
  createExerciseDraft,
  draftMovementOf,
  exerciseEquals,
  movementContentOfDraft,
  replaceOccurrence,
  replaceOccurrenceWithNewMovement,
  withDraftMovement,
  withExerciseRecovery,
  withOccurrenceMovement,
  withoutPhasesToVerify,
  withProfileDefaultsValidated,
  type SessionDraft,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import type { MovementLevelOrigin } from "@/domain/sessions/Session";
import {
  ActivityEditorForm,
  EDITOR_HEADER,
  editorSideMargin,
  isActivityEditorFormValid,
  type ActivityEditorFormValue,
  type EditorCategory,
} from "@/features/activities/ActivityEditorForm";
import type { ActivityDefinitionService, MovementLevels } from "@/features/activities/ActivityDefinitionService";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import type { EditorLevel, MovementLevelMenuModel } from "@/features/activities/MovementLevelMenu";
import { MovementLevelsScreen } from "@/features/activities/MovementLevelsScreen";
import { MovementSaveDialog } from "@/features/activities/MovementSaveDialog";
import { useMovementOriginChoice } from "@/features/activities/useMovementOriginChoice";
import { useProfileService } from "@/features/preferences/ProfileServiceContext";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { useReferentialService } from "@/features/reference-data/ReferentialServiceContext";
import { useReferenceSheet } from "@/features/reference-data/useReferenceSheet";
import { CircuitEntryConfirmModal } from "@/features/sessions/CircuitEntryConfirmModal";
import { insertIntoRichLayout } from "@/features/sessions/compositionLayout";
import { inheritsCircuitSeriesCount } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { ExerciseExitConfirmModal } from "@/features/sessions/ExerciseExitConfirmModal";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Référentiel persistant des Zones corporelles, chargé via
 * `ActivityDefinitionService` (même connexion SQLite que `SessionService`) —
 * jamais `BODY_ZONES`. `refreshToken` relit le référentiel à la fermeture du
 * sélecteur de Zones (R6).
 */
export function useBodyZonesReferential(
  activityDefinitionService: ActivityDefinitionService,
  refreshToken: number = 0,
): readonly BodyZone[] {
  const [zones, setZones] = useState<readonly BodyZone[]>([]);
  useEffect(() => {
    let cancelled = false;
    activityDefinitionService.listBodyZones().then(
      (result) => {
        if (!cancelled) {
          setZones(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les Zones corporelles.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, refreshToken]);
  return zones;
}

/**
 * Catégories (affichage de la pilule) — rechargées à la fermeture du
 * sélecteur, pour refléter une création / un renommage / un retrait.
 */
export function useCategories() {
  const referentialService = useReferentialService();
  const [categories, setCategories] = useState<readonly Category[]>([]);
  const reload = useCallback(() => {
    referentialService.listCategories().then(setCategories, (error: unknown) => {
      console.error("Impossible de charger les catégories.", error);
    });
  }, [referentialService]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { categories, reload };
}

/**
 * Défauts du Profil lus une seule fois : Pause entre les côtés (copiée à
 * l'ACTIVATION du changement de côté), Compte à rebours et Fin (copiés à la
 * création d'un nouvel Exercice uniquement — jamais relus pour un objet
 * existant, P3-10), silhouette du sélecteur de Zones.
 */
export function useProfileDefaults() {
  const profileService = useProfileService();
  const [defaults, setDefaults] = useState<{
    readonly loaded: boolean;
    readonly sideRecovery: number;
    readonly countdown: number;
    readonly end: number;
    /** PRE-9 (01/11/2026, point 2) : « Récupération après un exercice », reprise par un nouvel Exercice de Séance. */
    readonly recovery: number;
    readonly silhouette: Silhouette | null;
  }>({
    loaded: false,
    sideRecovery: DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
    countdown: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
    end: DEFAULT_EXERCISE_END_SECONDS,
    recovery: DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
    silhouette: null,
  });
  useEffect(() => {
    let cancelled = false;
    profileService.getProfile().then(
      (profile) => {
        if (!cancelled) {
          setDefaults({
            loaded: true,
            sideRecovery: profile.sideChangeRecoverySecondsDefault,
            countdown: profile.exerciseCountdownSecondsDefault,
            end: profile.exerciseEndSecondsDefault,
            recovery: profile.postActivityRecoverySecondsDefault,
            silhouette: profile.silhouette,
          });
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger le Profil.", error);
          setDefaults((current) => ({ ...current, loaded: true }));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileService]);
  return defaults;
}

export function toEditorCategory(categoryId: string | null, categories: readonly Category[]): EditorCategory {
  if (!categoryId) return null;
  const found = categories.find((candidate) => candidate.id === categoryId);
  // Q53 (8) : une Catégorie retirée encore affectée reste affichée (nom et pastille) ; Q53 (9) :
  // sans avis textuel dans l'Éditeur.
  return found ? { name: found.name, color: found.color } : null;
}

function createEmptyFormValue(): ActivityEditorFormValue {
  return {
    name: "",
    instructionSteps: [],
    executionParameters: createEmptyExecutionParameters({
      countdownSeconds: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
      endSeconds: DEFAULT_EXERCISE_END_SECONDS,
    }),
    bodyZoneIds: [],
    media: [],
  };
}

/**
 * Nouveau brouillon : Compte à rebours et Fin reçoivent les défauts du
 * Profil dès leur lecture — uniquement si le brouillon est encore intact
 * (aucune rétroactivité sur une saisie déjà commencée, P3-10).
 */
function withProfilePhases(parameters: ExecutionParametersInput, countdown: number, end: number): ExecutionParametersInput {
  return { ...parameters, countdownSeconds: countdown, endSeconds: end };
}

/**
 * PRE-4 story 4.2 (FR-02-03, FR-02-04 ; AC4, AC5) : en-tête fixe de l'Éditeur —
 * ✕ circulaire par la prop locale `closeIcon` de `FixedHeader` (composant partagé,
 * autres écrans inchangés) et marge latérale de l'Éditeur (24, ou 16 sous 390).
 * Libellé accessible : celui du code de départ (`Retour`), inchangé.
 */
export function EditorHeader({
  title,
  onClose,
  accessibilityLabel,
  trailing,
  topInset,
  validate,
}: {
  title: string;
  onClose: () => void;
  accessibilityLabel: string;
  trailing?: ReactNode;
  /** Coche « Valider » à droite de l'en-tête (variante « Fermer et valider », §18–§19). */
  validate?: { readonly onPress: () => void; readonly enabled: boolean; readonly accessibilityLabel: string };
  /** Feuille : marge haute de l'en-tête (`FixedHeader.topInset`). */
  topInset?: number;
}) {
  const { width } = useWindowDimensions();
  return (
    <FixedHeader
      title={title}
      onBack={onClose}
      backAccessibilityLabel={accessibilityLabel}
      closeIcon
      horizontalPadding={editorSideMargin(width)}
      // PRE-5 story 3.2, arbitrage G-1 de Hermann du 19/10 : en-tête de l'Éditeur selon Figma
      // `5544:4503` (✕ à 12 du bord, titre Inter Medium 17), sans changer les autres écrans.
      layoutStyle={{ paddingLeft: EDITOR_HEADER.paddingLeft, gap: EDITOR_HEADER.gap }}
      backCircleStyle={EDITOR_HEADER.backCircle}
      titleStyle={EDITOR_HEADER.title}
      backIconTintColor={EDITOR_HEADER.closeIconTint}
      trailing={trailing}
      {...(topInset !== undefined ? { topInset } : {})}
      {...(validate !== undefined ? { validate } : {})}
    />
  );
}

/**
 * Route « Créer / Modifier un exercice » — point d'entrée unique de
 * `app/(creation)/exercise.tsx` : Exercice d'une Séance (sans paramètre / `exerciseId`),
 * appliqué au brouillon de Composition à « Terminer » ; « Continuer » (Composition) reste seul à
 * persister la Séance.
 *
 * [PRE-9 A.3 du 04/11/2026 : le parcours `catalogueDefinitionId=new` / `<id>` (définition du
 * Catalogue, création sur un geste repris, « Ajouter un niveau » depuis la fiche d'un Exercice du
 * Catalogue) est retiré avec les anciennes définitions — décision de Hermann du 04/11/2026 :
 * « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens exercices concernés par
 * cette conversion peuvent être supprimés plutôt que migrés. » L'écran n'édite plus qu'un Exercice
 * de Séance.]
 *
 * PRE-7 (A2.2, D-437, D-438, MFN-06, MFN-08, MFN-09 ; CE-T03-04 §3) : occurrence de Séance d'un
 * Mouvement enregistré : contenu verrouillé, déverrouillé par le crayon « Modifier le mouvement »
 * (PRE-7 R-4, D-445 C04) ; une création locale reste modifiable.
 *
 * PRE-7 (R-4, D-445 C03, v7 §3) : la sauvegarde d'un Mouvement existant modifié suit la décision
 * unique `decideMovementSave` et le dialogue centré `MovementSaveDialog`.
 *
 * Commun : ✓ de la feuille Paramètres n'applique qu'au brouillon parent
 * (aucune écriture) ; garde d'abandon (Annuler conserve tout, Confirmer
 * abandonne et nettoie uniquement les copies préparées non référencées) ;
 * une seule opération en vol ; aucune Récupération automatique.
 *
 * PRE-4 (story 1.1, AD-13) : le ✓ de la Feuille et `Terminer` appellent la
 * validation unique `validateForSave` avec la ligne de base relue à
 * l'ouverture de l'Éditeur (aucune en création) : une valeur héritée hors
 * bornes non modifiée reste enregistrable (H25), une Cible `UNSET` bloque.
 * Les paramètres typés sont la seule donnée transmise (aucune projection
 * scalaire dans l'écran).
 */
export function ExerciseScreen() {
  return <CompositionExerciseEditor />;
}

/** Décision C03 qui ouvre le dialogue de sauvegarde (nom modifié, ou confirmation). */
type DialogDecision = Extract<MovementSaveDecision, { readonly kind: "CHOICE" | "CONFIRM" }>;

/**
 * PRE-7 (A2.2, D-438, relevé Figma MFN du 23/10 `9952:44374`) : action « Modifier le mouvement » de
 * l'en-tête (création sur geste repris, et occurrence de Séance d'un Mouvement enregistré, R-4, C04) — 40 × 32, fond `#F3F4F9`, rayon 10, crayon au trait 20 × 20 ; cible portée à 44 par
 * `hitSlop`. Constantes locales, `tokens.ts` inchangé.
 */
const EDIT_MOVEMENT_ACTION = { width: 40, height: 32, radius: 10, background: "#F3F4F9" } as const;

/**
 * PRE-7 (R-9, D-448 point 10, recette JA2 nv-9) : `active` — édition du mouvement en cours sur une
 * occurrence de Séance : le crayon reste affiché, à l'état actif (`accessibilityState.selected`,
 * fond `colors.primary` et crayon `colors.background`, jetons existants ; rendu `NON VÉRIFIABLE`,
 * Figma ne dessine pas cet état). Le toucher alors quitte l'édition (`CompositionExerciseEditor`).
 */
export function EditMovementAction({ onPress, active = false }: { onPress: () => void; active?: boolean }) {
  const label = strings.screens.activities.editor.editMovement;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      accessibilityHint={active ? strings.screens.activities.editor.editMovementActiveHint : undefined}
      hitSlop={{
        top: (minTouchTarget - EDIT_MOVEMENT_ACTION.height) / 2,
        bottom: (minTouchTarget - EDIT_MOVEMENT_ACTION.height) / 2,
        left: (minTouchTarget - EDIT_MOVEMENT_ACTION.width) / 2,
        right: (minTouchTarget - EDIT_MOVEMENT_ACTION.width) / 2,
      }}
      style={[styles.editMovementAction, active ? styles.editMovementActionActive : null]}
      testID="activity-editor-edit-movement"
    >
      <KodjoIcon
        name="edit-movement"
        tintColor={active ? colors.background : undefined}
        testID="activity-editor-edit-movement-icon"
      />
    </Pressable>
  );
}

/**
 * PRE-7 (A3.1, D-439, MFN-05, MFN-07, MFN-10) : modèle de la pastille de Niveau de la fiche — rang
 * dérivé, et popover (niveaux du groupe, Exercices distingués par le résumé de leurs paramètres).
 * Lecture en échec : pastille vide, sans popover.
 *
 * PRE-7 (R-6, D-445 C09, v7 l.67, MFN-09 l.410, CE-UI-NIV-01 §3) : la commande est active hors
 * crayon dans tous les contextes — Exercice du Catalogue (choix par Exercice), reprise et occurrence
 * de Séance (choix par mouvement, `movementChoice`), même sans groupe (« Niveau »). `menu` `null` :
 * pastille affichée seule (contenu en cours d'édition par le crayon).
 */
export function editorLevelOf(
  levels: MovementLevels | "error" | null,
  menu: Omit<MovementLevelMenuModel, "levels"> | null,
): EditorLevel | null {
  if (levels === null) return null;
  if (levels === "error") return { position: null, menu: null };
  if (menu === null) {
    return { position: levels.position, menu: null };
  }
  const total = levels.position?.total ?? 0;
  return {
    position: levels.position,
    menu: {
      ...menu,
      levels: levels.levels.map((entry) => ({
        rank: entry.rank,
        total,
        name: entry.movement.name,
        // PRE-8 (B.8, Q5, Q6) : un membre archivé garde son rang mais n'est pas sélectionnable.
        movementId: entry.archived === true ? undefined : entry.movement.id,
        // Recette A/B B.10 (q6-2) : et il est signalé « (archivé) » dans le menu.
        archived: entry.archived === true,
        // [PRE-9 A.3 du 04/11/2026 : plus d'Exercice du Catalogue par niveau (anciennes définitions
        // supprimées) ; le choix se fait par mouvement (`movementChoice`).]
        exercises: [],
      })),
    },
  };
}

/**
 * PRE-7 (R-6) : niveaux relus après un changement de niveau dans le MÊME groupe — mêmes membres,
 * position du mouvement choisi ; rien n'est relu ni reclassé (C09).
 */
function levelsAfterChange(levels: MovementLevels, movementId: string): MovementLevels {
  const entry = levels.levels.find((candidate) => candidate.movement.id === movementId);
  if (entry === undefined || levels.position === null) return levels;
  return { position: { rank: entry.rank, total: levels.position.total }, levels: levels.levels };
}

/** Aucun choix par Exercice hors fiche d'un Exercice du Catalogue (choix par mouvement). */
function noExerciseChoice() {
  return undefined;
}

/**
 * PRE-5 story 3.1 (AC4, AC5) : comparaison d'une occurrence en cours d'édition à son
 * état initial, la Description comparée par ses encodages (une étape vide n'est pas une
 * modification ; une ancienne Description non modifiée non plus).
 */
function occurrenceEquals(
  local: SessionDraftExercise,
  instructionSteps: readonly string[],
  initial: SessionDraftExercise,
): boolean {
  return exerciseEquals(
    { ...local, instruction: encodeInstructionSteps(instructionSteps) },
    { ...initial, instruction: encodeInstructionSteps(decodeInstructionSteps(initial.instruction)) },
  );
}

/**
 * PRE-6 (story 3.3) : mêmes séries (Régime, nombre, Cibles, Pauses, charges, phases), les
 * autres paramètres étant ignorés.
 */
function seriesEqual(a: ExecutionParametersInput, b: ExecutionParametersInput): boolean {
  return executionParametersEqual(a, { ...a, series: b.series });
}

/**
 * PRE-6 (story 3.3) : contexte d'une occurrence existante à l'ouverture de l'éditeur — N hérité
 * (AD-37, AD-44) et séries ouvertes, sous leur forme lue et sous celle que produit le ✓ de la
 * Feuille (`validateForSave` avec la ligne de base), pour que ✓ sans modification ne compte pas
 * comme un changement. `null` sans occurrence existante.
 */
type OpenedOccurrence = {
  readonly inheritedSeriesCount: boolean;
  readonly openedParameters: readonly ExecutionParametersInput[];
  /**
   * PRE-7 (A2.1, D-437, D-438, MFN-09 ; CE-UI-10) : structure des phases verrouillée — occurrence
   * d'un Mouvement déjà enregistré (copie du Catalogue, Séance enregistrée, reprise).
   * PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026) : une occurrence dont le Mouvement
   * est NOUVEAU dans le brouillon (création locale, original comme copie) a son contenu et sa
   * structure modifiables ; la modification s'inscrit dans ce Mouvement partagé
   * (`withDraftMovement`), sans mécanisme propre aux copies.
   * PRE-7 (R-4, D-445 C04) : le crayon « Modifier le mouvement » déverrouille contenu et
   * structure d'un Mouvement enregistré (`UnlockedMovement`).
   */
  readonly phaseStructureLocked: boolean;
};

/**
 * PRE-7 (R-4, D-445 C03, C04) : Mouvement enregistré déverrouillé par le crayon — son contenu
 * courant (entrée `EDITED` du brouillon si présente, sinon relu par le service), base de la
 * décision de sauvegarde à `Terminer`, et son compteur de phase (Feuille, MFN/AC30).
 */
type UnlockedMovement = {
  readonly id: string;
  readonly content: MovementContentSnapshot;
  readonly nextPhaseId: number;
  /**
   * PRE-7 (R-9, D-448 point 10 ; R-10) : occurrence et étapes de description au toucher du crayon —
   * seule référence des changements (contenu et structure de phases), comparée au nouveau toucher ;
   * plus aucune restauration (R-10, r9-5).
   */
  readonly before: UnlockSnapshot;
};

/** PRE-7 (R-9) : état de l'éditeur au déverrouillage du mouvement. */
type UnlockSnapshot = {
  readonly local: SessionDraftExercise;
  readonly instructionSteps: readonly string[];
};

/**
 * PRE-7 (R-9, D-448 point 10 ; arbitrage `arbitrage-2026-10-26-recette-ja2-d448.md`) : contenu du
 * mouvement ou structure des phases changés depuis le toucher du crayon — même comparaison que la
 * décision C03 (`movementContentChanged` : nom et description normalisés, une étape vide n'est pas
 * un changement ; médias, Catégorie, Zones ; phases par identité, libellé et ordre). Les autres
 * paramètres, durées de phase comprises, n'en font pas partie.
 */
function changedSinceUnlock(
  local: SessionDraftExercise,
  instructionSteps: readonly string[],
  before: UnlockSnapshot,
): boolean {
  const contentOf = (exercise: SessionDraftExercise, steps: readonly string[]) =>
    movementContentOfDraft(draftMovementOf({ ...exercise, instruction: encodeInstructionSteps(steps) }, "EDITED"));
  return movementContentChanged(contentOf(before.local, before.instructionSteps), contentOf(local, instructionSteps));
}

/**
 * PRE-7 (R-4, C03) : dialogue de sauvegarde d'une occurrence déverrouillée, en attente.
 * PRE-7 (R-10, recette JA3 r9-5) : `origin` — `Terminer` (inscription puis fermeture) ou crayon
 * retouché (inscription et reverrouillage, l'éditeur restant ouvert).
 */
type PendingOccurrenceSave = {
  readonly occurrence: SessionDraftExercise;
  readonly decision: DialogDecision;
  readonly origin: "FINISH" | "PENCIL";
};

/** PRE-7 (R-10) : inscription préparée d'une correction du mouvement, et occurrence qui en résulte. */
type InscriptionPlan = {
  readonly exercises: readonly SessionDraftExercise[];
  readonly movements: SessionDraft["movements"];
  readonly reserve?: SessionDraft["circuitSeriesReserve"];
  /** PRE-9, recette n° 2 du 31/10 (constat d) : disposition générale suivant un remplacement d'occurrence. */
  readonly structure?: SessionDraft["structure"];
  readonly occurrence: SessionDraftExercise;
};

/** PRE-7 (R-10) : occurrence inscrite, relue par identifiant dans les occurrences du plan. */
function occurrenceIn(exercises: readonly SessionDraftExercise[], id: string): SessionDraftExercise {
  const found = exercises.find((exercise) => exercise.id === id);
  if (found === undefined) {
    throw new Error("occurrenceIn: the inscribed occurrence is not in the plan.");
  }
  return found;
}

function openedOccurrenceOf(
  exercise: SessionDraftExercise | null,
  draft: Pick<SessionDraft, "structure" | "exercises" | "circuitNature" | "movements">,
): OpenedOccurrence | null {
  if (exercise === null) {
    return null;
  }
  const opened = cloneExecutionParameters(exercise.executionParameters);
  const validated = validateForSave(opened, opened);
  return {
    // PRE-9 (B.3, ch10 « Nombre imposé et diminution », l.1142, l.1182) : même règle que la feuille
    // ouverte depuis la carte (`inheritsCircuitSeriesCount`) — ancien modèle, Circuit unique de
    // Séries ; disposition générale, Exercice de N'IMPORTE QUEL Circuit alterné (N en lecture seule,
    // aucune suppression locale de série).
    inheritedSeriesCount: inheritsCircuitSeriesCount(draft, exercise),
    openedParameters: validated.ok ? [opened, validated.value] : [opened],
    phaseStructureLocked: isPersistedMovementOccurrence(exercise, draft.movements),
  };
}

/**
 * PRE-7 (R-3, C05) : l'occurrence référence un Mouvement déjà enregistré (et non un Mouvement
 * NOUVEAU de la table du brouillon) — son contenu n'est pas modifiable sans le crayon (R-4).
 */
export function isPersistedMovementOccurrence(exercise: SessionDraftExercise, movements: SessionDraft["movements"]): boolean {
  const movementId = (exercise.sourceMovementId ?? "").trim();
  return movementId.length > 0 && movements?.[movementId]?.change !== "NEW";
}

/**
 * PRE-9 (recette iPhone du 29/10 ; CE-MVT-01 §7, DSF Mouvements l.71) : structure des phases d'une
 * occurrence (identités, libellés, ordre — jamais de durée), vue du gabarit Mouvement. Le compteur
 * ne recule pas sous celui du Mouvement du brouillon (MFN-02).
 */
export function occurrencePhaseList(exercise: SessionDraftExercise, movements: SessionDraft["movements"]): MovementPhaseList {
  const phases = exercise.executionParameters.series.workPhases.map((phase) => ({ id: phase.id, label: phase.label }));
  const floor = phases.reduce((max, phase) => Math.max(max, phase.id), 0) + 1;
  const movementId = (exercise.sourceMovementId ?? "").trim();
  return { phases, nextPhaseId: Math.max(floor, movements?.[movementId]?.nextPhaseId ?? 0) };
}

/**
 * Copie de Séance (D-137) — écrit exclusivement dans le brouillon de
 * Composition (`SessionDraftContext`), jamais dans une définition Catalogue.
 * Une nouvelle occurrence ne reçoit AUCUNE Récupération automatique
 * (spécification du 07/10) ; une occurrence existante conserve la sienne.
 */
function CompositionExerciseEditor() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();
  // PRE-9, recette iPhone n° 2 (constat e) : retrait de la marque « à vérifier » persistée.
  const sessionService = useContext(SessionServiceContext);
  const activityDefinitionService = useActivityDefinitionService();
  const [bodyZonesLoadToken, setBodyZonesLoadToken] = useState(0);
  const bodyZonesReferential = useBodyZonesReferential(activityDefinitionService, bodyZonesLoadToken);
  const { categories, reload: reloadCategories } = useCategories();
  const profile = useProfileDefaults();
  const params = useLocalSearchParams<{ exerciseId?: string }>();

  // PRE-7 (R-10, recette JA3 r9-5) : occurrence remplacée par « Créer un nouveau mouvement » au
  // crayon, l'éditeur restant ouvert — son nouvel identifiant remplace celui de la route.
  const [replacedOccurrenceId, setReplacedOccurrenceId] = useState<string | null>(null);
  const requestedExerciseId = replacedOccurrenceId ?? params.exerciseId;
  const existingExercise =
    typeof requestedExerciseId === "string"
      ? (draft.exercises.find((exercise) => exercise.id === requestedExerciseId) ?? null)
      : null;
  const isEditingExisting = existingExercise !== null || replacedOccurrenceId !== null;
  // Story 4.2 (Q18, revue) : le texte du dialogue d'abandon suit l'INTENTION de la
  // route — création seulement sans `exerciseId` (ou `new`) ; un `exerciseId` absent
  // du Brouillon reste une modification et n'annonce jamais « ne sera pas créé ».
  const isCreationRoute = typeof requestedExerciseId !== "string" || requestedExerciseId === "new";

  // PRE-4 (AD-13) : ligne de base des paramètres d'une occurrence existante,
  // relue à l'ouverture ; aucune pour une nouvelle occurrence.
  const [baselineParameters] = useState<ExecutionParametersInput | null>(() =>
    existingExercise ? cloneExecutionParameters(existingExercise.executionParameters) : null,
  );
  // PRE-6 (story 3.3, AD-37, AD-44) : contexte de l'occurrence existante, figé dès qu'elle est
  // lue sur le brouillon (au montage, ou dès sa résolution si le brouillon n'est pas encore
  // hydraté), puis pour toute la vie de l'éditeur :
  // - N hérité : occurrence `IN_TOUR`, de type `EXERCISE`, d'un Circuit de Séries. Une occurrence
  //   sortie du Circuit (ou passée en Tours) est donc libre à sa prochaine ouverture. Une nouvelle
  //   occurrence n'est pas encore dans le Circuit : elle y est adaptée à `Terminer` (story 2.3) ;
  // - paramètres à l'ouverture, référence de la règle de réserve (`commitFinished`).
  const [openedOccurrence, setOpenedOccurrence] = useState(() =>
    openedOccurrenceOf(existingExercise, draft),
  );
  if (openedOccurrence === null && existingExercise !== null) {
    setOpenedOccurrence(openedOccurrenceOf(existingExercise, draft));
  }
  const inheritedSeriesCount = openedOccurrence?.inheritedSeriesCount ?? false;
  const phaseStructureLocked = openedOccurrence?.phaseStructureLocked ?? false;
  const [initialSnapshot, setInitialSnapshot] = useState<SessionDraftExercise>(() =>
    existingExercise
      ? existingExercise
      : {
          // Nouvelle occurrence : AUCUNE Récupération automatique — PRE-6
          // (story 1.1, AD-35) : absente (`null`), distincte de « présente à 0 ». [Remplacé le
          // 01/11/2026 (ordre de Hermann, point 2) : la Récupération du Profil est reprise à la
          // lecture du Profil, avec Compte à rebours et Fin, ci-dessous.]
          ...createExerciseDraft(Crypto.randomUUID(), null),
          executionParameters: createEmptyFormValue().executionParameters,
          categoryId: null,
          media: [],
        },
  );
  const [local, setLocal] = useState<SessionDraftExercise | null>(initialSnapshot);
  // PRE-5 story 3.1 (AD-22, FR-35) : étapes décodées de l'occurrence à l'ouverture ;
  // l'occurrence ne reçoit leur encodage qu'à `Terminer`.
  const [instructionSteps, setInstructionSteps] = useState<readonly string[]>(() =>
    decodeInstructionSteps(initialSnapshot.instruction),
  );
  // PRE-9 (recette iPhone du 29/10, CE-MVT-01, DSF Mouvements l.67-69) : une occurrence existante
  // s'ouvre au gabarit Mouvement — contenu du Mouvement en lecture seule (sans crayon), paramètres
  // locaux par leur carte et leur Feuille (CE-UI-10). La création (sans `exerciseId`) garde
  // l'ancien éditeur jusqu'à son retrait (A.3).
  const opensAsMovement = isEditingExisting;
  // Q53 (8) : la Catégorie de cette Copie a été supprimée depuis sa feuille.
  const [categoryClearedByDeletion, setCategoryClearedByDeletion] = useState(false);
  const [profileApplied, setProfileApplied] = useState(isEditingExisting);
  const [mediaDraftId] = useState(() => `occurrence:${existingExercise?.id ?? Crypto.randomUUID()}`);
  // Story 4.6 (FR-22-10, AC9) : feuille de Catégorie, focus rendu à l'accès après sa fermeture.
  const categoryAccessRef = useRef<View>(null);
  const categorySheet = useReferenceSheet(categoryAccessRef);
  const [isFinishing, setIsFinishing] = useState(false);
  const finishingRef = useRef(false);
  // PRE-6 (story 2.3) : ajout adapté au Circuit de Séries, en attente de confirmation de perte.
  const [pendingCircuitEntry, setPendingCircuitEntry] = useState<{ readonly targetCount: number } | null>(null);
  // PRE-7 (R-4, D-445 C04) : crayon d'une occurrence d'un Mouvement enregistré — contenu et
  // structure déverrouillés dans l'éditeur seulement ; rien n'est inscrit avant `Terminer` ou, R-10,
  // avant le nouveau toucher du crayon.
  const [unlockedMovement, setUnlockedMovement] = useState<UnlockedMovement | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [pendingOccurrenceSave, setPendingOccurrenceSave] = useState<PendingOccurrenceSave | null>(null);
  const movementLocked = phaseStructureLocked && unlockedMovement === null;
  // Service sans `MovementRepository` (doublures antérieures à MFN) : aucun crayon.
  // PRE-7 (R-6) : après un changement de niveau, plus de crayon jusqu'à `Terminer` — une correction
  // du mouvement choisi ne se mêle pas au remplacement de l'occurrence (option conservatrice).
  const canUnlockMovement =
    isEditingExisting &&
    movementLocked &&
    activityDefinitionService.supportsSharedCorrection === true &&
    (local?.sourceMovementId ?? "") === (initialSnapshot.sourceMovementId ?? "");

  // Nouvelle occurrence : défauts CR/Fin du Profil appliqués à leur lecture
  // si le brouillon est intact — ajustement d'état pendant le rendu, une fois.
  if (!profileApplied && profile.loaded && local !== null) {
    setProfileApplied(true);
    if (occurrenceEquals(local, instructionSteps, initialSnapshot)) {
      const created: SessionDraftExercise = {
        ...initialSnapshot,
        executionParameters: withProfilePhases(initialSnapshot.executionParameters, profile.countdown, profile.end),
        // PRE-9 (01/11/2026, point 2) : Récupération du nouvel Exercice reprise du Profil ; défauts du
        // Profil en attente du premier ✓ (fond orange dans la Feuille).
        postActivityRecoverySeconds: profile.recovery,
        profileDefaultsPending: true,
      };
      setInitialSnapshot(created);
      setLocal(created);
    }
  }

  const shouldBlockExit = !isFinishing && local !== null && !occurrenceEquals(local, instructionSteps, initialSnapshot);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(shouldBlockExit, () => {
    activityDefinitionService.abandonMediaDraft(mediaDraftId).catch(() => undefined);
  });
  // PRE-7 (A2.3, MFN-04, MFN-06, MFN-09) : création depuis une Séance — mêmes panneau et recherche
  // qu'au Catalogue, avant tout choix et avant la saisie détaillée (R-5 : Catégorie et Zones
  // permises, signaux R02). « Utiliser ce mouvement » : l'occurrence porte la filiation du mouvement
  // choisi (contenu verrouillé, MFN-09) ; variante (R-5, C02) : création LOCALE (Mouvement `NEW`
  // créé à l'enregistrement de la Séance, rattaché avant / après l'origine), description et médias
  // vierges. Rien n'est publié au Catalogue ; « Continuer » seul persiste.
  // PRE-9 CAT.2 : la carte Composition ne propose plus « Créer une variante » (seul accès à cette
  // variante LOCALE) ; l'état reste lu par l'enregistrement (`levelOrigin`), toujours `null` ici.
  const [variantOrigin] = useState<MovementLevelOrigin | null>(null);
  const [nameHintVisible, setNameHintVisible] = useState(false);
  // PRE-7 (R-8, cr-8) : dernier nom connu, comparé par `patchLocal` (synchronisé après chaque rendu).
  const nameRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    nameRef.current = local?.name;
  }, [local?.name]);
  // PRE-7 (R-10, r9-5) : dernier état saisi et montage, relus après la lecture asynchrone du crayon
  // retouché (`relockUnlocked`) — une saisie pendant la lecture, ou une sortie, l'annule.
  const latestLocalRef = useRef(local);
  const latestStepsRef = useRef(instructionSteps);
  useEffect(() => {
    latestLocalRef.current = local;
    latestStepsRef.current = instructionSteps;
  }, [local, instructionSteps]);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  const repriseLocked = !isEditingExisting && (local?.sourceMovementId ?? "").trim().length > 0;
  const occurrenceOnlyNamed =
    local !== null &&
    occurrenceEquals(
      { ...local, name: initialSnapshot.name, categoryId: initialSnapshot.categoryId, bodyZoneIds: initialSnapshot.bodyZoneIds },
      instructionSteps,
      initialSnapshot,
    );
  // PRE-7 (R-5, C01) : Mouvements du brouillon encore référencés (créations locales, corrections
  // renommées), comptés dans l'unicité avec les mouvements enregistrés — deux créations locales de
  // même nom sont signalées pendant la saisie (report R-3).
  const draftMovementNames = useMemo(() => {
    const referenced = new Set(draft.exercises.map((exercise) => exercise.sourceMovementId));
    return Object.values(draft.movements ?? {})
      .filter((movement) => referenced.has(movement.id))
      .map((movement) => ({ id: movement.id, name: movement.name }));
  }, [draft.exercises, draft.movements]);
  const searchContext = useMemo(
    () => ({ categoryId: local?.categoryId ?? null, bodyZoneIds: local?.bodyZoneIds ?? [] }),
    [local?.categoryId, local?.bodyZoneIds],
  );
  const ownMovementId = (local?.sourceMovementId ?? "").trim();
  const originChoice = useMovementOriginChoice({
    service: activityDefinitionService,
    name: local?.name ?? "",
    available: !isEditingExisting && !repriseLocked && variantOrigin === null && occurrenceOnlyNamed,
    // Mouvement de l'occurrence exclu de sa propre collision : Mouvement déverrouillé par le crayon,
    // Mouvement NOUVEAU du brouillon, ou celui que recevra une création (identifiant de l'occurrence).
    uniqueness: {
      excludedMovementId: unlockedMovement?.id ?? (ownMovementId.length > 0 ? ownMovementId : (local?.id ?? null)),
      draftMovements: draftMovementNames,
      suspended: movementLocked || repriseLocked,
      messageHidden: nameHintVisible,
    },
    // PRE-9 CAT.2 (CE-MVT-RESULT-01) : création d'un Exercice — cartes Composition, sans bouton ;
    // décision de Hermann du 30/10/2026 : « l'utilisateur doit simplement appuyer sur la carte pour
    // l'utiliser ». La carte Composition ne porte jamais « Ajouter un niveau » [remplace « Créer une
    // variante » du panneau de l'éditeur d'Exercice, R-5] : les autres accès au nouveau Niveau
    // (menu Niveau, paramètres de route) sont inchangés.
    cardVariant: "composition",
    context: searchContext,
    onSameMovement: ({ movement }) => {
      setInstructionSteps(decodeInstructionSteps(movement.description));
      setLocal((current) =>
        current
          ? {
              ...current,
              name: movement.name,
              instruction: movement.description,
              categoryId: movement.categoryId,
              bodyZoneIds: [...movement.bodyZoneIds],
              media: [...movement.media],
              executionParameters: repriseExecutionParameters(movement, current.executionParameters),
              sourceMovementId: movement.id,
            }
          : current,
      );
    },
  });
  // PRE-6 (story 2.3) : la sortie l'emporte — le dialogue de Circuit en attente est retiré
  // (ajustement d'état pendant le rendu ; `finishingRef` n'est jamais engagé tant qu'il attend).
  if (isPendingExit && pendingCircuitEntry !== null) {
    setPendingCircuitEntry(null);
  }

  useEffect(() => {
    if (isFinishing && !shouldBlockExit) {
      router.back();
    }
  }, [isFinishing, shouldBlockExit, router]);

  // PRE-7 (R-6, D-445 C09, v7 l.67, MFN-09 l.410 ; CE-UI-NIV-01 §3, §4) : commande Niveau de
  // l'occurrence d'un Mouvement enregistré (existante, ou reprise en création), active hors crayon :
  // niveaux du groupe relus par le service ; rang et total dérivés, jamais persistés. Lecture
  // rattachée au mouvement lu : une lecture d'un autre mouvement n'est jamais affichée.
  const occurrenceMovementId = (local?.sourceMovementId ?? "").trim();
  const levelMovementId =
    activityDefinitionService.supportsMovementLevels === true &&
    local !== null &&
    occurrenceMovementId.length > 0 &&
    isPersistedMovementOccurrence(local, draft.movements)
      ? occurrenceMovementId
      : null;
  // PRE-7 (R-6 ; report R-5) : variante créée dans la Séance (choisie dans l'éditeur, ou Mouvement
  // NOUVEAU du brouillon rouvert) — pastille du rang prévu, dérivé de la position de l'origine.
  const variantLevelOrigin: MovementLevelOrigin | null =
    levelMovementId === null && activityDefinitionService.supportsMovementLevels === true
      ? (variantOrigin ?? draft.movements?.[occurrenceMovementId]?.levelOrigin ?? null)
      : null;
  const levelLookupId = levelMovementId ?? variantLevelOrigin?.movementId ?? null;
  const [loadedLevels, setLoadedLevels] = useState<{
    readonly movementId: string;
    readonly levels: MovementLevels | "error";
  } | null>(null);
  // L'éditeur attend la PREMIÈRE lecture (base locale) pour s'afficher avec sa rangée définitive
  // (revue A3.1) ; les lectures suivantes (changement de niveau, reprise) ne le démontent pas.
  const [initialLevelLookupId] = useState(levelLookupId);
  const levelsPending = initialLevelLookupId !== null && loadedLevels === null;
  const [isLevelsScreenOpen, setIsLevelsScreenOpen] = useState(false);
  const [levelsReloadToken, setLevelsReloadToken] = useState(0);
  useEffect(() => {
    if (levelLookupId === null) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => activityDefinitionService.getMovementLevels(levelLookupId))
      .then(
        (result) => {
          if (!cancelled) setLoadedLevels({ movementId: levelLookupId, levels: result ?? "error" });
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error("Les niveaux du geste n'ont pas pu être chargés.", error);
          setLoadedLevels({ movementId: levelLookupId, levels: "error" });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService, levelLookupId, levelsReloadToken]);
  const levels = loadedLevels !== null && loadedLevels.movementId === levelLookupId ? loadedLevels.levels : null;

  /**
   * PRE-7 (R-6, D-445 C05, C09 ; v7 §4 l.59, MFN-09 l.412 et l.418) : changement de niveau — prépare
   * dans l'éditeur l'occurrence remplaçante : contenu du mouvement choisi (entrée corrigée du
   * brouillon s'il y en a une), paramètres transférés PAR RANG (`withOccurrenceMovement`). Rien
   * n'est inscrit : `Terminer` valide le remplacement (`planFinish`), la fermeture l'abandonne et
   * restitue l'occurrence. Le groupe n'est pas reclassé.
   */
  function changeOccurrenceLevel(movementId: string) {
    if (finishingRef.current || local === null || levels === null || levels === "error") return;
    const entry = levels.levels.find((candidate) => candidate.movement.id === movementId);
    if (entry === undefined) return;
    setLoadedLevels({ movementId, levels: levelsAfterChange(levels, movementId) });
    if (isEditingExisting && movementId === (initialSnapshot.sourceMovementId ?? "").trim()) {
      // Retour au niveau d'origine : l'occurrence d'ouverture est restituée (contenu et paramètres),
      // jamais un second transfert depuis l'état courant (qui viderait les durées de phase).
      setInstructionSteps(decodeInstructionSteps(initialSnapshot.instruction));
      setLocal(initialSnapshot);
      return;
    }
    const next = withOccurrenceMovement(local, draft.movements?.[movementId] ?? entry.movement);
    setInstructionSteps(decodeInstructionSteps(next.instruction));
    setLocal(next);
  }

  let occurrenceLevel: EditorLevel | null = null;
  if (levelMovementId !== null) {
    // Choix par mouvement ; « Ajouter un niveau » indisponible en Séance (option conservatrice) ;
    // pendant l'édition du contenu par le crayon, pastille seule.
    occurrenceLevel = editorLevelOf(
      levels,
      unlockedMovement !== null
        ? null
        : {
            currentDefinitionId: null,
            onChangeLevel: noExerciseChoice,
            onAddLevel: null,
            onReorderLevels: () => {
              if (!finishingRef.current) setIsLevelsScreenOpen(true);
            },
            movementChoice: { currentMovementId: levelMovementId, onChangeMovement: changeOccurrenceLevel },
          },
    );
  } else if (variantLevelOrigin !== null && levels !== null && levels !== "error") {
    occurrenceLevel = { position: variantLevelPosition(levels.position, variantLevelOrigin.placement), menu: null };
  }

  function patchLocal(next: Partial<ActivityEditorFormValue>) {
    // PRE-7 (R-5, C02) : l'invite grise disparaît à la reprise de saisie, sans effacer le nom.
    // PRE-7 (R-8, cr-8) : seulement sur une modification réelle — le clavier iOS peut renvoyer le
    // même texte à la perte du focus. Comparaison au dernier nom saisi (`nameRef`), à jour même
    // entre deux évènements sans rendu intermédiaire.
    if (next.name !== undefined) {
      if (next.name !== nameRef.current) setNameHintVisible(false);
      nameRef.current = next.name;
    }
    if (next.instructionSteps !== undefined) {
      setInstructionSteps(next.instructionSteps);
    }
    setLocal((current) => {
      if (!current) return current;
      const merged: SessionDraftExercise = {
        ...current,
        ...(next.name !== undefined ? { name: next.name } : {}),
        ...(next.bodyZoneIds !== undefined ? { bodyZoneIds: next.bodyZoneIds } : {}),
        ...(next.media !== undefined ? { media: next.media } : {}),
      };
      if (next.executionParameters === undefined) {
        return merged;
      }
      // PRE-9 (01/11/2026, point 2) : premier ✓ — défauts du Profil validés.
      const validatedDefaults = withProfileDefaultsValidated(merged);
      // ✓ de la feuille : paramètres validés avec la ligne de base (AD-13) ;
      // la direction de l'occurrence suit celle des paramètres.
      const validated = validateForSave(next.executionParameters, baselineParameters);
      if (!validated.ok) {
        return { ...validatedDefaults, executionParameters: next.executionParameters };
      }
      return {
        ...validatedDefaults,
        executionParameters: validated.value,
        sideMode: validated.value.sideMode,
      };
    });
  }

  /**
   * Occurrences du brouillon COURANT après `Terminer`. PRE-6 (story 2.3, AD-39) : une nouvelle
   * occurrence qui arrive dans un Circuit de Séries est adaptée à N ; ses pertes éventuelles
   * sont rendues pour confirmation AVANT toute mutation.
   */
  function planFinish(current: SessionDraftExercise): Pick<CircuitMembershipSettlement, "exercises" | "losses" | "targetCount"> & {
    readonly movements: SessionDraft["movements"];
    readonly circuitSeriesReserve?: SessionDraft["circuitSeriesReserve"];
    /** PRE-9 B.2 (ARB-07) : disposition générale avec la nouvelle occurrence insérée. */
    readonly structure?: SessionDraft["structure"];
  } {
    // PRE-5 story 3.1 (AC4) : l'occurrence reçoit l'encodage des étapes à `Terminer` seulement.
    // PRE-7 (R-3, C05) : une création locale reçoit un Mouvement NOUVEAU à son identifiant.
    const encoded: SessionDraftExercise = { ...current, instruction: encodeInstructionSteps(instructionSteps) };
    // PRE-7 (R-6, MFN-09 l.412, CE-UI-NIV-01 §4) : niveau changé sur une occurrence existante —
    // remplacement à la MÊME place par une nouvelle identité d'occurrence, référençant le mouvement
    // choisi (sans numéro de copie) ; l'entrée de réserve de Circuit suit. Aucun Exercice du
    // Catalogue créé, table des Mouvements inchangée.
    if (
      isEditingExisting &&
      (encoded.sourceMovementId ?? "") !== (initialSnapshot.sourceMovementId ?? "") &&
      draft.exercises.some((exercise) => exercise.id === encoded.id)
    ) {
      const replaced = replaceOccurrence(draft, encoded.id, { ...encoded, id: Crypto.randomUUID(), copyNumber: null });
      return {
        exercises: replaced.exercises,
        losses: [],
        targetCount: 0,
        movements: draft.movements,
        ...(replaced.circuitSeriesReserve !== undefined ? { circuitSeriesReserve: replaced.circuitSeriesReserve } : {}),
        // PRE-9, recette iPhone n° 2 du 31/10 (constat d) : la disposition générale suit le remplacement.
        ...(replaced.structure !== undefined ? { structure: replaced.structure } : {}),
      };
    }
    const createsMovement = encoded.type === "EXERCISE" && (encoded.sourceMovementId ?? "").trim().length === 0;
    const finished: SessionDraftExercise = createsMovement ? { ...encoded, sourceMovementId: encoded.id } : encoded;
    // PRE-9 B.2 (ARB-07) : disposition générale — insertion après le dernier Exercice affiché, dans
    // son conteneur ; l'ancien modèle garde son insertion et son réglage de Circuit.
    const richInsertion = draft.exercises.some((exercise) => exercise.id === finished.id)
      ? null
      : insertIntoRichLayout(draft, [finished]);
    const plan = draft.exercises.some((exercise) => exercise.id === finished.id)
      ? {
          exercises: draft.exercises.map((exercise) => (exercise.id === finished.id ? finished : exercise)),
          losses: [],
          targetCount: 0,
        }
      : richInsertion !== null
        ? // PRE-9 (B.3) : occurrence entrée dans un Circuit alterné adaptée à SON N, pertes confirmées.
          {
            exercises: richInsertion.exercises,
            losses: richInsertion.losses,
            targetCount: richInsertion.targetCount,
            structure: richInsertion.structure,
          }
        : settleCircuitMembership(draft, appendActivityAfterLastDisplayed(draft.exercises, finished));
    if (!createsMovement && isPersistedMovementOccurrence(finished, draft.movements)) {
      return { ...plan, movements: draft.movements };
    }
    // Mouvement NOUVEAU du brouillon : son contenu est celui de l'occurrence terminée, partagé par
    // toutes ses occurrences (original et copies), paramètres de chacune inchangés.
    // PRE-7 (R-5, C02) : une variante garde son origine de niveau jusqu'à l'enregistrement.
    const previous = draft.movements?.[finished.sourceMovementId!];
    const levelOrigin = variantOrigin ?? previous?.levelOrigin;
    const shared = withDraftMovement(
      { ...draft, exercises: plan.exercises },
      draftMovementOf(finished, "NEW", {
        // PRE-9 : compteur des phases du Mouvement NOUVEAU, jamais en recul (`draftMovementOf` le
        // relève au-dessus des identités de l'occurrence terminée).
        nextPhaseId: previous?.nextPhaseId,
        aliases: previous?.aliases,
        ...(levelOrigin !== undefined ? { levelOrigin } : {}),
      }),
    );
    return { ...plan, exercises: shared.exercises, movements: shared.movements };
  }

  /**
   * PRE-7 (R-4, D-445 C04) : crayon — contenu courant du Mouvement : entrée `EDITED` du
   * brouillon si présente (correction déjà inscrite, non enregistrée), sinon Mouvement relu.
   * Mouvement introuvable ou lecture en échec : l'occurrence reste verrouillée.
   */
  function unlockMovement() {
    if (local === null || isUnlocking || unlockedMovement !== null) {
      return;
    }
    // PRE-7 (R-9) : état au toucher — le contenu reste verrouillé pendant une relecture éventuelle.
    const before: UnlockSnapshot = { local, instructionSteps };
    const movementId = (local.sourceMovementId ?? "").trim();
    const entry = draft.movements?.[movementId];
    if (entry !== undefined) {
      setUnlockedMovement({ id: movementId, content: movementContentOfDraft(entry), nextPhaseId: entry.nextPhaseId, before });
      return;
    }
    setIsUnlocking(true);
    activityDefinitionService.getMovement(movementId).then(
      (movement) => {
        setIsUnlocking(false);
        if (movement === null) {
          console.error("Le mouvement de l'occurrence est introuvable.");
          return;
        }
        // Description « avant » normalisée comme la saisie (étapes décodées puis réencodées, D-425) :
        // une ancienne description non modifiée n'est pas un changement de contenu.
        const content = movementContentOf(movement);
        setUnlockedMovement({
          id: movement.id,
          content: { ...content, description: encodeInstructionSteps(decodeInstructionSteps(movement.description)) },
          nextPhaseId: movement.nextPhaseId,
          before,
        });
      },
      (error: unknown) => {
        setIsUnlocking(false);
        console.error("Le mouvement de l'occurrence n'a pas pu être chargé.", error);
      },
    );
  }

  /**
   * PRE-7 (R-9, D-448 point 10, recette JA2 nv-9) : nouveau toucher du crayon pendant l'édition du
   * mouvement — sortie de l'édition. Sans changement depuis le déverrouillage : reverrouillage
   * immédiat. La garde de navigation n'est pas concernée.
   * PRE-7 (R-10, recette JA3 r9-5) : avec changements, décision de sauvegarde C03 — la même que
   * `Terminer` (`decideUnlockedSave`) — au lieu de la confirmation d'abandon ; la correction retenue
   * est inscrite dans le brouillon sans quitter l'éditeur (`inscribeAndRelock`).
   */
  function toggleMovementEdit() {
    if (unlockedMovement === null) {
      unlockMovement();
      return;
    }
    if (finishingRef.current || local === null || pendingOccurrenceSave !== null) {
      return;
    }
    if (changedSinceUnlock(local, instructionSteps, unlockedMovement.before)) {
      void relockUnlocked(local, unlockedMovement);
      return;
    }
    setUnlockedMovement(null);
  }

  /**
   * PRE-7 (R-10, r9-5) : crayon retouché après un changement du contenu ou de la structure des
   * phases — nom modifié : choix ; mouvement partagé : confirmation ; sinon (`SILENT`) correction
   * inscrite sans dialogue ; `NONE` (contenu égal à celui du mouvement) : reverrouillage seul. Une
   * lecture en échec laisse l'édition ouverte. `finishingRef` sert de verrou pendant la lecture.
   */
  async function relockUnlocked(current: SessionDraftExercise, unlocked: UnlockedMovement) {
    const steps = instructionSteps;
    finishingRef.current = true;
    const decision = await decideUnlockedSave(current, unlocked);
    finishingRef.current = false;
    if (decision === null || !mountedRef.current) return;
    // Saisie pendant la lecture : la décision ne porte plus sur l'état courant — édition laissée ouverte.
    if (latestLocalRef.current !== current || latestStepsRef.current !== steps) return;
    if (decision.kind === "NONE") {
      setUnlockedMovement(null);
      return;
    }
    if (decision.kind === "SILENT") {
      inscribeAndRelock(movementUpdatePlan(current, unlocked));
      return;
    }
    setPendingOccurrenceSave({ occurrence: current, decision, origin: "PENCIL" });
  }

  /**
   * PRE-7 (R-10, r9-5) : correction inscrite dans le brouillon (« Mettre à jour », confirmation,
   * sauvegarde silencieuse, ou remplacement par un nouveau mouvement), l'éditeur restant ouvert :
   * l'occurrence inscrite devient l'état courant ET l'état de référence de l'éditeur (la garde de
   * sortie ne la propose plus à l'abandon), le contenu est reverrouillé et le crayon redevient
   * inactif. Rien n'est écrit en base avant l'enregistrement de la Séance.
   */
  function inscribeAndRelock(plan: InscriptionPlan) {
    writeDraft(plan.exercises, plan.movements, plan.reserve, plan.structure);
    const { occurrence } = plan;
    nameRef.current = occurrence.name;
    if (local !== null && occurrence.id !== local.id) {
      setReplacedOccurrenceId(occurrence.id);
    }
    setInitialSnapshot(occurrence);
    setLocal(occurrence);
    setUnlockedMovement(null);
  }

  /**
   * PRE-7 (R-4, D-445 C03, C04) : `Terminer` d'une occurrence déverrouillée — décision unique de
   * sauvegarde contre le contenu courant du Mouvement. Autres exercices : définitions du
   * Catalogue et occurrences persistées des AUTRES Séances (service), plus les autres occurrences
   * du brouillon qui le référencent, l'occurrence éditée exclue ; exécutions : 0 (avant T04).
   * Paramètres seuls : comportement de `Terminer` inchangé. Une lecture en échec laisse l'éditeur
   * ouvert, brouillon intact.
   */
  async function finishUnlocked(current: SessionDraftExercise, unlocked: UnlockedMovement) {
    finishingRef.current = true;
    const decision = await decideUnlockedSave(current, unlocked);
    if (decision === null) {
      finishingRef.current = false;
      return;
    }
    if (decision.kind === "NONE") {
      const plan = planFinish(current);
      commitFinished(plan.exercises, plan.movements, undefined, plan.structure);
      return;
    }
    if (decision.kind === "SILENT") {
      commitMovementUpdate(current, unlocked);
      return;
    }
    finishingRef.current = false;
    setPendingOccurrenceSave({ occurrence: current, decision, origin: "FINISH" });
  }

  /**
   * PRE-7 (R-4, C03 ; R-10, r9-5) : décision de sauvegarde d'une occurrence déverrouillée, commune à
   * `Terminer` et au crayon retouché (voir `finishUnlocked`). `null` : lecture du nombre
   * d'utilisations en échec.
   */
  async function decideUnlockedSave(
    current: SessionDraftExercise,
    unlocked: UnlockedMovement,
  ): Promise<MovementSaveDecision | null> {
    const finished: SessionDraftExercise = { ...current, instruction: encodeInstructionSteps(instructionSteps) };
    const after = movementContentOfDraft(
      draftMovementOf(finished, "EDITED", { nextPhaseId: unlocked.nextPhaseId, aliases: unlocked.content.aliases }),
    );
    const inDraft = draft.exercises.filter(
      (exercise) => exercise.id !== finished.id && exercise.sourceMovementId === unlocked.id,
    ).length;
    try {
      const persisted = await activityDefinitionService.countMovementUsage(unlocked.id, draft.sourceSessionId ?? null);
      return decideMovementSave(unlocked.content, after, persisted + inDraft, 0);
    } catch (error) {
      console.error("L'utilisation du mouvement n'a pas pu être lue.", error);
      return null;
    }
  }

  /**
   * PRE-7 (R-4, C04) : « Mettre à jour ce mouvement » (ou confirmation, ou sauvegarde silencieuse)
   * — le Mouvement corrigé est inscrit `EDITED` dans la table du brouillon : toutes ses
   * occurrences l'affichent (`withDraftMovement`) ; le repository le met à jour à
   * l'enregistrement de la Séance.
   */
  function movementUpdatePlan(current: SessionDraftExercise, unlocked: UnlockedMovement): InscriptionPlan {
    const finished: SessionDraftExercise = { ...current, instruction: encodeInstructionSteps(instructionSteps) };
    const exercises = draft.exercises.map((exercise) => (exercise.id === finished.id ? finished : exercise));
    // PRE-7 (R-10) : un Mouvement encore `NEW` dans le brouillon (créé par « Créer un nouveau
    // mouvement » au crayon) reste `NEW`, avec son origine de niveau éventuelle — sinon
    // l'enregistrement de la Séance chercherait à mettre à jour un Mouvement inexistant.
    const previous = draft.movements?.[unlocked.id];
    const change = previous?.change === "NEW" ? "NEW" : "EDITED";
    const shared = withDraftMovement(
      { ...draft, exercises },
      draftMovementOf(finished, change, {
        nextPhaseId: unlocked.nextPhaseId,
        aliases: unlocked.content.aliases,
        ...(previous?.levelOrigin !== undefined ? { levelOrigin: previous.levelOrigin } : {}),
      }),
    );
    return { exercises: shared.exercises, movements: shared.movements, occurrence: occurrenceIn(shared.exercises, finished.id) };
  }

  function commitMovementUpdate(current: SessionDraftExercise, unlocked: UnlockedMovement) {
    const plan = movementUpdatePlan(current, unlocked);
    commitFinished(plan.exercises, plan.movements);
  }

  /**
   * PRE-7 (R-4, C04, Q10) : « Créer un nouveau mouvement » — l'occurrence est remplacée, à la même
   * place, par une nouvelle occurrence d'un nouveau Mouvement `NEW`
   * (`replaceOccurrenceWithNewMovement`) ; les autres occurrences gardent l'ancien Mouvement.
   */
  function newMovementPlan(current: SessionDraftExercise, unlocked: UnlockedMovement): InscriptionPlan {
    const finished: SessionDraftExercise = { ...current, instruction: encodeInstructionSteps(instructionSteps) };
    const ids = { occurrenceId: Crypto.randomUUID(), movementId: Crypto.randomUUID() };
    const replaced = replaceOccurrenceWithNewMovement(draft, finished, ids, { nextPhaseId: unlocked.nextPhaseId });
    // PRE-7 (R-10) : l'ancien Mouvement, s'il était `NEW` dans le brouillon et n'est plus référencé
    // par aucune occurrence, est retiré — il ne doit pas être créé à l'enregistrement.
    let movements = replaced.movements;
    if (
      movements?.[unlocked.id]?.change === "NEW" &&
      !replaced.exercises.some((exercise) => exercise.sourceMovementId === unlocked.id)
    ) {
      const rest = { ...movements };
      delete rest[unlocked.id];
      movements = rest;
    }
    return {
      exercises: replaced.exercises,
      movements,
      reserve: replaced.circuitSeriesReserve,
      // PRE-9, recette iPhone n° 2 du 31/10 (constat d) : la disposition générale suit le remplacement.
      ...(replaced.structure !== undefined ? { structure: replaced.structure } : {}),
      occurrence: occurrenceIn(replaced.exercises, ids.occurrenceId),
    };
  }

  function commitNewMovement(current: SessionDraftExercise, unlocked: UnlockedMovement) {
    const plan = newMovementPlan(current, unlocked);
    commitFinished(plan.exercises, plan.movements, plan.reserve, plan.structure);
  }

  /**
   * PRE-7 (R-4, C03 ; R-10, r9-5) : choix du dialogue de sauvegarde — à `Terminer`, inscription puis
   * fermeture ; au crayon, inscription et reverrouillage, l'éditeur restant ouvert.
   */
  function applyOccurrenceSave(save: PendingOccurrenceSave, unlocked: UnlockedMovement, choice: "UPDATE" | "NEW_MOVEMENT") {
    const { occurrence } = save;
    if (save.origin === "PENCIL") {
      inscribeAndRelock(choice === "UPDATE" ? movementUpdatePlan(occurrence, unlocked) : newMovementPlan(occurrence, unlocked));
      return;
    }
    finishingRef.current = true;
    if (choice === "UPDATE") {
      commitMovementUpdate(occurrence, unlocked);
    } else {
      commitNewMovement(occurrence, unlocked);
    }
  }

  function handleTerminer() {
    if (finishingRef.current || local === null) {
      return;
    }
    if (unlockedMovement !== null) {
      void finishUnlocked(local, unlockedMovement);
      return;
    }
    const plan = planFinish(local);
    if (plan.losses.length > 0) {
      // Annuler : reste sur l'écran, rien n'est ajouté ; `finishingRef` n'est pas engagé.
      setPendingCircuitEntry({ targetCount: plan.targetCount });
      return;
    }
    finishingRef.current = true;
    commitFinished(plan.exercises, plan.movements, plan.circuitSeriesReserve, plan.structure);
  }

  function commitFinished(
    nextExercises: readonly SessionDraftExercise[],
    nextMovements: SessionDraft["movements"],
    nextReserve?: SessionDraft["circuitSeriesReserve"],
    nextStructure?: SessionDraft["structure"],
  ) {
    writeDraft(nextExercises, nextMovements, nextReserve, nextStructure);
    setIsFinishing(true);
  }

  /**
   * Inscription dans le brouillon de Séance, sans fermer l'éditeur (`commitFinished` ferme ensuite ;
   * le crayon, R-10, reste dans l'éditeur).
   */
  function writeDraft(
    nextExercises: readonly SessionDraftExercise[],
    nextMovements: SessionDraft["movements"],
    nextReserve?: SessionDraft["circuitSeriesReserve"],
    // PRE-9 B.2 (ARB-07) : disposition générale où la nouvelle occurrence est insérée.
    nextStructure?: SessionDraft["structure"],
  ) {
    // PRE-6 (story 3.3, report de la story 1.4) : une occurrence existante dont les séries
    // diffèrent de celles qu'elle avait à l'ouverture perd son entrée de réserve de Circuit (même
    // retrait que sa sortie du Circuit, `exitCircuit`), dans la MÊME mise à jour, fonctionnelle,
    // que les occurrences. Sans entrée de réserve, mise à jour simple inchangée.
    const occurrence = local;
    const seriesChanged =
      occurrence !== null &&
      openedOccurrence !== null &&
      !openedOccurrence.openedParameters.some((opened) => seriesEqual(occurrence.executionParameters, opened));
    const hasReserveEntry =
      occurrence !== null &&
      draft.circuitSeriesReserve !== undefined &&
      Object.prototype.hasOwnProperty.call(draft.circuitSeriesReserve, occurrence.id);
    if (seriesChanged && hasReserveEntry) {
      updateDraft((current) => ({
        exercises: nextExercises,
        ...(nextMovements !== undefined ? { movements: nextMovements } : {}),
        circuitSeriesReserve: exitCircuit(current, occurrence).circuitSeriesReserve,
      }));
    } else {
      // PRE-7 (R-4, C04) : `nextReserve` — réserve dont l'entrée a suivi l'occurrence remplacée.
      updateDraft({
        exercises: nextExercises,
        ...(nextMovements !== undefined ? { movements: nextMovements } : {}),
        ...(nextReserve !== undefined ? { circuitSeriesReserve: nextReserve } : {}),
        ...(nextStructure !== undefined ? { structure: nextStructure } : {}),
      });
    }
    // Les copies préparées deviennent des références du brouillon de Séance ;
    // « Continuer » (Composition) les persiste dans sa transaction.
    activityDefinitionService.commitMediaDraft(mediaDraftId);
  }

  const t = strings.screens.exercise;
  const value: ActivityEditorFormValue | null = local
    ? {
        name: local.name,
        instructionSteps,
        executionParameters: local.executionParameters,
        bodyZoneIds: local.bodyZoneIds,
        media: local.media ?? [],
      }
    : null;
  // Q53 (8) : une Copie existante n'exige pas de Catégorie (données antérieures), sauf si la
  // sienne vient d'être supprimée depuis sa feuille : il faut alors en choisir une autre.
  const isValid =
    value !== null &&
    isActivityEditorFormValid(value, {
      // PRE-7 (R-3, C05) : une occurrence dont le Mouvement est NOUVEAU porte le contenu de ce
      // Mouvement, dont la Catégorie et les Zones sont requises à l'enregistrement ; de même pour
      // un Mouvement enregistré déverrouillé par le crayon (R-4, C04), réécrit à l'enregistrement.
      requireReferences:
        !isEditingExisting ||
        unlockedMovement !== null ||
        (local !== null && !isPersistedMovementOccurrence(local, draft.movements)),
      hasCategory: Boolean(local?.categoryId),
      baseline: baselineParameters,
    }) &&
    !(categoryClearedByDeletion && !local?.categoryId);

  return (
    <ScreenShell>
      <EditorHeader
        // PRE-9 (Figma `10419:22924` « Mouvement — Repris (lecture seule) ») : titre de la fiche
        // consultée ; Mouvement encore NOUVEAU du brouillon (modifiable) : titre d'édition.
        title={
          opensAsMovement
            ? movementLocked
              ? strings.screens.movement.titles.consult
              : strings.screens.movement.titles.edit
            : isEditingExisting
              ? t.titleEdit
              : t.titleAdd
        }
        onClose={() => router.back()}
        accessibilityLabel={t.backAccessibilityLabel}
        // PRE-7 (R-9, D-448 point 10) : crayon interrupteur — affiché et actif pendant l'édition du
        // mouvement, qu'un nouveau toucher quitte.
        // PRE-9 (CE-MVT-01 §3, §13 ; DSF Mouvements l.67 ; ch13 l.268) : depuis une Séance, ni crayon
        // ni geste pour modifier le Mouvement — le crayon n'est plus rendu sur une occurrence existante.
        trailing={
          !opensAsMovement && (canUnlockMovement || unlockedMovement !== null) ? (
            <EditMovementAction onPress={toggleMovementEdit} active={unlockedMovement !== null} />
          ) : null
        }
      />

      {value !== null && !levelsPending ? (
        <ActivityEditorForm
          value={value}
          onChange={patchLocal}
          // PRE-9 (recette iPhone du 29/10) : occurrence existante au gabarit Mouvement (CE-MVT-01) —
          // média derrière la zone de contexte, Description, puis carte des paramètres locaux
          // (CE-UI-10).
          // Contre-recette iPhone du 30/10 (Hermann, r1-exo : « La section « phases du mouvement »
          // (titre et contenu) ne doit pas apparaître, car elle est dans les paramètres
          // d'exécution. ») : aucun bloc Phases ici — la structure se lit et, Mouvement NOUVEAU du
          // brouillon seulement, se règle dans la Feuille des paramètres. La fiche Mouvement du
          // Catalogue garde son bloc Phases.
          {...(opensAsMovement && local !== null ? { variant: "movement" as const, executionParametersCard: true } : {})}
          bodyZones={bodyZonesReferential}
          onBodyZonesPickerClose={() => setBodyZonesLoadToken((current) => current + 1)}
          silhouette={profile.silhouette}
          category={toEditorCategory(local?.categoryId ?? null, categories)}
          onOpenCategory={() => categorySheet.open()}
          isCategoryPickerOpen={categorySheet.isOpen}
          categoryAccessRef={categoryAccessRef}
          profileSideRecoverySecondsDefault={profile.sideRecovery}
          // PRE-5 story 2.5 (AC4, D-409, RM-218) : Exercice ouvert depuis une Séance — la
          // Feuille ne présente ni Compte à rebours ni Fin d'exercice (valeurs conservées).
          exerciseSignals="absent"
          inheritedSeriesCount={inheritedSeriesCount}
          // Contre-recette iPhone du 30/10 (r1-exo) : sans bloc Phases au gabarit, la structure des
          // phases se règle dans la Feuille, verrouillée pour un Mouvement enregistré (MFN-09).
          phaseStructureLocked={movementLocked}
          // PRE-7 (A2.2, D-437, MFN-09, MFN/AC28, MFN/AC29) : même seuil que la structure — une
          // occurrence d'un Mouvement enregistré a son contenu (nom, description, médias, Catégorie,
          // Zones) verrouillé jusqu'au crayon (R-4, D-445 C04) ; une création locale non enregistrée
          // reste modifiable, ainsi que sa copie en attente (recette JA, décision du 26/10/2026).
          contentLocked={movementLocked || repriseLocked}
          // PRE-7 (R-4, MFN/AC30) : compteur du Mouvement déverrouillé, jamais max + 1.
          nextPhaseId={
            unlockedMovement?.nextPhaseId ??
            (opensAsMovement && local !== null ? occurrencePhaseList(local, draft.movements).nextPhaseId : undefined)
          }
          // Recette iPhone n° 2 du 31/10/2026 (constat e) : orange dans la Feuille ; marque retirée à
          // sa fermeture, du brouillon (copie locale comprise) et de la Séance enregistrée.
          {...(local?.phasesToVerify !== undefined ? { phasesToVerify: local.phasesToVerify } : {})}
          // PRE-9 (ordre de Hermann du 01/11/2026, point 2) : Récupération de l'Exercice (bloc 6), seul
          // accès de réglage ; appliquée à la copie locale par le ✓, au brouillon par Terminer.
          {...(local !== null && local.type === "EXERCISE"
            ? {
                recovery: {
                  seconds: local.postActivityRecoverySeconds,
                  onApply: (seconds: number) =>
                    setLocal((current) => (current === null ? current : withExerciseRecovery(current, seconds))),
                },
              }
            : {})}
          profileDefaultsPending={local?.profileDefaultsPending === true}
          onParametersToVerifyAcknowledged={() => {
            if (local === null) return;
            const exerciseId = local.id;
            setLocal((current) => (current === null ? current : withoutPhasesToVerify(current)));
            updateDraft((current) => ({
              exercises: current.exercises.map((candidate) => (candidate.id === exerciseId ? withoutPhasesToVerify(candidate) : candidate)),
            }));
            sessionService?.acknowledgeParametersToVerify(exerciseId).catch((error: unknown) => {
              console.error("Impossible de retirer la marque « Paramètre à vérifier ».", error);
            });
          }}
          onNameEndEditing={originChoice.onNameEndEditing}
          nameAssist={originChoice.nameAssist}
          nameHint={nameHintVisible ? strings.screens.activities.editor.movementSuggestion.completeNameHint : null}
          level={occurrenceLevel}
          baselineParameters={baselineParameters}
          mediaService={activityDefinitionService}
          mediaDraftId={mediaDraftId}
          finishLabel={t.finishAction}
          onFinish={handleTerminer}
          isFinishDisabled={!isValid || originChoice.nameTaken}
          finishSlotTestID="exercise-finish-action-slot"
          finishActionTestID="exercise-finish-action"
        />
      ) : null}

      {categorySheet.isMounted ? (
        <CategoryPickerModal
          key={categorySheet.generation}
          visible={categorySheet.isOpen}
          onDismissed={categorySheet.dismissed}
          selectedId={local?.categoryId ?? null}
          onSelect={(id) => setLocal((current) => (current ? { ...current, categoryId: id } : current))}
          // Q53 (8) : Catégorie de la Copie supprimée depuis sa feuille : elle quitte le Brouillon,
          // et `Terminer` reste inactif tant qu'aucune Catégorie n'est choisie.
          onCategoryRetired={(id) => {
            if (local?.categoryId === id) setCategoryClearedByDeletion(true);
            setLocal((current) => (current && current.categoryId === id ? { ...current, categoryId: null } : current));
          }}
          onClose={() => {
            categorySheet.close();
            reloadCategories();
          }}
        />
      ) : null}

      {/* Q18 (FR-02-12) : textes de création en CS, de modification en MS (intention de la route). */}
      {isPendingExit ? (
        <ExerciseExitConfirmModal isCreation={isCreationRoute} onCancel={cancelExit} onConfirm={confirmExit} />
      ) : null}

      {pendingCircuitEntry !== null ? (
        <CircuitEntryConfirmModal
          kind="ADD"
          seriesCount={pendingCircuitEntry.targetCount}
          exerciseCount={1}
          onCancel={() => setPendingCircuitEntry(null)}
          onConfirm={() => {
            setPendingCircuitEntry(null);
            if (finishingRef.current || local === null) {
              return;
            }
            // Ajout rejoué sur le brouillon courant (aucun instantané rejoué).
            finishingRef.current = true;
            const replayed = planFinish(local);
            commitFinished(replayed.exercises, replayed.movements, undefined, replayed.structure);
          }}
        />
      ) : null}

      {/* PRE-7 (R-4, D-445 C03, C04) : Annuler rend l'éditeur et son brouillon intacts, rien n'est inscrit.
          PRE-7 (R-10, r9-5) : mêmes dialogues au crayon retouché ; Annuler y laisse l'édition ouverte. */}
      {pendingOccurrenceSave !== null && unlockedMovement !== null ? (
        pendingOccurrenceSave.decision.kind === "CHOICE" ? (
          <MovementSaveDialog
            variant="CHOICE"
            otherCount={pendingOccurrenceSave.decision.otherCount}
            onConfirm={(choice) => {
              setPendingOccurrenceSave(null);
              if (finishingRef.current) return;
              // PRE-7 (R-5, C01, v7 l.67 ; report R-4) : « Créer un nouveau mouvement » exige une clé
              // libre parmi TOUS les mouvements, l'original compris ; sinon le nom est signalé.
              if (choice !== "UPDATE" && !originChoice.checkDistinctName(pendingOccurrenceSave.occurrence.name)) return;
              applyOccurrenceSave(pendingOccurrenceSave, unlockedMovement, choice);
            }}
            onCancel={() => setPendingOccurrenceSave(null)}
          />
        ) : (
          <MovementSaveDialog
            variant="CONFIRM"
            otherCount={pendingOccurrenceSave.decision.otherCount}
            onConfirm={() => {
              setPendingOccurrenceSave(null);
              if (finishingRef.current) return;
              applyOccurrenceSave(pendingOccurrenceSave, unlockedMovement, "UPDATE");
            }}
            onCancel={() => setPendingOccurrenceSave(null)}
          />
        )
      ) : null}

      {originChoice.overlays}

      {/* PRE-7 (R-6, A3.2) : écran des niveaux ; niveaux relus à sa fermeture. */}
      {isLevelsScreenOpen && levelMovementId !== null ? (
        <MovementLevelsScreen
          service={activityDefinitionService}
          movementId={levelMovementId}
          onClose={() => {
            setIsLevelsScreenOpen(false);
            setLevelsReloadToken((current) => current + 1);
          }}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loadErrorBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // Marge latérale appliquée au rendu (`editorSideMargin`, story 4.2).
    gap: spacing[16],
  },
  loadErrorMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  loadErrorRetry: {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  loadErrorRetryLabel: {
    ...type.button,
    color: colors.background,
  },
  editMovementAction: {
    width: EDIT_MOVEMENT_ACTION.width,
    height: EDIT_MOVEMENT_ACTION.height,
    borderRadius: EDIT_MOVEMENT_ACTION.radius,
    backgroundColor: EDIT_MOVEMENT_ACTION.background,
    alignItems: "center",
    justifyContent: "center",
  },
  // PRE-7 (R-9, D-448 point 10) : crayon actif pendant l'édition du mouvement en Séance.
  editMovementActionActive: {
    backgroundColor: colors.primary,
  },
});
