/**
 * Bilatéralité (V2-BILAT-01, plan `.github/orchestration/v2-slices/V2-BILAT-01/
 * technical-plan.md`) : configuration du côté d'exécution d'une occurrence
 * d'Activité de Séance et du Tour, préalable à T03 (aucune donnée
 * d'Exécution ni de Résultat n'est modélisée ici).
 *
 * `SideMode` est un enum à trois valeurs, entièrement gouverné par
 * l'interface (un contrôle cyclique, jamais une saisie libre) :
 *
 * - `UNILATERAL` — un seul côté, aucune répétition (comportement historique,
 *   valeur par défaut) ;
 * - `RIGHT_LEFT` — bilatéral, droite puis gauche (« D→G ») ;
 * - `LEFT_RIGHT` — bilatéral, gauche puis droite (« G→D »).
 *
 * Ce module centralise le cycle des trois états, le multiplicateur de durée
 * qui en découle et la résolution de la direction EFFECTIVE d'une Activité
 * du Tour (la direction du Tour prévaut lorsqu'elle est bilatérale, sinon
 * chaque Activité conserve sa direction propre) — la seule implémentation de
 * ces règles, réutilisée par le Domaine, la présentation et la couche SQL
 * (dont la parité avec `sideMultiplier`/`resolveEffectiveSideMode` est
 * testée).
 */

import type { StructuralPosition } from "./Session";

export type SideMode = "UNILATERAL" | "RIGHT_LEFT" | "LEFT_RIGHT";

/** Ordre canonique des trois états — celui du cycle (`cycleSideMode`) et de toute énumération exhaustive. */
export const SIDE_MODES: readonly SideMode[] = ["UNILATERAL", "RIGHT_LEFT", "LEFT_RIGHT"];

export function isSideMode(value: unknown): value is SideMode {
  return typeof value === "string" && SIDE_MODES.includes(value as SideMode);
}

/**
 * Fait avancer le contrôle `Côtés` d'un cran (T02-S02… V2-BILAT-01, `## UI`
 * du plan) : `Unilatéral → D→G → G→D → Unilatéral`. Boucle indéfiniment —
 * jamais de valeur hors énumération en sortie, quelle que soit l'entrée
 * (une valeur déjà hors énumération retombe sur `UNILATERAL`, plutôt que de
 * propager une valeur invalide).
 */
export function cycleSideMode(current: SideMode): SideMode {
  const index = SIDE_MODES.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % SIDE_MODES.length;
  return SIDE_MODES[nextIndex]!;
}

/**
 * Multiplicateur de durée `L` d'une direction effective (plan `## Calculs`) :
 * `1` pour `UNILATERAL`, `2` pour toute direction bilatérale — jamais un
 * troisième palier, la Récupération et la direction elle-même (droite→gauche
 * ou gauche→droite) n'affectant jamais ce nombre.
 */
export function sideMultiplier(mode: SideMode): number {
  return mode === "UNILATERAL" ? 1 : 2;
}

/**
 * Direction EFFECTIVE d'une Activité DANS le Tour (plan `## Calculs`,
 * « dans le Tour, la direction du Tour prévaut lorsqu'elle est bilatérale,
 * sinon chaque Activité conserve sa direction propre ») : la direction du
 * Tour l'emporte dès qu'elle est bilatérale (`tourSideMode !==
 * "UNILATERAL"`), quelle que soit la direction PROPRE de l'Activité
 * (remise à `UNILATERAL` par `applyTourSideModeTransition` au moment de
 * l'activation — voir plus bas, jamais restaurée ensuite) ; sinon
 * l'Activité conserve sa propre direction.
 *
 * Les Activités `BEFORE_TOUR`/`AFTER_TOUR` n'appellent jamais cette
 * fonction avec un `tourSideMode` réel — elles utilisent toujours leur
 * côté PROPRE (appel équivalent à `resolveEffectiveSideMode(ownSideMode,
 * "UNILATERAL")`, qui retourne `ownSideMode` par construction).
 */
export function resolveEffectiveSideMode(
  activitySideMode: SideMode,
  tourSideMode: SideMode,
): SideMode {
  return tourSideMode === "UNILATERAL" ? activitySideMode : tourSideMode;
}

/** Une Activité suffisamment décrite pour appliquer la transition atomique ci-dessous — satisfaite par `Activity` comme par `SessionDraftExercise`. */
export type SideModeTransitionActivity = {
  readonly structuralPosition: StructuralPosition;
  readonly sideMode: SideMode;
};

/**
 * Transition atomique du Tour vers une nouvelle direction (plan `## UI`,
 * confirmation du dialogue de bilatéralité) : dès que `newTourSideMode` est
 * bilatéral, TOUTES les Activités `IN_TOUR` sont remises `UNILATERAL` en un
 * seul geste — « remise atomique des enfants `IN_TOUR` à `UNILATERAL` » —
 * puisque leur direction propre devient sans effet (la direction du Tour
 * prévaut, `resolveEffectiveSideMode` ci-dessus) et que le contrôle enfant
 * devient visuellement désactivé, proprement `UNILATERAL` (jamais une
 * valeur résiduelle invisible).
 *
 * Un retour à `UNILATERAL` (Tour redevenu unilatéral) ne restaure RIEN :
 * les enfants restent tels qu'ils sont — déjà `UNILATERAL` depuis
 * l'activation — sans qu'aucune direction antérieure ne soit mémorisée ni
 * réappliquée (« Retour unilatéral sans restauration »).
 *
 * Activités `BEFORE_TOUR`/`AFTER_TOUR` : jamais concernées, quelle que soit
 * `newTourSideMode` — seules les Activités `IN_TOUR` sont gouvernées par le
 * Tour.
 *
 * Retourne la MÊME référence de tableau lorsqu'aucune Activité n'a besoin
 * d'être modifiée (Tour redevenu/resté `UNILATERAL`, ou déjà toutes
 * `UNILATERAL`) — jamais une copie superflue.
 */
export function applyTourSideModeTransition<T extends SideModeTransitionActivity>(
  activities: readonly T[],
  newTourSideMode: SideMode,
): readonly T[] {
  if (newTourSideMode === "UNILATERAL") {
    return activities;
  }
  let changed = false;
  const next = activities.map((activity) => {
    if (activity.structuralPosition === "IN_TOUR" && activity.sideMode !== "UNILATERAL") {
      changed = true;
      return { ...activity, sideMode: "UNILATERAL" as const };
    }
    return activity;
  });
  return changed ? next : activities;
}
