import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { DEFAULT_TOUR_REPEAT_COUNT, DEFAULT_TOUR_SIDE_MODE } from "@/domain/sessions/defaults";
import type { StructuralPosition } from "@/domain/sessions/Session";
import {
  duplicateActivity,
  groupActivitiesByZone,
  moveActivity,
  removeActivity,
} from "@/domain/sessions/composition";
import {
  isSessionDraftDirty,
  sessionDraftsEqual,
  toCreateSessionInput,
  type SessionDraftExercise,
} from "@/domain/sessions/SessionDraft";
import { applyTourSideModeTransition, type SideMode } from "@/domain/sessions/sideMode";
import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { ColorPalette } from "@/features/sessions/ColorPalette";
import {
  isTap,
  LONG_PRESS_DELAY_MS,
  resolveDropTarget,
  type ActivityRowLayout,
  type CompositionDragLayout,
} from "@/features/sessions/compositionGesture";
import {
  formatActivityRecoveryLabel,
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseBodyZones,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { NumberWheelPicker } from "@/features/sessions/NumberWheelPicker";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { SideModeControl } from "@/features/sessions/SideModeControl";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { WheelPickerOverlay } from "@/features/sessions/WheelPickerOverlay";
import { strings } from "@/shared/i18n";
import { ContextBand, FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

type OverlayKind = "color" | "countdown" | "finalPhase" | "tour";

export type CompositionScreenProps = {
  /**
   * Identifiant de la Séance ouverte en MODIFICATION, tel que porté par la
   * route (`app/(creation)/composition.tsx`, paramètre `sessionId`) —
   * `null`/omis en création.
   *
   * **Correction non-flash (LOT_3_OF_3)** : cette information doit être
   * connue de l'écran DÈS SON PREMIER RENDU, donc passée en prop par la
   * route plutôt que déduite de `editStatus`. La réhydratation est
   * déclenchée par un `useEffect` (elle ne peut pas l'être autrement :
   * c'est une lecture asynchrone), et un effet s'exécute APRÈS le premier
   * commit — `editStatus` valait donc encore `"creating"` pendant ce
   * premier rendu, qui affichait le formulaire de création et ses valeurs
   * par défaut (nom vide, `00 min 10 s`/`00 min 05 s`, `0 activité · 0
   * min`) le temps d'une frame, avant d'être remplacé par l'état de
   * chargement. La présence de `sessionId` suffit à exclure
   * SYNCHRONIQUEMENT ce rendu (voir `editState` ci-dessous) — aucun effet,
   * aucun état intermédiaire, aucune frame de création possible.
   */
  readonly sessionId?: string | null;
};

/**
 * Écran `Composition d'une séance` (T01-S07, docs §06 Écran 3 ; corrections
 * de conformité — audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`,
 * instruction Codex de correction autonome ; consolidation Foundation —
 * `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`,
 * 2026-09-03 ; correction cumulative post contre-recette iPhone —
 * `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE CORRECTION`,
 * 2026-09-03, identifiants `C-01/C-02/T-01…T-05/A-01`) ; REWORK06
 * (`[ChatGPT] PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE LA
 * ROULETTE + VERROU DE CAPITALISATION`, 2026-09-04) — Header, zone Context
 * et zone Bottom Action sont désormais une **BASELINE GELÉE** (validation
 * iPhone utilisateur `CONFORME`) : conservées inchangées ce cycle, toute
 * régression de leur position est interdite (voir `.github/
 * AI_ORCHESTRATION.md`, « Conservation des acquis / Change Control »).
 *
 * Le brouillon vient de `SessionDraftProvider` (monté par
 * `app/(creation)/_layout.tsx`, au-dessus de cet écran) — cette route ne
 * connaît ni SQLite ni `SessionService` : aucun enregistrement n'a lieu
 * avant T01-S09.
 *
 * Un seul sélecteur intégré ouvert à la fois (couleur, Compte à rebours,
 * Fin de séance) — état `openOverlay` unique (plan §5).
 *
 * **CMP-01/Racine non interactive + backdrop dédié** (correction
 * consolidée) : l'écran entier n'est plus un `Pressable` racine (défaut
 * D-03 identifié — un `Pressable` plein écran intercepte le geste avant
 * même qu'il n'atteigne un contrôle imbriqué, y compris parfois le
 * contrôle qu'on cherche justement à ouvrir). La racine (`ScreenShell`) est
 * désormais un simple conteneur.
 *
 * **T01-S09, correction VISUAL (point D)** : ce backdrop dédié
 * (`composition-backdrop`, dismissible au toucher) ne reste actif QUE pour
 * la palette de couleur (`ContextBand`, mécanisme d'ancrage local
 * inchangé). Les roulettes numériques (Compte à rebours, Fin de séance)
 * n'utilisent plus ce mécanisme du tout — elles s'ouvrent dans
 * `WheelPickerOverlay`, une superposition plein écran dédiée dont le voile
 * de fond n'est jamais dismissible au toucher (voir plus bas).
 *
 * `+ Ajouter une activité` (T01-S08) navigue vers l'écran Exercice
 * (`/exercise`) ; celui-ci lit lui-même `draft.exercise` pour déterminer
 * s'il s'agit d'un ajout ou d'une modification — aucun paramètre de route
 * n'est nécessaire. Le modèle `SessionDraft.exercise` restant un unique
 * champ nullable (pas un tableau, hors périmètre T01), le bouton d'ajout
 * est masqué dès qu'un Exercice existe : une ligne récapitulative le
 * remplace, pressable pour rouvrir l'écran en modification.
 *
 * Chaque roulette (Compte à rebours, Fin de séance) s'ouvre désormais dans
 * `WheelPickerOverlay` (T01-S09, correction VISUAL point D) — une
 * superposition plein écran TRANSVERSALE à tout sélecteur numérique à
 * roulette de l'application (voir ce composant), qui remplace l'ancien
 * ancrage local en popover (`position: "absolute"` relatif à la ligne,
 * CE-T01-06/07, historique conservé ci-dessous pour `AnchoredRow`/
 * `PopoverAnchor`, retirés de cet écran par cette correction). La
 * validation de la valeur choisie n'a toujours lieu qu'à la fermeture du
 * sélecteur (démontage de `DurationWheelPicker`) — jamais à chaque cran de
 * défilement (D-06) ; seules ses propres actions Annuler/Confirmer ferment
 * désormais la superposition, jamais un toucher en dehors.
 *
 * `Retour` (correction CE-T01-04, AUD-03) : action visible identique au
 * patron déjà validé sur `ExerciseScreen.tsx` — navigation arrière normale,
 * interceptée par `useCompositionExitGuard` exactement comme le geste
 * système.
 */
export function CompositionScreen({ sessionId = null }: CompositionScreenProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft, resetDraft, editStatus, retryHydration, hydratedBaseline } =
    useSessionDraft();
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);
  // V2-CAT-01 (plan §4.4) : arbre `Ajouter une activité` — `Une nouvelle
  // activité` / `Une activité existante` / `Annuler`.
  const [isAddActivityTreeOpen, setIsAddActivityTreeOpen] = useState(false);
  // T02-S01 : une seule carte à la fois révèle ses actions glissées, et une
  // seule carte à la fois est soulevée (CE-T02-01/CE-T02-02).
  const [revealedActionsId, setRevealedActionsId] = useState<string | null>(null);
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null);
  // V2-BILAT-01 : direction du Tour EN ATTENTE de confirmation — non `null`
  // uniquement pendant le dialogue déterministe d'ACTIVATION de la
  // bilatéralité (transition `UNILATERAL` → direction bilatérale). `Annuler`
  // le vide sans muter le brouillon ; `Confirmer` applique la transition
  // atomique. Tout autre changement de direction (retour à `UNILATERAL`,
  // ou entre deux directions déjà bilatérales) s'applique immédiatement,
  // sans jamais passer par cet état.
  const [pendingTourSideMode, setPendingTourSideMode] = useState<SideMode | null>(null);

  // Géométrie mesurée du contenu défilant, nécessaire à la résolution d'une
  // dépose (`compositionGesture.ts`). Conservée en `ref` : elle ne doit
  // JAMAIS provoquer de rendu — la mesurer via un état re-déclencherait
  // `onLayout` en boucle.
  const zoneTopsRef = useRef<Partial<Record<StructuralPosition, number>>>({});
  const rowLayoutsRef = useRef(new Map<string, { top: number; height: number }>());
  const tourLayoutRef = useRef<{ top: number; height: number }>({ top: 0, height: 0 });

  // T01-S10 (CE-T01-S10-06) : en MODIFICATION, la garde de sortie compare le
  // brouillon à son état RÉHYDRATÉ (le dialogue d'abandon n'apparaît que si
  // quelque chose a changé) ; en création, elle compare au brouillon vide.
  const shouldBlockExit = hydratedBaseline
    ? !sessionDraftsEqual(draft, hydratedBaseline)
    : isSessionDraftDirty(draft);
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

  // T02-S01 (CE-T02-01) : la Composition restitue le brouillon réel dans
  // l'ordre structurel — Compte à rebours ; Activités AVANT le Tour ; Tour et
  // ses Activités ; Activités APRÈS le Tour ; Fin de séance.
  const zones = groupActivitiesByZone(draft.exercises);
  const tourRepeatCount = draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT;
  const tourSideMode = draft.tourSideMode ?? DEFAULT_TOUR_SIDE_MODE;

  /**
   * V2-BILAT-01 : applique atomiquement une nouvelle direction de Tour — la
   * direction elle-même ET la remise `UNILATERAL` de tous les enfants
   * `IN_TOUR` (`applyTourSideModeTransition`, sans effet si `next` reste
   * `UNILATERAL`) dans le MÊME `updateDraft`, jamais deux mutations
   * séparées.
   */
  const applyTourSideMode = useCallback(
    (next: SideMode) => {
      updateDraft({
        tourSideMode: next,
        exercises: applyTourSideModeTransition(draft.exercises, next),
      });
    },
    [draft.exercises, updateDraft],
  );

  /**
   * Réception du cran SUIVANT calculé par `SideModeControl`
   * (`cycleSideMode(tourSideMode)`, déjà résolu).
   *
   * **V2-BILAT-01 (plan `## Side-mode transitions`, « Tour activation »,
   * points 2 à 4)** : le dialogue déterministe n'est ouvert QUE lorsque
   * l'ACTIVATION de la bilatéralité (`UNILATERAL` → direction bilatérale)
   * remplacerait au moins un réglage propre déjà bilatéral parmi les
   * Activités `IN_TOUR` — « Request confirmation only when one or more
   * child bilateral settings would be replaced ». Un Tour vide ou dont
   * toutes les Activités `IN_TOUR` sont déjà unilatérales s'applique donc
   * DIRECTEMENT, sans confirmation (« An empty Tour or a Tour whose
   * children are all unilateral applies directly without confirmation »).
   * Tout autre changement (retour à `UNILATERAL`, ou entre deux directions
   * déjà bilatérales) s'applique toujours immédiatement — ces deux cas ne
   * remplacent jamais de réglage enfant (`applyTourSideModeTransition`
   * n'agit que sur une activation bilatérale).
   */
  const handleTourSideModeChange = useCallback(
    (next: SideMode) => {
      const activatesBilateral = tourSideMode === "UNILATERAL" && next !== "UNILATERAL";
      const replacesChildSetting =
        activatesBilateral &&
        draft.exercises.some(
          (activity) => activity.structuralPosition === "IN_TOUR" && activity.sideMode !== "UNILATERAL",
        );
      if (replacesChildSetting) {
        setPendingTourSideMode(next);
        return;
      }
      applyTourSideMode(next);
    },
    [applyTourSideMode, draft.exercises, tourSideMode],
  );

  const handleConfirmTourBilateral = useCallback(() => {
    if (pendingTourSideMode !== null) {
      applyTourSideMode(pendingTourSideMode);
    }
    setPendingTourSideMode(null);
  }, [applyTourSideMode, pendingTourSideMode]);

  const handleCancelTourBilateral = useCallback(() => {
    setPendingTourSideMode(null);
  }, []);

  const handleZoneLayout = useCallback((zone: StructuralPosition, event: LayoutChangeEvent) => {
    zoneTopsRef.current[zone] = event.nativeEvent.layout.y;
  }, []);

  const handleRowLayout = useCallback((activityId: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    rowLayoutsRef.current.set(activityId, { top: y, height });
  }, []);

  const handleTourLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    tourLayoutRef.current = { top: y, height };
  }, []);

  /**
   * Origine d'une liste de zone dans le repère du CONTENU DÉFILANT. Les
   * listes `BEFORE_TOUR`/`AFTER_TOUR` sont des enfants directs de ce contenu
   * — leur `y` mesuré est déjà absolu. La liste `IN_TOUR`, elle, est un
   * enfant de la structure Tour (c'est le contrat : les Activités du Tour
   * sont DANS le Tour) : son `y` est relatif à cette structure, dont il faut
   * donc ajouter la propre origine.
   */
  const zoneBaseTop = useCallback((zone: StructuralPosition): number => {
    const measured = zoneTopsRef.current[zone] ?? 0;
    return zone === "IN_TOUR" ? tourLayoutRef.current.top + measured : measured;
  }, []);

  /**
   * Géométrie absolue (repère du contenu défilant) de toutes les cartes et
   * de la structure Tour — l'entrée de `resolveDropTarget`.
   */
  const buildDragLayout = useCallback((): CompositionDragLayout => {
    const rows: ActivityRowLayout[] = [];
    for (const activity of draft.exercises) {
      const rowLayout = rowLayoutsRef.current.get(activity.id);
      if (rowLayout === undefined) {
        continue;
      }
      rows.push({
        id: activity.id,
        zone: activity.structuralPosition,
        top: zoneBaseTop(activity.structuralPosition) + rowLayout.top,
        height: rowLayout.height,
      });
    }
    return {
      tourTop: tourLayoutRef.current.top,
      tourBottom: tourLayoutRef.current.top + tourLayoutRef.current.height,
      rows,
    };
  }, [draft.exercises, zoneBaseTop]);

  const activityAbsoluteCenterY = useCallback(
    (activity: SessionDraftExercise): number => {
      const rowLayout = rowLayoutsRef.current.get(activity.id);
      if (rowLayout === undefined) {
        return 0;
      }
      return zoneBaseTop(activity.structuralPosition) + rowLayout.top + rowLayout.height / 2;
    },
    [zoneBaseTop],
  );

  const handleDropActivity = useCallback(
    (activity: SessionDraftExercise, translationY: number) => {
      const target = resolveDropTarget(
        buildDragLayout(),
        activity.id,
        activityAbsoluteCenterY(activity) + translationY,
      );
      const next = moveActivity(
        draft.exercises,
        activity.id,
        target.zone,
        target.index,
        tourSideMode,
      );
      if (next !== draft.exercises) {
        updateDraft({ exercises: next });
      }
    },
    [activityAbsoluteCenterY, buildDragLayout, draft.exercises, tourSideMode, updateDraft],
  );

  // API-COM-06 : duplication et suppression restent des opérations de
  // BROUILLON — aucune écriture persistante avant l'enregistrement final.
  const handleDuplicateActivity = useCallback(
    (activityId: string) => {
      setRevealedActionsId(null);
      updateDraft({
        exercises: duplicateActivity(draft.exercises, activityId, Crypto.randomUUID()),
      });
    },
    [draft.exercises, updateDraft],
  );

  const handleDeleteActivity = useCallback(
    (activityId: string) => {
      setRevealedActionsId(null);
      rowLayoutsRef.current.delete(activityId);
      updateDraft({ exercises: removeActivity(draft.exercises, activityId) });
    },
    [draft.exercises, updateDraft],
  );

  const handleEditActivity = useCallback(
    (activityId: string) => {
      router.push({ pathname: "/exercise", params: { exerciseId: activityId } });
    },
    [router],
  );
  // REWORK08-C (`[ChatGPT] CHANGES_REQUESTED — REWORK08 — roulette native +
  // synthèse Tour`, 2026-09-04, addendum précédemment `QUEUED_FOR_NEXT_
  // COMPOSITION_REWORK` désormais explicitement autorisé) : calculée UNE
  // SEULE FOIS, réutilisée à la fois par `TourCard` (nouvelle synthèse sous
  // `Nombre de tours`) et par `bottomAction` (synthèse déjà existante) —
  // même contenu canonique (`formatCompositionSummary`), jamais recalculé
  // ni reformulé localement pour l'un ou l'autre emplacement.
  //
  // REWORK13 (R13-02) : `initialCountdownSeconds`/`finalPhaseSeconds` ne
  // sont plus transmis — `Compte à rebours initial`/`Fin de séance` sont
  // des éléments structurels hors Tour, désormais toujours exclus de cette
  // synthèse (voir `compositionPresentation.ts`). Confirmer l'un ou
  // l'autre sélecteur n'actualise donc plus jamais `compositionSummary`,
  // par construction (ces deux champs du brouillon ne sont plus lus par
  // cette fonction).
  //
  // T02-S01 (CE-T02-01 « Calculs ») : la durée développe désormais les
  // répétitions du Tour — `tourRepeatCount` est donc transmis, et confirmer
  // la roulette du Tour actualise immédiatement cette synthèse. Le NOMBRE
  // affiché reste celui des Activités réellement composées, chacune une
  // seule fois.
  const compositionSummary = formatCompositionSummary({
    exercises: draft.exercises,
    tourRepeatCount,
    tourSideMode,
  });

  // T01-S09 (AC-01/AC-02, CE-T01-11) : `Continuer` s'active uniquement pour
  // une Composition valide — `toCreateSessionInput` est la même validation
  // complète que celle utilisée à l'enregistrement final (selectedCategoryIds
  // est nécessairement vide à ce stade du parcours, sans effet sur ce
  // résultat : D-106 n'exige jamais de Catégorie). Un brouillon invalide ne
  // peut donc jamais être poursuivi ni, a fortiori, persisté.
  //
  // **T02-S01 (CE-T02-01, clarification n° 6 du verdict de revue)** : il faut
  // en outre qu'au moins un EXERCICE subsiste — « supprimer le dernier
  // Exercice rend `Continuer` indisponible », même si des Récupérations
  // subsistent. Une Récupération est une Activité structurellement valide
  // pour le Domaine (D-041) : cette exigence est propre au parcours de
  // Composition (CE-T01-04, « au moins un Exercice valide »), et reste donc
  // exprimée ici plutôt qu'en durcissant une validation de persistance qui
  // n'est pas ouverte par cette tranche.
  const hasAtLeastOneExercise = draft.exercises.some((exercise) => exercise.type === "EXERCISE");
  const isCompositionValid = hasAtLeastOneExercise && toCreateSessionInput(draft).ok;

  // T01-S10 (CE-T01-S10-01/02/09) : en MODIFICATION, la réhydratation d'une
  // Séance existante passe par des états intermédiaires. Le formulaire n'est
  // rendu qu'une fois le brouillon prêt (`"creating"` = création classique,
  // `"ready"` = brouillon réhydraté). Les autres états rendent un écran dédié
  // — jamais le formulaire avec des valeurs par défaut de création
  // (CE-T01-S10-09 : « un échec de chargement ne présente jamais les valeurs
  // par défaut d'une nouvelle Séance »). Placé après tous les hooks.
  //
  // **Correction non-flash (LOT_3_OF_3)** : `sessionId` non nul signifie
  // MODIFICATION. Tant que la réhydratation n'a pas produit son propre
  // statut, `editStatus` vaut encore `"creating"` (valeur initiale du
  // provider, l'effet de réhydratation ne s'exécutant qu'après le premier
  // commit) — cet état est ici requalifié `"loading"` de façon purement
  // SYNCHRONE et dérivée (aucun `useState`/`useEffect` supplémentaire, donc
  // aucune frame intermédiaire possible) : avec un `sessionId`, le
  // formulaire de création et ses valeurs par défaut ne peuvent
  // structurellement jamais être rendus avant résolution.
  const resolvedStatus = editStatus ?? "creating";
  const editState =
    sessionId !== null && resolvedStatus === "creating" ? "loading" : resolvedStatus;
  if (editState !== "creating" && editState !== "ready") {
    return (
      <CompositionEditState
        status={editState}
        onRetry={() => retryHydration?.()}
        onBackToCatalogue={() => router.dismissTo("/")}
      />
    );
  }

  return (
    <ScreenShell>
      <FixedHeader
        title={composition.title}
        onBack={() => router.back()}
        backAccessibilityLabel={composition.backAccessibilityLabel}
      />
      <HeaderSeparator />

      <ContextBand elevated={openOverlay === "color"}>
        {/*
         * CMP-02 : le champ Nom et le sélecteur de couleur partagent
         * désormais UN SEUL champ blanc arrondi (`nameColorField`) posé sur
         * la bande Context — auparavant deux éléments distincts directement
         * sur le fond bleu pâle de la bande.
         */}
        <View style={styles.nameColorField} testID="composition-name-color-field">
          <TextInput
            value={draft.name}
            onChangeText={(text) => updateDraft({ name: text })}
            onFocus={closeOverlay}
            placeholder={composition.name}
            // R4-01 (`[ChatGPT] CHANGES_REQUESTED — Composition d'une
            // séance — audit indépendant REWORK04`, 2026-09-03) : le
            // placeholder lui-même utilise désormais `text-primary`
            // (`#141414`), pas seulement le texte réellement saisi —
            // corrige `placeholderTextColor`, précédemment
            // `colors.textSecondary`.
            placeholderTextColor={colors.textPrimary}
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

        {/*
         * CMP-02 : `+ Ajouter une activité` centré (auparavant
         * `alignSelf: "flex-start"`). Boîte visuelle compacte issue du
         * composant DS (`dimensions.compactSecondaryButton`, même token que
         * le bouton Créer du Catalogue) — fond blanc, bordure/icône/texte
         * primaires, cible tactile `≥48` via `hitSlop` indépendante de la
         * boîte visuelle.
         *
         * **Complétion REWORK12 (COMP-03)** (`[ChatGPT] Applique
         * impérativement le protocole KODJO actif...`, 2026-09-04) : reste
         * désormais TOUJOURS visible et utilisable, y compris après l'ajout
         * d'une ou plusieurs Activités — abroge la restriction précédente
         * (« Masqué dès qu'un Exercice existe », modèle T01 à Exercice
         * unique) : `draft.exercises` est désormais une collection ordonnée
         * (`SessionDraft.ts`), et ce bouton navigue systématiquement vers
         * `/exercise` SANS paramètre `exerciseId` — un identifiant frais y
         * est généré, ajoutant toujours une NOUVELLE Activité en fin de
         * collection, jamais en remplacement d'une existante.
         */}
        <Pressable
          onPress={() => setIsAddActivityTreeOpen(true)}
          accessibilityRole="button"
          accessibilityState={{ disabled: false }}
          accessibilityLabel={composition.addActivity}
          hitSlop={{
            top: (minTouchTarget - dimensions.compactSecondaryButton.visualHeight) / 2,
            bottom: (minTouchTarget - dimensions.compactSecondaryButton.visualHeight) / 2,
            left: spacing[8],
            right: spacing[8],
          }}
          style={styles.addActivityAction}
          testID="composition-add-activity-action"
        >
          <KodjoIcon name="action-add" testID="composition-add-activity-icon" />
          <Text style={styles.addActivityLabel}>{composition.addActivity}</Text>
        </Pressable>
      </ContextBand>

      {/*
       * V2-CAT-01 (plan §4.4) : arbre exact `Une nouvelle activité` / `Une
       * activité existante` / `Annuler`. `Une nouvelle activité` crée une
       * `SessionActivity` locale (route `/exercise`, comportement préservé à
       * l'identique) ; `Une activité existante` ouvre la sélection multiple
       * des définitions persistantes (`/activity-selection`) ; `Annuler`
       * ferme sans écriture.
       */}
      {isAddActivityTreeOpen ? (
        <>
          <Pressable
            onPress={() => setIsAddActivityTreeOpen(false)}
            accessible={false}
            testID="composition-add-activity-tree-backdrop"
            style={styles.backdrop}
          />
          <View style={styles.addActivityTree} testID="composition-add-activity-tree">
            <Pressable
              onPress={() => {
                setIsAddActivityTreeOpen(false);
                router.push("/exercise");
              }}
              accessibilityRole="button"
              accessibilityLabel={strings.screens.activities.addToSession.newActivity}
              style={styles.addActivityTreeOption}
              testID="composition-add-activity-tree-new"
            >
              <Text style={styles.addActivityTreeOptionLabel}>
                {strings.screens.activities.addToSession.newActivity}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsAddActivityTreeOpen(false);
                router.push("/activity-selection");
              }}
              accessibilityRole="button"
              accessibilityLabel={strings.screens.activities.addToSession.existingActivity}
              style={styles.addActivityTreeOption}
              testID="composition-add-activity-tree-existing"
            >
              <Text style={styles.addActivityTreeOptionLabel}>
                {strings.screens.activities.addToSession.existingActivity}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setIsAddActivityTreeOpen(false)}
              accessibilityRole="button"
              accessibilityLabel={strings.screens.activities.addToSession.cancel}
              style={styles.addActivityTreeOption}
              testID="composition-add-activity-tree-cancel"
            >
              <Text style={styles.addActivityTreeOptionLabel}>
                {strings.screens.activities.addToSession.cancel}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {/*
       * R4-13 (`Fixed Header + Fixed Context + Scrollable Content + Fixed
       * Bottom Action`, `[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL /
       * ACTIVITIES SCROLL CONTRACT`, 2026-09-03) : `composition-body` est
       * désormais un unique `ScrollView` — le seul conteneur défilant de
       * l'écran. Header/séparateur/bande Context restent au-dessus, hors de
       * ce `ScrollView` (jamais recouverts) ; la zone d'action basse
       * (synthèse + `Continuer`) reste en dessous, également hors de ce
       * `ScrollView` (S-01 à S-04). `keyboardShouldPersistTaps="handled"` :
       * un appui sur une ligne/action de cette liste reste effectif même si
       * le champ Nom a le focus clavier, sans nécessiter un premier appui
       * « perdu » pour seulement fermer le clavier (même patron déjà
       * établi sur `ExerciseScreen.tsx`).
       *
       * **REWORK08-B, superséde par la correction VISUAL T01-S09 (point D)** :
       * les roulettes (Compte à rebours, Fin de séance) n'étaient jusqu'ici
       * pas rendues en flux mais restaient ANCRÉES en popover à l'intérieur
       * de ce `ScrollView` (`AnchoredRow`/`PopoverAnchor`, `position:
       * absolute` relatif à leur ligne). REWORK08-B avait diagnostiqué et
       * corrigé un défaut de portée de `zIndex` propre à ce mécanisme
       * d'ancrage local (un `ScrollView` élevé au-dessus du `backdrop`
       * partagé). La correction VISUAL retire désormais entièrement ce
       * mécanisme d'ancrage pour les roulettes — remplacé par
       * `WheelPickerOverlay`, une superposition plein écran TRANSVERSALE
       * (rendue en dehors de ce `ScrollView`, voir plus bas), dont la
       * position ne dépend structurellement plus ni de la ligne
       * déclenchrice ni du défilement (exigence explicite de la revue,
       * root cause du défaut historique de clipping/`zIndex` évoqué par
       * REWORK08-B, désormais éliminée par construction plutôt que
       * contournée). `AnchoredRow`/`PopoverAnchor`/`bodyElevated` sont
       * donc retirés de cet écran ; seul le mécanisme de superposition
       * dédié à la palette de couleur (`ContextBand.elevated`, gérée par
       * son propre composant, jamais une roulette numérique) reste
       * inchangé — hors périmètre de cette correction (D ne s'applique
       * qu'aux sélecteurs numériques à roulette).
       */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        // T02-S01 (D-127/CE-T02-02) : pendant un déplacement de carte, le
        // défilement est neutralisé — le geste vertical appartient alors
        // exclusivement à la carte soulevée, jamais à la liste.
        scrollEnabled={draggedActivityId === null}
        testID="composition-body"
      >
        <BoundaryActivityRow
          icon="composition-initial-countdown"
          label={composition.countdown.label}
          value={formatDurationRowValue(draft.initialCountdownSeconds)}
          isOpen={openOverlay === "countdown"}
          onPress={() => toggleOverlay("countdown")}
        />

        {/*
         * UI-COMP-003 : une nouvelle Activité s'insère ICI — entre Compte à
         * rebours initial et Tour (`DEFAULT_STRUCTURAL_POSITION` =
         * `BEFORE_TOUR` depuis T02-S01), jamais après Tour par défaut, puis
         * peut être déplacée.
         *
         * **T02-S01 (CE-T02-01, AC-01)** : les Activités ne forment plus une
         * seule liste implicitement « dans le Tour » — elles sont réparties
         * dans les TROIS zones structurelles réelles, dont deux encadrent la
         * structure Tour et une lui est INTÉRIEURE. Chaque zone conserve son
         * conteneur (`exerciseList`) et sa règle : rendue uniquement si elle
         * contient au moins une Activité, pour ne jamais ajouter un `gap`
         * structurel à vide. **T02-S02 (continuation)** : cet écart et celui
         * de `bodyContent` partagent désormais `COMPOSITION_ROW_GAP`, ce qui
         * rend le rythme vertical régulier de bout en bout. Presser une carte
         * ouvre `/exercise` avec son propre
         * `exerciseId` (édition ciblée par identifiant) — jamais celui d'une
         * autre Activité.
         */}
        <ActivityZoneList
          zone="BEFORE_TOUR"
          testID="composition-zone-before-tour"
          activities={zones.beforeTour}
          tourSideMode={tourSideMode}
          revealedActionsId={revealedActionsId}
          draggedActivityId={draggedActivityId}
          onLayout={handleZoneLayout}
          onRowLayout={handleRowLayout}
          onEdit={handleEditActivity}
          onRevealActions={setRevealedActionsId}
          onDragStart={setDraggedActivityId}
          onDragEnd={handleDropActivity}
          onDuplicate={handleDuplicateActivity}
          onDelete={handleDeleteActivity}
        />

        <TourCard
          label={composition.tour.label}
          summary={compositionSummary}
          repeatCount={tourRepeatCount}
          isOpen={openOverlay === "tour"}
          onPress={() => toggleOverlay("tour")}
          onLayout={handleTourLayout}
          sideMode={tourSideMode}
          onSideModeChange={handleTourSideModeChange}
        >
          <ActivityZoneList
            zone="IN_TOUR"
            testID="composition-zone-in-tour"
            activities={zones.inTour}
            tourSideMode={tourSideMode}
            revealedActionsId={revealedActionsId}
            draggedActivityId={draggedActivityId}
            onLayout={handleZoneLayout}
            onRowLayout={handleRowLayout}
            onEdit={handleEditActivity}
            onRevealActions={setRevealedActionsId}
            onDragStart={setDraggedActivityId}
            onDragEnd={handleDropActivity}
            onDuplicate={handleDuplicateActivity}
            onDelete={handleDeleteActivity}
          />
        </TourCard>

        <ActivityZoneList
          zone="AFTER_TOUR"
          testID="composition-zone-after-tour"
          activities={zones.afterTour}
          tourSideMode={tourSideMode}
          revealedActionsId={revealedActionsId}
          draggedActivityId={draggedActivityId}
          onLayout={handleZoneLayout}
          onRowLayout={handleRowLayout}
          onEdit={handleEditActivity}
          onRevealActions={setRevealedActionsId}
          onDragStart={setDraggedActivityId}
          onDragEnd={handleDropActivity}
          onDuplicate={handleDuplicateActivity}
          onDelete={handleDeleteActivity}
        />

        <BoundaryActivityRow
          icon="composition-end-session"
          label={composition.finalPhase.label}
          value={formatDurationRowValue(draft.finalPhaseSeconds)}
          isOpen={openOverlay === "finalPhase"}
          onPress={() => toggleOverlay("finalPhase")}
        />
      </ScrollView>

      {/*
       * CMP-06 (contre-recette iPhone, correction consolidée, 2026-09-03) :
       * zone d'action basse (`bottomAction`), poussée en bas
       * (`marginTop: "auto"`).
       *
       * REWORK09 (mission directe utilisateur, 2026-09-04, point 2
       * « CORRECTIONS CONNEXES — COMPOSITION ») : la ligne de synthèse
       * `0 activité · 0 min` précédemment affichée ICI est **supprimée** —
       * devenue redondante depuis REWORK08-C, qui affiche désormais la même
       * synthèse canonique (`compositionSummary`) directement sous le
       * libellé `Nombre de tours` (voir `TourCard` ci-dessus). `Continuer`
       * reste seul dans cette zone ; le style `summary` (devenu sans
       * consommateur) est supprimé avec elle plutôt que laissé mort.
       */}
      <View
        testID="composition-bottom-action"
        style={[styles.bottomAction, { marginBottom: insets.bottom + spacing[16] }]}
      >
        {/*
         * `Continuer` (CE-T01-04, résolu T01-S09) : activation conditionnelle
         * — une Composition valide (Nom + toutes les Activités, voir
         * `isCompositionValid` ci-dessus) ouvre désormais réellement l'écran
         * `Catégories de la séance` (`/categories`, CE-T01-11). Le brouillon
         * partagé (`SessionDraftProvider`) survit à cette navigation, comme à
         * toute autre navigation entre écrans de ce même `Stack`.
         */}
        <Pressable
          disabled={!isCompositionValid}
          onPress={() => router.push("/categories")}
          accessibilityRole="button"
          accessibilityState={{ disabled: !isCompositionValid }}
          accessibilityLabel={composition.continueAction}
          style={[styles.continueAction, !isCompositionValid ? null : styles.continueActionEnabled]}
        >
          <Text style={styles.continueLabel}>{composition.continueAction}</Text>
        </Pressable>
      </View>

      {/*
       * Backdrop dédié (CMP-01/D-03) — désormais réservé à la palette de
       * couleur (`ContextBand`, ancrage local inchangé) : la correction
       * VISUAL (point D) retire les roulettes numériques de ce mécanisme,
       * qui se ferment uniquement via leurs propres actions Annuler/
       * Confirmer (voir `WheelPickerOverlay`), jamais par un toucher en
       * dehors.
       */}
      {openOverlay === "color" ? (
        <Pressable
          onPress={closeOverlay}
          accessible={false}
          testID="composition-backdrop"
          style={styles.backdrop}
        />
      ) : null}

      {/*
       * T01-S09, correction VISUAL (point D) : chaque roulette numérique
       * s'ouvre désormais dans `WheelPickerOverlay`, une superposition
       * plein écran rendue ici — frère direct de `ScreenShell`, jamais un
       * descendant du `ScrollView` défilant ni ancrée à sa ligne
       * déclenchrice — voir ce composant pour la justification complète.
       */}
      <WheelPickerOverlay visible={openOverlay === "countdown"}>
        <DurationWheelPicker
          totalSeconds={draft.initialCountdownSeconds}
          onValidate={(totalSeconds) => {
            updateDraft({ initialCountdownSeconds: totalSeconds });
            closeOverlay();
          }}
          onCancel={closeOverlay}
          minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
          secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
          cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
          validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
        />
      </WheelPickerOverlay>
      <WheelPickerOverlay visible={openOverlay === "finalPhase"}>
        <DurationWheelPicker
          totalSeconds={draft.finalPhaseSeconds}
          onValidate={(totalSeconds) => {
            updateDraft({ finalPhaseSeconds: totalSeconds });
            closeOverlay();
          }}
          onCancel={closeOverlay}
          minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
          secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
          cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
          validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
        />
      </WheelPickerOverlay>

      {/*
       * T02-S01 (CE-T02-01 « Nombre de Tours », AC-08/AC-09) : le contrôle
       * `Nombre de tours` devient fonctionnel et ouvre `Picker / Popover —
       * Source exact`, variante `Type=Numeric wheel` (`3210:49`) — la MÊME
       * primitive `NumberWheelPicker` que Séries/Répétitions (roulette
       * native iOS `@expo/ui/swift-ui`, `pickerStyle('wheel')`), dans le MÊME
       * overlay centré au voile bloquant que les deux roulettes de durée. Ses
       * bornes `1..99` sont celles du composant (`WHEEL_NUMBER_MIN`/
       * `WHEEL_NUMBER_MAX`, D-058) : aucune valeur invalide n'est atteignable.
       * `Annuler` ferme sans rien modifier ; `Confirmer` applique exactement
       * la valeur centrée AU BROUILLON (jamais d'écriture persistante ici —
       * la valeur n'est enregistrée qu'à l'enregistrement final).
       */}
      <WheelPickerOverlay visible={openOverlay === "tour"}>
        <NumberWheelPicker
          value={tourRepeatCount}
          onValidate={(value) => {
            updateDraft({ tourRepeatCount: value });
            closeOverlay();
          }}
          onCancel={closeOverlay}
          accessibilityLabel={composition.tour.valueAccessibilityLabel}
          cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
          validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
          testID="composition-tour-wheel-picker"
        />
      </WheelPickerOverlay>

      {isPendingExit ? <AbandonCreationModal onCancel={cancelExit} onConfirm={confirmExit} /> : null}

      {/*
       * V2-BILAT-01 (plan `## UI`) : dialogue déterministe d'ACTIVATION de la
       * bilatéralité du Tour — `Annuler` ne produit aucune mutation
       * (`handleCancelTourBilateral`, `pendingTourSideMode` remis à `null`
       * sans toucher au brouillon) ; `Confirmer` applique la transition
       * atomique (`handleConfirmTourBilateral`).
       */}
      {pendingTourSideMode !== null ? (
        <DecisionDialog
          title={composition.tourBilateralConfirmModal.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={composition.tourBilateralConfirmModal.message}
          messageStyle={{
            ...type.dialogMessage,
            color: colors.dialogMessageText,
            textAlign: "justify",
          }}
          cancelLabel={composition.tourBilateralConfirmModal.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={composition.tourBilateralConfirmModal.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          // V2-BILAT-01 (plan `## UI`, « Confirmation dialog ») : « The
          // dialog must use the Composition/Tour instance styling
          // established by CE-BIL-02, not the Activity-abandon dialog
          // styling » — `confirmBordered={true}`, exactement comme
          // `AbandonCreationModal` (Composition/Séance), jamais `false`
          // (réservé à l'instance Activité, `ExerciseExitConfirmModal`).
          confirmBordered={true}
          onCancel={handleCancelTourBilateral}
          onConfirm={handleConfirmTourBilateral}
          testIDPrefix="composition-tour-bilateral-confirm"
        />
      ) : null}
    </ScreenShell>
  );
}

/**
 * `Boundary Activity` (Compte à rebours initial / Fin de séance) —
 * correction CMP-03/CMP-05 (contre-recette iPhone, correction consolidée,
 * `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`,
 * 2026-09-03) : nouvel ordre de slots, explicitement demandé par cette
 * revue et qui **remplace** la disposition `LAY-05` précédente (gauche
 * icône / centre libellé / droite valeur+chevron) — pas une ambiguïté
 * résolue localement, une instruction directe et autorisée.
 *
 * Slots : gauche = poignée/structure (`handleSlot`) ; centre = libellé puis,
 * sur une seconde ligne, la valeur de durée déjà formatée
 * (`formatDurationRowValue`, format `MM min SS s` — inchangé, c'est la
 * valeur réellement engagée par la roulette, voir D-06) ; droite = icône de
 * rôle (déplacée depuis le slot gauche).
 *
 * **C-01/C-02** (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02
 * REWORK03 CUMULATIVE CORRECTION`, 2026-09-03) : fond désormais blanc avec
 * un liseré gris visible (`limitCardBase`, partagé avec `TourCard` — voir
 * T-01) — auparavant `colors.surface` (gris), jugé non conforme au rendu
 * réel. Le slot gauche porte désormais un pictogramme
 * (`structureIcon`, prop dédiée, défaut `composition-reorder` — même
 * pictogramme « déplacement/structure » que `Composition / Activity Row`,
 * réutilisation désormais explicitement demandée par cette revue, qui
 * abroge la restriction posée au cycle précédent) ; la prop permet son
 * remplacement ultérieur par un pictogramme « carte fixe/non déplaçable »
 * sans toucher au layout (CMP-03/05 initial, cycle précédent, avait laissé
 * ce slot vide faute d'instruction explicite de réutilisation).
 *
 * **Chevron définitivement retiré** (`[ChatGPT] PLAN_APPROVED — REWORK06 —
 * RESTAURATION CIBLÉE DE LA ROULETTE + VERROU DE CAPITALISATION`,
 * 2026-09-04, addendum « écarts visuels encore ouverts ») : le cycle
 * précédent conservait un chevron (`control-chevron-up`) uniquement à
 * l'état ouvert — cet élément supplémentaire, ajouté à droite de l'icône de
 * rôle, faisait varier le nombre d'enfants de la rangée entre les états
 * fermé/ouvert, donc la position de l'icône de rôle elle-même (« l'icône
 * fonctionnelle de la carte... doit garder exactement la même position
 * ouverte et fermée »). Le chevron est désormais entièrement supprimé, à
 * l'état ouvert comme fermé — `accessibilityState.expanded` porte déjà
 * cette information pour l'accessibilité, sans dépendre d'un indice visuel
 * qui décale la mise en page.
 *
 * **REWORK07-A** (`[ChatGPT] CHANGES_REQUESTED — REWORK07-A — ICON /
 * STRUCTURE / MOVABLE UNIQUEMENT`, 2026-09-04) : le slot gauche
 * (`boundaryRowHandleSlot`) revient de `32×32` (REWORK06) à `28×28`
 * (`dimensions.structureMovableIcon.slot`) — la valeur canonique du
 * composant Figma/DSF `Icon / Structure / Movable` (`3066:4676`), pas un
 * abandon de la correction REWORK06 : l'asset affiché a lui-même été
 * remplacé par son export canonique (voir `KodjoIcon.tsx`), qui occupe
 * réellement son canevas — l'agrandissement précédent du conteneur
 * compensait un glyphe sous-dimensionné, plus nécessaire une fois l'asset
 * corrigé. L'opacité `0.5` du pictogramme n'est plus passée localement
 * (`opacity={0.5}` supprimé) — portée par défaut dans `KodjoIcon.tsx`
 * (`defaultOpacities`), automatiquement appliquée sans paramètre d'écran.
 *
 * **REWORK12 (COMP-01)** (`[ChatGPT] CHANGES_REQUESTED — REWORK12 —
 * Activité + intégration dans Composition`, 2026-09-04) : `icon` devient
 * nullable — vérifié directement sur les nœuds Figma actuels (`2028:11723`
 * pour `Composition / Boundary Activity — Source exact`, `2028:11733` pour
 * `Composition / Activity Row`, `2588:2679`) que ces deux composants
 * partagent EXACTEMENT la même anatomie de carte (fond, liseré, rayon,
 * hauteur, slot structure `28×28` à gauche) à une seule différence près :
 * `Boundary Activity` porte une icône de rôle supplémentaire dans un
 * troisième slot à droite (`icon`), que `Activity Row` n'a jamais —
 * `icon={null}` omet entièrement ce troisième slot plutôt que de le rendre
 * vide, pour rester fidèle à la structure Figma réelle de `Activity Row`
 * (aucun troisième slot du tout, pas un slot présent mais inoccupé).
 * `accessibilityLabel`/`testID` deviennent des props optionnelles
 * (`accessibilityLabel` par défaut = `label`, comportement inchangé pour
 * les deux appelants `Boundary Activity` existants) — nécessaires à la
 * ligne Exercice, dont le nom accessible (`Modifier l'exercice`) diffère du
 * titre affiché (nom réel de l'Activité) et dont les tests doivent pouvoir
 * cibler cette rangée précisément (les trois appels de ce composant
 * partagent sinon les mêmes `testID` internes, jamais uniques par défaut).
 *
 * **T02-S01** : ce composant ne sert plus qu'aux DEUX cartes structurelles
 * fixes (`Compte à rebours initial`/`Fin de séance`) — non déplaçables, non
 * duplicables, non supprimables et sans actions glissées (AC-05). Les cartes
 * d'Activité sont désormais rendues par `CompositionActivityRow` ci-dessus,
 * qui RÉUTILISE exactement la même anatomie (`limitCardBase`/`boundaryRow`,
 * slot structure `28 × 28`, titre, ligne de Zones corporelles, synthèse) et
 * y ajoute la seule chose qui les distingue : la gestuelle. `icon`,
 * `bodyZones`, `accessibilityLabel` et `testID` restent des props du contrat
 * public de ce composant, désormais non employées par ses deux seuls
 * appelants.
 */
function BoundaryActivityRow({
  icon,
  label,
  bodyZones = null,
  value,
  isOpen,
  onPress,
  structureIcon = "composition-reorder",
  accessibilityLabel = label,
  testID,
}: {
  /** `null` omet entièrement le troisième slot (droite) — anatomie exacte de `Composition / Activity Row`, qui n'en a jamais. */
  icon: KodjoIconName | null;
  label: string;
  /**
   * Correction compacte LOT_3_OF_3 : Zones corporelles de l'Activité déjà
   * formatées (`formatExerciseBodyZones`), insérées ENTRE le titre et la
   * synthèse. `null` (défaut) omet entièrement la ligne — les deux cartes
   * limites (`Compte à rebours initial`/`Fin de séance`) n'ont pas de Zones
   * et restent donc rigoureusement inchangées.
   */
  bodyZones?: string | null;
  value: string;
  isOpen: boolean;
  onPress: () => void;
  /** C-02 : pictogramme du slot gauche — remplaçable sans changer le layout (ex. futur pictogramme « carte fixe »). */
  structureIcon?: KodjoIconName;
  /** REWORK12 : nom accessible distinct du titre affiché — par défaut `label` (comportement inchangé des deux appelants `Boundary Activity`). */
  accessibilityLabel?: string;
  /** REWORK12 : identifiant de la rangée elle-même, pour un ciblage de test sans ambiguïté entre les appels de ce composant. */
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: isOpen }}
      style={[styles.limitCardBase, styles.boundaryRow]}
      testID={testID}
    >
      <View style={styles.boundaryRowHandleSlot} testID="composition-boundary-handle-slot">
        <KodjoIcon name={structureIcon} testID="composition-boundary-handle-icon" />
      </View>
      <View style={styles.boundaryRowTitleSlot}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        {/*
         * Correction compacte LOT_3_OF_3 — Zones corporelles de l'ACTIVITÉ
         * uniquement (jamais une Catégorie de Séance, qui n'appartient pas
         * à l'Activité), placées entre le titre et la synthèse. Style
         * `boundaryRowSecondaryLine` RÉUTILISÉ TEL QUEL — donc exactement la
         * même taille et la même couleur neutre (`type.caption` 11/14,
         * `colors.textSecondary`) que la synthèse juste en dessous, par
         * construction plutôt que par ressemblance. `numberOfLines={1}` :
         * une seule ligne, tronquée si nécessaire. Séparateur ` · `
         * (`COMPACT_LIST_SEPARATOR`, partagé avec la synthèse).
         */}
        {bodyZones !== null ? (
          <Text
            style={styles.boundaryRowSecondaryLine}
            numberOfLines={1}
            testID="composition-exercise-body-zones"
          >
            {bodyZones}
          </Text>
        ) : null}
        <Text style={styles.boundaryRowSecondaryLine} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {icon !== null ? (
        <View style={styles.boundaryRowIconSlot}>
          <KodjoIcon name={icon} testID={`composition-row-icon-${icon}`} />
        </View>
      ) : null}
    </Pressable>
  );
}

