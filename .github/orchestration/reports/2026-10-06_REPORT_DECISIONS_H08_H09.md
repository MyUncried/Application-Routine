# Report des décisions H-08 et H-09 — 06/10/2026

Mission : REPORT-DECISIONS-H08-H09. Objectif : reporter les dernières décisions et rectifier l’interprétation erronée de D-238 sans rouvrir les arbitrages.

Branche : `docs/cadence-dsf-2026-10-06`. Commit de départ : `d4b1bfc9c247af4329dbb7829a65956ac1b9f569`. PR documentaire : [#323](https://github.com/MyUncried/Application-Routine/pull/323), ouverte en brouillon vers main.

## Sources et constats

Le propriétaire a explicitement confirmé le 06/10 que la ligne structurelle reste toujours présente, que la récupération soit positive ou nulle et qu’un Point d’arrêt soit présent ou non. Il a précisé que les emplacements autorisés sont mis en évidence pendant le placement. La capture fournie « Composition séance — Standard » montre sous « Extension du genou » `Récupération 0 s`, la ligne visible et aucun Point d’arrêt. La capture déjà versionnée de cette référence est [ecran-3-composition-seance.png](../../../docs/Specifications-fonctionnelles/images/ecran-3-composition-seance.png), frame Figma `2028:11700`.

Le chapitre 02 prescrivait déjà la visibilité à 0 s et le réglage. Mon interprétation de D-238, reprise dans le lot fonctionnel `2e7d11c`, avait étendu le retrait des informations sur les cartes à la ligne structurelle. Cette interprétation était fausse. Ce rapport rectifie les conclusions H-08 du rapport de corrections antérieur et la réserve correspondante ; les audits reçus et les rapports datés sont conservés comme historique, sans réécriture des preuves.

## Décisions reportées

| Point | Prescription et correction | Documents concernés |
|---|---|---|
| H-08 — visibilité | Ligne structurelle toujours présente ; `Récupération 0 s` reste affiché même sans Point d’arrêt. D-238 vise le corps des cartes et ne supprime pas cette ligne. | 06, 07 D-217/D-238, 08, 12, 13 CE-T03-08, DSF, matrice |
| H-08 — réglage | Réglage de la récupération conservé sur la ligne et valeur portée par l’occurrence ; aucun nouvel accès inventé. | 06, 08, 13, DSF |
| H-08 — placement | Mise en évidence des positions autorisées sur la ligne permanente pendant le placement ; ordre Exercice → Récupération → Point d’arrêt → suite, limites et répétition par Tour conservés. | D-217, 08, CE-T03-08 |
| H-08 — réorganisation | Carte et ligne de récupération forment le bloc déplacé ; récupération conservée au déplacement/duplication. | 06, 08, CE-T03-08 |
| H-09 — avertissement | « Attention, les exercices vont s’enchaîner sans pause. » Non bloquant lorsqu’il n’y a ni Pause terminale après le premier Exercice ni récupération positive après son occurrence. Aucun avertissement entre Séries ajouté. | Nouvelle décision D-301, 06, 08, 10, CE-T03-08, DSF |
| H-03 / H-10 | Déjà reportés : phrase intrinsèque utilisant `+` et coche courante vectorisée. Aucune duplication de leur décision ou de leur asset. | Sources normatives et rapports antérieurs conservés |

Les mentions d’écart Figma attribuées à la simple présence des lignes de récupération sont retirées. Le constat historique des 13 frames peuplées sur 17 provient du relevé Claude du 06/10 ; il n’est pas présenté comme une nouvelle lecture de toutes les frames ni comme preuve de cohérence totale.

## Contrôles et preuves

Voir [preuves JSON](2026-10-06_REPORT_DECISIONS_H08_H09_PREUVES.json) : remplacements tracés et résultats des contrôles. Relecture ciblée croisée du besoin 02, D-217/D-238, de Composition 06/08, du contrat CE-T03-08 et des DSF ; conservation de la substitution R/PN, des porteurs et des règles de placement. Recette du contrat complétée pour R=0/R>0 avec/sans Point d’arrêt et pour le caractère non bloquant de H-09.

Contrôles effectués : diff sans erreur de whitespace, liens locaux et ancres, structure des 30 contrats et unicité des décisions/règles, conservation et décodage des 136 exports avec leurs empreintes actualisées. Ces contrôles structurels ne constituent pas un audit fonctionnel complet.

Aucun test applicatif applicable : documentation seule. Aucun parcours VNext/V2/PRE ou appel de qualification Claude lancé. Les filtres de publication excluent les rapports documentaires des workflows pilotes et de revue indépendante ; aucun déclenchement manuel demandé.

## Réserves et périmètre

H-08 et H-09 ne nécessitent plus d’arbitrage. La couverture fonctionnelle de l’audit Claude reste partielle ; cette livraison ne déclare pas l’alignement fonctionnel total. Le comportement applicatif et le rendu futur de l’avertissement doivent être contrôlés lors de la mission distincte d’alignement du code ; aucune validation sur appareil réel n’est revendiquée ici. Aucun code, protocole, Figma, calcul métier ou capture n’est modifié.

Aucune opération GitHub active sur la branche au contrôle initial. La liste des processus locaux n’a pas pu être obtenue (`ps` : erreur de bibliothèque) ; l’état des autres conversations ChatGPT n’est pas accessible. Worktree propre au départ et tête locale identique à la tête distante. Publication protégée par la tête attendue, sans force.

## Fichiers et livraison

11 documents actifs : DSF-CADENCE, DSF-CARTES-ICONES-APPUIS, INDEX, README, MATRICE-COUVERTURE-FIGMA-CHAPITRE-06, chapitres 06/07/08/10/12/13. Le présent rapport et son JSON complètent la traçabilité.

Commit final : commit introduisant ce rapport, identifié par son SHA exact dans la PR et le bilan de livraison. Branche existante publiée ; PR #323 mise à jour en brouillon. Main n’est pas fusionné et le PC n’est pas synchronisé. Vérification finale de la tête distante et des opérations déclenchées dans le bilan de livraison.
