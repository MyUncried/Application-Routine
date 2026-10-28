import type {
  ExecutionMode,
  ExecutionParameters,
  ExecutionParametersInput,
} from "@/domain/activities/ExecutionParameters";
import type { SessionDurationKind } from "@/domain/activities/executionCalculations";
import type { MovementPhase } from "@/domain/activities/Movement";
import type { MediaLinkInput, SessionActivityMediaWithAsset } from "@/domain/media/ActivityMedia";

import type { SideMode } from "./sideMode";
import type { StopPoint } from "./StopPoint";
import type { CircuitNature } from "./circuit";
import type { SessionStructure } from "./structure";

export const SESSION_COLORS = [
  "#E5484D",
  "#F47B20",
  "#F7D154",
  "#2E9B62",
  "#20B2AA",
  "#32B8D8",
  "#3B82F6",
  "#5A5BD7",
  "#7B61D1",
  "#A34AB7",
  "#E45C9A",
  "#8E8E93",
] as const;

/** Présentation neutre d'une Séance sans Étiquette (V2-PRE-1, plan §3.3) — jamais un champ autonome saisissable depuis PRE-1. */
export const DEFAULT_SESSION_COLOR = "#3B82F6" as const;

export type SessionColor = (typeof SESSION_COLORS)[number];

/**
 * Type d'une Activité.
 *
 * **T02-S02 — la Récupération n'est plus un type d'Activité.** Elle devient
 * une DURÉE FACULTATIVE ATTACHÉE à une Activité (`Activity.postActivityRecoverySeconds`,
 * `09 – Modèle de données fonctionnel.md`, `12 – Architecture technique.md`
 * §« Le schéma d'Activité … ne porte aucun type Exercice/Récupération ») :
 * plus aucun sélecteur fonctionnel Exercice/Récupération n'existe et AUCUNE
 * nouvelle Activité `RECOVERY` ne peut être créée (`validation.ts` la refuse
 * explicitement, code `MUST_BE_ABSENT` sur `activity.type`).
 *
 * La valeur `"RECOVERY"` est CONSERVÉE dans l'union pour une seule raison :
 * la colonne SQL `activities.type` porte encore son `CHECK (type IN
 * ('EXERCISE','RECOVERY'))`, hérité de `migration001` — un fichier immuable
 * (« Conservation des acquis »). `migration004` convertit les anciennes
 * lignes `RECOVERY` en récupération attachée sur l'Activité qui les précède
 * puis les supprime : après migration, aucune ligne `RECOVERY` ne subsiste.
 * Le chemin de LECTURE reste néanmoins défensif (assemblage, calculs) plutôt
 * que de lever sur une donnée ancienne inattendue.
 */
export type ActivityType = "EXERCISE" | "RECOVERY";

/**
 * Position structurelle d'une Activité (T01-S10, D-061) : avant le Circuit,
 * dans le Circuit, ou après le Circuit. Le schéma SQLite portait déjà les
 * trois valeurs. Les Activités hors Circuit sont rattachées au Cycle, celles
 * `IN_TOUR` au Circuit.
 */
export type StructuralPosition = "BEFORE_TOUR" | "IN_TOUR" | "AFTER_TOUR";

/**
 * Mode d'exécution d'un Exercice : `DURATION` ou `REPETITIONS` (PRE-4,
 * story 1.1, AD-1, FR-05-01). Défini par le seul domaine des paramètres
 * (`ExecutionParameters.ts`) et réexporté ici sous son nom historique. Une
 * Série menée jusqu'à l'échec est une Cible (`SeriesTarget` `FAILURE`),
 * jamais un Mode (FR-05-04).
 */
export type ExerciseExecutionMode = ExecutionMode;