type ActivityZoneListProps = {
  readonly zone: StructuralPosition;
  readonly testID: string;
  readonly activities: readonly SessionDraftExercise[];
  /**
   * V2-BILAT-01 : direction courante du Tour — permet de déterminer, ZONE
   * PAR ZONE (toutes les Activités d'un même appel partagent la même
   * `zone`), si la direction affichée par chaque carte est PROPRE ou
   * héritée du Tour (`zone === "IN_TOUR"` et Tour bilatéral).
   */
  readonly tourSideMode: SideMode;
  readonly revealedActionsId: string | null;
  readonly draggedActivityId: string | null;
  readonly onLayout: (zone: StructuralPosition, event: LayoutChangeEvent) => void;
  readonly onRowLayout: (activityId: string, event: LayoutChangeEvent) => void;
  readonly onEdit: (activityId: string) => void;
  readonly onRevealActions: (activityId: string | null) => void;
  readonly onDragStart: (activityId: string | null) => void;
  readonly onDragEnd: (activity: SessionDraftExercise, translationY: number) => void;
  readonly onDuplicate: (activityId: string) => void;
  readonly onDelete: (activityId: string) => void;
};

/**
 * Liste des Activités d'UNE zone structurelle (T02-S01, CE-T02-01).
 *
 * Conserve exactement le conteneur à écart réduit de la correction compacte
 * LOT_3_OF_3 (`exerciseList`, `gap: 8`) et sa règle : rendu UNIQUEMENT s'il
 * existe au moins une Activité — un conteneur vide resterait un enfant du
 * contenu défilant et ajouterait un second `gap: 16` structurel. La règle
 * est désormais appliquée zone par zone ; une zone vide reste néanmoins une
 * destination de dépose valide, la résolution ne dépendant pas de la hauteur
 * des listes mais de la position de la structure Tour (`compositionGesture
 * .ts`).
 */
