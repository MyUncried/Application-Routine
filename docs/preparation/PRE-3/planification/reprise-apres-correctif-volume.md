# PRE-3 — reprise après le correctif de volume

Le correctif est isolé dans la PR #341, basée sur la branche de planification PRE-3. Il ne modifie pas l'application et ne constitue ni une revue indépendante ni une approbation du plan.

## Ce qui est établi

Le scellement calcule les empreintes par flux. Le transport conserve les valeurs complètes dans des fichiers bornés à 8 MiB, contrôlés par manifeste et empreintes. Les lecteurs de revue, reprise, admission et projection Markdown comprennent ce format. Les vues du plan autorisé lisent les parties à la révision Git protocolaire, plutôt que dans la copie applicative modifiable. Les contrats de petit volume restent compatibles avec le transport historique.

Le paquet réel a été reconstruit : 6384 exigences, 243974 assertions, 41 frames Figma et 95 états. Les empreintes des contrats publiés restent identiques :

| Contrat | Empreinte |
| --- | --- |
| PlanContract | `5145cbd30860f9ddef041ed33b97a71697517a3ef248229112bb0f5f7b92006f` |
| UI | `d4aa55ad8a0752ae4083a33a96d5d006491258ab1dee5bf2856610ec9399e4c9` |
| Registre | `efa418ec5b9c9d32b2254e805245f8d0c9ad63777240c4a09a3093a2934f8584` |

La relecture du conteneur produit avec la révision `c60a14b6f82f934ebd67a51f15e91d7de2e50b4d` vérifie l'empreinte `0b9ab5f0a45b0fa86c061d181f4f275a77ed18e6a03ef3e9e985c4e26acbfd66`. Les contrôles complets du paquet précédent ont également réussi. Cette preuve de fidélité des données ne prouve pas que Claude a effectué une revue sémantique.

Validation ciblée : 55 tests de régression des contrats et du transport ; 28 tests du transport, du plan autorisé et de la chaîne de revue ; 52 tests des consommateurs Claude et de la vue du plan. Chaque commande termine sans échec. Ces ensembles se recouvrent : ne pas additionner leurs comptes comme des tests distincts.

## Raccordement à #340

1. Faire relire et intégrer le correctif #341 dans la branche PRE-3, puis fixer son SHA exact. Ne pas utiliser une branche mouvante comme preuve de revue.
2. Sur le runner possédant Git, Node et Claude Code authentifié, reconstruire le paquet avec les scripts versionnés ci-dessous. Le dossier de sortie doit être extérieur au checkout et neuf.
3. Lancer la revue indépendante par `vnext-chain.js review`. Conserver la réponse et le reçu ; en cas d'interruption, utiliser `recover-review` avec les mêmes fichiers. Ne pas fabriquer un reçu ni remplacer la revue par les empreintes.
4. Publier le verdict et les éventuelles corrections dans #340. La préparation et la demande d'approbation ne suivent qu'après une revue valide. Hermann valide ensuite le plan final. Le développement reste interdit avant cette validation.

Depuis le checkout propre de la révision intégrée, remplacer `../pre3-review` par un dossier neuf extérieur au checkout :

```sh
node --max-old-space-size=6144 docs/preparation/PRE-3/planification/lancer-source-vnext.cjs ../pre3-review
node --max-old-space-size=7168 docs/preparation/PRE-3/planification/construire-contrats-vnext.cjs ../pre3-review ../pre3-review/launch.json
```

Créer ensuite un fichier de configuration JSON avec des chemins absolus :

```json
{
  "produced_file": "/CHEMIN/EXTERIEUR/pre3-review/produced.json",
  "evidence_directory": "/CHEMIN/EXTERIEUR/pre3-review/claude-review"
}
```

Le nom réel du fichier produit doit être contrôlé dans la sortie du constructeur avant de lancer :

```sh
node scripts/kodjo/vnext-chain.js review /CHEMIN/review-config.json /CHEMIN/EXTERIEUR/pre3-review/review-receipt.json
```

`claude-review` doit être neuf. Claude Code n'est pas installé dans l'environnement ayant effectué le diagnostic ; aucun lancement indépendant n'y est attesté. La capacité d'une session Claude à examiner les 304638 cibles reste à vérifier par un lancement réel. Les règles de couverture et les obligations essentielles ne sont pas réduites par ce correctif.

## Invariants

Conserver #340, P3-01..P3-23, la source figée `3019c5f8c4a38efb83865635e0a8d67d48a5b5ab`, la baseline applicative `1ddfb6d144552f578388257adc78db47ab5992c8`, D-334 et D-335. Aucun démarrage PRE-4, aucune approbation anticipée. Les gros paquets reconstruits sont des sorties reproductibles ; ils ne sont pas publiés intégralement dans Git par cette PR. Les scripts et le présent état de reprise sont versionnés.
