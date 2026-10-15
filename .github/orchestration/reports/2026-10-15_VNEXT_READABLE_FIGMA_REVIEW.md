# VNext — correction ciblée du dossier Figma de revue

Autorisation : Hermann, 15 octobre 2026, « ok fais le », après proposition de rendre le dossier lisible, de rendre les exclusions consultables, de vérifier puis reprendre PRE-4. Aucun développement produit ni nouvelle condition d'approbation.

## Cause et correction

Le run PRE-4 38757316413 a terminé la continuation de session mais n'a pas approuvé le plan : 92 cibles examinées sur 236988. Claude a signalé des parties Figma de près de 6 Mio sur une seule ligne, et l'absence des raisons des propriétés de contexte dans sa projection. La vérification des octets ne prouve pas leur lecture sémantique.

Le format commun existant est réutilisé : JSON multi-lignes, parties de 64 Kio maximum et lignes de 1800 octets maximum. Les chaînes longues utilisent les descripteurs `string` existants et sont restituées sans perte. Le manifeste est également multi-lignes, consultable par plages ; Grep permet de retrouver une identité dans les parties. Ces bornes concernent la présentation, aucun périmètre fonctionnel ni plafond de revue n'est ajouté.

Le consommateur PLANNER garde `properties` inchangé (REALIZE/PRESERVE) et ajoute `context_properties` pour les autres décisions, avec observed, disposition, reason, document_ids et reference_hash. Aucune exclusion n'est transformée en exigence. Les consommateurs d'implémentation ne sont pas modifiés. Les options historiques de transport restent les valeurs par défaut.

## Vérifications

Tests ciblés : restitution intégrale des chaînes Unicode et des décisions, fragments et lignes bornés, petit fichier lisible, détection des parties altérées, compatibilité des anciens manifestes, intégration de la projection dans le chemin de revue. Les tests avec invocation injectée ne sont pas présentés comme une lecture Claude réelle.

La qualification locale sur les données réelles PRE-4 utilise le dossier Git immuable `caa2a5cf11dc70f4c158dc5ccde325b49ff9d76d`, les contrats UI et requirement-registry publiés, le consommateur PLANNER de production et le lecteur de bundle de production. Elle compare chaque décision à sa source et contrôle les empreintes. Résultats numériques finaux consignés ci-dessous après exécution.

Le binaire Claude du runner Windows n'est pas disponible dans cet environnement. Une simulation Read/Grep n'est pas une preuve de ses outils réels ; leur observation reste celle de la prochaine invocation PRE-4 sur le protocole corrigé. Aucun APPROVE ni héritage de revue n'est inventé.

## Deux captures identiques

Les deux ressources publiées de 8328:36711 et 8328:36853 portent réellement le même SHA-256 `3171e2c9d955abd622812291f58f96a81aa0ac7ed42aef76ae620c94307b787f`. La vérification live précédente est déjà documentée dans `docs/preparation/PRE-4/planification/resolution-2026-10-14.md`, et `plan-technique.md` indique explicitement le rendu identique et la conservation des deux références/scénarios. Ne pas fabriquer un visuel différent ou fusionner les états sur cette seule égalité. Le nouveau constat indépendant reste conservé avec le reçu original ; il n'est pas effacé ni présenté comme clos par le reviewer.

## Résultat PRE-4 réel

Restitution exacte des 267060 décisions : 180443 propriétés obligatoires et 86617 propriétés de contexte ; 4843 exigences et 180535 assertions conservées. Les 49 décisions du nœud signalé par Claude sont présentes, dont la raison « Chrome système natif conservé comme contexte. ». 4529 parties, maximum 65374 octets et 522 octets par ligne. Le manifeste de navigation mesure 9306143 octets / 88128 lignes ; il se consulte par plages, les identifiants se recherchent directement dans les parties. Aucune troncature ni réduction de périmètre. Les détails sont dans `2026-10-15_VNEXT_READABLE_PRE4_EVIDENCE.json`.

## Validation du correctif final

- 597 tests VNext : PASS (0 échec), dont 26 tests ciblés bundle/source Figma.
- 75 workflows : validation syntaxique PASS ; aucun workflow modifié.
- Scanner de 264 chemins : NO_UNDECLARED_REMOTE_WRITE_CAPABILITY.
- git diff --check : PASS.
- Aucun appel modèle, changement produit, réduction d'assertions ou approbation de plan effectué.

La publication de `8eb85100b7b239090663d2f5937534a9dfd01e5f` vers `fix/vnext-readable-review-20261015` a été rejetée par l'auto-review : autorisation explicite de publier ce nouveau correctif et ses rapports vers GitHub jugée absente. Aucun autre canal de publication n'est utilisé pour contourner ce refus. La qualification distante et la reprise réelle PRE-4 attendent cette autorisation de publication ; elles ne sont pas annoncées comme lancées.
