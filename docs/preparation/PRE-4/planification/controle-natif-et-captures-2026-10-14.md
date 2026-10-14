# PRE-4 — contrôle natif du plan et captures jumelles
Date : 14 octobre 2026. Issue #352. Branche : plan/pre4-vnext-20261013.

## Conclusion
Deux défauts de préparation sont traités : le défaut structurel des décisions natives est corrigé ; l'identité des deux captures est vérifiée directement dans Figma.
Aucune revue indépendante approuvée, aucun développement ni approbation propriétaire n'est déclaré.

## Décisions natives — correction structurelle vérifiée
Constructeur corrigé : commit b6e5a21b839d12793b4f2f3a4e730eb4c8c94afd.
Avant : 46 décisions AVAILABLE sans assertion INTERACTION contenant leur primitive ; buildNativeDecisions refuse VNEXT_NATIVE_BRANCH_ASSERTION_REQUIRED.
Cause : le constructeur attribuait des choix natifs à des critères de propriétés graphiques ; ceux-ci ne peuvent pas porter une assertion fonctionnelle INTERACTION.
Après : critères graphiques conservés et évalués comme présentation ; choix natifs portés par neuf critères fonctionnels de sélection numérique, avec assertion INTERACTION, preuves propres au critère et sources fonctionnelles atomiques. Réutilisation SwiftUI.Picker.wheel déjà prévue et présente dans les primitives iOS existantes, aucune nouvelle règle produit.
Contrôle réel du validateur : les vérifications de forme, couverture des critères, sources, exigences et assertions passent ; résultat WAIT_FOR_PROOF à l'étape suivante, faute de preuve authentifiée de revue indépendante. Ce résultat n'est pas une admission finale ni une conformité native d'une implémentation.

Reconstruction locale complète : PASS, 4843 exigences, 4843 critères, 180535 assertions.
Seconde passe : les 180526 assertion_id de la reconstruction précédente sont tous présents ; zéro suppression, neuf ajouts.
PlanContract : 03a5b8bb6504996cc6f2afb41e221592ba16d12a77d04ebfc65a393a8b07a541.
UiAtomicityContract : 7ed3ab361a096cce239fed5b94c9404ef2214cff967f24a909a734d874f98c8e.
Produced : 9bf23c4b550686f7802c1fe88995b73f278514e5cfff4e9e88705b25556684ba.
Launch : aa02d79ffae16e1acd1329764915cbfcac4b7e281dbf0bb8cde5ec3229f9562a.
Limite : reconstruction locale utilisant les bibliothèques candidates #358 et un checkout avec changements locaux, HEAD 08c68415 ; ces hashes ne sont pas un paquet canonique publié et admis. Reproduire/publier les contrats avec le constructeur épinglé et le protocole intégré avant la nouvelle demande de revue. Ne pas fabriquer de resolver natif.

## Captures — constat clos au périmètre vérifié
Fichier Figma G6RY5Ebhgwb4AHIOYDwwvg, page Prototype MVP 510:101.
- 8328:36711 : Création activité — Avant Paramètres d'exécution.
- 8328:36853 : Création activité — Paramètres — Champ vide.

Contrôle direct en lecture seule : exportAsync PNG à échelle 1 des deux nodes actuels dans la même opération ; dimensions 402×874 ; 101341 octets par export ; égalité stricte de tous les octets PNG.
Conclusion : les deux états actuels ont le même rendu exporté. Une capture identique ne démontre donc pas ici une omission de capture. Conserver les deux références et leurs scénarios ; aucune fusion/suppression d'état ni modification Figma effectuée.
L'égalité graphique ne vaut pas identité des comportements ou scénarios. Le téléchargement des URLs temporaires depuis l'environnement a renvoyé une page HTML ; il n'est pas utilisé comme preuve. La comparaison directe des exports Figma est la preuve retenue.

## Reprise
La couverture de revue 4996/236896 reste refusée. Le traitement cumulatif constitue une évolution générique de VNext confiée à l'autre conversation ; aucun changement du moteur commun n'est publié ici.
Après intégration du protocole : matérialiser le paquet exact corrigé, précontrôler la demande, lancer la revue indépendante, traiter les constats jusqu'à convergence puis soumettre le plan à Hermann.
Aucun appel Claude supplémentaire effectué pour ces contrôles.
