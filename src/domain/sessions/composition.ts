/**
 * Opérations métier PURES de réorganisation d'une Composition (T02-S01,
 * CE-T02-01/CE-T02-02, D-124/D-127/D-129).
 *
 * Aucune dépendance React Native, Expo ou SQLite : ce module manipule
 * uniquement la collection ordonnée `SessionDraft.exercises` et retourne une
 * NOUVELLE collection — il ne persiste jamais rien. Conformément à
 * `API-COM-06`, déplacement, duplication et suppression restent des
 * opérations de BROUILLON : elles ne deviennent persistantes qu'à
 * l'enregistrement final de la Séance.
 *
 * **Positions** : `SessionDraft.exercises` ne porte aucun champ `position`.
 * Le rang d'une Activité DANS SA ZONE est dérivé de son ordre dans cette
 * collection au moment de la conversion (`toCreateSessionInput` /
 * `toUpdateSessionInput`) — la « renumérotation continue par zone » exigée
 * par CE-T02-01 est donc obtenue par construction, jamais par un champ à
 * tenir cohérent.
 */

import type { StructuralPosition } from "./Session";
import type { SessionDraftExercise } from "./SessionDraft";
import type { SideMode } from "./sideMode";

/** Ordre canonique d'affichage et d'exécution des trois zones (D-061). */
export const STRUCTURAL_ZONES = ["BEFORE_TOUR", "IN_TOUR", "AFTER_TOUR"] as const;

export type CompositionZones = {
  readonly beforeTour: readonly SessionDraftExercise[];
  readonly inTour: readonly SessionDraftExercise[];
  readonly afterTour: readonly SessionDraftExercise[];
};

/**
 * Regroupe les Activités du brouillon par zone structurelle, en conservant
 * dans chaque zone l'ordre relatif de la collection source — cet ordre EST
 * l'ordre d'affichage et le rang persisté.
 */
export function groupActivitiesByZone(
  activities: readonly SessionDraftExercise[],
): CompositionZones {
  const beforeTour: SessionDraftExercise[] = [];
  const inTour: SessionDraftExercise[] = [];
  const afterTour: SessionDraftExercise[] = [];

  for (const activity of activities) {
    if (activity.structuralPosition === "BEFORE_TOUR") {
      beforeTour.push(activity);
    } else if (activity.structuralPosition === "AFTER_TOUR") {
      afterTour.push(activity);
    } else {
      inTour.push(activity);
    }
  }

  return { beforeTour, inTour, afterTour };
}

/**
 * V2-BILAT-01 : direction propre à appliquer à une Activité DÉPLACÉE ou
 * INSÉRÉE vers `targetZone` (`moveActivity`/`appendActivityAfterLastDisplayed`
 * ci-dessous). Une Activité qui ENTRE dans le Tour alors que celui-ci est
 * déjà bilatéral doit y arriver `UNILATERAL` — comme tout autre enfant
 * `IN_TOUR` sous un Tour bilatéral (`applyTourSideModeTransition`), jamais
 * avec une direction propre résiduelle qu'aucun contrôle n'aurait jamais
 * laissé saisir pendant qu'elle était gouvernée par le Tour. Toute autre
 * destination (`BEFORE_TOUR`/`AFTER_TOUR`, ou `IN_TOUR` d'un Tour
 * unilatéral) conserve la direction propre inchangée.
 */
function resolveDisplacedSideMode(
  sideMode: SideMode,
  targetZone: StructuralPosition,
  tourSideMode: SideMode,
): SideMode {
  return targetZone === "IN_TOUR" && tourSideMode !== "UNILATERAL" ? "UNILATERAL" : sideMode;
}

