# KODJO Protocol V2 — addendum normatif 0.6.38 — restauration de la revue d’implémentation

Date : 2026-09-18

Cette version restaure dans le chemin d’exécution V2 la revue indépendante d’implémentation déjà définie par les versions antérieures. Elle ne remplace ni Lean Queue ni les protections ajoutées pendant V2-BILAT-01 ; elle rebranche le contrôle post-implémentation sur le transport courant.

## 1. Principe restauré

Une livraison applicative n’est jamais assimilée à une implémentation fonctionnellement vérifiée sur la seule base de Jest, TypeScript, lint, du respect de `scope_allow`, de la provenance ou de l’intégrité Git.

Après une livraison technique réussie, l’état durable est `IMPLEMENTATION_CHECKS_PASSED`. Le HEAD livré doit ensuite subir une revue indépendante d’implémentation avant toute validation utilisateur.

Cette règle s’applique à toute livraison produisant un nouveau HEAD applicatif, y compris `IMPLEMENT` et `VISUAL_CORRECTION`.

## 2. Conservation de l’architecture stabilisée

Restent inchangés et obligatoires en amont ou autour de cette revue :

- PLAN approuvé et revue indépendante du PLAN ;
- gate utilisateur d’autorisation d’implémentation ;
- Lean Queue et contrat de requête ;
- séparation HEAD protocolaire / HEAD applicatif ;
- recovery et attestations de migration ;
- `scope_allow`, staging exact, CRLF et contrôle d’intégrité ;
- Jest, TypeScript et lint ;
- push non forcé ;
- cible `EXISTING_PR` et `APPLICATION_CHECKPOINT` pour `VISUAL_CORRECTION` ;
- runtime protocolaire figé avant checkout applicatif ;
- interdiction de fusion automatique avant validation humaine.

## 3. Couverture exhaustive des critères d’acceptation

Le plan approuvé reste la source normative. Sa section `Critères d’acceptation` est extraite mécaniquement et chaque critère reçoit un identifiant stable `AC-xx` pour la revue.

Le rapport indépendant doit contenir exactement une ligne structurée pour chaque critère, dans le même ordre, avec :

- l’identifiant ;
- l’exigence exacte ;
- le statut `CONFORME`, `PARTIELLEMENT_CONFORME`, `NON_CONFORME` ou `NON_VERIFIABLE` ;
- les fichiers examinés ;
- au moins une évidence précise.

Un critère absent, dupliqué, réordonné ou reformulé rend le rapport invalide.

`PARTIELLEMENT_CONFORME` et `NON_CONFORME` imposent `REVISE`. `NON_VERIFIABLE` reste explicitement visible et est transféré au gate utilisateur ; il ne peut pas masquer une absence de code, de câblage ou de test observable dans le dépôt.

## 4. HEAD exact et indépendance

La revue porte sur le HEAD applicatif exact observé dans la PR ouverte. Tout changement de HEAD invalide la revue précédente et impose une nouvelle revue complète.

Le reviewer est indépendant du producteur de l’implémentation. Le chemin restauré utilise une invocation OpenAI séparée de la session Claude qui produit l’implémentation. Le reviewer est en lecture seule.

## 5. Transitions

Le chemin nominal devient :

`IMPLEMENT → IMPLEMENTATION_CHECKS_PASSED → IMPLEMENTATION_REVIEW_PENDING → IMPLEMENTATION_REVIEW_OUTPUT → USER_VALIDATION_PENDING`.

Si la revue conclut `REVISE`, l’état est `IMPLEMENTATION_REVISION_REQUIRED`.

Une correction produit un nouveau HEAD et repasse par la même revue exhaustive avant retour à `USER_VALIDATION_PENDING`.

Le reviewer n’applique aucune correction et ne fusionne aucune PR.

## 6. Branchement sur Lean Queue

Après publication du HEAD applicatif et, pour une correction visuelle, après publication du nouveau `APPLICATION_CHECKPOINT`, Lean Queue émet l’événement `kodjo_v2_implementation_ready`.

Le workflow de revue relit la demande Lean immuable, le plan approuvé par son blob Git, la PR et son HEAD exact. Il rejoue les contrôles déterministes puis exécute la revue indépendante exhaustive.

Aucune livraison technique réussie ne peut contourner ce dispatch.

## 7. Validation utilisateur

La validation fonctionnelle et visuelle utilisateur reste l’autorité finale. Elle ne commence qu’après une revue indépendante valide.

Les critères `NON_VERIFIABLE` sont présentés explicitement à l’utilisateur ; leur validation n’est jamais inférée depuis les tests automatisés.

## 8. Qualification obligatoire avant activation

La mise en service exige au minimum :

- extraction exacte des critères du plan ;
- refus d’un critère manquant ;
- refus d’un HEAD différent ;
- refus d’un `APPROVE` contenant un critère bloquant ;
- conservation explicite des `NON_VERIFIABLE` ;
- dispatch Lean Queue après livraison et checkpoint ;
- preuve qu’une livraison ne se déclare plus `IMPLEMENTED_AND_VERIFIED` avant revue ;
- qualification Linux du nouveau workflow et des scripts ;
- conservation des tests historiques de revue d’implémentation.

Cette version restaure un invariant ancien ; elle ne réouvre aucune décision produit.
