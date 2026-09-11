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
- qualification multiplateforme des fins de ligne et preuve systématique sur arrêt préflight, INC-098/099 et T-071/072.
- migration protocolaire explicitement compatible avec le seul sous-arbre jetable `tests/fixtures/qualif/**`, INC-100/T-073.
- exécution native PowerShell 5.1 fondée sur le code de sortie malgré un stderr Git bénin, INC-101/T-074.
- installation contrôlée des dépendances dans le clone jetable et collection stable de dérive vide, INC-102/103 et T-075/076.
- inventaire sans traversée des dépendances et nettoyage temporaire vérifié sous PS5.1, INC-104/105 et T-077/078.
- correction groupée après le run #69 : caches Jest/Expo désactivés uniquement dans la qualification, comparaison explicite baseline/post et nettoyage borné par identité de racine, INC-105/106/107 et T-078/079/080.
- après l’arrêt pré-Claude du run #70, déplacement de la preuve du verrou hors checkout vers `runner.temp`, avec identité run/tentative et oracle permanent, INC-108/T-081.

Le run #69 `34636990245` a invoqué Claude une fois avec sortie 0, produit exclusivement `tests/fixtures/qualif/result.txt` et préservé un paquet intact. Son verdict global reste FAIL : cache `.expo` du harnais, distinction baseline/post absente et nettoyage temporaire en échec. Aucun de ces incidents n’est déclaré corrigé avant le préflight Windows complet puis la dernière tranche jetable réelle.

Le premier préflight complet, run `34643195729`, a correctement refusé de continuer avant Claude parce qu’une étape antérieure avait écrit `runner-lock-certification.json` dans le checkout. Ce défaut de câblage inter-étapes est corrigé sans modifier le superviseur ni le protocole applicatif.

Le run `34644068082` démontre ensuite le préflight jetable complet PASS sous PowerShell 5.1 (`10281657290`). Son job global restait rouge uniquement parce que la certification distincte du paquet historique #16 refusait correctement trois changements applicatifs postérieurs. Cette preuve historique reste exécutée et publiée, mais elle ne constitue plus une dépendance bloquante de `V2-QUALIF-00` (INC-109/T-082).

## Qualification locale

Les résultats locaux sont inscrits uniquement après exécution de la suite complète, validation de tous les workflows et validation croisée du registre. Ils ne valent pas invocation Claude réelle.

## Qualification réelle

Le run #73 `34648194736` a été exécuté au HEAD exact `8a7b9e018c2a0a7cedd9c27f3dbe1ac0afdadd0f` sous Windows PowerShell 5.1. Les jobs `protocol`, `protocol-windows-preflight` et `disposable-qualification` sont `SUCCESS`.

L’artefact `10283681378`, SHA-256 `3defbea095d0adcfbfcac55bed02a39ad0fa3dd319763325cbb59b00c35e1a53`, démontre :

- verdict de qualification `PASS` et statut protocolaire local `IMPLEMENTED_WITH_FAILED_CHECKS` ;
- invocation Claude INITIAL réelle, sortie 0, sans timeout, avec un appel IA au maximum et aucun `--max-turns` ;
- même `request_id` dans l’invocation, le résultat et le paquet de reprise ;
- delta unique `tests/fixtures/qualif/result.txt`, contenu `KODJO V2 QUALIFICATION PASS` ;
- collections de dérive vides, paquet de reprise `INTACT`, nettoyage `PASS` et verrou final absent ;
- aucune branche distante, aucune PR, aucune entrée Lean Queue et aucune intégration dans `main`.

Jest reste en échec absolu sur les deux mêmes timeouts applicatifs préexistants, avant et après Claude ; TypeScript et lint passent. Le comparateur publie `absolute_status:FAIL`, `executable_status:PASS`, `regression_status:PASS` et `verdict:PASS`.

L’artefact historique séparé `10283262254` demeure `FAIL` sur la migration du paquet #16, sans bloquer la tranche jetable : le découplage INC-109/T-082 est donc démontré. L’interruption contrôlée suivie d’une reprise réelle `RESUME_DELTA` de la même session reste `NON RETESTÉE`.
