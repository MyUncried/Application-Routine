# Documentation de KODJO

La documentation de référence forme un ensemble unique de treize chapitres. Les règles métier, calculs et comportements sont définis ici ; Figma décrit les dispositions visuelles et illustre des états. Les valeurs de démonstration des captures ne définissent pas les calculs.

| Chapitre | Contenu |
|---|---|
| 01 | [Vision Générale](Specifications-fonctionnelles/01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md) |
| 02 | [Utilisateurs et besoins](Specifications-fonctionnelles/02%20%E2%80%93%20Utilisateurs%20et%20besoins.md) |
| 03 | [Parcours utilisateur](Specifications-fonctionnelles/03%20%E2%80%93%20Parcours%20utilisateur.md) |
| 04 | [Modèle fonctionnel](Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md) |
| 05 | [Versions du produit](Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md) |
| 06 | [Ecrans et navigation de la V1](Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) |
| 07 | [Registre des décisions de conception](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) |
| 08 | [Conception fonctionnelle détaillée](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) |
| 09 | [Modèle de données fonctionnel](Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) |
| 10 | [Processus métier et règles métier transverses](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) |
| 11 | [API fonctionnelles](Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md) |
| 12 | [Architecture technique](Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md) |
| 13 | [Contrats d’écran](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md) |

Le glossaire est intégré au chapitre 01. Les captures sont centralisées au chapitre 06, les contrats d’écran au chapitre 13. Les annexes de spécification et de consolidation ont été réintégrées aux chapitres concernés. L’historique des modifications reste consultable dans Git.

La documentation décrit la conception attendue ; elle ne constitue pas une preuve de réalisation ni de qualification sur appareil. Les limites fonctionnelles encore ouvertes sont indiquées dans le sujet concerné.

## Autorité documentaire — ce qui est décidé

Cette section est une aide à la navigation. Elle regroupe, sans en ajouter, les règles d'autorité déjà décidées explicitement. Elle ne tranche par elle-même aucun point d’autorité.

- **Comportements et calculs / rendu.** « Spécifications et arbitrages déterminent calculs et comportements ; Figma définit uniquement le layout/rendu. Exemples chiffrés et câblages ne sont jamais une règle. » ([D-255](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md), confirmée par D-300.) Voir aussi le chapitre 13, « Clarification d’autorité et de portée ».
- **Décisions.** Les décisions validées du chapitre 07 s’appliquent dans leur portée. Une décision n’en remplace une autre que si elle le dit explicitement (`PRODUCT.md`, § Gouvernance documentaire, rang 1 : « arbitrages explicitement supersédants »). Une règle n’est pas remplacée du seul fait qu’un texte est plus récent ou placé ailleurs.
- **Chapitres 08 et 13.** « Aucune priorité automatique entre le chapitre 08 et le chapitre 13 : une contradiction entre eux qui n’est pas résolue par une décision explicite reste `À CLARIFIER`. » (D-376.)
- **DSF, D-339 et D-341.** « D-339 conserve son comportement de fermeture après sélection, y compris dans les popovers ; présentation D-341 remplacée par les DSF validés. » (D-377.)

En cas de contradiction entre deux passages, les deux sont conservés jusqu’à décision explicite.