function ActivityZoneList({
  zone,
  testID,
  activities,
  tourSideMode,
  revealedActionsId,
  draggedActivityId,
  onLayout,
  onRowLayout,
  onEdit,
  onRevealActions,
  onDragStart,
  onDragEnd,
  onDuplicate,
  onDelete,
}: ActivityZoneListProps) {
  if (activities.length === 0) {
    return null;
  }
  // V2-BILAT-01 : une Activité `IN_TOUR` sous un Tour déjà bilatéral affiche
  // TOUJOURS la direction du Tour, jamais la sienne propre — jamais de
  // clause/indicateur de direction pour ces cartes (`formatExerciseRowSummary`).
  const isSideModeInherited = zone === "IN_TOUR" && tourSideMode !== "UNILATERAL";
  return (
    <View
      style={styles.exerciseList}
      onLayout={(event) => onLayout(zone, event)}
      testID={testID}
    >
      {activities.map((activity) => (
        <CompositionActivityRow
          key={activity.id}
          activity={activity}
          isSideModeInherited={isSideModeInherited}
          areActionsRevealed={revealedActionsId === activity.id}
          isDragged={draggedActivityId === activity.id}
          onLayout={(event) => onRowLayout(activity.id, event)}
          onEdit={() => onEdit(activity.id)}
          onRevealActions={() => onRevealActions(activity.id)}
          onHideActions={() => onRevealActions(null)}
          onDragStart={() => onDragStart(activity.id)}
          onDragCancel={() => onDragStart(null)}
          onDragEnd={(translationY) => {
            onDragStart(null);
            onDragEnd(activity, translationY);
          }}
          onDuplicate={() => onDuplicate(activity.id)}
          onDelete={() => onDelete(activity.id)}
        />
      ))}
    </View>
  );
}

