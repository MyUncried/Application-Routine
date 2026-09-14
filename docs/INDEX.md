# INDEX — Documentation du projet Routine

> Rectification Bilatéralité du 13 septembre 2026 : contrôle Tour `42 × 34 pt` sans titre visible, contrôle Activité `74 × 42 pt` en grille, confirmation d’activation conditionnelle, direction propre sur les cartes et synthèses, libellé `Durée totale` harmonisé. Voir D-146 et D-152 à D-155, CE-T01-13, CE-T02-01 et CE-BIL-01/02/02A.

## 1. Objet

Ce fichier constitue le point d’entrée de la documentation du projet.

Il indique :
- le rôle de chaque document ;
- l’ordre de lecture recommandé ;
- l’état actuel des chapitres ;
- les documents de référence à utiliser en cas de contradiction ;
- l’état de la baseline documentaire du MVP.

## 2. Documents de synthèse

### [PRODUCT.md](./PRODUCT.md)

Synthèse du produit, du périmètre du MVP, des concepts structurants, des principales règles fonctionnelles et des contraintes techniques initiales.

Ce document permet de comprendre rapidement ce qui doit être développé, mais ne remplace pas les spécifications détaillées.

### [README.md](./README.md)

Présentation générale du dépôt et indications de démarrage du projet.

### Revue Claude

Les documents de travail relatifs aux revues de Claude sont normalement regroupés dans un dossier `Revue-claude`. Ce dossier n’est pas inclus dans la présente archive documentaire.

Ils constituent un historique et un registre de travail des remarques traitées. Ils ne constituent pas des spécifications de référence.

Toute décision issue d’une revue externe n’est considérée comme intégrée au produit qu’après sa validation et sa répercussion dans les documents de référence concernés, notamment le registre des décisions.

## 3. Documentation fonctionnelle et technique de référence

La documentation détaillée se trouve dans le dossier [`Specifications-fonctionnelles`](./Specifications-fonctionnelles/).

| Ordre | Document                                                                                                                                                                    | Rôle                                                                                                                                  | État actuel                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 00    | [Glossaire](./Specifications-fonctionnelles/00%20%E2%80%93%20Glossaire.md)                                                                                                  | Définit les termes fonctionnels et les conventions de vocabulaire du projet.                                                          | Baseline MVP                                   |
| 01    | [Vision générale](./Specifications-fonctionnelles/01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md)                                                                       | Présente la finalité, la vision du produit et ses principes directeurs.                                                               | Baseline MVP                                   |
| 02    | [Utilisateurs et besoins](./Specifications-fonctionnelles/02%20%E2%80%93%20Utilisateurs%20et%20besoins.md)                                                                  | Décrit les utilisateurs visés, leurs besoins et les situations d’usage.                                                               | Baseline MVP                                   |
| 03    | [Parcours utilisateur](./Specifications-fonctionnelles/03%20%E2%80%93%20Parcours%20utilisateur.md)                                                                          | Décrit les parcours principaux et complémentaires du MVP.                                                                             | Baseline MVP                                   |
| 04    | [Modèle fonctionnel](./Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md)                                                                         | Définit les concepts fonctionnels et leurs relations.                                                                                 | Baseline MVP                                   |
| 05    | [Versions du produit](./Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md)                                                                          | Répartit les fonctionnalités entre le MVP et les versions futures.                                                                    | Baseline MVP                                   |
| 06    | [Écrans et navigation de la V1](./Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md)                                                | Décrit les écrans, les modales, leur objectif, leur contenu et la navigation.                                                         | Baseline MVP                                   |
| 07    | [Registre des décisions de conception](./Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md)                               | Enregistre les décisions validées et leur intégration dans la documentation.                                                          | Baseline MVP                                   |
| 08    | [Conception fonctionnelle détaillée](./Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md)                                  | Décrit le fonctionnement détaillé de la composition, de l’exécution, de la planification, du suivi et les règles de calcul associées. | Baseline MVP                                   |
| 09    | [Modèle de données fonctionnel](./Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md)                                          | Définit les entités, attributs, relations, cycles de vie et règles de cohérence des données.                                          | Baseline MVP                                   |
| 10    | [Processus métier et règles métier transverses](./Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) | Centralise les règles métier et les règles de calcul identifiées par un ID.                                                           | Baseline MVP                                   |
| 11    | [API fonctionnelles](./Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md)                                                                              | Décrit les opérations et services fonctionnels nécessaires au développement.                                                          | Baseline MVP                                   |
| 12    | [Architecture technique](./Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md)                                                                      | Décrit l’architecture, le stockage, l’état applicatif, les intégrations natives, les tests et les validations techniques à réaliser.  | Baseline MVP avec spikes techniques identifiés |
| 13    | [Contrats d’écran](./Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md)                                                                       | Définit, frame par frame, les éléments obligatoires, les données, les contrôles, le layout et les critères de conformité nécessaires au développement et à la recette. | T01 révisée ; T02 et T03 couverts |


