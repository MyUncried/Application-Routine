# INDEX — Documentation du projet Routine

> Rectification Bilatéralité du 13 septembre 2026 : contrôle Tour `42 × 34 pt` sans titre visible, contrôle Activité `74 × 42 pt` en grille, confirmation d’activation conditionnelle, direction propre sur les cartes et synthèses, libellé `Durée totale` harmonisé. Voir D-146 et D-152 à D-155.
>
> Mise à jour T03 du 15 septembre 2026 : le Catalogue des activités entre dans le MVP T03 ; l’ancien T03 Exécution devient T04. Les arbitrages UX, données et migration sont consolidés dans les compléments 06 bis, 07 bis et 09 bis, la matrice T03 et le chapitre 13. Les contrats d’écran T03 actifs sont `CE-T03-01` à `CE-T03-17`. L’ancien chapitre 13 est conservé bit à bit dans `13A – Contrats d’écran hérités avant T03 Catalogue.md` pour traçabilité ; ses anciens contrats `CE-T03-01..13` d’Exécution de Séance sont remappés vers T04 et ne sont plus normatifs pour T03. `13B – Complément contrats T03 – Filtrer et Trier.md` complète normativement CE-T03-01/02/05 : `Filtrer` est fonctionnel sur Activités au minimum pour `Archivées`, `Trier` reste visible disabled, et aucune option non arbitrée ne doit être inventée.

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

Les documents de travail relatifs aux revues de Claude sont normalement regroupés dans un dossier `Revue-claude`. Ils constituent un historique et un registre de travail des remarques traitées et ne constituent pas des spécifications de référence.

Toute décision issue d’une revue externe n’est considérée comme intégrée au produit qu’après sa validation et sa répercussion dans les documents de référence concernés, notamment le registre des décisions.

## 3. Documentation fonctionnelle et technique de référence

La documentation détaillée se trouve dans le dossier [`Specifications-fonctionnelles`](./Specifications-fonctionnelles/).

| Ordre | Document | Rôle | État actuel |
|---|---|---|---|
| 00 | [Glossaire](./Specifications-fonctionnelles/00%20%E2%80%93%20Glossaire.md) | Définit les termes fonctionnels et conventions de vocabulaire. | Baseline MVP T03 |
| 01 | [Vision générale](./Specifications-fonctionnelles/01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md) | Présente la finalité, la vision et le périmètre. | Baseline MVP T03 |
| 02 | [Utilisateurs et besoins](./Specifications-fonctionnelles/02%20%E2%80%93%20Utilisateurs%20et%20besoins.md) | Décrit les utilisateurs visés et leurs besoins. | Baseline MVP T03 |
| 03 | [Parcours utilisateur](./Specifications-fonctionnelles/03%20%E2%80%93%20Parcours%20utilisateur.md) | Décrit les parcours principaux. | Baseline MVP T03 |
| 04 | [Modèle fonctionnel](./Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md) | Définit les concepts et leurs relations. | Baseline MVP T03 |
| 05 | [Versions du produit](./Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md) | Répartit les fonctionnalités entre MVP et versions futures. | Baseline MVP T03 |
| 06 | [Écrans et navigation de la V1](./Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) | Décrit les écrans, modales, contenus et navigation. | Baseline + complément T03 |
| 06 bis | [Corrections UX T03 Catalogue](./Specifications-fonctionnelles/06%20bis%20%E2%80%93%20Corrections%20UX%20T03%20Catalogue.md) | Supersède les formulations UX historiques incompatibles avec les arbitrages T03 ; fixe aussi la règle commune Filtrer/Trier. | Référence T03 |
| 07 | [Registre des décisions de conception](./Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) | Enregistre les décisions validées. | Baseline MVP |
| 07 bis | [Arbitrages T03 du 15 septembre 2026](./Specifications-fonctionnelles/07%20bis%20%E2%80%93%20Arbitrages%20T03%20du%2015%20septembre%202026.md) | Consolide D-167 à D-184 et supersède les règles antérieures divergentes. | Référence T03 |
| 08 | [Conception fonctionnelle détaillée](./Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) | Décrit le fonctionnement détaillé, l’exécution et les calculs. | Baseline MVP T03 |
| 09 | [Modèle de données fonctionnel](./Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) | Définit entités, relations et cycles de vie. | Baseline MVP T03 |
| 09 bis | [Modèle et migration T03 Catalogue](./Specifications-fonctionnelles/09%20bis%20%E2%80%93%20Mod%C3%A8le%20et%20migration%20T03%20Catalogue.md) | Précise ActivityDefinition/SessionActivity, cycle de vie et migration T03. | Référence T03 |
| 10 | [Processus métier et règles métier transverses](./Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) | Centralise les règles métier et de calcul. | Baseline MVP T03 |
| 11 | [API fonctionnelles](./Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md) | Décrit opérations et services fonctionnels. | Baseline MVP T03 |
| 12 | [Architecture technique](./Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md) | Décrit architecture, stockage, état, intégrations natives et tests. | Baseline MVP T03 |
| 13 | [Contrats d’écran](./Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md) | Spécification déterministe des écrans T03 ; contrats `CE-T03-01..17`, couverture T03-E et frontière T03/T04. | Référence normative T03 |
| 13A | [Contrats d’écran hérités avant T03 Catalogue](./Specifications-fonctionnelles/13A%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran%20h%C3%A9rit%C3%A9s%20avant%20T03%20Catalogue.md) | Copie historique bit à bit de l’ancien chapitre 13 ; conserve les contrats T01/T02 et la provenance des anciens contrats d’Exécution. | Historique ; anciens `CE-T03-01..13` remappés T04 |
| 13B | [Complément contrats T03 — Filtrer et Trier](./Specifications-fonctionnelles/13B%20%E2%80%93%20Compl%C3%A9ment%20contrats%20T03%20%E2%80%93%20Filtrer%20et%20Trier.md) | Complète CE-T03-01/02/05 sur les contrôles Catalogue dont le détail visuel n’est pas encore conçu. | Référence normative T03 ; rendu détaillé Figma partiellement non vérifiable |

