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
 * Insère une NOUVELLE Activité immédiatement APRÈS la dernière Activité déjà
 * présente dans SA PROPRE zone structurelle (T02-S02, continuation après
 * recette visuelle).
 *
 * Ajouter en fin de collection — comportement précédent — plaçait une
 * nouvelle Activité `BEFORE_TOUR` derrière les Activités `IN_TOUR` et
 * `AFTER_TOUR` déjà composées : son rang DANS SA ZONE restait correct, mais
 * l'ordre de la collection cessait de refléter l'ordre structurel affiché, et
 * toute lecture linéaire du brouillon (tests, futurs consommateurs) devenait
 * trompeuse. L'insertion par zone rétablit l'invariant « ordre de la
 * collection = ordre de lecture de la Composition ».
 *
 * Zone encore vide : l'Activité est insérée AVANT la première Activité d'une
 * zone postérieure (ordre canonique `STRUCTURAL_ZONES`), et en fin de
 * collection s'il n'en existe aucune. Une Activité déjà présente (même `id`)
 * n'est jamais dupliquée — l'appelant gère la modification séparément.
 */
export function insertActivityInZone(
  activities: readonly SessionDraftExercise[],
  activity: SessionDraftExercise,
): readonly SessionDraftExercise[] {
  const zoneRank = (zone: StructuralPosition): number => STRUCTURAL_ZONES.indexOf(zone);
  const targetRank = zoneRank(activity.structuralPosition);

  // **Règle principale** : juste après la DERNIÈRE Activité de la même zone.
  //
  // Cette recherche par la fin remplace celle, indirecte, de la première
  // Activité d'une zone postérieure — qui présupposait une collection
  // CONTIGUË par zone. Or elle ne l'est pas nécessairement : déplacer une
  // Activité (`moveActivity`) réordonne la collection, et une Composition
  // comme `[in-1, before-1]` est parfaitement légitime. L'ancienne règle
  // insérait alors la nouvelle Activité `BEFORE_TOUR` juste avant `in-1`,
  // donc AVANT `before-1` — elle apparaissait en tête de sa zone,
  // immédiatement sous le `Compte à rebours initial`, au lieu d'en fermer la
  // liste. Chercher la dernière de sa propre zone est vrai quelle que soit
  // la disposition de la collection.
  let lastIndexInZone = -1;
  for (let index = activities.length - 1; index >= 0; index -= 1) {
    if (activities[index]!.structuralPosition === activity.structuralPosition) {
      lastIndexInZone = index;
      break;
    }
  }
  if (lastIndexInZone !== -1) {
    const next = [...activities];
    next.splice(lastIndexInZone + 1, 0, activity);
    return next;
  }

  // **Zone encore vide** : aucune Activité de référence — l'Activité se place
  // avant la première d'une zone STRICTEMENT postérieure, et en fin de
  // collection s'il n'en existe aucune.
  const firstLaterZoneIndex = activities.findIndex(
    (existing) => zoneRank(existing.structuralPosition) > targetRank,
  );

  const next = [...activities];
  next.splice(firstLaterZoneIndex === -1 ? next.length : firstLaterZoneIndex, 0, activity);
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
 */
export function moveActivity(
  activities: readonly SessionDraftExercise[],
  activityId: string,
  targetZone: StructuralPosition,
  targetIndex: number,
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

  const moved =
    source.structuralPosition === targetZone
      ? source
      : { ...source, structuralPosition: targetZone };

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
 * source — Pause et **Récupération attachée** comprises — et s'insère
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
