import { draftMovementOf, type DraftMovement, type SessionDraft } from "../SessionDraft";

/**
 * Tests seulement (PRE-7, R-3, D-445 C05) — fait de chaque Exercice du brouillon
 * qui n'a pas encore de Mouvement une CRÉATION LOCALE terminée, comme l'éditeur
 * d'occurrence (`ExerciseScreen`) : `sourceMovementId` = identifiant de
 * l'occurrence, et un Mouvement `NEW` dans `draft.movements` tiré de sa vue
 * (`draftMovementOf`). Le Mouvement exige une Catégorie et au moins une Zone :
 * absentes de la vue, elles prennent `defaults` (appliqués aussi à la vue, pour
 * que l'occurrence affiche le contenu de son Mouvement). Les Exercices qui
 * référencent déjà un Mouvement (Catalogue, Séance relue, copie) sont
 * inchangés. Fonction pure.
 */
export function withLocalMovements(
  draft: SessionDraft,
  defaults: { readonly categoryId: string; readonly bodyZoneIds: readonly string[] } = {
    categoryId: "cardio",
    bodyZoneIds: ["cuisses"],
  },
): SessionDraft {
  const movements: Record<string, DraftMovement> = { ...(draft.movements ?? {}) };
  const exercises = draft.exercises.map((exercise) => {
    if (exercise.type !== "EXERCISE" || exercise.sourceMovementId !== undefined) {
      return exercise;
    }
    const local = {
      ...exercise,
      sourceMovementId: exercise.id,
      categoryId: exercise.categoryId ?? defaults.categoryId,
      bodyZoneIds: exercise.bodyZoneIds.length > 0 ? exercise.bodyZoneIds : [...defaults.bodyZoneIds],
    };
    movements[exercise.id] = draftMovementOf(local, "NEW");
    return local;
  });
  return { ...draft, exercises, movements };
}
