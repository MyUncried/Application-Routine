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

import { cloneExecutionParameters } from "@/domain/activities/ExecutionParameters";

import type { StructuralPosition } from "./Session";
import type { SessionDraftExercise } from "./SessionDraft";
import {
  anchorStopPoints,
  isStopPointAllowed,
  reattachStopPoints,
  type AnchoredStopPoint,
  type StopPoint,
} from "./StopPoint";
import { NAME_MAX_LENGTH, normalizeName } from "./validation";

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
): readonly SessionDraftExercise[] {
  const displayed = orderActivitiesByZone(activities);
  const lastDisplayed = displayed[displayed.length - 1];

  if (lastDisplayed === undefined) {
    return [activity];
  }

  const anchorIndex = activities.indexOf(lastDisplayed);
  const next = [...activities];
  next.splice(anchorIndex + 1, 0, {
    ...activity,
    structuralPosition: lastDisplayed.structuralPosition,
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
 * V2-PRE-1 (plan §3.3) : le Circuit (Tour) n'a plus aucune influence
 * fonctionnelle sur la direction — une Activité déposée dans n'importe
 * quelle zone conserve toujours sa direction propre inchangée.
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
    source.structuralPosition === targetZone ? source : { ...source, structuralPosition: targetZone };

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

/** Mot du suffixe de copie (D-124) : donnée du nom de l'occurrence, persistée avec lui. */
const COPY_SUFFIX_WORD = "copie";

/**
 * Premier nom de copie disponible (D-124, RM-021, ch13 « Consultation et
 * modification d'un Exercice », PRE-6 story 2.3) : `{nom} (copie)`, puis
 * `{nom} (copie 2)`, `{nom} (copie 3)`… sans collision avec `takenNames`
 * (les noms de la Composition). `{nom}` est le nom de la source, sans retrait
 * d'un suffixe existant (aucune règle ne le prévoit).
 *
 * Les noms sont comparés normalisés (`normalizeName`, comme à
 * l'enregistrement) ; la base est tronquée (points de code) pour que le nom
 * complet tienne dans `NAME_MAX_LENGTH` — sans quoi la Séance ne pourrait
 * plus être enregistrée.
 */
export function nextCopyName(name: string, takenNames: Iterable<string>): string {
  const taken = new Set(Array.from(takenNames, normalizeName));
  const base = Array.from(normalizeName(name));
  for (let rank = 1; ; rank += 1) {
    const suffix = rank === 1 ? ` (${COPY_SUFFIX_WORD})` : ` (${COPY_SUFFIX_WORD} ${rank})`;
    const head = base.slice(0, Math.max(NAME_MAX_LENGTH - Array.from(suffix).length, 0)).join("").trimEnd();
    const candidate = `${head}${suffix}`;
    if (!taken.has(normalizeName(candidate))) {
      return candidate;
    }
  }
}

/**
 * Duplique une Activité (D-124, D-138 ; CE-T02-01) : la copie est
 * INDÉPENDANTE, porte `newId` (fourni par l'appelant — ce module reste pur,
 * sans `expo-crypto`), reprend TOUS les paramètres et associations de la
 * source — Pause, **Récupération attachée** et **direction (`sideMode`,
 * V2-BILAT-01) comprises** — et s'insère
 * IMMÉDIATEMENT APRÈS elle dans la MÊME zone structurelle.
 *
 * **PRE-6 (story 2.3) — suffixe de copie rétabli.** T02-S02 avait retiré le
 * suffixe en lisant D-138 comme remplaçant la règle de nommage de D-124. Le
 * contrat d'écran actif (ch13 « Consultation et modification d'un
 * Exercice »), RM-021 et la spec de la story 2.3 posent `{nom} (copie)`, puis
 * `{nom} (copie 2)`…, sans collision : la copie reçoit `nextCopyName` sur les
 * noms de la Composition. D-138 (bloc indivisible avec la Récupération) reste
 * respectée : hors nom et identifiant, la copie est identique à sa source.
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
    name: nextCopyName(
      source.name,
      activities.map((activity) => activity.name),
    ),
    // Les Zones corporelles sont recopiées comme une NOUVELLE collection :
    // la copie ne doit jamais partager la référence de tableau de sa source.
    bodyZoneIds: [...source.bodyZoneIds],
    // PRE-3 (P3-18) : duplication COMPLÈTE et indépendante — paramètres
    // canoniques clonés en profondeur, Catégorie, médias dans le même ordre
    // (mêmes fichiers physiques ; de nouveaux liens seront créés pour la
    // copie à l'enregistrement). La Récupération existante est conservée.
    executionParameters: cloneExecutionParameters(source.executionParameters),
    ...(source.media ? { media: source.media.map((item) => ({ assetId: item.assetId, asset: { ...item.asset } })) } : {}),
  };

  const next = [...activities];
  next.splice(index + 1, 0, copy);
  return next;
}

/**
 * PRE-6 (story 1.2, AD-36, ARB-3) : état de Composition porté ENSEMBLE par
 * le brouillon — occurrences et Points d'arrêt. Les opérations ci-dessous
 * délèguent aux opérations historiques sur les occurrences
 * (`moveActivity`, `removeActivity`, `duplicateActivity`, inchangées) puis
 * recalculent les points d'après leur occurrence d'attache
 * (`anchorStopPoints` / `reattachStopPoints`). Aucune opération ne modifie
 * l'entrée ; un résultat inchangé est l'entrée elle-même (même référence).
 */
export type CompositionState = {
  readonly exercises: readonly SessionDraftExercise[];
  readonly stopPoints: readonly StopPoint[];
};

/** Identifiants des points déjà sur un emplacement interdit ou hors bornes : une opération ne les juge pas (elle ne les a pas créés). */
function disallowedStopPointIds(state: CompositionState): ReadonlySet<string> {
  return new Set(
    state.stopPoints.filter((point) => !isStopPointAllowed(state.exercises, point)).map((point) => point.id),
  );
}

/** Points devenus interdits par l'opération (ils étaient autorisés avant). */
function isNewlyDisallowed(
  point: StopPoint,
  exercises: readonly SessionDraftExercise[],
  previouslyDisallowed: ReadonlySet<string>,
): boolean {
  return !previouslyDisallowed.has(point.id) && !isStopPointAllowed(exercises, point);
}

/**
 * Déplace une occurrence (voir `moveActivity`) ; ses points la suivent
 * (nouvelle portée, nouvel emplacement), les autres suivent leur propre
 * occurrence. Un déplacement qui amènerait un point sur un emplacement
 * interdit (RM-219) est un dépôt invalide : l'état est retourné inchangé
 * (même référence), comme toute dépose sans cible valide.
 */
export function moveOccurrence(
  state: CompositionState,
  activityId: string,
  targetZone: StructuralPosition,
  targetIndex: number,
): CompositionState {
  const exercises = moveActivity(state.exercises, activityId, targetZone, targetIndex);
  if (exercises === state.exercises) {
    return state;
  }
  if (state.stopPoints.length === 0) {
    return { exercises, stopPoints: state.stopPoints };
  }
  const previouslyDisallowed = disallowedStopPointIds(state);
  const stopPoints = reattachStopPoints(exercises, anchorStopPoints(state.exercises, state.stopPoints));
  if (stopPoints.some((point) => isNewlyDisallowed(point, exercises, previouslyDisallowed))) {
    return state;
  }
  return { exercises, stopPoints };
}

/**
 * Supprime une occurrence (voir `removeActivity`) : les points qui lui sont
 * rattachés sont retirés avec elle ; un autre point que la suppression
 * laisserait sur un emplacement interdit est retiré aussi (ARB-3, aucun
 * blocage nouveau).
 */
export function removeOccurrence(state: CompositionState, activityId: string): CompositionState {
  const exercises = removeActivity(state.exercises, activityId);
  if (exercises === state.exercises) {
    return state;
  }
  if (state.stopPoints.length === 0) {
    return { exercises, stopPoints: state.stopPoints };
  }
  const previouslyDisallowed = disallowedStopPointIds(state);
  const stopPoints = reattachStopPoints(
    exercises,
    anchorStopPoints(state.exercises, state.stopPoints),
  ).filter((point) => !isNewlyDisallowed(point, exercises, previouslyDisallowed));
  return { exercises, stopPoints };
}

/**
 * Duplique une occurrence (voir `duplicateActivity`) : la copie reçoit une
 * copie du point rattaché à la source, d'identifiant `newStopPointId`
 * (fourni par l'appelant, ce module reste pur), juste après elle. L'unicité
 * par emplacement garantit au plus un point rattaché par occurrence ; un
 * éventuel second point (donnée déjà invalide) n'est pas copié.
 */
export function duplicateOccurrence(
  state: CompositionState,
  activityId: string,
  newId: string,
  newStopPointId: string,
): CompositionState {
  const exercises = duplicateActivity(state.exercises, activityId, newId);
  if (exercises === state.exercises) {
    return state;
  }
  if (state.stopPoints.length === 0) {
    return { exercises, stopPoints: state.stopPoints };
  }
  const anchored: AnchoredStopPoint[] = [];
  let copied = false;
  for (const item of anchorStopPoints(state.exercises, state.stopPoints)) {
    anchored.push(item);
    if (!copied && item.anchorId === activityId) {
      anchored.push({ point: { ...item.point, id: newStopPointId }, anchorId: newId });
      copied = true;
    }
  }
  return { exercises, stopPoints: reattachStopPoints(exercises, anchored) };
}