/**
 * Activité persistée — une OCCURRENCE d'Exercice dans une Séance (T01-S09,
 * complétion REWORK12 ; T01-S10 : Récupération, positions structurelles ;
 * V2-PRE-1 : `postActivityRecoverySeconds` obligatoire, indépendant de la
 * définition source, plan §3.2 ; PRE-4 : paramètres typés obligatoires).
 *
 * Un Exercice porte ses paramètres d'exécution typés (Mode, Cibles par
 * Série, N, Pauses, côtés, Bip, Compte à rebours, Fin — AD-1, AD-3), une
 * Consigne optionnelle et une sélection de Zones corporelles (D-093). Aucun
 * Mode, Cible, N ni Pause scalaire n'est exposé.
 *
 * Une Récupération autonome (`type === "RECOVERY"`, ancienne ligne, D-041)
 * est lue défensivement : une seule Série chronométrée de sa durée, sans
 * Pause ni Zone.
 *
 * Historique : `Session.cycle.tour.exercises` reste la collection ordonnée
 * des Activités `IN_TOUR` (T01-S09). Les Activités `BEFORE_TOUR`/`AFTER_TOUR`
 * sont exposées par les champs `Session.cycle.beforeTour`/`afterTour`
 * (T01-S10). `position` est un rang 0-indexé DANS la zone structurelle.
 */
export type Activity = {
  id: string;
  type: ActivityType;
  structuralPosition: StructuralPosition;
  /** Rang 0-indexé de l'Activité dans sa zone structurelle — ordre d'exécution ET d'affichage. */
  position: number;
  name: string;
  /**
   * PRE-4 (story 1.1, AD-3) : paramètres d'exécution TYPÉS de l'occurrence,
   * lus par `readExecutionParameters` (v2 et v3, PRE-5 AD-18) — seule source de son Mode, de ses Cibles, de N et de
   * ses Pauses. Les colonnes scalaires n'en sont que des projections
   * d'écriture, jamais exposées ni relues.
   */
  executionParameters: ExecutionParameters;
  /**
   * V2-PRE-1 (plan §3.2) : récupération post-exercice de l'OCCURRENCE,
   * copiée depuis le Profil au moment de l'insertion et INDÉPENDANTE de la
   * définition source — une modification ultérieure du Profil ou de la
   * définition ne modifie jamais une occurrence déjà créée. `0` = aucune
   * récupération (valeur neutre, jamais `null`). Exécutée UNE SEULE FOIS
   * après toutes les Séries ; ne compte jamais comme une Activité
   * supplémentaire (`computeActivityCount` inchangé).
   *
   * Champ OPTIONNEL de transition sur ce type LU (obligatoire et toujours
   * renseigné à l'écriture, `CreateSessionActivityInput`/
   * `UpdateSessionActivityInput`). Champ OPTIONNEL uniquement sur ce type LU,
   * pour la compatibilité structurelle de `CatalogueCompositionEditFlow
   * .integration.test.tsx`/`SessionDraftProvider.test.tsx` (hors périmètre
   * d'écriture, `scope_allow`) qui construisent encore ce type sans lui —
   * un consommateur lit `activity.postActivityRecoverySeconds ?? 0`.
   *
   * PRE-6 (story 1.1, AD-35) : trois états — `null` = ABSENTE, `0` =
   * présente à 0, positive. Seule une valeur positive remplace la Pause
   * terminale ; `null` et `0` ne remplacent rien (calculs inchangés).
   * Présence persistée par `post_activity_recovery_present` (`migration011`).
   */
  postActivityRecoverySeconds?: number | null;
  /** @deprecated V2-PRE-1 : remplacé par `postActivityRecoverySeconds` (plan §3.2) — conservé uniquement pour la compatibilité structurelle de fixtures hors périmètre d'écriture qui l'utilisent encore ; jamais lu par le Domaine, les calculs ou la persistance. */
  recoverySeconds?: number;
  instruction: string | null;
  /** Identifiants stables du référentiel de Zones corporelles persistant (D-093) — sélection multiple, ordre indifférent ; toujours vide pour une Récupération. */
  bodyZoneIds: readonly string[];
  /**
   * V2-BILAT-01 : direction PROPRE de cette occurrence d'Activité
   * (`UNILATERAL`/`RIGHT_LEFT`/`LEFT_RIGHT`, `sideMode.ts`). Champ optionnel
   * de transition — un consommateur lit `activity.sideMode ?? DEFAULT_SIDE_MODE`.
   *
   * V2-PRE-1 (plan §3.3) : la bilatéralité est portée EXCLUSIVEMENT par
   * l'Exercice — le Circuit (Tour) n'a plus aucune influence fonctionnelle
   * sur cette direction (`resolveEffectiveSideMode`/`applyTourSideModeTransition`
   * sont retirés du Domaine).
   */
  sideMode?: SideMode;
  /** PRE-3 : Catégorie transportée par la copie (`null` pour une ancienne copie sans Catégorie). */
  categoryId?: string | null;
  /** PRE-3 : médias ordonnés de l'occurrence (liens propres, fichiers partagés). */
  media?: readonly SessionActivityMediaWithAsset[];
  /**
   * PRE-7 (A1.2, D-437, MFN-03) : Mouvement de l'occurrence.
   *
   * PRE-7 (R-3, `migration013`, D-445 C05, Q1 de Hermann du 26/10/2026) :
   * référence ACTIVE, avec clé étrangère RESTRICT (`activities.source_movement_id`,
   * nom historique conservé, D-201). L'occurrence lit son contenu courant dans ce
   * Mouvement : `name`, `instruction`, `categoryId`, `bodyZoneIds`, `media` et
   * la structure des phases de `executionParameters` sont RÉSOLUS à la lecture,
   * jamais stockés dans l'occurrence. Toujours renseigné par le repository ;
   * optionnel sur ce type LU pour les fixtures (convention de transition).
   */
  sourceMovementId?: string;
  /**
   * PRE-7 (R-3, Q3 de Hermann du 26/10/2026) : numéro de copie, attribut propre
   * non éditable de l'occurrence (`activities.copy_number`) — `null`/absent pour
   * l'original, 1 pour « (copie) », n pour « (copie n) », affiché après le nom du
   * Mouvement (`occurrenceDisplayName`), qu'il ne renomme jamais.
   */
  copyNumber?: number | null;
};

