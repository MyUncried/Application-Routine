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

### Epic E — arbitrages du 28/10/2026 (ch07 de la branche, « PRE-8, epic E »)

| Fichier sur `main` | Formulation à remplacer | Remplacement |
|---|---|---|
| ch13 CE-T03-01 (révisé) | « La nouvelle logique de combinaison Catégories/Zones reste à rechercher dans les règles existantes ou à préciser pour cette story » | Q-E3 option B : caractéristiques agrégées, OU dans une section, ET entre sections, exercices éventuellement différents, Étiquette et Format de la Séance, Statut d'abord, bascule combinée |
| ch13 CE-T03-01 | Filtre étendu (« conserver les options ») ; état compact absent | Q-E4 : trois états du filtre, deux lignes si nécessaire, 44 × 44, réinitialisation sans toucher la bascule ; précision UX hors Figma |
| ch13 CE-T03-01 | Format : « le jeu final des vignettes de formats est une dépendance de livraison » | Q-E5 : vignettes visibles, Libre sélectionnable, autres désactivées jusqu'à leur développement |
| ch13 CE-T03-01 et ch07 « Catalogue des séances — carte unique et filtres » | « le catalogue autonome d'exercices est remplacé par la vue Un exercice » | Ajouter E.8-a : anciennes définitions conservées, consultables et modifiables par le parcours d'édition existant, depuis une commande Modifier de la sélection d'Exercices de la Composition (option 1, 28/10), jusqu'à la transition coordonnée avec l'epic C (E.8-b) |
| DSF-CATALOGUE-SEANCES-2026-10-27.md, « Vérification et limites » | « Les règles de sélection multiple […] ne sont pas précisées » | Renvoi à Q-E3 (option B) |
| preparation/catalogue-seances-2026-10-27/PERIMETRE-ET-PROMPT-BMAD.md | « proposition à faire valider : OU entre valeurs […], recherche sur l'ensemble des exercices » | Marquer « validée le 28/10 (Q-E3 option B) » |
| ch13, tableau ancien « Champs et comportements des fonctionnalités — Catalogue de séances » | Toutes, Planifiées, Non planifiées, Archivées ; « T03 n'invente aucune nouvelle option Filtrer » | Aligner sur CE-T03-01 révisé (Statut Actives / Archivées, sections du panneau), en marquant l'ancien texte comme remplacé |

### Autres points relevés pendant la préparation de l'epic E

- **Chaque conflit** est résolu en gardant les décisions des deux branches et leurs sources. La résolution est consignée dans le rapport de mission de l'intégration.
