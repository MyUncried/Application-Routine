/**
 * PRE-9 (C.1, ARB-03, ARB-04, ARB-25 ; correction du 30/10, D-02, D-05) — registre déclaratif des
 * Formats.
 *
 * Le Format et ses réglages appartiennent à l'**Exercice**, jamais au Circuit (D-02 ; décision de
 * Hermann du 30/10 : « l'Exercice est le seul porteur du Format ; le Circuit porte son organisation
 * et son nombre de tours »). Une Séance peut contenir plusieurs Exercices formatés, directement,
 * dans un Circuit ou dans un Cycle (D-01) ; un Exercice sans Format est libre (FMT-40). Six Formats
 * contraignants existent (FMT-01) ; les départs rapides et les deux cartes « Libre » ne portent
 * aucun Format et ne classent que l'origine de la Séance (FMT-02, FMT-28, ARB-05).
 *
 * Chaque descripteur est une donnée : paramètres (verrouillage, unité, borne structurelle,
 * constante, défaut) et compatibilité de l'Exercice formaté avec l'organisation du Circuit qui le
 * contient (`inCircuit`, matrice §2.2 des Arbitrages consolidés du 30/10, D-14 à D-17, D-30). Seules
 * les constantes écrites par les règles y figurent (Tabata FMT-10, Intervalles 30/30 FMT-19). Les
 * valeurs initiales des paramètres réglables ne sont pas définies dans ce registre (ARB-04) : aucun
 * défaut n'est inventé ; un Format dont un réglable n'a pas de défaut reste indisponible
 * (`formatDefaultsComplete`). Les bornes ne sont que structurelles (entier, minimum) ; les règles
 * de configuration propres à chaque Format relèvent de C.3, les gestes de dépose de C.4.
 *
 * Compatibilité avec le Circuit : `ADMITTED` (éventuellement sous un compte exigé), `REFUSED`
 * (règle documentée), ou `UNDECIDED` lorsque les sources se contredisent — valeur explicite,
 * **jamais bloquante**, signalée comme question ouverte (aucune restriction provisoire
 * silencieuse). Le Circuit ne transmet aucun Format à ses membres (D-26, D-27).
 *
 * Aucun compteur de répétition de l'ensemble : le Circuit groupé répète le passage complet de ses
 * membres, le Cycle répète sa séquence (D-17, ARB-25).
 *
 * Fonctions pures, sans React ni SQLite.
 */

import type { CircuitNature } from "../circuit";

/**
 * PRE-9 (D.2) : version des règles de Format du registre, figée par élément formaté dans
 * l'instantané de Séance (ch09 l.593-598) ; incrémentée à tout changement de règle d'un Format.
 */
export const FORMAT_RULES_VERSION = 1;

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
 * Règle d'une organisation de Circuit (groupées = `TOURS`, alternées = `SERIES`, ch10 l.1034) pour
 * un Exercice qui porte ce Format (matrice §2.2, D-15/D-16) :
 * - `ADMITTED` : admise ; `requiredCount` — compte du Circuit exigé (refusée sinon) ;
 *   `adaptsSetting` — réglage de l'Exercice qui s'adapte au compte du Circuit (adaptation par le
 *   geste de dépose, C.4 ; aucune vérification ajoutée ici) ;
 * - `REFUSED` : refusée par une règle documentée ;
 * - `UNDECIDED` : sources contradictoires — non bloquante, question ouverte.
 */
export type CircuitOrganisationRule =
  | {
      readonly status: "ADMITTED";
      readonly requiredCount?: number;
      readonly adaptsSetting?: string;
      readonly sources: readonly string[];
    }
  | { readonly status: "REFUSED"; readonly sources: readonly string[] }
  | { readonly status: "UNDECIDED"; readonly question: string; readonly sources: readonly string[] };

export type FormatDescriptor = {
  readonly key: ElementFormatKey;
  readonly parameters: readonly FormatParameter[];
  /** Exercice formaté membre d'un Circuit, par organisation du Circuit (le Circuit ne porte aucun Format). */
  readonly inCircuit: Readonly<Record<CircuitNature, CircuitOrganisationRule>>;
};

/** Groupées admises pour les six Formats : bloc complet de chaque membre à chaque passage (D-08, D-15). */
const GROUPED_ADMITTED: CircuitOrganisationRule = { status: "ADMITTED", sources: ["D-08", "D-15"] };