/**
 * Ajoute une NOUVELLE Activité immédiatement APRÈS la DERNIÈRE CARTE
 * ACTUELLEMENT AFFICHÉE, dont elle reprend la zone structurelle (T02-S02,
 * troisième recette visuelle, point 1).
 *
 * **Le placement est décidé au moment de l'ajout, jamais à l'ouverture de
 * l'écran.** La zone portée par le brouillon local — figée au montage par
 * `createExerciseDraft` — n'est PAS consultée : seule compte la Composition
 * telle qu'elle est affichée à l'instant où l'utilisateur termine sa
 * création. C'est ce qui rend le résultat conforme à ce que l'utilisateur
 * voit :
 *
 * | Dernière carte affichée | Nouvelle Activité |
 * | --- | --- |
 * | `BEFORE_TOUR` | juste après elle, donc avant le Tour |
 * | `IN_TOUR` | juste après elle, donc dernière du Tour |
 * | `AFTER_TOUR` | juste après elle, donc avant `Fin de séance` |
 *
 * « Dernière carte affichée » est bien celle de l'ORDRE DE LECTURE
 * (`orderActivitiesByZone`), pas celle de la fin du tableau : la collection
 * n'est pas nécessairement contiguë par zone — `moveActivity` la réordonne —
 * et `[in-1, before-1]` est une Composition parfaitement légitime, dont la
 * dernière carte affichée est `in-1`.
 *
 * L'insertion se fait ensuite juste après cette Activité DANS LA COLLECTION :
 * la nouvelle devient ainsi la dernière de sa zone, donc la dernière
 * affichée. Une Composition encore vide conserve la zone par défaut de
 * l'Activité fournie.
 */
export function appendActivityAfterLastDisplayed(
  activities: readonly SessionDraftExercise[],
  activity: SessionDraftExercise,
  tourSideMode: SideMode = "UNILATERAL",
): readonly SessionDraftExercise[] {
  const displayed = orderActivitiesByZone(activities);
  const lastDisplayed = displayed[displayed.length - 1];

  if (lastDisplayed === undefined) {
    return [
      {
        ...activity,
        sideMode: resolveDisplacedSideMode(
          activity.sideMode,
          activity.structuralPosition,
          tourSideMode,
        ),
      },
    ];
  }

  const anchorIndex = activities.indexOf(lastDisplayed);
  const next = [...activities];
  next.splice(anchorIndex + 1, 0, {
    ...activity,
    structuralPosition: lastDisplayed.structuralPosition,
    sideMode: resolveDisplacedSideMode(
      activity.sideMode,
      lastDisplayed.structuralPosition,
      tourSideMode,
    ),
  });
  return next;
}

/** Activités d'une seule zone, dans l'ordre (raccourci de `groupActivitiesByZone`). */
export function activitiesInZone(
  activities: readonly SessionDraftExercise[],
  zone: StructuralPosition,
): readonly SessionDraftExercise[] {
  return activities.filter((activity) => activity.structuralPosition === zone);
}

/**
 * Collection à plat normalisée dans l'ordre structurel réel (avant → dans →
 * après le Tour). Une Activité ajoutée en fin de collection dans une zone
 * antérieure reste correctement placée à l'affichage sans cette
 * normalisation (l'affichage regroupe par zone) : cette fonction sert aux
 * opérations qui doivent produire une collection déjà cohérente de bout en
 * bout, jamais à réordonner une Séance persistée à la lecture.
 */
export function orderActivitiesByZone(
  activities: readonly SessionDraftExercise[],
): readonly SessionDraftExercise[] {
  const zones = groupActivitiesByZone(activities);
  return [...zones.beforeTour, ...zones.inTour, ...zones.afterTour];
}

/**
 * Déplace une Activité vers `targetZone` à l'indice `targetIndex` DANS cette
 * zone (CE-T02-01) — intra-zone comme inter-zones.
 *
 * L'identifiant et TOUS les paramètres de l'Activité sont conservés ; seule
 * `structuralPosition` change lorsque la zone change. Aucune Activité n'est
 * créée, dupliquée ni perdue. `targetIndex` est borné à la taille réelle de
 * la zone de destination (une dépose au-delà de la dernière carte place
 * l'Activité en fin de zone). Un identifiant inconnu retourne la collection
 * inchangée — une dépose sans cible valide ne modifie jamais le brouillon.
 *
 * **V2-BILAT-01** : `tourSideMode` (défaut `UNILATERAL`, comportement
 * antérieur inchangé) est la direction ACTUELLE du Tour. Une Activité
 * déposée dans `IN_TOUR` alors que le Tour est déjà bilatéral y arrive
 * `UNILATERAL` (`resolveDisplacedSideMode`) — jamais avec une direction
 * propre résiduelle qui contredirait « enfant … proprement `UNILATERAL` »
 * sous un Tour bilatéral. Toute autre dépose conserve la direction propre
 * de l'Activité.
 */
