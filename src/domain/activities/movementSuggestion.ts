/**
 * PRE-7 (A2.3, MFN-05, MFN-06, D-439) — suggestion d'un geste proche et position de niveau
 * dérivée, fonctions pures.
 *
 * « Une suggestion peut être proposée sur la base d'un nom proche, sans fusion ni attribution
 * automatique » (MFN-06) ; « aucun mécanisme de détection sémantique n'est ajouté » (MFN-08).
 * La proximité est donc LEXICALE seulement, sur le nom normalisé (`normalizeMovementName` :
 * espaces réduits, casse et accents neutralisés) : noms égaux, ou suite de mots entiers de l'un
 * contenue dans l'autre (« Squats » / « Squats assistés »). Un fragment de mot (« Squ ») ne suffit
 * pas. La suggestion n'est qu'une proposition : le choix reste celui de l'utilisateur.
 */

import { normalizeMovementName, type Movement } from "./Movement";

/** Mots du nom normalisé, sans mot vide. */
function words(normalized: string): readonly string[] {
  // Revue : tirets, apostrophes et ponctuation séparent aussi les mots (« Squats-sautés »).
  return normalized.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 0);
}

/** Vrai si `inner` est une suite contiguë de mots entiers de `outer`. */
function containsWordSequence(outer: readonly string[], inner: readonly string[]): boolean {
  if (inner.length === 0 || inner.length > outer.length) {
    return false;
  }
  for (let start = 0; start + inner.length <= outer.length; start += 1) {
    if (inner.every((word, offset) => outer[start + offset] === word)) {
      return true;
    }
  }
  return false;
}

/**
 * Deux noms sont proches s'ils sont égaux une fois normalisés, ou si les mots de l'un forment une
 * suite contiguë de mots entiers de l'autre. Un nom vide n'est proche d'aucun autre.
 */
export function areMovementNamesClose(left: string, right: string): boolean {
  const a = words(normalizeMovementName(left));
  const b = words(normalizeMovementName(right));
  if (a.length === 0 || b.length === 0) {
    return false;
  }
  return containsWordSequence(a, b) || containsWordSequence(b, a);
}

/**
 * Geste proche du nom saisi, ou `null`. Plusieurs candidats : nom égal d'abord, puis le plus petit
 * écart de longueur entre noms normalisés, puis le nom normalisé, puis l'identifiant — ordre
 * déterministe, sans préférence cachée. `excludedIds` : gestes déjà proposés et écartés.
 */
export function findCloseMovement(
  name: string,
  candidates: readonly Movement[],
  excludedIds: ReadonlySet<string> = new Set(),
): Movement | null {
  const key = normalizeMovementName(name);
  const close = candidates.filter((movement) => !excludedIds.has(movement.id) && areMovementNamesClose(name, movement.name));
  if (close.length === 0) {
    return null;
  }
  const ranked = [...close].sort((left, right) => {
    const leftKey = normalizeMovementName(left.name);
    const rightKey = normalizeMovementName(right.name);
    const leftExact = leftKey === key ? 0 : 1;
    const rightExact = rightKey === key ? 0 : 1;
    if (leftExact !== rightExact) return leftExact - rightExact;
    const gap = Math.abs(leftKey.length - key.length) - Math.abs(rightKey.length - key.length);
    if (gap !== 0) return gap;
    if (leftKey !== rightKey) return leftKey < rightKey ? -1 : 1;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
  return ranked[0] ?? null;
}

/** Rang (1..total) et total dérivés du groupe de niveaux (MFN-05) ; jamais persistés. */
export type MovementLevelPosition = {
  readonly rank: number;
  readonly total: number;
};

/**
 * Position du geste dans son groupe, dérivée des membres ORDONNÉS (`listGroup`). Un geste sans
 * groupe, ou un groupe réduit à un membre, masque rang et total (MFN-05, MFN/AC08) : `null`, jamais
 * un faux « Niveau 1 ». Un geste absent des membres fournis : `null`.
 */
export function movementLevelPosition(movement: Movement, orderedMembers: readonly Movement[]): MovementLevelPosition | null {
  if (movement.levelGroup === null || orderedMembers.length < 2) {
    return null;
  }
  const index = orderedMembers.findIndex((member) => member.id === movement.id);
  if (index < 0) {
    return null;
  }
  return { rank: index + 1, total: orderedMembers.length };
}
