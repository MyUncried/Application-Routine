/**
 * Brouillon local de Séance (T01) : représentation en mémoire, potentiellement
 * incomplète, distincte de `CreateSessionInput`. « Le brouillon reste local
 * jusqu'à l'enregistrement final » — rien ici ne persiste quoi que ce soit.
 *
 * V2-PRE-1 (plan §3.3) : la relation historique Catégorie de Séance N:N et
 * la couleur autonome de Séance sont retirées du contrat cible — une Séance
 * porte désormais une Étiquette facultative (`labelId`), dont la couleur est
 * dérivée à la lecture (`Session.color`).
 *
 * `toCreateSessionInput` emploie le même contrat de résultat structuré que
 * le reste des validations du Domaine : succès avec un `CreateSessionInput`
 * prêt à persister, ou échec listant **toutes** les violations déterminables.
 * Elle ne réimplémente aucune règle de bornes elle-même : elle assemble un
 * candidat directement depuis les champs du brouillon (déjà de la bonne
 * forme structurelle) et délègue l'intégralité de la validation/normalisation
 * à `validateCreateSessionInput` (`validation.ts`), la seule validation
 * complète d'une entrée persistable — réutilisée telle quelle par
 * `SqliteSessionRepository` en défense de dernier recours, quelle que soit
 * l'origine de l'entrée. Elle ne lève jamais d'exception.
 */

import {
  cloneExecutionParameters,
  EXECUTION_PARAMETERS_VERSION,
  executionParametersEqual,
  numberTarget,
  type ExecutionParameters,
  type ExecutionParametersInput,
  type SeriesRow,
} from "@/domain/activities/ExecutionParameters";
import type { MovementPhase } from "@/domain/activities/Movement";
import type { MovementContentSnapshot } from "@/domain/activities/movementSave";
import { draftMediaEqual, toDraftMediaItems, type DraftMediaItem } from "@/domain/media/ActivityMedia";

import type {
  Activity,
  ActivityType,
  CreateSessionInput,
  ExerciseExecutionMode,
  MovementLevelOrigin,
  Session,
  SessionMovementInput,
  StructuralPosition,
  UpdateSessionActivityInput,
  UpdateSessionInput,
} from "./Session";
import {
  clampSessionBoundarySeconds,
  DEFAULT_ACTIVITY_TYPE,
  DEFAULT_EXECUTION_MODE,
  DEFAULT_EXERCISE_DURATION_SECONDS,
  DEFAULT_FINAL_PHASE_SECONDS,
  DEFAULT_INITIAL_COUNTDOWN_SECONDS,
  DEFAULT_PAUSE_SECONDS,
  DEFAULT_SERIES_COUNT,
  DEFAULT_SIDE_MODE,
  DEFAULT_STRUCTURAL_POSITION,
  DEFAULT_TOUR_REPEAT_COUNT,
} from "./defaults";
import { DEFAULT_CIRCUIT_NATURE, type CircuitNature } from "./circuit";
import type { ValidationResult } from "./errors";
import { fail } from "./errors";
import type { SideMode } from "./sideMode";
import { stopPointKey, type StopPoint } from "./StopPoint";
import { normalizeInstruction, normalizeName, validateCreateSessionInput, validateUpdateSessionInput } from "./validation";

/**
 * Mode d'exécution d'un Exercice dans un brouillon : celui du domaine des
 * paramètres (PRE-4, AD-1), `DURATION` ou `REPETITIONS`.
 */
export type SessionDraftExerciseExecutionMode = ExerciseExecutionMode;

/**
 * Paramètres par défaut d'un nouveau brouillon d'Exercice (T01-S08, valeurs
 * canoniques du Domaine) : mode Durée, une Série de
 * `DEFAULT_EXERCISE_DURATION_SECONDS`, sans Pause, sans changement de côté,
 * sans Bip, Compte à rebours ni Fin. Une Cible typée `NUMBER` (PRE-4, AD-1).
 */
export function defaultExerciseExecutionParameters(): ExecutionParameters {
  return {
    version: EXECUTION_PARAMETERS_VERSION,
    mode: DEFAULT_EXECUTION_MODE,
    series: {
      kind: "UNIFORM",
      count: DEFAULT_SERIES_COUNT,
      target: numberTarget(DEFAULT_EXERCISE_DURATION_SECONDS),
      pauseSeconds: DEFAULT_PAUSE_SECONDS,
      // PRE-5 (AD-19, AD-20) : sans charge (0 kg), aucune phase.
      loadKg: 0,
      workPhases: [],
    },
    sideMode: DEFAULT_SIDE_MODE,
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 0,
    endSeconds: 0,
    loadEnabled: false,
  };
}

