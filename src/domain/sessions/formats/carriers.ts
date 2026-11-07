/**
 * PRE-9 (réalignement C.1 du 02/11/2026, référence Formats §1, §2, §6, §14) — porteurs du Format.
 *
 * Un Exercice autonome porte son Format ; un Circuit porteur porte le Format d'origine, et chacun de
 * ses membres enregistre la même clé avec ses seuls réglages de membre (Passage, Incrément,
 * Intervalle local du Death by alterné). Un Exercice formaté membre d'un Circuit standard reste
 * autonome (§6.1). Fonctions pures.
 */

import type { CircuitNature } from "../circuit";

import type { ElementFormat } from "./elementFormat";
import { FORMAT_REGISTRY, type ElementFormatKey, type FormatRole } from "./registry";

type CircuitLike = { readonly nature: CircuitNature; readonly format?: ElementFormat | null };

/** Rôle d'un Exercice selon son Circuit (`null` : niveau Séance ou Cycle). */
export function exerciseFormatRole(circuit: CircuitLike | null): FormatRole {
  return circuit !== null && (circuit.format ?? null) !== null ? { kind: "MEMBER", nature: circuit.nature } : { kind: "EXERCISE" };
}

/**
 * Rôle dans le circuit (mise à jour consolidée du 04/11/2026 §6 bis 2) : Buy-in | Tour pour AMRAP, Buy-in | Tour |
 * Buy-out pour For time. Le Circuit est découpé en trois zones ordonnées — buy-in, tour (la boucle), buy-out ;
 * plusieurs buy-in et buy-out sont admis, exécutés une seule fois dans l'ordre.
 */
export type CircuitRole = "BUY_IN" | "TOUR" | "BUY_OUT";

const ROLE_CODES: Readonly<Record<Exclude<CircuitRole, "TOUR">, number>> = { BUY_IN: 1, BUY_OUT: 2 };

/**
 * Rôle d'un membre. `circuitRole` explicite ; à défaut, ancien `passageOnce` (écrit avant le 04/11, seulement en
 * tête ou en fin) : Buy-in en tête ou dans un AMRAP (qui n'a pas de buy-out), Buy-out sinon ; Tour par défaut.
 * `index` : rang du membre dans son Circuit, pour la seule relecture de l'ancien Passage.
 */
export function circuitRoleOf(format: ElementFormat | null | undefined, index = 0): CircuitRole {
  const code = format?.settings.circuitRole;
  if (code === ROLE_CODES.BUY_IN) return "BUY_IN";
  if (code === ROLE_CODES.BUY_OUT) return format?.key === "AMRAP" ? "BUY_IN" : "BUY_OUT";
  if (format?.settings.passageOnce === 1) return index === 0 || format.key === "AMRAP" ? "BUY_IN" : "BUY_OUT";
  return "TOUR";
}

/** Réglages d'un membre avec son Rôle (l'ancien Passage est remplacé, Tour : aucune clé). */
export function withCircuitRole(format: ElementFormat, role: CircuitRole): ElementFormat {
  const { passageOnce: _legacy, circuitRole: _previous, ...settings } = format.settings;
  return { key: format.key, settings: role === "TOUR" ? settings : { ...settings, circuitRole: ROLE_CODES[role] } };
}

/** Buy-in ou buy-out : une seule exécution (§3). [Passage « Une fois » — remplacé le 04/11/2026 par le Rôle.] */
export function isSinglePassage(format: ElementFormat | null | undefined): boolean {
  return circuitRoleOf(format) !== "TOUR";
}

/** Formats dont le Circuit porteur propose Passage (buy-in / buy-out, §3). */
export function carrierAdmitsPassage(key: ElementFormatKey): boolean {
  return key === "AMRAP" || key === "FOR_TIME";
}

/** Nature fixée d'un Circuit porteur ; `null` si le Format n'admet pas cette nature (§1). */
export function carrierNatureAdmitted(key: ElementFormatKey, nature: CircuitNature): boolean {
  return FORMAT_REGISTRY[key].circuit.natures.includes(nature);
}

/**
 * Boucle d'un Circuit porteur AMRAP ou For time : membres « À chaque tour ». Sans aucun membre de
 * boucle, la configuration est invalide même si un buy-in ou buy-out subsiste (§6.1, R09).
 */
export function loopMembers<E extends { readonly format?: ElementFormat | null }>(exercises: readonly E[]): readonly E[] {
  return exercises.filter((exercise) => !isSinglePassage(exercise.format));
}

/** Libellé d'un membre buy-in ou buy-out : son Rôle (l'ancien Passage se relit par sa position). */
export function singlePassageLabel(format: ElementFormat | null | undefined, index: number): "BUY_IN" | "BUY_OUT" {
  return circuitRoleOf(format, index) === "BUY_OUT" ? "BUY_OUT" : "BUY_IN";
}

/** Rôles admis par le Format d'un Circuit porteur (AMRAP : pas de buy-out). */
export function admittedCircuitRoles(key: ElementFormatKey): readonly CircuitRole[] {
  return key === "FOR_TIME" ? ["BUY_IN", "TOUR", "BUY_OUT"] : key === "AMRAP" ? ["BUY_IN", "TOUR"] : [];
}
