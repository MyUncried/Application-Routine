# Change report — KODJO Protocol V2 0.6.23

## Objet

Supprimer le blocage artificiel de V2-BILAT-01 sans installer une seconde boucle de développement.

## Changement

- Revue indépendante d'implémentation déclenchée une seule fois pour une nouvelle tranche ou une extension de périmètre.
- Pas de nouvelle revue pour `RESUME_DELTA`, `TARGETED_FIX` ou `CORRECTION` lorsque tranche, binding, exigences et périmètre restent inchangés.
- Toute preuve manquante ou incohérente rend la revue requise.
- Revue étendue au fonctionnel, au code, aux tests et au périmètre, mais sans correction automatique ni autorité supérieure à la validation utilisateur.
- Transition directe vers `USER_VALIDATION_PENDING` pour un correctif admissible dont les contrôles objectifs sont verts.

## Incident corrigé

La spécification 0.6.16 conservée par la chaîne d'addenda exigeait `kodjo-v2-openai.yml / REVIEW_IMPLEMENTATION`, alors que ce workflow n'a jamais été déployé. La livraison V2-BILAT-01 était donc techniquement vérifiée mais procéduralement bloquée.

## Périmètre

Uniquement spécification protocolaire, résolveur déterministe, tests permanents, rapport de changement et registre d'incidents. Aucun fichier applicatif et aucun workflow d'invocation IA ne sont modifiés.
