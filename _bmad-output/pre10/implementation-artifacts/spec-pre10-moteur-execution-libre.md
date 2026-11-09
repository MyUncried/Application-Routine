# PRE-10 — Moteur d'exécution commun et Exécution Libre (spec du lot)

Mission de Hermann du 09/11/2026 : « Analyse de l'architecture du moteur d'exécution et développement de PRE-10 ». Référence : `docs/preparation/moteur-execution/KODJO-Conception-moteur-execution-consolidee-2026-11-02.md` (actualisée au 05/11), §18 PRE-10.1 à PRE-10.3. Base : `main` = `901d7b4c` (PR #420, PRE-9 recetté à `03163de3`, aucun écart de code). Rapport de mission : `.github/orchestration/reports/2026-11-09_PRE10_MOTEUR_EXECUTION_LIBRE.md`.

## Livré

| Sous-étape | Modules | Point d'entrée |
|---|---|---|
| PRE-10.1 noyau | `src/domain/execution/plan.ts`, `kernel.ts`, `projection.ts`, `signals.ts`, `results.ts`, `checkpoint.ts`, `testing/` | `compileExecutablePlan(snapshot)`, `transition(env, state, event, readingMs)`, `projectExecution(plan, state, atMs)` |
| PRE-10.2 runtime | `src/features/execution/ExecutionService.ts`, `src/domain/execution/ExecutionRepository.ts`, `src/infrastructure/database/migrations/migration024.ts`, `SqliteExecutionRepository.ts`, `src/infrastructure/haptics/ExecutionSignalAdapter.ts` | `ExecutionService.prepare/start/dispatch/retry/onForeground/pulse/findRecovery/resumeRecovered/stopRecovered` |
| PRE-10.3 Exécution Libre | `app/execution.tsx`, `ExecutionScreen.tsx`, `ExecutionDialog.tsx`, `ExecutionRecoveryGate.tsx`, Démarrer du Catalogue des séances (`SessionCatalogueList`, `CatalogueScreen`) | Démarrer → `/execution?sessionId=…` |

## Synchronisation code / documentation (règle permanente)

| Comportement | Classe | Règle / document |
|---|---|---|
| Plan : Séries, Pauses (dernière comprise), Pause entre les côtés, substitution de la dernière Pause par la Récupération, Points d'arrêt, Cycle × Circuit groupé/alterné | A | ch09 « Plan d'exécution », D-248, RM-252, D.1 |
| Fin automatique en Durée chiffrée seulement ; Suivant en Répétitions et À l'échec ; confirmation et `Partielle` avant le terme | A | ch08 « Exécution », D-111, CE-EXEC-SESSION-01 |
| Réinitialiser : Série (unilatéral), bloc du côté courant depuis sa première Série (bilatéral côté par côté), phase courante en récupération ; temps actif cumulé conservé | A | RM-062, D-029, D-150 |
| Pause / Reprendre / Arrêter (seulement depuis la Pause) ; Point d'arrêt attendu jusqu'à Continuer | A | ch08, CE-EXEC-SESSION-01, RM-219 |
| Pause de sécurité 30 min après nominal (cadence) / 2 h sans interaction | A | RM-068, RM-069, R-03 |
| Arrière-plan : reconstruction aux échéances logiques, aucun son rattrapé ; interruption du processus : Reprendre / Arrêter ; sans continuité : étape en cours, en pause | A | RM-066, RM-067, §12.33, Q6 |
| Progression RM-077, durée estimée exacte / ≈ / ≥ | A | RM-077, RM-126, CE |
| Démarrer actif sur une Séance active | A | D-504 ; D-506 (« désactivé tant que l'écran d'Exécution n'existe pas ») — condition levée |
| Formats spécialisés non lançables (message), Tabata / 30-30 / départs rapides exécutés comme éléments libres | A | FMT-28, conception §18, D.3/D.4 |
| `executionAvailable` vrai pour les éléments libres (D.3) ; tables `executions` / `execution_results` (migration 024) | D | conception §15, ch12 §12.10 |
| Sons et Annonces : interrupteurs présents, aucune restitution sonore (aucune bibliothèque audio/voix installée) ; signaux restitués par vibration fonctionnelle | C | ch08 « Guidage sonore », ch12 §12.11 — À CLARIFIER |

Documents normatifs modifiés : aucun. Les mises à jour prévues par la conception §21 (ch12 §12.9/§12.10, ch09, ch10) attendent la validation de la conception ; elles ne sont pas appliquées.

## À CLARIFIER (n'empêchent que l'opération concernée)

1. **Suivant pendant le Compte à rebours initial et la Fin de séance** : aucune règle. Comportement livré : passage immédiat de la phase, sans confirmation ni résultat d'Exercice (le compte à rebours restant n'est pas un Exercice).
2. **Réinitialiser pendant une Pause entre Séries** (`SERIES_PAUSE`) : RM-062 ne cite que les récupérations. Livré : la Pause courante recommence (comme une récupération). Réinitialiser est indisponible pendant le Compte à rebours, la Fin de séance et un Point d'arrêt.
3. **Bilatéral en alternance par série (`BY_SERIES`)** : « bloc du côté courant depuis sa première Série » ne se transpose pas sans rejouer l'autre côté. Livré : seule la Série-côté courante recommence (D-150 : « ne touche que le côté courant »).
4. **Attente d'un Point d'arrêt et durée réelle** : ch09 exclut « uniquement » la Pause manuelle ; ch10 exclut l'attente des durées *prévues*. Livré : le temps de Séance (durée réelle) continue pendant l'attente ; la progression ne l'utilise pas.
5. **Fin minimale** : libellés « Séance terminée / partiellement exécutée / interrompue » et liste des Exercices exécutés, sans Figma de référence ; la Synthèse (Ressenti, Commentaire) relève d'une tranche ultérieure.
6. **Son et voix** : `expo-audio` / `expo-speech` absents ; leur ajout exige une nouvelle version native. Décision de Hermann attendue (ajout maintenant ou après le spike RT-001/P6).
