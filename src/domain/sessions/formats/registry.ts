/**
 * PRE-9 (C.1, réalignement du 02/11/2026) — registre déclaratif des Formats.
 *
 * Référence active : `docs/KODJO-Formats-entrainement-2026-11-02.md` (§1, §2, §6, §10 à §14), FMT-01
 * à FMT-04 du chapitre 10. Elle remplace la correction du 30/10 (« le Circuit ne porte aucun
 * Format », D-02) dans les cas de son tableau de portage.
 *
 * - **Quatre Formats spécialisés** : AMRAP, EMOM, For time, Death by. Tabata et les cinq départs
 *   rapides (30/30, Renforcement, Superset, Progression, À l'échec) sont des **préconfigurations
 *   standards modifiables** : ils ne créent aucune identité de Format (§9, FMT-02, FMT-10).
 * - **Porteur** (§1) : l'Exercice autonome, ou le Circuit qui porte le temps commun ou coordonne la
 *   fin du défi (« Format d'origine », hérité du questionnaire, non modifiable ; nature fixée). Les
 *   membres d'un Circuit porteur gardent leurs paramètres d'Exercice et les réglages de membre du
 *   Format (Passage, Incrément, Intervalle local du Death by alterné, §14).
 * - **Exercice formaté autonome dans un Circuit standard** (§6.1, A5) : matrice `inStandardCircuit`.
 *
 * Stockage (classe D) : les réglages de chaque rôle sont des valeurs numériques (`FormatSettings`).
 * Un membre d'un Circuit porteur enregistre la clé du Format de son Circuit et ses seuls réglages de
 * membre ; son rôle se lit de son contexte (`exerciseFormatRole`). Les clés Tabata et 30/30 écrites
 * avant le 02/11 (`LEGACY_PRECONFIGURATION_FORMAT_KEYS`) se relisent comme des Exercices standards :
 * leurs valeurs vivent déjà dans les paramètres d'exécution.
 *
 * Fonctions pures, sans React ni SQLite.
 */

import type { CircuitNature } from "../circuit";

/**
 * PRE-9 (D.2) : version des règles de Format du registre, figée par élément formaté dans
 * l'instantané de Séance (ch09 l.593-598) ; incrémentée à tout changement de règle d'un Format.
 * 2 : référence du 02/11/2026 (quatre Formats, portage par le Circuit).
 */
export const FORMAT_RULES_VERSION = 2;

/** Formats spécialisés (FMT-01, référence du 02/11/2026). */
export const ELEMENT_FORMAT_KEYS = ["EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"] as const;

export type ElementFormatKey = (typeof ELEMENT_FORMAT_KEYS)[number];

/** Clés écrites avant le 02/11 pour Tabata et 30/30, désormais préconfigurations : relues libres. */
export const LEGACY_PRECONFIGURATION_FORMAT_KEYS = ["TABATA", "INTERVALS_30_30"] as const;

/** Toutes les clés admises par le stockage (migration 017, inchangée). */
export const STORABLE_FORMAT_KEYS = ["TABATA", "INTERVALS_30_30", "EMOM", "AMRAP", "FOR_TIME", "DEATH_BY"] as const;

/** Départs rapides (§9.2) : préconfigurations standards librement modifiables. */
export const QUICK_START_KEYS = ["INTERVALS_30_30", "STRENGTH", "SUPERSET", "PROGRESSION", "UNTIL_FAILURE"] as const;

export type QuickStartKey = (typeof QUICK_START_KEYS)[number];

/** Préconfigurations standards de la fenêtre Formats : Tabata et les cinq départs rapides. */
export const PRECONFIGURATION_KEYS = ["TABATA", ...QUICK_START_KEYS] as const;

export type PreconfigurationKey = (typeof PRECONFIGURATION_KEYS)[number];

/**
 * Origine de création d'une Séance (FMT-02) : modèle de la fenêtre Formats. Les valeurs
 * `EXERCISE_CARD`, `SESSION_CARD` (cartes retirées le 02/11) et `CORE_MOBILITY` (D-25) restent
 * lisibles pour les Séances déjà enregistrées. Absente (`null`) hors de la fenêtre Formats.
 */
export const SESSION_ORIGINS = [
  "EXERCISE_CARD",
  "SESSION_CARD",
  "TABATA",
  "INTERVALS_30_30",
  "EMOM",
  "AMRAP",
  "FOR_TIME",
  "DEATH_BY",
  "STRENGTH",
  "CORE_MOBILITY",
  "SUPERSET",
  "PROGRESSION",
  "UNTIL_FAILURE",
] as const;

export type SessionOrigin = (typeof SESSION_ORIGINS)[number];

/** Unité d'un réglage. `FLAG` : 1 = vrai (Passage « Une fois »). */
export type FormatParameterUnit = "SECONDS" | "REPETITIONS" | "FLAG";

