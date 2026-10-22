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
  isStopPointAllowed,
  isStopPointPositionInRange,
  isStopPointProposable,
  occurrenceCountInScope,
  positionInSequence,
  scopeSequence,
  stopPointKey,
  structuralSequence,
  tourBoundaryConflict,
  tourBoundaryPoints,
  withoutStopPoints,
  type SequenceItem,
  type StopPoint,
  type StopPointLocation,
  type TourBoundaryChoice,
  type TourBoundaryConflict,
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
 * inchangées). Suppression, duplication et déplacement autonome d'un point :
 * une opération invalide est REFUSÉE sans mutation (`judge`).
 *
 * **D-437 (story 7.1)** :
 * - le DÉPLACEMENT d'une occurrence est TOLÉRANT (`settle`) : il est appliqué
 *   et les points en cause sont retirés — d'abord ceux devenus interdits,
 *   puis, itérativement, le second de chaque paire devenue consécutive (le
 *   premier est conservé) ; l'issue nomme les points retirés ;
 * - la tête de Circuit est autorisée et proposée ; à N ≥ 2
 *   (`tourRepeatCount`), début et fin de Tour échappent à RM-219, et une
 *   opération qui les ferait COEXISTER (conflit de Tour,
 *   `tourBoundaryConflict`) rend `CHOICE_REQUIRED` avec les deux résolutions,
 *   sans muter — sauf la suppression, qui garde le refus doux de D-436.
 */
export type CompositionState = {
  readonly exercises: readonly SessionDraftExercise[];
  readonly stopPoints: readonly StopPoint[];
  /**
   * Story 7.1 (D-437) : N du Circuit (`SessionDraft.tourRepeatCount`), contexte des règles
   * d'emplacement (`StopPointRules`) ; absent : 1. Jamais modifié par ces opérations : recopié tel
   * quel dans l'état produit.
   */
  readonly tourRepeatCount?: number;
};

/**
 * Raison d'un refus (annonce d'accessibilité de l'écran, story 6.3) :
 * - `STOP_POINT_NOT_ALLOWED` : un point deviendrait interdit (juste après le
 *   compte à rebours, juste avant la Fin, RM-219, N compris), ou le Circuit
 *   serait vidé alors qu'il porte un point — ou, pour un déplacement
 *   autonome, la cible n'est pas proposable ;
 * - `CONSECUTIVE_STOP_POINTS` : deux points se suivraient sans Exercice
 *   entre eux (RM-251) — story 7.1 : y compris entre deux Tours (conflit de
 *   Tour créé par une SUPPRESSION, D-437) ;
 * - `LOCATION_OCCUPIED` : deux points se retrouveraient sur le même
 *   emplacement `(scope, position)` (suppression, déplacement autonome ;
 *   jamais rendu par un déplacement d'occurrence depuis D-437) ;
 * - `AT_BOUNDARY` : « Monter » / « Descendre » sans élément voisin (début ou
 *   fin de la Séance).
 */
export type CompositionRefusalReason =
  | "STOP_POINT_NOT_ALLOWED"
  | "CONSECUTIVE_STOP_POINTS"
  | "LOCATION_OCCUPIED"
  | "AT_BOUNDARY";

/**
 * Story 7.1 (D-437) : état produit et points retirés pour l'obtenir (identifiants, ordre de
 * retrait) — résolution d'un conflit de Tour.
 */
export type CompositionResolution = {
  readonly state: CompositionState;
  readonly removedStopPointIds: readonly string[];
};

/**
 * Résultat discriminé d'une opération de Composition (convention du Domaine,
 * `SessionRepository.ts`) : appliquée (nouvel état, ou l'entrée elle-même si
 * rien ne change), élément introuvable, ou refusée — avec les points en
 * cause. Aucune de ces issues n'est une exception.
 *
 * Story 7.1 (D-437) :
 * - `APPLIED.removedStopPointIds` : points retirés par un déplacement
 *   tolérant d'occurrence (vide sinon), pour que l'écran ajuste focus et
 *   annonces ;
 * - `CHOICE_REQUIRED` : l'opération créerait un conflit de Tour (N ≥ 2, début
 *   et fin de Tour) ; rien n'est appliqué. `resolutions.HEAD` conserve le
 *   point de début (« Début de tour »), `resolutions.TAIL` celui de fin
 *   (« Fin de tour ») ; chacune est l'état complet À APPLIQUER, avec tous les
 *   points retirés (ceux du déplacement tolérant compris). « Annuler » :
 *   garder l'entrée.
 */