export const FORMAT_REGISTRY: Readonly<Record<ElementFormatKey, FormatDescriptor>> = {
  TABATA: {
    key: "TABATA",
    parameters: [
      { id: "seriesPerExercise", lock: "LOCKED", unit: "SERIES", value: 8, sources: ["FMT-10", "FMT-14", "FMT-17"] },
      { id: "workSeconds", lock: "LOCKED", unit: "SECONDS", value: 20, sources: ["FMT-10", "FMT-17"] },
      { id: "pauseSeconds", lock: "LOCKED", unit: "SECONDS", value: 10, sources: ["FMT-10", "FMT-17", "FMT-18"] },
    ],
    inCircuit: {
      // Groupées : bloc intégral à chaque passage, quel que soit le compte (D-15) ; l'ancien « Circuit d'un tour » est retiré.
      TOURS: GROUPED_ADMITTED,
      // Alternées : admises si N = 8, refusées sinon (D-16, FMT-13).
      SERIES: { status: "ADMITTED", requiredCount: 8, sources: ["D-16", "FMT-13"] },
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
    // Alternées refusées (D-16).
    inCircuit: { TOURS: GROUPED_ADMITTED, SERIES: { status: "REFUSED", sources: ["D-16"] } },
  },
  EMOM: {
    key: "EMOM",
    parameters: [
      { id: "windowSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 1, sources: ["FMT-20", "FMT-23"] },
      { id: "roundCount", lock: "ADJUSTABLE", unit: "ROUNDS", min: 1, sources: ["FMT-20", "FMT-27"] },
      // N × E × W, calculée et jamais saisie (FMT-21).
      { id: "totalSeconds", lock: "CALCULATED", unit: "SECONDS", sources: ["FMT-21", "FMT-22"] },
    ],
    // Alternées admises ; le N réglable de l'Exercice s'adapte à celui du Circuit (D-16, D-07 ; FMT-22
    // vise l'ajout dans un EMOM, une autre opération). Adaptation : geste de dépose (C.4).
    inCircuit: { TOURS: GROUPED_ADMITTED, SERIES: { status: "ADMITTED", adaptsSetting: "roundCount", sources: ["D-16", "D-07", "FMT-20"] } },
  },
  AMRAP: {
    key: "AMRAP",
    // Durée imposée réglable ; le nombre de tours réalisés est un résultat (FMT-26).
    parameters: [{ id: "durationSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 1, sources: ["FMT-26"] }],
    // Groupées : nouvelle borne de durée configurée à chaque passage (D-15, D-30) ; alternées refusées (D-16).
    inCircuit: { TOURS: GROUPED_ADMITTED, SERIES: { status: "REFUSED", sources: ["D-16"] } },
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
    inCircuit: {
      // Groupées admises (D-15) ; le rattachement de l'échelle aux passages du Circuit reste À CLARIFIER (D.1).
      TOURS: GROUPED_ADMITTED,
      SERIES: {
        status: "UNDECIDED",
        question:
          "For time en Circuit alterné : refusé par les Arbitrages consolidés du 30/10 sur main (§2.2, D-13, D-16), " +
          "admis par la branche non fusionnée docs/for-time-organisation-alternee-20261030 (échelle indexée par passage du Circuit). À CLARIFIER.",
        sources: ["D-13", "D-16", "FMT-31"],
      },
    },
  },
  DEATH_BY: {
    key: "DEATH_BY",
    // Objectif calculé depuis le rang, le départ et l'incrément (FMT-33) ; la fenêtre en est la cadence.
    parameters: [
      { id: "startRepetitions", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 0, sources: ["FMT-33"] },
      { id: "incrementRepetitions", lock: "ADJUSTABLE", unit: "REPETITIONS", min: 0, sources: ["FMT-33"] },
      { id: "windowSeconds", lock: "ADJUSTABLE", unit: "SECONDS", min: 1, sources: ["FMT-33"] },
    ],
    // Groupées : l'arrêt termine l'élément, pas la Séance (D-15, D-18) ; alternées admises, chaque Death by garde
    // sa référence temporelle propre ; raccordement des rangs et fenêtres en PRE-10/11 (D-16, D-29).
    inCircuit: { TOURS: GROUPED_ADMITTED, SERIES: { status: "ADMITTED", sources: ["D-16", "D-29"] } },
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

/** Compatibilité d'un Exercice formaté avec l'organisation et le compte du Circuit qui le contient. */
export type CircuitCompatibility =
  | { readonly status: "ADMITTED" }
  | { readonly status: "REFUSED"; readonly cause: "ORGANISATION" | "COUNT"; readonly sources: readonly string[] }
  | { readonly status: "UNDECIDED"; readonly question: string; readonly sources: readonly string[] };

/**
 * Lecture de la matrice §2.2 pour un Exercice portant `key` dans le Circuit `circuit`. Une
 * incompatibilité ne résulte que d'une règle documentée ; `UNDECIDED` n'est jamais un refus.
 */
export function circuitCompatibility(
  key: ElementFormatKey,
  circuit: { readonly nature: CircuitNature; readonly repeatCount: number },
): CircuitCompatibility {
  const rule = FORMAT_REGISTRY[key].inCircuit[circuit.nature];
  switch (rule.status) {
    case "ADMITTED":
      return rule.requiredCount === undefined || rule.requiredCount === circuit.repeatCount
        ? { status: "ADMITTED" }
        : { status: "REFUSED", cause: "COUNT", sources: rule.sources };
    case "REFUSED":
      return { status: "REFUSED", cause: "ORGANISATION", sources: rule.sources };
    case "UNDECIDED":
      return { status: "UNDECIDED", question: rule.question, sources: rule.sources };
    default: {
      const unreachable: never = rule;
      return unreachable;
    }
  }
}