export type FormatParameter = {
  readonly id: string;
  readonly unit: FormatParameterUnit;
  /** Borne de saisie (entier ≥ `min`) ; les valeurs calculées peuvent la dépasser (§14.1). */
  readonly min?: number;
  /** Valeur initiale (questionnaire ou entrée dans le rôle). Absente : facultatif ou à renseigner. */
  readonly initial?: number;
  /** Réglage facultatif (absence = « Aucune », « Sans limite », « À chaque tour »). */
  readonly optional?: true;
  readonly sources: readonly string[];
};

/** Rôle d'un porteur de réglages de Format. */
export type FormatRole =
  | { readonly kind: "EXERCISE" }
  | { readonly kind: "CIRCUIT"; readonly nature: CircuitNature }
  | { readonly kind: "MEMBER"; readonly nature: CircuitNature };

/** Exercice formaté autonome dans un Circuit standard (§6.1). */
export type StandardCircuitRule =
  | { readonly status: "ADMITTED"; readonly adaptsSeriesCount?: true; readonly sources: readonly string[] }
  | { readonly status: "REFUSED"; readonly sources: readonly string[] };

export type FormatDescriptor = {
  readonly key: ElementFormatKey;
  /** Réglages de l'Exercice autonome qui porte le Format (§14, « champs propres au format »). */
  readonly exercise: readonly FormatParameter[];
  /** Circuit porteur : natures admises (fixées) et réglages portés par le Circuit (§1, §14). */
  readonly circuit: { readonly natures: readonly CircuitNature[]; readonly parameters: readonly FormatParameter[] };
  /** Réglages de membre d'un Circuit porteur, par nature (§6 point 5, §14). */
  readonly member: Readonly<Partial<Record<CircuitNature, readonly FormatParameter[]>>>;
  /** Compte du Circuit porteur : ouvert (« jusqu'à l'échec ») ou fini (tours, blocs). */
  readonly openRounds: boolean;
  readonly inStandardCircuit: Readonly<Record<CircuitNature, StandardCircuitRule>>;
};

const MINUTE = 60;
const PASSAGE: FormatParameter = { id: "passageOnce", unit: "FLAG", min: 0, optional: true, sources: ["§2", "§3", "§11"] };
const AMRAP_INCREMENT: FormatParameter = { id: "incrementPerRound", unit: "REPETITIONS", min: 0, initial: 0, sources: ["§2", "§14.1"] };
const DEATH_BY_INCREMENT: FormatParameter = { id: "incrementPerRound", unit: "REPETITIONS", min: 1, initial: 1, sources: ["§12", "§14.1"] };
const INTERVAL: FormatParameter = { id: "intervalSeconds", unit: "SECONDS", min: 1, initial: MINUTE, sources: ["§10", "§12", "§14"] };

export const FORMAT_REGISTRY: Readonly<Record<ElementFormatKey, FormatDescriptor>> = {
  AMRAP: {
    key: "AMRAP",
    exercise: [
      // Durée de l'exercice : 12 min par défaut (§2, ch07 « Défauts validés »).
      { id: "durationSeconds", unit: "SECONDS", min: 1, initial: 12 * MINUTE, sources: ["§2", "FMT-26"] },
      AMRAP_INCREMENT,
    ],
    circuit: {
      natures: ["TOURS"],
      parameters: [
        // Durée de chaque bloc ; le nombre de blocs est le compte du Circuit (§2, §2.1).
        { id: "blockSeconds", unit: "SECONDS", min: 1, initial: 12 * MINUTE, sources: ["§2", "§2.1"] },
        { id: "restBetweenBlocksSeconds", unit: "SECONDS", min: 0, initial: 2 * MINUTE, sources: ["§2", "§7.1"] },
      ],
    },
    member: { TOURS: [AMRAP_INCREMENT, PASSAGE] },
    openRounds: false,
    inStandardCircuit: {
      TOURS: { status: "ADMITTED", sources: ["§6.1", "A5"] },
      SERIES: { status: "REFUSED", sources: ["§6.1", "A5"] },
    },
  },
  FOR_TIME: {
    key: "FOR_TIME",
    // « Durée maximum du For time » : temps limite facultatif, « Aucune » par défaut (§11).
    exercise: [{ id: "timeCapSeconds", unit: "SECONDS", min: 1, optional: true, sources: ["§11"] }],
    circuit: {
      natures: ["SERIES"],
      parameters: [
        { id: "timeCapSeconds", unit: "SECONDS", min: 1, optional: true, sources: ["§11"] },
        { id: "restBetweenRoundsSeconds", unit: "SECONDS", min: 0, initial: 0, sources: ["§11"] },
      ],
    },
    member: { SERIES: [PASSAGE] },
    openRounds: false,
    inStandardCircuit: {
      TOURS: { status: "ADMITTED", sources: ["§6.1", "A5"] },
      SERIES: { status: "REFUSED", sources: ["§6.1", "§11"] },
    },
  },
  EMOM: {
    key: "EMOM",
    // Intervalle, qui remplace la Pause ; le nombre de séries est celui des paramètres d'exécution (§10).
    exercise: [INTERVAL],
    // « Dans chaque intervalle » : Durée de chaque tour = intervalle, porté par le Circuit (§10).
    circuit: { natures: ["TOURS"], parameters: [{ ...INTERVAL, id: "windowSeconds" }] },
    member: { TOURS: [] },
    openRounds: false,
    inStandardCircuit: {
      TOURS: { status: "ADMITTED", sources: ["§6.1"] },
      // Admis ; compte de séries adapté au Circuit (§6.1, §10).
      SERIES: { status: "ADMITTED", adaptsSeriesCount: true, sources: ["§6.1", "§10"] },
    },
  },
  DEATH_BY: {
    key: "DEATH_BY",
    exercise: [INTERVAL, DEATH_BY_INCREMENT],
    circuit: {
      // Dans chaque intervalle : intervalle commun ; en alternance : aucune durée au Circuit (§12, A2).
      natures: ["TOURS", "SERIES"],
      parameters: [{ ...INTERVAL, id: "windowSeconds" }],
    },
    member: { TOURS: [DEATH_BY_INCREMENT], SERIES: [DEATH_BY_INCREMENT, INTERVAL] },
    openRounds: true,
    inStandardCircuit: {
      TOURS: { status: "ADMITTED", sources: ["§6.1", "décision complémentaire de Hermann"] },
      SERIES: { status: "REFUSED", sources: ["§6.1", "décision complémentaire de Hermann"] },
    },
  },
};

