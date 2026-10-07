# Réconciliation documentaire de la PR #328 avec main — 07/10/2026

## Objectif et autorisation

Fusionner la documentation et les captures dans main à la demande de l’utilisateur ; le pull local sera réalisé par celui-ci.

## Bases et résolution

- PR #328 : 77d8996570fb9b8f933b9f3994cd2e345f23abf1.
- Base commune : ce7d641de233b8aad937ab513c979debf11c0696.
- Main intégrant #326 : a0a076020c975d4456272c41090edd1679a918e3.
- Chapitre 06 : conserver les titres visibles ajoutés par #328 et la correction d’interligne 16/19 de #326.
- Chapitre 12 : conserver les alias, tokens et corrections typographiques de #326 ; conserver la cible de voile #1F2129 à 34 % décidée et vérifiée par #328. Aucune nouvelle décision de conception.
- Tous les autres apports de #326 sont repris par leurs blobs exacts ; tous les autres apports de #328 sont conservés.

## Contrôles et limites

Fusion à trois voies des deux chapitres ; suppression des marqueurs de conflit. Les captures et contrats déjà vérifiés dans les deux matrices de #328 restent inchangés. Pas de modification du code applicatif ni d’exécution de tests applicatifs lors de cette fusion documentaire.

Écart identifié : tokens.ts conserve overlayScrim rgba(20,20,20,0.5), alors que le nouveau registre prescrit rgba(31,33,41,0.34). Le test tokensSpecification.test.ts introduit par #326 compare ces valeurs et est donc attendu en échec sur ce point. Le registre signale cet écart ; sa correction relève du développement. Aucun test n’a été supprimé, affaibli ou contourné.

## Fichiers de résolution

- docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md
- docs/Specifications-fonctionnelles/12 – Architecture technique.md
- Ce rapport.

## État Git à la rédaction

Résolution préparée pour un commit de fusion de main dans docs/voile-modal-2026-10-07, parents 77d89965 et a0a07602, puis fusion de la PR #328 via GitHub, sous réserve des contrôles de protection. Le résultat final de fusion est attesté par l’état GitHub de la PR ; ce rapport ne prétend pas que le pull local a été exécuté.