/** @deprecated Ancien alias T01-S01 à Activité unique figée — conservé uniquement pour ne pas casser un import externe déjà publié ; `Activity` est désormais le type de référence. */
export type DurationExercise = Activity;

export type Session = {
  id: string;
  ownerId: string;
  name: string;
  /**
   * V2-PRE-1 (plan §3.3) : couleur DÉRIVÉE de l'Étiquette associée
   * (`labelId`) — jamais un champ autonome saisissable. `DEFAULT_SESSION_COLOR`
   * pour une Séance sans Étiquette (présentation neutre).
   */
  color: SessionColor;
  /**
   * V2-PRE-1 (plan §3.3) : Étiquette facultative — `null` si aucune. La
   * relation Catégorie de Séance N:N historique est retirée du contrat
   * cible. Champ OPTIONNEL de transition (même convention que
   * `SessionSummary.labelId`) — un consommateur lit `session.labelId ?? null`.
   */
  labelId?: string | null;
  /** @deprecated V2-PRE-1 : relation Catégorie de Séance N:N retirée du contrat cible (plan §3.3) — conservée uniquement pour la compatibilité structurelle de `CatalogueCompositionEditFlow.integration.test.tsx`/`SessionDraftProvider.test.tsx` (hors périmètre d'écriture, `scope_allow`), qui la construisent encore ; jamais lue par le Domaine ni la persistance. */
  categories?: readonly unknown[];
  status: "ACTIVE";
  initialCountdownSeconds: number;
  finalPhaseSeconds: number;
  /**
   * V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : Points d'arrêt persistés
   * de la Séance, portées confondues — `session_stop_points`, rattachée
   * directement à la Séance (jamais au Cycle/Circuit). Optionnel et absent
   * tant qu'aucun Point d'arrêt n'a été persisté — un consommateur lit
   * `session.stopPoints ?? []` (même convention que `cycle.beforeTour`/
   * `cycle.afterTour`). PRE-6 (story 1.2, AD-36) : `position` est
   * l'emplacement dans la portée (voir `StopPoint`), relu tel qu'enregistré
   * et hydraté dans `SessionDraft.stopPoints` (`toSessionDraft`).
   */
  stopPoints?: readonly StopPoint[];
  /**
   * PRE-8 (A.4, D-449 §4) : structure générale persistée (Exercices, Circuits et Cycles
   * successifs, `structure.ts`), toujours renseignée par le repository. `cycle` et `stopPoints`
   * en sont la projection exacte dans l'ancien modèle à Circuit unique, lue par l'interface
   * actuelle. Champ optionnel de transition pour les fixtures.
   */
  structure?: SessionStructure<Activity>;
  createdAt: string;
  updatedAt: string;
  /**
   * PRE-8 (A.4) : projection de `structure` dans l'ancien modèle. Le Cycle technique n'est plus
   * persisté (`migration014`) : son identifiant est celui de la Séance.
   */
  cycle: {
    id: string;
    position: 1;
    /** Le Cycle technique reste unique et non répété (D-058). */
    repeatCount: 1;
    /**
     * T01-S10 (D-061) : Activités AVANT le Circuit, rattachées au Cycle, dans
     * l'ordre. Optionnel et absent tant que la persistance S10 (étape 2) ne
     * les peuple pas — un consommateur lit `cycle.beforeTour ?? []`.
     */
    beforeTour?: readonly Activity[];
    /** T01-S10 (D-061) : Activités APRÈS le Circuit, rattachées au Cycle, dans l'ordre. Voir `beforeTour`. */
    afterTour?: readonly Activity[];
    tour: {
      id: string;
      position: 1;
      /** T01-S10 : répétition du Circuit, entier `1..99` (D-058). Reste `1` pour toute Séance créée avant S10. */
      repeatCount: number;
      /**
       * PRE-6 (story 1.1, AD-34) : nature du Circuit (`tours.nature`,
       * `migration011`). Champ optionnel de transition (même convention que
       * `beforeTour`) — un consommateur lit `tour.nature ?? DEFAULT_CIRCUIT_NATURE`.
       */
      nature?: CircuitNature;
      /** Collection ORDONNÉE (T01-S09) — remplace l'ancien champ singulier `exercise`. Toujours au moins un élément (une Séance sans aucune Activité reste invalide, voir `toCreateSessionInput`). */
      exercises: readonly Activity[];
    };
  };
};

