# domain/activities/testing

Outils de test du domaine des Activités, jamais importés par le code de production.

- `executionParametersFixtures.ts` — constructeurs de paramètres d'exécution typés (PRE-4, story 1.1) : `uniformParameters`, `variableParameters`, `durationParameters`, `repetitionParameters`, `allFailureParameters`, et `toTarget` (un nombre → Cible `NUMBER`, `"FAILURE"`, `"UNSET"`). Ils remplacent dans les fixtures les anciens champs scalaires (Mode, cible, N, Pause), retirés des types du domaine (AD-1, AD-3).