export type SessionDraftExercise = {
  /**
   * Identifiant stable, propre au brouillon (jamais un identifiant de
   * persistance SQLite — voir la note de tête de `toCreateSessionInput`) —
   * introduit par la complétion REWORK12 (« Plusieurs activités et bouton
   * persistant ») pour permettre l'édition ciblée d'une Activité au sein
   * d'une collection ordonnée. Fourni par l'appelant (`createExerciseDraft`
   * ne génère jamais lui-même d'identifiant — ce fichier reste une fonction
   * pure, sans dépendance `expo-crypto`/React ; `ExerciseScreen.tsx` est
   * responsable de la génération réelle, via `Crypto.randomUUID()`, déjà
   * utilisé ailleurs dans le projet pour les identifiants persistés).
   */
  readonly id: string;
  /**
   * T01-S10 (D-061) : type de l'Activité. Le parcours de création T01-S09
   * ne produit que des Exercices (`"EXERCISE"`) ; la modification bout en
   * bout d'une Séance persistée peut réhydrater une ancienne Récupération,
   * dont la durée est portée par l'unique Série de ses paramètres.
   */
  readonly type: ActivityType;
  /** T01-S10 (D-061) : position structurelle — avant, dans, ou après le Circuit. Reste `"IN_TOUR"` pour tout brouillon créé avant S10. */
  readonly structuralPosition: StructuralPosition;
  readonly name: string;
  /**
   * PRE-4 (story 1.1, AD-3) : paramètres d'exécution typés de l'occurrence,
   * OBLIGATOIRES — éventuellement incomplets pendant l'édition (mode « — »,
   * Cible `UNSET`). Seule source du Mode, des Cibles, de N et des Pauses :
   * le brouillon ne porte plus aucun champ scalaire.
   */
  readonly executionParameters: ExecutionParametersInput;
  /**
   * V2-PRE-1 (plan §3.2) : récupération post-exercice de l'occurrence, en
   * secondes — exécutée une seule fois après toutes les Séries. Disponible
   * dans les trois modes d'exécution ; indépendante de la définition source.
   *
   * PRE-6 (story 1.1, AD-35) : trois états — `null` = ABSENTE (valeur d'une
   * nouvelle occurrence : « aucune récupération automatique »), `0` =
   * présente à 0, positive. Seule une valeur positive remplace la Pause
   * terminale (calculs inchangés).
   */
  readonly postActivityRecoverySeconds: number | null;
  readonly instruction: string | null;
  /** Identifiants stables du référentiel de Zones corporelles persistant (T01-S08, D-093) — sélection multiple, ordre indifférent. */
  readonly bodyZoneIds: readonly string[];
  /** V2-BILAT-01 : direction propre de cette Activité (`sideMode.ts`), alignée sur `executionParameters.sideMode` — `DEFAULT_SIDE_MODE` (`UNILATERAL`) pour un nouveau brouillon (`createExerciseDraft`). */
  readonly sideMode: SideMode;
  /** PRE-3 : Catégorie transportée par la copie (`null` = aucune). */
  readonly categoryId?: string | null;
  /** PRE-3 : médias ordonnés de l'occurrence (assets partagés, liens propres). */
  readonly media?: readonly DraftMediaItem[];
  /**
   * PRE-7 (A1.2, D-437, MFN-03) : Mouvement de l'occurrence, conservé à la duplication.
   *
   * PRE-7 (R-3, D-445 C05) : référence active. `name`, `instruction`, `categoryId`,
   * `bodyZoneIds`, `media` et la structure des phases de `executionParameters` sont une VUE
   * du contenu de ce Mouvement — relue de la Séance, reprise du Catalogue, ou tenue par la table
   * des Mouvements du brouillon (`SessionDraft.movements`, `withDraftMovement`) —, jamais
   * persistée avec l'occurrence. Une occurrence créée dans la Séance reçoit un Mouvement `NEW`
   * à son identifiant ; absent seulement tant qu'elle n'est pas terminée (éditeur).
   */
  readonly sourceMovementId?: string;
  /** PRE-7 (R-3, Q3) : numéro de copie (`Activity.copyNumber`) ; absent/`null` = original. */
  readonly copyNumber?: number | null;
};

/**
 * PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026) : Mouvement créé (`NEW`) ou
 * corrigé (`EDITED`) dans le brouillon de Séance, avant tout enregistrement. Seule source du
 * contenu à écrire : un seul Mouvement, quel que soit le nombre de ses occurrences (original
 * et copies) dans la Composition. Volatil : jamais persisté hors de l'enregistrement de la
 * Séance (`toCreateSessionInput`, `toUpdateSessionInput`).
 */
export type DraftMovement = {
  readonly id: string;
  readonly change: "NEW" | "EDITED";
  readonly name: string;
  readonly description: string | null;
  readonly categoryId: string | null;
  readonly bodyZoneIds: readonly string[];
  readonly media: readonly DraftMediaItem[];
  readonly phases: readonly MovementPhase[];
  readonly nextPhaseId: number;
  readonly aliases: readonly string[];
  /** PRE-7 (R-5, C02) : variante choisie en Séance, rattachée à l'enregistrement (`SessionMovementInput.levelOrigin`). */
  readonly levelOrigin?: MovementLevelOrigin;
};

