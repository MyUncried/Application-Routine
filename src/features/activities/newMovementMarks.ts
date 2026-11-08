import { useSyncExternalStore } from "react";

/**
 * D-510 (Hermann, 06/11/2026 ; `docs/KODJO-Badge-Nouveau-catalogue-mouvements-2026-11-06.md`) — marquage « New » des fiches
 * Mouvement créées. État d'affichage du moment, en mémoire : rien n'est écrit en base ni dans un stockage durable, et tout
 * disparaît à la fermeture de l'application (règle 4).
 *
 * Cycle de vie :
 * - une création effective (bouton +, Ajouter un niveau, duplication, enregistrement d'une Séance qui crée une fiche depuis la
 *   Composition) appelle `markMovementCreated` (règle 1) ;
 * - le catalogue des mouvements affiché déclare les marques qu'il montre (`noteNewMovementsDisplayed`) : une fiche créée
 *   ailleurs (Composition) n'est marquée « vue » qu'à la visite suivante du catalogue (règle 2) ;
 * - quitter la vue Mouvements (onglets du haut, barre du bas) retire les marques déjà affichées (règle 3) ; ouvrir une fiche
 *   et revenir ne les retire pas ; plusieurs fiches peuvent être marquées en même temps (règle 5) ;
 * - la dernière création non encore atteinte sert de cible au défilement du retour dans le catalogue (règle 8).
 */
type Snapshot = {
  readonly ids: ReadonlySet<string>;
  /** Dernière fiche créée vers laquelle la liste ne s'est pas encore positionnée. */
  readonly scrollTarget: string | null;
};

const EMPTY: Snapshot = { ids: new Set(), scrollTarget: null };
let snapshot: Snapshot = EMPTY;
let displayed = new Set<string>();
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

/** Règle 1 : une fiche vient d'être créée (identifiant enregistré). */
export function markMovementCreated(id: string): void {
  const ids = new Set(snapshot.ids);
  ids.add(id);
  publish({ ids, scrollTarget: id });
}

/** Règle 2 : la vue Mouvements du catalogue est affichée avec les marques courantes. */
export function noteNewMovementsDisplayed(): void {
  for (const id of snapshot.ids) displayed.add(id);
}

/** Règle 3 : la vue Mouvements est quittée — les marques déjà montrées disparaissent ; celles jamais montrées restent. */
export function clearDisplayedNewMovements(): void {
  if (displayed.size === 0) return;
  const ids = new Set([...snapshot.ids].filter((id) => !displayed.has(id)));
  displayed = new Set();
  const scrollTarget = snapshot.scrollTarget !== null && ids.has(snapshot.scrollTarget) ? snapshot.scrollTarget : null;
  publish(ids.size === 0 && scrollTarget === null ? EMPTY : { ids, scrollTarget });
}

/** Règle 8 : la liste s'est positionnée sur la cible (ou la cible n'est pas affichable) — plus de défilement à faire. */
export function consumeNewMovementScrollTarget(id: string): void {
  if (snapshot.scrollTarget !== id) return;
  publish({ ids: snapshot.ids, scrollTarget: null });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function current(): Snapshot {
  return snapshot;
}

/** Marques courantes, pour le catalogue des mouvements. */
export function useNewMovementMarks(): Snapshot {
  return useSyncExternalStore(subscribe, current, current);
}

/** Tests : état initial (l'application vient d'être ouverte). */
export function resetNewMovementMarks(): void {
  displayed = new Set();
  publish(EMPTY);
}
