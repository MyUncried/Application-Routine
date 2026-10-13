# PRE-4 — dossier canonique proposé, avant revue indépendante

Opération #352, tranche VNEXT-PRE-4. Producteur exact `41f58047f6d5fa5a0ba7531461a1ae710aa76add` ; source figée `a082de8c9e74ad3954654e225526d92093c93c99`. Aucune implémentation, aucune approbation propriétaire ni conformité applicative annoncée.

- PlanContract : `50f3947fe82af15499bd4a2b80f6113523baf7239b874ceb69271a9adeb11ade`, [manifeste](plan-contract.json).
- UIAtomicityContract : `f8ad9ae291f2b35aaf17c7e0db1f94be7267d9476edd212e72e40fb14c5c813d`, [manifeste](ui-atomicity-contract.json).
- Chaîne produite : `e5170d9752d323fe9ae8a9fb26875687aa23c0d773c4b40fd1614291cd818d30`, [manifeste](produced.json).
- [Traçabilité des 22 exigences](tracabilite-canonique.json), [Launch](launch-receipt.json), [preuve de construction](construction-receipt.json).
- [Plan technique lisible](../plan-technique.md), [51 assertions fonctionnelles et suites propriétaires](../assertions-recette.json).

4843 exigences atomiques, 180526 assertions (180443 propriétés visuelles et 83 états/scénarios). Les 32 écrans appartiennent à ce périmètre, pas à la totalité des pages Figma. Les maîtres, variables, styles et descendants masqués sont conservés comme preuves de source et contexte ; leur présence ne crée pas un périmètre produit supplémentaire.

Les manifestes `kodjo.vnext.file-bundle.v1` relient les parties immuables dans `parts/` ; lecture par le lecteur intégré `vnext-file-bundle.read`, vérification de chaque empreinte physique et du contrat logique. La compression utilisée pour le transfert au connecteur GitHub n’est pas un changement du format stocké : les blobs publiés sont les octets JSON originaux, contrôlés par leur SHA Git. Une réponse tardive de transport ne vaut pas publication de branche.

La reconstruction à partir de l’adaptateur committé passe sans dérive de PlanContract/UIContract. 32 tests locaux ciblés des frontières Launch/transport passent ; il ne s’agit pas d’une certification VNext, d’un test applicatif PRE-4 ni d’une revue Claude. La revue doit être invoquée par une demande unique `plan-review` via le relais intégré ; son reçu indépendant reste à obtenir. L’approbation du propriétaire intervient ensuite sur le plan exact revu.