export type SessionDraft = {
  /**
   * T01-S10 : identifiant de la Séance persistée en cours de MODIFICATION,
   * ou `null` pour une CRÉATION. Champ optionnel de transition (Q1-A,
   * livraison séquencée) : les constructeurs du Domaine (`createEmptyDraft`,
   * `toSessionDraft`) le renseignent toujours ; un consommateur externe
   * lit `draft.sourceSessionId ?? null`.
   */
  readonly sourceSessionId?: string | null;
  readonly name: string;
  /** V2-PRE-1 (plan §3.3) : Étiquette facultative — `null` si aucune. La couleur autonome historique de Séance est retirée du contrat cible. */
  readonly labelId: string | null;
  /** @deprecated V2-PRE-1 : couleur autonome historique retirée du contrat cible (remplacée par `labelId`) — conservée uniquement pour la compatibilité structurelle de `SessionDraftProvider.test.tsx` (hors périmètre d'écriture, `scope_allow`), qui l'utilise encore ; jamais lue par `toCreateSessionInput`/`toUpdateSessionInput`. */
  readonly color?: string;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  /**
   * T01-S10 (D-058) : répétition du Circuit, entier `1..99`. Champ optionnel
   * de transition — `createEmptyDraft` le fixe à `DEFAULT_TOUR_REPEAT_COUNT`
   * ; un consommateur lit `draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT`.
   */
  readonly tourRepeatCount?: number;
  /**
   * PRE-6 (story 1.1, AD-34) : nature du Circuit (Tours / Séries), portée
   * comme `tourRepeatCount` ; la borne `COUNT` en est dérivée
   * (`circuitBoundOf`), jamais stockée. Champ optionnel de transition — un
   * consommateur lit `draft.circuitNature ?? DEFAULT_CIRCUIT_NATURE`.
   */
  readonly circuitNature?: CircuitNature;
  /**
   * Collection ORDONNÉE d'Activités (T01-S08, complétion REWORK12 — « La
   * transformation du brouillon actuel, limité à un champ `exercise`
   * unique, vers une collection ordonnée d'activités est explicitement
   * autorisée dans ce lot »). Remplace l'ancien champ `exercise:
   * SessionDraftExercise | null`. L'ordre de ce tableau EST l'ordre
   * d'insertion/affichage dans `Composition d'une séance` — aucun index de
   * tri séparé. Le déplacement réel (réorganisation par geste) reste hors
   * périmètre de S08/S09 (poignée indicative uniquement, COMP-01).
   */
  readonly exercises: readonly SessionDraftExercise[];
  /**
   * PRE-4 story 4.1 (AC13, FR-01-10) : identifiants des occurrences CHARGÉES
   * depuis la base à l'ouverture de la Séance (`toSessionDraft`). Champ de
   * transport, jamais persisté ni comparé (`sessionDraftsEqual` l'ignore) :
   * il permet à l'enregistrement de distinguer une occurrence EXISTANTE,
   * supprimée entre-temps (échec, rien recréé), d'une occurrence NOUVELLE
   * du Brouillon (création en Séance, duplication, ajout depuis le Catalogue),
   * insérée. Absent : aucune occurrence n'est tenue pour existante.
   */
  readonly persistedExerciseIds?: readonly string[];
  /**
   * PRE-6 (story 1.2, AD-36, ARB-3) : Points d'arrêt du brouillon,
   * `{ id, scope, position }` où `position` est l'emplacement dans la portée
   * (voir `StopPoint`). Hydratés par `toSessionDraft`, transmis par
   * `toCreateSessionInput`/`toUpdateSessionInput`, tenus à jour par les
   * opérations de Composition (`moveOccurrence`, `duplicateOccurrence`,
   * `removeOccurrence`). Champ optionnel de transition — un consommateur
   * lit `draft.stopPoints ?? []`.
   */
  readonly stopPoints?: readonly StopPoint[];
  /**
   * PRE-6 (story 1.4, AD-38) : réserve du Circuit de Séries — par identifiant
   * d'occurrence, les lignes variables retirées par une diminution de N, dans
   * leur ordre relatif, restaurées en premier à l'augmentation
   * (`setCircuitCount`). Champ de transport VOLATIL : jamais persisté, ignoré
   * par `toCreateSessionInput`/`toUpdateSessionInput`, les durées, les volumes
   * et `sessionDraftsEqual` ; jamais produit par `toSessionDraft` (purge par
   * construction à l'enregistrement). Absent = réserve vide.
   */
  readonly circuitSeriesReserve?: Readonly<Record<string, readonly SeriesRow[]>>;
  /**
   * PRE-7 (R-3, D-445 C05) : Mouvements nouveaux ou corrigés du brouillon, par identifiant
   * (voir `DraftMovement`). Absent = aucun. Un Mouvement sans occurrence restante n'est pas
   * enregistré. Champ optionnel de transition, comme `stopPoints`.
   */
  readonly movements?: Readonly<Record<string, DraftMovement>>;
};

/**
 * V2-PRE-2 (plan §6.1, D-213) : valeurs initiales d'un nouveau brouillon de
 * Séance — `SessionDraftProvider` les lit depuis le Profil au moment réel
 * de la création et les transmet ici ; en leur absence (fonction pure, hors
 * fournisseur Profil — tests, T19), les constantes du Domaine s'appliquent
 * inchangées.
 */
export type SessionDraftDefaults = {
  readonly initialCountdownSeconds?: number;
  readonly finalPhaseSeconds?: number;
};

/**
 * Brouillon de Séance vide (aucune Activité, aucune Étiquette). `defaults`
 * optionnel (T19) : fourni par l'appelant réel (valeurs COURANTES du
 * Profil, snapshot atomique à la création) — jamais relu ni dérivé
 * ailleurs ; en son absence, les constantes canoniques du Domaine
 * s'appliquent (patron déjà établi pour `createEmptyActivityDefinitionDraft`).
 */
