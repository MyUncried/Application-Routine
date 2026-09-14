# KODJO Protocol V2 — addendum normatif 0.6.23

La présente version supersède 0.6.22 pour les règles ci-dessous. Toutes les autres règles de 0.6.22 restent applicables.

## A. Déclenchement déterministe de la revue indépendante d'implémentation

La revue indépendante du PLAN reste inchangée. La présente règle concerne exclusivement la revue du code livré.

Une revue indépendante d'implémentation est requise une seule fois pour :

- la première livraison consolidée d'une nouvelle tranche fonctionnelle ;
- toute livraison qui étend le périmètre fonctionnel ou technique approuvé ;
- toute livraison qui change le binding du plan approuvé ou introduit une nouvelle exigence.

Une livraison corrective n'est pas soumise à une nouvelle revue indépendante lorsque toutes les conditions suivantes sont démontrées :

1. l'opération immuable est `RESUME_DELTA`, `TARGETED_FIX` ou `CORRECTION` ;
2. l'identifiant de tranche est inchangé ;
3. le binding du plan approuvé est inchangé ;
4. tous les fichiers modifiés restent dans le périmètre approuvé ;
5. aucune nouvelle exigence fonctionnelle ou technique n'est introduite.

Le libellé de l'opération ne suffit jamais à obtenir l'exemption. Une condition absente, incohérente ou fausse rend la revue requise. Cette décision est calculée par `scripts/kodjo/resolve-implementation-review-policy.js`.

Une revue déjà réalisée pour la première livraison consolidée satisfait l'obligation de la tranche. Une correction ultérieure dans le même périmètre ne réouvre pas cette obligation. Il n'existe aucune boucle automatique de nouvelle revue après correction.

## B. Portée et autorité de la revue

Lorsqu'elle est requise, la revue peut examiner la conformité fonctionnelle, le respect du plan et du périmètre, la qualité du code, l'usage des composants et interfaces, les tests, les régressions et la maintenabilité.

Son rapport distingue obligatoirement :

- `CONFIRMED_NONCONFORMITY` : contradiction démontrée avec une exigence approuvée ;
- `FUNCTIONAL_AMBIGUITY` : interprétation nécessitant un arbitrage utilisateur ;
- `TECHNICAL_RISK` : risque démontré ou scénario reproductible ;
- `SUGGESTION` : amélioration non obligatoire.

Toute observation cite l'exigence, le code et, lorsqu'elle existe, la preuve reproductible concernés. Le reviewer reste en lecture seule. Son rapport ne déclenche ni correction, ni invocation de Claude, ni modification du HEAD. L'utilisateur conserve l'autorité fonctionnelle et décide seul d'approuver ou de demander une correction.

## C. Transition vers la validation utilisateur

Après réussite de tous les contrôles objectifs obligatoires :

- si la politique rend la revue obligatoire et qu'elle n'a pas encore été exécutée, l'état devient `IMPLEMENTATION_REVIEW_PENDING` ;
- dès que le rapport unique requis existe, quel que soit son contenu, l'état devient `USER_VALIDATION_PENDING` avec les constats joints ;
- si la politique dispense la livraison corrective de revue, l'état devient directement `USER_VALIDATION_PENDING`.

L'approbation utilisateur reste liée au HEAD applicatif exact. Toute modification ultérieure du HEAD annule cette approbation et exige une nouvelle validation utilisateur, mais pas une nouvelle revue indépendante lorsque la modification reste une correction conforme à la section A.

Les contrôles Jest, TypeScript, lint, intégrité, provenance, périmètre et absence d'extension non autorisée restent obligatoires et bloquants. La présente version ne les réduit pas.

## D. Mise en service pour V2-BILAT-01

La livraison de la PR applicative #131, HEAD `df38ade5e8737ed8f59a3a7472ebe9b168a85145`, provient de l'opération immuable `RESUME_DELTA` achevée par le run `34872653037`. Sous réserve que ce HEAD et les preuves annoncées restent inchangés lors de la mise en service de la présente version, elle relève de l'exemption corrective de la section A et peut passer à `USER_VALIDATION_PENDING` sans créer ni simuler `kodjo-v2-openai.yml`.

Cette disposition n'autorise ni fusion applicative, ni nouvelle demande Lean Queue, ni nouvelle invocation de Claude. Elle autorise uniquement la revue fonctionnelle et visuelle par l'utilisateur sur le HEAD exact de la PR #131.
