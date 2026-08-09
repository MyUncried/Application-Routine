# INDEX — Documentation du projet Routine

## 1. Objet

Ce fichier constitue le point d’entrée de la documentation du projet.

Il indique :
- le rôle de chaque document ;
- l’ordre de lecture recommandé ;
- l’état actuel des chapitres ;
- les documents de référence à utiliser en cas de contradiction.

## 2. Documents de synthèse

### [PRODUCT.md](./PRODUCT.md)

Synthèse du produit, du périmètre du MVP, des concepts structurants, des écrans de référence et des contraintes techniques initiales.

Ce document permet de comprendre rapidement ce qui doit être développé, mais ne remplace pas les spécifications détaillées.

### [README.md](../README.md)

Présentation générale du dépôt et indications de démarrage du projet.

### Revue Claude

Les documents de travail relatifs à la revue de Claude sont regroupés dans le dossier [`Revue-claude`](./Revue-claude/).

- [`Revue-Claude-Initial.md`](./Revue-claude/Revue-Claude-Initial.md) conserve la revue initiale réalisée par Claude et constitue la source des remarques à traiter.
- [`Revue_exhaustive_des_remarques_Claude.xlsx`](./Revue-claude/Revue_exhaustive_des_remarques_Claude.xlsx) est le registre de traitement de la revue. Il reprend les remarques individuellement, leur niveau de nécessité, la description précise du problème, la réponse actuelle du projet et le statut de traitement.

Ces fichiers sont des documents de travail et non des spécifications de référence. Lors du traitement d’une remarque, la réponse doit être vérifiée contre la documentation fonctionnelle à jour. Une décision validée doit ensuite être intégrée dans les documents de référence concernés et, si nécessaire, dans le registre des décisions.

## 3. Documentation fonctionnelle

La documentation détaillée se trouve dans le dossier [`Specifications-fonctionnelles`](./Specifications-fonctionnelles/).

| Ordre | Document | Rôle | État actuel |
| --- | --- | --- | --- |
| 00 | [Glossaire](./Specifications-fonctionnelles/00%20%E2%80%93%20Glossaire.md) | Définit les termes fonctionnels et les conventions de vocabulaire du projet. | À consolider pendant la revue Claude |
| 01 | [Vision générale](./Specifications-fonctionnelles/01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale%20mise%20%C3%A0%20jour.md) | Présente la finalité, la vision du produit et ses principes directeurs. | Disponible |
| 02 | [Utilisateurs et besoins](./Specifications-fonctionnelles/02%20%E2%80%93%20Utilisateurs%20et%20besoins.md) | Décrit les utilisateurs visés, leurs besoins et les situations d’usage. | Disponible |
| 03 | [Parcours utilisateur](./Specifications-fonctionnelles/03%20%E2%80%93%20Parcours%20utilisateur.md) | Décrit les parcours principaux et complémentaires du MVP. | Disponible |
| 04 | [Modèle fonctionnel](./Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md) | Définit les concepts fonctionnels et leurs relations. | Disponible |
| 05 | [Versions du produit](./Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md) | Répartit les fonctionnalités entre le MVP et les versions futures. | Disponible, à vérifier pendant la revue Claude |
| 06 | [Écrans et navigation de la V1](./Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) | Décrit les écrans, les modales, leur objectif, leur contenu et la navigation. | Mis à jour |
| 07 | [Registre des décisions de conception](./Specifications-fonctionnelles/07%20-%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) | Enregistre les décisions validées et leur intégration dans la documentation. | Disponible, à compléter pendant la revue Claude |
| 08 | [Conception fonctionnelle détaillée](./Specifications-fonctionnelles/08%20%E2%80%93%2008%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) | Décrit le fonctionnement détaillé du cycle de vie, de la composition, de l’exécution, de la planification et du suivi, avec les tableaux détaillés des écrans. | En cours de consolidation |
| 09 | [Modèle de données fonctionnel](./Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) | Définit les entités, attributs, relations, cycles de vie et règles de cohérence des données. | Disponible, à vérifier pendant la revue Claude |
| 10 | [Processus métier et règles métier transverses](./Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) | Centralise les règles métier identifiées par un ID. | À mettre à jour |
| 11 | [API fonctionnelles](./Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md) | Décrira les opérations et services fonctionnels nécessaires au développement. | À définir avant développement |
| 12 | [Architecture technique](./Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md) | Décrira l’architecture, le stockage, l’état applicatif, les intégrations natives et les tests. | À rédiger avec Claude avant développement |

## 4. Images et maquettes

Les captures intégrées aux spécifications sont stockées dans :

[`docs/Specifications-fonctionnelles/Images`](./Specifications-fonctionnelles/Images/)

Les fichiers image illustrent les écrans décrits dans les chapitres 06 et 08.

La maquette Figma constitue la référence visuelle et interactive. Les documents fonctionnels constituent la référence pour les règles et les comportements.

## 5. Ordre de lecture recommandé

Pour comprendre le produit :
1. `PRODUCT.md` ;
2. 01 – Vision générale ;
3. 02 – Utilisateurs et besoins ;
4. 03 – Parcours utilisateur ;
5. 04 – Modèle fonctionnel ;
6. 05 – Versions du produit.

Pour préparer le développement fonctionnel :
1. 00 – Glossaire ;
2. 07 – Registre des décisions ;
3. 06 – Écrans et navigation ;
4. 08 – Conception fonctionnelle détaillée ;
5. 09 – Modèle de données fonctionnel ;
6. 10 – Règles métier transverses.

Pour préparer l’implémentation technique :
1. 11 – API fonctionnelles ;
2. 12 – Architecture technique ;
3. `README.md` et les fichiers de configuration du projet.

## 6. Ordre de référence en cas de contradiction

En cas de contradiction, appliquer l’ordre suivant :
1. décision validée dans le registre des décisions ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation ;
5. versions du produit et vision générale ;
6. documents de travail, historiques et revues externes.

Une contradiction ne doit pas être résolue silencieusement. Elle doit être signalée, arbitrée, puis corrigée dans tous les documents concernés.

## 7. Règles de mise à jour

Toute évolution fonctionnelle doit identifier son impact sur :
- le registre des décisions ;
- Figma ;
- les écrans et la navigation ;
- la conception fonctionnelle détaillée ;
- le modèle de données ;
- les règles métier ;
- les API ;
- l’architecture technique ;
- la version du produit.

Obsidian reste l’outil de rédaction de la documentation fonctionnelle. Le dossier GitHub doit être synchronisé après chaque étape documentaire stabilisée.

## 8. Travaux documentaires prioritaires

Les prochains travaux sont :
1. traiter les remarques de Claude point par point ;
2. consolider le glossaire ;
3. mettre à jour le chapitre 10 ;
4. rédiger le chapitre 12 ;
5. effectuer une revue finale de cohérence avant le développement.
