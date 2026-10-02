# INDEX — Documentation du projet Routine

> Historique Bilatéralité du 13 septembre 2026 : cette séquence introduisait notamment un contrôle de côté au niveau Tour. Elle est supersédée sur ce point par D-189 du 24 septembre 2026 : aucun changement de côté n’est désormais exposé au niveau Tour ; la capacité technique historique est conservée pour non-régression.
>
> Mise à jour T03 du 15–16 septembre 2026 : le Catalogue des exercices entre dans le MVP T03 ; l’ancien T03 Exécution devient T04. Les corrections UX T03 sont intégrées directement au chapitre 06 et les décisions D-167 à D-187 au registre 07. Le modèle et la migration T03 sont désormais intégrés directement au chapitre 09. Le chapitre 13 constitue l’unique référence des contrats d’écran actifs : `CE-T03-01` à `CE-T03-17`, `CE-MEDIA-EXEC-01/02`, `CE-UI-01` à `CE-UI-09` et `CE-EXEC-SESSION-01`.
>
> Décision du 21 septembre 2026 — D-187 : dans chaque Catalogue, `Créer` est contextuel et ouvre directement la création de l’objet correspondant au Catalogue courant ; l’écran/arbre intermédiaire est supprimé. Les anciennes frames `3787:5148` et `3841:8375` sont conservées comme évidences historiques, non comme cible fonctionnelle.
>
> Mise à jour fonctionnelle et Figma du 24 septembre 2026 — D-188 à D-198 : Étiquette = classification/couleur de Séance ; Catégorie = classification/couleur d’Exercice ; changement de côté non exposé au niveau Tour ; Point d’arrêt ; Compte à rebours et Fin propres à l’Exercice ; filtre mémorisé uniquement dans la session courante ; roulettes en modale basse ; parcours de composition exposant la sélection depuis le Catalogue sans suppression de la création locale existante ; média déployable dans le Catalogue des Exercices ; actions `Planifier / Dupliquer / Archiver`, puis `Supprimer` dans les archives ; nouveau layout/typographie d’Exécution.
>
> Mise à jour Figma/documentation du 24 septembre 2026 : la rangée Catalogue `Créer / Filtrer / Trier` et les panneaux ouverts de `Filtrer` sont conçus et vérifiables dans Figma. Les options de filtre sont contextuelles au Catalogue ; `Trier` reste visible disabled T03. L’éditeur Exercice applique D-232 : Répétitions affiche `Durée totale ≥ {estimation}` avec 2 secondes par répétition en V1 ; À l’échec n’affiche pas de Durée totale ; `Renforcement du genou` est une valeur de démonstration et `Nom de l’exercice` l’état vide/placeholder.
>
> Décision du 24 septembre 2026 — D-199 : les Zones corporelles constituent désormais un référentiel utilisateur administrable. L’utilisateur peut créer, renommer et supprimer des Zones corporelles ; la liste initiale de dix zones devient un jeu de valeurs par défaut et non une liste fermée. La frame Figma `4683:6336` matérialise la création inline d’une nouvelle zone.
>
> Décision du 24 septembre 2026 — D-200 : Étiquettes, Catégories et Zones corporelles utilisent une règle commune de suppression. Toutes les valeurs, y compris celles fournies initialement par KODJO, sont supprimables. Un appui long sur une option ouvre une modale `Annuler / Supprimer`; la suppression retire la valeur des choix futurs mais conserve les affectations existantes et l’historique.
>
> Décision du 24 septembre 2026 — D-201 : `Parcours` devient le terme fonctionnel et UX de référence pour l’entité post-MVP correspondante. La documentation de référence est alignée ; les identifiants techniques existants restent inchangés jusqu’à leur éventuel renommage dans le code, et Figma est à aligner dans l’étape suivante.
>
> Décision du 24 septembre 2026 — D-202 : `Exercice` devient le terme fonctionnel et UX de référence en remplacement de `Activité`. La documentation fonctionnelle et Figma doivent utiliser `Exercice` / `Exercices`; les identifiants techniques existants (`ActivityDefinition`, `SessionActivity`, `API-ACT-*`, etc.) restent inchangés tant qu’ils ne sont pas renommés dans le code.

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
| 06 | [Écrans et navigation de la V1](./Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) | Décrit les écrans, modales, contenus, navigation et corrections UX T03. | Référence T03 consolidée |
| 07 | [Registre des décisions de conception](./Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) | Enregistre les décisions validées, dont D-167 à D-186. | Référence décisionnelle T03 |
| 08 | [Conception fonctionnelle détaillée](./Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) | Décrit le fonctionnement détaillé, l’exécution et les calculs. | Baseline MVP T03 |
| 09 | [Modèle de données fonctionnel](./Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) | Définit entités, relations et cycles de vie. | Baseline MVP T03 |
| 10 | [Processus métier et règles métier transverses](./Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) | Centralise les règles métier et de calcul. | Baseline MVP T03 |
| 11 | [API fonctionnelles](./Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md) | Décrit opérations et services fonctionnels. | Baseline MVP T03 |
| 12 | [Architecture technique](./Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md) | Décrit architecture, stockage, état, intégrations natives et tests. | Baseline MVP T03 |
| 13 | [Contrats d’écran](./Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md) | Spécification déterministe des écrans T03 ; 30 contrats à 21 sections (630 rubriques), avec réserves amont et statuts des preuves explicites, couverture E01–E73, rangée Catalogue, Filtrer/Trier et frontière T03/T04. | Référence normative T03 unique |