## 4. Images et maquettes

Les captures intégrées aux spécifications sont stockées dans :

[`docs/Specifications-fonctionnelles/images`](./Specifications-fonctionnelles/images/)

Les fichiers image illustrent les écrans décrits dans les chapitres 06 et 08. Le chapitre 13 référence chaque frame Figma par son ID et précise les critères permettant de comparer l’implémentation à cette référence visuelle.

La maquette Figma constitue la référence visuelle et interactive. Les documents fonctionnels constituent la référence pour les règles, les calculs et les comportements.

En cas d’évolution d’un écran, Figma et les captures de référence du dépôt doivent être maintenus cohérents. Un ajustement cosmétique mineur explicitement validé peut toutefois être développé avant son report dans Figma ; il doit être tracé puis réaligné ultérieurement, sans devenir une règle fonctionnelle ni imposer une mise à jour préalable de Figma à chaque correction cosmétique.

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
3. 04 – Modèle fonctionnel ;
4. 06 – Écrans et navigation ;
5. 08 – Conception fonctionnelle détaillée ;
6. 09 – Modèle de données fonctionnel ;
7. 10 – Processus métier et règles métier transverses.
8. 13 – Contrats d’écran applicables à la tranche développée.

Pour préparer l’implémentation technique :
1. 06 – Écrans et navigation ;
2. 13 – Contrats d’écran applicables à la tranche développée ;
3. 11 – API fonctionnelles ;
4. 12 – Architecture technique ;
5. `README.md` et les fichiers de configuration du projet.

## 6. Ordre de référence en cas de contradiction

En cas de contradiction, appliquer l’ordre suivant :
1. décision validée dans le registre des décisions ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation ;
5. contrats d’écran ;
6. versions du produit et vision générale ;
7. documents de travail, historiques et revues externes.

`PRODUCT.md` est une synthèse du périmètre et ne prévaut pas sur les spécifications détaillées.

Une contradiction ne doit pas être résolue silencieusement. Elle doit être signalée, arbitrée, puis corrigée dans tous les documents concernés.

## 7. Règles de mise à jour

Toute évolution fonctionnelle doit identifier son impact sur :
- le registre des décisions ;
- Figma ;
- les écrans et la navigation ;
- les contrats d’écran concernés ;
- la conception fonctionnelle détaillée ;
- le modèle de données ;
- les règles métier et les règles de calcul ;
- les API ;
- l’architecture technique ;
- la version du produit ;
- `PRODUCT.md` lorsque la synthèse du produit est affectée.

Obsidian reste l’outil de rédaction de la documentation fonctionnelle. Le dossier GitHub doit être synchronisé après chaque étape documentaire stabilisée.

## 8. État de la baseline avant développement

Les contre-revues et revues transverses fonctionnelles et techniques ont été intégrées dans la documentation de référence.