## 4. Images et maquettes

Les captures intégrées aux spécifications sont stockées dans :

[`docs/Specifications-fonctionnelles/images`](./Specifications-fonctionnelles/images/)

Pour T03, les évidences Figma corrigées sont répertoriées et affichées dans :

[Évidences Figma — T03 Catalogue des activités](./Specifications-fonctionnelles/images/README-T03-FIGMA.md)

Les captures T03 sont des fichiers image physiques du dépôt, référencés par chemins relatifs. Elles restent donc visibles après export/import du dossier documentaire sans dépendre d’une URL Figma temporaire.

La maquette Figma constitue la référence visuelle et interactive. Les documents fonctionnels constituent la référence pour les règles, les calculs et les comportements. Un détail graphique n’est pas transformé automatiquement en règle fonctionnelle.

Évidences Figma T03 contrôlées le 15 septembre 2026 :
- `3786:5093` — Catalogue des activités — liste ;
- `3787:5148` — Catalogue — Créer — arbre d’actions ;
- `3787:5209` — Catalogue — action contextuelle directe ;
- `3788:5258` — Composition — Ajouter une activité — arbre ;
- `3789:5349` et `3789:5405` — sélection multiple d’Activités existantes ;
- `3879:5947` / `3879:6079` — création/modification d’une Activité persistante ;
- `2028:11700` / `2028:11808` — Composition et actions glissées ;
- `2028:11204` — Catégories ;
- `1992:8626`, `1992:8132`, `1992:8718`, `1992:8780`, `1992:8843`, `1992:8996` — structures visuelles réutilisées pour Exécution directe, Synthèse et Suivi ;
- `2537:1033` — composant DSF canonique `Déployer` ;
- `2537:214` — composant DSF canonique `Navigation / Bottom`.

Le contrôle `Déployer` du Catalogue des activités réutilise exactement le composant du Catalogue des séances ; il reste visible mais fonctionnellement désactivé en T03. Les dessins des quatre destinations de navigation ont été corrigés à une dimension maximale de `24 pt` et recentrés dans leurs boîtes `32 × 32 pt`.

Les contrôles communs `Filtrer` et `Trier` sont prévus pour les Catalogues, mais le détail visuel de leurs panneaux/options n’est pas encore conçu dans Figma. Pour T03 Activités, le comportement est néanmoins fixé : `Filtrer` permet au minimum `Archivées`; `Trier` est visible disabled. Toute conformité visuelle détaillée de ces panneaux reste `NON VÉRIFIABLE` jusqu’à création des frames Figma correspondantes.

## 5. Ordre de lecture recommandé

Pour comprendre le produit :
1. `PRODUCT.md` ;
2. 01 – Vision générale ;
3. 02 – Utilisateurs et besoins ;
4. 03 – Parcours utilisateur ;
5. 04 – Modèle fonctionnel ;
6. 05 – Versions du produit.

Pour préparer le développement T03 :
1. 00 – Glossaire ;
2. 07 – Registre des décisions ;
3. 07 bis – Arbitrages T03 ;
4. 04 – Modèle fonctionnel ;
5. 06 – Écrans et navigation ;
6. 06 bis – Corrections UX T03 ;
7. 08 – Conception fonctionnelle détaillée ;
8. 09 – Modèle de données fonctionnel ;
9. 09 bis – Modèle et migration T03 ;
10. 10 – Processus métier et règles métier ;
11. 11 – API fonctionnelles ;
12. 12 – Architecture technique ;
13. 13 – Contrats d’écran T03 ;
14. 13B – Complément Filtrer/Trier ;
15. matrice T03.

Le document 13A n’est consulté que pour la traçabilité ou pour les contrats T01/T02 historiques non supersédés ; ses anciens identifiants T03 d’Exécution de Séance doivent être lus comme T04.

## 6. Ordre de référence en cas de contradiction