export function moveActivity(
  activities: readonly SessionDraftExercise[],
  activityId: string,
  targetZone: StructuralPosition,
  targetIndex: number,
  tourSideMode: SideMode = "UNILATERAL",
): readonly SessionDraftExercise[] {
  const source = activities.find((activity) => activity.id === activityId);
  if (source === undefined) {
    return activities;
  }

  const remaining = activities.filter((activity) => activity.id !== activityId);
  const zones: Record<StructuralPosition, SessionDraftExercise[]> = {
    BEFORE_TOUR: [],
    IN_TOUR: [],
    AFTER_TOUR: [],
  };
  for (const activity of remaining) {
    zones[activity.structuralPosition].push(activity);
  }

  const displacedSideMode = resolveDisplacedSideMode(source.sideMode, targetZone, tourSideMode);
  const moved =
    source.structuralPosition === targetZone && source.sideMode === displacedSideMode
      ? source
      : { ...source, structuralPosition: targetZone, sideMode: displacedSideMode };

  const destination = zones[targetZone];
  const index = Number.isFinite(targetIndex) ? Math.trunc(targetIndex) : destination.length;
  destination.splice(Math.max(0, Math.min(index, destination.length)), 0, moved);

  return [...zones.BEFORE_TOUR, ...zones.IN_TOUR, ...zones.AFTER_TOUR];
}

/**
 * Retire UNIQUEMENT l'Activité visée du brouillon (CE-T02-01). Les autres
 * Activités conservent leur identifiant, leurs paramètres et leur ordre
 * relatif ; la zone concernée est renumérotée par construction (voir la note
 * de tête). Un identifiant inconnu retourne la collection inchangée.
 */
export function removeActivity(
  activities: readonly SessionDraftExercise[],
  activityId: string,
): readonly SessionDraftExercise[] {
  if (!activities.some((activity) => activity.id === activityId)) {
    return activities;
  }
  return activities.filter((activity) => activity.id !== activityId);
}

/**
 * Duplique une Activité (D-138, révisant D-124 ; CE-T02-01) : la copie est
 * INDÉPENDANTE, porte `newId` (fourni par l'appelant — ce module reste pur,
 * sans `expo-crypto`), reprend TOUS les paramètres et associations de la
 * source — Pause, **Récupération attachée** et **direction (`sideMode`,
 * V2-BILAT-01) comprises** — et s'insère
 * IMMÉDIATEMENT APRÈS elle dans la MÊME zone structurelle.
 *
 * **T02-S02 — titre strictement identique.** La copie conserve le nom exact
 * de la source ; aucun suffixe n'est appliqué. `D-124` prescrivait
 * `{nom} (copie)`, puis `{nom} (copie 2)`… mais elle est explicitement
 * marquée « Révisée par D-138 » dans le Registre, et `D-138` — la décision
 * qui la remplace — ne réintroduit AUCUNE règle de renommage : elle pose au
 * contraire que « la Récupération appartient à l'Activité et forme avec elle
 * un bloc indivisible pour la Composition, la copie, la duplication… ». La
 * copie est donc rigoureusement identique à sa source, à l'identifiant près.
 * L'ancienne fonction `nextCopyName` est supprimée plutôt que laissée sans
 * consommateur. Écart documentaire disclosé dans le rapport de mission :
 * `13 – Contrats d'écran.md` (CE-T02-01) porte encore la formulation
 * suffixée de D-124, non mise à jour après la publication de D-138.
 *
 * La source reste inchangée. Un identifiant inconnu retourne la collection
 * inchangée.
 */
export function duplicateActivity(
  activities: readonly SessionDraftExercise[],
  activityId: string,
  newId: string,
): readonly SessionDraftExercise[] {
  const index = activities.findIndex((activity) => activity.id === activityId);
  if (index === -1) {
    return activities;
  }

  const source = activities[index]!;
  const copy: SessionDraftExercise = {
    ...source,
    id: newId,
    // Les Zones corporelles sont recopiées comme une NOUVELLE collection :
    // la copie ne doit jamais partager la référence de tableau de sa source.
    bodyZoneIds: [...source.bodyZoneIds],
  };

  const next = [...activities];
  next.splice(index + 1, 0, copy);
  return next;
}