Les règles de calcul nécessaires au MVP ont été formalisées, notamment :
- Durée estimée et borne minimale `≥` en présence d’Activités en Répétitions ou À l’échec ;
- Durée totale d’une Activité en mode Durée, dépendance avec le nombre de Séries et règle d’arrondi ;
- distinction entre Pause entre Séries d’un même côté et Récupération après tous les côtés d’une Activité autonome ou après chaque passage de Tour bilatéral ;
- temps actif et Durée réelle hors Pause utilisateur ;
- distinction entre Nombre d’Activités de la Composition, Nombre total d’Activités à exécuter et Nombre d’Activités exécutées ;
- progression hybride des Activités chronométrées et des Activités en Répétitions ou À l’échec ;
- calcul déterministe des occurrences périodiques.

Les chapitres 00 à 12 constituent la **baseline documentaire générale du MVP**. Le chapitre 13 complète cette baseline par les contrats opérationnels T01 révisés, T02 et T03. Un écran dont le contrat est validé doit être développé et recetté conformément à ce contrat en plus des chapitres 00 à 12.

Les points explicitement identifiés dans le chapitre 12 comme spikes, validations techniques ou validations sur appareils ne constituent pas des décisions fonctionnelles ouvertes. Ils doivent être vérifiés au moment prévu pendant le développement et documentés si leur résultat impose une évolution de la baseline.

Toute modification fonctionnelle ultérieure doit être traitée comme une évolution explicite de cette baseline et répercutée conformément à la section 7.

## 9. État de référence après décisions Activités, Médias et Circuits

La mise à jour du 6 septembre 2026 étend transversalement les chapitres 00 à 13 : troisième mode `À l’échec` dans le MVP ; contrôle de Catalogue `Activités / Séances / Circuits` avec seule la vue Séances active dans le MVP ; bibliothèque d’Activités, médias multiples et Circuits en V2 ; planification des Circuits en V3. Les captures Catalogue et Activité ont été réexportées depuis les frames Figma courantes. La capture `creation-activite-a-l-echec.png` complète la couverture existante.

## 10. État de référence après unification de l’Activité

La mise à jour du 8 septembre 2026 supprime le type d’Activité `Récupération` et introduit une durée de Récupération facultative attachée à toute Activité. La Pause reste distincte. Pour `C` Séries, elle apparaît `C` fois lorsque la Récupération `R` vaut `0`, y compris après la dernière Série, ou `C − 1` fois lorsque `R > 0`, la Récupération remplaçant alors la dernière Pause. La mise à jour Bilatéralité du 10 septembre 2026 ajoute les états techniques `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT` aux Activités et aux Tours. Avec `L = 1` en unilatéral et `L = 2` en bilatéral, une Activité autonome en mode Durée suit `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` lorsque `R = 0`, sinon `C − 1` : ses Séries sont exécutées par côté, sans Pause ajoutée spécifiquement entre les côtés, puis sa Récupération une seule fois lorsqu’elle est positive. Un Tour bilatéral exécute toutes ses Activités pour le premier côté puis pour le second à chaque répétition. À son activation, seuls les réglages propres bilatéraux existants sont remis à `UNILATERAL`, après confirmation conditionnelle ; sous le Tour, tous les contrôles Activité sont propres `UNILATERAL`, désactivés et remplacés à l’Exécution par la direction du Tour. T03 est révisée pour exécuter ces plans bilatéraux, conserver des résultats séparés par côté et afficher uniquement `Côté droit` ou `Côté gauche` sous le nom de l’Activité.

## 11. Livrables de traçabilité

- [Matrice exhaustive — Activité, Récupération et Durée totale](./MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md)
- [Rapport de conformité final](./RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md)
- [Matrice exhaustive — Bilatéralité](./MATRICE-TRACABILITE-BILATERALITE.md)
- [Rapport de conformité final — Bilatéralité](./RAPPORT-CONFORMITE-BILATERALITE.md)
