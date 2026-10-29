/**
 * PRE-9 (C.1, ARB-03, ARB-04, ARB-25) — registre déclaratif des Formats.
 *
 * Un Format est porté par un élément de la Séance (ARB-03) : un Exercice, lorsqu'un Circuit n'est
 * pas nécessaire, ou un Circuit, lorsque son organisation le nécessite. Une Séance peut contenir
 * plusieurs éléments formatés, directement ou dans un Cycle ; un élément sans Format est libre
 * (FMT-40). Six Formats contraignants existent (FMT-01) ; les départs rapides et les deux cartes
 * « Libre » ne portent aucun Format et ne classent que l'origine de la Séance (FMT-02, FMT-28,
 * ARB-05).
 *
 * Chaque descripteur est une donnée : paramètres (verrouillage, unité, borne structurelle,
 * constante, défaut), porteurs admis et organisations du Circuit porteur. Seules les constantes
 * écrites par les règles y figurent (Tabata FMT-10, Intervalles 30/30 FMT-19). Les valeurs
 * initiales des paramètres réglables ne sont pas définies (ARB-04, ouvert) : aucun défaut n'est
 * inventé ; un Format dont un réglable n'a pas de défaut reste indisponible
 * (`formatDefaultsComplete`). Les bornes ne sont que structurelles (entier, minimum) ; les règles
 * de configuration propres à chaque Format relèvent de C.3, la compatibilité des déplacements de
 * C.4 (ARB-24).
 *
 * Aucun compteur de répétition de l'ensemble : la répétition intégrale d'un élément formaté passe
 * par un Cycle (ARB-25). Le compte d'un Circuit formaté n'exprime que l'organisation de ses
 * séries ; il n'est sourcé que pour Tabata (FMT-12/13) — les autres Formats le confirment en C.3.
 *
 * Fonctions pures, sans React ni SQLite.
 */

import type { CircuitNature } from "../circuit";

/** Formats contraignants (FMT-01), dans l'ordre de la grille Figma `4168:11149`. */
export const ELEMENT_FORMAT_KEYS = ["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"] as const;

export type ElementFormatKey = (typeof ELEMENT_FORMAT_KEYS)[number];

/** Départs rapides : préremplissage d'une Séance libre, sans verrouillage (FMT-28). */
export const QUICK_START_KEYS = ["STRENGTH", "CORE_MOBILITY", "SUPERSET", "PROGRESSION", "UNTIL_FAILURE"] as const;

export type QuickStartKey = (typeof QUICK_START_KEYS)[number];

/**
 * Origine de création d'une Séance (FMT-02) : entrée de la grille de création (CE-FMT-01) — carte
 * Exercice ou carte Séance « Libre » (ARB-05), Format, départ rapide. Classe la provenance sans
 * imposer de comportement. Absente (`null`) pour une Séance antérieure ou créée hors de la grille.
 */
export const SESSION_ORIGINS = ["EXERCISE_CARD", "SESSION_CARD", ...ELEMENT_FORMAT_KEYS, ...QUICK_START_KEYS] as const;

export type SessionOrigin = (typeof SESSION_ORIGINS)[number];

/**
 * Verrouillage d'un paramètre (`architecture-pre9.md` §5) : constante imposée par la règle,
 * réglage de l'élément, ou valeur calculée (jamais un second réglage, FMT-05).
 */
export type FormatParameterLock = "LOCKED" | "ADJUSTABLE" | "CALCULATED";

/** Unité nommée par le paramètre (FMT-08 : une échelle reste indexée sur cette unité). */
export type FormatParameterUnit = "SECONDS" | "SERIES" | "ROUNDS" | "REPETITIONS";

export type FormatParameter = {
  readonly id: string;
  readonly lock: FormatParameterLock;
  readonly unit: FormatParameterUnit;
  /** Liste ordonnée de valeurs (échelle), indexée par `indexedBy`. */
  readonly list?: { readonly indexedBy: "ROUND" };
  /** Borne structurelle : entier supérieur ou égal à `min` (chaque valeur d'une liste). */
  readonly min?: number;
  /** Constante imposée (`LOCKED` seulement). */
  readonly value?: number;
  /** Valeur initiale d'un réglable, fournie par décision (ARB-04) ; absente aujourd'hui. */
  readonly default?: number | readonly number[];
  /** Règles qui définissent le paramètre. */
  readonly sources: readonly string[];
};

/**
 * Porteurs admis. `CIRCUIT: "RESERVED"` : Format à plusieurs Exercices réservé par une règle
 * (Death by, R-03). `natures` : organisations du Circuit porteur (groupées = `TOURS`, alternées =
 * `SERIES`, ch10 l.1034) ; `countByNature` : compte du Circuit gouverné par le Format, lorsqu'il
 * est sourcé.
 */
export type FormatCarriers = {
  readonly EXERCISE: "ALLOWED";
  readonly CIRCUIT:
    | {
        readonly status: "ALLOWED";
        readonly natures: readonly CircuitNature[];
        readonly countByNature?: Partial<Readonly<Record<CircuitNature, number>>>;
      }
    | { readonly status: "RESERVED"; readonly sources: readonly string[] };
};

export type FormatDescriptor = {
  readonly key: ElementFormatKey;
  readonly parameters: readonly FormatParameter[];
  readonly carriers: FormatCarriers;
};

