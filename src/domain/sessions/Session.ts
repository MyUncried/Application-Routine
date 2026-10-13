import type { ExecutionParameters, ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import type { SessionDurationKind } from "@/domain/activities/executionCalculations";
import type { MediaLinkInput, SessionActivityMediaWithAsset } from "@/domain/media/ActivityMedia";

import type { SideMode } from "./sideMode";
import type { StopPoint } from "./StopPoint";

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
 * Mode d'exécution d'un Exercice (T01-S10, D-111/RM-034) : une durée cible,
 * un nombre de répétitions cible, ou « à l'échec » (aucune cible). `TO_FAILURE`
 * partage l'exécution et le résultat de `REPETITIONS` (D-111) ; sa durée
 * n'entre dans aucun calcul comme valeur exacte (borne minimale `≥`, D-112).
 */
export type ExerciseExecutionMode = "DURATION" | "REPETITIONS" | "TO_FAILURE";

/**
 * Activité persistée — une OCCURRENCE d'Exercice dans une Séance (T01-S09,
 * complétion REWORK12 ; T01-S10 : Récupération, positions structurelles et
 * mode `TO_FAILURE` ; V2-PRE-1 : `postActivityRecoverySeconds` obligatoire,
 * indépendant de la définition source, plan §3.2).
 *
 * Un Exercice porte : soit une durée, soit un nombre de répétitions, soit
 * aucune cible (`TO_FAILURE`) — jamais deux à la fois (RM-034) — un nombre
 * de Séries et une pause après Série propres (D-092/RM-035/RM-037), une
 * Consigne optionnelle et une sélection de Zones corporelles (D-093).
 *
 * Une Récupération (`type === "RECOVERY"`, T01-S10, D-041) est toujours
 * chronométrée : `executionMode` et `seriesCount` valent `null`,
 * `durationSeconds` est renseigné, `repetitionCount` vaut `null`,
 * `pauseSeconds` vaut `0` et `bodyZoneIds` est vide.
 *
 * Historique : `Session.cycle.tour.exercises` reste la collection ordonnée
 * des Activités `IN_TOUR` (T01-S09). Les Activités `BEFORE_TOUR`/`AFTER_TOUR`
 * sont exposées par les champs `Session.cycle.beforeTour`/`afterTour`
 * (T01-S10). `position` est un rang 0-indexé DANS la zone structurelle.
 */
export type Activity = {
  id: string;
  type: ActivityType;
  /** `null` uniquement pour une Récupération (T01-S10). */
  executionMode: ExerciseExecutionMode | null;
  structuralPosition: StructuralPosition;
  /** Rang 0-indexé de l'Activité dans sa zone structurelle — ordre d'exécution ET d'affichage. */
  position: number;
  name: string;
  /** Non nul en mode `DURATION` et pour toute Récupération ; nul sinon (RM-034). */
  durationSeconds: number | null;
  /** Non nul uniquement en mode `REPETITIONS` (RM-034). */
  repetitionCount: number | null;
  /** `null` uniquement pour une Récupération (T01-S10) ; entier ≥ 1 sinon. */
  seriesCount: number | null;
  pauseSeconds: number;
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
   */
  postActivityRecoverySeconds?: number;
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
  /**
   * PRE-3 : paramètres canoniques de l'OCCURRENCE (JSON persisté). Absent
   * pour une occurrence antérieure à PRE-3 : le consommateur applique
   * l'adaptateur conservateur (`resolveActivityExecutionParameters`), jamais
   * le Profil courant. Optionnel sur ce type LU (fixtures hors périmètre).
   */
  executionParameters?: ExecutionParameters;
  /** PRE-3 : Catégorie transportée par la copie (`null` pour une ancienne copie sans Catégorie). */
  categoryId?: string | null;
  /** PRE-3 : médias ordonnés de l'occurrence (liens propres, fichiers partagés). */
  media?: readonly SessionActivityMediaWithAsset[];
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
   * de la Séance, portée (`StopPointScope` = `StructuralPosition`) et ordre
   * confondus — `session_stop_points`, rattachée directement à la Séance
   * (jamais au Cycle/Circuit). Optionnel et absent tant qu'aucun Point
   * d'arrêt n'a été persisté — un consommateur lit `session.stopPoints ?? []`
   * (même convention que `cycle.beforeTour`/`cycle.afterTour`). Aucun écran
   * ne les crée encore dans cette tranche (plumbing de persistance
   * uniquement, même portée que `ActivityMedia`).
   */
  stopPoints?: readonly StopPoint[];
  createdAt: string;
  updatedAt: string;
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
 * Récupération (`type === "RECOVERY"`, D-041) : `executionMode` et
 * `seriesCount` valent `null`, `durationSeconds` est renseigné,
 * `repetitionCount` vaut `null`, `pauseSeconds` vaut `0`, `bodyZoneIds` est
 * vide — mêmes règles que `UpdateSessionActivityInput`, une seule
 * implémentation de validation partagée (`validation.ts`).
 */
export type CreateSessionActivityInput = {
  readonly id?: string;
  readonly type: ActivityType;
  readonly structuralPosition: StructuralPosition;
  readonly name: string;
  /**
   * T01-S10 : `TO_FAILURE` accepté en plus de `DURATION`/`REPETITIONS`.
   * T02-S01 : `null` pour une Récupération (D-041).
   */
  readonly executionMode: ExerciseExecutionMode | null;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  /** `null` uniquement pour une Récupération (D-041) ; entier `1..99` sinon. */
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  /** V2-PRE-1 : récupération post-exercice de l'occurrence, `0..5999` s — `0` = aucune (voir `Activity.postActivityRecoverySeconds`). */
  readonly postActivityRecoverySeconds: number;
  readonly instruction?: string | null;
  readonly bodyZoneIds: readonly string[];
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`) — optionnel, `DEFAULT_SIDE_MODE` si absent. */
  readonly sideMode?: SideMode;
  /** PRE-3 : paramètres canoniques — autorité, scalaires projetés par la validation. */
  readonly executionParameters?: ExecutionParametersInput;
  /** PRE-3 : Catégorie de la copie (`null` = aucune). */
  readonly categoryId?: string | null;
  /** PRE-3 : médias ordonnés ; l'ordre du tableau est la position. */
  readonly media?: readonly MediaLinkInput[];
};

/** @deprecated Nom historique de `CreateSessionActivityInput` (T01, quand la création ne produisait que des Exercices) — conservé pour ne pas casser un import déjà publié. */
export type CreateSessionExerciseInput = CreateSessionActivityInput;

/**
 * Point d'arrêt à persister (V2-PRE-1, plan §3.3/§7, REQ-001108DC7F67664C) —
 * `order` n'en fait volontairement PAS partie : le rang DANS sa portée est
 * DÉRIVÉ de l'ordre de la collection fournie, même politique que
 * `CreateSessionActivityInput.position` et `CreateActivityMediaInput`
 * (position stable de média).
 */
export type CreateStopPointInput = {
  readonly scope: StructuralPosition;
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
  /**
   * V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : Points d'arrêt à
   * persister, optionnel — `[]` par défaut : aucun écran n'alimente encore ce
   * champ (plumbing de persistance uniquement, même portée que
   * `CreateActivityDefinitionInput.media`).
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
 * Récupération (`type === "RECOVERY"`) : `executionMode` et `seriesCount`
 * valent `null`, `durationSeconds` est renseigné, `repetitionCount` vaut
 * `null`, `pauseSeconds` vaut `0`, `bodyZoneIds` est vide (D-041).
 */
export type UpdateSessionActivityInput = {
  readonly id: string;
  readonly type: ActivityType;
  readonly structuralPosition: StructuralPosition;
  readonly position: number;
  readonly name: string;
  readonly executionMode: ExerciseExecutionMode | null;
  readonly durationSeconds: number | null;
  readonly repetitionCount: number | null;
  readonly seriesCount: number | null;
  readonly pauseSeconds: number;
  /** V2-PRE-1 : récupération post-exercice de l'occurrence, `0..5999` s — `0` = aucune (voir `Activity.postActivityRecoverySeconds`). */
  readonly postActivityRecoverySeconds: number;
  readonly instruction?: string | null;
  readonly bodyZoneIds: readonly string[];
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`) — optionnel, `DEFAULT_SIDE_MODE` si absent. */
  readonly sideMode?: SideMode;
  /** PRE-3 : voir `CreateSessionActivityInput.executionParameters`. */
  readonly executionParameters?: ExecutionParametersInput;
  /** PRE-3 : `undefined` conserve la Catégorie persistée d'une occurrence existante. */
  readonly categoryId?: string | null;
  /** PRE-3 : `undefined` conserve les liens persistés ; `[]` explicite les retire (jamais l'asset). */
  readonly media?: readonly MediaLinkInput[];
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
  /** TOUTES les Activités de la Séance modifiée, dans l'ordre, toutes zones structurelles confondues — au moins une (une Séance sans Activité reste invalide). */
  readonly activities: readonly UpdateSessionActivityInput[];
  /** V2-PRE-1 (plan §3.3/§7, REQ-001108DC7F67664C) : voir `CreateSessionInput.stopPoints`. */
  readonly stopPoints?: readonly CreateStopPointInput[];
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
   * `formatCompositionSummary`, RM-072) — à la charge de la présentation
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
