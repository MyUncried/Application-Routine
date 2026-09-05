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
 * Activité persistée d'un Exercice (T01-S09, complétion REWORK12) : soit une
 * durée, soit un nombre de répétitions — jamais les deux (RM-034) — un
 * nombre de Séries et une pause après Série propres (D-092/RM-035/RM-037),
 * une Consigne optionnelle et une sélection de Zones corporelles (D-093).
 * Remplace `DurationExercise`, qui figeait `executionMode`/`seriesCount`/
 * `pauseSeconds` aux valeurs uniques du contrat T01-S01 : une Séance peut
 * désormais porter PLUSIEURS Activités de ce type, ordonnées par
 * `position` dans le Tour (`Session.cycle.tour.exercises`).
 */
export type Activity = {
  id: string;
  type: "EXERCISE";
  executionMode: "DURATION" | "REPETITIONS";
  structuralPosition: "IN_TOUR";
  /** Rang 0-indexé de l'Activité dans le Tour — ordre d'exécution ET d'affichage, identique à `SessionDraft.exercises`. */
  position: number;
  name: string;
  /** Non nul uniquement en mode `DURATION` (RM-034). */
  durationSeconds: number | null;
  /** Non nul uniquement en mode `REPETITIONS` (RM-034). */
  repetitionCount: number | null;
  seriesCount: number;
  pauseSeconds: number;
  instruction: string | null;
  /** Identifiants stables du référentiel `bodyZones.ts` (D-093) — sélection multiple, ordre indifférent. */
  bodyZoneIds: readonly string[];
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
    repeatCount: 1;
    tour: {
      id: string;
      position: 1;
      repeatCount: 1;
      /** Collection ORDONNÉE (T01-S09) — remplace l'ancien champ singulier `exercise`. Toujours au moins un élément (une Séance sans aucune Activité reste invalide, voir `toCreateSessionInput`). */
      exercises: readonly Activity[];
    };
  };
  /** Zéro, une ou plusieurs Catégories (D-106) — jamais un tri propre à la Séance : l'ordre restitué suit toujours celui du référentiel (D-107). */
  categories: readonly Category[];
};

export type CreateSessionExerciseInput = {
  name: string;
  executionMode: "DURATION" | "REPETITIONS";
  durationSeconds: number | null;
  repetitionCount: number | null;
  seriesCount: number;
  pauseSeconds: number;
  instruction?: string | null;
  bodyZoneIds: readonly string[];
};

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
  /** Collection ORDONNÉE (T01-S09) — remplace l'ancien champ singulier `exercise`. Doit compter au moins un élément : une entrée vide est un échec de validation (`REQUIRED`), jamais un agrégat persistable. */
  exercises: readonly CreateSessionExerciseInput[];
  /** Zéro, une ou plusieurs entrées — jamais requis (D-106). */
  categories: readonly CreateSessionCategoryInput[];
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
  tourRepeatCount: 1;
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
