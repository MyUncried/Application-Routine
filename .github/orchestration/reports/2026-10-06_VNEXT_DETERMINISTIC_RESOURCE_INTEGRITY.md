# VNext — intégrité déterministe des ressources et relance

## Source et périmètre

Demande utilisateur du 6 octobre 2026 : mettre en place la vérification déterministe puis relancer le test. Base distante : `8bc773a9992ee5c88248d3ce15562a48cc71f000`. Base locale : `541330d16e7fd95adc64c35d1962510937401c98`. Aucun changement applicatif, navigateur, contrôle de rendu, vérification visuelle humaine, PRE-1 ou audit supplémentaire.

## Diagnostic vérifié

Le run `37520798420` a livré et exécuté le petit exemple ; son test Node a passé. Claude a approuvé la revue d'implémentation, sans constat bloquant. L'orchestration a ensuite rejeté `consulted_resource_sha256` : quatre empreintes de ressources étaient attendues, cinq étaient déclarées. La cinquième est exactement celle de `execution.json` : `ca71bb85baaa6c8f844e9455759b14f3ac076c4daf02d37ac9b5fe1fcb59d56f`. Aucune des quatre ressources attendues ne manquait.

Cause : la comparaison stricte d'une liste produite par le modèle transformait une déclaration de consultation en condition bloquante. Cette déclaration ne démontre ni la lecture ni l'intégrité des fichiers. Le rejeu de la réponse réelle dans le validateur corrigé retourne APPROVE. Il valide la correction du rejet ; il ne transforme pas rétroactivement le run échoué en succès.

Les pièces utiles, dont le bundle Git de livraison, sont conservées dans `evidence/37520798420/`. Archive source : artifact `11440353152`, SHA-256 `fbaa498a98b7bdd8666735cb62eff8ce19c7a817d9177e727db3a3d786c8b56b`.

## Correctif

- Retrait de la déclaration des empreintes consultées du schéma et des critères de décision demandés à Claude. Les anciennes réponses contenant ce champ restent lisibles.
- Inventaire construit par le programme à partir des références gelées ; lecture et comparaison des octets réels avant et après revue, puis lors de la vérification du reçu.
- Reçu scellé comprenant les empreintes attendues et calculées, `producer: ORCHESTRATION` et `reading_attested: false`.
- Maintien des autres vérifications : assertions, scénarios, préservation, fichiers d'exécution, portée et avis sémantique de Claude.

L'intégrité mécanique n'atteste pas que Claude a lu chaque fichier et ne garantit pas un jugement sémantique déterministe.

## Validation et statut

32 tests ciblés passent. Trois régressions couvrent l'absence de déclaration du modèle, le fichier d'exécution supplémentaire dans une ancienne déclaration et le rejet d'une altération réelle sans écriture d'un reçu de succès.

Qualification complète, publication et relance : en cours. Les identifiants et résultats seront consignés après observation.