export function createEmptyDraft(defaults: SessionDraftDefaults = {}): SessionDraft {
  return {
    sourceSessionId: null,
    name: "",
    labelId: null,
    // PRE-6 story 7.8 (D-443) : un défaut du Profil hérité au-delà de 60 s (D-265 le conserve) est
    // ramené à 60 s dans la Séance créée.
    initialCountdownSeconds: clampSessionBoundarySeconds(defaults.initialCountdownSeconds ?? DEFAULT_INITIAL_COUNTDOWN_SECONDS),
    finalPhaseSeconds: clampSessionBoundarySeconds(defaults.finalPhaseSeconds ?? DEFAULT_FINAL_PHASE_SECONDS),
    tourRepeatCount: DEFAULT_TOUR_REPEAT_COUNT,
    exercises: [],
  };
}

/**
 * Brouillon d'Exercice vide, destiné au parcours « Ajouter une activité »
 * (T01-S08) : nom vide, mode Durée par défaut (`DEFAULT_EXECUTION_MODE`),
 * durée initiale canonique (`DEFAULT_EXERCISE_DURATION_SECONDS`), une
 * Série sans pause (`DEFAULT_SERIES_COUNT`/`DEFAULT_PAUSE_SECONDS`), aucune
 * consigne, aucune zone corporelle sélectionnée.
 *
 * `id` est désormais un paramètre obligatoire (complétion REWORK12) —
 * fourni par l'appelant, jamais généré ici (fonction pure).
 *
 * V2-PRE-2 (plan §6.1/§7, D-171/D-213) : `postActivityRecoverySeconds`
 * devient un second paramètre optionnel — la valeur COURANTE du Profil au
 * moment réel de la création de cette occurrence locale (snapshot
 * atomique, jamais relue ensuite).
 *
 * PRE-6 (story 1.1, AD-35) : en son absence, l'occurrence naît SANS
 * récupération (`null`), conformément à « aucune récupération automatique ».
 */
export function createExerciseDraft(
  id: string,
  postActivityRecoverySeconds: number | null = null,
): SessionDraftExercise {
  return {
    id,
    type: DEFAULT_ACTIVITY_TYPE,
    structuralPosition: DEFAULT_STRUCTURAL_POSITION,
    name: "",
    executionParameters: defaultExerciseExecutionParameters(),
    postActivityRecoverySeconds,
    instruction: null,
    bodyZoneIds: [],
    sideMode: DEFAULT_SIDE_MODE,
  };
}

/**
 * Convertit une `Session` persistée vers un `SessionDraft` modifiable —
 * l'inverse de `toCreateSessionInput`. Fonction pure, aucune dépendance
 * React ou SQLite. Copie sans perte les champs éditables (nom, Étiquette,
 * phases, TOUTES les Activités du Circuit dans l'ordre) ; les champs
 * d'identité et d'audit (`id`, `ownerId`, `status`, `createdAt`,
 * `updatedAt`, identifiants et `repeatCount` de `cycle`/`tour`, et sur
 * chaque Activité `id`/`type`/`structuralPosition`/`position`) ne sont
 * volontairement pas repris : `SessionDraft` ne les modélise pas, et
 * `sessionId` est transmis séparément lors de l'enregistrement d'une
 * modification.
 *
 * `SessionDraftExercise.id` reprend directement l'identifiant persisté de
 * l'Activité (`Activity.id`) — un identifiant stable, jamais régénéré ici
 * (édition ciblée par identifiant, même convention que `createExerciseDraft`).
 *
 * Cette fonction reste hors périmètre du parcours de création T01-S09
 * lui-même (réouverture/modification d'une Séance existante, T01-S10) —
 * elle n'est appelée par aucun écran câblé avant cette tranche future.
 */
export function toSessionDraft(session: Session): SessionDraft {
  const structuralActivities: readonly Activity[] = [
    ...(session.cycle.beforeTour ?? []),
    ...session.cycle.tour.exercises,
    ...(session.cycle.afterTour ?? []),
  ];

  return {
    sourceSessionId: session.id,
    name: session.name,
    labelId: session.labelId ?? null,
    // PRE-6 story 7.8 (D-443) : une valeur héritée au-delà de 60 s est relue à 60 s — brouillon
    // et base de comparaison partagent cette lecture (la Séance n'est pas marquée modifiée) ; elle
    // est réenregistrée à 60 s au prochain enregistrement.
    initialCountdownSeconds: clampSessionBoundarySeconds(session.initialCountdownSeconds),
    finalPhaseSeconds: clampSessionBoundarySeconds(session.finalPhaseSeconds),
    tourRepeatCount: session.cycle.tour.repeatCount,
    // PRE-6 (story 1.1) : nature relue ; absente (fixture antérieure) = Tours.
    ...(session.cycle.tour.nature !== undefined ? { circuitNature: session.cycle.tour.nature } : {}),
    exercises: structuralActivities.map((activity) => activityToDraftExercise(activity)),
    persistedExerciseIds: structuralActivities.map((activity) => activity.id),
    // PRE-6 (story 1.2) : points relus tels qu'enregistrés (copies).
    ...(session.stopPoints !== undefined
      ? { stopPoints: session.stopPoints.map((point) => ({ ...point })) }
      : {}),
  };
}

/**
 * Projette une `Activity` persistée vers un `SessionDraftExercise` (T01-S10).
 * Une Récupération (`type === "RECOVERY"`) conserve son type et sa position.
 * Les paramètres typés sont clonés en profondeur (AD-9). L'ordre d'affichage
 * suit `structuralActivities` (avant, dans, après le Circuit) — jamais
 * `position` seul, qui n'est unique que par zone.
 */