/**
 * Une Activité d'un agrégat de CRÉATION (T02-S01 — complétion du chemin de
 * création, plan §5.1/§10.3).
 *
 * Jusqu'à T01-S10 inclus, ce DTO ne portait ni type, ni position
 * structurelle, ni identifiant : `SqliteSessionRepository.create()` insérait
 * des littéraux fixes (`'EXERCISE'`, `FIXED_ACTIVITY_STRUCTURAL_POSITION`),
 * de sorte qu'une création comportant une Récupération, une Activité
 * `BEFORE_TOUR`/`AFTER_TOUR` ou un Circuit ≠ `1` perdait silencieusement cette
 * information. Ces trois champs sont donc désormais transportés.
 *
 * `id` reste OPTIONNEL et n'est jamais requis : il permet au brouillon de
 * conserver l'identifiant d'Activité qu'il porte déjà (`SessionDraftExercise
 * .id`, un `Crypto.randomUUID()`), le Repository en générant un lorsqu'il
 * est absent — un appelant qui n'en a pas (test, contrôle d'intégration)
 * reste donc valide sans en inventer un.
 *
 * `position` n'en fait volontairement PAS partie : le rang d'une Activité
 * dans sa zone est DÉRIVÉ de l'ordre de la collection au moment de
 * l'insertion (comme il l'était déjà), jamais une donnée d'entrée à tenir
 * cohérente avec cet ordre — même politique que `mergeActivities`, qui
 * recalcule lui aussi les positions par zone plutôt que de recopier le champ
 * `position` de `UpdateSessionActivityInput`.
 *
 * PRE-4 (story 1.1, AD-3, AD-13) : `executionParameters` est OBLIGATOIRE et
 * seule source du Mode, des Cibles, de N et des Pauses ; aucun champ
 * scalaire n'est transporté. Mêmes règles que `UpdateSessionActivityInput`,
 * une seule implémentation de validation partagée (`validation.ts`).
 */