type CompositionActivityRowProps = {
  readonly activity: SessionDraftExercise;
  /**
   * V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
   * `true` pour une Activité `IN_TOUR` gouvernée par un Tour déjà bilatéral
   * — sa direction affichée est alors celle du Tour, jamais la sienne
   * propre : ni l'indicateur de direction ni la clause de résumé ne
   * s'affichent dans ce cas (`formatExerciseRowSummary`).
   */
  readonly isSideModeInherited: boolean;
  readonly areActionsRevealed: boolean;
  readonly isDragged: boolean;
  readonly onLayout: (event: LayoutChangeEvent) => void;
  readonly onEdit: () => void;
  readonly onRevealActions: () => void;
  readonly onHideActions: () => void;
  readonly onDragStart: () => void;
  readonly onDragCancel: () => void;
  readonly onDragEnd: (translationY: number) => void;
  readonly onDuplicate: () => void;
  readonly onDelete: () => void;
};

/**
 * V2-CAT-01 (CE-T03-08, UI-CAT-R-007/010) : décalage horizontal MAXIMAL de la
 * carte lorsqu'elle est entièrement ouverte — la largeur du groupe d'actions
 * (`compositionSwipeActions.groupWidth`) PLUS la marge canonique carte/cadre
 * Tour (`compositionTourSection.inset`), pour que cette même marge sépare
 * visuellement la carte ouverte du groupe d'actions et laisse voir le fond
 * du Tour, comme prescrit par le plan (« le gap entre carte et actions égale
 * la marge carte/cadre Tour »). Aucune valeur locale : dérivée des deux
 * tokens DSF déjà canoniques, jamais un littéral.
 */
const SWIPE_REVEAL_OFFSET =
  dimensions.compositionSwipeActions.groupWidth + dimensions.compositionTourSection.inset;

/** Borne `x` à `[-SWIPE_REVEAL_OFFSET, 0]` — la carte ne peut jamais se translater au-delà de sa position ouverte, ni en-deçà de sa position fermée. */
function clampSwipeTranslateX(x: number): number {
  return Math.min(0, Math.max(-SWIPE_REVEAL_OFFSET, x));
}

/**
 * `Composition / Activity Row` (`2588:2679`, D-128) et ses deux états T02 —
 * actions glissées (`2028:11808`) et carte soulevée (`3518:4621`, D-129).
 *
 * **Gestes (CE-T02-01/CE-T02-02, D-127)** — quatre états mutuellement
 * exclusifs, arbitrés par un UNIQUE reconnaisseur :
 *
 * | Geste | Résultat |
 * | --- | --- |
 * | Appui court | Ouvre l'Activité en modification. |
 * | Appui long sur TOUTE la carte | Engage la réorganisation, sans ouvrir la modification. |
 * | Déplacement après appui long | Change l'ordre dans la zone, ou de zone. |
 * | Glissement gauche | Révèle `Dupliquer` et `Supprimer`. |
 *
 * **Répartition des primitives natives** (`.github/AI_ORCHESTRATION.md`,
 * « Priorité aux primitives natives de l'OS ») :
 *
 * - l'appui court et l'appui long sont ceux de `Pressable` — la primitive
 *   d'appui de React Native, avec son `delayLongPress`, son annulation
 *   automatique dès qu'un autre responder prend la main, et son rôle
 *   d'accessibilité ; `Pressable` n'appelle JAMAIS `onPress` après un
 *   `onLongPress`, d'où l'exclusivité exigée par AC-02 par construction
 *   plutôt que par un verrou maison ;
 * - le glissement gauche et le déplacement vertical sont arbitrés par le
 *   *responder system* natif du conteneur, en phase de CAPTURE
 *   (`onMoveShouldSetResponderCapture`) : capter en capture annule l'appui
 *   du `Pressable` interne, ce qui garantit qu'un glissement n'ouvre jamais
 *   la modification.
 *
 * Ni `react-native-gesture-handler` ni `react-native-reanimated` ne sont
 * employés — présents dans `package.json`, ils n'ont aucune intégration
 * racine, Babel ni Jest dans ce projet ; les activer élargirait le périmètre
 * sans besoin démontré (plan §8, décision validée). Les seuils et la
 * résolution de dépose vivent dans `compositionGesture.ts`, module pur et
 * testable ; ce composant ne fait que les brancher.
 *
 * **Cohabitation avec le défilement** : le conteneur ne capte un mouvement
 * VERTICAL que lorsqu'un déplacement est déjà engagé par appui long ; tout
 * autre geste vertical reste au `ScrollView` parent, qui continue donc de
 * défiler normalement. Réciproquement, `onResponderTerminationRequest`
 * renvoie `false` pendant un déplacement engagé, et l'écran neutralise le
 * défilement (`scrollEnabled={false}`) tant qu'une carte est soulevée.
 *
 * **`onTouchStart`/`onTouchEnd`** sont dispatchés indépendamment du
 * responder : ils bornent le geste de façon fiable, que le porteur du
 * responder soit le `Pressable`, le conteneur ou le `ScrollView`.
 *
 * **Poignée (AC-03)** : `Icon / Structure / Movable` (`3066:4676`) reste
 * affichée dans son slot `28 × 28` comme AFFORDANCE — elle n'est pas une
 * cible tactile propre : le reconnaisseur couvre tout le bloc.
 *
 * **Actions glissées (D-128, V2-CAT-01 UI-CAT-R-007/010)** : le groupe est
 * SUPERPOSÉ à la partie droite du bloc, DERRIÈRE la carte principale — c'est
 * la carte qui se translate horizontalement (`translateX`) pour le
 * découvrir, jamais l'inverse.
 *
 * ---
 *
 * **T02-S02, révisé par V2-CAT-01 (D-095/D-128/D-138, CE-T01-09,
 * CE-T02-01/CE-T02-02, CE-T03-08).**
 *
 * 1. **Sous-carte attachée.** Lorsque `recoverySeconds > 0`, une sous-carte
 *    `Récupération X min Y s` de `24` points est attachée sous la carte
 *    principale. Les deux ne forment qu'UN SEUL `Pressable` : le bloc est
 *    donc pressable et déplaçable comme un tout — « la Récupération
 *    appartient à l'Activité et forme avec elle un bloc indivisible pour la
 *    Composition, la copie, la duplication, le déplacement et la
 *    suppression » (D-138). Elle n'est jamais une Activité de plus.
 * 2. **Géométries conditionnelles.** Bloc `354 × 60` sans Récupération,
 *    `354 × 84` avec ; actions glissées `72 × 60` / `72 × 84`, couvrant
 *    toute la hauteur du bloc. L'état soulevé applique un écart CONSTANT
 *    (`widthDelta 8`, `heightDelta 4`) : `362 × 88` avec Récupération —
 *    et `362 × 64` sans elle. `362 × 88`
 *    sans Récupération est donc structurellement impossible, jamais interdit
 *    par une simple convention de relecture.
 * 3. **Balayage PROGRESSIF (V2-CAT-01, CE-T03-08 §§7-20, D-175/D-176).** La
 *    carte SUIT le doigt en temps réel (`swipeTranslateX`, même technique
 *    déjà éprouvée que `dragTranslationY` pour le déplacement vertical —
 *    aucune bibliothèque de geste supplémentaire) ; les actions se révèlent
 *    PROPORTIONNELLEMENT, jamais en tout ou rien. À la relâche, la position
 *    ATTEINTE (pas la distance depuis l'origine) décide de l'aboutissement :
 *    au-delà de la moitié de la course, la carte s'aligne en position
 *    OUVERTE ; en deçà, elle revient en position FERMÉE. Un balayage droit ne
 *    peut jamais faire progresser la carte au-delà de sa position fermée
 *    (`0`), et un balayage gauche jamais au-delà de sa position ouverte
 *    (`-SWIPE_REVEAL_OFFSET`) : la fermeture n'aboutit donc JAMAIS sauf
 *    engagée depuis une carte déjà ouverte, et l'ouverture jamais depuis une
 *    carte déjà fermée par un balayage droit isolé — révise le modèle
 *    « achevé sans suivi » d'un cycle antérieur, désormais explicitement
 *    contredit par le contrat d'écran de cette tranche.
 * 4. **Appui court sur une carte ouverte : NEUTRE.** Un tap sur la carte
 *    encore visible (« hors action ») ne ferme NI n'ouvre rien — seul un
 *    balayage droit véritable, engagé sur la carte ouverte, la referme.
 * 5. **Appui long, seul déclencheur du déplacement.** Inchangé : `Pressable`
 *    n'appelle jamais `onPress` après `onLongPress`, et un balayage capte le
 *    responder en phase de CAPTURE, ce qui annule l'appui en cours. Aucun
 *    autre chemin n'appelle `onDragStart`.
 */