function activityToDraftExercise(activity: Activity): SessionDraftExercise {
  return {
    id: activity.id,
    type: activity.type,
    structuralPosition: activity.structuralPosition,
    name: activity.name,
    executionParameters: cloneExecutionParameters(activity.executionParameters),
    // PRE-6 (AD-35) : `undefined` (fixture antérieure) = absente ; `0` reste présente à 0.
    postActivityRecoverySeconds: activity.postActivityRecoverySeconds ?? null,
    instruction: activity.instruction,
    // PRE-4 (story 1.3, AD-9) : nouvelle collection, jamais partagée avec la Séance relue.
    bodyZoneIds: [...activity.bodyZoneIds],
    // V2-BILAT-01 : `Activity.sideMode` est un champ optionnel de transition
    // (même convention que `cycle.beforeTour`/`afterTour`) — `??
    // DEFAULT_SIDE_MODE` couvre une Séance persistée avant cette tranche.
    sideMode: activity.sideMode ?? DEFAULT_SIDE_MODE,
    // PRE-3 : transport complet et indépendant (copies profondes).
    ...(activity.categoryId !== undefined ? { categoryId: activity.categoryId } : {}),
    ...(activity.media ? { media: toDraftMediaItems(activity.media) } : {}),
    // PRE-7 (A1.2, MFN-03 ; R-3, C05) : Mouvement relu, contenu courant déjà résolu par le repository.
    ...(activity.sourceMovementId !== undefined ? { sourceMovementId: activity.sourceMovementId } : {}),
    ...(activity.copyNumber !== undefined && activity.copyNumber !== null ? { copyNumber: activity.copyNumber } : {}),
  };
}

/**
 * PRE-7 (R-3, D-445 C05) : entrée de la table des Mouvements du brouillon tirée du contenu d'une
 * occurrence terminée dans l'éditeur (vue du Mouvement) : nom, description, Catégorie, Zones,
 * médias et structure des phases (identités, libellés, ordre) de ses paramètres. Le compteur ne
 * recule jamais sous `nextPhaseId` (celui du Mouvement ou de la Feuille).
 */
export function draftMovementOf(
  exercise: SessionDraftExercise,
  change: DraftMovement["change"],
  options: {
    readonly nextPhaseId?: number;
    readonly aliases?: readonly string[];
    readonly levelOrigin?: MovementLevelOrigin;
  } = {},
): DraftMovement {
  const phases = exercise.executionParameters.series.workPhases.map((phase) => ({ id: phase.id, label: phase.label }));
  const floor = phases.reduce((max, phase) => Math.max(max, phase.id), 0) + 1;
  return {
    id: exercise.sourceMovementId ?? exercise.id,
    change,
    name: exercise.name,
    description: exercise.instruction,
    categoryId: exercise.categoryId ?? null,
    bodyZoneIds: [...exercise.bodyZoneIds],
    media: (exercise.media ?? []).map((item) => ({ assetId: item.assetId, asset: { ...item.asset } })),
    phases,
    nextPhaseId: Math.max(floor, options.nextPhaseId ?? 0),
    aliases: [...(options.aliases ?? [])],
    ...(options.levelOrigin !== undefined ? { levelOrigin: options.levelOrigin } : {}),
  };
}

/**
 * PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026 : « Le contenu du mouvement est
 * désormais partagé… N'ajoute pas de mécanisme particulier ») : inscrit `movement` dans la table
 * des Mouvements du brouillon. Chaque occurrence qui le référence — original et copies, sans
 * distinction — affiche alors ce contenu : sa vue (nom, description, Catégorie, Zones, médias)
 * est celle du Mouvement, et la structure de ses phases suit celle du Mouvement en gardant ses
 * PROPRES durées par identité de phase (une phase nouvelle reste à renseigner, 0, D-438 ; aucune
 * durée inventée). Les autres paramètres de chaque occurrence restent indépendants.
 * Fonction pure : rend toujours une nouvelle table et de nouvelles vues pour les occurrences du
 * Mouvement, même si leur contenu est inchangé.
 */
export function withDraftMovement(draft: SessionDraft, movement: DraftMovement): Pick<SessionDraft, "exercises" | "movements"> {
  const movements = { ...(draft.movements ?? {}), [movement.id]: movement };
  const exercises = draft.exercises.map((exercise) => {
    if (exercise.sourceMovementId !== movement.id) {
      return exercise;
    }
    const durations = new Map(
      exercise.executionParameters.series.workPhases.map((phase) => [phase.id, phase.durationSeconds] as const),
    );
    const workPhases = movement.phases.map((phase) => ({
      id: phase.id,
      label: phase.label,
      durationSeconds: durations.get(phase.id) ?? 0,
    }));
    return {
      ...exercise,
      name: movement.name,
      instruction: movement.description,
      categoryId: movement.categoryId,
      bodyZoneIds: [...movement.bodyZoneIds],
      media: movement.media.map((item) => ({ assetId: item.assetId, asset: { ...item.asset } })),
      executionParameters: {
        ...exercise.executionParameters,
        series: { ...exercise.executionParameters.series, workPhases },
      },
    };
  });
  return { exercises, movements };
}

