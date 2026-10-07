# Entrée opérationnelle VNext

Le basculement est effectif uniquement lorsque `vnext-cutover/activation.json` est présent dans le commit exécuté et valide avec son plan et son registre legacy figés. La qualification historique de la branche VNext ne suffit pas à activer `main`.

La décision d’activer les nouvelles tranches vient de l’instruction utilisateur du 7 octobre 2026. L’alignement applicatif avec Figma réalisé par Claude Code reste un chantier distinct. Aucun nouveau cycle produit n’est lancé par cette intégration.

Pour connaître le protocole d’une tranche, depuis le dépôt synchronisé :

```bash
node scripts/kodjo/resolve-slice-protocol.js IDENTIFIANT_TRANCHE
```

Après activation, les tranches inscrites dans le registre figé conservent leur parcours legacy. Une nouvelle tranche utilise VNext, même après son inscription dans le registre de compatibilité. Les entrées de planification legacy refusent les nouvelles tranches VNext avant de construire le contexte ou d’appeler un modèle.

La préparation d’une nouvelle identité utilise la commande existante `activate-kodjo-v2-slice.js`, avec `--vnext-chain-file .github/orchestration/v2-slices/IDENTIFIANT_TRANCHE/prepared-chain.json`. Son nom reste compatible avec les outils existants ; le bootstrap préparé porte explicitement `protocol: VNEXT`. Il faut également fournir l’issue, les sources produit, les acteurs autorisés et la branche cible.

Le point d’entrée de planification VNext est :

```bash
node scripts/kodjo/start-kodjo-slice.js IDENTIFIANT_TRANCHE produce recette.json produit.json
```

Lorsque la planification comporte Figma, utiliser le stade `launch` avec la configuration de capture et de réconciliation, avant de produire les contrats techniques. Figma est la référence visuelle ; les documents définissent les comportements. La recette doit porter la même identité de tranche que la commande.

La suite du cycle utilise les stades existants de `vnext-chain.js` : revue, préparation, approbation explicite, admission et exécution locale. Les validations de sources, de plan approuvé, de périmètre, de preuves et de livraison restent applicables. L’activation ne vaut aucune approbation de plan ou de livraison.

Le chargement du routage lit les blobs du commit courant. Une modification locale non committée ne change pas le protocole. Une activation partielle ou altérée échoue explicitement. Un rollback scellé conserve les cycles VNext déjà engagés selon le contrat existant.