function CompositionActivityRow({
  activity,
  isSideModeInherited,
  areActionsRevealed,
  isDragged,
  onLayout,
  onEdit,
  onRevealActions,
  onHideActions,
  onDragStart,
  onDragCancel,
  onDragEnd,
  onDuplicate,
  onDelete,
}: CompositionActivityRowProps) {
  const composition = strings.screens.composition;
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const translationYRef = useRef(0);
  const isDraggingRef = useRef(false);
  /**
   * `true` dès qu'un balayage horizontal est engagé pendant le geste
   * courant (V2-CAT-01, CE-T03-08) — tant qu'il l'est, le responder n'est
   * jamais cédé (`handleResponderTerminationRequest`) et le toucher n'est
   * pas un appui (`handlePress` reste inerte à la relâche).
   */
  const isSwipingRef = useRef(false);
  /** Position de départ (`0` fermée / `-SWIPE_REVEAL_OFFSET` ouverte) capturée à `handleTouchStart`, à laquelle `dx` s'ajoute pendant le geste. */
  const swipeBaseRef = useRef(0);
  /**
   * Décalage vertical visuel de la carte soulevée, pour qu'elle SUIVE le
   * doigt pendant le déplacement (CE-T02-02, « état transitoire avant et
   * pendant le déplacement »). État LOCAL à la carte : seule celle-ci se
   * re-rend au fil du geste — jamais l'écran entier, dont dépendraient
   * sinon toutes les autres cartes, la structure Tour et la synthèse.
   */
  const [dragTranslationY, setDragTranslationY] = useState(0);
  /**
   * Décalage horizontal visuel de la carte (V2-CAT-01, CE-T03-08) — même
   * technique locale que `dragTranslationY` ci-dessus, étendue au balayage :
   * `0` carte fermée, `-SWIPE_REVEAL_OFFSET` entièrement ouverte, toute
   * valeur intermédiaire pendant le geste (révélation PROPORTIONNELLE).
   */
  const [swipeTranslateX, setSwipeTranslateX] = useState(
    areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0,
  );

  /**
   * Resynchronise la position de repos lorsque l'état RÉVÉLÉ change pour une
   * cause EXTÉRIEURE au geste courant de cette carte (une autre carte
   * s'ouvre, `Dupliquer`/`Supprimer` referme celle-ci) — jamais pendant le
   * balayage lui-même, qui pilote déjà `swipeTranslateX` en temps réel.
   */
  useEffect(() => {
    if (!isSwipingRef.current) {
      setSwipeTranslateX(areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0);
    }
  }, [areActionsRevealed]);

  /**
   * Enregistre l'origine du toucher ET la position de repos courante — c'est
   * à partir de cette dernière que `dx` sera appliqué pendant tout le geste
   * (`onTouchStart`/`onTouchEnd` sont dispatchés indépendamment du responder
   * system : reçus quelle que soit l'issue du geste, sans avoir à le
   * revendiquer par anticipation, ce qui priverait le `Pressable` interne de
   * ses appuis).
   */
  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      originRef.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      translationYRef.current = 0;
      isSwipingRef.current = false;
      swipeBaseRef.current = areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0;
    },
    [areActionsRevealed],
  );

  const trackMovement = useCallback((event: GestureResponderEvent) => {
    const start = originRef.current;
    if (start === null) {
      return { dx: 0, dy: 0 };
    }
    const dx = event.nativeEvent.pageX - start.x;
    const dy = event.nativeEvent.pageY - start.y;
    translationYRef.current = dy;
    return { dx, dy };
  }, []);

  /** Applique `dx` à la position de repos, borné à `[-SWIPE_REVEAL_OFFSET, 0]` — la fermeture ne peut donc jamais progresser au-delà de `0`, ni l'ouverture au-delà de `-SWIPE_REVEAL_OFFSET`. */
  const applySwipeMovement = useCallback((dx: number) => {
    isSwipingRef.current = true;
    setSwipeTranslateX(clampSwipeTranslateX(swipeBaseRef.current + dx));
  }, []);

  /**
   * Arbitrage du geste, en phase de CAPTURE — donc avant le `Pressable`
   * interne, dont l'appui est alors annulé (`onPress` ne se déclenche
   * jamais) :
   *
   * - un déplacement déjà engagé par appui long capte tout mouvement ;
   * - un mouvement franchement horizontal, au-delà de la tolérance d'appui,
   *   capte le responder et fait immédiatement SUIVRE la carte (V2-CAT-01) ;
   * - tout le reste est laissé au `Pressable` (appui court/long) et, pour un
   *   geste vertical, au `ScrollView` parent, qui reste seul maître du
   *   défilement de la liste.
   */
  const handleMoveShouldSetResponderCapture = useCallback(
    (event: GestureResponderEvent) => {
      const { dx, dy } = trackMovement(event);
      if (isDraggingRef.current) {
        return true;
      }
      if (isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) {
        return false;
      }
      applySwipeMovement(dx);
      return true;
    },
    [applySwipeMovement, trackMovement],
  );

  /**
   * Suivi du balayage INDÉPENDANT du responder (V2-CAT-01, hérité de
   * T02-S02) — `onTouchMove`, comme `onTouchStart`/`onTouchEnd`, est
   * dispatché à la vue touchée ET à tous ses ancêtres, que le responder soit
   * ou non détenu par cette carte. C'est la seule voie qui reste vraie une
   * fois les actions révélées : le balayage droit de fermeture commence
   * alors SUR le groupe d'actions superposé, dont les `Pressable`
   * (`Dupliquer`/`Supprimer`) revendiquent le responder dès le contact.
   */
  const handleTouchMove = useCallback(
    (event: GestureResponderEvent) => {
      const { dx, dy } = trackMovement(event);
      if (isDraggingRef.current || isTap(dx, dy) || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }
      applySwipeMovement(dx);
    },
    [applySwipeMovement, trackMovement],
  );

  const handleResponderMove = useCallback(
    (event: GestureResponderEvent) => {
      const { dx, dy } = trackMovement(event);
      if (isDraggingRef.current) {
        setDragTranslationY(dy);
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        applySwipeMovement(dx);
      }
    },
    [applySwipeMovement, trackMovement],
  );

  /**
   * Fin du toucher — reçue quel que soit le porteur du responder.
   *
   * - une dépose après appui long applique le déplacement ;
   * - sinon, un balayage engagé s'aligne sur la position atteinte : ouverte
   *   au-delà de la moitié de la course, fermée en deçà (V2-CAT-01,
   *   CE-T03-08) ;
   * - tout autre relâchement laisse le brouillon rigoureusement inchangé
   *   (CE-T02-02 : « l'entrée dans cet état ne persiste rien »).
   */
  const handleTouchEnd = useCallback(() => {
    originRef.current = null;
    setDragTranslationY(0);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      isSwipingRef.current = false;
      onDragEnd(translationYRef.current);
      return;
    }
    if (!isSwipingRef.current) {
      return;
    }
    isSwipingRef.current = false;
    const shouldReveal = swipeTranslateX <= -SWIPE_REVEAL_OFFSET / 2;
    setSwipeTranslateX(shouldReveal ? -SWIPE_REVEAL_OFFSET : 0);
    if (shouldReveal && !areActionsRevealed) {
      onRevealActions();
    } else if (!shouldReveal && areActionsRevealed) {
      onHideActions();
    }
  }, [areActionsRevealed, onDragEnd, onHideActions, onRevealActions, swipeTranslateX]);

  /**
   * **Hérité de T02-S02** — le balayage engagé ne doit pas être perdu si le
   * responder est repris entre-temps : la relâche du responder applique le
   * geste au même titre que la fin de toucher. `isSwipingRef` étant consommé
   * (remis à `false`) par le premier des deux qui survient, l'opération
   * reste IDEMPOTENTE — jamais appliquée deux fois si les deux événements
   * arrivent.
   */
  const handleResponderRelease = useCallback(() => {
    handleTouchEnd();
  }, [handleTouchEnd]);

  /**
   * Le responder n'est cédé ni pendant un déplacement engagé (acquis
   * T02-S01), ni pendant un balayage horizontal déjà reconnu — sans quoi le
   * défilement vertical parent pourrait annuler un geste que l'utilisateur a
   * pourtant mené à son terme.
   */
  const handleResponderTerminationRequest = useCallback(
    () => !isDraggingRef.current && !isSwipingRef.current,
    [],
  );

  /**
   * Le responder est repris par une autre vue (typiquement le `ScrollView`
   * parent). Le DÉPLACEMENT est annulé — aucun changement d'ordre
   * (CE-T02-02) — mais le balayage en cours est **CONSERVÉ** : le toucher,
   * lui, n'est pas terminé, et `onTouchMove`/`onTouchEnd` (dispatchés
   * indépendamment du responder) continuent de le piloter. L'effacer ici
   * perdrait un balayage que l'utilisateur mène pourtant à son terme.
   */
  const handleResponderTerminate = useCallback(() => {
    setDragTranslationY(0);
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      onDragCancel();
    }
  }, [onDragCancel]);

  /**
   * Le TOUCHER lui-même est annulé (appel entrant, geste système…) : là, plus
   * aucun `onTouchEnd` ne suivra — tout est remis à zéro, balayage compris,
   * et la carte revient à sa position de repos courante (aucun balayage
   * n'est appliqué par une annulation).
   */
  const handleTouchCancel = useCallback(() => {
    originRef.current = null;
    isSwipingRef.current = false;
    setSwipeTranslateX(areActionsRevealed ? -SWIPE_REVEAL_OFFSET : 0);
    handleResponderTerminate();
  }, [areActionsRevealed, handleResponderTerminate]);

  /**
   * Appui COURT (D-127) : ouvre l'Activité en modification — sauf lorsque
   * ses actions glissées sont révélées, auquel cas il reste NEUTRE (« un tap
   * hors action ne ferme pas le contexte », V2-CAT-01/CE-T03-08) : seul un
   * véritable balayage droit referme une carte ouverte (`handleTouchEnd`).
   * `Pressable` n'appelle jamais `onPress` après un `onLongPress` : un appui
   * long n'ouvre donc structurellement jamais la modification (AC-02).
   */
  const handlePress = useCallback(() => {
    if (areActionsRevealed) {
      return;
    }
    onEdit();
  }, [areActionsRevealed, onEdit]);

  /** Appui LONG sur TOUTE la carte (D-127/AC-03) : engage la réorganisation. */
  const handleLongPress = useCallback(() => {
    isDraggingRef.current = true;
    onDragStart();
  }, [onDragStart]);

  const bodyZones = formatExerciseBodyZones(activity.bodyZoneIds);
  /**
   * La hauteur est dérivée des deux éléments réellement optionnels : la ligne
   * de Zones corporelles (`44` sans / `60` avec) et la Récupération attachée
   * (`+24`, strictement inchangée).
   */
  const recoveryLabel = formatActivityRecoveryLabel(activity.recoverySeconds);
  const blockHeight = blockHeightFor(bodyZones !== null, recoveryLabel !== null, isDragged);
  /**
   * V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
   * direction PROPRE et bilatérale — jamais héritée d'un Tour déjà
   * bilatéral (`isSideModeInherited`) — condition PARTAGÉE par l'indicateur
   * de carte et la clause de résumé (`formatExerciseRowSummary`).
   */
  const isOwnBilateral = activity.sideMode !== "UNILATERAL" && !isSideModeInherited;
  const sideModeStrings = strings.shared.sideMode;

  return (
    <View
      style={[styles.activityRowContainer, isDragged ? styles.activityRowContainerDragged : null]}
      onLayout={onLayout}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onMoveShouldSetResponderCapture={handleMoveShouldSetResponderCapture}
      onResponderMove={handleResponderMove}
      onResponderRelease={handleResponderRelease}
      onResponderTerminate={handleResponderTerminate}
      onResponderTerminationRequest={handleResponderTerminationRequest}
      testID={`composition-activity-${activity.id}`}
    >
      {/*
       * V2-CAT-01 (CE-T03-08, UI-CAT-R-007/010) : le groupe d'actions est
       * désormais un frère PRÉCÉDENT la carte (donc DERRIÈRE elle, un
       * conteneur relatif peignant ses enfants dans l'ordre de déclaration)
       * — c'est la carte qui se translate pour le découvrir PROGRESSIVEMENT,
       * jamais l'inverse. Rendu dès qu'une translation existe (pas
       * seulement une fois l'ouverture ACHEVÉE) : la révélation proportionnelle
       * pendant le geste est elle-même observable, pas seulement son
       * aboutissement.
       */}
      {swipeTranslateX < 0 ? (
        <View
          style={[styles.activityRowActions, { height: blockHeight }]}
          accessibilityLabel={composition.activityActions.revealAccessibilityLabel}
          testID={`composition-activity-actions-${activity.id}`}
        >
          <Pressable
            onPress={onDuplicate}
            accessibilityRole="button"
            accessibilityLabel={composition.activityActions.duplicate}
            style={[
              styles.activityRowAction,
              styles.activityRowDuplicateAction,
              { height: blockHeight },
            ]}
            testID={`composition-activity-duplicate-${activity.id}`}
          >
            <Text style={styles.activityRowDuplicateLabel}>
              {composition.activityActions.duplicate}
            </Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={composition.activityActions.delete}
            style={[
              styles.activityRowAction,
              styles.activityRowDeleteAction,
              { height: blockHeight },
            ]}
            testID={`composition-activity-delete-${activity.id}`}
          >
            <Text style={styles.activityRowDeleteLabel}>{composition.activityActions.delete}</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={LONG_PRESS_DELAY_MS}
        accessibilityRole="button"
        accessibilityLabel={composition.exerciseRow.editAccessibilityLabel}
        accessibilityHint={composition.activityActions.reorderAccessibilityHint}
        accessibilityState={{ selected: isDragged }}
        style={[
          styles.activityBlock,
          isDragged ? styles.activityBlockDragged : null,
          // Hauteur conditionnelle dérivée en un point unique — jamais un
          // littéral par état.
          { height: blockHeight },
          // La carte SUIT le doigt horizontalement (balayage) et
          // verticalement (déplacement soulevé) — les deux restent
          // mutuellement exclusifs en pratique (`isDraggingRef`), mais la
          // transformation est toujours appliquée pour rester continue.
          { transform: [{ translateX: swipeTranslateX }, { translateY: isDragged ? dragTranslationY : 0 }] },
        ]}
        testID={`composition-exercise-row-${activity.id}`}
      >
        {/*
         * Carte principale — anatomie strictement conservée depuis T02-S01
         * (slot structure `28 × 28`, titre, ligne de Zones corporelles,
         * synthèse). CE-T02-02 : son fond devient TRANSPARENT à l'état
         * soulevé, « le bleu reste donc visible derrière le nom, les Zones
         * corporelles et la synthèse » — jamais une opacité appliquée
         * séparément aux textes.
         */}
        <View style={styles.activityMainCard} testID="composition-activity-main-card">
          <View style={styles.boundaryRowHandleSlot} testID="composition-boundary-handle-slot">
            <KodjoIcon name="composition-reorder" testID="composition-boundary-handle-icon" />
          </View>
          <View style={styles.boundaryRowTitleSlot}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {activity.name}
            </Text>
            {bodyZones !== null ? (
              <Text
                style={styles.boundaryRowSecondaryLine}
                numberOfLines={1}
                testID="composition-exercise-body-zones"
              >
                {bodyZones}
              </Text>
            ) : null}
            <Text style={styles.boundaryRowSecondaryLine} numberOfLines={1}>
              {formatExerciseRowSummary({ ...activity, isSideModeInherited })}
            </Text>
          </View>
          {/*
           * Correction bornée (plan `## 4.4`, BIL-065) : indicateur `D→G`/
           * `G→D`, géométrie locale `42 × 20 pt`, position absolue `x=311,
           * y=24,5` — affiché UNIQUEMENT pour une direction PROPRE
           * bilatérale hors héritage d'un Tour bilatéral. Non interactif —
           * jamais un `Pressable`, aucun `onPress` — mais ACCESSIBLE :
           * `accessible` + `accessibilityLabel` développé (les mêmes
           * libellés exacts que le contrôle `Côté` de l'Activité,
           * `shared.sideMode.activity.accessibilityLabels`) regroupent le
           * texte visuel court sous UN SEUL nom accessible complet, sans le
           * masquer de l'arbre — l'ancien `accessibilityElementsHidden` /
           * `importantForAccessibility="no-hide-descendants"` était le
           * masquage incorrect signalé par le plan, retiré ici.
           */}
          {isOwnBilateral ? (
            <View
              style={[
                styles.activitySideModeIndicator,
                { width: ACTIVITY_SIDE_MODE_INDICATOR_SIZE.width, height: ACTIVITY_SIDE_MODE_INDICATOR_SIZE.height },
              ]}
              accessible
              accessibilityLabel={sideModeStrings.activity.accessibilityLabels[activity.sideMode]}
              testID={`composition-activity-side-mode-${activity.id}`}
            >
              <Text style={styles.activitySideModeIndicatorLabel} numberOfLines={1}>
                {sideModeStrings.valueLabels[activity.sideMode]}
              </Text>
            </View>
          ) : null}
        </View>

        {recoveryLabel !== null ? (
          <View
            style={[
              styles.activityRecoveryCard,
              isDragged ? styles.activityRecoveryCardDragged : null,
            ]}
            accessibilityLabel={composition.activityRecovery.accessibilityLabel}
            testID={`composition-activity-recovery-${activity.id}`}
          >
            <Text style={styles.activityRecoveryLabel} numberOfLines={1}>
              {recoveryLabel}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

/**
 * Hauteur du bloc Activité selon les deux lignes toujours présentes
 * (titre + synthèse), la ligne optionnelle de Zones corporelles, la
 * Récupération attachée et l'état soulevé :
 *
 * | Zones | Récupération | repos | soulevé |
 * | --- | --- | --- | --- |
 * | absentes | absente | `44` | `48` |
 * | absentes | présente | `68` | `72` |
 * | présentes | absente | `60` | `64` |
 * | présentes | présente | `84` | `88` |
 *
 * La sous-carte Récupération reste toujours à `24` points.
 */
function blockHeightFor(
  hasBodyZones: boolean,
  hasRecovery: boolean,
  isDragged: boolean,
): number {
  const mainCardHeight = hasBodyZones
    ? dimensions.compositionActivityRow.restHeight
    : dimensions.compositionActivityRow.compactRestHeight;
  const rest =
    mainCardHeight +
    (hasRecovery ? dimensions.compositionActivityRow.recoveryCardHeight : 0);
  return isDragged ? rest + dimensions.compositionActivityRow.heightDelta : rest;
}

/**
 * `Composition / Tour Section` — corrections cumulatives :
 *
 * - **CMP-04** (cycle `REWORK02`) : contrôle présenté dans un conteneur
 *   dédié (`tourCardControl`) avec une affordance de disclosure (chevron)
 *   — la carte Tour n'est toujours pas interactive en T01
 *   (`accessibilityState.disabled`), ce chevron reste donc purement visuel.
 * - **T-01** (cycle `REWORK03`) : géométrie de la carte interne
 *   (padding/bordure/rayon) partagée avec `BoundaryActivityRow` via
 *   `limitCardBase` — seul le fond (`colors.selectionSurface`) reste
 *   spécifique.
 * - **T-02/R4-11** (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN
 *   COMPLEMENTS REVIEWED`, 2026-09-03) : **icône Tour canonique intégrée**
 *   — `icon-tour.svg` (`3066:4685`, `20×20`), octets exacts téléchargés
 *   depuis l'asset MCP fourni par l'autorisation, jamais redessinée ni
 *   substituée. Ferme le blocage reconduit depuis `REWORK02`.
 * - **REWORK12 (COMP-02), première tentative** (`[ChatGPT] CHANGES_REQUESTED
 *   — REWORK12`, 2026-09-04) : `icon-tour.svg` avait été temporairement
 *   remplacé par `composition-main-content` après avoir constaté, sur le
 *   Figma alors en vigueur, que l'icône réellement affichée dans l'en-tête
 *   de la structure Tour (`icon/contenu-principal`) ne correspondait pas à
 *   l'ancien export `icon-tour.svg` — écart disclosé dans le rapport de
 *   mission de ce cycle.
 * - **REWORK12-bis — correction canonique définitive** (`[ChatGPT] Applique
 *   impérativement le protocole KODJO actif...`, 2026-09-04 ; `.github/
 *   orchestration/reports/2026-09-04_icon-tour-canonical-source-alignment
 *   .md`, `DESIGN_ICON_TOUR_CANONICAL_SOURCE_ALIGNED`) : le composant DSF
 *   `Icon / Tour` (`3066:4685`) a depuis été **reconstruit** sur le dessin
 *   validé (celui de `Nouvelle séance — Nom renseigné`, `2028:12003`) et
 *   republié à `18×18` (contre `20×20` auparavant) ; `assets/icons/icon-
 *   tour.svg` a été remplacé par le nouvel export (octets exacts). `icon-
 *   tour` (`KodjoIcon.tsx`) redevient donc la source canonique correcte —
 *   revenue ici depuis `composition-main-content`, désormais retiré du
 *   registre (`KodjoIcon.tsx`) et du manifeste Figma (`assets/icons/
 *   manifest.json` ne porte plus aucune entrée `composition.mainContent`).
 *   Ce n'est pas un aller-retour arbitraire : la première tentative avait
 *   correctement diagnostiqué que l'ancien `icon-tour.svg` (`20×20`) ne
 *   correspondait pas à la source canonique — la correction définitive
 *   porte sur LEQUEL export résout ce défaut (le même composant DSF
 *   reconstruit, pas un composant concurrent).
 * - **T-03/R4-03** : libellé `strings.screens.composition.tour.label` =
 *   `"Nombre de tours"` ; titre en style `KODJO / Card / Title` (voir
 *   `rowLabel`/`tourCardLabel`).
 * - **T-04a/b/c** (audit indépendant REWORK04, 2026-09-03) : anatomie du
 *   contrôle **refaite**, inversant `T-04/R4-10` du cycle précédent —
 *   cadre parent clair (`tourCardControl`, fond `colors.background`)
 *   contenant DEUX éléments distincts côte à côte : la valeur `1` en texte
 *   nu (`tourCardControlValue`, jamais sur fond violet) et un carré violet
 *   `28×28` (`tourCardControlChevronBox`, `colors.selection`) contenant
 *   UNIQUEMENT le chevron blanc — le cycle précédent plaçait `1` et le
 *   chevron ensemble dans le même carré violet, explicitement interdit.
 *   **REWORK06** (`[ChatGPT] PLAN_APPROVED — REWORK06`, 2026-09-04,
 *   addendum) : cadre porté de `66×30` à `78×44` — le `1` est désormais
 *   centré horizontalement ET verticalement (auparavant aligné à gauche),
 *   en `type.cardTitle` (`16/20` Semi Bold, auparavant `type.label` `14/18`
 *   Medium) ; le carré violet dispose de marges visibles identiques en
 *   haut/bas/droite (`8pt` chacune, dérivées par construction — voir
 *   `tourCardControl` ci-dessous).
 * - **T-05** : contenu `1` seul — le signe `×` retiré.
 * - **R4-12** : le conteneur Tour (`tourSectionContainer`, `374`) est
 *   désormais plus large que la carte interne qu'il héberge (`354`,
 *   inset `10`/côté) — INVERSE explicitement `T-01` (qui avait unifié la
 *   largeur de Tour avec celle des cartes limites) : `T-01` unifiait la
 *   GÉOMÉTRIE DE BOÎTE (padding/bordure/rayon, toujours vrai à l'époque) ;
 *   R4-12 distingue la LARGEUR EXTÉRIEURE du conteneur (rôle de conteneur,
 *   pas une carte elle-même) de celle, alors inchangée, de la carte
 *   interne. `marginHorizontal: -inset` fait « déborder » le conteneur de
 *   `10pt` de chaque côté au-delà du padding de `body` (`24`), portant sa
 *   largeur extérieure réelle à `374` sur le canevas de référence
 *   (`402pt`) sans aucune constante de largeur codée en dur — dérivée par
 *   construction, comme pour la marge basse de la navigation (`N-03`).
 *
 * - **REWORK07B — structure extérieure / en-tête transparent** (`[ChatGPT]
 *   PLAN_APPROVED — REWORK07B — contrôles canoniques + structure Tour`,
 *   2026-09-04 ; `12 – Architecture technique.md`, « Anatomie canonique —
 *   Nombre de tours » ; `13 – Contrats d'écran.md`, CE-T01-08/09) : **T-01
 *   est ici explicitement révisé, pas silencieusement contredit** — la
 *   documentation canonique établit que la SEULE surface visuelle du bloc
 *   Tour est la **structure extérieure** (`tourSectionContainer`, `374 pt`,
 *   fond `colors.tourSurface` = `#CDCEFA`, rayon canonique `10`, distinct
 *   du rayon `12` de `limitCardBase`/cartes limites), jamais la carte
 *   interne. L'**en-tête technique intérieur** (`tourHeader`, testID
 *   inchangé `composition-tour-card` — seule sa signification visuelle
 *   change, pas son identifiant) redevient un simple conteneur de mise en
 *   page **transparent** : ni fond, ni bordure, ni rayon, ni apparence de
 *   carte autonome — `limitCardBase` (fond/bordure/padding partagés avec
 *   `BoundaryActivityRow`) ne s'applique donc plus ici. Le `paddingVertical`
 *   et le `minHeight` que portait auparavant la carte interne (via
 *   `limitCardBase`/`tourCard`) sont **relocalisés** sur la structure
 *   extérieure (mêmes valeurs numériques, seul le propriétaire change) :
 *   `tourSectionContainer` disposait déjà, depuis R4-12, exactement de la
 *   géométrie `374 large / inset 10 / contenu 354` requise pour porter
 *   cette surface — aucun nouveau conteneur n'était nécessaire. Absence
 *   d'activité : une seule structure bleue reste visible (aucune carte
 *   intérieure ne dessine plus sa propre surface).
 *
 * - **REWORK08-C — synthèse sous « Nombre de tours »** (`[ChatGPT]
 *   CHANGES_REQUESTED — REWORK08 — roulette native + synthèse Tour`,
 *   2026-09-04) : l'addendum précédemment `QUEUED_FOR_NEXT_COMPOSITION_
 *   REWORK` est désormais implémenté. Titre + synthèse forment un seul
 *   bloc textuel (`tourCardTextBlock`, colonne — même patron que
 *   `boundaryRowTitleSlot`), centré verticalement avec `tourCardControl`
 *   par le `alignItems: "center"` déjà porté par `tourHeader` (hérité,
 *   inchangé). La synthèse (`composition-tour-summary`) réutilise
 *   exactement `formatCompositionSummary` (même contenu canonique que
 *   `bottomAction`, calculé une seule fois dans `CompositionScreen`) et
 *   exactement le style `boundaryRowSecondaryLine` (même typographie que
 *   la ligne secondaire des cartes `Compte à rebours initial`/`Fin de
 *   séance`, réutilisé tel quel, jamais dupliqué). Structure extérieure
 *   bleue et contrôle blanc/violet du nombre de tours : non touchés.
 */
function TourCard({
  label,
  summary,
  repeatCount,
  isOpen,
  onPress,
  onLayout,
  sideMode,
  onSideModeChange,
  children,
}: {
  label: string;
  summary: string;
  /** T02-S01 : valeur CONFIRMÉE du brouillon (`1..99`, D-058) — jamais un littéral figé. */
  repeatCount: number;
  isOpen: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  /** V2-BILAT-01 : direction CONFIRMÉE du Tour — jamais un littéral figé. */
  sideMode: SideMode;
  onSideModeChange: (next: SideMode) => void;
  /** T02-S01 (CE-T02-01) : les Activités `IN_TOUR` sont rendues DANS la structure Tour. */
  children?: ReactNode;
}) {
  return (
    <View style={styles.tourSectionContainer} onLayout={onLayout} testID="composition-tour-section">
      <View style={styles.tourHeader} testID="composition-tour-card">
        <View style={styles.tourCardIconSlot} testID="composition-tour-icon-slot">
          <KodjoIcon name="icon-tour" testID="composition-tour-icon" />
        </View>
        {/*
         * REWORK08-C : titre + synthèse forment désormais UN SEUL bloc
         * textuel (`tourCardTextBlock`, colonne — même patron que
         * `boundaryRowTitleSlot`), centré verticalement avec le cadre du
         * contrôle grâce à `tourHeader.alignItems: "center"` (hérité,
         * inchangé). La synthèse réutilise exactement le même contenu
         * canonique (`formatCompositionSummary`, calculé une seule fois
         * dans `CompositionScreen`) et exactement le même style
         * typographique que la ligne secondaire des cartes limites —
         * `styles.boundaryRowSecondaryLine` est réutilisé tel quel
         * ci-dessous, jamais dupliqué localement, pour garantir l'identité
         * exacte demandée plutôt qu'une simple ressemblance.
         */}
        <View style={styles.tourCardTextBlock} testID="composition-tour-text-block">
          <Text style={styles.tourCardLabel}>{label}</Text>
          <Text style={styles.boundaryRowSecondaryLine} testID="composition-tour-summary">
            {summary}
          </Text>
        </View>
        {/*
         * **T02-S01 (D-130/CE-T02-01/CE-T02-02)** — le contrôle devient
         * FONCTIONNEL et sa géométrie canonique est publiée : `66 × 34`,
         * valeur numérique SEULE (jamais `x` ni `×`), bord droit aligné sur
         * celui des cartes, et **aucun chevron de repli**.
         *
         * **T02-S02 — cadre et chevron d'OUVERTURE rétablis.** `12 –
         * Architecture technique.md` (« Sélecteur du nombre de tours »)
         * publie l'anatomie complète : « carré violet `28 × 28` avec `3`
         * points de marge en haut, à droite et en bas ; icône `#CDCEFA`
         * issue de la référence `2028:12051` ; aucun chevron de repli ». Les
         * deux règles ne se contredisent pas — ce carré porte le chevron
         * d'OUVERTURE de la roulette (le contrôle est un déclencheur), le
         * chevron proscrit étant celui de REPLI (haut/bas) d'un conteneur
         * dépliable, que ce contrôle n'est pas. T02-S01 avait supprimé le
         * carré ENTIER en même temps que le chevron de repli, laissant un
         * déclencheur sans aucune affordance d'ouverture.
         *
         * `accessibilityState.disabled` disparaît : le contrôle n'est plus
         * inerte, il ouvre la roulette `1..99`.
         */}
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: String(repeatCount) }}
          accessibilityState={{ disabled: false, expanded: isOpen }}
          // T02-S02 (continuation) : cadre visible `66 × 34` INCHANGÉ
          // (D-130), mais cible tactile portée à `48` — ce contrôle ouvre la
          // roulette `Nombre de tours`, il doit donc respecter
          // `size/touch-target-min` comme toute action du DSF.
          hitSlop={TOUR_CONTROL_HIT_SLOP}
          style={styles.tourCardControl}
          testID="composition-tour-control"
        >
          <Text style={styles.tourCardControlValue} testID="composition-tour-control-value">
            {repeatCount}
          </Text>
          <View
            style={styles.tourCardControlChevronBox}
            testID="composition-tour-control-chevron-box"
          >
            <KodjoIcon
              name="select-field-chevron"
              tintColor={colors.tourSurface}
              testID="composition-tour-control-chevron"
            />
          </View>
        </Pressable>
        {/*
         * V2-BILAT-01 (plan `## UI`, « Tour side control ») : « place the
         * control immediately to the right of the Tour-count selector »,
         * `8 pt` spacing (`tourHeader.gap`, partagé — jamais un écart local
         * dupliqué), géométrie locale `42 × 34 pt`, sans titre `Côté`/
         * `Côtés` visible (`title` omis). L'étiquette accessible dédiée à la
         * direction du Tour (`shared.sideMode.tour`) reste distincte de
         * celle de l'Activité.
         */}
        <SideModeControl
          value={sideMode}
          onChange={onSideModeChange}
          accessibilityLabel={strings.shared.sideMode.tour.accessibilityLabels[sideMode]}
          width={TOUR_SIDE_MODE_CONTROL_SIZE.width}
          height={TOUR_SIDE_MODE_CONTROL_SIZE.height}
          // Correction bornée (plan `## 4.2`) : `UNILATERAL` affiche `–`
          // (jamais l'affichage vide de l'Activité) et l'espacement interne
          // est réduit pour que `D→G`/`G→D` restent ENTIÈREMENT visibles.
          isTourContext
          testID="composition-tour-side-mode"
        />
      </View>
      {children}
    </View>
  );
}

/**
 * Écran d'état de la réhydratation en MODIFICATION (T01-S10,
 * CE-T01-S10-01/02/09). Conserve le Shell (en-tête + titre `Composition
 * d'une séance` inchangé) ; le corps varie : indicateur de chargement, ou
 * message + actions (Réessayer sur erreur technique, Revenir au catalogue
 * dans tous les cas — destination sûre, aucune mutation).
 */
function CompositionEditState({
  status,
  onRetry,
  onBackToCatalogue,
}: {
  status: "loading" | "not-found" | "archived" | "error";
  onRetry: () => void;
  onBackToCatalogue: () => void;
}) {
  const composition = strings.screens.composition;
  const t = composition.editStates;

  return (
    <ScreenShell>
      <FixedHeader
        title={composition.title}
        onBack={onBackToCatalogue}
        backAccessibilityLabel={composition.backAccessibilityLabel}
      />
      <HeaderSeparator />
      <View style={styles.editStateBody} testID="composition-edit-state">
        {status === "loading" ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel={t.loadingAccessibilityLabel}
          />
        ) : (
          <>
            <Text style={styles.editStateMessage}>
              {status === "not-found"
                ? t.notFoundMessage
                : status === "archived"
                  ? t.archivedMessage
                  : t.errorMessage}
            </Text>
            {status === "error" ? (
              <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                accessibilityLabel={t.retry}
                style={styles.editStatePrimaryAction}
              >
                <Text style={styles.editStatePrimaryLabel}>{t.retry}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={onBackToCatalogue}
              accessibilityRole="button"
              accessibilityLabel={t.backToCatalogue}
              style={styles.editStateSecondaryAction}
            >
              <Text style={styles.editStateSecondaryLabel}>{t.backToCatalogue}</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenShell>
  );
}

/**
 * **Écart vertical UNIQUE du corps de la Composition** (T02-S02,
 * continuation après recette visuelle).
 *
 * Une seule constante gouverne les trois interstices que la recette exige
 * identiques : `Compte à rebours initial` → première carte, carte → carte, et
 * dernière carte → `Fin de séance`. Les deux premiers relèvent de conteneurs
 * DIFFÉRENTS (`bodyContent` pour les éléments structurels, `exerciseList`
 * pour les cartes d'une même zone) — les faire dépendre d'un token partagé
 * est le seul moyen de garantir leur égalité autrement que par la vigilance
 * de relecture.
 */
const COMPOSITION_ROW_GAP = spacing[6];

/**
 * Marge intérieure verticale LIVRÉE par la seconde recette visuelle (point 7)
 * — `spacing/8` réduit d'un tiers, arrondi au point entier (`8 × 2/3 = 5,33
 * → 5`). Conservée nommée pour que la réduction suivante s'y enchaîne
 * visiblement.
 */
const PREVIOUS_ACTIVITY_CARD_PADDING_VERTICAL = Math.round((spacing[8] * 2) / 3);

/**
 * **Marge intérieure verticale d'une carte d'Activité** (T02-S02, troisième
 * recette visuelle, point 3) — la valeur précédente RÉDUITE D'UN TIERS à son
 * tour, arrondie au point entier le plus proche (`5 × 2/3 = 3,33 → 3`).
 *
 * Le tiers se retranche de la valeur RÉELLEMENT LIVRÉE, pas une seconde fois
 * de `spacing/8` : ré-appliquer la règle à la valeur d'origine aurait redonné
 * `5`, donc AUCUN changement — contraire à l'exigence « réduire
 * EFFECTIVEMENT ».
 *
 * Valeur DÉRIVÉE, jamais un littéral : la règle demandée reste lisible dans le
 * code. Ni `5` ni `3` ne sont des échelons de `spacing` — écart disclosé dans
 * le rapport de mission, l'échelle DSF n'offrant aucun palier égal au tiers
 * demandé.
 */
const ACTIVITY_CARD_PADDING_VERTICAL = Math.round(
  (PREVIOUS_ACTIVITY_CARD_PADDING_VERTICAL * 2) / 3,
);

/**
 * Complément vertical portant la cible tactile du contrôle `Nombre de tours`
 * de sa hauteur visible canonique (`34`, D-130) à `minTouchTarget` (`48`).
 * Dérivé des deux constantes, jamais codé en dur.
 */
const TOUR_CONTROL_HIT_SLOP = {
  top: (minTouchTarget - dimensions.compositionTourControl.height) / 2,
  bottom: (minTouchTarget - dimensions.compositionTourControl.height) / 2,
  left: 0,
  right: 0,
} as const;

/**
 * V2-BILAT-01 (plan `## UI`, « Tour side control ») : géométrie locale
 * `42 × 34 pt` — AUCUN token DSF existant ne couvre cette taille (`tokens.ts`
 * ne publie que `compositionTourControl`, `66 × 34`, pour le sélecteur du
 * nombre de tours) ; valeur DISCLOSED ici plutôt qu'ajoutée à `tokens.ts`,
 * hors périmètre `scope_allow` de cette tranche.
 */
const TOUR_SIDE_MODE_CONTROL_SIZE = { width: 42, height: 34 } as const;

/**
 * V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
 * géométrie locale `42 × 20 pt` de l'indicateur de direction PROPRE d'une
 * carte Activité — même disclosure que `TOUR_SIDE_MODE_CONTROL_SIZE`
 * ci-dessus, aucun token DSF existant ne couvrant cette taille.
 */
const ACTIVITY_SIDE_MODE_INDICATOR_SIZE = { width: 42, height: 20 } as const;

const styles = StyleSheet.create({
  // T01-S10 : corps des états de réhydratation en modification.
  editStateBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  editStateMessage: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  editStatePrimaryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  editStatePrimaryLabel: {
    ...type.button,
    color: colors.background,
  },
  editStateSecondaryAction: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editStateSecondaryLabel: {
    ...type.button,
    color: colors.primary,
  },
  // A-01 (`[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE
  // CORRECTION`, 2026-09-03) : `flex: 1` — le corps occupe tout l'espace
  // vertical restant entre la bande Context et `bottomAction`, poussant
  // mécaniquement ce dernier au bas de la zone utile.
  //
  // R4-13/S-01…S-09 (`[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL /
  // ACTIVITIES SCROLL CONTRACT`, 2026-09-03) : `body` est désormais le
  // `ScrollView` lui-même (style du conteneur défilant, sans padding
  // propre) — le padding/l'écart entre lignes vivent dans `bodyContent`
  // (`contentContainerStyle`), seul appliqué au CONTENU défilant. Header,
  // séparateur, bande Context et `bottomAction` restent hors de ce
  // `ScrollView`, donc jamais recouverts ni déplacés par le défilement.
  body: {
    flex: 1,
  },
  //
  // **T02-S02 (continuation après recette visuelle)** : `gap` passe de `16`
  // à `COMPOSITION_ROW_GAP` (`6`), la MÊME valeur que l'écart entre deux
  // cartes d'Activité (`exerciseList`). La recette a constaté un rythme
  // vertical irrégulier — `Compte à rebours` → première carte et dernière
  // carte → `Fin de séance` étaient nettement plus espacés que deux cartes
  // consécutives, parce que ces deux interstices relèvent de `bodyContent`
  // (structurel) tandis que l'interstice inter-cartes relève de
  // `exerciseList`. Les deux partagent désormais la même constante : la
  // régularité est vraie PAR CONSTRUCTION, pas par coïncidence de deux
  // littéraux.
  bodyContent: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
    gap: COMPOSITION_ROW_GAP,
  },
  // CMP-02 : champ unique regroupant Nom et Sélecteur de couleur — acquis
  // préservé (fusion, géométrie, gap, padding, rayon inchangés).
  //
  // REWORK09 (mission directe utilisateur, 2026-09-04, point 1 « Champ Nom
  // de la séance ») : `Session / Name Field — Source exact` (`2537:1480`)
  // documente un fond TRANSPARENT (laissant apparaître la bande Context
  // colorée sous-jacente, jamais un fond blanc opaque) et un liseré blanc
  // intérieur de `1pt` via le token canonique `color.sessionNameBorder`
  // (`#FFFFFF`, variable Figma `color/session-name-border`,
  // `VariableID:3163:4015`) — remplace `colors.background` (fond opaque),
  // seule propriété modifiée par cette correction ; ce champ reste le seul
  // représentant visuel concret du « Nom de la séance » dans cet écran
  // (fusionné avec le sélecteur de couleur depuis CMP-02, acquis
  // explicitement préservé), la transparence s'applique donc à l'ensemble
  // du champ fusionné plutôt qu'à un sous-élément désormais inexistant.
  nameColorField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.sessionNameBorder,
    borderRadius: 12,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[4],
  },
  nameInput: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing[8],
  },
  // T01-S09, correction VISUAL (point D) : `elevated` (sélecteurs de
  // roulette ancrés en popover, `AnchoredRow`/`PopoverAnchor`,
  // `bodyElevated`) est retiré — ces mécanismes n'ont plus de consommateur,
  // les roulettes numériques passant désormais par `WheelPickerOverlay`
  // (superposition plein écran, hors de ce `ScrollView`). Seul le backdrop
  // dédié à la palette de couleur (`ContextBand`, mécanisme distinct et
  // inchangé) reste actif ci-dessous.
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // T-01 : géométrie commune aux cartes `Boundary Activity` et `Tour` —
  // seul le fond diverge (voir `boundaryRow`/`tourCard` ci-dessous),
  // garantissant des bords gauche/droit strictement alignés par
  // construction (même padding/bordure/rayon), plutôt que deux définitions
  // séparées pouvant diverger.
  limitCardBase: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[8],
  },
  // C-01 — `Boundary Activity` : fond blanc avec liseré gris visible
  // (`limitCardBase.borderColor`), auparavant `colors.surface` (gris).
  boundaryRow: {
    height: dimensions.compositionActivityRow.compactRestHeight,
    paddingVertical: ACTIVITY_CARD_PADDING_VERTICAL,
    backgroundColor: colors.background,
  },
  // R4-04 (slot `28×28`, icône `20×20`, cycle REWORK04). REWORK06 (addendum
  // « poignées encore trop petites », 2026-09-04) : porté à `32×32` pour
  // compenser un glyphe sous-dimensionné. REWORK07-A (`[ChatGPT]
  // CHANGES_REQUESTED — REWORK07-A — ICON / STRUCTURE / MOVABLE
  // UNIQUEMENT`, 2026-09-04) : diagnostic établi — le glyphe lui-même était
  // en cause, pas le slot ; l'asset canonique remplacé (`KodjoIcon.tsx`),
  // le slot revient à `28×28`
  // (`dimensions.structureMovableIcon.slot`), valeur canonique DSF,
  // partagée avec `KodjoIcon.tsx` (source unique, plus de littéral local
  // dupliqué).
  boundaryRowHandleSlot: {
    width: dimensions.structureMovableIcon.slot,
    height: dimensions.structureMovableIcon.slot,
    alignItems: "center",
    justifyContent: "center",
  },
  boundaryRowTitleSlot: {
    flex: 1,
    gap: spacing[2],
  },
  // Correction compacte LOT_3_OF_3 : écart RÉDUIT entre deux cartes
  // Activité consécutives. T02-S02 (continuation) : porté de `8` à
  // `COMPOSITION_ROW_GAP` (`6`, token DSF `spacing/6`) — légère réduction
  // demandée par la recette visuelle — et PARTAGÉ avec `bodyContent`, dont
  // il devient la source unique (voir la note de `bodyContent`).
  exerciseList: {
    gap: COMPOSITION_ROW_GAP,
  },
  // T02-S01, révisé V2-CAT-01 (CE-T03-08, UI-CAT-R-007/010) : conteneur de
  // position d'une carte d'Activité — support du groupe d'actions glissées,
  // DERRIÈRE la carte principale (`position: "absolute"`, D-128), que la
  // carte découvre en se translatant PROGRESSIVEMENT. Le fond
  // `colors.tourSurface` du conteneur lui-même EST le gap visible entre la
  // carte ouverte et les actions — égal par construction à la marge
  // `compositionTourSection.inset` (`SWIPE_REVEAL_OFFSET` ci-dessus), jamais
  // une valeur locale.
  activityRowContainer: {
    position: "relative",
    backgroundColor: colors.tourSurface,
  },
  // La carte soulevée passe au-dessus de ses voisines pendant le
  // déplacement — porté par le CONTENEUR (les cartes sont dans des
  // conteneurs frères : un `zIndex` sur la carte seule n'ordonnerait rien
  // au-delà du sien).
  activityRowContainerDragged: {
    zIndex: 1,
  },
  // T02-S02 — BLOC Activité (+ Récupération), D-095/D-128/D-138.
  //
  // Le `Pressable` porte désormais la surface du BLOC ENTIER (fond, liseré,
  // rayon), la carte principale et la sous-carte n'étant que ses deux
  // enfants : c'est ce qui rend le bloc indivisible pour l'appui, l'appui
  // long et le balayage. Les valeurs visuelles sont EXACTEMENT celles de
  // `limitCardBase`/`boundaryRow` (fond blanc, liseré `colors.border`, rayon
  // `12`) — l'anatomie des cartes limites reste donc la référence, seule sa
  // localisation dans l'arbre change. `overflow: "hidden"` fait suivre au
  // coin bas de la sous-carte le rayon du bloc.
  //
  // La HAUTEUR est appliquée par l'écran (`blockHeightFor`) selon la présence
  // des Zones, de la Récupération et de l'état soulevé.
  activityBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  // Carte principale du bloc — `flex: 1` : elle occupe tout ce que la
  // sous-carte (`24`, hauteur fixe) laisse, ce qui reproduit exactement la
  // décomposition `60 + 24 = 84` de D-128 sans jamais coder `69` une
  // seconde fois. `paddingVertical` réduit de `12` à `8` par rapport à
  // `limitCardBase` : les trois lignes (`16/20` + `11/13` + `11/13`, écarts
  // `2`) ne tiennent pas dans une carte de `69` avec `12` de padding — la
  // hauteur canonique prime, elle est publiée par CE-T01-09.
  //
  // **T02-S02 (seconde puis troisième recette visuelle)** : marges
  // intérieures HAUTE et BASSE réduites d'un tiers, deux fois
  // (`ACTIVITY_CARD_PADDING_VERTICAL`, `8 → 5 → 3`). Le bloc ayant une
  // hauteur FIXE (`60`/`84`), ces marges ne changent pas sa taille — elles
  // rendent au contenu la place qui lui manquait : nom (`16/20`) + Zones
  // corporelles (`11/14`) + synthèse (`11/14`) et leurs deux écarts de `2`
  // totalisent `52`, contre `58` de hauteur utile ; avec `8` de marge haute
  // et basse, l'ensemble atteignait `68` et débordait d'un point.
  //
  // CORRECTION DIRECTE POST-RECETTE : avec `alignItems: "center"` dans un
  // bloc fixe, réduire seulement le padding ne modifiait pas le blanc perçu.
  // La première réduction de `69` à `65` étant restée imperceptible en recette,
  // la hauteur principale passe à `60`. La sous-carte Récupération reste à
  // `24` points ; le bloc complet passe mécaniquement de `89` à `84`.
  //
  // Les marges HORIZONTALES et toutes les autres géométries validées restent
  // strictement inchangées.
  activityMainCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[16],
    paddingVertical: ACTIVITY_CARD_PADDING_VERTICAL,
    gap: spacing[8],
    // Correction bornée (plan `## 4.4`, position `x=311, y=24,5`) : porte
    // désormais l'ancrage de l'indicateur de direction, positionné en
    // superposition ABSOLUE plutôt qu'en enfant de flux — il ne dispute donc
    // plus jamais d'espace au nom/à la synthèse (`boundaryRowTitleSlot`).
    position: "relative",
  },
  // Correction bornée (plan `## 4.4`, BIL-065) : indicateur `D→G`/`G→D` non
  // interactif d'une carte Activité dont la direction est PROPRE et
  // bilatérale — géométrie locale `42 × 20 pt`
  // (`ACTIVITY_SIDE_MODE_INDICATOR_SIZE`, aucun token DSF existant) en
  // position ABSOLUE `x=311, y=24,5` (valeurs publiées par le plan,
  // ancrées sur `activityMainCard`, désormais `position: "relative"`).
  activitySideModeIndicator: {
    position: "absolute",
    right: spacing[16],
    top: spacing[4],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    backgroundColor: colors.tourSurface,
  },
  activitySideModeIndicatorLabel: {
    ...type.caption,
    color: colors.textPrimary,
  },
  // Sous-carte `Récupération X min Y s` — `24` points attachés sous la carte
  // principale (D-095/D-128). Séparée par un simple liseré supérieur, jamais
  // par un second bloc détaché : le bord bas et les coins arrondis restent
  // ceux du bloc.
  //
  // NON VÉRIFIÉ sur Figma (`3572:64`) : l'accès MCP Figma n'était pas
  // disponible dans cette session — même limite que celle déjà disclosée
  // pour `2028:11808` (actions glissées). Seules des valeurs DÉJÀ CANONIQUES
  // du DSF sont employées (`colors.surface` pour la surface secondaire,
  // `colors.border` pour le liseré, `colors.textSecondary` pour le libellé) :
  // aucune couleur locale n'est introduite.
  //
  // **T02-S02 (continuation après recette visuelle)** : le libellé
  // s'alignait sur le bord gauche du bloc (`paddingHorizontal: 16`), alors
  // que le nom de l'Activité, ses Zones corporelles et sa synthèse
  // commencent APRÈS le slot de la poignée. `paddingLeft` est donc dérivé de
  // la géométrie réelle de la carte principale — padding + slot `28` + écart
  // `8` — plutôt que recopié en littéral : déplacer la poignée réalignerait
  // automatiquement la sous-carte.
  activityRecoveryCard: {
    height: dimensions.compositionActivityRow.recoveryCardHeight,
    justifyContent: "center",
    paddingLeft:
      spacing[16] + dimensions.structureMovableIcon.slot + spacing[8],
    paddingRight: spacing[16],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Graisse SEMI BOLD, pour distinguer le libellé `Récupération` des deux
  // lignes secondaires régulières de la carte principale.
  //
  // **T02-S02 (seconde recette visuelle, point 8)** : taille AUGMENTÉE de
  // `11/14` à `14/18` — `type.compactCardTitle`, token DSF déjà canonique
  // (`KODJO / Card / Title`, `14/18` Semi Bold), plutôt qu'un nouveau token
  // local. La graisse (`600`) et l'alignement à gauche sont strictement
  // conservés ; seule la taille change. `18` de hauteur de ligne tient dans
  // la sous-carte de `24` points, dont la géométrie est inchangée.
  // `type.captionStrong`, introduit à la continuation précédente pour ce
  // seul usage, est supprimé avec lui plutôt que laissé mort.
  activityRecoveryLabel: {
    ...type.compactCardTitle,
    color: colors.textSecondary,
  },
  // D-129/CE-T02-02 : état soulevé — `362 × 88` avec Récupération (contre
  // `354 × 84` au repos), centré à `x = 6`, fond `#F7F7FF` repris du bandeau
  // supérieur, contour `1` point `#D1D1D6`, rayon `12`, ombre périphérique
  // `#14171F` à `22 %` (`0 / 0`, flou `10`, étalement `2`).
  //
  // L'agrandissement horizontal est exprimé en ÉCART (marges négatives),
  // jamais en largeur absolue : le bloc au repos occupe la largeur utile
  // réelle de l'écran, pas une constante de canevas. L'écart vertical, lui,
  // est porté par `blockHeightFor` (voir ci-dessus).
  activityBlockDragged: {
    marginHorizontal: -dimensions.compositionActivityRow.widthDelta / 2,
    backgroundColor: colors.exerciseContextBandBackground,
    borderColor: colors.compositionDraggedCardBorder,
    borderRadius: dimensions.compositionActivityRow.draggedRadius,
    shadowColor: colors.compositionDraggedCardShadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: dimensions.compositionActivityRow.draggedShadowOpacity,
    shadowRadius: dimensions.compositionActivityRow.draggedShadowRadius,
    elevation: dimensions.compositionActivityRow.draggedElevation,
  },
  // CE-T02-02 : « Le fond interne `Informations` est transparent : le bleu
  // reste donc visible derrière le nom, les Zones corporelles et la
  // synthèse ». La sous-carte perd donc sa surface grise et son liseré au
  // profit du bleu du bloc soulevé — jamais une opacité appliquée aux
  // textes.
  activityRecoveryCardDragged: {
    backgroundColor: "transparent",
    borderTopColor: colors.compositionDraggedCardBorder,
  },
  // D-128, révisé V2-CAT-01 (UI-CAT-R-007/010) : groupe superposé à droite
  // (DERRIÈRE la carte, découvert par sa translation), deux actions `72 × H`
  // aux libellés centrés horizontalement et verticalement, `H` valant la
  // hauteur du BLOC (`60` sans Récupération, `84` avec) — « `Dupliquer` et
  // `Supprimer` couvrent toute la hauteur du bloc ». La hauteur est
  // appliquée par l'écran (`blockHeightFor`), pas ici. Les coins HAUT-GAUCHE
  // et BAS-GAUCHE — ceux qui font face au gap ouvert vers la carte — sont
  // arrondis au même rayon que le bloc ; les coins droits, flush avec le
  // bord de l'écran, restent carrés (jamais un rayon local inventé).
  activityRowActions: {
    position: "absolute",
    top: 0,
    right: 0,
    width: dimensions.compositionSwipeActions.groupWidth,
    flexDirection: "row",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    overflow: "hidden",
  },
  activityRowAction: {
    width: dimensions.compositionSwipeActions.actionWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  // NON VÉRIFIÉ sur Figma (`2028:11808`) : l'accès MCP Figma n'était pas
  // disponible dans la session de cette tranche — voir le rapport de
  // mission. Seules des valeurs DÉJÀ CANONIQUES du DSF sont employées ici
  // (`colors.surface`/`textPrimary` pour l'action neutre,
  // `colors.danger`/`background` pour l'action destructive, `type.button`
  // pour les deux libellés) : aucune couleur ni typographie locale n'est
  // introduite. La conformité chromatique exacte au nœud reste à valider.
  activityRowDuplicateAction: {
    backgroundColor: colors.surface,
  },
  activityRowDuplicateLabel: {
    ...type.button,
    color: colors.textPrimary,
    textAlign: "center",
  },
  activityRowDeleteAction: {
    backgroundColor: colors.danger,
  },
  activityRowDeleteLabel: {
    ...type.button,
    color: colors.background,
    textAlign: "center",
  },
  // R4-03 (`KODJO / Card / Supporting`, `11/14`) : auparavant
  // `type.supporting` (`12/16`), non conforme au style DSF partagé.
  boundaryRowSecondaryLine: {
    ...type.caption,
    color: colors.textSecondary,
  },
  boundaryRowIconSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // R4-12 : conteneur Tour, plus large que la carte interne qu'il héberge
  // — voir `TourCard` ci-dessus pour la justification complète du calcul.
  // REWORK07B : porte désormais la surface visuelle elle-même (fond,
  // rayon, padding vertical, hauteur minimale) — relocalisés depuis
  // l'ancien style `tourCard` (voir `tourHeader` ci-dessous), qui ne
  // portait pas encore la bonne largeur (`374`) pour cette surface.
  // T02-S01 : la structure Tour héberge désormais AUSSI les Activités
  // `IN_TOUR` (CE-T02-01) — `gap` sépare son en-tête technique de cette
  // liste, sans effet lorsque la zone est vide (le conteneur n'a alors qu'un
  // seul enfant). Largeur, fond, rayon et hauteur minimale sont inchangés.
  tourSectionContainer: {
    marginHorizontal: -dimensions.compositionTourSection.inset,
    paddingHorizontal: dimensions.compositionTourSection.inset,
    paddingVertical: spacing[12],
    borderRadius: dimensions.compositionTourSection.radius,
    backgroundColor: colors.tourSurface,
    minHeight: dimensions.compositionTourSection.closedHeight,
    gap: spacing[12],
  },
  // En-tête technique intérieur de `TourCard`, voir la documentation
  // REWORK07B ci-dessus pour la justification complète : simple rangée de
  // mise en page (icône/titre/contrôle), **transparente** — ni fond, ni
  // bordure, ni rayon, ni padding propres (portés par `tourSectionContainer`
  // désormais). N'utilise plus `limitCardBase` (fond/bordure partagés avec
  // `BoundaryActivityRow`, non conformes ici depuis la révision REWORK07B).
  tourHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  // R4-04 : même slot que `boundaryRowHandleSlot` (`28×28`) — icône Tour
  // désormais réellement affichée dedans (R4-11), plus un espace vide.
  tourCardIconSlot: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  // REWORK08-C : bloc unique titre + synthèse (même patron que
  // `boundaryRowTitleSlot`) — `flex: 1` (auparavant sur `tourCardLabel`
  // directement, quand le titre était seul dans la rangée) porte
  // désormais l'espace disponible du bloc entier, poussant
  // `tourCardControl` à droite ; `gap` identique à `boundaryRowTitleSlot`.
  tourCardTextBlock: {
    flex: 1,
    gap: spacing[2],
  },
  // R4-03/REWORK06 : même style de titre que les cartes limites (voir `rowLabel`).
  tourCardLabel: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  // T-04a/b/c (cycle REWORK04) : cadre parent clair contenant la valeur `1`
  // (texte nu, jamais sur fond violet) et le carré violet dédié au chevron
  // (`tourCardControlChevronBox`) comme deux éléments frères distincts.
  //
  // REWORK06 (addendum « écarts visuels encore ouverts », 2026-09-04) :
  // hauteur portée de `30` à `44` — `alignItems: "center"` centre
  // mécaniquement le carré violet (`28`) dans cette hauteur, dégageant une
  // marge haut/bas de `(44-28)/2 = 8` ; `paddingRight: spacing[8]` (`8`)
  // égale cette même marge à droite du carré, comme demandé (« marges
  // visibles identiques en haut, en bas et à droite »). Largeur portée de
  // `66` à `78` pour dégager l'espace nécessaire au centrage du chiffre.
  // T02-S01 (D-130) : `66 × 34`, fond blanc, rayon inchangé, valeur seule et
  // centrée — le carré violet du chevron (`tourCardControlChevronBox`,
  // REWORK06/T-04c) est supprimé avec son style plutôt que laissé mort,
  // D-130 posant explicitement que « le chevron historique de repli n'est
  // pas affiché ». Le bord droit reste aligné sur celui des cartes par
  // construction (dernier enfant de `tourHeader`, dont le padding horizontal
  // est celui de la structure Tour).
  //
  // T02-S02 : le cadre redevient une RANGÉE (`row`) — valeur à gauche, carré
  // violet du chevron d'ouverture à droite, avec `3` points de marge en
  // haut, à droite et en bas (`12 – Architecture technique.md`). La hauteur
  // `34` est exactement `28 + 3 + 3`, obtenue ici par `alignItems: "center"`
  // (marges haut/bas mécaniques) et `paddingRight` (marge droite explicite)
  // — jamais par un second littéral.
  tourCardControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: dimensions.compositionTourControl.width,
    height: dimensions.compositionTourControl.height,
    backgroundColor: colors.background,
    borderRadius: dimensions.compositionTourControl.radius,
    paddingLeft: spacing[8],
    paddingRight: dimensions.compositionTourControl.chevronBoxMargin,
  },
  // Valeur numérique seule (jamais `x` ni `×`), centrée verticalement, en
  // `type.cardTitle` (`16/20` Semi Bold — graisse et taille conservées de
  // REWORK06).
  tourCardControlValue: {
    ...type.cardTitle,
    color: colors.textPrimary,
    textAlign: "center",
  },
  // Carré violet `28 × 28`, rayon `6` — même anatomie canonique que le carré
  // de chevron de `Forms / Select Field` (`exerciseParameterRow.chevronBox`,
  // `ExerciseScreen.tsx`). L'icône est teintée `#CDCEFA` (`colors
  // .tourSurface`, référence `2028:12051`) plutôt que blanche : c'est la
  // seule différence documentée entre les deux occurrences.
  tourCardControlChevronBox: {
    width: dimensions.compositionTourControl.chevronBox,
    height: dimensions.compositionTourControl.chevronBox,
    borderRadius: dimensions.compositionTourControl.chevronBoxRadius,
    backgroundColor: colors.selection,
    alignItems: "center",
    justifyContent: "center",
  },
  // R4-03 (cycle REWORK04) : `type.compactCardTitle` (`14/18` Semi Bold),
  // auparavant `type.body` (`14/20` Regular). REWORK06 (addendum « titres
  // des cartes... encore trop petits », 2026-09-04) : porté à
  // `type.cardTitle` (`16/20` Semi Bold) — token DSF déjà canonique,
  // partagé avec `SessionCard.tsx` (Catalogue), plutôt qu'une nouvelle
  // taille locale inventée. Effet de bord accepté : la ligne Exercice de
  // cet écran (non explicitement citée par l'addendum) partage `rowLabel`
  // et grandit donc identiquement.
  rowLabel: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  // LAY-03 : hauteur/rayon issus du composant DS
  // (`dimensions.compactSecondaryButton`, même token que le bouton Créer
  // du Catalogue) ; fond blanc explicite (la bande Context est teintée) ;
  // bordure/icône/texte primaires ; largeur libre. CMP-02 : centré
  // (`alignSelf: "center"`, auparavant `flex-start`).
  addActivityAction: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
    height: dimensions.compactSecondaryButton.visualHeight,
    paddingHorizontal: spacing[16],
    borderRadius: dimensions.compactSecondaryButton.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  addActivityLabel: {
    ...type.button,
    color: colors.primary,
  },
  // V2-CAT-01 : arbre `Ajouter une activité` — même géométrie de carte que
  // `CatalogueCreateOptions` (rayon `standardCard`, liseré `colors.border`).
  addActivityTree: {
    position: "absolute",
    top: dimensions.contextBand.height + spacing[8],
    left: spacing[24],
    right: spacing[24],
    backgroundColor: colors.background,
    borderRadius: dimensions.standardCard.radius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  addActivityTreeOption: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  addActivityTreeOptionLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  // CMP-06 : zone d'action basse regroupant la synthèse et `Continuer`.
  // A-01 : plus de `marginTop: "auto"` ici — `body` (`flex: 1`, ci-dessus)
  // absorbe désormais tout l'espace disponible, `bottomAction` suit
  // naturellement juste après. `Continuer` reste centré sur l'axe
  // horizontal de l'écran (`marginHorizontal` symétrique) ; Composition
  // n'affiche aucun cadre de navigation principal (écran de création hors
  // `(tabs)`), le critère « centré sur l'axe du cadre de navigation » de
  // cette revue ne s'applique donc pas ici (condition explicitement posée
  // par la revue elle-même, « lorsqu'il est présent »).
  bottomAction: {
    marginHorizontal: spacing[24],
    gap: spacing[12],
  },
  continueAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.disabled,
  },
  // T01-S09 : même patron que `primaryAction`/`primaryActionDisabled`
  // (`ExerciseScreen.tsx`) — fond `colors.primary` uniquement pour l'état
  // activé, jamais l'inverse (`continueAction.backgroundColor` reste le
  // fond désactivé par défaut).
  continueActionEnabled: {
    backgroundColor: colors.primary,
  },
  continueLabel: {
    ...type.button,
    color: colors.background,
  },
});