export type CompositionOutcome =
  | {
      readonly status: "APPLIED";
      readonly state: CompositionState;
      readonly removedStopPointIds: readonly string[];
    }
  | { readonly status: "NOT_FOUND" }
  | {
      readonly status: "REFUSED";
      readonly reason: CompositionRefusalReason;
      readonly stopPointIds: readonly string[];
    }
  | {
      readonly status: "CHOICE_REQUIRED";
      readonly conflict: TourBoundaryConflict;
      readonly resolutions: Readonly<Record<TourBoundaryChoice, CompositionResolution>>;
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

const NO_REMOVAL: readonly string[] = [];

function applied(state: CompositionState, removedStopPointIds: readonly string[] = NO_REMOVAL): CompositionOutcome {
  return { status: "APPLIED", state, removedStopPointIds };
}

/** Le Circuit, qui portait des occurrences, est vidé par l'opération. */
function circuitEmptied(before: CompositionState, after: CompositionState): boolean {
  return occurrenceCountInScope(before.exercises, "IN_TOUR") > 0 && occurrenceCountInScope(after.exercises, "IN_TOUR") === 0;
}

/**
 * Points de `after` devenus interdits (RM-219, N compris, `isStopPointAllowed`) : autorisés avant
 * l'opération (ou nouveaux) et plus après. Un point déjà interdit avant (donnée héritée) n'est pas
 * visé.
 */
function newlyDisallowedPoints(before: CompositionState, after: CompositionState, points: readonly StopPoint[]): readonly StopPoint[] {
  const beforeById = new Map(before.stopPoints.map((point) => [point.id, point]));
  return points.filter((point) => {
    const previous = beforeById.get(point.id);
    const wasAllowed = previous === undefined || isStopPointAllowed(before.exercises, previous, before);
    return wasAllowed && !isStopPointAllowed(after.exercises, point, after);
  });
}

/**
 * Paires consécutives exemptées (RM-251, revue 6.1) : celles déjà consécutives AVANT l'opération
 * (mêmes identifiants, même renumérotées) — données héritées ; aucune paire contenant
 * `movedStopPointId` (déplacement autonome) ne l'est.
 */
function exemptedPairs(before: CompositionState, movedStopPointId: string | null): ReadonlySet<string> {
  return new Set(
    consecutiveStopPointPairs(before.exercises, before.stopPoints)
      .filter(([first, second]) => first.id !== movedStopPointId && second.id !== movedStopPointId)
      .map(([first, second]) => pairKey(first, second)),
  );
}

/**
 * Story 7.1 (D-437) : conflit de Tour CRÉÉ par l'opération — présent après et absent avant.
 * Revue 7.1 : dès que début et fin de Tour étaient déjà tous deux occupés avant l'opération, le
 * conflit est hérité, quels que soient les points (p. ex. une fin de Tour déplacée vers une autre
 * fin de Tour). `null` sinon.
 */
function newTourConflict(
  before: CompositionState,
  after: CompositionState,
): { readonly head: StopPoint; readonly tail: StopPoint } | null {
  const conflict = tourBoundaryConflict(after.exercises, after.stopPoints, after);
  if (conflict === null) {
    return null;
  }
  return tourBoundaryConflict(before.exercises, before.stopPoints, before) === null ? conflict : null;
}

/**
 * Story 7.1 (D-437) : résout le conflit de Tour de `state` en conservant le point de début
 * (`HEAD`) ou de fin (`TAIL`) de Tour ; l'autre point du conflit est retiré. Sans conflit (N = 1,
 * l'un des deux absent) : l'entrée elle-même, rien de retiré. Fonction pure, utilisable sur tout
 * état (p. ex. un conflit hérité que l'écran voudrait faire trancher).
 */
export function resolveTourBoundaryConflict(state: CompositionState, keep: TourBoundaryChoice): CompositionResolution {
  const conflict = tourBoundaryConflict(state.exercises, state.stopPoints, state);
  if (conflict === null) {
    return { state, removedStopPointIds: NO_REMOVAL };
  }
  // Revue 7.1 : tous les points de la limite écartée (deux fins héritées, p. ex.), pas seulement celui du conflit.
  const dropped = tourBoundaryPoints(state.exercises, state.stopPoints, keep === "HEAD" ? "TAIL" : "HEAD").map(
    (point) => point.id,
  );
  return { state: { ...state, stopPoints: withoutStopPoints(state.stopPoints, dropped) }, removedStopPointIds: dropped };
}

/** Issue « choix requis » sur l'état `after` (non appliqué), points déjà retirés compris dans chaque résolution. */
function choiceRequired(
  after: CompositionState,
  conflict: { readonly head: StopPoint; readonly tail: StopPoint },
  removed: readonly string[],
): CompositionOutcome {
  const resolve = (keep: TourBoundaryChoice): CompositionResolution => {
    const resolution = resolveTourBoundaryConflict(after, keep);
    return { state: resolution.state, removedStopPointIds: [...removed, ...resolution.removedStopPointIds] };
  };
  return {
    status: "CHOICE_REQUIRED",
    conflict: { headStopPointId: conflict.head.id, tailStopPointId: conflict.tail.id },
    resolutions: { HEAD: resolve("HEAD"), TAIL: resolve("TAIL") },
  };
}

/**
 * Juge STRICT de l'état produit par une suppression, une duplication ou un déplacement autonome
 * de point (D-436, revue de la story 6.1 ; story 7.1, D-437), dans cet ordre :
 * 1. le Circuit est vidé alors qu'il porte encore un point → refus ;
 * 2. un point devient interdit (RM-219, N compris ; il ne l'était pas avant) → refus ;
 * 3. une paire consécutive (RM-251) apparaît → refus (paires héritées exemptées,
 *    `exemptedPairs`) ;
 * 4. l'unicité `(scope, position)`, vraie avant, est perdue → refus (`LOCATION_OCCUPIED`) : deux
 *    points d'une paire héritée réunis sur un même emplacement sont refusés ici ;
 * 5. story 7.1 : un conflit de Tour est créé (`newTourConflict`) → `onTourConflict` : `REFUSE`
 *    (suppression : refus doux de D-436, raison `CONSECUTIVE_STOP_POINTS` — les deux points se
 *    suivraient entre deux Tours) ou `CHOOSE` (déplacement autonome : `CHOICE_REQUIRED`).
 * Story 7.1 (D-437) : l'ancienne règle « un point arrive en tête de Circuit → refus » est retirée.
 */
function judge(
  before: CompositionState,
  after: CompositionState,
  movedStopPointId: string | null,
  onTourConflict: "REFUSE" | "CHOOSE",
): CompositionOutcome {
  const circuitPoints = after.stopPoints.filter((point) => point.scope === "IN_TOUR");
  if (circuitPoints.length > 0 && circuitEmptied(before, after)) {
    return refused("STOP_POINT_NOT_ALLOWED", circuitPoints);
  }

  const newlyDisallowed = newlyDisallowedPoints(before, after, after.stopPoints);
  if (newlyDisallowed.length > 0) {
    return refused("STOP_POINT_NOT_ALLOWED", newlyDisallowed);
  }

  const exempted = exemptedPairs(before, movedStopPointId);
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

  const conflict = newTourConflict(before, after);
  if (conflict !== null) {
    return onTourConflict === "REFUSE"
      ? refused("CONSECUTIVE_STOP_POINTS", [conflict.tail, conflict.head])
      : choiceRequired(after, conflict, NO_REMOVAL);
  }
  return applied(after);
}

/**
 * Story 7.1 (D-437) : règle TOLÉRANTE du déplacement d'une occurrence. L'état `after` (points
 * laissés à leur place dans la séquence) est appliqué ; les points en cause sont retirés, dans cet
 * ordre :
 * 1. le Circuit est vidé alors qu'il porte des points → ses points (interdits : plus aucun
 *    Exercice autour duquel s'arrêter dans le Circuit) ;
 * 2. points devenus interdits (RM-219, N compris, `newlyDisallowedPoints`) ;
 * 3. RM-251, itérativement : la première paire consécutive non exemptée de la séquence
 *    structurelle perd son SECOND point (le premier est conservé), jusqu'à n'en plus trouver ;
 *    les paires héritées (`exemptedPairs`) restent en place ;
 * 4. emplacement partagé `(scope, position)`, l'unicité étant vraie avant (seul cas : une paire
 *    héritée qu'une ancienne Récupération autonome séparait sur deux emplacements, réunie par le
 *    déplacement de celle-ci) → le second, dans l'ordre de la séquence. `LOCATION_OCCUPIED` n'est
 *    donc jamais rendu par un déplacement d'occurrence.
 * Puis, si un conflit de Tour est créé : `CHOICE_REQUIRED` (rien appliqué) ; sinon `APPLIED` avec
 * les identifiants retirés.
 */
function settle(before: CompositionState, after: CompositionState): CompositionOutcome {
  const removed: string[] = [];
  let points = after.stopPoints;
  const drop = (ids: readonly string[]) => {
    if (ids.length > 0) {
      removed.push(...ids);
      points = withoutStopPoints(points, ids);
    }
  };

  if (circuitEmptied(before, after)) {
    drop(points.filter((point) => point.scope === "IN_TOUR").map((point) => point.id));
  }
  drop(newlyDisallowedPoints(before, after, points).map((point) => point.id));

  const exempted = exemptedPairs(before, null);
  for (;;) {
    const pair = consecutiveStopPointPairs(after.exercises, points).find(
      ([first, second]) => !exempted.has(pairKey(first, second)),
    );
    if (pair === undefined) {
      break;
    }
    drop([pair[1].id]);
  }

  if (hasUniquePositionPerScope(before.stopPoints) && !hasUniquePositionPerScope(points)) {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const item of structuralSequence(after.exercises, points)) {
      if (item.kind === "STOP_POINT") {
        const key = stopPointKey(item.point);
        if (seen.has(key)) {
          duplicates.push(item.point.id);
        } else {
          seen.add(key);
        }
      }
    }
    drop(duplicates);
  }

  const state = points === after.stopPoints ? after : { ...after, stopPoints: points };
  const conflict = newTourConflict(before, state);
  return conflict === null ? applied(state, removed) : choiceRequired(state, conflict, removed);
}