const BOTH_NATURES: readonly CircuitNature[] = ["TOURS", "SERIES"];

export const FORMAT_REGISTRY: Readonly<Record<ElementFormatKey, FormatDescriptor>> = {
  TABATA: {
    key: "TABATA",
    parameters: [
      { id: "seriesPerExercise", lock: "LOCKED", unit: "SERIES", value: 8, sources: ["FMT-10", "FMT-14", "FMT-17"] },
      { id: "workSeconds", lock: "LOCKED", unit: "SECONDS", value: 20, sources: ["FMT-10", "FMT-17"] },
      { id: "pauseSeconds", lock: "LOCKED", unit: "SECONDS", value: 10, sources: ["FMT-10", "FMT-17", "FMT-18"] },
    ],
    carriers: {
      EXERCISE: "ALLOWED",
      // Par exercice : séries groupées, Circuit d'un tour ; En alternance : séries alternées, huit séries (FMT-12/13, ARB-25).
      CIRCUIT: { status: "ALLOWED", natures: BOTH_NATURES, countByNature: { TOURS: 1, SERIES: 8 } },
    },
  },
  INTERVALS_30_30: {
    key: "INTERVALS_30_30",
    parameters: [
      { id: "workSeconds", lock: "LOCKED", unit: "SECONDS", value: 30, sources: ["FMT-19"] },
      { id: "pauseSeconds", lock: "LOCKED", unit: "SECONDS", value: 30, sources: ["FMT-19"] },
      // Borne réglée : un compte, jamais une durée (FMT-19, FMT-27) ; commun au Circuit (ARB-18a).
      { id: "seriesCount", lock: "ADJUSTABLE", unit: "SERIES", min: 1, sources: ["FMT-19", "FMT-27", "ARB-18a"] },
    ],
    carriers: { EXERCISE: "ALLOWED", CIRCUIT: { status: "ALLOWED", natures: BOTH_NATURES } },
  },
  EMOM: {
    key: "EMOM",
    parameters: [
      { id: "windowSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 1, sources: ["FMT-20", "FMT-23"] },
      { id: "roundCount", lock: "ADJUSTABLE", unit: "ROUNDS", min: 1, sources: ["FMT-20", "FMT-27"] },
      // N × E × W, calculée et jamais saisie (FMT-21).
      { id: "totalSeconds", lock: "CALCULATED", unit: "SECONDS", sources: ["FMT-21", "FMT-22"] },
    ],
    // Organisation « Par exercice » ou « En alternance » (FMT-20).
    carriers: { EXERCISE: "ALLOWED", CIRCUIT: { status: "ALLOWED", natures: BOTH_NATURES } },
  },
  AMRAP: {
    key: "AMRAP",
    // Durée imposée réglable ; le nombre de tours réalisés est un résultat (FMT-26).
    parameters: [{ id: "durationSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 1, sources: ["FMT-26"] }],
    carriers: { EXERCISE: "ALLOWED", CIRCUIT: { status: "ALLOWED", natures: ["TOURS"] } },
  },
  FOR_TIME: {
    key: "FOR_TIME",
    parameters: [
      // « Volume par tour », indexé par tour (FMT-08, FMT-30) ; zéro admis dans l'échelle, volume total non nul (ARB-18b).
      {
        id: "volumePerRound",
        lock: "ADJUSTABLE",
        unit: "REPETITIONS",
        list: { indexedBy: "ROUND" },
        min: 0,
        sources: ["FMT-30", "FMT-31", "FMT-32", "ARB-18b"],
      },
    ],
    // Aucun sélecteur « Par exercice / En alternance » (FMT-31).
    carriers: { EXERCISE: "ALLOWED", CIRCUIT: { status: "ALLOWED", natures: ["TOURS"] } },
  },
  DEATH_BY: {
    key: "DEATH_BY",
    // Objectif calculé depuis le rang, le départ et l'incrément (FMT-33) ; la fenêtre en est la cadence.
    parameters: [
      { id: "startRepetitions", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 0, sources: ["FMT-33"] },
      { id: "incrementRepetitions", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 0, sources: ["FMT-33"] },
      { id: "windowSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 1, sources: ["FMT-33"] },
    ],
    carriers: { EXERCISE: "ALLOWED", CIRCUIT: { status: "RESERVED", sources: ["R-03"] } },
  },
};

export function isElementFormatKey(value: unknown): value is ElementFormatKey {
  return typeof value === "string" && (ELEMENT_FORMAT_KEYS as readonly string[]).includes(value);
}

export function isSessionOrigin(value: unknown): value is SessionOrigin {
  return typeof value === "string" && (SESSION_ORIGINS as readonly string[]).includes(value);
}

export function formatDescriptorOf(key: ElementFormatKey): FormatDescriptor {
  return FORMAT_REGISTRY[key];
}

/**
 * Vrai lorsque chaque paramètre réglable du Format a une valeur initiale (ARB-04). Condition de
 * mise à disposition dans la grille (C.2) : sans défauts, le Format reste indisponible.
 */
export function formatDefaultsComplete(key: ElementFormatKey): boolean {
  return FORMAT_REGISTRY[key].parameters.every((parameter) => parameter.lock !== "ADJUSTABLE" || parameter.default !== undefined);
}