En cas de contradiction, appliquer l’ordre suivant :
1. décision validée dans le registre des décisions ou arbitrage explicitement supersédant du 07 bis ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation, complétés pour T03 par 06 bis ;
5. contrats d’écran du chapitre 13, complétés par 13B pour `Filtrer`/`Trier` ;
6. versions du produit et vision générale ;
7. documents de travail, historiques et revues externes, dont 13A.

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

Les règles de calcul nécessaires au MVP ont été formalisées, notamment :
- Durée estimée et borne minimale `≥` en présence d’Activités en Répétitions ou À l’échec ;
- `Durée totale` visible dans les trois modes ; en Répétitions et À l’échec : `Durée totale : ≥ {durée connue}` ;
- distinction entre Pause entre Séries et Récupération ;
- temps actif et Durée réelle hors Pause utilisateur ;
- distinction entre Nombre d’Activités de la Composition, Nombre total d’Activités à exécuter et Nombre d’Activités exécutées ;
- progression hybride des Activités chronométrées et des Activités en Répétitions ou À l’échec ;
- calcul déterministe des occurrences périodiques.

Les chapitres 00 à 13B, leurs compléments T03 et les matrices transverses constituent désormais la baseline documentaire préparée pour T03. Le chapitre 13 couvre explicitement les contenus élémentaires E01 à E73 ; E70 reste volontairement un invariant de migration non visuel rattaché au modèle 09 bis et aux contrats de persistance concernés.

## 9. Baseline consolidée — Activités, Récupération et Bilatéralité

La baseline distingue une Activité, sa Pause entre Séries et sa Récupération après Activité. Elle comprend le mode `À l’échec`, la Durée totale calculée et les directions `UNILATERAL`, `RIGHT_LEFT` et `LEFT_RIGHT` pour l’Activité et le Tour. Les règles bilatérales validées restent inchangées et sont réutilisées par l’Exécution directe T03.

## 10. MVP T03 — Catalogue des activités

Le Catalogue multi-type présente `Activités / Séances / Circuits`. `Séances` reste sélectionné par défaut à l’ouverture initiale et après relance complète. T03 active le Catalogue des activités persistantes, leur cycle de vie, leur insertion dans une Composition et leur Exécution directe. `Circuits` reste visible mais désactivé.

La navigation basse utilise le libellé permanent `Catalogues`. Les titres contextuels sont `Catalogue des séances`, `Catalogue des activités` et `Catalogue des circuits`.

L’Exécution directe utilise une préparation fixe de `5 s`, l’origine `ACTIVITY`, une Synthèse à Ressenti obligatoire, le Suivi général identifié comme Activité, les statistiques compatibles sans compter une Séance et le retour au Catalogue dans l’état du parcours courant. Cet état n’est pas conservé après relance complète.

Les cartes du Catalogue des activités séparent l’ouverture en consultation/modification de l’action Lecture. Le contrôle `Déployer` est visible mais désactivé, utilise le même composant DSF `2537:1033` que le Catalogue des séances et occupe la même zone réservée sur toutes les cartes. Aucune poignée de déplacement n’est présente.

`Filtrer` et `Trier` sont des contrôles communs aux trois Catalogues. En T03 sur `Activités`, `Filtrer` est fonctionnel au minimum pour accéder à `Archivées`; aucune autre option n’est définie. `Trier` est visible mais désactivé ; le tri par défaut reste la dernière modification décroissante. Le détail visuel de ces panneaux n’est pas encore défini dans Figma et ne doit pas être inventé.

La sélection multiple depuis une Composition insère les Activités selon leur ordre courant de présentation dans la liste filtrée. Chaque insertion est une copie indépendante. Une Activité créée directement dans une Composition ne rejoint pas le Catalogue.

Le cycle de vie d’une `ActivityDefinition` comprend archivage, restauration et suppression définitive depuis les archives. Cette suppression ne cascade ni vers les copies déjà placées dans les Séances ni vers l’historique.

La migration T03 crée les structures de Catalogue et l’origine `ACTIVITY` sans promouvoir les `SessionActivity` historiques.

Les Circuits fonctionnels et les médias multiples restent hors MVP.

## 11. Matrices et rapports de traçabilité

- [Matrice T03 — Catalogue des activités](./MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md)
- [Matrice exhaustive — Activité, Récupération et Durée totale](./MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md)
- [Rapport de conformité — Récupération et Durée totale](./RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md)
- [Matrice exhaustive — Bilatéralité](./MATRICE-TRACABILITE-BILATERALITE.md)
- [Rapport de conformité — Bilatéralité](./RAPPORT-CONFORMITE-BILATERALITE.md)
- [Évidences Figma T03 embarquées](./Specifications-fonctionnelles/images/README-T03-FIGMA.md)
- [Contrats T03 déterministes](./Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md)
- [Complément contrats Filtrer/Trier](./Specifications-fonctionnelles/13B%20%E2%80%93%20Compl%C3%A9ment%20contrats%20T03%20%E2%80%93%20Filtrer%20et%20Trier.md)