/**
 * PRE-7 (R-4, D-445 C03, C04) : contenu comparé par la décision de sauvegarde
 * (`decideMovementSave`) d'un Mouvement du brouillon — entrée `EDITED` déjà inscrite (avant),
 * ou contenu d'une occurrence terminée (`draftMovementOf`, après). Nom et description sont
 * normalisés comme à l'enregistrement de la Séance (`normalizeName`, `normalizeInstruction`) :
 * des espaces ajoutés ne sont pas un changement de nom.
 */
export function movementContentOfDraft(movement: DraftMovement): MovementContentSnapshot {
  return {
    name: normalizeName(movement.name),
    aliases: movement.aliases,
    description: normalizeInstruction(movement.description),
    mediaAssetIds: movement.media.map((item) => item.assetId),
    categoryId: movement.categoryId,
    bodyZoneIds: movement.bodyZoneIds,
    phases: movement.phases,
  };
}

/**
 * PRE-7 (R-4, D-445 C03, C04, Q10) : « Créer un nouveau mouvement » depuis le crayon d'une
 * occurrence de Séance. `edited` est l'occurrence terminée dans l'éditeur (contenu et structure
 * modifiés, paramètres saisis), sous son identifiant d'origine. Elle est remplacée, à la MÊME
 * place, par une nouvelle occurrence (`ids.occurrenceId`) qui référence un Mouvement `NEW`
 * (`ids.movementId`) portant son contenu ; ses paramètres sont ceux de l'occurrence éditée
 * (durées par identité de phase, structure éditée), sans numéro de copie. L'ancienne occurrence
 * quitte le brouillon ; les autres occurrences gardent l'ancien Mouvement, inchangé. Aucun
 * rattachement au groupe de niveaux (Q10) et aucun alias repris (les alias appartiennent à
 * l'ancien Mouvement). L'entrée de réserve de Circuit éventuelle suit l'occurrence. Le compteur
 * de phase ne recule jamais sous `nextPhaseId`. Un nom déjà pris est refusé à l'enregistrement
 * de la Séance (`DuplicateMovementNameError`, C01). Fonction pure ; une occurrence absente du
 * brouillon lève (entrée invalide).
 */
export function replaceOccurrenceWithNewMovement(
  draft: SessionDraft,
  edited: SessionDraftExercise,
  ids: { readonly occurrenceId: string; readonly movementId: string },
  options: { readonly nextPhaseId?: number } = {},
): Pick<SessionDraft, "exercises" | "movements" | "circuitSeriesReserve"> {
  if (!draft.exercises.some((exercise) => exercise.id === edited.id)) {
    throw new Error("replaceOccurrenceWithNewMovement: the edited occurrence is not in the draft.");
  }
  const replacement: SessionDraftExercise = {
    ...edited,
    id: ids.occurrenceId,
    sourceMovementId: ids.movementId,
    copyNumber: null,
  };
  const movement = draftMovementOf(replacement, "NEW", { nextPhaseId: options.nextPhaseId, aliases: [] });
  const exercises = draft.exercises.map((exercise) => (exercise.id === edited.id ? replacement : exercise));
  const reserve = draft.circuitSeriesReserve;
  let circuitSeriesReserve = reserve;
  if (reserve !== undefined && Object.prototype.hasOwnProperty.call(reserve, edited.id)) {
    const { [edited.id]: rows, ...rest } = reserve;
    circuitSeriesReserve = { ...rest, [ids.occurrenceId]: rows! };
  }
  return {
    exercises,
    movements: { ...(draft.movements ?? {}), [movement.id]: movement },
    ...(circuitSeriesReserve !== undefined ? { circuitSeriesReserve } : {}),
  };
}

/**
 * PRE-7 (R-3) : Mouvements du brouillon à enregistrer — ceux qu'au moins une occurrence
 * référence encore, dans l'ordre de première occurrence ; un Mouvement dont toutes les
 * occurrences ont été retirées n'est pas créé.
 */
function toSessionMovementInputs(draft: SessionDraft): SessionMovementInput[] {
  const table = draft.movements ?? {};
  const seen = new Set<string>();
  const inputs: SessionMovementInput[] = [];
  for (const exercise of draft.exercises) {
    const id = exercise.sourceMovementId;
    if (id === undefined || seen.has(id) || table[id] === undefined) {
      continue;
    }
    seen.add(id);
    const movement = table[id];
    inputs.push({
      id: movement.id,
      change: movement.change,
      name: movement.name,
      description: movement.description,
      categoryId: movement.categoryId ?? "",
      bodyZoneIds: [...movement.bodyZoneIds],
      media: movement.media.map((item) => ({ assetId: item.assetId, asset: { ...item.asset } })),
      phases: movement.phases.map((phase) => ({ id: phase.id, label: phase.label })),
      nextPhaseId: movement.nextPhaseId,
      aliases: [...movement.aliases],
      ...(movement.levelOrigin !== undefined ? { levelOrigin: { ...movement.levelOrigin } } : {}),
    });
  }
  return inputs;
}

function bodyZoneIdSetsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

/**
 * Compare deux brouillons d'Exercice champ à champ — exportée (T01-S08)
 * pour être réutilisée directement par `ExerciseScreen` (comparaison de sa
 * copie de travail locale à son instantané initial, indépendamment du
 * `SessionDraft` partagé). Les zones corporelles sont comparées comme un
 * ensemble : leur ordre n'est pas significatif. `id` est comparé comme
 * n'importe quel autre champ (complétion REWORK12) — sans effet pratique
 * ici, puisque `ExerciseScreen` compare toujours une copie de travail à son
 * propre instantané initial, qui partagent nécessairement le même `id`
 * tout au long d'une session d'édition.
 */
