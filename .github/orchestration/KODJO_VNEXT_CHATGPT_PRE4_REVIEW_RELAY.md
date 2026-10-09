# PRE-4 — relais de revue du plan, pilote ChatGPT

Cette extension concerne exclusivement le VNext de `main`, piloté par ChatGPT. La variante Claude de #344 évolue séparément. Fusion autorisée par l’utilisateur le 9 octobre, après validation des correctifs parallèles ; ne pas utiliser cette extension avant clôture de PRE-3 (#340). La préparation du protocole n'active pas PRE-4 ; le démarrage demande une instruction utilisateur explicite.

## Responsabilités

ChatGPT prépare et publie la demande, récupère le résultat, traite les constats et conserve les trois décisions humaines (périmètre, plan, résultat). Claude est le reviewer indépendant en lecture seule. Le runner existant appelle Claude avec `vnext-live-chain.review`, sans nouvelle API ni changement de facturation. Le moteur et les contrôles VNext sont conservés.

L'utilisateur ne copie aucune commande, aucun identifiant, aucun JSON ou rapport entre conversations. Les commandes suivantes sont exécutées par le pilote, jamais proposées comme travail à l'utilisateur.

## Parcours nominal du pilote

1. Préparer le dossier `produced` avec les entrées VNext existantes ; committer le dossier complet, y compris les parts `vnext-file-bundle`. Conserver le commit exact.
2. Créer la demande avec `node scripts/kodjo/chatgpt-plan-review.js create <config> .github/orchestration/requests/vnext-plan-review`. La configuration contient `source_head`, `produced_file` et, en REVISION, `causal_file`. Le script dérive tranche, Issue, empreinte et nom du fichier ; il vérifie le dossier depuis les objets Git, sans appel IA.
3. Publier sur `main`, après autorisation de la phase, un commit contenant exclusivement l'ajout de cette demande. Le `push` déclenche `kodjo-vnext-chatgpt-plan-review.yml`. Un changement de protocole ou de produit dans ce commit est refusé. Une nouvelle publication de plan demande une nouvelle demande scellée ; aucune édition d'une demande existante.
4. Le runner vérifie son identité, le dépôt, la tête et la propreté du checkout, l'ascendance du dossier, la tranche exacte `VNEXT-PRE-4`, l'Issue ouverte et la clôture de #340. Le code exécuté provient du protocole de main ; le commit de demande sert aux données. PRE-3 et le pilote Claude sont refusés.
5. Le runner appelle le reviewer existant une seule fois. En REVISION, les quatre preuves causales (`base_plan`, `previous_review_report`, `allowed_change_set`, `revision_patch`) sont épinglées dans `causal_file` et leurs hashes/base sont contrôlés. Le handoff conserve les vérifications causales intégrales du moteur.
6. Le runner conserve réponse, reçu et diagnostic hors checkout, puis publie un artefact `vnext-chatgpt-review-<run>-<attempt>` avec `result.json`, `review-receipt.json`, `review-report.json`, `checkpoint.json` et les preuves du processus. La publication est tentée même après échec. Durée de rétention GitHub : 30 jours. ChatGPT archive le reçu vérifié dans le dossier Git de la tranche avant expiration.
7. ChatGPT lit le run et télécharge l'artefact via GitHub ; il contrôle la provenance du workflow/run et exécute `chatgpt-plan-review.js verify <demande> <résultat>` dans un checkout contenant les objets exacts. Un run vert seul n'est jamais une approbation. `REVISE` ou `CLARIFICATION_REQUIRED` reste un résultat de revue exploitable, puis suit la boucle causale existante ; aucun handoff ne découle d'un refus.
8. Après APPROVE, ChatGPT poursuit `prepare`, les validations causales, la porte humaine du plan et le handoff existants. Cette extension n'accorde aucune autorisation de développement.

## Reprise et coût

La réponse validée est conservée avant transport vers GitHub. Une reprise sur le même runner récupère le reçu ou revalide la réponse brute ; elle ne rappelle pas Claude pour republier un artefact. La demande et le dossier sont liés par hashes. Un intent créé de manière exclusive protège contre un double appel. Le verrou Claude existant, son PID/date et le contrôle des processus actifs sont réutilisés.

En l'absence de reçu/réponse après une tentative antérieure, la reprise bloque (`ORCHESTRATION_FAILURE`) : interruption ambiguë, quota, réponse invalide ou cache perdu ne provoquent pas un nouvel appel implicite. Le script consulte une fois l'historique paginé du workflow avant un premier appel, sans polling. Cette politique bloque également après une tentative antérieure échouée avant Claude si aucune preuve locale ne permet une reprise : diagnostic technique requis. Un redémarrage du runner n'efface normalement pas le cache persistant ; sa perte n'autorise pas à recommencer.

Un dispatch de récupération est possible sur main avec le même commit et chemin de demande. ChatGPT le réalise si son interface dispose de cette capacité. Sa disponibilité n'est pas supposée ; un défaut d'outil est un incident d'orchestration, jamais une demande de copier-coller à l'utilisateur.

## Portée et limites vérifiées

| Moment | Avec cette extension |
|---|---|
| Plan initial / plan révisé | Demande GitHub → runner → Claude → artefact GitHub → ChatGPT |
| Reprise de publication | Réutilisation de la réponse, sans second appel IA |
| Arbitrage et approbation du plan | Décision utilisateur ; traduction technique par ChatGPT |
| Développement, tests, revue d'implémentation, clôture | Entrées VNext existantes ; aucun nouveau mécanisme ajouté ici |
| Réveil de ChatGPT inactif | Non ajouté et non qualifié par cette extension |

La continuité V1.3 décrit un réveil historique par commit signal ; ce succès ne démontre pas son activation dans la conversation PRE-4. Au besoin, un simple « reprends PRE-4 » réveille le pilote, qui retrouve lui-même les preuves GitHub. L'objectif de cette livraison est de supprimer le transport manuel de la revue du plan. Le parcours complet et le premier appel réel Windows restent à constater après autorisation PRE-4.