export function isElementFormatKey(value: unknown): value is ElementFormatKey {
  return typeof value === "string" && (ELEMENT_FORMAT_KEYS as readonly string[]).includes(value);
}

export function isLegacyPreconfigurationFormatKey(value: unknown): boolean {
  return typeof value === "string" && (LEGACY_PRECONFIGURATION_FORMAT_KEYS as readonly string[]).includes(value);
}

export function isSessionOrigin(value: unknown): value is SessionOrigin {
  return typeof value === "string" && (SESSION_ORIGINS as readonly string[]).includes(value);
}

export function formatDescriptorOf(key: ElementFormatKey): FormatDescriptor {
  return FORMAT_REGISTRY[key];
}

/** Réglages d'un rôle ; `null` : rôle impossible (nature non admise pour un Circuit porteur). */
export function formatParametersOf(key: ElementFormatKey, role: FormatRole): readonly FormatParameter[] | null {
  const descriptor = FORMAT_REGISTRY[key];
  switch (role.kind) {
    case "EXERCISE":
      return descriptor.exercise;
    case "CIRCUIT":
      return circuitFormatParametersOf(key, role.nature);
    case "MEMBER":
      return descriptor.member[role.nature] ?? null;
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

/**
 * Réglages d'un Circuit porteur selon sa nature : en Death by alterné, l'intervalle appartient aux
 * membres, le Circuit n'en porte aucun (§1, §12, A2).
 */
export function circuitFormatParametersOf(key: ElementFormatKey, nature: CircuitNature): readonly FormatParameter[] | null {
  const descriptor = FORMAT_REGISTRY[key];
  if (!descriptor.circuit.natures.includes(nature)) return null;
  return key === "DEATH_BY" && nature === "SERIES" ? [] : descriptor.circuit.parameters;
}

/** Valeurs initiales d'un rôle (réglages non facultatifs dotés d'une valeur initiale). */
export function initialFormatSettings(key: ElementFormatKey, role: FormatRole): Readonly<Record<string, number>> {
  const parameters = formatParametersOf(key, role) ?? [];
  return Object.fromEntries(parameters.flatMap((parameter) => (parameter.initial === undefined ? [] : [[parameter.id, parameter.initial]])));
}

/** Exercice formaté autonome dans un Circuit standard (§6.1). */
export type CircuitCompatibility =
  | { readonly status: "ADMITTED"; readonly adaptsSeriesCount: boolean }
  | { readonly status: "REFUSED"; readonly cause: "ORGANISATION"; readonly sources: readonly string[] };

export function circuitCompatibility(key: ElementFormatKey, circuit: { readonly nature: CircuitNature }): CircuitCompatibility {
  const rule = FORMAT_REGISTRY[key].inStandardCircuit[circuit.nature];
  return rule.status === "ADMITTED"
    ? { status: "ADMITTED", adaptsSeriesCount: rule.adaptsSeriesCount === true }
    : { status: "REFUSED", cause: "ORGANISATION", sources: rule.sources };
}
