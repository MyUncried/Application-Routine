# Documentation de KODJO

## Formats — base de reprise actualisée le 5 novembre 2026

**D-499 — précision validée par Hermann le 06/11/2026 :** « Valider les paramètres » apparaît uniquement lorsqu’une seconde étape est nécessaire et ouvre le récapitulatif sans enregistrer dans la séance. Dans ce cas, la coche du questionnaire reste grise et inactive. Sans seconde étape, la coche enregistre dans la séance lorsque les données sont complètes et cohérentes. Dans le récapitulatif, elle devient bleue et active lorsque les données sont complètes et cohérentes, puis enregistre dans la séance. Death by à un mouvement : questionnaire → coche → Composition, sans récapitulatif ; à deux mouvements : questionnaire → « Valider les paramètres » → récapitulatif → coche → Composition. L’enregistrement reste un ajout au brouillon de Composition, sans sauvegarde définitive de la Séance. Cette précision supersède la suppression générale du bouton dans les questionnaires ; les autres validations par coche restent applicables.

- [Catalogues, cartes et validation des modales — 5 et 6 novembre 2026](KODJO-Catalogues-cartes-modales-2026-11-06.md) : coche d’en-tête des modales, mode catalogue direct, couleurs par catalogue, onglets, cartes Séance et Mouvement, carte dépliée, écart du code (D-499 à D-509).
- [Badge « New » dans le catalogue des mouvements — 6 novembre 2026](KODJO-Badge-Nouveau-catalogue-mouvements-2026-11-06.md) : intégrée le 6/11/2026 (D-510).
- [Spécification active](KODJO-Formats-entrainement-2026-11-02.md) : création commune Catalogue/Composition, menu trois options, tableaux EMOM par série, Superset alterné, charges locales et règles Death by Répétitions/Durée. [Complément final du 5 novembre](sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md), appliqué à la base finale du 4 novembre. Validation EMOM bloquante ; Death by averti au premier rang incompatible puis borné à l’exécution.
- [Contrats CE-FMT-01 à 04](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#ce-fmt-01).
- [Galerie et état des captures](Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md#formats-galerie).
- [Plan PRE-9 révisé](../_bmad-output/pre9/planning-artifacts/epics.md).


> **Récupération et défauts Profil :** [règle validée](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#recuperation-exercice-et-defauts-profil). Récupération propre à l’Exercice ; même valeur dans Composition ; saisie exclusivement dans la modale ; Pause / Ajouter un arrêt réservé aux Points d’arrêt. Tous les défauts Profil repris sont sur fond orange jusqu’au premier ✓. [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

> **Composition — menu Créer :** [trois options et fermeture par le bouton +/Annuler](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#composition-menu-creer). Créer un exercice ouvre la modale commune Exercice libre / Formats. MENU-FMT-01 est remplacée par le parcours du 5 novembre. [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

> **Paramètres d’exécution — état cible :** [six blocs, libellés, côtés et durée calculée](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md#parametres-execution-etat-cible). D-413, D-431, D-447 et RM-243 actualisés ; Phases du mouvement reste le libellé de référence. Raccordement de la nouvelle ligne Récupération : **REC-PARAM-01 clos : récupération portée par l’Exercice et réglée dans la modale**, sans modification implicite de la Composition ou du contexte ACTIVITY. [Remplacé le 06/11/2026 pour la Composition uniquement — D-511 à D-513 : carte 72 pt, photo à 4/rayon 8 ; niveau en ligne 1, prescription en ligne 2 sans chronomètre, récupération conditionnelle en ligne 3 ; chevron de Circuit avant le nom ; placement réservé aux Points d’arrêt. Voir la spec Catalogues, cartes et modales du 06/11 §11.]

> **PRE-9 — contre-revue documentaire indépendante du 30/10/2026 :** [matrice de conformité des travaux 1 à 8 et constats C-01 à C-15](KODJO-PRE9-Matrice-conformite-revue-transverse-2026-10-30.md). Corrections ciblées des libellés CAT.2, du suivi BMAD et des règles FMT-21/FMT-32 ; réserves graphiques Figma maintenues, sans prétention de qualification applicative.

> **Coin inférieur droit « replié » des cartes — contrôle graphique du 30/10 :** [description et réserve de vérification Figma](KODJO-Coin-replie-cartes-2026-10-30.md). Aucun comportement métier n’est déduit ; nœud et variantes concernés à identifier avant d'en prescrire le rendu.

> **PRE-9 — arbitrages et Composition avec Formats consolidés le 30/10/2026 :** [règles actives D-01 à D-30, valeurs initiales, compatibilités et départs rapides](KODJO-PRE9-Arbitrages-Composition-Formats-Consolides-2026-10-30.md). ARB-04/22c/26–28 clos. Portage selon le partage temporel : Exercice autonome ou Circuit porteur ; la répétition groupée, le Cycle, l'échelle For time et les bornes AMRAP ont des portées distinctes. Les raccordements de l'exécution spécialisée restent PRE-10/11.

> **Résultats de recherche des Mouvements — PRE-9, 30/10/2026 :** [spécification finale](KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md) et CE-MVT-RESULT-01 au chapitre 13. Cartes Résultat avec « Ajouter un niveau » ; cartes Composition sans bouton et description tronquée ; regroupement des familles et choix de difficulté. Story CAT.2 immédiatement autorisée.

> **Zones de contexte des Catalogues — décision du 30/10/2026, PRE-9 :** [spécification finale de développement](KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md) et CE-CAT-CTX-01 au chapitre 13. Mouvements : compteurs familles/mouvements exclusifs et cumul avec recherche/filtres ; Séances : compteurs informatifs Un exercice/Plusieurs, bascule préservée ; « N résultats » sur filtres/archives. Cible Figma 402 × 874 pt ; story CAT.1 immédiatement réalisable dans PRE-9.

> **Composition actualisée — 28/10/2026 :** [référence consolidée](KODJO-Composition-conteneurs-2026-10-28.md), [analyse critique et réserves](REVUE-COMPOSITION-2026-10-28.md). D-451 : cycles visibles avec exercices directs et multi-circuit dans le MVP ; création par enveloppe, séries groupées/alternées, zéro intentionnel, en-têtes et défilement. Les maquettes de composition ont été vérifiées ; réalisation non qualifiée.

> **Complément du 27/10 — Ajouter un niveau** : choix du sens dans le glissé du catalogue, sans écran intermédiaire. Voir [la spécification Mouvement](DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md), CE-MVT-02 au chapitre 13, captures au chapitre 06 et composants au chapitre 12.

> **Référence ciblée — parcours Mouvement, 27/10/2026.** [Création et modification des mouvements](DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md) remplace, sur ce périmètre seulement, les anciens écrans de création d’exercice : nouveau gabarit, structure des phases sans durées, modification et variante depuis le catalogue des mouvements. Le crayon et la création de variante depuis une séance ne sont plus des parcours cibles. Les règles de recherche R01–R08 et de sauvegarde C03 restent applicables. Les autres lots de la simplification ne sont pas déclarés documentés ou livrés par cette mise à jour.

> **Évolution fonctionnelle validée — D-449 (26/10/2026)** : [Séance comme objet unique, six décisions closes](KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Cette cible remplace la dualité Exercice autonome/Séance, le cycle technique unique et les catalogues séparés par nature. Elle conserve Mouvement et Exercice comme composant de séance ; plusieurs cycles successifs sans imbrication ; lancement de toute la séance ; catalogue unique à vues filtrées. Le code PRE-7 et les visuels existants restent l’état livré antérieur sur ces points.

**D-445 :** huit points clos ; C08 seul différé. [Règles consolidées](KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).

**Référence fonctionnelle reçue et intégrée — v7 :** [Niveaux, recherche et parcours v7](KODJO-Niveaux-Recherche-Parcours-Regles-v7.md). Ses règles remplacent les dispositions antérieures contradictoires dans leur portée, notamment recherche, alias, reprise des phases et classification actuelle. [Consignes Claude Code actualisées](PROMPT-CLAUDE-CODE-NIVEAUX-RECHERCHE-V7.md).

**Relevé historique Figma du 23/10/2026 :** [Gestes, filiation et niveaux](DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md) — cinq nouveaux états et popover illustrés au chapitre 06, captures existantes actualisées, contrats et composants réconciliés ; écarts de prototype explicités.

La documentation de référence forme un ensemble de treize chapitres, complété par quatre annexes non normatives. Les règles métier, calculs et comportements sont définis ici ; Figma décrit les dispositions visuelles et illustre des états. Les valeurs de démonstration des captures ne définissent pas les calculs.

| Chapitre | Titre | Contenu |
|---|---|---|
| 01 | [Vision et glossaire](Specifications-fonctionnelles/01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md) | Vision et principes ; glossaire, seule source des définitions |
| 02 | [Utilisateurs et besoins](Specifications-fonctionnelles/02%20%E2%80%93%20Utilisateurs%20et%20besoins.md) | Profils et besoins, identifiés B-001 et suivants |
| 03 | [Parcours utilisateur](Specifications-fonctionnelles/03%20%E2%80%93%20Parcours%20utilisateur.md) | Parcours illustratifs |
| 04 | [Modèle fonctionnel](Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md) | Concepts, structures et relations |
| 05 | [Versions et périmètre](Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md) | Périmètre des versions et des tranches |
| 06 | [Interface : navigation, écrans et conventions communes](Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) | Navigation, inventaire des écrans, captures, conventions d’interface communes à plusieurs écrans |
| 07 | [Registre des décisions de conception](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) | Décisions, dans l’ordre chronologique |
| 08 | [Conception fonctionnelle par fonctionnalité](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) | Enchaînements, états et transitions ; cite les règles du chapitre 10 |
| 09 | [Modèle de données fonctionnel](Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) | Entités, attributs, invariants, intégrité, migration |
| 10 | [Règles métier et calculs](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) | Règles testables, calculs, formats d’affichage, recettes |
| 11 | [API fonctionnelles](Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md) | Contrats de services |
| 12 | [Architecture technique](Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md) | Architecture et design system technique |
| 13 | [Contrats d’écran](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md) | Les 40 contrats existants et le contrat Niveaux |

**Annexes non normatives :**
- [Correspondance des sections](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Correspondance%20des%20sections.md) : pour chaque ancienne section, sa place actuelle ;
- [Index des identifiants](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Index%20des%20identifiants.md) : où chaque identifiant est défini, règles sans identifiant, registre par thème ;
- [Matrice de traçabilité](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Matrice%20de%20tra%C3%A7abilit%C3%A9.md) : besoins, règles, contrats et recettes reliés par les seules références établies (citations et rattachements prouvés) ;
- [Historique des consolidations](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Historique%20des%20consolidations.md) : passages historiques conservés à l’identique.

**Organisation (D-402).**
- Les chapitres 03, 04, 08, 09, 10, 11 et 13 suivent le même ordre de parties : Séances, Exercices, Paramètres d’exécution, Composition, Circuits, Formats, Bilatéralité, Exécution, Médias, Planification, Suivi, Profil, Référentiels, puis les sujets transverses. Une même fonctionnalité occupe ainsi la même place d’un chapitre à l’autre.
- Chaque chapitre commence par un sommaire.
- Les noms des fichiers n’ont pas changé.
- Les mentions « chapitre NN » et « § » des textes antérieurs, en particulier du registre, se lisent avec l’annexe de correspondance.

La documentation décrit la conception attendue ; elle ne constitue pas une preuve de réalisation ni de qualification sur appareil. Les limites fonctionnelles encore ouvertes sont indiquées dans le sujet concerné. L’historique des modifications reste consultable dans Git.

## Autorité documentaire — ce qui est décidé

Cette section est une aide à la navigation. Elle regroupe, sans en ajouter, les règles d'autorité déjà décidées explicitement. Elle ne tranche par elle-même aucun point d’autorité.

- **Comportements et calculs / rendu.** « Spécifications et arbitrages déterminent calculs et comportements ; Figma définit uniquement le layout/rendu. Exemples chiffrés et câblages ne sont jamais une règle. » ([D-255](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md), confirmée par D-300.) Voir aussi le chapitre 13, « Clarification d’autorité et de portée ».
- **Décisions.** Les décisions validées du chapitre 07 s’appliquent dans leur portée. Une décision n’en remplace une autre que si elle le dit explicitement (principe des « arbitrages explicitement supersédants », énoncé jusqu’ici au rang 1 de l’ordre de référence de `PRODUCT.md`, retiré par D-402). Une règle n’est pas remplacée du seul fait qu’un texte est plus récent ou placé ailleurs.
- **Chapitres 08 et 13.** « Aucune priorité automatique entre le chapitre 08 et le chapitre 13 : une contradiction entre eux qui n’est pas résolue par une décision explicite reste `À CLARIFIER`. » (D-376.)
- **DSF, D-339 et D-341.** « D-339 conserve son comportement de fermeture après sélection, y compris dans les popovers ; présentation D-341 remplacée par les DSF validés. » (D-377.) Pour les lignes Mode, Type de série et Changement de côté de la feuille des paramètres, la présentation par popovers est remplacée par des contrôles segmentés et D-339 n’y a plus d’objet ([D-413](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)).
- **Domiciles (D-402).** Une règle testable est énoncée au chapitre 10. Le chapitre 08 la cite par son identifiant, et le contrat du chapitre 13 en décrit l’effet à l’écran. `PRODUCT.md` est une synthèse sans ordre de référence propre.

En cas de contradiction entre deux passages, les deux sont conservés jusqu’à décision explicite.

## Mouvement, filiation et niveaux — intégration du 23/10/2026

Règles normatives et recettes MFN : [chapitre 10](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#mouvement-filiation-et-niveaux). Modèle et intégrité : chapitres 04/09 ; parcours : 03/08 ; contrats : 06/13 ; API/architecture : 11/12 ; livraison : 05 ; décisions D-436 à D-440 : 07. La spécification v0.4 est propagée dans ces chapitres ; code à réaliser, transition sur base vierge sans reprise.


## Décisions closes — D-445

Huit points clos : C01–C07 et C09. C08 seul reste différé sur le périmètre MVP. [Règles consolidées](KODJO-Niveaux-Recherche-Parcours-Regles-v7.md), [prompt Claude Code](PROMPT-CLAUDE-CODE-NIVEAUX-RECHERCHE-V7.md).

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du contenu partagé sont visibles à la prochaine lecture des définitions et des séances ; aucun mécanisme de propagation de copies de contenu n’est nécessaire. Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

- [PHC-20261026 — phases cycliques, compatibilité Répétitions/échec, cible de série indépendante](KODJO-Phases-Guidage-Cyclique-2026-10-26.md) : clarification normative du 26/10/2026 ; remplace les règles contraires antérieures.

- [Navigation : audit des 62 écrans, contrats et dix assets — 27/10/2026](DSF-NAVIGATION-CINQ-DESTINATIONS-2026-10-27.md).

- [Carte et catalogue des séances — spécification du 27/10/2026](KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md).
- [Catalogue des séances — douze écrans, composants, tokens et écarts](DSF-CATALOGUE-SEANCES-2026-10-27.md).
- [Périmètre proposé et prompt de préparation BMAD — Catalogue des séances](preparation/catalogue-seances-2026-10-27/PERIMETRE-ET-PROMPT-BMAD.md).


## Formats — cible finale du 4 novembre

**Création et Formats — décisions du 5 novembre 2026.** Modale de création commune au Catalogue et à la Composition, nouveau brouillon prérempli à l’arrivée, sauvegarde uniquement dans la Composition ; fermeture vers le point de départ sans mutation. Menu à trois options, œil et CE-CIR-03 retirés ; photo de l’Exercice ouvrant une fiche en lecture seule avec « Dans cette séance ». Superset alterné trois tours ; EMOM prescrit par série ; Death by en Durée avec avertissement au seul premier rang impossible et arrêt avant un rang incompatible. Règles complètes dans la référence Formats actualisée, §§7/7.6/7.7/9.4/10/12.

[Source finale validée](sources/formats-2026-11-04/KODJO-Mise-a-jour-ecrans-formats-consolidee-2026-11-04_finale.md). Référence active : [Formats](KODJO-Formats-entrainement-2026-11-02.md), notamment §3 et §7.6–7.9. Contrats CE-FMT-01 à CE-FMT-05 ; plan PRE-9 actualisé.

## Création et Formats — complément final du 5 novembre

**Création et Formats — décisions du 5 novembre 2026.** Modale de création commune au Catalogue et à la Composition, nouveau brouillon prérempli à l’arrivée, sauvegarde uniquement dans la Composition ; fermeture vers le point de départ sans mutation. Menu à trois options, œil et CE-CIR-03 retirés ; photo de l’Exercice ouvrant une fiche en lecture seule avec « Dans cette séance ». Superset alterné trois tours ; EMOM prescrit par série ; Death by en Durée avec avertissement au seul premier rang impossible et arrêt avant un rang incompatible. Règles complètes dans la référence Formats actualisée, §§7/7.6/7.7/9.4/10/12.

**EMOM — tableau et validation du 5 novembre.** Tableau Unité | S1…Sn, quatre colonnes visibles au plus, nom et unité fixes ; chaque série porte sa cible et sa charge. Pas de champ d’incrément d’objectif ni de charge. Création : valeurs de S1 reprises initialement ; nouvelles séries ajoutées après coup à compléter selon les règles existantes ; réouverture sans réinitialisation. Pour chaque rang/fenêtre, travail connu en Durée incluant deux côtés et pause entre côtés applicable ; somme des membres dans un intervalle commun, intervalle local sinon. Atteinte ou dépassement de l’intervalle bloque la validation (message et cadres rouges), y compris après modification en Composition ; aucune durée inventée pour les membres en Répétitions.

**Death by — cible du 5 novembre.** Répétitions ou Durée, Objectif de départ et Incrément ≥ +1 dans l’unité. Seul un premier rang dont le travail connu atteint ou dépasse l’intervalle déclenche un avertissement non bloquant ; sauvegarde autorisée si les autres champs sont valides. À l’exécution, ne pas lancer un rang dont ce travail atteint ou dépasse la fenêtre : arrêt après le précédent, résultat « limite de l’intervalle atteinte », aucun échec ni tentative fictifs. En Durée : deux côtés et pause applicable, somme des membres en fenêtre commune ou intervalle du membre en alternance. Rangs acquis et rang courant distincts ; durée partielle renseignée seulement pour une fenêtre réellement tentée et non tenue. Les autres règles de fin et d’achèvement Death by restent applicables ; aucune fenêtre prolongée. Exemple 10 s puis +10 s / 60 s : cinq rangs réussis, arrêt avant le rang 6. La progression future compatible au départ ne déclenche pas d’avertissement.

**Superset — cible du 5 novembre.** Exactement deux mouvements à la création, trois tours alternés par défaut, Circuit standard ; chaque membre porte N séries, séquence A1/B1 puis A2/B2, sans rejouer N séries à chaque tour. Réouverture avec les membres actuels, y compris un troisième ; au moins deux, Ajouter désactivé, validation soumise à complétude/cohérence. Tableau Unité | Tour 1…n ; Récupération après le tour lit/écrit le dernier Exercice actuel, sans transfert depuis l’ancien dernier et sans effacer les récupérations intermédiaires ; valeur absente à renseigner, zéro explicite conservé.

**Charge des modèles — cible du 5 novembre.** Les dix questionnaires proposent Avec charge, Sans par défaut. L’activation globale rend les commandes locales disponibles sans charger tous les mouvements ; (+ kg)/(− kg) pilote chaque Exercice. Charges facultatives : Progression/For time/Superset/EMOM par série ou tour ; autres modèles fixes par mouvement. Affichage entre parenthèses et unité kg. Masquer puis réactiver retrouve états et valeurs dans le même brouillon avant sauvegarde ; vider efface réellement. Une réouverture lit l’état enregistré, sans nouvelle obligation de mémorisation de réponses historiques. Aucun incrément de charge EMOM ; seules les charges effectives par série font référence.

[Source finale validée](sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md). Aucun code ni moteur développé dans cette mise à jour documentaire.

[Conception consolidée du moteur — version actualisée](preparation/moteur-execution/KODJO-Conception-moteur-execution-consolidee-2026-11-02.md) : base documentaire du commit 8855c793, prescriptions du 5 novembre intégrées ; aucun développement du moteur déclaré.

**Composition, 06/11/2026 (D-511 à D-513, classe B)** : [carte d’exercice, en-tête de Circuit et placement](KODJO-Catalogues-cartes-modales-2026-11-06.md#11-composition--carte-dexercice-en-tête-de-circuit-placement). Placement réservé aux Points d’arrêt ; géométrie de la carte actualisée ; déploiement Figma des en-têtes partiel.