/**
 * Raccourci des formes historiques : l'état appliqué, ou l'entrée elle-même (refus, introuvable,
 * et — story 7.1 — choix requis : rien n'est appliqué sans le choix de l'utilisateur).
 */
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
 *
 * Story 7.1 (D-437, remplace le refus de D-436) : le déplacement est TOLÉRANT
 * (`settle`) — jamais refusé pour un point interdit ou consécutif : il est
 * appliqué et les points en cause sont retirés (`removedStopPointIds`). Ex. :
 * `[A, P, B, Q, C]`, B déplacée après C → `[A, P, C, B]`, Q retiré (P
 * conservé). Un conflit de Tour créé rend `CHOICE_REQUIRED`.
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
    return applied(state);
  }
  const occurrenceIndex = positionInSequence(target, index);
  const exercises = moveActivity(state.exercises, activityId, targetZone, occurrenceIndex);
  const moved = exercises.find((activity) => activity.id === activityId) ?? source;
  target.splice(index, 0, { kind: "OCCURRENCE", occurrence: moved });
  return settle(state, { ...state, exercises, stopPoints: stopPointsFromSequences(state, sequences) });
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
      return applied(state);
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
 * tête). Début ou fin de la Séance : refus `AT_BOUNDARY`. Mêmes issues que
 * `moveOccurrenceInSequence` — story 7.1 (D-437) : tolérant, p. ex. `[A, P,
 * B]`, B monte au-dessus de P → `[A, B]`, P retiré (il précéderait la Fin).
 * Branchement à l'écran : story 6.2.
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
 * l'annonce d'accessibilité (story 6.3). Story 7.1 (D-437) : la suppression
 * GARDE ce refus doux (seul le déplacement devient tolérant) ; à N ≥ 2, une
 * suppression qui ferait coexister début et fin de Tour (`[A, P, B, Q]` dans
 * le Circuit, supprimer A) est refusée `CONSECUTIVE_STOP_POINTS` — les deux
 * points se suivraient entre deux Tours.
 */
