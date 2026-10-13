# PRE-4 — dossier canonique proposé, avant revue indépendante

Opération #352, tranche VNEXT-PRE-4. Producteur exact `1c2ea73e29e9e523226dfdaa8fdb3891f6a16e78` ; source figée `a082de8c9e74ad3954654e225526d92093c93c99`. Aucune implémentation, aucune approbation propriétaire ni conformité applicative annoncée.

- PlanContract : `d759e8224642190c65173e17a595283240540b91f1cbd10842baeb9ff51da67c`, [manifeste](plan-contract.json).
- UIAtomicityContract : `e39b394618ad2a24769b93c2c84bd7b6925e7bbd2121d398a9d47315df8f2216`, [manifeste](ui-atomicity-contract.json).
- Chaîne produite : `540b058a1f20df22eaa500673473c45751cc1a44517e61a2eb72d5d310d31b03`, [manifeste](produced.json).
- [Traçabilité des 22 exigences](tracabilite-canonique.json), [Launch](launch-receipt.json), [preuve de construction](construction-receipt.json).
- [Plan technique lisible](../plan-technique.md), [51 assertions fonctionnelles et suites propriétaires](../assertions-recette.json).

4843 exigences atomiques, 180526 assertions (180443 propriétés visuelles et 83 états/scénarios). Les 32 écrans appartiennent à ce périmètre, pas à la totalité des pages Figma. Les maîtres, variables, styles et descendants masqués sont conservés comme preuves de source et contexte ; leur présence ne crée pas un périmètre produit supplémentaire.

Les manifestes `kodjo.vnext.file-bundle.v1` relient les parties immuables dans `parts/` ; lecture par le lecteur intégré `vnext-file-bundle.read`, vérification de chaque empreinte physique et du contrat logique. La compression utilisée pour le transfert au connecteur GitHub n’est pas un changement du format stocké : les blobs publiés sont les octets JSON originaux, contrôlés par leur SHA Git. Une réponse tardive de transport ne vaut pas publication de branche.

La reconstruction à partir de l’adaptateur committé passe sans dérive de PlanContract/UIContract. 32 tests locaux ciblés des frontières Launch/transport passent ; il ne s’agit pas d’une certification VNext, d’un test applicatif PRE-4 ni d’une revue Claude. La revue doit être invoquée par une demande unique `plan-review` via le relais intégré ; son reçu indépendant reste à obtenir. L’approbation du propriétaire intervient ensuite sur le plan exact revu.

Seconde passe des propriétaires : FixedHeader dans ScreenShell et ses appels dans ExerciseScreen ; galerie et aperçus dans ActivityMediaList. Variantes et comportements par défaut des consommateurs partagés préservés. La reconstruction après restauration de l’espace local retrouve exactement les mêmes contrats et chaîne ; aucune nouvelle extraction ni approbation fabriquée.
