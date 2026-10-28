/**
 * PRE-8 (epic E, arbitrage Q-E5 option A de Hermann du 28/10/2026) — formats de Séance du Catalogue.
 *
 * Aucun format n'est persisté : une Séance est aujourd'hui toujours au format Libre (ch09 : « les
 * anciennes séances sans format restent libres »). Le jeu de vignettes de Figma (`8852:15055` à
 * `8852:15197`, panneau `4168:11149`) est affiché dans le panneau de filtres : Libre seul est
 * sélectionnable, les autres sont visibles mais indisponibles. Aucun format n'est simulé.
 *
 * Raccordement ultérieur (lot des formats) : la Séance portera un format persisté ; la projection
 * lira son nom et sa vignette dans cette table, et `available` passera à vrai pour chaque format pris
 * en charge par le service, sans autre changement de l'epic E.
 *
 * Vignettes : exports PNG ×3 en lecture seule (MCP Figma, 28/10). Tabata et EMOM n'existent dans le
 * panneau qu'à l'état sélectionné : leur bordure de sélection (3 pt, hors motif) est remplacée par
 * leur fond pour obtenir l'état non sélectionné (réserve F-03 consignée).
 */

export type SessionFormatKey =
  | "TABATA"
  | "INTERVALS_30_30"
  | "EMOM"
  | "AMRAP"
  | "FOR_TIME"
  | "DEATH_BY"
  | "STRENGTH"
  | "CORE_MOBILITY"
  | "SUPERSET"
  | "PROGRESSION"
  | "UNTIL_FAILURE"
  | "FREE";

export type SessionFormat = {
  readonly key: SessionFormatKey;
  /** Nom du format, tel que dessiné sur sa vignette. */
  readonly label: string;
  readonly thumbnail: number;
  /** Q-E5 : seul Libre est pris en charge tant que les formats spéciaux ne sont pas développés. */
  readonly available: boolean;
};

/** Ordre du panneau Figma `4168:11149`. */
export const SESSION_FORMATS: readonly SessionFormat[] = [
  { key: "TABATA", label: "Tabata", thumbnail: require("../../../assets/formats/format-tabata.png"), available: false },
  { key: "INTERVALS_30_30", label: "Intervalles 30/30", thumbnail: require("../../../assets/formats/format-intervalles-30-30.png"), available: false },
  { key: "EMOM", label: "EMOM", thumbnail: require("../../../assets/formats/format-emom.png"), available: false },
  { key: "AMRAP", label: "AMRAP", thumbnail: require("../../../assets/formats/format-amrap.png"), available: false },
  { key: "FOR_TIME", label: "For time", thumbnail: require("../../../assets/formats/format-for-time.png"), available: false },
  { key: "DEATH_BY", label: "Death by", thumbnail: require("../../../assets/formats/format-death-by.png"), available: false },
  { key: "STRENGTH", label: "Renforcement", thumbnail: require("../../../assets/formats/format-renforcement.png"), available: false },
  { key: "CORE_MOBILITY", label: "Gainage · Mobilité", thumbnail: require("../../../assets/formats/format-gainage-mobilite.png"), available: false },
  { key: "SUPERSET", label: "Superset", thumbnail: require("../../../assets/formats/format-superset.png"), available: false },
  { key: "PROGRESSION", label: "Progression", thumbnail: require("../../../assets/formats/format-progression.png"), available: false },
  { key: "UNTIL_FAILURE", label: "À l’échec", thumbnail: require("../../../assets/formats/format-a-l-echec.png"), available: false },
  { key: "FREE", label: "Libre", thumbnail: require("../../../assets/formats/format-libre.png"), available: true },
];

/** Format d'une Séance : aucun format persisté, donc Libre (Q-E5). */
export const FREE_SESSION_FORMAT: SessionFormatKey = "FREE";

export function sessionFormatOf(key: SessionFormatKey): SessionFormat {
  return SESSION_FORMATS.find((format) => format.key === key)!;
}
