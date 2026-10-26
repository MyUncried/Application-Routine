# domain/sessions/testing

Outils de test du domaine des Séances, jamais importés par le code de production.

- `draftMovements.ts` — `withLocalMovements(draft, defaults?)` (PRE-7, R-3, D-445 C05) : fait de chaque Exercice du brouillon qui ne référence encore aucun Mouvement une création locale terminée, comme l'éditeur d'occurrence (`sourceMovementId` = identifiant de l'occurrence, Mouvement `NEW` dans `draft.movements` tiré de sa vue par `draftMovementOf`). Le Mouvement exigeant une Catégorie et au moins une Zone, celles qui manquent prennent `defaults` (`cardio`, `cuisses`), appliqués aussi à la vue. Les Exercices qui référencent déjà un Mouvement (Catalogue, Séance relue, copie) sont inchangés.
