# KODJO — contrat d'impact de planification 0.1

## Objet

Ce contrat rend opposable le passage entre le plan fonctionnel et le périmètre
d'implémentation. Il s'applique aux nouveaux plans qui portent le bloc
`KODJO_PLAN_IMPACT_JSON`. Les plans approuvés avant son introduction restent
lisibles et ne sont pas rétroactivement modifiés.

Le défaut réel reproduit par le run Jest-only `34780841712` sert de scénario de
référence : `SessionService.test.ts`, absent du scope de `V2-BILAT-01`, importait
directement les modules modifiés `Session.ts` et `SessionDraft.ts`. Le scan à un
seul niveau l'aurait présenté au planificateur. Les deux autres suites rouges
étaient déjà dans le scope.

## Trois couches

1. Le premier passage de planification déclare exhaustivement les modules
   applicatifs à créer ou modifier, avec des chemins relatifs POSIX.
2. Le script Node scanne à `scan_revision` tous les importateurs directs de ces
   modules. Il reconnaît les imports/exports statiques, imports dynamiques à
   littéral, `require` et appels Jest à littéral, avec résolution relative et
   alias `@/`. Il ne construit aucune fermeture transitive.
3. Le planificateur classe chaque module et chaque candidat, sans omission, puis
   dérive `scope_allow` exactement de `MODIFY ∪ TEST_MUST_ADAPT`.

Classifications fermées :

- `MODIFY`
- `TEST_MUST_ADAPT`
- `CONSUMER_UNAFFECTED`
- `TEST_UNAFFECTED`
- `REQUIRES_CLARIFICATION`

Chaque ligne porte une justification positive. `REQUIRES_CLARIFICATION` est
bloquant. Le score de risque ordonne les candidats ; il n'en filtre aucun.

## Preuves opposables

Le plan contient exactement un bloc JSON `KODJO_PLAN_IMPACT_JSON` avec :

- `scan_revision` ;
- les `modified_modules` et leur nature `MODIFY|CREATE` ;
- l'empreinte SHA-256 canonique du scan ;
- une ligne par module ou importateur direct ;
- la classification et sa justification ;
- le `scope_allow` dérivé.

La revue indépendante rejoue le scanner sur la même révision. Elle publie son
bloc `KODJO_PLAN_IMPACT_REVIEW_JSON`, liant l'empreinte annoncée par le plan à
l'empreinte obtenue par le rejeu.

Avant toute implémentation, l'admission relit le plan et la revue versionnés,
rejoue encore le scan sur le `source_head` réel et compare la demande :

- si l'empreinte complète des arbres applicatifs `app/` et `src/` à
  `scan_revision` diffère de celle du `source_head`, `PLAN_SCAN_STALE` bloque
  l'exécution ;
- si un candidat est absent, non classé, sans justification ou reste en
  clarification, `PLAN_SCOPE_UNCLASSIFIED` bloque l'exécution ;
- si le scan, la preuve de revue, les métadonnées d'une ligne ou le
  `scope_allow` divergent, `PLAN_SCOPE_CONTRADICTION` bloque l'exécution.

Un changement de baseline applicative invalide donc le scan même lorsqu'il ne
semble pas toucher les modules déclarés : un nouveau plan et un nouveau rejeu
sont requis. Un commit exclusivement protocolaire peut avancer `source_head`
sans invalider une empreinte applicative identique ; cela évite toute référence
Git circulaire dans le plan versionné.

## Portabilité et limites

Le scanner utilise Node et Git sans shell dépendant de la plateforme. Les
chemins absolus, antislashs, segments vides, `.` ou `..`, collisions de
résolution et déclarations incompatibles `CREATE|MODIFY` sont refusés.

Le scan est un contrôle ciblé des importateurs directs, pas une garantie
d'exhaustivité absolue. Il ne couvre pas les dépendances calculées sans littéral,
les conventions runtime non exprimées par un import direct, ni un graphe AST
universel. Une extension transitive n'est pas retenue : le cas réel n'en avait
pas besoin. Jest complet, TypeScript et lint restent les garde-fous finaux de
l'implémentation.