## 4. Images et maquettes

Les captures intégrées aux spécifications sont stockées dans :

[`docs/Specifications-fonctionnelles/images`](./Specifications-fonctionnelles/images/)

L’inventaire complet des preuves visuelles — numéro documentaire, titre, node Figma, fichier, dimensions, type de preuve et statut — est tenu dans :

[Registre des évidences Figma](./Specifications-fonctionnelles/images/README-T03-FIGMA.md)

Les captures sont des fichiers image physiques du dépôt, référencés par chemins relatifs. Elles restent donc visibles après export/import du dossier documentaire sans dépendre d’une URL Figma temporaire.

**Règle de localisation des copies d’écran : toutes les copies d’écrans et de modales utilisées dans les spécifications sont référencées exclusivement dans le chapitre `06 – Ecrans et navigation de la V1`. Le chapitre 13 n’embarque aucune copie d’écran ; il référence seulement les nodes Figma et les contrats déterministes.**

La maquette Figma constitue la référence visuelle et interactive. Les documents fonctionnels constituent la référence pour les règles, les calculs et les comportements. Un détail graphique n’est pas transformé automatiquement en règle fonctionnelle.

Évidences Figma T03 courantes contrôlées le 16 septembre 2026 :
- `3786:5093` — Catalogue des exercices — liste ;
- `3787:5148` — historique/supersédé — ancien Catalogue des exercices — Créer — arbre d’actions ;
- `1992:9910` — Catalogue des séances — liste par défaut ;
- `1992:10129` et `1992:10320` — Recherche globale — **archivés / hors Prototype MVP actif** (D-221) ;
- `3841:8375` — historique/supersédé — ancien Catalogue des séances — Créer — arbre d’actions ;
- `3561:4695`, `3561:7673`, `3561:7802` — éditeur Exercice Répétitions/À l’échec et roulette ;
- `3943:6064` — éditeur Exercice — état vide ;
- `3788:5258` — Composition — Ajouter un exercice — arbre ;
- `3789:5349` et `3789:5405` — sélection multiple d’Exercices existants ;
- `3879:5947` / `3879:6079` — création/modification d’un Exercice persistante ;
- `2028:11700` / `2028:11808` — Composition et actions glissées ;
- `2028:11204` — Composition séance — Étiquettes ;
- `1992:8626`, `1992:8132`, `1992:8718`, `1992:8780`, `1992:8843`, `1992:8996` — structures visuelles réutilisées pour Exécution directe, Synthèse et Suivi ;
- `2537:1033` — composant DSF canonique `Déployer` ;
- `6298:12462` — composant DSF canonique `Navigation / Bottom`.

