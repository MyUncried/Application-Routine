/**
 * PRE-7 (A1.3, API-SEA-05, D-188, MFN-03, MFN/AC04) — duplication d'une
 * Séance : nouvelle Séance indépendante, brouillon de CRÉATION construit
 * depuis la Séance enregistrée (`toSessionDraft`).
 *
 * - nom `{nom} (copie)`, puis le premier suffixe numéroté disponible
 *   (`nextCopyName`, mêmes bornes que les noms d'Exercice) ;
 * - copie de l'Étiquette, de la Composition (occurrences, Récupérations,
 *   Circuit, Points d'arrêt) et des paramètres ; aucune Routine ni Exécution ;
 * - nouveaux identifiants d'occurrence (`newActivityId`, fourni par
 *   l'appelant : ce module reste pur) ; les identifiants de Séance, de Cycle,
 *   de Circuit, de Points d'arrêt et de liens de médias sont créés par
 *   l'enregistrement ;
 * - filiation (`sourceMovementId`) de chaque occurrence conservée à
 *   l'identique, jamais relue ni réécrite (MFN-03).
 *
 * Fonction pure — sans React, SQLite ni Expo.
 */

import { nextCopyName } from "./composition";
import type { Session } from "./Session";
import { toSessionDraft, type SessionDraft } from "./SessionDraft";

export function toDuplicateSessionDraft(
  session: Session,
  newActivityId: () => string,
  takenSessionNames: Iterable<string>,
): SessionDraft {
  const { persistedExerciseIds: _persisted, ...draft } = toSessionDraft(session);
  return {
    ...draft,
    // Création : aucune Séance source, aucune occurrence tenue pour existante.
    sourceSessionId: null,
    name: nextCopyName(session.name, takenSessionNames),
    exercises: draft.exercises.map((exercise) => ({ ...exercise, id: newActivityId() })),
  };
}