export type CreateSessionActivityInput = {
  readonly id?: string;
  readonly type: ActivityType;
  readonly structuralPosition: StructuralPosition;
  /** Paramètres typés, validés au niveau structurel (`validateForSave(…, "STORAGE")`). */
  readonly executionParameters: ExecutionParametersInput;
  /** V2-PRE-1 : récupération post-exercice de l'occurrence, `0..5999` s. PRE-6 (AD-35) : `null` = absente, `0` = présente à 0 (voir `Activity.postActivityRecoverySeconds`). */
  readonly postActivityRecoverySeconds: number | null;
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`) — optionnel, `DEFAULT_SIDE_MODE` si absent. */
  readonly sideMode?: SideMode;
  /**
   * PRE-7 (R-3, D-445 C05) : Mouvement de l'occurrence, OBLIGATOIRE pour un
   * Exercice — Mouvement persisté (ajout depuis le Catalogue, reprise, Séance
   * relue) ou Mouvement nouveau du brouillon (`CreateSessionInput.movements`).
   * Aucun contenu n'accompagne l'occurrence : nom, description, médias,
   * Catégorie, Zones et libellés de phases appartiennent au Mouvement ; seules
   * les durées de phase de `executionParameters` sont écrites, par `phaseId`.
   */
  readonly sourceMovementId?: string;
  /** PRE-7 (R-3, Q3) : numéro de copie (voir `Activity.copyNumber`) ; absent/`null` = original. */
  readonly copyNumber?: number | null;
};

/**
 * PRE-7 (R-3, D-445 C05, arbitrage de Hermann du 26/10/2026) : Mouvement créé
 * (`NEW`, création locale en Séance, identifiant pré-alloué) ou corrigé
 * (`EDITED`) depuis le brouillon de Séance, écrit dans la MÊME transaction que
 * la Séance, avant les occurrences qui le référencent. Seule source du contenu
 * à enregistrer : les occurrences n'en portent aucune copie.
 */
export type SessionMovementInput = {
  readonly id: string;
  readonly change: "NEW" | "EDITED";
  readonly name: string;
  readonly description: string | null;
  readonly categoryId: string;
  readonly bodyZoneIds: readonly string[];
  /** Médias ordonnés ; l'ordre du tableau est la position. */
  readonly media: readonly MediaLinkInput[];
  readonly phases: readonly MovementPhase[];
  readonly nextPhaseId: number;
  readonly aliases: readonly string[];
  /**
   * PRE-7 (R-5, D-445 C02, MFN-07 l.371) : variante choisie en Séance — le Mouvement `NEW` rejoint
   * le groupe de niveaux de `movementId`, juste avant (Plus facile) ou juste après (Plus difficile)
   * lui, dans la transaction de la Séance. Absent : aucun rattachement (création indépendante,
   * « Créer un nouveau mouvement », Q10). Ignoré pour un Mouvement `EDITED`.
   */
  readonly levelOrigin?: MovementLevelOrigin;
};

/** PRE-7 (R-5, C02) : origine de niveau d'une variante et sens de son insertion. */
export type MovementLevelOrigin = {
  readonly movementId: string;
  readonly placement: "BEFORE_ORIGIN" | "AFTER_ORIGIN";
};

/** @deprecated Nom historique de `CreateSessionActivityInput` (T01, quand la création ne produisait que des Exercices) — conservé pour ne pas casser un import déjà publié. */
export type CreateSessionExerciseInput = CreateSessionActivityInput;

/**
 * Point d'arrêt à persister (V2-PRE-1, plan §3.3/§7, REQ-001108DC7F67664C).
 *
 * PRE-6 (story 1.2, AD-36) : `position` est l'EMPLACEMENT dans la portée
 * (nombre d'occurrences de cette portée qui le précèdent, `0..n`), donnée
 * d'entrée enregistrée telle quelle — jamais renumérotée d'après l'ordre de
 * la collection. Validée à l'enregistrement (bornes, emplacement autorisé,
 * unicité par `(scope, position)`, `validation.ts`). L'identifiant n'est
 * pas transporté : la modification remplace les points.
 */
export type CreateStopPointInput = {
  readonly scope: StructuralPosition;
  readonly position: number;
};

export type CreateSessionInput = {
  name: string;
  /** V2-PRE-1 (plan §3.3) : Étiquette facultative — `null`/absent si aucune. La couleur autonome historique est retirée du contrat cible. */
  labelId?: string | null;
  initialCountdownSeconds: number;
  finalPhaseSeconds: number;
  /**
   * T02-S01 (D-058) : répétition RÉELLE du Circuit, entier `1..99` — la
   * création figeait jusqu'ici `FIXED_TOUR_REPEAT_COUNT` en base, rendant
   * impossible la création d'une Séance à plusieurs Circuits (AC-08/AC-12).
   */
  tourRepeatCount: number;
  /**
   * PRE-6 (story 1.1, AD-34) : nature du Circuit. Optionnel (convention de
   * transition) : absent = `DEFAULT_CIRCUIT_NATURE` (Tours).
   */
  circuitNature?: CircuitNature;
  /**
   * Collection ORDONNÉE (T01-S09) — remplace l'ancien champ singulier
   * `exercise`. Doit compter au moins un élément : une entrée vide est un
   * échec de validation (`REQUIRED`), jamais un agrégat persistable.
   *
   * Nom historique conservé (T01, création d'Exercices uniquement) : depuis
   * T02-S01 cette collection porte TOUTES les Activités des trois zones
   * structurelles, Récupérations comprises. L'ordre à l'intérieur d'une même
   * zone EST l'ordre persisté ; l'ordre relatif entre zones est sans effet
   * (chaque zone est numérotée séparément — voir `CreateSessionActivityInput`).
   */
  exercises: readonly CreateSessionActivityInput[];
  /** PRE-7 (R-3) : Mouvements nouveaux ou corrigés du brouillon (voir `SessionMovementInput`) ; `[]` par défaut. */
  movements?: readonly SessionMovementInput[];
  /**
   * V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : Points d'arrêt à
   * persister, optionnel — `[]` par défaut. PRE-6 (story 1.2) : alimenté par
   * `SessionDraft.stopPoints` (`toCreateSessionInput`/`toUpdateSessionInput`).
   */
  stopPoints?: readonly CreateStopPointInput[];
};

/**
 * Une Activité d'un agrégat de MODIFICATION bout en bout (T01-S10, Q3-A —
 * type distinct de `CreateSessionExerciseInput`, jamais fusionné avec lui).
 *
 * `id` : identifiant persistant d'une Activité existante à CONSERVER, ou
 * identifiant frais d'une NOUVELLE Activité — le Repository fusionne par
 * identifiant (`FORBIDDEN : régénérer l'identifiant d'une Activité
 * inchangée`, plan §6.4). `position` est un rang 0-indexé DANS la zone
 * structurelle `structuralPosition`.
 *
 * PRE-4 : `executionParameters` obligatoire, aucun champ scalaire (voir
 * `CreateSessionActivityInput`).
 */
export type UpdateSessionActivityInput = {
  readonly id: string;
  readonly type: ActivityType;
  readonly structuralPosition: StructuralPosition;
  readonly position: number;
  /** PRE-4 : paramètres typés obligatoires (voir `CreateSessionActivityInput.executionParameters`). */
  readonly executionParameters: ExecutionParametersInput;
  /** V2-PRE-1 : récupération post-exercice de l'occurrence, `0..5999` s. PRE-6 (AD-35) : `null` = absente, `0` = présente à 0 (voir `Activity.postActivityRecoverySeconds`). */
  readonly postActivityRecoverySeconds: number | null;
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`) — optionnel, `DEFAULT_SIDE_MODE` si absent. */
  readonly sideMode?: SideMode;
  /**
   * PRE-7 (R-3, C05) : Mouvement de l'occurrence, comme
   * `CreateSessionActivityInput.sourceMovementId`. Occurrence existante : la
   * référence persistée est conservée (le remplacement d'occurrence de C04 crée
   * une nouvelle occurrence).
   */
  readonly sourceMovementId?: string;
  /** PRE-7 (R-3, Q3) : numéro de copie, comme `CreateSessionActivityInput.copyNumber`. */
  readonly copyNumber?: number | null;
};

