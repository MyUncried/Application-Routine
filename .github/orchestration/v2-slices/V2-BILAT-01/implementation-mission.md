# Mission d’implémentation autorisée — V2-BILAT-01

## Autorisation

- Type : `IMPLEMENTATION`
- Statut : `IMPLEMENTATION_AUTHORIZED`
- Tranche : `V2-BILAT-01`
- Issue : #52
- Plan approuvé : `.github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md`
- Revue indépendante : `.github/orchestration/v2-slices/V2-BILAT-01/independent-review.md` — `APPROVED`
- Baseline applicative planifiée : `04a15580f65d2b3702776447c3574dee988e5b83`
- Baseline documentaire : `7e4f6984a8aefb6018e908e183dd7dda56e2482d`
- Protocole : KODJO V2 lean 0.6.13
- Décision utilisateur : plan métier approuvé, mise en œuvre autorisée.

## Mission

Implémenter intégralement et uniquement le plan technique approuvé. Lire le plan, les sources normatives qu’il référence et le code présent au `source_head` de la demande. Ne redéfinir aucune décision fonctionnelle.

Livrer la configuration de bilatéralité préalable à T03 :

- `SideMode = UNILATERAL | RIGHT_LEFT | LEFT_RIGHT`, cycle, défauts, validation et résolution propre/effective centralisés ;
- `migration005` et `DATABASE_VERSION = 5`, sans donnée d’Exécution ou de Résultat ;
- persistance des côtés de l’occurrence d’Activité de Séance et du Tour ;
- calculs et synthèses avec multiplicateur unique, formules et Récupérations conformes au plan ;
- contrôle `Côtés` de l’Activité dans les trois modes ;
- contrôle du Tour, confirmation canonique, remise atomique des enfants `IN_TOUR` à `UNILATERAL`, contrôles enfants visibles et désactivés, aucune restauration ;
- conservation du côté lors de la duplication d’Activité et traitement conforme des déplacements ;
- tests domaine, migration, repository, présentation, composants et intégration prévus.

## Bornes opposables

- Respecter exactement le `scope_allow` de la demande.
- Ne créer ni duplication de Tour, ni catalogue d’Activités, ni insertion depuis catalogue, ni copie de Séance.
- Ne modifier aucun moteur d’Exécution, Plan, Résultat, Historique, migration 001–004 ou manifeste historique.
- Ne modifier ni cette mission, ni le plan, ni l’identité de tranche, ni la file V2.
- Ne lancer aucune opération Git de branche, commit, push ou PR ; le superviseur s’en charge.
- Ne pas transformer l’impossibilité éventuelle d’un test interne à l’agent en question métier : produire les modifications, puis laisser les contrôles déterministes du superviseur statuer.
- En cas de contradiction technique réellement bloquante, ne pas élargir le périmètre.

## Résultat attendu

Un arbre de travail limité au scope, complet et cohérent. Le superviseur exécute ensuite Jest, TypeScript et lint. Le seul succès livrable est `IMPLEMENTED_AND_VERIFIED`.
