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

/** Passage « Une fois » : buy-in (premier membre) ou buy-out (dernier membre), AMRAP et For time (§3). */
export function isSinglePassage(format: ElementFormat | null | undefined): boolean {
  return format?.settings.passageOnce === 1;
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

/** Libellé de passage d'un membre « Une fois » : déduit de sa position (§5). */
export function singlePassageLabel(index: number): "BUY_IN" | "BUY_OUT" {
  return index === 0 ? "BUY_IN" : "BUY_OUT";
}
