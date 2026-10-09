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

/**
 * PRE-3 (D-333) : association ordonnée d'une OCCURRENCE de Séance — liens
 * distincts de ceux de la définition Catalogue (identités propres), même
 * fichier physique partagé. Retirer un lien ne supprime jamais l'asset.
 */
export type SessionActivityMedia = {
  readonly id: string;
  readonly activityId: string;
  readonly assetId: string;
  readonly position: number;
};

export type SessionActivityMediaWithAsset = SessionActivityMedia & { readonly asset: MediaAsset };

/**
 * Média ORDONNÉ d'un brouillon (définition ou occurrence) : l'ordre du
 * tableau est la position persistée. `asset` porte l'asset complet — déjà
 * persisté (réouverture, copie) ou fraîchement préparé par l'import (à créer
 * dans la même transaction que son propriétaire, jamais avant).
 */
export type DraftMediaItem = {
  readonly assetId: string;
  readonly asset: MediaAsset;
};

/**
 * Lien de média à persister (définition ou occurrence) : `asset` présent
 * pour un fichier fraîchement préparé (créé dans la même transaction que
 * son propriétaire) ou déjà connu (jamais réécrit). Même forme que
 * `CreateActivityMediaInput`.
 */
export type MediaLinkInput = {
  readonly assetId: string;
  readonly asset?: MediaAsset;
};

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

/** Projette des associations persistées (déjà ordonnées) vers des éléments de brouillon. */
export function toDraftMediaItems(
  items: readonly { readonly assetId: string; readonly asset: MediaAsset }[],
): readonly DraftMediaItem[] {
  return items.map((item) => ({ assetId: item.assetId, asset: { ...item.asset } }));
}

/** Égalité ordonnée de deux listes de médias de brouillon (garde d'abandon). */
export function draftMediaEqual(a: readonly DraftMediaItem[] | undefined, b: readonly DraftMediaItem[] | undefined): boolean {
  const left = a ?? [];
  const right = b ?? [];
  return left.length === right.length && left.every((item, index) => item.assetId === right[index]!.assetId);
}

/** Déplace un média (Monter/Descendre, D-335) ; indices hors bornes sans effet. */
export function moveDraftMedia(
  items: readonly DraftMediaItem[],
  from: number,
  to: number,
): readonly DraftMediaItem[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}
