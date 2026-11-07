import type { MovementChoice } from "./ActivityDefinitionService";

/**
 * PRE-9 CAT.2 — clarification de Hermann du 30/10/2026 (classe B) : « Dans les résultats de
 * recherche, tous les mouvements appartenant à une même famille doivent être affichés ensemble, de
 * manière contiguë, et reliés par un filet continu. Aucun autre résultat ne doit pouvoir
 * s'intercaler entre les mouvements d'une même famille. »
 *
 * Règle de classement : chaque famille est un bloc indivisible placé au rang de son PREMIER membre
 * dans l'ordre initial ; ses membres y gardent leur ordre relatif ; un résultat indépendant classé
 * avant ce premier membre reste avant la pile, tout autre après ; l'ordre relatif des résultats
 * indépendants est conservé. Fonction pure, sans effet sur le calcul du classement (R02).
 *
 * Réponse de Hermann du 30/10/2026 (« La pile d'une famille doit-elle aussi montrer ses membres qui
 * ne correspondent pas à la recherche ? » — « Oui ») : la pile contient TOUS les membres
 * proposables de la famille (`pool`, Mouvements actifs), même ceux que la recherche ne trouve pas,
 * dans l'ordre des Niveaux (rang dérivé croissant, comme la pile du Catalogue).
 */

/** Famille d'une carte : groupe de niveaux d'au moins deux membres (rang dérivé présent). */
export function familyOfChoice(choice: MovementChoice): string | null {
  return choice.level !== null ? (choice.movement.levelGroup?.groupId ?? null) : null;
}

export function groupResultsByFamily(
  results: readonly MovementChoice[],
  pool: readonly MovementChoice[] = results,
): readonly MovementChoice[] {
  const grouped: MovementChoice[] = [];
  const placed = new Set<string>();
  for (const choice of results) {
    const family = familyOfChoice(choice);
    if (family === null) {
      grouped.push(choice);
      continue;
    }
    if (placed.has(family)) continue;
    placed.add(family);
    const members = new Map<string, MovementChoice>();
    for (const member of [...results, ...pool]) {
      if (familyOfChoice(member) === family && !members.has(member.movement.id)) members.set(member.movement.id, member);
    }
    grouped.push(...[...members.values()].sort((a, b) => (a.level?.rank ?? 0) - (b.level?.rank ?? 0)));
  }
  return grouped;
}
