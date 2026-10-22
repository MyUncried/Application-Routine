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
  consecutiveStopPointPairs,
  hasUniquePositionPerScope,
  isCircuitHead,
  isStopPointAllowed,
  isStopPointPositionInRange,
  isStopPointProposable,
  occurrenceCountInScope,
  positionInSequence,
  scopeSequence,
  stopPointKey,
  type SequenceItem,
  type StopPoint,
  type StopPointLocation,
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
 * PRE-6 (story 1.2, AD-36 ; story 6.1, D-436, RM-251) : état de Composition
 * porté ENSEMBLE par le brouillon — occurrences et Points d'arrêt. Aucune
 * opération ne modifie l'entrée ; un état inchangé est l'entrée elle-même
 * (même référence), et une liste de points inchangée garde sa référence.
 *
 * **D-436 (remplace ARB-3)** : les opérations raisonnent sur la séquence
 * mêlée de chaque portée (`scopeSequence`) ; déplacer, dupliquer ou
 * supprimer une occurrence laisse chaque point à SA place dans cette
 * séquence (il ne suit plus l'occurrence qui le précédait) et recalcule sa
 * `position`. La collection `exercises` reste produite par les opérations
 * historiques (`moveActivity`, `removeActivity`, `duplicateActivity`,
 * inchangées). Une opération invalide est REFUSÉE sans mutation : aucun
 * point n'est déplacé ni supprimé pour la rendre valide (`judge`).
 */
export type CompositionState = {
  readonly exercises: readonly SessionDraftExercise[];
  readonly stopPoints: readonly StopPoint[];
};

/**
 * Raison d'un refus (annonce d'accessibilité de l'écran, story 6.3) :
 * - `STOP_POINT_NOT_ALLOWED` : un point deviendrait interdit (juste après le
 *   compte à rebours, juste avant la Fin, RM-219), arriverait en tête de
 *   Circuit, ou le Circuit serait vidé alors qu'il porte un point — ou, pour
 *   un déplacement autonome, la cible n'est pas proposable ;
 * - `CONSECUTIVE_STOP_POINTS` : deux points se suivraient sans Exercice
 *   entre eux (RM-251) ;
 * - `LOCATION_OCCUPIED` : deux points se retrouveraient sur le même
 *   emplacement `(scope, position)` ;
 * - `AT_BOUNDARY` : « Monter » / « Descendre » sans élément voisin (début ou
 *   fin de la Séance).
 */
export type CompositionRefusalReason =
  | "STOP_POINT_NOT_ALLOWED"
  | "CONSECUTIVE_STOP_POINTS"
  | "LOCATION_OCCUPIED"
  | "AT_BOUNDARY";

/**
 * Résultat discriminé d'une opération de Composition (convention du Domaine,
 * `SessionRepository.ts`) : appliquée (nouvel état, ou l'entrée elle-même si
 * rien ne change), élément introuvable, ou refusée — avec les points en
 * cause. Aucune de ces issues n'est une exception.
 */
export type CompositionOutcome =
  | { readonly status: "APPLIED"; readonly state: CompositionState }
  | { readonly status: "NOT_FOUND" }
  | {
      readonly status: "REFUSED";
      readonly reason: CompositionRefusalReason;
      readonly stopPointIds: readonly string[];
    };

/** Sens d'un pas « Monter » / « Descendre » (`stepOccurrence`). */
export type OccurrenceStepDirection = "UP" | "DOWN";

type CompositionItem = SequenceItem<SessionDraftExercise, StopPoint>;
type CompositionSequences = Record<StructuralPosition, CompositionItem[]>;

/** Séquences mêlées (copies modifiables) des trois portées. */
function sequencesOf(state: CompositionState): CompositionSequences {
  return {
    BEFORE_TOUR: [...scopeSequence(state.exercises, state.stopPoints, "BEFORE_TOUR")],
    IN_TOUR: [...scopeSequence(state.exercises, state.stopPoints, "IN_TOUR")],
    AFTER_TOUR: [...scopeSequence(state.exercises, state.stopPoints, "AFTER_TOUR")],
  };
}

/**
 * Points relus sur les séquences : `scope` = portée de la séquence,
 * `position` = occurrences qui les précèdent. Ordre et identité des points
 * conservés ; liste inchangée → même référence. Un point hérité hors bornes
 * ou de `position` non entière AVANT l'opération est laissé intact (valeur
 * d'origine, jamais bornée).
 */
function stopPointsFromSequences(
  before: CompositionState,
  sequences: CompositionSequences,
): readonly StopPoint[] {
  const locationOf = new Map<StopPoint, StopPointLocation>();
  for (const zone of STRUCTURAL_ZONES) {
    let preceding = 0;
    for (const item of sequences[zone]) {
      if (item.kind === "OCCURRENCE") {
        preceding += 1;
      } else {
        locationOf.set(item.point, { scope: zone, position: preceding });
      }
    }
  }
  let changed = false;
  const next = before.stopPoints.map((point) => {
    const location = locationOf.get(point);
    if (
      location === undefined ||
      !isStopPointPositionInRange(before.exercises, point) ||
      (location.scope === point.scope && location.position === point.position)
    ) {
      return point;
    }
    changed = true;
    return { ...point, scope: location.scope, position: location.position };
  });
  return changed ? next : before.stopPoints;
}

/**
 * Clé d'une paire consécutive : identifiants SEULS — une paire héritée simplement
 * renumérotée par une opération sans rapport reste la même (revue 6.1, séances héritées).
 */
function pairKey(first: StopPoint, second: StopPoint): string {
  return [first.id, second.id].sort().join("|");
}

function refused(reason: CompositionRefusalReason, points: readonly StopPoint[]): CompositionOutcome {
  return { status: "REFUSED", reason, stopPointIds: [...new Set(points.map((point) => point.id))] };
}

/**
 * Juge l'état produit par une opération (D-436, revue de la story 6.1), dans
 * cet ordre :
 * 1. le Circuit est vidé alors qu'il porte encore un point → refus ;
 * 2. un point devient interdit (RM-219 ; il ne l'était pas avant) → refus ;
 * 3. un point arrive en tête de Circuit `(IN, 0)` (il n'y était pas) → refus ;
 * 4. une paire consécutive (RM-251) apparaît → refus. Une paire déjà
 *    consécutive avant l'opération (mêmes identifiants, même si elle est
 *    renumérotée) est exemptée — donnée héritée ; aucune paire contenant
 *    `movedStopPointId` (déplacement autonome) ne l'est ;
 * 5. l'unicité `(scope, position)`, vraie avant, est perdue → refus
 *    (`LOCATION_OCCUPIED`) : deux points d'une paire héritée réunis sur un
 *    même emplacement sont refusés ici.
 */
function judge(
  before: CompositionState,
  after: CompositionState,
  movedStopPointId: string | null = null,
): CompositionOutcome {
  const circuitPoints = after.stopPoints.filter((point) => point.scope === "IN_TOUR");
  if (
    circuitPoints.length > 0 &&
    occurrenceCountInScope(before.exercises, "IN_TOUR") > 0 &&
    occurrenceCountInScope(after.exercises, "IN_TOUR") === 0
  ) {
    return refused("STOP_POINT_NOT_ALLOWED", circuitPoints);
  }

  const beforeById = new Map(before.stopPoints.map((point) => [point.id, point]));
  const newlyDisallowed = after.stopPoints.filter((point) => {
    const previous = beforeById.get(point.id);
    const wasAllowed = previous === undefined || isStopPointAllowed(before.exercises, previous);
    return wasAllowed && !isStopPointAllowed(after.exercises, point);
  });
  if (newlyDisallowed.length > 0) {
    return refused("STOP_POINT_NOT_ALLOWED", newlyDisallowed);
  }

  const newlyAtHead = after.stopPoints.filter((point) => {
    const previous = beforeById.get(point.id);
    return isCircuitHead(point) && (previous === undefined || !isCircuitHead(previous));
  });
  if (newlyAtHead.length > 0) {
    return refused("STOP_POINT_NOT_ALLOWED", newlyAtHead);
  }

  const exempted = new Set(
    consecutiveStopPointPairs(before.exercises, before.stopPoints)
      .filter(([first, second]) => first.id !== movedStopPointId && second.id !== movedStopPointId)
      .map(([first, second]) => pairKey(first, second)),
  );
  const newPairs = consecutiveStopPointPairs(after.exercises, after.stopPoints).filter(
    ([first, second]) => !exempted.has(pairKey(first, second)),
  );
  if (newPairs.length > 0) {
    return refused("CONSECUTIVE_STOP_POINTS", newPairs.flat());
  }

  if (hasUniquePositionPerScope(before.stopPoints) && !hasUniquePositionPerScope(after.stopPoints)) {
    const counts = new Map<string, number>();
    for (const point of after.stopPoints) {
      counts.set(stopPointKey(point), (counts.get(stopPointKey(point)) ?? 0) + 1);
    }
    return refused(
      "LOCATION_OCCUPIED",
      after.stopPoints.filter((point) => (counts.get(stopPointKey(point)) ?? 0) > 1),
    );
  }
  return { status: "APPLIED", state: after };
}

/** Raccourci des formes historiques : l'état appliqué, ou l'entrée elle-même (refus, introuvable). */
function stateOrUnchanged(outcome: CompositionOutcome, state: CompositionState): CompositionState {
  return outcome.status === "APPLIED" ? outcome.state : state;
}

/** Portée et rang de l'occurrence `activityId` dans les séquences mêlées, ou `null`. */
function locateInSequences(
  sequences: CompositionSequences,
  activityId: string,
): { readonly zone: StructuralPosition; readonly index: number } | null {
  for (const zone of STRUCTURAL_ZONES) {
    const index = sequences[zone].findIndex(
      (item) => item.kind === "OCCURRENCE" && item.occurrence.id === activityId,
    );
    if (index !== -1) {
      return { zone, index };
    }
  }
  return null;
}

/**
 * Story 6.1 (D-436, R1) : déplace une occurrence vers `targetZone`, au rang
 * `sequenceIndex` de la séquence MÊLÉE de cette portée (occurrences et
 * points). **Contrat de l'indice** : il est compté sur la séquence de la
 * portée cible DONT LA SOURCE EST DÉJÀ RETIRÉE (même convention que
 * `moveActivity`) ; l'occurrence est insérée à ce rang, avant l'élément qui
 * l'occupait. Borné à `0..longueur` (non fini : fin de portée). Ex. : `[A, P,
 * B, C]`, déplacer A au rang 2 de `[P, B, C]` → `[P, B, A, C]`.
 *
 * Revenir à la même place (même portée, même rang qu'avant le retrait) est un
 * non-déplacement : `APPLIED` avec l'entrée elle-même — aucun point ne change
 * de côté. Les points gardent leur place ; la récupération suit l'occurrence.
 * Refus sans mutation selon `judge`.
 */
export function moveOccurrenceInSequence(
  state: CompositionState,
  activityId: string,
  targetZone: StructuralPosition,
  sequenceIndex: number,
): CompositionOutcome {
  const source = state.exercises.find((activity) => activity.id === activityId);
  const sequences = sequencesOf(state);
  const origin = locateInSequences(sequences, activityId);
  if (source === undefined || origin === null) {
    return { status: "NOT_FOUND" };
  }
  sequences[origin.zone].splice(origin.index, 1);
  const target = sequences[targetZone];
  const index = Number.isFinite(sequenceIndex)
    ? Math.max(0, Math.min(Math.trunc(sequenceIndex), target.length))
    : target.length;
  if (targetZone === origin.zone && index === origin.index) {
    return { status: "APPLIED", state };
  }
  const occurrenceIndex = positionInSequence(target, index);
  const exercises = moveActivity(state.exercises, activityId, targetZone, occurrenceIndex);
  const moved = exercises.find((activity) => activity.id === activityId) ?? source;
  target.splice(index, 0, { kind: "OCCURRENCE", occurrence: moved });
  return judge(state, { exercises, stopPoints: stopPointsFromSequences(state, sequences) });
}

/**
 * Rang dans la séquence mêlée (source retirée) correspondant à l'indice
 * `targetIndex` EN OCCURRENCES de `moveActivity` — convention documentée de
 * la forme historique : l'occurrence est insérée juste après la
 * `targetIndex`-ième occurrence restante de la portée, donc AVANT le point
 * qui occupe l'emplacement visé (`targetIndex = 0` : en tête de portée,
 * avant un éventuel point de position 0). Indice borné comme `moveActivity`.
 */
function sequenceIndexForOccurrenceIndex(items: readonly CompositionItem[], targetIndex: number): number {
  const occurrenceCount = items.filter((item) => item.kind === "OCCURRENCE").length;
  const wanted = clampOccurrenceIndex(targetIndex, occurrenceCount);
  if (wanted === 0) {
    return 0;
  }
  let seen = 0;
  for (let index = 0; index < items.length; index += 1) {
    if (items[index]!.kind === "OCCURRENCE") {
      seen += 1;
      if (seen === wanted) {
        return index + 1;
      }
    }
  }
  return items.length;
}

function clampOccurrenceIndex(targetIndex: number, count: number): number {
  return Number.isFinite(targetIndex) ? Math.max(0, Math.min(Math.trunc(targetIndex), count)) : count;
}

/**
 * Story 6.1 (D-436) : `moveOccurrenceInSequence` exprimé avec l'indice EN
 * OCCURRENCES de la portée cible (forme historique, appel actuel de l'écran :
 * glisser et « Monter » / « Descendre ») — l'occurrence est insérée avant le
 * point qui occupe l'emplacement visé (`sequenceIndexForOccurrenceIndex`).
 * Même portée et même rang d'occurrence qu'avant : non-déplacement (`APPLIED`
 * avec l'entrée elle-même, aucun point ne change de côté).
 */
export function moveOccurrenceOutcome(
  state: CompositionState,
  activityId: string,
  targetZone: StructuralPosition,
  targetIndex: number,
): CompositionOutcome {
  const source = state.exercises.find((activity) => activity.id === activityId);
  if (source === undefined) {
    return { status: "NOT_FOUND" };
  }
  if (targetZone === source.structuralPosition) {
    const inZone = state.exercises.filter((activity) => activity.structuralPosition === targetZone);
    if (clampOccurrenceIndex(targetIndex, inZone.length - 1) === inZone.indexOf(source)) {
      return { status: "APPLIED", state };
    }
  }
  const sequences = sequencesOf(state);
  const origin = locateInSequences(sequences, activityId)!;
  sequences[origin.zone].splice(origin.index, 1);
  return moveOccurrenceInSequence(
    state,
    activityId,
    targetZone,
    sequenceIndexForOccurrenceIndex(sequences[targetZone], targetIndex),
  );
}

/**
 * Forme historique (story 1.2, appel actuel de l'écran) de
 * `moveOccurrenceOutcome` : l'état appliqué, ou l'entrée elle-même (même
 * référence) pour un refus ou un identifiant inconnu.
 */
export function moveOccurrence(
  state: CompositionState,
  activityId: string,
  targetZone: StructuralPosition,
  targetIndex: number,
): CompositionState {
  return stateOrUnchanged(moveOccurrenceOutcome(state, activityId, targetZone, targetIndex), state);
}

/**
 * Story 6.1 (D-436, CE-T03-08 §18) : « Monter » / « Descendre » d'une
 * occurrence — échange avec l'élément VOISIN de la séquence mêlée, point ou
 * occurrence. En limite de portée, l'occurrence franchit la limite comme
 * comme le faisait l'ancien pas de l'écran (story 2.3) : en montant, elle devient la
 * dernière de la portée précédente (après son éventuel point final) ; en
 * descendant, la première de la portée suivante (avant son éventuel point de
 * tête). Début ou fin de la Séance : refus `AT_BOUNDARY`. Mêmes refus que
 * `moveOccurrenceInSequence`. Branchement à l'écran : story 6.2.
 */
export function stepOccurrence(
  state: CompositionState,
  activityId: string,
  direction: OccurrenceStepDirection,
): CompositionOutcome {
  const sequences = sequencesOf(state);
  const origin = locateInSequences(sequences, activityId);
  if (origin === null) {
    return { status: "NOT_FOUND" };
  }
  const zoneIndex = STRUCTURAL_ZONES.indexOf(origin.zone);
  if (direction === "UP") {
    if (origin.index > 0) {
      return moveOccurrenceInSequence(state, activityId, origin.zone, origin.index - 1);
    }
    const previous = STRUCTURAL_ZONES[zoneIndex - 1];
    return previous === undefined
      ? { status: "REFUSED", reason: "AT_BOUNDARY", stopPointIds: [] }
      : moveOccurrenceInSequence(state, activityId, previous, sequences[previous].length);
  }
  if (origin.index < sequences[origin.zone].length - 1) {
    return moveOccurrenceInSequence(state, activityId, origin.zone, origin.index + 1);
  }
  const next = STRUCTURAL_ZONES[zoneIndex + 1];
  return next === undefined
    ? { status: "REFUSED", reason: "AT_BOUNDARY", stopPointIds: [] }
    : moveOccurrenceInSequence(state, activityId, next, 0);
}

/**
 * Story 6.1 (D-436) : supprime une occurrence (voir `removeActivity`) ; ses
 * voisins se resserrent, les points restent à leur place dans la séquence
 * (aucun n'est retiré). Refus sans mutation selon `judge` — p. ex. `[A, P,
 * B]`, supprimer A (P suivrait le compte à rebours) ou B (P précéderait la
 * Fin) ; `[A, P, B, Q, C]`, supprimer B (P, Q consécutifs). La raison sert à
 * l'annonce d'accessibilité (story 6.3).
 */
export function removeOccurrenceOutcome(state: CompositionState, activityId: string): CompositionOutcome {
  const exercises = removeActivity(state.exercises, activityId);
  if (exercises === state.exercises) {
    return { status: "NOT_FOUND" };
  }
  const sequences = sequencesOf(state);
  const origin = locateInSequences(sequences, activityId)!;
  sequences[origin.zone].splice(origin.index, 1);
  return judge(state, { exercises, stopPoints: stopPointsFromSequences(state, sequences) });
}

/** Forme historique de `removeOccurrenceOutcome` : l'état appliqué, ou l'entrée elle-même (refus, inconnu). */
export function removeOccurrence(state: CompositionState, activityId: string): CompositionState {
  return stateOrUnchanged(removeOccurrenceOutcome(state, activityId), state);
}

/**
 * Story 6.1 (D-436, arbitrage du 22/10/2026) : duplique une occurrence (voir
 * `duplicateActivity`, récupération copiée) ; la copie est insérée juste
 * après la source, AVANT le point qui la suivait (`[A, P, B]` →
 * `[A, A′, P, B]`) ; aucun point n'est copié. Insérer une occurrence juste
 * après une autre ne peut ni rendre un point interdit ni rapprocher deux
 * points : le refus est en pratique impossible, mais le jugement commun
 * s'applique quand même. Entrée invalide — `newId` déjà présent dans la
 * Composition : exception (convention du Domaine).
 */
export function duplicateOccurrenceOutcome(
  state: CompositionState,
  activityId: string,
  newId: string,
): CompositionOutcome {
  if (state.exercises.some((activity) => activity.id === newId)) {
    throw new Error(`duplicateOccurrenceOutcome : l'identifiant de copie « ${newId} » existe déjà dans la Composition.`);
  }
  const exercises = duplicateActivity(state.exercises, activityId, newId);
  if (exercises === state.exercises) {
    return { status: "NOT_FOUND" };
  }
  const copy = exercises.find((activity) => activity.id === newId)!;
  const sequences = sequencesOf(state);
  const origin = locateInSequences(sequences, activityId)!;
  sequences[origin.zone].splice(origin.index + 1, 0, { kind: "OCCURRENCE", occurrence: copy });
  return judge(state, { exercises, stopPoints: stopPointsFromSequences(state, sequences) });
}

/**
 * Forme historique de `duplicateOccurrenceOutcome`. Story 6.2 : le 4e paramètre
 * (identifiant du point copié, plus lu depuis D-436) est retiré avec l'appel de
 * l'écran.
 */
export function duplicateOccurrence(state: CompositionState, activityId: string, newId: string): CompositionState {
  return stateOrUnchanged(duplicateOccurrenceOutcome(state, activityId, newId), state);
}

/**
 * Story 6.1 (D-436, R2) : déplacement autonome d'un point vers `target`
 * (`position` = occurrences de la portée cible qui le précèdent), identité
 * conservée. Refus sans mutation si la cible n'est pas proposable
 * (`isStopPointProposable` : hors bornes, juste après le compte à rebours,
 * juste avant la Fin, tête de Circuit), si elle porte déjà un autre point,
 * ou si le point y serait consécutif à un autre (RM-251 ; aucune paire qui
 * le contient n'est exemptée). Cible égale à l'emplacement actuel : l'entrée
 * elle-même.
 */
export function moveStopPoint(
  state: CompositionState,
  stopPointId: string,
  target: StopPointLocation,
): CompositionOutcome {
  const point = state.stopPoints.find((candidate) => candidate.id === stopPointId);
  if (point === undefined) {
    return { status: "NOT_FOUND" };
  }
  if (point.scope === target.scope && point.position === target.position) {
    return { status: "APPLIED", state };
  }
  if (!isStopPointProposable(state.exercises, target)) {
    return refused("STOP_POINT_NOT_ALLOWED", [point]);
  }
  const occupant = state.stopPoints.find(
    (candidate) => candidate.id !== stopPointId && stopPointKey(candidate) === stopPointKey(target),
  );
  if (occupant !== undefined) {
    return refused("LOCATION_OCCUPIED", [point, occupant]);
  }
  const stopPoints = state.stopPoints.map((candidate) =>
    candidate === point ? { ...point, scope: target.scope, position: target.position } : candidate,
  );
  return judge(state, { exercises: state.exercises, stopPoints }, stopPointId);
}