L’ancienne référence `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans le Figma courant ; elle ne constitue plus une évidence active. Aucun node de remplacement n’est inventé.

La rangée Catalogue `Créer / Filtrer / Trier` suit le DSF du 30 septembre : boutons contextuels visibles `34 pt`, pictogrammes `20 pt`, gaps `12 pt`, cibles au moins `44 × 44 pt` sans chevauchement ; pilules étendues hautes de `34 pt`. Les positions de référence ne sont pas des coordonnées absolues React Native.

Le contrôle `Déployer` du Catalogue des exercices réutilise le composant du Catalogue des séances et est actif dans le MVP pour afficher ou masquer le média associé. Les dessins des quatre destinations de navigation ont été corrigés à une dimension maximale de `24 pt` et recentrés dans leurs boîtes `32 × 32 pt`.

Les contrôles d’entrée `Créer`, `Filtrer` et `Trier` sont vérifiables. Les panneaux ouverts de `Filtrer` sont également conçus dans Figma avec des options contextuelles selon le Catalogue. `Trier` reste visible disabled dans le périmètre T03.

Le registre [`README-T03-FIGMA.md`](./Specifications-fonctionnelles/images/README-T03-FIGMA.md) distingue l’état Figma courant de l’état des copies binaires physiques. Le réexport documentaire complet du 16 septembre 2026 a remplacé les copies binaires des écrans référencés par le chapitre 06 au format `402 × 874 px`, ajouté la preuve canonique du composant `Status / Badge` (`3959:5970`) et consigné les points alors non résolus ; les arbitrages fonctionnels concernés ont depuis été clôturés, les seules limites restantes relevant d’évidences Figma `NON VÉRIFIABLES` à traiter lors du prochain inventaire.

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
3. 04 – Modèle fonctionnel ;
4. 06 – Écrans et navigation ;
5. 08 – Conception fonctionnelle détaillée ;
6. 09 – Modèle de données fonctionnel ;
7. 10 – Processus métier et règles métier ;
8. 11 – API fonctionnelles ;
9. 12 – Architecture technique ;
10. 13 – Contrats d’écran T03 ;
11. matrice T03.

## 6. Ordre de référence en cas de contradiction

En cas de contradiction, appliquer l’ordre suivant :
1. décision validée dans le registre des décisions 07 ;
2. glossaire, modèle fonctionnel et modèle de données ;
3. conception fonctionnelle détaillée ;
4. écrans et navigation du chapitre 06 ;
5. contrats d’écran du chapitre 13 ;
6. versions du produit et vision générale ;
7. documents de travail et revues externes.

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
- Durée estimée et borne minimale `≥` en présence d’Exercices en Répétitions ou À l’échec ;
- phrase de synthèse selon D-232 : Durée totale en Durée si plusieurs Séries ou changement de côté ; estimation `≥` en Répétitions avec 2 s/répétition en V1 ; aucune Durée totale en À l’échec ;
- les noms d’Exercice visibles dans les maquettes renseignées sont des données de démonstration ; `Nom de l’exercice` représente l’état vide/placeholder ;
- distinction entre **Pause après chaque série**, **Pause entre les côtés** et **Récupération après exercice** ;
- temps actif et Durée réelle hors Pause utilisateur ;
- distinction entre Nombre d’Exercices de la Composition, Nombre total d’Exercices à exécuter et Nombre d’Exercices exécutées ;
- progression hybride des Exercices chronométrés et des Exercices en Répétitions ou À l’échec ;
- calcul déterministe des occurrences périodiques.

Les chapitres 00 à 13 et les matrices transverses constituent la baseline documentaire préparée pour T03. Le chapitre 13 couvre explicitement les contenus élémentaires E01 à E73 ; E70 reste un invariant de migration non visuel rattaché au chapitre 09 et aux contrats de persistance concernés.

## 9. Baseline consolidée — Exercices, Récupération et Bilatéralité

La baseline distingue désormais trois concepts : la Pause après chaque série, la **Pause entre les côtés** intrinsèque à un Exercice bilatéral et la **Récupération après exercice** portée par l’occurrence d’Exercice dans une Séance/Parcours. Une `ActivityDefinition` ne porte plus de récupération post-exercice. Depuis D-189, aucun changement de côté n’est exposé au niveau Tour ; le support technique historique y reste conservé pour non-régression.

## 10. MVP T03 — Catalogue des exercices

Le Catalogue multi-type présente `Exercices / Séances / Parcours`. `Séances` reste sélectionné par défaut à l’ouverture initiale et après relance complète. T03 active le Catalogue des exercices persistantes, leur cycle de vie, leur insertion dans une Composition et leur Exécution directe. `Parcours` reste visible mais désactivé.

La navigation basse utilise le libellé permanent `Catalogues`. Les titres contextuels sont `Catalogue des séances`, `Catalogue des exercices` et `Catalogue des parcours`.

L’Exécution directe utilise une préparation fixe de `5 s`, l’origine `ACTIVITY`, une Synthèse à Ressenti obligatoire, le Suivi général identifié comme Exercice, les statistiques compatibles sans compter une Séance et le retour au Catalogue dans l’état du parcours courant. Cet état n’est pas conservé après relance complète.

Les cartes du Catalogue des exercices séparent l’ouverture en consultation/modification de l’action Lecture. Le contrôle `Déployer` est actif dans le MVP et affiche ou masque le média associé ; il réutilise le composant DSF du Catalogue des séances. Aucune poignée de déplacement n’est présente.

`Créer`, `Filtrer` et `Trier` forment la rangée commune de commandes Catalogue. La référence courante utilise des boutons contextuels visibles de `34 pt`, des pictogrammes de `20 pt`, des gaps de `12 pt` et des cibles ≥ `44 × 44 pt` sans chevauchement. Les options de `Filtrer` sont contextuelles et conçues dans Figma ; `Trier` est visible mais désactivé et le tri par défaut reste la dernière modification décroissante.

La sélection multiple depuis une Composition insère les Exercices selon leur ordre courant de présentation dans la liste filtrée. Chaque insertion est une copie indépendante. Un Exercice créée directement dans une Composition ne rejoint pas le Catalogue.

Le cycle de vie d’une `ActivityDefinition` comprend archivage, restauration et suppression définitive depuis les archives. Cette suppression ne cascade ni vers les copies déjà placées dans les Séances ni vers l’historique.

La migration T03 crée les structures de Catalogue et l’origine `ACTIVITY` sans promouvoir les `SessionActivity` historiques.

Les Parcours fonctionnels restent hors MVP. La consultation des médias déjà associés à un Exercice pendant l’Exécution est incluse au MVP par D-203 ; l’ajout/import et le stockage des médias restent gouvernés par D-066/D-068.

## 11. Matrices et rapports de traçabilité

- [Matrice T03 — Catalogue des exercices](./MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md)
- [Matrice de couverture Figma ↔ chapitre 06](./MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md)
- [Matrice exhaustive — Exercice, Récupération et Durée totale](./MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md)
- [Rapport de conformité — Récupération et Durée totale](./RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md)
- [Matrice exhaustive — Bilatéralité](./MATRICE-TRACABILITE-BILATERALITE.md)
- [Rapport de conformité — Bilatéralité](./RAPPORT-CONFORMITE-BILATERALITE.md)
- [Registre des évidences Figma embarquées](./Specifications-fonctionnelles/images/README-T03-FIGMA.md)
- [Contrats T03 déterministes](./Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md)

## 15. Conceptions d’évolution validées

### [CONCEPTION-EXECUTION-MEDIA.md](./CONCEPTION-EXECUTION-MEDIA.md)

Conception fonctionnelle et UX de la consultation des médias pendant l’Exécution : bascule Information/Média, galerie ordonnée, vidéo, plein écran, mémoire limitée à la séance et cadre flottant d’Exécution. Les évidences Figma sont `5021:5994`, `5581:4257`, `4997:6113`, `5588:4363` et `5009:6069`.

La consultation média pendant l’Exécution décrite ici est **incluse au MVP** (confirmation du 28/09/2026). L’ajout/import dans l’éditeur n’est pas couvert par cette décision.

> Décision du 28 septembre 2026 — D-203 : les états de consultation média pendant l’Exécution `4997:6113` et `5009:6069` font partie du MVP ; l’ajout/import dans l’éditeur n’est pas inclus.  
> Décision du 25 septembre 2026 — D-206 : une Séance et un Exercice persistant sont tous deux des contenus autonomes exécutables et planifiables directement. Les Routines utilisent une source générique `SESSION` ou `ACTIVITY`; les Catalogues peuvent afficher conditionnellement la prochaine planification pour les deux types. Les anciennes formulations limitant la planification aux seules Séances sont supersédées.

> Décision du 25 septembre 2026 — D-207 : la notion de contenu planifiable est commune aux **Séances, Exercices persistants et Parcours**. Le MVP planifie `SESSION` et `ACTIVITY`; la planification d’un Parcours reste dans sa version prévue (actuellement V3) et réutilisera la même entité Routine avec la source technique `CIRCUIT`, sans second moteur de planification.

Durée intrinsèque : unilatéral Σ(Ti+Pi) ; Un côté après l’autre 2×Σ(Ti+Pi)+PC ; Les deux côtés à chaque série (N≥2) 2×ΣTi+ΣPi+N×PC. Répétitions : Ti=2×Ri s pour l’estimation ≥ seulement ; À l’échec : aucun total d’Exercice. Occurrence : T si R=0, T−PN+R si R>0. Compte à rebours propre/Fin propre exclus de ce total. Calcul inverse réservé à Durée uniforme, suivant v12 §5 ; variable : lecture seule et — si incomplet.

## Consolidation fonctionnelle — 26 septembre 2026

- **Exercice** est le terme UX ; **Circuit** est le groupe ordonné d’Exercices interne à une Séance ; un **Tour** est une répétition du Circuit ; **Parcours** reste l’entité autonome du Catalogue.
- Un nouvel Exercice valide possède exactement **une Catégorie** et **une ou plusieurs Zones corporelles**. L’Étiquette de Séance reste facultative.
- Une valeur de référentiel supprimée sort des choix futurs mais reste conservée sur les objets existants. Étiquette/Catégorie conservent nom et dernière couleur. La couleur appartient au référentiel et se répercute sur tous ses objets ; les Zones corporelles n’ont pas de couleur.
- Les défauts du Profil initialisent les nouveaux objets sans rétroactivité : Pause entre les côtés, Compte à rebours d’exercice et Fin d’exercice pour un nouvel Exercice ; Récupération après exercice pour une nouvelle occurrence de Séance.
- Une Séance possède un réglage global unique, activé par défaut, pour appliquer ou ignorer ensemble les Compte à rebours d’exercice et Fin d’exercice de tous ses Exercices.
- Dans le texte éditable, Durée affiche `Durée totale` si plusieurs Séries ou changement de côté (D-232); Répétitions affiche `Durée totale >= {estimation}` ; À l’échec n’affiche pas de Durée totale numérique.
- Point d’arrêt : `Exercice → Récupération après exercice → Point d’arrêt → suite`; interdit juste après le Compte à rebours initial et juste avant la Fin de séance ; autorisé aux frontières et dans le Circuit ; dans le Circuit il s’exécute à chaque Tour.
- En face Média compacte, le bouton Lecture central disparaît pendant la lecture vidéo ; le retour à Information met la vidéo en pause ; le plein écran n’interrompt pas l’Exécution.

> Décisions du 26 septembre 2026 — D-209 à D-218 : Circuit = groupe répété interne à une Séance, Tour = une répétition du Circuit, Parcours = entité autonome ; suppression des référentiels sans rupture des affectations existantes ; Catégorie obligatoire unique et Zones corporelles obligatoires multiples pour un nouvel Exercice ; Étiquette de Séance facultative ; couleur portée par Étiquette/Catégorie ; défauts Profil sans rétroactivité ; réglage global de Séance pour appliquer/ignorer Compte à rebours + Fin propres aux Exercices ; ancienne règle D-215 supersédée par D-232 : Durée totale affichée en mode Durée si plusieurs Séries ou changement de côté ; bouton Lecture vidéo compact masqué pendant lecture ; règles de placement/exécution du Point d’arrêt ; Splash Prototype MVP unique et actif.

> Décision du 26 septembre 2026 — D-219 : durées = roulettes en modale basse ; sélections d’objets = modales dédiées ; entiers simples `Nombre de Séries`, `Nombre de répétitions`, `Nombre de Tours` = steppers inline sans roulette. Les dialogues de confirmation restent centrés.


> Clôture Figma / DSF du 28 septembre 2026 — D-221 à D-230 : aucune recherche globale ou locale dans le MVP ; quatre destinations `Catalogues / Calendrier / Suivi / Profil` ; sélection simple validée au toucher versus sélection multiple avec `Sélectionner` ; titre `Planifier` contextuel ; fonds/zones de contexte, navigation basse, halos/actions circulaires, steppers/badges, modales/listes, roulettes et états spécialisés alignés sur DSF V2.


> Générateur de phrase des paramètres d’exécution : règles actives consolidées par D-232 (classeur v10 / spécification v10.2 + arbitrages du 28/09/2026). La stratégie V2 de la durée standard d’une répétition reste À CLARIFIER et n’affecte pas la V1.

## Mise à jour visuelle du 30 septembre 2026

[DSF — Cartes, icônes et animations d’appui](DSF-CARTES-ICONES-APPUIS-2026-09-30.md) : références actuelles de Cartes - Icônes et Démonstrations — Animations d’appui, tokens, composants, RG-1 à RG-13, journal des changements, écarts et critères atomiques. Décisions D-233 à D-239. Les 17 points sont clos ; D-195/D-206/D-208 sont révisées sur l’affichage seul par D-238. RG-3 seule reste reportée. Aucun changement de protocole ni de calcul métier n’est inclus.

## Propagation écran par écran — 30 septembre 2026

La [matrice courante des écrans](MATRICE-ECRANS-CARTES-2026-09-30.md) relie les 38 frames portant les nouveaux sets et les états complémentaires à leurs descriptions et contrats actualisés. Les anciennes règles d’affichage sont corrigées directement dans06/13 ; CE-UI-01 à05 couvrent Profil, Jour, Semaine/Mois, choix de source et formulaire de planification. Les captures remplacées le30/09 sont recensées dans le bilan de la matrice de couverture ; seules les captures non remplacées restent historiques.

### Captures remplacées le30 septembre2026

Contrôle exhaustif du 30 septembre 2026 : 113 frames du prototype et les 6 références complémentaires du rapport utilisateur, soit 119 captures Figma. Les 84 écrans du rapport sont couverts (78 dans le prototype). 74 fichiers existants sont actualisés et 45 copies documentaires complètent des écrans déjà présents dans Figma ; aucun écran applicatif ou Figma créé. [Matrice exhaustive](MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md).

### Lecture du chapitre Écrans et navigation

Le chapitre 06 regroupe chaque parcours sous son titre, sans numéros d’écran : vues principales, variantes, modales/confirmations et bulles restent près de leurs règles. L’Exécution rassemble aussi les variantes média et l’exécution directe ; la Composition inclut les points d’arrêt et les sélections d’exercices et d’étiquettes. Les chemins physiques des captures sont conservés. La matrice de couverture associe chaque nœud à sa famille.

### Réconciliation des branches documentaires

Les apports de #247 et #271 sont consolidés dans le [rapport de réconciliation](RAPPORT-RECONCILIATION-DOCUMENTAIRE-247-271.md). D-209 à D-232 conservent les décisions de #247 ; les décisions récentes de cartes et appuis portent désormais D-233 à D-239.

## Correction des contrats après audit — 30 septembre 2026

Les 30 contrats du chapitre13 ont chacun21 rubriques. Les contrats média sont complétés ; Splash, Profil principal, Exécution SESSION, Synthèse SESSION et référentiels d’Exercice possèdent un propriétaire explicite. CE-T03-16 décrit désormais les Étiquettes intégrées à Composition. Les prescriptions locales corrigées remplacent les anciens parcours dans ce chapitre ; les réserves de calcul/transitions/modèle amont restent explicites au §6, sans certification interactive. [Bilan et suivi des 47 constats](RAPPORT-CORRECTION-CONTRATS-2026-09-30.md).


## Paramètres en feuille basse —01/10/2026

- [Spécification active v12](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md) — remplace la saisie dans la phrase.
- [DSF de la feuille et de ses contrôles](DSF-PARAMETRES-MODALE-2026-10-01.md).
- [Transmission source](SOURCE-SAISIE-PARAMETRES-MODALE-2026-10-01.md).
- Chapitre06 :12 états illustrés et confirmation2234:189 restaurée. Chapitre13 :30 contrats ×21rubriques, dont CE-UI-10.
- v10.2 et ses captures de saisie sont historiques.

## Paramètres — consolidation du02/10/2026

Référence courante : [v12](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md), [DSF](DSF-SERIES-VARIABLES-2026-10-02.md), [matrice](MATRICE-SERIES-VARIABLES-2026-10-02.md) et [rapport](RAPPORT-MISE-A-JOUR-SERIES-VARIABLES-2026-10-02.md). D-247 à D-255 remplacent les anciennes formules et descriptions uniformes sur ce périmètre. Les règles de cartes sans rapport avec les paramètres restent conservées. Les nouvelles copies fournissent le layout ; elles ne prouvent ni intégration DSF ni conformité du moteur.
