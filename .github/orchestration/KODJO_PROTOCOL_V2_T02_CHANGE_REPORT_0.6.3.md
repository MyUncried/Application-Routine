# Rapport de correction ciblée KODJO V2 — incident T02

Version : 0.6.3  
Date : 2026-09-07

## Résultat

La spécification distingue désormais explicitement l’échec des contrôles de la perte d’une implémentation. La livraison est figée et vérifiée avant Jest, TypeScript, lint et contrôle de périmètre. Le run peut rester rouge, mais un correctif récupérable conserve un statut métier exploitable et un chemin de reprise ciblée.

## Fichiers produits ou modifiés

- `KODJO_PROTOCOL_V2_SPEC_0.6.3.md` : règles normatives, états, contrats, reprise et tests.
- `KODJO_PROTOCOL_V2_IMPLEMENTATION_WORKFLOW_REFERENCE_0.6.3.yml` : modèle GitHub Actions sans droit de commit/push.
- `KODJO_PROTOCOL_V2_T02_TEST_MATRIX_0.6.3.md` : scénarios et oracles obligatoires.
- `KODJO_PROTOCOL_V2_T02_CHANGE_REPORT_0.6.3.md` : présent rapport.

## Sections concernées

- §1.2 et §1.2-A : troisième workflow borné et frontière distant/local.
- §3 : principes 28 à 32, dont l’invariant de préservation.
- §4.7 : barrière de conservation avant contrôles.
- §5.2-A, §5.3 et §5.6 : statuts métier, transition de reprise et parcours.
- §6.1, §6.7, §6.13-B, §6.13-C et §6.14 : environnement éphémère, manifeste, artefact, commentaire et reprise.
- §13.4 et §13.6 : tests négatifs et critères d’activation.
- §15, §20 et §21 : critères de conception, livrables et conclusion adaptés.

## Invariants ajoutés

1. Toute modification produite est préservée avant une opération susceptible d’échouer.
2. L’échec d’un contrôle bloque la validation, pas la récupération.
3. Le patch couvre le delta complet, nouveaux fichiers compris, et est validé sur un espace vierge au `source_head`.
4. Publication de l’artefact et commentaire sont indépendants ; leur échec ne déclenche aucun nouvel appel IA.
5. La reprise `TARGETED_FIX` réutilise l’artefact et reste bornée aux erreurs attestées.
6. Seul `/Dev` peut appliquer durablement, vérifier, committer et pousser le changement fonctionnel.

## Scénarios couverts par le contrat

Jest en échec, TypeScript en échec, contrôle de périmètre en échec, nouveau fichier non suivi, commentaire en échec, reprise ciblée cumulative, préservation invalide et tentative distante de commit/push.

## Résultats

- Cohérence documentaire et présence des contrats : à vérifier sur les fichiers livrés.
- Exécution des workflows et tests dans le dépôt applicatif : `NON VÉRIFIABLE`, car le dépôt et ses scripts n’étaient pas fournis dans cet espace.
- Absence de `git commit`/`git push` dans le modèle de workflow : exigence de conception ; le modèle utilise `contents: read` et `persist-credentials: false`.

## Points restant à arbitrer

Aucun arbitrage d’architecture n’est requis. Lors de l’intégration au dépôt, il faudra seulement renseigner les commandes réelles de Jest, TypeScript, lint, scope, le numéro d’Issue et la durée de rétention de l’artefact. Ces paramètres d’exploitation ne remettent pas en cause les invariants.
