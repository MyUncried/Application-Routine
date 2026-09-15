import type { SideMode } from "./sideMode";

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

export const DEFAULT_SESSION_COLOR = "#3B82F6" as const;

export type SessionColor = (typeof SESSION_COLORS)[number];

/**
 * Type d'une Activité.
 *
 * **T02-S02 — la Récupération n'est plus un type d'Activité.** Elle devient
 * une DURÉE FACULTATIVE ATTACHÉE à une Activité (`Activity.recoverySeconds`,
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
 * lignes `RECOVERY` en `recovery_seconds` sur l'Activité qui les précède
 * puis les supprime : après migration, aucune ligne `RECOVERY` ne subsiste.
 * Le chemin de LECTURE reste néanmoins défensif (assemblage, calculs) plutôt
 * que de lever sur une donnée ancienne inattendue.
 */
export type ActivityType = "EXERCISE" | "RECOVERY";

/**
 * Position structurelle d'une Activité (T01-S10, D-061) : avant le Tour,
 * dans le Tour, ou après le Tour. Le schéma SQLite portait déjà les trois
 * valeurs. Les Activités hors Tour sont rattachées au Cycle, celles
 * `IN_TOUR` au Tour.
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
 * Activité persistée (T01-S09, complétion REWORK12 ; T01-S10 : Récupération,
 * positions structurelles et mode `TO_FAILURE`).
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
   * **T02-S02 — Récupération ATTACHÉE** (RM-129/DM-015, `06` §« Dépendance
   * Séries / Durée totale ») : durée facultative, en secondes, exécutée UNE
   * SEULE FOIS APRÈS TOUTES les Séries de cette Activité. `0` = aucune
   * Récupération (valeur neutre par défaut, jamais `null`).
   *
   * Elle contribue à la durée de l'Activité mais ne compte JAMAIS comme une
   * Activité supplémentaire (`computeActivityCount` reste inchangé).
   */
  recoverySeconds: number;
  instruction: string | null;
  /** Identifiants stables du référentiel `bodyZones.ts` (D-093) — sélection multiple, ordre indifférent ; toujours vide pour une Récupération. */
  bodyZoneIds: readonly string[];
  /**
   * V2-BILAT-01 : direction PROPRE de cette occurrence d'Activité
   * (`UNILATERAL`/`RIGHT_LEFT`/`LEFT_RIGHT`, `sideMode.ts`). Champ optionnel
   * de transition (même convention que `cycle.beforeTour`/`afterTour`,
   * T01-S10) — un consommateur lit `activity.sideMode ?? DEFAULT_SIDE_MODE`.
   * Sa direction EFFECTIVE, dans le Tour, dépend en outre de
   * `Session.cycle.tour.sideMode` (`resolveEffectiveSideMode`) — la
   * direction du Tour prévaut lorsqu'elle est bilatérale ; hors du Tour,
   * cette valeur propre gouverne seule.
   */
  sideMode?: SideMode;
};

/** @deprecated Ancien alias T01-S01 à Activité unique figée — conservé uniquement pour ne pas casser un import externe déjà publié ; `Activity` est désormais le type de référence. */
export type DurationExercise = Activity;

/**
 * Catégorie de Séance (T01-S09, D-106/D-107). Prédéfinie (`isPredefined:
 * true`, `displayOrder` fixé par le référentiel MVP) ou personnalisée
 * (`isPredefined: false`, `displayOrder: null`, ordonnée par `createdAt`
 * croissant). `canonicalKey` est la clé de comparaison/unicité (espaces
 * normalisés + casse + diacritiques ignorés) — jamais affichée telle quelle,
 * `name` reste le libellé visible réellement saisi/normalisé (espaces
 * uniquement, casse et accents conservés).
 */
export type Category = {
  readonly id: string;
  readonly name: string;
  readonly canonicalKey: string;
  readonly isPredefined: boolean;
  readonly displayOrder: number | null;
  readonly createdAt: string;
};

export type Session = {
  id: string;
  ownerId: string;
  name: string;
  color: SessionColor;
  status: "ACTIVE";
  initialCountdownSeconds: number;
  finalPhaseSeconds: number;
  createdAt: string;
  updatedAt: string;
  cycle: {
    id: string;
    position: 1;
    /** Le Cycle technique reste unique et non répété (D-058). */
    repeatCount: 1;
    /**
     * T01-S10 (D-061) : Activités AVANT le Tour, rattachées au Cycle, dans
     * l'ordre. Optionnel et absent tant que la persistance S10 (étape 2) ne
     * les peuple pas — un consommateur lit `cycle.beforeTour ?? []`.
     */
    beforeTour?: readonly Activity[];
    /** T01-S10 (D-061) : Activités APRÈS le Tour, rattachées au Cycle, dans l'ordre. Voir `beforeTour`. */
    afterTour?: readonly Activity[];
    tour: {
      id: string;
      position: 1;
      /** T01-S10 : répétition du Tour, entier `1..99` (D-058). Reste `1` pour toute Séance créée avant S10. */
      repeatCount: number;
      /**
       * V2-BILAT-01 : direction du Tour lui-même. Champ optionnel de
       * transition (même convention que `cycle.beforeTour`/`afterTour`,
       * T01-S10) : un consommateur lit `tour.sideMode ?? DEFAULT_TOUR_SIDE_MODE`.
       * Bilatérale (`RIGHT_LEFT`/`LEFT_RIGHT`), elle prévaut sur la direction
       * PROPRE de chaque Activité `IN_TOUR` (`resolveEffectiveSideMode`) —
       * ses enfants sont alors tous `UNILATERAL`
       * (`applyTourSideModeTransition`).
       */
      sideMode?: SideMode;
      /** Collection ORDONNÉE (T01-S09) — remplace l'ancien champ singulier `exercise`. Toujours au moins un élément (une Séance sans aucune Activité reste invalide, voir `toCreateSessionInput`). */
      exercises: readonly Activity[];
    };
  };
  /** Zéro, une ou plusieurs Catégories (D-106) — jamais un tri propre à la Séance : l'ordre restitué suit toujours celui du référentiel (D-107). */
  categories: readonly Category[];
};