export function exerciseEquals(
  a: SessionDraftExercise | null,
  b: SessionDraftExercise | null,
): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.structuralPosition === b.structuralPosition &&
    a.name === b.name &&
    a.postActivityRecoverySeconds === b.postActivityRecoverySeconds &&
    a.instruction === b.instruction &&
    bodyZoneIdSetsEqual(a.bodyZoneIds, b.bodyZoneIds) &&
    a.sideMode === b.sideMode &&
    executionParametersEqual(a.executionParameters, b.executionParameters) &&
    (a.categoryId ?? null) === (b.categoryId ?? null) &&
    draftMediaEqual(a.media, b.media) &&
    // PRE-7 (R-3) : Mouvement référencé et numéro de copie.
    (a.sourceMovementId ?? null) === (b.sourceMovementId ?? null) &&
    (a.copyNumber ?? null) === (b.copyNumber ?? null)
  );
}

/**
 * Compare deux collections d'Activités élément par élément, dans l'ORDRE
 * (l'ordre lui-même est significatif — voir `SessionDraft.exercises`) —
 * introduite par la complétion REWORK12, réutilisée par
 * `isSessionDraftDirty` ci-dessous.
 */
function exercisesEqual(
  a: readonly SessionDraftExercise[],
  b: readonly SessionDraftExercise[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((exercise, index) => exerciseEquals(exercise, b[index]));
}

/**
 * Compare les champs fonctionnels d'un brouillon à ceux de son brouillon
 * initial RÉELLEMENT créé (T18) — utilisé par la garde de sortie de
 * Composition (T01-S07) pour décider si une navigation sortante doit être
 * bloquée. `baseline` optionnel (T19) : `createEmptyDraft()` par défaut
 * (constantes du Domaine) — l'appelant réel transmet le brouillon
 * effectivement créé par `SessionDraftProvider` (valeurs du Profil au
 * moment de la création), jamais recalculé ici. Fonction pure, aucune
 * dépendance React/navigation.
 */
export function isSessionDraftDirty(
  draft: SessionDraft,
  baseline: SessionDraft = createEmptyDraft(),
): boolean {
  return !sessionDraftsEqual(draft, baseline);
}

/**
 * Compare champ à champ deux brouillons sur leurs propriétés FONCTIONNELLES
 * (nom, Étiquette, phases, répétition du Circuit, Activités dans l'ordre) —
 * `sourceSessionId` est un champ d'IDENTITÉ, jamais comparé. T01-S10 : la
 * garde de sortie en MODIFICATION compare le brouillon courant à son état
 * RÉHYDRATÉ (CE-T01-S10-06 — le dialogue d'abandon n'apparaît que si quelque
 * chose a réellement changé) ; en CRÉATION, `isSessionDraftDirty` compare au
 * brouillon vide. Fonction pure, aucune dépendance React/navigation.
 */
export function sessionDraftsEqual(a: SessionDraft, b: SessionDraft): boolean {
  return (
    a.name === b.name &&
    a.labelId === b.labelId &&
    a.initialCountdownSeconds === b.initialCountdownSeconds &&
    a.finalPhaseSeconds === b.finalPhaseSeconds &&
    (a.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT) ===
      (b.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT) &&
    // PRE-6 (story 1.1) : un changement de nature seul rend le brouillon modifié.
    (a.circuitNature ?? DEFAULT_CIRCUIT_NATURE) === (b.circuitNature ?? DEFAULT_CIRCUIT_NATURE) &&
    exercisesEqual(a.exercises, b.exercises) &&
    // PRE-6 (story 1.2) : un point ajouté, retiré ou déplacé seul rend le brouillon modifié.
    stopPointsEqual(a.stopPoints ?? [], b.stopPoints ?? [])
  );
}

/** Compare deux collections de Points d'arrêt par emplacement `(scope, position)`, identifiants et ordre du tableau ignorés. */
function stopPointsEqual(a: readonly StopPoint[], b: readonly StopPoint[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const keysA = a.map(stopPointKey).sort();
  const keysB = b.map(stopPointKey).sort();
  return keysA.every((key, index) => key === keysB[index]);
}

/** Emplacements persistables des Points d'arrêt du brouillon (identifiants non transmis). */
function toStopPointInputs(draft: SessionDraft) {
  return (draft.stopPoints ?? []).map((point) => ({ scope: point.scope, position: point.position }));
}

/**
 * Paramètres persistables d'un brouillon d'Activité, normalisés selon son
 * type (T02-S01) — partagés par `toCreateSessionInput` et
 * `toUpdateSessionInput`, qui appliquaient jusqu'ici cette normalisation
 * séparément (et, pour la création, pas du tout : elle émettait toujours un
 * Exercice, perdant toute Récupération du brouillon).
 *
 * Une Récupération (`type === "RECOVERY"`, D-041) est toujours chronométrée :
 * elle est émise sans Récupération attachée et sans Zones corporelles ; sa
 * durée voyage dans ses paramètres (la validation refuse de toute façon une
 * nouvelle Récupération autonome, `validateCreatableActivityType`).
 */
function toDraftActivityParameters(exercise: SessionDraftExercise) {
  if (exercise.type === "RECOVERY") {
    return {
      type: "RECOVERY" as const,
      executionParameters: cloneExecutionParameters(exercise.executionParameters),
      postActivityRecoverySeconds: null,
      sideMode: exercise.sideMode,
    };
  }
  return {
    type: "EXERCISE" as const,
    // PRE-4 : paramètres typés (seule source du Mode, des Cibles, de N et des Pauses), voyagent
    // jusqu'à la transaction de Séance (Continuer) — jamais persistés avant. Story 1.3 (AD-9) :
    // clonés. PRE-7 (R-3, C05) : aucun contenu ; seules les durées de phase seront écrites.
    executionParameters: cloneExecutionParameters(exercise.executionParameters),
    postActivityRecoverySeconds: exercise.postActivityRecoverySeconds,
    sideMode: exercise.sideMode,
    ...(exercise.sourceMovementId !== undefined ? { sourceMovementId: exercise.sourceMovementId } : {}),
    ...(exercise.copyNumber !== undefined && exercise.copyNumber !== null ? { copyNumber: exercise.copyNumber } : {}),
  };
}

/**
 * Valide et convertit un brouillon vers un `CreateSessionInput` persistable
 * (T01-S09 : TOUTES les Activités de `draft.exercises`, dans l'ordre).
 *
 * **T02-S01** : transporte désormais aussi l'identifiant de brouillon de
 * chaque Activité, son type, sa position structurelle et la répétition réelle
 * du Circuit — une création comportant une Récupération, une Activité hors
 * Circuit ou un Circuit ≠ `1` était jusqu'ici persistée comme un Exercice
 * `IN_TOUR` d'un Circuit figé à `1` (plan §5.1).
 *
 * Assemble un candidat structurellement conforme directement depuis les
 * champs du brouillon — sans revalider aucune borne elle-même — puis
 * délègue l'intégralité de la validation/normalisation à
 * `validateCreateSessionInput` (`validation.ts`), qui agrège systématiquement
 * **toutes** les violations déterminables (Séance, chaque Activité) avant de
 * retourner un échec. Ne lève jamais d'exception.
 */
export function toCreateSessionInput(draft: SessionDraft): ValidationResult<CreateSessionInput> {
  return validateCreateSessionInput({
    name: draft.name,
    labelId: draft.labelId,
    initialCountdownSeconds: draft.initialCountdownSeconds,
    finalPhaseSeconds: draft.finalPhaseSeconds,
    tourRepeatCount: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    ...(draft.circuitNature !== undefined ? { circuitNature: draft.circuitNature } : {}),
    exercises: draft.exercises.map((exercise) => ({
      id: exercise.id,
      structuralPosition: exercise.structuralPosition,
      ...toDraftActivityParameters(exercise),
    })),
    // PRE-7 (R-3, C05) : Mouvements nouveaux ou corrigés, écrits avant les occurrences.
    movements: toSessionMovementInputs(draft),
    stopPoints: toStopPointInputs(draft),
  });
}

/**
 * Valide et convertit un brouillon de MODIFICATION vers un `UpdateSessionInput`
 * persistable (T01-S10, plan §6.2 ; Q3-A — jamais `toCreateSessionInput`).
 *
 * Exige `draft.sourceSessionId` (échec `REQUIRED` sur `session.sourceSessionId`
 * sinon — un brouillon de création n'est jamais enregistré par cette voie).
 * Chaque `SessionDraftExercise` devient une `UpdateSessionActivityInput` en
 * conservant son `id` (identifiant persistant d'une Activité existante, ou
 * identifiant frais d'une nouvelle Activité — le Repository fusionne par
 * identifiant, plan §6.4). `position` est réattribué par zone structurelle
 * dans l'ordre du brouillon. Une Récupération (`type === "RECOVERY"`) est
 * émise sans mode d'Exercice, sans Séries, sans pause, sans Zones (D-041).
 *
 * Délègue l'intégralité de la validation à `validateUpdateSessionInput`.
 * Ne lève jamais d'exception.
 */
export function toUpdateSessionInput(
  draft: SessionDraft,
): ValidationResult<UpdateSessionInput> {
  const sourceSessionId = draft.sourceSessionId ?? null;
  if (sourceSessionId === null || sourceSessionId.trim().length === 0) {
    return fail([{ code: "REQUIRED", field: "session.sourceSessionId" }]);
  }

  const positionByZone = new Map<StructuralPosition, number>();
  const activities: UpdateSessionActivityInput[] = draft.exercises.map((exercise) => {
    const zone = exercise.structuralPosition;
    const position = positionByZone.get(zone) ?? 0;
    positionByZone.set(zone, position + 1);

    return {
      id: exercise.id,
      structuralPosition: zone,
      position,
      ...toDraftActivityParameters(exercise),
    };
  });

  return validateUpdateSessionInput({
    sourceSessionId,
    name: draft.name,
    labelId: draft.labelId,
    initialCountdownSeconds: draft.initialCountdownSeconds,
    finalPhaseSeconds: draft.finalPhaseSeconds,
    tourRepeatCount: draft.tourRepeatCount ?? DEFAULT_TOUR_REPEAT_COUNT,
    ...(draft.circuitNature !== undefined ? { circuitNature: draft.circuitNature } : {}),
    activities,
    movements: toSessionMovementInputs(draft),
    stopPoints: toStopPointInputs(draft),
    ...(draft.persistedExerciseIds !== undefined ? { persistedActivityIds: [...draft.persistedExerciseIds] } : {}),
  });
}
