# Propagation et cohérence — Bip de cadence — 07/10/2026

Base vérifiée : PR323 ouverte en brouillon, tête4365c0cd913c6dfb6d89fd27f156db1946839e54, base main6d03f5be. Aucun run en cours sur la branche lors du contrôle initial. Travail limité à docs/ ; aucune fusion, aucun code ou Figma modifié.

## Source et décisions

[Prompt original archivé](archives/bip-cadence-2026-10-07/prompt-source.md). Bip0..10 transverse, stepper,0=Aucun ; six cas mode×bip ; plus d’estimation forfaitaire ; omission des durées d’Exercice sans terme ; ≥ seulement en Séance. Q-07 clos.

Nouvelle référence [Bip v2](Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md), paramètres v13 et Phrase v1 mis à jour ; ancien chemin Cadence v1 remplacé par un renvoi. Chapitres, modèles/API, règles, glossaire, DSF et contrats concernés propagés. Les archives et rapports antérieurs restent historiques, pas sources actives.

## Conséquences vérifiées

- Travail+pauses entre Séries : n−1 en unilatéral, disparition de la Pause terminale. L’ancienne substitution PN/R ne peut subsister : récupération explicite ajoutée après l’Exercice. Formules, inversion Durée et exemples actualisés.
- Bilatéralité : conserver la Pause du premier côté puis PC à la frontière, et les règles par paire ; retirer seulement la Pause terminale de l’Exercice. Cette articulation est identifiée comme dérivée des décisions, pas citée comme texte du nouveau prompt.
- Bip périodique dans les trois modes ; il ne termine jamais une Série. Durée garde la fin au minuteur, malgré la phrase générique du prompt « c’est l’utilisateur qui termine ». En Répétitions, le bip continue après nominal tant que Série active ; ancien arrêt et signal nominal distinct retirés. Pause/Reprise, temps réel, sécurité et arrière-plan articulés avec les modes.
- La classification du total dépend du travail, pas de pauses connues. La convention de Séance additionne contributions connues/estimables et signale du travail absent du total ; elle ne garantit pas le temps réel d’un utilisateur qui abrège.
- Le modèle source à4365c0c expose encore ActivityDefinition scalaire et migrations001..008 : prérequis de migration confirmé, aucun numéro de migration réservé.
- Excel reste uniquement rédactionnel selon instruction explicite du propriétaire ; ni modification du classeur ni nouvelle autorité de calcul revendiquée.

## Figma et captures

Métadonnée courante139 références (136 frames et3 ensembles), ancienne roulette7061:13383 absente.17 captures renouvelées :5 vues amendées et12 reports d’export précédents. Les139 références actives disposent d’une image PNG décodable ; les122 autres copies restent datées du premier lot. [Inventaire avec provenance et empreintes](MATRICE-BIP-FIGMA-2026-10-07.md).

19 modales candidates sans libellé Bip dans la métadonnée sont listées. La source confirme que la propagation Durée/À l’échec reste à faire. Les ≥ encore dessinés sur des Exercices doivent être retirés ; un ≥ de Séance ne certifie pas son montant sans données complètes. Aucun écran n’est déclaré conforme sur la seule présence d’une capture.

## Réserve rédactionnelle Q-08

La source demande de conserver les formulations mais retire la Pause terminale. « Une série suivie de15s de pause » devient faux ; « +15s de pause chacune » reste ambigu. La règle d’exécution est actualisée, les formulations historiques sont signalées dans Phrase v1 en attente d’un arbitrage. Proposition : « + 15 s de pause entre les séries » et aucune clause de pause pour une Série unilatérale. H-03 n’est pas réécrit silencieusement.

Les écarts graphiques antérieurs (trait à zéro, compteur circuits, point terminal), V-04 et la dette de composants restent distincts. La conception sonore exige encore une qualification sur appareil. Aucune conformité fonctionnelle totale ni livraison logicielle annoncée.

## Contrôles exécutés

[Preuves](VERIFICATION-BIP-2026-10-07.json) :30 contrats×21 rubriques non vides, liens locaux, PNG décodés, formules des exemples et inversion numérique contrôlées, source archivée identique. Recherche des anciennes bornes/roulette/estimation et pause terminale effectuée dans les documents actifs. Aucun test applicatif ni audit indépendant exécuté.
