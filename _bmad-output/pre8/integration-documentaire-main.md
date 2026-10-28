# PRE-8 — Intégration documentaire contrôlée de `main` (à réaliser avant la livraison finale)

Décision de Hermann du 28/10/2026 (Q-E0) :
- aucune fusion automatique de `main` dans `pre8-bmad/dev` pour synchroniser les documents ;
- avant la livraison finale de PRE-8, une intégration contrôlée conserve les modifications des deux branches et la traçabilité des décisions ;
- chaque conflit est résolu sur le fond, jamais par un choix systématique « ours » ou « theirs ».

**Base observée.** `origin/main` @ `ff7600ac`. Fusion simulée le 27/10 (`git merge-tree`) : 6 conflits documentaires, aucun conflit de code.
- `docs/DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md`
- ch06, ch07, ch10, ch12, ch13

## Corrections de fond déjà décidées, à porter dans les textes de `main`

### b8-3 — Rangs après archivage (Hermann, 28/10/2026, option A)

Les rangs affichés des membres actifs sont recalculés sans discontinuité après archivage ; restaurer réintègre le membre dans cette numérotation. Un membre archivé garde son rang dans la famille complète. Identité, appartenance et clé de tri sont inchangées. Le comportement livré est `MovementCatalogueService` et la fiche Mouvement (`displayedLevelPosition`) ; tests `movementLifecycle.b8.test.ts` et `MovementScreen.b2.integration.test.tsx` (« b8-3 »).

| Fichier sur `main` | Passage | Correction à apporter |
|---|---|---|
| ch09, « Réordonnancement des niveaux depuis le catalogue des mouvements — 27/10/2026 », règle 8 | « Archiver ou restaurer un membre conserve son appartenance et sa clé de tri ; ces opérations ne modifient pas les niveaux. » | Conserver appartenance et clé de tri. Remplacer « ces opérations ne modifient pas les niveaux » par la règle b8-3 : les rangs affichés des actifs sont recalculés sur les seuls actifs ; un archivé garde son rang dans la famille complète. Mention « [remplacé par b8-3, 28/10/2026] » sur le texte d'origine, conservé pour la traçabilité |
| ch09, même section, paragraphe suivant | « Le calcul porte sur la famille complète, membres archivés compris, avant filtrage. » | Préciser : vrai pour le filtrage et pour le rang d'un archivé ; les rangs des actifs se calculent sur les actifs (b8-3) |
| ch07, « Précision de D-439 et D-448 point 9 », paragraphe des clarifications | « Archivage, restauration et filtrage ne changent pas les niveaux » | Limiter au filtrage ; renvoyer à b8-3 pour l'archivage et la restauration |
| ch07, tableau de traçabilité, ligne « 8. Archivage et filtres » | Statut « clos sur ces effets » | Ajouter « rangs après archivage et restauration remplacés par b8-3 (28/10/2026) » |

La partie filtres de la règle 8 (« un filtre masque des membres sans recalculer les niveaux des membres visibles ») reste valable et conforme au code.

### Autres points relevés pendant la préparation de l'epic E

- **ch13 de `main`.** Le tableau ancien « Champs et comportements des fonctionnalités — Catalogue de séances » (Toutes, Planifiées, Non planifiées, Archivées) est à aligner sur CE-T03-01 révisé (Statut Actives / Archivées), après validation de Q-E3.
- **Chaque conflit** est résolu en gardant les décisions des deux branches et leurs sources. La résolution est consignée dans le rapport de mission de l'intégration.