/**
 * Agrégat éditable complet d'une MODIFICATION bout en bout d'une Séance
 * (T01-S10, plan §6.2). Distinct de `CreateSessionInput` : porte
 * l'identifiant source, les identifiants et positions structurelles de
 * TOUTES les Activités (toutes zones confondues) et la répétition du Circuit.
 * `create()` et `CreateSessionInput` restent inchangés (Q3-A).
 */
export type UpdateSessionInput = {
  readonly sourceSessionId: string;
  readonly name: string;
  /** V2-PRE-1 (plan §3.3) : Étiquette facultative — `null`/absent si aucune. */
  readonly labelId?: string | null;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  /** Répétition du Circuit, entier `1..99` (D-058). */
  readonly tourRepeatCount: number;
  /** PRE-6 (story 1.1, AD-34) : nature du Circuit, voir `CreateSessionInput.circuitNature`. */
  readonly circuitNature?: CircuitNature;
  /** TOUTES les Activités de la Séance modifiée, dans l'ordre, toutes zones structurelles confondues — au moins une (une Séance sans Activité reste invalide). */
  readonly activities: readonly UpdateSessionActivityInput[];
  /** PRE-7 (R-3) : voir `CreateSessionInput.movements`. */
  readonly movements?: readonly SessionMovementInput[];
  /** V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : voir `CreateSessionInput.stopPoints`. */
  readonly stopPoints?: readonly CreateStopPointInput[];
  /**
   * PRE-4 story 4.1 (AC13, FR-01-10) : identifiants des Activités déjà
   * persistées à l'ouverture (`SessionDraft.persistedExerciseIds`). Une
   * Activité listée ici et absente de la base à l'enregistrement n'est
   * jamais recréée : la modification échoue (`ACTIVITY_NOT_FOUND`). Les
   * autres identifiants inconnus restent des Activités nouvelles, insérées.
   */
  readonly persistedActivityIds?: readonly string[];
};