/**
 * Une Activité d'un agrégat de CRÉATION (T02-S01 — complétion du chemin de
 * création, plan §5.1/§10.3).
 *
 * Jusqu'à T01-S10 inclus, ce DTO ne portait ni type, ni position
 * structurelle, ni identifiant : `SqliteSessionRepository.create()` insérait
 * des littéraux fixes (`'EXERCISE'`, `FIXED_ACTIVITY_STRUCTURAL_POSITION`),
 * de sorte qu'une création comportant une Récupération, une Activité
 * `BEFORE_TOUR`/`AFTER_TOUR` ou un Tour ≠ `1` perdait silencieusement cette
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
  /** T02-S02 : Récupération attachée, `0..5999` s — `0` = aucune (voir `Activity.recoverySeconds`). */
  readonly recoverySeconds: number;
  readonly instruction?: string | null;
  readonly bodyZoneIds: readonly string[];
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`) — optionnel, `DEFAULT_SIDE_MODE` si absent. */
  readonly sideMode?: SideMode;
};

/** @deprecated Nom historique de `CreateSessionActivityInput` (T01, quand la création ne produisait que des Exercices) — conservé pour ne pas casser un import déjà publié. */
export type CreateSessionExerciseInput = CreateSessionActivityInput;

/**
 * Catégorie à associer lors de l'enregistrement final (T01-S09, D-107) :
 * soit une Catégorie déjà persistée (prédéfinie ou créée lors d'une Séance
 * précédente), soit une Catégorie personnalisée à créer — sa création ne
 * devient effective que dans la transaction atomique d'enregistrement de la
 * Séance, jamais isolément avant elle.
 */
export type CreateSessionCategoryInput =
  | { readonly kind: "EXISTING"; readonly categoryId: string }
  | { readonly kind: "NEW"; readonly name: string };

export type CreateSessionInput = {
  name: string;
  color: SessionColor;
  initialCountdownSeconds: number;
  finalPhaseSeconds: number;
  /**
   * T02-S01 (D-058) : répétition RÉELLE du Tour, entier `1..99` — la
   * création figeait jusqu'ici `FIXED_TOUR_REPEAT_COUNT` en base, rendant
   * impossible la création d'une Séance à plusieurs Tours (AC-08/AC-12).
   */
  tourRepeatCount: number;
  /** V2-BILAT-01 : direction du Tour (`Session.cycle.tour.sideMode`) — optionnel, `DEFAULT_TOUR_SIDE_MODE` si absent. */
  tourSideMode?: SideMode;
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
  /** Zéro, une ou plusieurs entrées — jamais requis (D-106). */
  categories: readonly CreateSessionCategoryInput[];
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
  /** T02-S02 : Récupération attachée, `0..5999` s — `0` = aucune (voir `Activity.recoverySeconds`). */
  readonly recoverySeconds: number;
  readonly instruction?: string | null;
  readonly bodyZoneIds: readonly string[];
  /** V2-BILAT-01 : direction propre de cette Activité (`Activity.sideMode`) — optionnel, `DEFAULT_SIDE_MODE` si absent. */
  readonly sideMode?: SideMode;
};

/**
 * Agrégat éditable complet d'une MODIFICATION bout en bout d'une Séance
 * (T01-S10, plan §6.2). Distinct de `CreateSessionInput` : porte
 * l'identifiant source, les identifiants et positions structurelles de
 * TOUTES les Activités (toutes zones confondues) et la répétition du Tour.
 * `create()` et `CreateSessionInput` restent inchangés (Q3-A).
 */
export type UpdateSessionInput = {
  readonly sourceSessionId: string;
  readonly name: string;
  readonly color: SessionColor;
  readonly initialCountdownSeconds: number;
  readonly finalPhaseSeconds: number;
  /** Répétition du Tour, entier `1..99` (D-058). */
  readonly tourRepeatCount: number;
  /** V2-BILAT-01 : direction du Tour (`Session.cycle.tour.sideMode`) — optionnel, `DEFAULT_TOUR_SIDE_MODE` si absent. */
  readonly tourSideMode?: SideMode;
  /** TOUTES les Activités de la Séance modifiée, dans l'ordre, toutes zones structurelles confondues — au moins une (une Séance sans Activité reste invalide). */
  readonly activities: readonly UpdateSessionActivityInput[];
  /** Zéro, une ou plusieurs entrées — jamais requis (D-106). */
  readonly categories: readonly CreateSessionCategoryInput[];
};

export type SessionSummary = {
  id: string;
  name: string;
  color: SessionColor;
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
  /** T01-S10 : répétition réelle du Tour (`1..99`, D-058). Reste `1` pour toute Séance créée avant S10. */
  tourRepeatCount: number;
  updatedAt: string;
  /**
   * Noms des Catégories associées (T01-S09, correction VISUAL — ligne
   * manquante sous le nom de la Séance) — déjà ordonnés par le Repository
   * (prédéfinies par `displayOrder`, puis personnalisées par `createdAt`,
   * D-107). Tableau vide si aucune Catégorie n'est associée — jamais
   * `null`, pour rester composable simplement avec `bodyZoneNames` par la
   * présentation.
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
