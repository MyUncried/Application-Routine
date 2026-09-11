# Rapport de changement KODJO V2 0.6.21

## Causes démontrées

La contre-qualification de la source complète au HEAD `7236b7446ad68451db7009f47c90b097b8257d21` a établi trois écarts : le registre réparé restait sous un nom historique tandis que le nom canonique désignait la version 3.3.0 corrompue ; `check-scope.js` n’utilisait pas la canonicalisation d’INC-092 ; et la tranche `V2-QUALIF-00` n’avait ni bootstrap ni activation.

## Correctifs

- archivage explicite du registre 3.3.0 corrompu et bascule du registre 3.11.0 sous le nom canonique ;
- bibliothèque partagée `scripts/kodjo/lib/scope-path.js` utilisée par le superviseur et `check-scope.js` ;
- bootstrap, activation, mission et fixture de `V2-QUALIF-00` ;
- workflow manuel à permissions de lecture et script Windows de qualification sur une origine Git locale nue ;
- banc portable S1 à S7 sans chemin absolu, avec rapport JSON ;
- tests T-067 à T-069 et incidents INC-094 à INC-096.
- génération obligatoire du `request_id` par le constructeur local, INC-097/T-070.

## Qualification locale

Les résultats locaux sont inscrits uniquement après exécution de la suite complète, validation de tous les workflows et validation croisée du registre. Ils ne valent pas invocation Claude réelle.

## Qualification réelle attendue

Le workflow doit publier un artefact propre au run contenant au minimum le manifeste de qualification, `result.json`, `invocation.json`, `run-context.json`, la certification du verrou et le paquet de reprise. Aucun résultat réel n’est déclaré avant observation du run GitHub correspondant.
