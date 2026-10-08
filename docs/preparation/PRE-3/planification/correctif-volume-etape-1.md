# VNext — Correctif de volume, étape 1 : scellement par flux

Base de travail : `8e8006e34dac8aef0dddaef816828674f3b8756b`, branche de planification PRE-3. Périmètre applicatif inchangé. Ce document ne vaut ni revue indépendante ni approbation du plan.

## Résultat livré

`canonicalHash` consomme désormais les octets JSON canoniques progressivement, via `writeCanonical`. La taille des chaînes temporaires est bornée. Les empreintes, IDs et erreurs de validation historiques sont conservés. `canonicalStringify` reste disponible pour les consommateurs qui demandent explicitement une chaîne complète ; ces consommateurs ne sont donc pas encore corrigés par cette étape.

Validation : `node --test tests/kodjo/vnext-stream-canonical.pilot.js tests/kodjo/vnext-plan-contract.pilot.js tests/kodjo/vnext-ui-atomicity.pilot.js tests/kodjo/vnext-figma-source.pilot.js` : 42 tests PASS, 0 échec. Le test de dépassement scelle et vérifie un objet dont la représentation JSON dépasse `MAX_STRING_LENGTH`, avec une empreinte attendue calculée indépendamment. Ordre des clés numériques, tableaux creux, Unicode aux frontières des morceaux, échappements, types refusés et altération après scellement sont couverts.

Contrôle réel du contrat UI PRE-3 publié : restitution des 45 parties gzip/base64, 493901942 octets ; SHA-256 des octets `445bd4ab5ec51342ff7b7ce3fffe4659b726750017116b93f33893b3f2c3be25`. Le scellement par flux vérifie sans changement l'empreinte canonique `d4aa55ad8a0752ae4083a33a96d5d006491258ab1dee5bf2856610ec9399e4c9`, pour 6384 critères et 243974 assertions. Il s'agit du contrat UI réel, pas du conteneur produced complet, encore absent.

## Diagnostic mesuré

Le contrat UI comprend 295992954 octets de critères et 197550632 octets de références Figma. Les sources répétées dans les assertions occupent 97222751 octets pour 2508797 octets de valeurs distinctes. Les 471135 décisions Figma comprennent 243879 REALIZE et 227256 OBSERVED_ONLY ; cinq justifications répétées occupent 60031497 octets, et 1212 règles distinctes de 336101 octets sont recopiées sur 24369784 octets. Ces mesures portent sur les valeurs JSON, sans prétendre à une taille finale après ajout des index de déduplication. Aucun élément, propriété, assertion ou exigence n'a été supprimé.

## Étapes suivantes et raccordement

1. Étape 1 présente : calcul des empreintes par flux, compatible avec les contrats publiés.
2. Transport : conteneur scellé comme dossier de fichiers avec manifeste, références sûres et empreintes ; lecture et reconstruction sans chaîne JSON globale. Adapter production, revue, reprise et admission. Les codecs de stockage existants doivent rester compatibles.
3. Vérification : parcours sur PRE-3 complet, empreintes et couverture identiques, refus des parties manquantes, altérées ou issues d'une autre révision. Ne pas déclarer la revue praticable sur la seule base du succès du scellement.
4. Raccordement : conserver #340, la source figée `3019c5f8c4a38efb83865635e0a8d67d48a5b5ab`, la baseline application `1ddfb6d144552f578388257adc78db47ab5992c8` et P3-01..P3-23. Produire le paquet de revue avec la version corrigée du protocole, publier sa révision exacte et la commande Claude réelle. Revue indépendante puis validation explicite Hermann, avant développement.

La déduplication est une optimisation distincte : elle peut préserver les octets reconstruits et les empreintes si elle reste un codec de transport. Modifier les schémas logiques changerait les empreintes et exigerait une traçabilité explicite. Ne pas mélanger cette modification avec la présente étape.

Statut : **ETAPE_1_VALIDEE — BLOCKED_BEFORE_REVIEW conservé pour PRE-3**. Aucun run Claude, aucune approbation propriétaire, aucun changement applicatif, aucune nouvelle campagne globale. Les travaux sont isolés de la branche PRE-3 pour éviter un écrasement de corrections concurrentes.