export type SessionSummary = {
  id: string;
  name: string;
  /** V2-PRE-1 : couleur DÉRIVÉE de l'Étiquette — `DEFAULT_SESSION_COLOR` sans Étiquette. */
  color: SessionColor;
  /**
   * V2-PRE-1 : Étiquette facultative — `null` si aucune. Champ OPTIONNEL de
   * transition (même convention que `Activity.sideMode`) : `useSessionCatalogue.test.ts`/
   * `CatalogueScreen.test.tsx`/`CatalogueCompositionEditFlow.integration.test.tsx`
   * (hors périmètre d'écriture, `scope_allow`) construisent encore ce type
   * sans ce champ — un consommateur lit `summary.labelId ?? null`.
   */
  labelId?: string | null;
  activityCount: number;
  estimatedDurationSeconds: number;
  /**
   * `true` dès qu'au moins une Activité de la Composition est en mode
   * `REPETITIONS` (T01-S09) : `estimatedDurationSeconds` devient alors une
   * borne minimale plutôt qu'une durée exacte (même règle que
   * `formatCompositionSummary`, supprimé par PRE-6 story 7.8, RM-072) — à la charge de la présentation
   * d'en tirer un préfixe `≥` plutôt que de le coder ici.
   */
  isEstimatedDurationApproximate: boolean;
  /**
   * PRE-3 (Bip v2 §2) : nature du total calculé par l'autorité unique du
   * Domaine — `exact`, `estimated` (≈) ou `lowerBound` (≥). Optionnel
   * sur ce type LU (fixtures hors périmètre) : absent, le consommateur
   * retombe sur `isEstimatedDurationApproximate`.
   */
  durationKind?: SessionDurationKind;
  /** T01-S10 : répétition réelle du Circuit (`1..99`, D-058). Reste `1` pour toute Séance créée avant S10. */
  tourRepeatCount: number;
  updatedAt: string;
  /**
   * V2-PRE-1 (plan §3.3) : la relation historique Catégorie de Séance N:N
   * est retirée du contrat cible — ce champ reste néanmoins présent, TOUJOURS
   * vide, pour la compatibilité de `SessionCard.tsx` (hors périmètre
   * d'écriture de cette invocation, `scope_allow`), qui le consomme encore.
   * Écart disclosé dans le rapport de mission.
   */
  categoryNames: readonly string[];
  /**
   * Noms des Zones corporelles couvertes par la Séance (T01-S09) — union
   * SANS PERTE de `bodyZoneIds` de TOUTES les Activités persistées de la
   * Séance (jamais une seule Activité), dédupliquée et ordonnée selon le
   * référentiel (`@/features/reference-data/bodyZones.ts`, `order`
   * croissant) — jamais l'ordre d'insertion en base.
   */
  bodyZoneNames: readonly string[];
};