export function removeOccurrenceOutcome(state: CompositionState, activityId: string): CompositionOutcome {
  const exercises = removeActivity(state.exercises, activityId);
  if (exercises === state.exercises) {
    return { status: "NOT_FOUND" };
  }
  const sequences = sequencesOf(state);
  const origin = locateInSequences(sequences, activityId)!;
  sequences[origin.zone].splice(origin.index, 1);
  return judge(state, { ...state, exercises, stopPoints: stopPointsFromSequences(state, sequences) }, null, "REFUSE");
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
  return judge(state, { ...state, exercises, stopPoints: stopPointsFromSequences(state, sequences) }, null, "REFUSE");
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
 * juste avant la Fin — story 7.1, D-437 : la tête de Circuit est proposable et,
 * à N ≥ 2, début et fin de Tour échappent à RM-219), si elle porte déjà un autre point,
 * ou si le point y serait consécutif à un autre (RM-251 ; aucune paire qui
 * le contient n'est exemptée). Cible égale à l'emplacement actuel : l'entrée
 * elle-même. Story 7.1 (D-437) : une dépose qui ferait coexister début et fin
 * de Tour à N ≥ 2 rend `CHOICE_REQUIRED` (`resolutions.HEAD` / `.TAIL`) ;
 * conserver l'autre point retire donc le point déplacé.
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
    return applied(state);
  }
  if (!isStopPointProposable(state.exercises, target, state)) {
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
  return judge(state, { ...state, stopPoints }, stopPointId, "CHOOSE");
}
