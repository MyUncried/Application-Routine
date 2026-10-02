import type { MediaAsset } from "./MediaAsset";

/**
 * Association d'un `MediaAsset` à un Exercice, avec une position STABLE et
 * UNIQUE par Exercice (plan §3.3/§13). Aucun `UNIQUE` sur l'Exercice seul, ni
 * enum fermée, ni liaison obligatoire à un écran/player : plusieurs médias
 * DISTINCTS peuvent coexister pour un même Exercice, condition nécessaire à
 * une future extension additive de variantes (référençant `assetId`) sans
 * jamais modifier les identités existantes. PRE-1 ne conçoit ni ne développe
 * ces variantes.
 */
export type ActivityMedia = {
  readonly id: string;
  readonly activityDefinitionId: string;
  readonly assetId: string;
  readonly position: number;
};

export type ActivityMediaWithAsset = ActivityMedia & { readonly asset: MediaAsset };

/** Positions stables : jamais deux médias au même rang pour un même Exercice (les positions d'Exercices distincts sont indépendantes). */
export function hasStablePositions(items: readonly ActivityMedia[]): boolean {
  const seenByActivity = new Map<string, Set<number>>();
  for (const item of items) {
    const seen = seenByActivity.get(item.activityDefinitionId) ?? new Set<number>();
    if (seen.has(item.position)) {
      return false;
    }
    seen.add(item.position);
    seenByActivity.set(item.activityDefinitionId, seen);
  }
  return true;
}

/** Médias d'un Exercice donné, ordonnés par position croissante. */
export function orderActivityMedia(
  items: readonly ActivityMediaWithAsset[],
  activityDefinitionId: string,
): readonly ActivityMediaWithAsset[] {
  return items
    .filter((item) => item.activityDefinitionId === activityDefinitionId)
    .slice()
    .sort((a, b) => a.position - b.position);
}
