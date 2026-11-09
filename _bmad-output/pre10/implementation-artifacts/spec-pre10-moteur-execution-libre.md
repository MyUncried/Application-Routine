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

## Recette iPhone n° 1 du 09/11/2026 — corrections

Source : cahier en ligne https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq (verdicts et notes de Hermann), relevé le 09/11/2026.

| Constat (note de Hermann) | Cause | Correction | Classe | Documents |
|---|---|---|---|---|
| m-reset-serie g/h/i : « Appuyer sur "Réinitialiser l'exercice" puis "Annuler" ou "Reprendre" fige les boutons d'action » ; reload : écran toujours figé ; seule la fermeture de l'application débloque. Constat c) : « Fermer n'a pas d'effet » sur « Séance terminée » (Recette B). | Après Annuler / Confirmer, le dialogue se fermait avant que la reprise soit enregistrée : la Séance, encore suspendue, faisait monter le dialogue de Pause dans la même image, puis le démontait. Deux `Modal` iOS montés / démontés à la fois laissent une présentation vide qui intercepte tous les touchers, y compris après un rechargement JavaScript. Le noyau et le service sont corrects (reproduction en test : reprise, commandes et réinitialisation conformes). | Un seul `Modal`, toujours monté pendant l'Exécution, dont `visible` et le contenu changent ; le dialogue reste affiché jusqu'à la fin de ses commandes, aucune Pause intercalée. Attribution du constat c) à la même cause : **plausible** (Recette B jouée après une réinitialisation), à confirmer sur iPhone. | D | aucun |
| m-suivant : « Il ne doit pas y avoir de message de confirmation pour les pauses ni la récupération. » | RM-065a demandait la confirmation pendant `SIDE_RECOVERY` / `POST_ACTIVITY_RECOVERY` ; le noyau l'appliquait aussi aux Pauses entre séries. | Confirmation pour un Exercice chronométré seulement (`needsNextConfirmation`) ; pauses et récupérations : passage direct, durée partielle conservée. | B | ch10 RM-065a, ch08 « Exercice suivant », ch11 API-EXE-05 (annotés « Remplacé le 09/11/2026 ») |
| m-suivant : « le chrono doit être arrêté pendant qu'un confirme le message (que dit la spécification ?) » | ch13 : la suspension n'est écrite que pour Réinitialiser ; pour Suivant, « Annuler ferme la modale et reprend l'Exercice en cours ». La modale ne suspendait pas l'Exécution. | La modale Suivant suspend l'Exécution (`PAUSE` motif `DIALOG`) ; Annuler reprend ; Confirmer reprend puis passe (Exercice `Partielle`). | B | ch13 « Confirmation — Passage à l'Exercice suivant » (précision datée) |
| a) « Parfois lors des comptes à rebours des secondes sont raccourcies […] notamment à 3 secondes de la fin. » | Rafraîchissement à pas fixe de 250 ms non aligné sur la seconde : une seconde affichée durait de 750 à 1 250 ms. Le temps du moteur était juste (durée totale conforme). | Rafraîchissement calé sur le prochain changement de seconde affichée (+ 20 ms), au plus 250 ms. | D | aucun |
| e) « information à suivre, mettre le numéro de série après le nom de l'exercice. » | — | « À suivre » : `Nom · Série n/N · cible ou durée`. | B | CE-EXEC-SESSION-01 sans règle de contenu pour « À suivre » ; décision recopiée ici |
| f) « Information A suivre "Point d'arrêt", remplacer par quelque chose comme "Arrêt de la séance, redémarrage manuel" » | — | « À suivre » d'un Point d'arrêt : « Arrêt de la séance, redémarrage manuel ». Le titre de l'étape reste « Point d'arrêt ». | B | décision recopiée ici |

Non corrigé, à arbitrer :

7. **b) « Le bouton réinitialisation n'est pas actif pendant le compte à rebours initial. »** Conforme au choix provisoire 2 ci-dessus (Réinitialiser indisponible pendant le Compte à rebours, la Fin de séance et un Point d'arrêt). Faut-il qu'il relance le Compte à rebours ?
8. **d) « Si un objectif en durée est inférieur à la durée totale des phases, il faut un message d'alerte. Si ce n'est pas un multiple il faut un message et demander s'il faut arrondir la valeur au multiple supérieur ou inférieur (appliquer le même mécanisme à la durée totale). »** Règle de la Composition (Paramètres d'exécution, phases du mouvement), hors du moteur PRE-10 : non implémentée dans ce lot. Décision recopiée ici pour un lot de la Composition ; libellés et place des messages à définir.
9. **i) Reprise après 3 minutes d'application fermée : « reprend l'exécution directement à l'écran de fin de la séance "Séance terminée" comme si tous les exercices avaient été exécutés. »** Le moteur applique la conception (§14.2, T09) : avec une heure fiable, Reprendre place la Séance là où le temps l'a menée ; les étapes chronométrées écoulées pendant l'absence sont acquises, une étape en Répétitions attend (vérifié en test sur une Séance identique à Recette B). Atteindre « Séance terminée » suppose que seules des étapes chronométrées restaient. Faut-il plutôt, après une fermeture de l'application, reprendre à l'étape interrompue, en pause, sans compter l'absence (comme la règle Q6) ?

### Arbitrages de Hermann du 09/11/2026 (réponses aux points 7 à 9)

Réponses textuelles : « 1. Non, il y a déjà le bouton pause 2. Oui 3. Oui ».

- **7 — Réinitialiser pendant le Compte à rebours** : « Non, il y a déjà le bouton pause ». Réinitialiser reste indisponible pendant le Compte à rebours initial (choix provisoire 2 confirmé sur ce point). Aucun changement.
- **8 — Alertes de durée des phases** : « Oui » à l'ouverture d'un lot Composition. Lot ouvert : `_bmad-output/composition-phases-duree/spec-composition-phases-duree.md`.
- **9 — Reprise après fermeture** : « Oui » à « après une fermeture de l'application, reprendre à l'étape interrompue, en pause, sans compter l'absence (comme la règle Q6) ». Implémenté : `resumeRecovered` et `stopRecovered` appliquent `restoreWithoutContinuity` quelle que soit la continuité de l'heure ; l'étape interrompue recommence à sa durée initiale à la reprise ; l'arrière-plan sans fermeture reste une réconciliation au temps logique (RM-067). Classe **B** : ch12 §12.33 précisé, conception consolidée §14.2 annotée (« Précisé le 09/11/2026 »). Test T09 remplacé en conséquence (`ExecutionService.pre10`).
