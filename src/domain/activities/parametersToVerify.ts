import {
  phaseDurationsProblem,
  WORK_PHASE_LIMITS,
  type CatalogExecutionParameters,
  type ExecutionSeries,
  type PhaseDuration,
} from "@/domain/activities/ExecutionParameters";

/**
 * PRE-9 — recette iPhone n° 2 du 31/10/2026, constat e (classe B). Décision de Hermann :
 * « modifier un mouvement : Ajouter une valeur par défaut doit mettre à jour les exercices qui
 * utilisent cet exercice, mais que les champs (et l'ensemble de la ligne de couleur) soient
 * identifiés en orange, avec le texte « Paramètre à vérifier » à la place de « Paramètre à
 * compléter ». S'il y a à la fois des paramètre à vérifier et à compléter, la codification des
 * paramètres à compléter est prioritaire. » Réponses du même jour : « Champs vides seulement
 * (Recommandé) », « Ouverture de la feuille (Recommandé) », « Séances et Catalogue (Recommandé) ».
 *
 * [Remplace en partie « Inchangés » (A.2b, 31/10/2026) : « les Exercices existants gardent leurs
 * durées locales » reste vrai pour toute durée DÉJÀ renseignée ; une durée VIDE reçoit désormais la
 * nouvelle valeur par défaut, marquée « à vérifier ».]
 *
 * Fonctions pures : propagation des valeurs par défaut d'un Mouvement dans la forme Catalogue v5
 * d'un Exercice (séance ou Catalogue), et codage de la marque persistée (`phases_to_verify`,
 * `migration019`) : identités des phases dont la durée a été reprise, à vérifier.
 */

/** Identités des phases à vérifier d'un Exercice (vide : rien à vérifier). */
export type PhasesToVerify = readonly number[];

/** Marque persistée illisible (jamais rabattue silencieusement sur « rien à vérifier »). */
export class PhasesToVerifyDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhasesToVerifyDataError";
  }
}

function normalized(ids: readonly number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b);
}

/** Codage de la colonne `phases_to_verify` : liste JSON triée, `null` si vide. */
export function encodePhasesToVerify(ids: PhasesToVerify | null | undefined): string | null {
  if (ids === null || ids === undefined || ids.length === 0) return null;
  return JSON.stringify(normalized(ids));
}

/** Lecture STRICTE de `phases_to_verify` : `NULL` → vide ; liste d'entiers ≥ 1 distincts, sinon erreur. */
export function decodePhasesToVerify(text: string | null | undefined): number[] {
  if (text === null || text === undefined) return [];
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new PhasesToVerifyDataError("Malformed phases to verify: invalid JSON.");
  }
  if (
    !Array.isArray(value) ||
    value.some((id) => typeof id !== "number" || !Number.isInteger(id) || id < 1) ||
    new Set(value).size !== value.length
  ) {
    throw new PhasesToVerifyDataError("Malformed phases to verify.");
  }
  return normalized(value as number[]);
}

/** Union de deux marques (identités distinctes, triées). */
export function mergePhasesToVerify(existing: PhasesToVerify, added: PhasesToVerify): number[] {
  return normalized([...existing, ...added]);
}

/**
 * Valeurs par défaut AJOUTÉES ou CHANGÉES à l'enregistrement d'un Mouvement : phases reçues avec une
 * durée renseignée (nombre) différente de la durée enregistrée de la même identité (`stored`). Une
 * durée retirée (`null`) ou non transmise (`undefined`, structure reconstruite depuis un Exercice)
 * ne propage rien.
 */
export function addedPhaseDefaults(
  stored: ReadonlyMap<number, number | null>,
  phases: readonly { readonly id: number; readonly durationSeconds?: number | null }[],
): Map<number, number> {
  const added = new Map<number, number>();
  for (const phase of phases) {
    if (typeof phase.durationSeconds === "number" && (stored.get(phase.id) ?? null) !== phase.durationSeconds) {
      added.set(phase.id, phase.durationSeconds);
    }
  }
  return added;
}

/**
 * « Champs vides seulement » : chaque durée VIDE (« à compléter » : `null`, ou phase du Mouvement
 * sans entrée, résolue à 0 — `resolveCatalogParameters`) d'une phase de la structure courante
 * (`phaseIds`) de même identité qu'une valeur par défaut ajoutée la reçoit ; une durée renseignée
 * n'est jamais remplacée. `null` si rien n'est rempli, ou si le motif rempli sortirait des bornes
 * (Σ 1..3535 s, D-430) : l'Exercice reste alors tel quel (« à compléter »), sans erreur.
 */
export function fillEmptyPhaseDurations(
  parameters: CatalogExecutionParameters,
  defaults: ReadonlyMap<number, number>,
  phaseIds: readonly number[],
): { readonly parameters: CatalogExecutionParameters; readonly filled: number[] } | null {
  const filled: number[] = [];
  const structure = new Set(phaseIds);
  const phaseDurations: PhaseDuration[] = parameters.series.phaseDurations.map((entry) => {
    const value = defaults.get(entry.phaseId);
    if (entry.durationSeconds !== null || value === undefined || !structure.has(entry.phaseId)) return entry;
    filled.push(entry.phaseId);
    return { phaseId: entry.phaseId, durationSeconds: value };
  });
  const present = new Set(parameters.series.phaseDurations.map((entry) => entry.phaseId));
  for (const phaseId of phaseIds) {
    const value = defaults.get(phaseId);
    if (present.has(phaseId) || value === undefined) continue;
    filled.push(phaseId);
    phaseDurations.push({ phaseId, durationSeconds: value });
  }
  if (filled.length === 0 || phaseDurationsProblem(phaseDurations) !== null) return null;
  return { parameters: { ...parameters, series: { ...parameters.series, phaseDurations } }, filled: normalized(filled) };
}

/**
 * Phases réellement à vérifier d'un Exercice : marque restreinte aux phases encore présentes et
 * renseignées (une phase retirée, ou vidée depuis, n'est plus « à vérifier » — elle est « à
 * compléter », prioritaire).
 */
export function phasesToVerifyIn(parameters: { readonly series: ExecutionSeries }, ids: PhasesToVerify | null | undefined): number[] {
  if (ids === null || ids === undefined || ids.length === 0) return [];
  const wanted = new Set(ids);
  return normalized(
    parameters.series.workPhases
      .filter((phase) => wanted.has(phase.id) && phase.durationSeconds >= WORK_PHASE_LIMITS.durationMin)
      .map((phase) => phase.id),
  );
}

/**
 * Champ `phasesToVerify` d'un Exercice relu (colonne `phases_to_verify`) : absent sans marque. Une
 * marque illisible est ignorée — l'Exercice reste lisible (la marque n'est qu'un signalement, jamais
 * un paramètre d'exécution).
 */
export function phasesToVerifyField(text: string | null | undefined): { readonly phasesToVerify?: readonly number[] } {
  let ids: number[];
  try {
    ids = decodePhasesToVerify(text);
  } catch {
    return {};
  }
  return ids.length === 0 ? {} : { phasesToVerify: ids };
}
