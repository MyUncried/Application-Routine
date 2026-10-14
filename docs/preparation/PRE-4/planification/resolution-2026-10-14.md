# PRE-4 — état consolidé des corrections du plan
Date : 14 octobre 2026. Opération #352, VNEXT-PRE-4.
Branche : `plan/pre4-vnext-20261013`.

## Statut et portée
Les corrections indépendantes de la livraison VNext sont consolidées dans le contenu du plan et son constructeur. Le périmètre ED-01 à ED-22 et les comportements attendus restent ceux du plan proposé.
Aucun développement, aucune approbation propriétaire ni revue indépendante complète acceptée.
La reconstruction locale corrigée n’est pas le paquet canonique final publié. Sa matérialisation et son admission doivent utiliser le protocole intégré et le constructeur épinglé après livraison des dépendances VNext.

## Les six constats de la revue partielle
La [revue historique](revue-partielle-38465662376.md) et son archive restent immuables : run 38465662376, couverture 4996/236896 refusée. Aucun de ses constats n’est présenté comme clos par une revue indépendante acceptée.

| Constat | Correction ou conclusion actuelle | Évidence et reste |
|---|---|---|
| UI_ASSERTION_GAP — décisions natives | Défaut structurel corrigé : décisions portées par neuf critères fonctionnels d’interaction, avec source précise et preuves propres ; références dédupliquées. Les critères graphiques sont conservés comme rendu. | Constructeur b6e5a21b ; contrôle natif et reconstruction locale réussis. Le validateur atteint WAIT_FOR_PROOF ; preuve authentifiée de revue indépendante encore attendue. |
| PRODUCT_AMBIGUITY — FULL_FILE | Les 83 références fonctionnelles précises ont été produites et contrôlées localement, avec document intégral conservé. | Capacité candidate #358 ; intégration du comportement générique par défaut à livrer par le chantier VNext. Pas d’activation particulière à maintenir pour PRE-4. |
| PRESERVATION_RISK — préservation en prose | Obligations structurées de préservation ajoutées pour les fichiers hors périmètre d’écriture. Le plan technique explicite cette obligation et l’absence de gel d’un fichier modifié ailleurs. | Contrôle du graphe : 51 fichiers explicitement préservés, aucun dans le périmètre d’écriture ; publication finale des contrats après VNext. |
| WRONG_TARGET — reproduction PRE-3 | Reclassée comme preuve historique figée hors consommateur runtime. Import réellement observé conservé ; aucune exclusion aveugle du scanner. | Classification NO_CHANGE et préservation structurée dans le constructeur ; comportement décrit au §4 du plan technique. |
| SUGGESTION — captures identiques | Point de capture vérifié : les nodes actuels 8328:36711 et 8328:36853 exportent exactement le même PNG. Les deux références et scénarios restent présents. | Export direct Figma : 402×874, 101341 octets chacun, égalité stricte de tous les octets. Aucune mutation Figma ; égalité graphique ne vaut pas identité fonctionnelle. |
| PLAN_GAP — couverture de revue | Toujours ouvert. Le volume de propriétés héritées des composants/tokens doit être traité dans le protocole commun ; la lecture cumulative couvre ensuite le dossier justifié si nécessaire. | Deux compléments transmis au chantier VNext : généralisation et factorisation des preuves. Aucun seuil abaissé, aucune couverture fabriquée, aucun nouvel appel Claude sur l’ancien paquet. |

## Vérifications acquises
Voir le [contrôle natif et des captures](controle-natif-et-captures-2026-10-14.md), publié au commit 4f35bc69.
Constructeur corrigé publié au commit b6e5a21b839d12793b4f2f3a4e730eb4c8c94afd.

Reconstruction locale :
- 4843 exigences et 4843 critères.
- 180526 assertions originales conservées, zéro assertion_id manquant ; neuf assertions INTERACTION ajoutées, soit 180535 assertions dans cette reconstruction.
- Sources, graphe d’impacts, plan, contrat d’interface, traçabilité et chaîne produite : validateurs PASS.
- Contrôles structurels natifs : PASS, puis WAIT_FOR_PROOF à l’étape de preuve indépendante, conformément au contrat.
- Ces nombres sont des mesures de cette reconstruction, pas des minima imposés au futur catalogue factorisé.

La préservation des sources et exigences demeure obligatoire. La représentation de leur couverture peut évoluer avec le mécanisme générique de composants/tokens, sans exiger une revue répétée des propriétés communes ni supprimer une obligation sans justification.

## Ce qui est durable et ce qui attend VNext
Les corrections de préservation, le classement de la preuve PRE-3, la distinction critères graphiques/interactions natives et la conclusion sur les captures sont des corrections de fond indépendantes du format final VNext. Elles doivent être reprises dans le paquet final, sans refaire leur diagnostic tant que leurs sources n’ont pas changé.

La factorisation des preuves, la couverture de revue et le mode commun de références fonctionnelles relèvent du chantier VNext. Le constructeur de tranche pourra nécessiter une adaptation à ses interfaces finales ; aucune compatibilité anticipée n’est déclarée et aucune adaptation spéculative n’est ajoutée ici.

Les sorties locales et hashes historiques demeurent des preuves intermédiaires : ne pas les republier comme si elles avaient été produites avec le protocole final.

## Point de reprise après livraison du protocole
1. Lire les commits intégrés, interfaces et preuves transmis par le chantier VNext ; vérifier les opérations et verrous actifs.
2. Appliquer uniquement les adaptations d’interface nécessaires au constructeur PRE-4, en conservant les corrections de fond ci-dessus.
3. Reconstruire depuis les sources Git exactes, vérifier la couverture directe/héritée et publier le paquet canonique.
4. Précontrôler l’admission de la nouvelle demande ; ne pas rejouer la demande historique.
5. Lancer la revue indépendante, traiter les résultats jusqu’à convergence puis présenter le plan exact à Hermann.
6. Aucun développement avant son approbation explicite.

## Historique
Ce checkpoint remplace les anciens états de travail de ce fichier, notamment « captures à vérifier » et « défaut natif de branche encore à résoudre ». Les états historiques et leurs limites restent consultables dans l’historique Git et dans les deux rapports référencés ci-dessus.
