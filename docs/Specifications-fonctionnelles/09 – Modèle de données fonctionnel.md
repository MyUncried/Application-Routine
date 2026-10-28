# Modèle de données fonctionnel

> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

## Composition des familles — données, 28/10/2026

Voir le tableau des écritures et invariants de la [spécification familles](../DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md). Réordonner écrit la seule clé de tri du membre déplacé ; entrer/sortir écrit ou efface ensemble groupe et clé du membre concerné. Dissoudre le dernier couple efface les deux paires. Créer une famille avec deux isolés exige deux appartenances ; la restriction à une seule ligne du document source ne décrit pas cette initialisation.

Rangs dérivés, clés fractionnaires ou lexicographiques, aucun reclassement des clés des autres membres. Annuler restaure l'état antérieur de l'opération. Identités, références des exercices, `sourceMovementId`, instantanés et performances inchangés. La règle 8 du 27/10 reste applicable à l'archivage, aux filtres et à la suppression définitive.

## Application au lot Mouvement autonome — 27/10/2026

La création par CE-MVT-01 persiste un Mouvement sans créer d'ActivityDefinition ni de SessionActivity. Les phases du mouvement portent leurs identités stables et libellés ; les durées restent locales aux exercices. La variante peut créer un groupe et son second membre dans la même opération logique ; un abandon ne laisse pas de groupe provisoire. Aucun rang historique ni nouvel indicateur irréversible d'utilisation n'est ajouté. La création d'une identité distincte depuis le catalogue ne réaffecte aucune référence active existante. Le modèle de séance unique D-449 reste la cible ; ce lot n'impose pas sa réalisation complète pour permettre le parcours autonome.

> **Cible validée D-449 — 26/10/2026.** [Six décisions closes](../KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md). Les dispositions ci-dessous sur l’exercice autonome de catalogue, le lancement `ACTIVITY`, le cycle technique unique et les catalogues séparés par nature décrivent le modèle antérieur et sont remplacées sur ces seuls points. Les autres règles restent applicables. La réalisation et les visuels Figma ne sont pas déclarés livrés.

## Modèle de données cible — D-449

La Séance est l’unique type de contenu lançable et planifiable. L’Exercice est subordonné à la composition avec son identifiant propre, sa référence directe et intègre au Mouvement, ses paramètres locaux, sa position et sa récupération. La cible ne nécessite plus de définition autonome ActivityDefinition. La composition ordonne exercices, circuits et cycles ; un cycle contient des circuits, un circuit des exercices. Reprendre une composition crée les identifiants de destination en conservant movementId ; aucune filiation vers la séance source n’est nécessaire aux records. Les références de Routine ciblent la Séance ; l’instantané reste créé au démarrage. Le schéma physique et la reprise des données seront analysés avant développement.

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).


## Sommaire

- [Séances](#séances)
  - [Entité Séance](#entité-séance)
  - [Règles d’intégrité et de copie](#règles-dintégrité-et-de-copie)
- [Exercices](#exercices)
  - [Modèle cible Mouvement et filiation — D-437 à D-440](#modèle-cible-mouvement-et-filiation--d-437-à-d-440)
  - [Entité Exercice](#entité-exercice)
  - [Entité Média](#entité-média)
  - [Extension du modèle — Exercices, Médias et Parcours](#extension-du-modèle--exercices-médias-et-parcours)
- [Paramètres d’exécution](#paramètres-dexécution)
  - [Migration T03 — Catalogue des Exercices](#migration-t03--catalogue-des-exercices)
  - [Saisie des paramètres d’exécution](#saisie-des-paramètres-dexécution)
  - [Extension validée du modèle — Paramètres de Série et Ordre des côtés — D-247 à D-254](#extension-validée-du-modèle--paramètres-de-série-et-ordre-des-côtés--d-247-à-d-254)
  - [Extension validée du modèle — Extension Cadence du modèle de Série](#extension-validée-du-modèle--extension-cadence-du-modèle-de-série)
- [Composition des séances](#composition-des-séances)
  - [Extension validée du modèle — Pauses et symboles](#extension-validée-du-modèle--pauses-et-symboles)
- [Exécution](#exécution)
  - [Entité Exécution](#entité-exécution)
  - [Résultat d’Exercice exécuté](#résultat-dexercice-exécuté)
  - [Structures internes du moteur d'exécution](#structures-internes-du-moteur-dexécution)
  - [Cycles de vie](#cycles-de-vie)
- [Planification](#planification)
  - [Entité Routine](#entité-routine)
  - [Règles de planification](#règles-de-planification)
  - [Entité Occurrence planifiée](#entité-occurrence-planifiée)
- [Suivi et synthèse](#suivi-et-synthèse)
  - [Cycle de vie d'une séance — Historique](#cycle-de-vie-dune-séance--historique)
  - [Exécution d'une séance — Historique d'exécution](#exécution-dune-séance--historique-dexécution)
  - [Suivi et historique des séances — Création d'un historique](#suivi-et-historique-des-séances--création-dun-historique)
  - [Suivi et historique des séances — Informations enregistrées](#suivi-et-historique-des-séances--informations-enregistrées)
- [Profil et préférences](#profil-et-préférences)
  - [Entité Utilisateur](#entité-utilisateur)
  - [Entité Préférences globales](#entité-préférences-globales)
- [Référentiels](#référentiels)
  - [Entité Étiquette](#entité-étiquette)
  - [Entité Catégorie](#entité-catégorie)
  - [Entité Zone corporelle](#entité-zone-corporelle)
- [Sujets transverses](#sujets-transverses)
  - [Vue d'ensemble](#vue-densemble)

## Séances

### Entité Séance

#### Définition

Une **Séance** est une entité métier représentant le contenu réutilisable d’un entraînement.

Elle définit les Exercices à réaliser, leur position avant le Circuit, dans le Circuit ou après le Circuit, ainsi que les paramètres nécessaires à leur Exécution. Le Cycle reste une enveloppe technique fixée à une répétition.

Une séance peut être exécutée immédiatement ou planifiée par une ou plusieurs routines. Elle ne contient jamais les informations produites lors d’une exécution réelle.

#### Périmètre

Une séance possède directement :

- ses informations générales ;
- zéro ou une Étiquette, qui porte sa couleur affichée ;
- un compte à rebours initial ;
- un cycle ;
- un Circuit (conteneur technique `Tour`) contenu dans le cycle ;
- les exercices contenues dans le Circuit ;
- une fin de séance ;
- le paramètre de répétition de son Circuit ; le Cycle vaut toujours 1 dans le MVP.

Elle ne contient pas directement :

- les routines qui la planifient, qui constituent des entités distinctes ;
- les exécutions déjà réalisées ;
- l’historique ;
- les préférences globales ;
- les résultats ou états d’exécution ;
- les fichiers médias physiques, stockés séparément des entités et non dupliqués dans les instantanés (D-333).

#### Attributs fonctionnels

| Attribut                                | Description                                                               |          Caractère           | Règle principale                                                                                                                                                                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------- | :--------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identifiant                             | Identifiant interne unique de la séance                                   |         Obligatoire          | Stable pendant toute la durée de vie de la séance                                                                                                                                                                                                      |
| Nom                                     | Nom affiché de la séance                                                  |         Obligatoire          | Saisi avant la création effective de la séance                                                                                                                                                                                                         |
| Étiquette                              | Classification de la Séance                                               |          Facultatif          | Zéro ou une Étiquette ; elle porte la couleur affichée de la Séance                                                                                                                                                                                     |
| Couleur affichée                        | Couleur visuelle de la Séance                                              |           Calculé            | Dérivée de l’Étiquette lorsqu’elle est renseignée ; aucune couleur métier indépendante de l’Étiquette                                                                                                                                                  |
| Statut                                  | État de la séance                                                         |         Obligatoire          | Active ou archivée                                                                                                                                                                                                                                     |
| Date de création                        | Date de création effective                                                |         Obligatoire          | Générée automatiquement                                                                                                                                                                                                                                |
| Date de modification                    | Date de dernière modification                                             |         Obligatoire          | Mise à jour automatiquement                                                                                                                                                                                                                            |
| Date de dernière exécution              | Date de la dernière exécution de séance                                   |          Facultatif          | Sert notamment au classement du Catalogue de séances                                                                                                                                                                                                   |
| Date d’archivage                        | Date de passage au statut archivé                                         |         Conditionnel         | Renseignée uniquement si la séance est archivée                                                                                                                                                                                                        |
| Structure                               | Organisation complète de la séance                                        | Obligatoire pour l’exécution | Une nouvelle Séance ne peut pas être enregistrée sans Exercice valide (RM-017) ; une Séance existante devenue vide reste conservable, mais non exécutable et non enregistrable après modification sans ajout d’un Exercice valide                                                                                                                                                                     |
| Durée estimée d’exécution               | Somme des durées déterminables de l’Exécution complète                    |           Calculé            | Inclut le Compte à rebours initial, les phases et occurrences chronométrées du plan et la Fin de séance ; avec cadence Ri×Ci estimé ≈ ; sans bip omission à l’Exercice ; ≥ seulement à la Séance ; composante non estimable : ≥ prévaut sur≈ |
| Durée synthétique des Exercices         | Somme des durées déterminables des seules occurrences d’Exercices         |           Calculé            | Développe Séries, Pauses après Série et Tours du Circuit ; exclut toujours le Compte à rebours initial et la Fin de séance ; utilisée dans le Catalogue ; le total affiché sous le titre du Circuit de la Composition concerne exclusivement ce Circuit (D-382) ; borne minimale `≥` si une durée d’Exercice est indéterminable |
| Nombre d’Exercices de la Composition    | Nombre d’Exercices définies dans la Composition                            |           Calculé            | Ne compte ni les Pauses entre Séries ni les phases `SIDE_RECOVERY` / `POST_ACTIVITY_RECOVERY`, et ne multiplie pas les Exercices par les Séries, Tours ou Cycles |
| Nombre total d’Exercices à exécuter     | Nombre d’occurrences d’Exercices prévues dans le plan d’Exécution complet |           Calculé            | Calculé après développement des Séries, Tours du Circuit et du Cycle ; exclut `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY`, le Compte à rebours initial et la Fin de séance, qui ne sont pas des Exercices |
| Durée du compte à rebours initial       | Durée de la phase précédant la première exercice                          |         Obligatoire          | Valeur en secondes ; 0 s rend la phase instantanée                                                                                                                                                                                                     |
| Texte vocal du compte à rebours initial | Texte annoncé vocalement pendant ou au début du compte à rebours initial  |          Facultatif          | Valeur initiale issue des Préférences globales ; peut être vide                                                                                                                                                                                        |
| Durée de la fin de séance               | Durée de la phase suivant le dernier exercice                            |         Obligatoire          | Valeur en secondes ; 0 s rend la phase instantanée                                                                                                                                                                                                     |
| Texte vocal de la fin de séance         | Texte annoncé vocalement pendant ou au début de la fin de séance          |          Facultatif          | Valeur initiale issue des Préférences globales ; peut être vide                                                                                                                                                                                        |

> **Formats :** cette grille antérieure n’encode pas à elle seule l’achèvement incomplet du Death by. Conserver séparément motif, résultat et achèvement selon FMT-38 ; aucun mapping implicite vers Terminée.

#### Structure interne de la séance

D-451 remplace les cardinalités et le cycle technique du modèle antérieur. Séance : compte à rebours initial, séquence ordonnée d’exercices/circuits/cycles, fin de séance. Cycle : séquence ordonnée non vide d’exercices et de circuits ; Circuit : séquence ordonnée non vide d’exercices. Aucun conteneur du même type imbriqué ; aucun cycle dans un circuit.

| Objet | Attributs et invariants |
|---|---|
| Cycle | Identifiant stable, parent séance, ordre, compte 1..99 défaut 1, membres ordonnés ; visible et non repliable |
| Circuit | Identifiant stable, parent séance ou cycle, ordre, compte 1..99 défaut 1, nature séries groupées/alternées, membres ordonnés |
| Exercice | Parent séance/cycle/circuit, ordre, mouvement référencé et paramètres locaux ; N séries imposé par un circuit alterné |

Un Tour est un passage développé du circuit, pas un nouveau conteneur de composition. L’état replié relève de la présentation ; la lettre affichée ne remplace pas l’identifiant stable. Un conteneur n’est créé qu’avec au moins un membre ; il disparaît vidé, reste présent avec un membre. Les cibles numériques nulles conservent leur rang ; elles sont distinctes des cibles manquantes et des cibles À l’échec.

#### Relations principales

- Une séance appartient à un utilisateur, peut porter une Étiquette et être référencée par plusieurs routines et exécutions.
- Elle contient zéro ou plusieurs cycles et circuits et des exercices directs ; elle est exécutable avec au moins un exercice valide.
- Chaque exercice et conteneur possède un parent unique dans la composition ; aucun partage d’une même instance structurelle entre parents.
- Les séries propres d’un exercice direct du cycle sont développées à chaque répétition de ce cycle (RM-252).
- La création depuis une séance existante suit D-449 : copie de composition et nouveaux identifiants, pas une séance imbriquée.
- Le déplacement inter-conteneurs change l’appartenance et l’ordre ; toute adaptation de séries reste soumise au contrat de perte, avec confirmation en cas de perte et annulation conservant emplacement et données (chapitre 10, Ajout et sortie du circuit).

[Composition : circuits, cycles et création](../KODJO-Composition-conteneurs-2026-10-28.md) détaille les règles. Les migrations techniques, valeurs d’enum persistées et endpoints de réalisation ne sont pas décidés par cette mise à jour documentaire.

#### Règles métier

- Le nom est obligatoire pour créer une séance.
- Deux séances peuvent porter le même nom.
- Une Séance ne possède pas de couleur métier indépendante : sa couleur affichée est celle de son Étiquette lorsqu’elle est renseignée.
- Une Séance déjà enregistrée qui se retrouve sans Exercice peut être conservée et ouverte en modification, mais ne peut être ni exécutée ni enregistrée après modification tant qu’elle ne comporte pas au moins un Exercice valide (RM-017). La création d’une nouvelle Séance vide est interdite ; aucun statut `Brouillon` persistant n’est introduit.
- Une séance est exécutable dès qu’elle contient au moins un Exercice valide.
- Une séance peut être modifiée, dupliquée, archivée ou restaurée. Elle ne peut être supprimée qu’après archivage.
- La duplication crée une nouvelle séance indépendante avec un nouvel identifiant.
- La duplication conserve l’Étiquette de la Séance d'origine.
- La duplication copie la structure, les Exercices, l’Étiquette et les paramètres de la Séance, mais ne copie ni les Routines, ni les Exécutions passées.
- L’archivage conserve intégralement la séance et ses exécutions historiques.
- Une séance archivée ne peut plus être utilisée pour créer une nouvelle routine ou démarrer une nouvelle exécution tant qu’elle n’est pas restaurée.
- La suppression d’une Séance archivée demande toujours confirmation. Les Routines à contenu unique associées ont déjà été supprimées lors de l’archivage (D-023) ; pour une Routine à plusieurs contenus, l’effet reste `À CLARIFIER` (chapitre 10, planification à plusieurs contenus).
- La suppression d’une séance ne supprime jamais les exécutions déjà enregistrées ni leurs instantanés.
- Une modification de la séance n’altère jamais les exécutions déjà présentes dans le suivi.
- Le cycle et le Circuit ne peuvent pas être supprimés.
- Le nombre de répétitions du Cycle vaut toujours 1 dans le MVP. Le nombre de Tours du Circuit est compris entre 1 et 99.
- Les exercices peuvent être ajoutées, modifiées, déplacées, dupliquées ou supprimées.
- Les sons et les annonces vocales ne sont pas enregistrés dans la séance ; ils proviennent des préférences globales.
- La Durée estimée d’exécution, la Durée synthétique des Exercices, le Nombre d’Exercices de la Composition et le Nombre total d’Exercices à exécuter sont recalculés après toute modification influençant leur périmètre.
- Une Séance ou une `ActivityDefinition` peut exister sans Routine et sans avoir jamais été exécutée.
- Le compte à rebours initial et la Fin de séance sont toujours présents dans la structure d'une séance et ne constituent pas des Exercices.
- Une durée de 0 s rend le compte à rebours initial ou la Fin de séance instantané sans supprimer l'élément de la structure.

### Règles d’intégrité et de copie

#### Objectif

Ce chapitre définit les règles garantissant la cohérence du modèle de données ainsi que le comportement des opérations de duplication, d'archivage, de suppression et de conservation des données.

#### Règles d'intégrité

##### Identité

- Chaque entité possède un identifiant unique et stable.
- Deux entités distinctes ne peuvent jamais partager le même identifiant.
- Les identifiants sont générés automatiquement.

##### Cohérence des relations

- Toute `SessionActivity` appartient à une seule Séance et occupe une seule position structurelle ; seules les copies techniquement `Dans Tour` appartiennent au conteneur `Tour` représentant le Circuit pour l’exécution structurelle. Une `ActivityDefinition` du MVP T03 reste autonome.
- Tout Tour appartient à un seul cycle.
- Tout cycle appartient à une seule séance.
- Toute Routine porte une liste ordonnée de références SESSION/ACTIVITY (D-328).
- Toute Exécution conserve son origine `SESSION` ou `ACTIVITY` et son Instantané immuable. La référence à l’objet source persistant n’est résoluble que tant que cet objet existe ; sa suppression ne supprime pas l’Exécution (règles détaillées ci-dessous).
- Toute Étiquette et toute Catégorie appartient au référentiel de l’Utilisateur local ; l’origine initiale ou personnalisée n’affecte pas les droits de suppression.
- Une Séance référence au plus une Étiquette ; un nouvel Exercice valide référence exactement une Catégorie.
- La couleur affichée d’une Séance dérive uniquement de son Étiquette. La couleur sémantique d’un Exercice dérive uniquement de sa Catégorie.
- Les Zones corporelles appartiennent au référentiel utilisateur local. Elles sont administrables par l’utilisateur local et restent référencées par identifiant stable.

##### Cohérence des données

- Une séance exécutable contient au moins un Exercice.
- Une durée de Pause ou de Récupération est toujours supérieure ou égale à `0 s` ; une Récupération à `0 s` ne génère aucune phase.
- Les nombres de Tours du Circuit et du cycle sont toujours supérieurs ou égaux à 1.

#### Duplication d'une séance

- Nouvelle séance avec un nouvel identifiant.
- Nom `{nom d’origine} (copie)`, puis `{nom d’origine} (copie 2)`, `(copie 3)`, etc., en utilisant le premier suffixe disponible.
- Copie de l’Étiquette de la Séance.
- Copie du Cycle, du Tour, des Exercices et de leurs Catégories ; les associations média suivent leur règle de copie propre.
- Les routines et les exécutions de séance ne sont jamais copiées.

#### Duplication d'un exercice

- Nouvelle exercice avec un nouvel identifiant.
- *Texte identique à celui de la section [« Duplication d'une séance »](09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md#duplication-dune-séance) ; il n’est pas recopié ici.*
- Copie des paramètres locaux (mode/cible, séries, pauses, récupération, côtés, charge et activation, compte à rebours et fin), même référence au mouvement ; contenu et médias lus au mouvement, sans duplication de contenu (D-445).
- Aucun Exercice secondaire n’est créée pour la Récupération : sa durée est copiée avec l’Exercice.
- La copie est insérée immédiatement après la source dans la même zone fonctionnelle avant/dans/après Circuit (valeurs techniques historiques `Avant Tour`, `Dans Tour`, `Après Tour`). Elle reste une copie de Séance indépendante et ne crée aucun Exercice dans le catalogue.

#### Suppression d’un média

Les règles suivantes s’appliquent aux médias, dont l’import/ajout est inclus au MVP (D-333) :

- Un fichier physique local peut être référencé par plusieurs entités/associations Média, chacune appartenant à une seule Exercice.
- Retirer un média du mouvement partagé change son contenu courant pour les exercices liés, après validation MFN-08 ; les instantanés conservent leurs associations.
- Le fichier physique local n’est supprimé que lorsqu’aucun Mouvement, Exercice, copie de Séance ni aucun Instantané ne le référence (D-437).
- Les instantanés restent inchangés ; les exercices et séances liés lisent les associations courantes du mouvement (D-445).

#### Archivage et suppression

##### Archivage d'une séance

L'archivage d'une Séance :
- conserve la Séance ;
- ne demande pas de confirmation si aucune Routine ne lui est associée ;
- demande une confirmation explicite si au moins une Routine lui est associée ;
- après cette confirmation, supprime les Routines à contenu unique dont la Séance est l’unique contenu ; l’effet sur les Routines à plusieurs contenus reste `À CLARIFIER` et ne doit pas être inféré ;
- met donc fin au calcul de leurs occurrences futures ;
- conserve les occurrences déjà historisées ;
- conserve toutes les Exécutions et leurs instantanés ;
- empêche toute nouvelle Exécution ou nouvelle Routine utilisant cette Séance tant qu'elle reste archivée.

La restauration d'une Séance :
- la rend de nouveau disponible pour l'exécution et la planification ;
- ne restaure aucune Routine supprimée lors de l'archivage ;
- nécessite la création de nouvelles Routines si l'utilisateur souhaite la planifier de nouveau.
##### Suppression d'une séance

- Supprime définitivement la séance archivée ; ses routines à contenu unique ont déjà été supprimées lors de l’archivage (D-023, D-121) ; le cas des Routines à plusieurs contenus reste `À CLARIFIER`.
- Ne supprime jamais les exécutions de séance ni leurs instantanés.

#### Historique

- L'historique est constitué des exécutions de séance (origine `SESSION`) et des Exécutions directes d’Exercice (origine `ACTIVITY`, D-161).
- Chaque exécution possède son propre instantané de sa source (Séance ou Exercice).
- Une modification de la séance n'affecte jamais les exécutions existantes.

## Exercices

### Modèle cible Mouvement et filiation — D-437 à D-440

Les propriétés intrinsèques énumérées dans les tableaux d’Exercice ci-dessous restent exposées à la lecture, mais leur propriété persistante est répartie comme suit. Les anciennes représentations aplaties ne constituent plus le stockage Catalogue cible.

| Porteur | Données et contraintes |
|---|---|
| Mouvement | Identité stable ; nom principal et clé canonique uniques ; alias facultatifs non uniques ; description/médias/classification et structure ordonnée de phases ; compteur monotone de phase ; existence indépendante des exercices. Aucun indicateur durable d’usage à l’insertion. |
| Groupe sur Mouvement | Identifiant de groupe et clé de tri facultatifs, présents ensemble ; au plus un groupe ; aucun objet Niveau ni rang persisté ; singleton conservé après disparition subie, mais deux appartenances effacées lors de la sortie explicite du dernier couple (D2–D4, 28/10) |
| ActivityDefinition | Identifiant propre, `movementId` non nul avec intégrité réelle ; paramètres d’exécution propres ; durées associées par `phaseId` ; aucun alias ni contenu partagé modifiable en double |
| SessionActivity | Identifiant propre ; movementId obligatoire avec intégrité active ; paramètres locaux complets, durées par phaseId et récupération contextuelle. Le contenu est lu depuis le mouvement courant ; aucun lien de dépendance vers ActivityDefinition. |
| Instantané | Contenu autonome et filiation copiés au démarrage, sans relecture source ; aucun champ rang/total de niveaux ; résultats rattachés à l’exécution et ses occurrences/séries/côtés/passages |

Les identifiants de phase sont entiers ≥ 1 et uniques dans le mouvement. Leur identité complète est mouvement + phase ; déplacement et clonage les conservent. Un identifiant supprimé n’est jamais réalloué. Le Catalogue persiste les valeurs séparées de la structure ; les instantanés portent une représentation résolue.

Une correction structurelle conserve les durées par identifiant. L’exercice édité doit être complet ; un exercice frère peut être persisté incomplet, avec durée non renseignée, après choix explicite de passer sa complétion. Il reste inexécutable jusqu’à complétion. Cette possibilité doit être portée par les types et la persistance, pas seulement le brouillon.

La suppression explicite d’un mouvement est interdite tant qu’une définition ou occurrence vivante le référence. Supprimer le dernier exercice conserve le mouvement. Seule la filiation des instantanés peut être orpheline. Le dialogue utilise le changement de nom, les autres exercices et l’existence d’une exécution selon MFN-08 ; aucun marquage irréversible lors de l’enregistrement de séance. D-445.

**Transition D-440 :** les descriptions de migrations historiques de ce chapitre restent des traces des lots précédents. Elles ne prescrivent ni conversion ni lecteur ancien pour MFN : nouveau schéma sur base vierge, réinitialisation ponctuelle seulement.


### Entité Exercice

#### Définition

Une **Exercice** est la plus petite unité exécutable d'une séance.

Dans le MVP, cette entité est une `SessionActivity` appartenant à une seule Séance. Dans le MVP T03, une `ActivityDefinition` autonome peut être copiée dans plusieurs Séances sans lien de propagation.

Le nom « Récupération » n’a aucune sémantique technique : un Exercice ainsi nommé reste un Exercice ordinaire. Les phases `SIDE_RECOVERY` et `POST_ACTIVITY_RECOVERY` sont dérivées respectivement de `sideRecoverySeconds` et `postActivityRecoverySeconds` ; aucune n’est un type d’Exercice.

#### Périmètre

Un exercice possède directement :

- son identité ;
- son nom ;
- sa description ;
- sa Catégorie et ses Zones corporelles ;
- son mode d'exécution ;
- sa durée cible, son nombre de répétitions cible ou l’absence de cible chiffrée pour une cible À l’échec ;
- son nombre de Séries ;
- sa Pause après chaque série ;
- sa charge facultative et son activation, commune ou par Série (RM-235, RM-236) ;
- sa durée de Récupération, positionnée dans le Plan selon le changement de côté effectif ;
- son Changement de côté propre ;
- son Compte à rebours d’Exercice propre lorsqu’il est utilisé ;
- sa Fin d’exercice propre lorsqu’elle est utilisée ;
- un média associé est affiché dans la gouttière permanente de la carte Catalogue du MVP, sans déploiement ; la gestion multiple et les mécanismes d’acquisition suivent leur périmètre propre ;
- sa position structurelle dans la Séance et son ordre au sein de cette position.

Elle ne contient pas directement :

- le Tour ;
- le cycle ;
- la séance ;
- les préférences globales.

#### Attributs fonctionnels

| Attribut                   | Description                                     |         Caractère         | Règle principale                                                              |
| -------------------------- | ----------------------------------------------- | :-----------------------: | ----------------------------------------------------------------------------- |
| Identifiant                | Identifiant unique                              |        Obligatoire        | Stable                                                                        |
| Position structurelle | Emplacement fonctionnel de l’Exercice avant, dans ou après le Circuit | Obligatoire | Valeurs techniques historiques : `Avant Tour`, `Dans Tour`, `Après Tour` ; D-209 ne renomme pas à elle seule ces identifiants |
| Position                   | Ordre au sein de la position structurelle       |        Obligatoire        | Entier déterminant l’ordre d’exécution                                         |
| Tour (technique) | Conteneur technique historique représentant le Circuit fonctionnel | Conditionnel | Obligatoire uniquement pour un Exercice fonctionnellement placé dans le Circuit (`Dans Tour` techniquement) |
| Nom                        | Libellé affiché                                 |        Obligatoire        |                                                                               |
| Description                | Liste ordonnée d’instructions sous forme d’étapes numérotées (D-425) | Facultatif | Conserver l’ordre des étapes et leur texte ; structure de stockage technique et traitement des étapes vides À CLARIFIER |
| Catégorie                  | Classification de l’Exercice                    | Obligatoire (nouvel Exercice) | Exactement une pour un nouvel Exercice valide (D-211) ; porte la couleur sémantique de l’Exercice                                      |
| Changement de côté        | Sans / Avec (RM-242)        |        Obligatoire        | Défaut Sans ; valeurs historiques : `UNILATERAL` lue Sans, `RIGHT_LEFT` et `LEFT_RIGHT` lues Avec, sans réinterprétation de l’Ordre des côtés ni réécriture (RM-244) ; représentation technique laissée à l’implémentation |
| Compte à rebours d’Exercice | Durée propre précédant le travail              |        Facultatif         | Distinct du Compte à rebours initial de Séance                                 |
| Fin d’exercice            | Durée propre suivant les phases de l’Exercice   |        Facultatif         | Distincte de la Fin de séance                                                   |
| Mode d'exécution           | Durée ou Répétitions, avec cible chiffrée ou À l’échec par série                 |        Obligatoire        | À l’échec n’a ni durée ni répétitions cibles                                  |
| Durée                      | Durée                                           |       Conditionnel        | Exercice chronométré                                                         |
| Nombre de répétitions      | Répétitions                                     |       Conditionnel        | Mode Répétitions                                                              |
| Nombre de Séries           | Entier canonique persisté                       |        Obligatoire        | Valeur de 1 à 99 ; valeur par défaut 1                                        |
| Pause après chaque série         | Durée                                           |        Obligatoire        | Valeur canonique `0 s` ; attachée à chaque Série, terminale comprise ; chapitre 08, paramètres d’exercice                     |
| Pause entre les côtés   | Durée                                           |        Conditionnel       | `sideRecoverySeconds`; pertinente uniquement en bilatéral, phase `SIDE_RECOVERY` si > 0 |
| Séries variables | Booléen explicite | Obligatoire | Faux par défaut ; faux à N=1 ; l’égalité des valeurs ne le détermine pas |
| Paramètres par Série | Collection ordonnée de N cibles/Pauses, avec la charge éventuelle de chaque Série | Conditionnel | Source unique en variable ; cible absente À l’échec ; la charge reste liée à sa Série (RM-238) ; aucun brouillon caché persisté (les charges conservées sous Sans ne sont pas un brouillon caché, RM-236) |
| Charge activée | État Avec / Sans, distinct des valeurs | Facultatif | Sans par défaut ; absent sur un Exercice antérieur = Sans, jamais 0 kg ; Sans conserve les valeurs (RM-236) ; passage automatique à Sans lorsque toutes les valeurs valent zéro (RM-239) |
| Charge commune | Valeur numérique en kg | Facultatif | Séries identiques ; unité d’affichage, non stockée dans le nombre ; pas, zéro et arrondi selon RM-239 ; conservée sous Sans (RM-236) |
| Charge par série | Valeur numérique en kg liée à la Série | Facultatif | Séries variables ; élément des Paramètres par Série, suit sa Série (RM-238) ; zéro = sans charge pour cette seule Série (RM-239) ; aucune valeur par côté (RM-235) |
| Ordre des côtés | Un côté après l’autre / Les deux côtés à chaque série | Bilatéral | Libellé visible Enchainement (D-413) ; premier ordre par défaut et à N=1 ; indépendant du côté de départ, que Kodjo ne désigne pas (RM-242) |
| Condition d’arrêt | Valeur dérivée | Calculé | Non persistée ; dérivée du type de cible des Séries ; en séries identiques, la choisir fixe la cible commune (RM-248) ; aucune valeur Mixte (RM-249) |
| Durée totale               | Durée dérivée                                   |          Calculé          | Non persistée ; exacte en Durée, estimation ≈ avec cadence, borne omission sans bip à l’Exercice, absente À l’échec                            |
| Zones corporelles          | Zones sollicitées                               | Obligatoire (nouvel Exercice) | Une ou plusieurs pour un nouvel Exercice valide (D-211)                                                              |
| Médias                     | Média(s) associé(s)                             |        Selon périmètre    | Affichage du média associé dans la gouttière permanente de la carte Catalogue inclus au MVP, sans déploiement       |

#### Règles métier

- Une `SessionActivity` appartient à une seule Séance et occupe exactement une position structurelle ordonnée. Une `ActivityDefinition` du MVP T03 est autonome et ne porte aucune position de Séance.
- Un Exercice peut être exécutée selon une Durée, un nombre de Répétitions ou jusqu’à l’échec.
- Un Exercice possède un nombre de Séries entier de 1 à 99 (D-092) ; la valeur par défaut à la création est 1.
- *Texte identique à celui de la section [« Structure d'un Exercice »](04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md#structure-dun-exercice) ; il n’est pas recopié ici.*
- Une `ActivityDefinition` bilatérale peut porter `sideRecoverySeconds`, exécuté une fois par Exercice en Un côté après l’autre, ou une fois par paire en Les deux côtés à chaque série.
- Toute `SessionActivity` expose une projection `postActivityRecoverySeconds`, égale à la durée de l’objet `recovery` explicite s’il existe et à `0` sinon ; cette projection n’est pas une seconde source de vérité persistée (RM-209). Une récupération positive crée une phase après l’occurrence et avant `SESSION_END` si elle est la dernière.
- Ni la Pause ni les récupérations ne créent une entité Exercice associé.
- La charge est informative : elle ne crée aucune phase et n’entre dans aucun calcul de durée, de pause ou de cadence (RM-235).
- Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec phases (R × durée du motif) ou, sans phases, avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip ni phases, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.
- En Durée uniforme seulement, si l’utilisateur pilote par une Durée totale cible, le calcul inverse porte sur cette durée intrinsèque puis applique l’arrondi validé à `C`. Seul `C` est persisté comme valeur canonique de Séries.
- Toutes les Exercices peuvent être associées à des zones corporelles.
- Les exercices peuvent être ajoutées, déplacées, dupliquées et supprimées.
- Leur ordre est conservé à l’intérieur de leur position structurelle. Un Exercice peut être déplacée manuellement d’une position structurelle à une autre.

## Phases de l’exercice

[remplacé par D-448 du 26/10/2026 : libellé d’interface « Phases du mouvement » ; titre de section et données inchangés]

<a id="donnees-phases"></a>

La structure ordonnée et les libellés des phases appartiennent au Mouvement ; les paramètres Catalogue portent les durées par identifiant. La lecture résout la structure avec les paramètres ; seul l’instantané en fige la liste complète. Sans phases : liste vide ; sinon 2 à 6 phases. Une durée renseignée vaut au moins 1 s, somme 1..3535 s. Une durée manquante ne supprime jamais la phase : elle bloque l’enregistrement de l’exercice édité et l’exécution ; seule la correction partagée peut persister les frères incomplets (D-438).

La cible de série est persistée indépendamment des durées des phases. La somme donne la durée du motif, sans réécriture d’une cible ni d’un instantané historique (PHC-20261026). Le total et les phrases ne sont pas persistés. La séquence n’est pas dupliquée N fois dans la définition : le moteur développe séries, côtés et passages.

L’adaptation au format ne modifie que les durées de la copie de séance. Duplication et copie conservent ordre, libellés et valeurs ; les copies restent indépendantes. L’instantané d’exécution fige les phases effectives après adaptation ; la reprise conserve leur position et le temps restant. Les anciennes définitions sans phases restent inchangées, sans réécriture des résultats historiques.

La collection doit être intégrée au contrat canonique versionné et à ses sérialiseurs/parseurs. Pour la transition MFN, D-440 dispense de lire la version ancienne ; une version inconnue ne doit jamais être rabattue silencieusement sur une durée scalaire qui ferait perdre les phases.

### Entité Média

> **Périmètre :** consultation des médias pendant l’Exécution incluse au MVP (D-203). L’ajout/import et le stockage local sont inclus au MVP dans PRE-3, avant le moteur d’exécution (D-333). Les règles de partage des fichiers et de conservation de D-066/D-068 sont conservées ; seul leur report post-MVP est remplacé.

#### Définition

Un **Média** est une ressource visuelle locale associée à un Exercice. L’import/ajout et la persistance de ces associations sont livrés dans PRE-3 au MVP (D-333), avant leur consultation pendant l’Exécution.

#### Périmètre

Un `MediaAsset` possède son identité et ses informations techniques. Les liens vers les Exercices sont portés par des associations `ActivityMedia` ordonnées.

#### Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Exercice | Exercice associé | Obligatoire | Un seul exercice |
| Type | Photo ou vidéo | Obligatoire | |
| Emplacement local | Référence du fichier | Obligatoire | Stockage local |
| Nom du fichier | Nom technique | Obligatoire | |
| Miniature | Aperçu | Facultatif | Générée automatiquement |
| Taille | Taille du fichier | Calculé | |
| Durée | Durée de lecture | Conditionnel | Vidéo uniquement |

#### Règles métier

- Un fichier média peut être référencé par plusieurs associations appartenant chacune à un Exercice.
- Un exercice peut ne posséder aucun média.
- Un exercice possède zéro à plusieurs associations média ordonnées.
- La duplication d’un Exercice ou d’une Séance crée une nouvelle association/entité Média pour l’Exercice dupliqué ; cette association peut référencer le même fichier physique local.
- Retirer un média d’un Exercice supprime uniquement son association. Le fichier physique est supprimé seulement lorsqu’aucun Exercice ni aucun instantané ne le référence.

### Extension du modèle — Exercices, Médias et Parcours

#### Racines et associations

| Objet | Version | Rôle et relations |
|---|---|---|
| `ActivityDefinition` | MVP T03 | Référence persistante autonome sans type d’Exercice, directement exécutable et copiable dans une Séance. |
| `SessionActivity` | MVP | Copie complète appartenant à une seule Séance ; contient sa position et son ordre. |
| `MediaAsset` | MVP PRE-3 | Fichier local immuable et métadonnées techniques ; peut être partagé. |
| `ActivityMedia` | MVP PRE-3 | Association ordonnée entre un exercice et un `MediaAsset`. |

#### Contraintes d’Exercice

`executionMode ∈ {DURATION, REPETITIONS}`. Chaque série possède un type de cible explicite : chiffrée (durée ou répétitions selon le mode) ou À l’échec (aucun nombre prescrit). Valeur invalide/absente distincte de l’échec. L’ancien TO_FAILURE est lu/migré vers REPETITIONS avec toutes les cibles À l’échec, sans inventer de relevé historique. Pause, nombre de Séries et Pause entre les côtés restent disponibles dans les deux modes ; la Récupération après exercice appartient à l’occurrence de Séance (D-208). Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec phases (R × durée du motif) ou, sans phases, avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip ni phases, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Bip entier 0..10 par Série, réglage commun valide dans les deux modes. La charge (activation, valeur commune ou valeurs par Série, en kg) est indépendante de `executionMode`, de la condition d’arrêt et du changement de côté (RM-235). La phrase elle-même n’est pas persistée comme source de vérité (RM-232).

L’ajout d’une définition copie nom, description, zones corporelles, mode, durée ou répétitions, Séries, Pause, Pause entre les côtés (`sideRecoverySeconds`), changement de côté, charge et son activation, valeurs conservées sous Sans comprises (RM-236), et associations média ; la Récupération après exercice n’est pas copiée : elle appartient à l’occurrence et n’est jamais créée automatiquement (D-171 révisée par D-208, D-304). La copie n’a plus de lien fonctionnel avec la définition. La position `BEFORE_TOUR`, `IN_TOUR` ou `AFTER_TOUR` n’existe que sur `SessionActivity`.

#### Contraintes Média

Un Exercice possède `0..n` lignes `ActivityMedia`, chacune avec une position unique dans son exercice. Un nouvel élément reçoit la dernière position et la réorganisation ne touche que cette association. Les fichiers ne sont jamais stockés dans SQLite ; `MediaAsset` contient une URI interne stable, type photo/vidéo, miniature éventuelle et métadonnées. La suppression physique n’est autorisée que lorsque le nombre de références actives, copies et instantanés est nul.

#### Contraintes Parcours

**Ancienne cible autonome retirée le 08/10/2026.** Parcours est désormais le libellé d’un créneau à plusieurs contenus, sans identité, persistance, étapes ou exécution globale propres. Programme est un conteneur distinct ; Circuit reste interne à la Séance. Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

## Paramètres d’exécution

### Migration T03 — Catalogue des Exercices

Cette section constitue l’unique référence du chapitre 09 pour la distinction `ActivityDefinition` / `SessionActivity`, le cycle de vie et la migration T03.

#### Distinction ActivityDefinition / SessionActivity

`ActivityDefinition` est la référence persistante autonome du Catalogue des Exercices. `SessionActivity` est une copie appartenant à une Séance.

Lors d’une insertion Catalogue, l’occurrence reçoit une référence directe au mouvement et une copie locale des paramètres applicables : mode/cible, séries, pauses, côtés, charge et activation, compte à rebours et fin. La récupération contextuelle suit ses règles propres. Les paramètres Catalogue ne se synchronisent pas ; le contenu partagé est lu depuis le mouvement courant. D-445.

La capacité existante de créer directement une `SessionActivity` depuis une Composition ne crée jamais implicitement d’`ActivityDefinition`. Elle est conservée dans le modèle et l’architecture même lorsqu’elle n’est pas exposée dans le parcours utilisateur courant.

#### Migration T03

**Historique T03 :** cette migration ne constitue pas une obligation de reprise pour la transition MFN, désormais régie par D-440.

La migration T03 introduit les structures persistantes nécessaires aux `ActivityDefinition`, à leurs relations et à l’origine d’Exécution `ACTIVITY`.

Elle :

- ne transforme pas les `SessionActivity` historiques en références de Catalogue ;
- ne crée aucune `ActivityDefinition` silencieusement ;
- est idempotente ;
- reste compatible avec la base locale existante ;
- préserve les Séances, Exécutions, Instantanés et résultats antérieurs.

##### Évaluations conditionnelles et résultats réels — D-427 à D-429
Standard : aucune évaluation avant et Ressenti triétat obligatoire après. Enrichi uniquement pour une exécution lancée dans le contexte d'un Programme avec option active (tout lancement indépendant reste standard) : douleur initiale 0–10 obligatoire et sans localisation avant démarrage ; douleur finale 0–10 obligatoire, jamais présélectionnée, et effort perçu 1–10 obligatoire après, à la place du Ressenti. Si douleur finale > 0, au moins une localisation parmi les zones corporelles KODJO (plusieurs possibles, latéralité si applicable) ; zéro doit être choisi explicitement. Commencer ou Enregistrer est bloqué tant que des champs obligatoires manquent. Paramétrage de l'option : À CLARIFIER.

Les douleurs initiale et finale sont indépendantes et distinguent la valeur explicite zéro de l'absence de valeur ; les localisations finales sont une collection de zones corporelles. Les résultats réels de répétitions sont distincts des objectifs prescrits. Structure physique et migration des valeurs historiques : À CLARIFIER.

Formats imposés : modale Répétitions partielles (8928:15098), interruption ou série sous cible ; saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser.

Modale Résultat de série (8937:35362) : saisie proposée zéro, minimum zéro, résultat supérieur à cible autorisé ; validation enregistre le réel et poursuit automatiquement le plan ; fermeture sans validation annule, n'enregistre rien, revient à l'étape sans progresser. Conditions exactes d'ouverture non arbitrées : À CLARIFIER.

## Exécution directe

Une Exécution directe d’Exercice :

- possède `origin = ACTIVITY` ;
- utilise un instantané autonome immuable de l’`ActivityDefinition` au lancement ;
- ne crée aucune Séance technique ou artificielle ;
- applique la préparation système fixe de `5 s` ;
- exécute ensuite les phases propres de l’Exercice, y compris son Compte à rebours éventuel, ses Séries, Pauses, côtés (dont la Pause entre les côtés éventuelle) et Fin d’exercice éventuelle, sans Récupération après exercice (D-248) ;
- ne contient ni Cycle ni Tour de Séance artificiels ;
- alimente le Suivi et les statistiques compatibles sans augmenter le nombre de Séances.

#### Sélection multiple depuis une Composition

La sélection multiple reçoit les identifiants des `ActivityDefinition` choisies, mais les copies sont insérées selon l’ordre courant de présentation de la liste filtrée au moment de la validation. L’ordre des touchers n’est pas un ordre métier.

Une validation sans sélection ne crée aucune donnée.

#### Frontière d’évolution

La gestion multiple ordonnée des médias et les mécanismes d’acquisition média suivent leur périmètre propre. L’ancien objet autonome Parcours est retiré par D-328 ; le libellé de planification ne le réintroduit pas.

#### Données cibles — état média de l’Exécution

La conception D-203 n’introduit pas de nouvelle donnée historique d’Exécution. Elle exploite la collection ordonnée de médias de l’Exercice et ajoute un état UI **volatile** limité à la séance courante :
- face Information/Média par Exercice rencontré ;
- index du média courant par Exercice ;
- état de lecture de la vidéo courante.

La face et l’index ne sont pas persistés entre séances, ne sont pas copiés dans l’Instantané et ne font pas partie des résultats historiques. La conception ne décide pas ici d’un nouveau schéma de stockage durable pour les médias ; celui-ci reste régi par le périmètre de la future gestion multiple des médias.

#### Extension future de Routine — source Parcours

*Texte identique à celui de la section [« Parcours — post-MVP »](01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md#parcours--post-mvp) ; il n’est pas recopié ici.*

#### Données D-208 — récupérations

##### ActivityDefinition

`ActivityDefinition` ne contient aucun champ de récupération post-exercice. Il peut porter `sideRecoverySeconds`, pertinent uniquement avec changement de côté (Avec ; valeurs historiques `RIGHT_LEFT` ou `LEFT_RIGHT`, RM-244).

##### SessionActivity

Aucune récupération automatique à la création d’une occurrence. Une récupération explicite est proposée au défaut Profil (30 s initialement) lors de son ajout ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération (D-304/D-307). Déplacement, duplication et suppression conservent la sémantique d’appartenance à l’occurrence.

##### Plan d’Exécution

Le plan distingue au minimum la phase de Pause entre les côtés de la phase de récupération après occurrence. Une Exécution `ACTIVITY` directe ne génère jamais de phase post-exercice. Une Exécution `SESSION` génère la récupération après chaque occurrence, y compris à chaque répétition de Tour et avant `SESSION_END` pour la dernière occurrence.

#### Données D-209 à D-214 — consolidation

- `Session` porte le **Circuit** interne et son `tourCount`; `Tour` n’est pas une entité de contenu distincte du Circuit mais l’occurrence répétée de celui-ci dans le Plan fonctionnel. Les identifiants techniques historiques peuvent rester inchangés jusqu’à refactorisation.
- `ActivityDefinition` exige une référence de Catégorie active à la création et au moins une association de Zone corporelle. La sélection des Zones est `1..n`.
- `Session` porte `0..1` Étiquette.
- Étiquette/Catégorie portent leur couleur. Les objets les référencent sans copier la couleur courante. Une valeur retirée du référentiel actif reste conservée tant qu’elle est référencée afin de préserver nom/couleur et affectations existantes.
- Les défauts Profil sont lus uniquement à l’initialisation : aucune provenance `hérité/personnalisé` n’est nécessaire et aucune mise à jour rétroactive n’est effectuée.
- `Session` ne porte aucun booléen de prise en compte des phases propres `Compte à rebours d’exercice + Fin d’exercice`. Ces phases sont toujours exclues du plan de Séance ; seuls le Compte à rebours initial et la Fin de séance s’appliquent. Les paramètres propres demeurent sur l’Exercice pour son exécution autonome.
- Un Point d’arrêt placé dans le Circuit appartient au contenu répété et est donc développé à chaque Tour.

La phrase de synthèse des paramètres d’exécution est une **valeur dérivée non persistée**. Elle est régénérée depuis `executionMode`, nombre de Séries, état uniforme/variable, cible/Pause communes ou collection ordonnée, `sideMode`, Ordre des côtés, `sideRecoverySeconds` et la charge active (RM-240). Aucun champ de stockage autonome de la phrase n’est requis (RM-232).

Bornes de validation D-232 : `seriesCount ∈ [1,99]`, répétitions par Série `∈ [1,100]`, durée par Série `∈ [1,3535] s` (minimum porté de 5 à 1 s par D-430, 19/10/2026), somme des phases d’exercice `∈ [1,3535] s` (D-430), pauses inter-Séries et inter-côtés `∈ [0,300] s`. Une valeur héritée hors bornes, non modifiée, peut être conservée ; toute nouvelle saisie ou modification doit respecter ces bornes (D-383). Le pas UI n’est pas une contrainte de stockage : tap 1 s, maintien accéléré 1/5/10 selon DSF Bip ; aucun arrondi à la lecture. La charge suit ses propres règles de pas, de zéro et d’arrondi (RM-239, D-405) ; ces bornes D-232 ne s’y appliquent pas.

#### Paramètres de Série et Ordre des côtés — D-247 à D-254

Contenu identique à la section [« Extension validée du modèle — Paramètres de Série et Ordre des côtés — D-247 à D-254 »](#extension-validée-du-modèle--paramètres-de-série-et-ordre-des-côtés--d-247-à-d-254) : il n’est pas recopié ici.

#### Extension normative de données — Cadence

| Support | Donnée / contrainte |
|---|---|
| Série effective | `cadenceBeepIntervalSeconds` entier 0..10, deux modes,0=Aucun ; cible répétitions et pause restent indépendantes |
| Brouillon uniforme/variable | Cadence commune facultative ; propagée aux lignes. Alternatives de mode mémorisées jusqu’à✓ seulement ; aucune surcharge commune persistée |
| ActivityDefinition / SessionActivity | Transport de la collection ordonnée complète ; occurrence ajoute R contextuelle ; copie indépendante et duplication conservent les cadences |
| Instantané versionné | Prescription cible/cadence de chaque Série et côté, immuable après démarrage ; absent dans ancien snapshot=non cadencé |
| État d’exécution | Intervalles acquis, ancre intervalle courant, nominal atteint, état suspendu ; accumulateur réel distinct de la tentative |
| Résultat par Série/côté | Temps actif cumulé, incluant fractions abandonnées et tentatives reset ; aucun nombre réel de répétitions déduit |
| Calcul dérivé | Secondes prévisionnelles et niveau d’incertitude ; phrase et total non persistés comme vérité indépendante |

Migration : ancien objet sans champ initialisé à 0 ; conserver valeurs et historique. Bip valide et conservé dans les deux modes après validation. Écriture atomique des paramètres et de la collection ; transitions moteur idempotentes. Le schéma physique et sa migration sont à implémenter, pas réputés présents du fait de cette cible.

#### Pauses et symboles

Modèle logique : pause explicite avec identifiant stable, type recovery ou breakpoint et position ; recovery référence son occurrence source et sa durée. postActivityRecoverySeconds est une projection pour les calculs, pas une seconde source persistée. Absent, présent 0 et présent positif restent distinguables. Snapshot copie les objets effectifs ; suppression d’occurrence emporte recovery. Le schéma physique et la migration restent à implémenter ; aucune reprise des anciennes séances demandée.

#### Bip de cadence

cadenceBeepIntervalSeconds entier 0..10 dans les deux modes ; 0=Aucun, défaut 0. Même champ sur les Séries effectives et snapshots, réglage commun sans surcharge. Aucune suppression lors d’une bascule de mode. Résultat temporel exact/estimated/lowerBound/omitted ; omitted sans montant, validation erronée séparée. LowerBound autorisé à l’Exercice mixte calculable, ainsi qu’aux agrégats Circuit/Séance. SeriesParameters et pauses explicites doivent être intégrés au schéma avant ce champ ; numérotation de migration à planifier.

#### Précision de modèle — source, v15

Une récupération explicite de 0 s est un objet conservé, distinct de l’absence ; seul Retirer la supprime (depuis D-442, par désélection en mode Placement appliquée par Confirmer). Elle ne crée aucune phase positive ni suppression dePN. Le scalaire historique ActivityDefinition.pauseSeconds ne devient pas une récupération : sa valeur est portée dans SeriesParameters.pauseSeconds lors de la refonte. Les pauses recovery/breakpoint de Composition restent une collection distincte. Aucun schéma physique ou migration exécutée dans ce lot.

**Compatibilité D-214 — 12/10/2026.** Si un ancien champ d’activation est déjà persisté, il est obsolète et ne peut réactiver les phases propres lors de la construction d’un nouveau plan SESSION, quelle que soit sa valeur. L’inventaire du schéma réel détermine sa migration physique ; aucune suppression SQL n’est livrée par cette correction documentaire. Conserver les paramètres propres des Exercices et les instantanés/résultats historiques, sans réécriture des temps réalisés.

#### Données des circuits

| Donnée | Contrat fonctionnel |
|---|---|
| Nature du circuit | tours / séries ; tours par défaut pour les objets existants sans nature |
| Compte | Entier 1..99 ; interprété selon nature, sans deuxième compte concurrent faisant autorité |
| Nombre effectif par exercice | En séries, égal au compte du circuit ; invariant validé atomiquement |
| Régime de l’exercice | Identiques/variables explicite ; collection ordonnée cible/Pause en variable, paramètres communs en identiques |
| Réserve après diminution au compteur du circuit | Brouillon de séance seulement, paramètres et ordre ; restaurée avant copie de la dernière ligne ; purgée à enregistrement |
| Instantané | Nature, compte et paramètres effectifs nécessaires à reproduire le plan ; historique immuable |
| Occurrence exécutée | Rattachement stable au circuit, passage, exercice, indice de série et côté pour reprise/progression |

Les noms physiques, éventuel renommage de tourRepeatCount et migration sont à déterminer par inventaire du schéma réel ; aucune migration SQL n’est prescrite par Figma. Aucune persistance des phrases, totaux ou états visuels actifs/repliés comme sources métier concurrentes. Les séries définitivement tronquées par conversion confirmée ne sont pas récupérables par un retour de nature.

#### Cibles et relevés

La cible typée appartient à chaque Série effective et à chaque copie/snapshot ; le mode appartient à l’Exercice. Interdire simultanéité cible numérique/échec et interdire zéro comme cible. La valeur relevée est facultative, distincte de la prescription, rattachée à exécution/occurrence/série/côté/passage/tentative. Unité, origine et qualification (chronométrée, estimée, déclarée, absente) sont conservées. Garder la proposition source en cas de correction. Aucun relevé absent transformé en zéro. Les paramètres et résultats historiques ne sont pas réécrits par la régénération d’une phrase.

Migration de l’ancien TO_FAILURE : REPETITIONS + cibles échec, valeurs et comportement conservés ; lecture versionnée des snapshots historiques, aucune répétition rétrocalculée. La donnée dernière tentative doit être distinguée du cumul :20 s reset 35 s →55 s cumulé,35 s relevé. Voir [Cibles typées et migration des anciennes définitions](09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md#cibles-typées-et-migration-des-anciennes-définitions) et [Exécution d'une séance — Cibles et relevés d’exécution](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#exécution-dune-séance--cibles-et-relevés-dexécution) ; schéma physique à réaliser, non livré par la documentation.

<a id="formats-donnees"></a>
#### Formats — données fonctionnelles et invariants

| Porteur | Information | Règle de cohérence |
|---|---|---|
| Séance | Format facultatif | Six formats ; absent = libre. Aucune déduction depuis le titre ou des valeurs similaires. |
| Séance | Origine de création | Distincte du format ; les départs rapides ne portent aucune contrainte. |
| Séance | Réglages de format et organisation applicable | Modifiables dans la composition ; ne modifient pas les constantes ni l’historique. |
| Prescription | Valeurs ordonnées et unité d’indexation | Série pour Progression, tour pour For time. Pas de réinterprétation implicite. |
| Occurrence contextualisée | Valeur effective, provenance et caractère imposé | Ne pas réécrire ActivityDefinition du catalogue pour appliquer le contexte. |
| Instantané | Format, origine, réglages effectifs, prescription et version de règle | Lecture stable après modification/suppression de la source. |
| Fenêtre exécutée | Rang, début, échéance, objectif, signal de fin du travail | Une fin de travail ne change pas l’échéance ; horloge indépendante de l’audio. |
| Acquisition Death by | Fenêtre confirmée, tour acquis | Au plus une acquisition par fenêtre ; aucun tour acquis sans appui. |
| Clôture Death by | Répétitions partielles confirmées, motif, état d’achèvement | Formulaire proposé à 0, résultat déclaré après validation ; limite/abandon distincts, état incomplet dans les deux cas. |

La durée EMOM est dérivée N × E × W ; le repos résiduel appartient à sa fenêtre, ce n’est pas une récupération ajoutée. Les valeurs calculées ne constituent pas une deuxième prescription persistée. Les phrases ne sont pas stockées : segments régénérés à l’affichage.

Compatibilité : les anciennes séances sans format restent libres, leurs historiques inchangés. L’état fonctionnel « incomplet » du Death by n’est pas converti silencieusement en l’ancien statut Terminée/Interrompue ; son raccordement au schéma physique doit conserver les trois axes motif/résultat/achèvement. Les exigences générales de relevé qualifié du 13/10 restent applicables ; la clôture Death by ne rend pas obligatoire la saisie des relevés d’autres exercices.

<a id="compatibilite-series"></a>
#### Persistance des séries et compatibilité

##### Compatibilité, données, API et instantanés

Existant sans nouveaux attributs : uniforme, Un côté après l’autre. Quantité de travail, cibles, Pauses stockées et changement de côté conservés ; une direction historique vaut Avec (RM-244). Un Exercice sans charge est lu Sans, jamais 0 kg (RM-236). **Le changement de durée et de pauses exécutées est assumé pour les exercices existants**, confirmé le 02/10. Les instantanés et résultats historiques restent immuables ; ne pas réécrire les durées réalisées.

La clarification du 07/10 conserve la Pause après chaque série, dernière comprise ; seule une récupération positive qui suit remplace la dernière Pause. Les snapshots existants demeurent immuables ; la migration physique doit être planifiée.

Le modèle persistant et les copies/duplications doivent conserver le mode uniforme/variable explicite, N, la collection ordonnée cible/Pause lorsque variable, le changement de côté, l’ordre des côtés, PC, Compte à rebours et Fin, ainsi que la charge : activation, charge commune ou charges par Série, y compris les valeurs conservées sous Sans et les valeurs décimales acceptées (RM-236, RM-239). Cette conservation des valeurs désactivées est propre à la charge : la non-persistance des variantes cachées reste applicable aux autres paramètres (D-403). R reste dans l’occurrence. Les paramètres variables remplacent les paramètres uniformes comme source effective, sans surcharges. Prévoir représentation et version d’instantané compatibles ; la structure SQL exacte et la migration relèvent de la planification technique, pas d’un nouveau choix Figma.

API de validation/calcul/duplication et construction du plan doivent consommer la même représentation et les mêmes formules. Aucun résumé textuel ni total dérivé n’est une source persistée indépendante. Persistance atomique : aucune série partiellement écrite, aucune mutation d’ActivityDefinition par sa copie dans une Séance.

<a id="cibles-typees"></a>
#### Cibles typées et migration des anciennes définitions

##### Modèle de paramètres

Le mode reste unique pour l’exercice. La cible devient une propriété de chaque série effective :

- **Cible chiffrée** : durée en secondes si mode Durée ; entier de répétitions si mode Répétitions.
- **Cible À l’échec** : aucune valeur numérique prescrite ; fin décidée par l’utilisateur.
- **Cible incomplète ou invalide** : erreur de saisie distincte, jamais convertie implicitement en À l’échec.

Une représentation typée distinguera explicitement cible chiffrée et cible à l’échec. Ni `0`, ni une chaîne dans un champ numérique, ni un simple `null` ambigu ne doivent porter seuls cette distinction. Le nom physique des champs et le schéma de migration restent des choix d’implémentation.

Le régime identiques/variables reste indépendant du mode. En identiques, toutes les séries ont la même cible, y compris À l’échec. En variable, la collection peut mélanger cibles numériques et À l’échec ; l’ordre est conservé. Des cibles momentanément égales ne changent pas automatiquement le régime. N=1 suit la normalisation déjà actée. La Condition d’arrêt présentée est dérivée de ces cibles : aucune condition globale ni valeur Mixte n’est persistée (RM-248, RM-249).

Les mêmes prescriptions s’appliquent aux deux côtés ; leurs résultats sont distincts. Nombre hérité d’un circuit à séries alternées, ajout, suppression, copie de dernière ligne, déplacement, retour au régime identique et restauration temporaire suivent les règles existantes. Copier une cible À l’échec copie son type et sa pause, sans inventer de nombre. La charge d’une Série suit les mêmes opérations que sa cible et sa Pause (RM-238) ; elle ne porte aucune valeur distincte par côté (RM-235).

Une bascule Durée/Répétitions conserve le caractère À l’échec, indépendant de l’unité. Les cibles numériques incompatibles suivent les mécanismes existants de brouillon, mise à renseigner et restauration ; aucune conversion secondes ↔ répétitions n’est introduite.

##### Migration et compatibilité

**Portée historique :** D-440 dispense de ces conversions, lecteurs anciens et messages de reprise pour la transition MFN sur base vierge. Les données créées ensuite restent conservées.

Tout ancien exercice en mode À l’échec est interprété comme Répétitions avec toutes ses séries à l’échec. Conserver nombre, pauses, bip, côté, ordre et autres paramètres. Fin par Suivant, omission du total et phrase existante restent préservées.

Appliquer la transformation aux définitions et copies concernées, pas seulement au Catalogue. Les instantanés et résultats historiques restent interprétables selon leur version ; ne pas réécrire un résultat historique ni lui attribuer rétrospectivement des répétitions à partir d’un temps global.

La migration est comportementalement conservatrice, mais nécessite une conception technique : inventaire des enums/champs existants, versionnement, lecture de l’ancien format, transformation atomique, copies, reprises et compatibilité des données déjà sauvegardées. Ne pas déclarer une migration SQL définie avant inventaire du schéma réel. Pour la phase projet, la migration ne reprend que les données utilisables : un Exercice dont les paramètres sont illisibles est écarté, sans sauvegarde de récupération ni quarantaine, et le nombre d’Exercices écartés est signalé : à la fin de la migration, un message récapitulatif indique le nombre d’Exercices non récupérés et propose l’action `Compris` pour le fermer ; rien n’est affiché si aucun Exercice n’a été écarté, et ce message n’est pas affiché à chaque mise à jour de l’application (D-394). Titre : « Certains exercices n’ont pas été récupérés » ; texte : « La mise à jour de vos données est terminée. {N} exercice(s) n’ont pas pu être récupérés car leurs données étaient illisibles. », accordé au singulier ou au pluriel selon {N}, nombre d’Exercices non récupérés ; bouton « Compris » (D-401). L’intégrité des données migrées est préservée : aucun lien orphelin, aucune suppression en cascade d’une Séance entière ; au Catalogue, l’Exercice écarté disparaît ; en Séance, l’occurrence est retirée et la Séance conservée. Une erreur structurelle de migration reste un échec avec annulation complète (décision PRE-4 Q19 du 16/10, commune aux versions PRE-4 BMAD et VNext ; D-385). Une valeur numérique négative ou non entière de Cible, Pause, Pause au changement de côté, Bip, Compte à rebours ou Fin, dans une Définition comme dans une Copie en Séance, fait écarter l’Exercice selon la même règle ; aucun calcul n’utilise une valeur négative. Les valeurs positives hors grille ou hors plage restent conservées (D-383) ; une Cible nulle ou à 0 reste à renseigner (décision PRE-4 Q28 du 16/10, D-385).

Le chronométrage existant ne garantit pas à lui seul que la durée de dernière tentative soit déjà disponible : le modèle documenté stocke notamment le temps cumulé, tentatives réinitialisées comprises. Il faut vérifier l’état moteur effectivement conservé et compléter la persistance de tentative si nécessaire. Le coût technique n’est donc pas déclaré nul.

<a id="donnees-bip"></a>
#### Paramètre de bip et validation des données

##### Données et livraison

Entrées de Série/snapshot : cible du mode, Pause, cadenceBeepIntervalSeconds0..10. Validation commune aux deux modes ; valeurs −1,11 et fractions refusées sans correction silencieuse. Les données historiques restent immuables ; ne pas tronquer silencieusement un ancien intervalle hors plage si une version de code l’a réellement persisté. La stratégie de reprise dépend de cet inventaire réel.

Résultats temporels typés exact/estimated/lowerBound/omitted ; omitted sans montant. Une erreur de validation est séparée. APIs validation, calcul, génération du plan et phrase utilisent ce même contrat. Renommer les paramètres logiques et l’ordonnanceur ; réutiliser les phases Série existantes, ne pas ajouter un quatrième mode.

Le prérequis SeriesParameters et les objets de pause doit être planifié avant intégration de cette évolution au modèle scalaire existant. Le numéro de migration n’est pas décidé par Figma. Ce lot documentaire ne livre ni migration SQL ni code audio.

### Saisie des paramètres d’exécution

Contenu identique à la section [« Saisie des paramètres d’exécution »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#saisie-des-paramètres-dexécution) : il n’est pas recopié ici.

### Extension validée du modèle — Paramètres de Série et Ordre des côtés — D-247 à D-254

Le mode d’exécution est commun à l’Exercice. Le stockage distingue explicitement uniforme et variable, même si les valeurs sont identiques. En variable, conserver N lignes ordonnées avec cible (Durée/Répétitions), Pause et charge éventuelle (RM-238) ; aucune cible numérique À l’échec. Les mêmes lignes s’appliquent aux deux côtés. Changement de côté (Sans / Avec, RM-242) et Ordre des côtés sont deux propriétés distinctes ; aucune direction anatomique n’est plus choisie (D-406). N=1 est normalisé uniforme/Un côté après l’autre dès le brouillon.

Copie Catalogue→Séance, duplication et nouvel instantané conservent tout cet état. Les données sans nouveaux attributs sont uniformes/Un côté après l’autre. Les calculs actuels s’appliquent aussi aux Exercices existants ; résultats historiques immuables. Les valeurs temporaires de restauration et le repli visuel ne sont jamais persistés ; les charges conservées sous Sans ne sont pas des valeurs temporaires et sont persistées (RM-236, D-403). Voir chapitre 08, paramètres d’exercice et 8 pour le contrat complet.

### Extension validée du modèle — Extension Cadence du modèle de Série

La Série porte `cadenceBeepIntervalSeconds` (entier 0..10,0 par défaut), applicable aux deux modes. L’édition commune est une projection de brouillon, pas une seconde vérité persistée au-dessus de la collection variable. Activation, modification, suppression et déplacement conservent l’intégrité de la collection. Définition, copie de Séance et instantané transportent la même propriété.

Une durée prévisionnelle déterminable ne signifie pas une fin automatique : Ri×Ci fournit le poids temporel et la fin nominale, Suivant l’achèvement. L’accumulateur réel inclut tentatives réinitialisées et intervalles abandonnés ; il est distinct de la progression et du chronomètre courant. Aucun nouvel objet Répétition. Voir Bip v2 et modèle 09.

## Composition des séances

### Extension validée du modèle — Pauses et symboles

La Composition possède des pauses explicites recovery et breakpoint. recovery appartient à une occurrence ; breakpoint conserve une position structurelle. Une projection R=0 pour absence ne crée pas d’objet. La présence et la durée 0 sont distinctes, les phases 0 s ne sont pas générées.

## Exécution

### Entité Exécution

#### Définition

Une **Exécution** représente la réalisation effective d’une source exécutable. Dans le MVP, son origine vaut `SESSION` ou, à partir de T03, `ACTIVITY` pour un Exercice lancé depuis le Catalogue des Exercices.

Elle est créée uniquement au démarrage et reste indépendante des modifications ou de la suppression ultérieures de sa source.

#### Périmètre

Une Exécution possède directement :

- une origine immuable `SESSION` ou `ACTIVITY` ;
- la référence facultative à la source persistante ;
- la Routine éventuelle pour une origine `SESSION` ou `ACTIVITY` ;
- un instantané immuable de la source ;
- un état d’Exécution ;
- ses informations de début et de fin.

#### Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Créé au démarrage |
| Origine | Type de source | Obligatoire | `SESSION` ou `ACTIVITY`, immuable |
| Source persistante | Séance ou Exercice de référence | Facultatif | Une seule selon l’origine ; peut devenir absente après suppression de la source |
| Routine | Routine d'origine | Facultatif | Autorisée pour `SESSION` ou `ACTIVITY` lorsqu’une occurrence planifiée a déclenché l’Exécution |
| Instantané de source | Copie figée de la Séance ou de l’Exercice | Obligatoire | Créé automatiquement |
| État d'exécution | Avancement | Obligatoire | Mis à jour en continu |
| Date de début | Début réel | Obligatoire | Générée automatiquement |
| Date de fin | Fin réelle | Facultatif | À la clôture |
| Statut | En cours, Suspendue, Terminée, Partielle ou Interrompue | Obligatoire | |
| Durée réelle | Temps actif réellement exécuté | Calculé | Exclut uniquement les périodes de Pause manuelle déclenchées par l’utilisateur ; inclut le Compte à rebours initial, le temps réellement passé dans les Exercices, les Pauses entre Séries, les phases `SIDE_RECOVERY` / `POST_ACTIVITY_RECOVERY` réellement exécutées et la Fin de séance |
| Dernière sauvegarde | Date de sauvegarde | Obligatoire | Technique |
| Ressenti | Ressenti général renseigné dans la Synthèse | Conditionnel | Obligatoire dès lors que la Synthèse est présentée ; peut être absent après interruption technique sans Synthèse |
| Commentaire | Commentaire libre de Synthèse | Facultatif | **200 caractères maximum** |
| Nombre d’Exercices exécutés | Nombre de Résultats d’Exercice exécuté effectivement créés | Calculé | Un Exercice `Partielle` compte comme exécutée ; un Exercice jamais atteinte ne compte pas ; utilisé notamment pour le Suivi et les indicateurs historiques |
| Occurrence planifiée satisfaite | Occurrence future éventuellement satisfaite par une Exécution anticipée | Facultatif | Renseignée lorsqu’une occurrence future est démarrée en avance |

> **Formats :** cette grille antérieure n’encode pas à elle seule l’achèvement incomplet du Death by. Conserver séparément motif, résultat et achèvement selon FMT-38 ; aucun mapping implicite vers Terminée.

#### Structures internes

##### Instantané de source

L’Instantané de source est une copie figée et allégée de la Séance ou de l’Exercice persistant au moment du démarrage de l’Exécution.

Il contient uniquement les informations nécessaires pour :
- reconstruire l’ordre et le contenu de la Séance exécutée ;
- restituer fidèlement l’Exécution dans l’historique ;
- calculer les informations de suivi prévues par le MVP.

Il ne contient pas de copie physique des médias associés aux Exercices.

| Élément conservé         | Contenu                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Séance                   | Identifiant source, nom, Étiquette et couleur dérivée                                                          |
| Compte à rebours initial | Durée, texte vocal                                                                                             |
| Cycle                    | Identifiant, position, nombre de répétitions                                                                   |
| Tour                      | Identifiant, position, nombre de répétitions                                                                   |
| Exercice                | Identifiant source, nom, mode d’exécution, durée ou répétitions cibles lorsqu’elles existent, nombre de Séries, état uniforme/variable, cibles/Pauses ordonnées, charge et son activation (commune ou par Série, valeurs conservées sous Sans comprises, RM-236), changement de côté, Ordre des côtés, PC, R contextuelle de l’occurrence uniquement, description, zones corporelles, associations média ordonnées et références stables dans la cible post-T05 |
| Durée totale             | Valeur recalculable, non canonique et non persistée comme source de vérité                                      |
| Fin de séance            | Durée, texte vocal                                                                                             |
| Structure                | Ordre exact des éléments et relations nécessaires au plan d’exécution                                          |

Les fichiers médias ne sont pas dupliqués physiquement dans l’Instantané. Celui-ci conserve toutefois les associations ordonnées et les références stables ; un fichier reste conservé tant qu’un instantané le référence.

L’Instantané est persisté sous forme de **JSON immuable**. Les champs nécessaires à la consultation chronologique du Suivi MVP sont conservés sous une forme permettant un accès efficace sans dépendre de la Séance courante. Les index spécifiques à la recherche, au tri et aux filtres avancés ne sont pas requis par l’interface MVP et pourront être ajoutés lors de l’activation de ces fonctions.

##### État d'exécution

Contient notamment :

- exercice courant ;
- Tour courant ;
- cycle courant ;
- état temporel courant ;
- état du chronomètre.

#### Règles métier

- Une Exécution est créée au démarrage effectif d’une source `SESSION` ou `ACTIVITY`.
- Elle référence exactement une source persistante selon son origine lorsqu’elle existe encore.
- Elle peut référencer la Routine qui a déclenché son occurrence, quelle que soit son origine.
- Un Instantané de source est créé automatiquement au démarrage effectif de l’Exécution.
- L’Instantané est immuable après sa création.
- Toute modification, archivage ou suppression ultérieure de la source est sans effet sur l’Instantané.
- L’Exécution conserve la référence à sa source lorsqu’elle existe, mais son historique est reconstruit exclusivement à partir de l’Instantané.
- Les fichiers médias ne sont pas dupliqués dans l’Instantané ; leurs associations ordonnées et références stables y sont conservées dès l’introduction des médias au MVP (D-333).
- Toute modification ultérieure de la routine est sans effet.
- Une seule exécution peut être en cours simultanément.
- Après une interruption technique alors que l’Exécution était `En cours`, elle n’est pas clôturée automatiquement. Au retour dans l’application, l’utilisateur doit choisir l’action de reprise ou l’action d’arrêt adaptée à son origine. Tant que ce choix n’est pas effectué, aucune nouvelle Exécution ne peut démarrer. L’arrêt clôt l’Exécution avec le statut `Interrompue` puis ouvre la fin minimale dans T04, ou la Synthèse lorsqu’elle est livrée.
- Une exécution terminée, partielle ou interrompue est conservée dans le suivi.

### Résultat d’Exercice exécuté

Chaque occurrence d’Exercice parcourue pendant une Exécution produit un **Résultat d’Exercice exécuté** distinct. Il permet de distinguer les occurrences issues des Séries, répétitions de Tour et répétitions de Cycle.

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique du résultat | Obligatoire | Stable |
| Exécution | Exécution concernée | Obligatoire | Une seule Exécution |
| Exercice de l’Instantané | Exercice source | Obligatoire | Référence l’Instantané, pas la Séance courante |
| Position d’exécution | Rang dans le plan d’exécution | Obligatoire | Permet de distinguer les occurrences |
| Série / Tour / Cycle | Indices de répétition applicables | Calculé | Conservés pour restitution |
| Statut | Résultat de l’occurrence | Obligatoire | `Terminée` ou `Partielle` selon le type et le déroulement |
| Durée réelle | Temps réellement passé sur l’Exercice | Obligatoire | Chronométré pour les modes Durée ou Répétitions, avec cible chiffrée ou À l’échec par série |
| Pause entre les côtés prévue/écoulée | Durées de la phase intrinsèque éventuelle | Conditionnel | Champs distincts rattachés à `SIDE_RECOVERY` lorsqu’elle existe |
| Récupération après exercice prévue/écoulée | Durées de la phase contextuelle | Obligatoire / calculé | Planifiée depuis `postActivityRecoverySeconds`; `0` reste une valeur de donnée, temps écoulé nul si aucune phase positive |

> **Formats :** cette grille antérieure n’encode pas à elle seule l’achèvement incomplet du Death by. Conserver séparément motif, résultat et achèvement selon FMT-38 ; aucun mapping implicite vers Terminée.

Ces résultats sont conservés avec l’Exécution et permettent de calculer le **Nombre d’Exercices exécutés** et les indicateurs de Suivi.

### Structures internes du moteur d'exécution

#### Définition

Le moteur d'exécution est le composant chargé de transformer une **séance** en une succession d'exercices exécutables.

Au démarrage d'une séance, il construit un **plan d'exécution** à partir de l'**instantané de séance** créé pour cette exécution.

Le plan d'exécution est ensuite parcouru séquentiellement jusqu'à la fin de la séance.

Le moteur d'exécution, le plan d'exécution et les structures qu'il manipule sont des structures internes de calcul. Ils ne constituent pas des entités métier.

#### Plan d'exécution

##### Définition

Pour un compte borné, le plan est la représentation linéaire obtenue après résolution de la structure. Pour AMRAP/Death by, le plan cible génère progressivement les passages à partir de l’instantané et de la borne ; il n’exige pas une liste finie entièrement déroulée au départ.

Le Compte à rebours initial structurellement présent, éventuellement instantané à `0 s`, les Exercices placés avant le Circuit, les Tours du Circuit et les Exercices placés après le Circuit sont développés afin d'obtenir une liste ordonnée directement exploitable. Les cycles visibles développent leurs membres selon leur compte propre (RM-252) ; la Fin de séance est ajoutée une seule fois à la suite du plan développé.

##### Contenu

- liste ordonnée des étapes d’exécution ;
- ordre d'exécution ;
- références vers les exercices de l'instantané ;
- numéro de Tour ;
- numéro de répétition du cycle ;
- informations de navigation.

#### Exercice d'exécution

##### Attributs fonctionnels

| Attribut            | Description                                |  Caractère  | Règle principale                  |
| ------------------- | ------------------------------------------ | :---------: | --------------------------------- |
| Position            | Rang dans le plan d'exécution              |   Calculé   | Numérotation continue             |
| Exercice            | Exercice de l'instantané                   | Facultatif  | Absente pour `INITIAL_COUNTDOWN` et `SESSION_END`; les phases de récupération référencent leur Exercice/occurrence source |
| Type de phase       | `INITIAL_COUNTDOWN`, `ACTIVITY`, `SERIES_PAUSE`, `SIDE_RECOVERY`, `POST_ACTIVITY_RECOVERY` ou `SESSION_END` | Calculé | Déduit de l’Exercice et de l’occurrence ; ce n’est pas un type d’Exercice |
| Tour du Circuit  | Numéro de Tour               |   Calculé   | Généré automatiquement            |
| Répétition du cycle | Numéro de répétition du cycle              |   Calculé   | Généré automatiquement            |
| Étape suivante      | Navigation                                 |   Calculé   | Absente uniquement pour `SESSION_END` |

#### Règles métier

- Le plan d'exécution est généré automatiquement au démarrage de chaque exécution de séance.
- Il est construit exclusivement à partir de l'instantané de séance.
- Toute modification ultérieure de la séance ou de la routine est sans effet.
- La fin du dernier Exercice active `SESSION_END`. L’Exécution n’est terminée qu’après l’achèvement de cette dernière étape ; une durée de `0 s` l’achève immédiatement.
- Les comptes bornés sont résolus lors de la génération. Pour AMRAP/Death by, les passages sont générés progressivement ; rang temporel et acquisition de résultat sont distincts.
- Chaque Série produit une phase `ACTIVITY`. Une phase `SERIES_PAUSE` existe après chaque Série quand sa pause est positive, dernière comprise, sauf substitution terminale par une récupération positive suivant les règles de l’occurrence. `SIDE_RECOVERY` est insérée entre les côtés si nécessaire ; `POST_ACTIVITY_RECOVERY` est insérée après chaque occurrence de Séance si sa durée contextuelle est positive.
- La charge active de chaque Série, figée dans l’instantané, est l’information affichée pendant cette Série (RM-241) ; elle ne crée, ne modifie ni ne supprime aucune phase (RM-235).
- La conception T04 à compte borné développe Séries, Tours et côtés avant démarrage. Pour les formats ouverts, l’instantané fige la prescription et la règle de génération, pas un nombre arbitraire de fenêtres futures.
- Les préférences globales sont appliquées pendant l'exécution sans modifier le plan.

### Cycles de vie

#### Objectif

Ce chapitre décrit les différents états que peuvent traverser les principales entités.

#### Cycle de vie d'une séance

```text
Création → Édition → Active
                 ├─ Modifier
                 ├─ Dupliquer → Nouvelle séance
                 ├─ Archiver → Séance archivée → Restaurer
```

##### Règles métier

- Une Séance est créée lors de la validation de sa Composition ; l’Étiquette reste facultative dans le modèle courant.
- Une séance peut rester vide pendant son édition.
- Une séance archivée n'est plus proposée pour créer une nouvelle routine ou être exécutée directement.
- La duplication crée une nouvelle séance indépendante.

#### Cycle de vie d'un exercice

Une `ActivityDefinition` persistante du Catalogue suit le cycle :

```text
Création → Active → Modifier → Archiver → Restaurer
                                  └→ Supprimer définitivement depuis les archives
```

- Une `ActivityDefinition` est autonome et ne porte aucune position de Séance.
- Un Exercice de Séance (`SessionActivity`) appartient à une seule Séance et occupe exactement une position fonctionnelle avant, dans ou après le Circuit ; les valeurs techniques restent `Avant Tour`, `Dans Tour`, `Après Tour`. La référence technique au conteneur `Tour` n’est obligatoire que pour `Dans Tour`.
- L’insertion crée une occurrence indépendante pour ses paramètres, directement liée au mouvement partagé ; aucun lien de dépendance à la définition Catalogue (D-445).
- La capacité de création directe d’une `SessionActivity` locale à une Séance reste conservée techniquement et fonctionnellement, même si elle n’est pas exposée dans le parcours courant.
- La suppression définitive d’une `ActivityDefinition` ne supprime ni les `SessionActivity` déjà copiées, ni les Exécutions, ni les Instantanés historiques.

#### Cycle de vie d'une routine

Création → Modification → Suppression

##### Règles métier

- Une Routine est créée avec une ou plusieurs références actives SESSION/ACTIVITY, ordonnées et munies de leur motif.
- La suppression d’une Routine ne supprime jamais sa source ni les Exécutions.

#### Cycle de vie d’une Exécution

Création → En cours → Suspendue → Reprise → Terminée, Partielle ou Interrompue → Historique

##### Règles métier

- Une Exécution est créée au démarrage effectif d’une Séance ou d’un Exercice persistant, depuis son Catalogue ou depuis une occurrence planifiée de Routine.
- Une seule exécution peut être en cours simultanément.
- Après une interruption technique alors que l’Exécution était `En cours`, elle n’est pas clôturée automatiquement. Au retour dans l’application, l’utilisateur doit choisir `Reprendre la séance` ou `Arrêter la séance`. Tant que ce choix n’est pas effectué, aucune nouvelle Exécution ne peut démarrer. `Arrêter la séance` clôt l’Exécution avec le statut `Interrompue` puis ouvre la fin minimale dans T04, ou la Synthèse lorsqu’elle est livrée.
- *Texte identique à celui de la section [« Règles métier »](#règles-métier-3) ; il n’est pas recopié ici.*

#### Données de bilatéralité

| Donnée | Type et règle |
|---|---|
| `activity.sideMode` | Changement de côté Sans / Avec (RM-242), non nul, défaut Sans ; valeurs historiques `UNILATERAL` (Sans), `RIGHT_LEFT` et `LEFT_RIGHT` (lues Avec, sans réinterprétation de l’Ordre des côtés, RM-244) ; représentation technique laissée à l’implémentation ; présent sur l’Exercice persistant et sur son occurrence de Séance. |
| `tour.sideMode` | Champ technique historique conservé pour compatibilité et non-régression ; dans la version actuelle il reste fixé à `UNILATERAL` et n’est pas exposé ni modifiable. |
| `executionPlanNode.effectiveSideMode` | Valeur figée dans l’instantané, résolue depuis l’Exercice dans la version actuelle. |
| `executionPlanNode.executionSide` | Sans côté, côté 1 (côté par lequel l’utilisateur commence) ou côté 2 (RM-243) ; noms techniques laissés à l’implémentation, valeurs historiques `NONE`, `RIGHT`, `LEFT` lisibles (RM-244) ; sans côté uniquement pour une exécution unilatérale ou une phase structurelle sans côté. |
| `activityResult.executionSide` | Sans côté, côté 1 ou côté 2 (RM-243) ; résultats historiques `NONE`, `RIGHT`, `LEFT` lisibles sans réécriture (RM-244) ; participe à la clé logique d’idempotence avec l’Exercice, le Tour et la Série. |

La migration ajoute `UNILATERAL` comme valeur par défaut aux données de côté historiques sans dupliquer Exercice ni Résultat. Les résultats historiques reçoivent `NONE`. Les valeurs historiques `RIGHT_LEFT` et `LEFT_RIGHT` valent Avec et ne sont pas réécrites sans nécessité (RM-244). Le champ technique historique de côté du Tour est conservé pour compatibilité et non-régression, reste fixé à `UNILATERAL` et n’est pas exposé à la mutation utilisateur dans la version actuelle.

#### Extension V2 — origine et instantané d’Exécution

| Donnée | Valeurs / règle |
|---|---|
| `Execution.origin` | `SESSION` ou `ACTIVITY`, obligatoire et immuable. |
| `Execution.sourceSessionId` | Renseigné uniquement pour `SESSION`. |
| `Execution.sourceActivityDefinitionId` | Référence informative pour `ACTIVITY` ; peut devenir nulle si la source est supprimée. |
| `Execution.snapshot` | Instantané immuable de la Séance ou de l’Exercice selon l’origine. |
| `Execution.preparationDurationSeconds` | `5` pour `ACTIVITY` ; valeur issue de la Séance pour `SESSION`. |
| `Execution.completedSeriesCount` | Agrégat compatible avec un Exercice directe. |

Contraintes : une origine `ACTIVITY` interdit un `sourceSessionId`, ne crée aucun objet Séance et ne contient aucune étape `SESSION_END`. Les résultats conservent les côtés et paramètres figés.

## Planification

### Entité Routine

La Routine porte le créneau et une liste ordonnée de références, non les contenus d’entraînement eux-mêmes. Chaque entrée référence une Séance active ou un Exercice persistant actif du même utilisateur. Le type et l’identifiant de source appartiennent désormais à **chaque entrée**, pas à un unique couple sur la Routine.

| Donnée fonctionnelle | Porteur | Règle |
|---|---|---|
| Identité, propriétaire, dates de création/modification | Routine | Identité stable ; aucun objet Parcours ajouté |
| Liste de contenus | Routine | Ordonnée, mixte SESSION/ACTIVITY ; une ou plusieurs entrées à la validation |
| Type et référence de contenu, rang | Entrée de la liste | Référence source ; pas de copie SessionActivity lors du choix |
| x, n, positions retenues | Entrée de la liste | Filtre sans unité ; n positions affichées ; valeur initiale à chaque fois |
| Programme | Routine | Facultatif ; fenêtre borne les dates ; source Programme V1.2 à retrouver |
| Début, heure | Routine | Une seule heure par créneau |
| Répétition activée | Routine | Non : unique ; Oui : paramètres de récurrence |
| Unité, multiplicateur | Routine | Jour/Semaine/Mois ; bornes Jour/Mois à préciser |
| Jours sélectionnés | Récurrence hebdomadaire | Au moins un jour pour Semaine ; usage sous Jour/Mois ouvert |
| Type de borne | Routine | jusqu’au/date ou pendant/nombre d’unités ; conversion ouverte |
| Rappel activé, délai | Routine |0..1 ; permission système requise pour activation |

Le schéma physique, les identifiants d’entrée et les liens aux exécutions devront être spécifiés avant développement. Ces noms fonctionnels ne sont pas un schéma SQL livré. Les occurrences futures restent dérivées ; aucun stockage de phrase récapitulative comme vérité métier. Une mise à jour ne réécrit pas les exécutions/instantanés passés. Les règles mono-source d’archivage ou suppression ne sont pas généralisées à une liste sans préciser l’effet sur les autres entrées.

Voir la [spécification de planification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification), y compris ses points ouverts ; aucune règle manquante ne se déduit des valeurs Figma.

### Règles de planification

Le créneau produit d’abord sa suite d’occurrences. Chaque contenu retient ensuite les positions définies par son motif x/n ; changer Jour en Semaine ne change pas le motif. L’origine de l’index et son évolution après modification restent à préciser, pas à inférer du calendrier dessiné.

Sans répétition : une date/heure. Avec répétition : Jour/Semaine/Mois. Pour Semaine, conserver l’ancrage sur la semaine contenant le début, le multiplicateur 1..12 et les dates inclusives du calcul existant. Ne pas utiliser ce calcul comme définition du mode Mois ou de la conversion pendant/jusqu’au.

Rappel : interrupteur puis 5 min/15 min/30 min/1 h/Autre, choix égaux sur la largeur. Aucun n’est plus une option ; Autre ouvre le réglage personnalisé. Les règles de permission et le plafond personnalisé 24 h existants restent conservés.

La modification agit sur le futur ; suppression de Routine conserve sources et histoire. L’agrégation des états de plusieurs contenus, les exclusions d’occurrence et l’archivage d’un contenu de liste nécessitent les compléments explicitement ouverts dans la spécification. Ne pas créer d’Exécution fictive pour un contenu non réalisé.

*Texte identique à celui de la section [« Entité Routine »](#entité-routine) ; il n’est pas recopié ici.*

### Entité Occurrence planifiée
##### Définition
 
Une Occurrence planifiée représente la trace historisée d'une planification arrivée à échéance.  
Les occurrences futures calculées dynamiquement ne constituent pas des objets persistés.
 
##### Périmètre

**Cas à contenu unique :** le modèle historique ci-dessous reste la référence de ce cas. Pour plusieurs contenus, la date/heure reste produite par le créneau ; l’identité des réalisations par entrée et l’agrégation des statuts doivent être complétées avant implémentation. Ne pas appliquer le statut d’une seule Exécution à toute la liste.

Une Occurrence planifiée à contenu unique possède directement :

- la Routine qui l'a générée ;
- le type de source et la source concernée ;
- la date et l'heure auxquelles la source était planifiée ;
- son statut ;
- le cas échéant, l'Exécution correspondante.

##### Attributs fonctionnels

| Attribut     | Description                                   |    Caractère | Règle principale                                     |
| ------------ | --------------------------------------------- | -----------: | ---------------------------------------------------- |
| Identifiant  | Identifiant unique de l'occurrence historisée |  Obligatoire | Stable                                               |
| Routine      | Routine ayant généré l'occurrence             |  Obligatoire | Référence à la Routine d'origine                     |
| Type de source | Type du contenu planifié                     | Obligatoire | `SESSION` ou `ACTIVITY` |
| Source       | Source concernée                               | Obligatoire | Référence à la source planifiée au moment de l’occurrence |
| Date prévue  | Date planifiée                                |  Obligatoire | Valeur issue de la Routine au moment de l'occurrence |
| Heure prévue | Heure planifiée                               |  Obligatoire | Valeur issue de la Routine au moment de l'occurrence |
| Statut       | Résultat de l'occurrence                      |  Obligatoire | `Exécutée` ou `Non exécutée`                         |
| Exécution    | Exécution associée                            | Conditionnel | Présente uniquement si la source a été démarrée      |

> **Formats :** cette grille antérieure n’encode pas à elle seule l’achèvement incomplet du Death by. Conserver séparément motif, résultat et achèvement selon FMT-38 ; aucun mapping implicite vers Terminée.

##### Règles métier

- Une Occurrence planifiée est normalement persistée à son échéance. **Exception :** lorsqu’une occurrence future est exécutée en avance depuis l’action `Démarrer` de sa carte, elle est persistée immédiatement avec sa date/heure initialement planifiées et son lien vers l’Exécution réelle, afin de ne pas être reproposée à son horaire initial.
- Une occurrence future reste calculée dynamiquement et n'est pas persistée.
- Le statut d'une occurrence historisée est `Exécutée` ou `Non exécutée`.
- Une occurrence `Exécutée` référence l'Exécution correspondante.
- Une occurrence `Non exécutée` ne possède aucune Exécution associée.
- Une occurrence historisée est conservée même si la Routine d'origine est ensuite modifiée ou supprimée.

## Suivi et synthèse

### Cycle de vie d'une séance — Historique

Chaque exécution crée un nouvel enregistrement dans le suivi.

L'historique conserve notamment :

- l'instantané de la séance ;
- les temps réalisés ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur.

L'historique n'est jamais modifié par les évolutions ultérieures de la séance.

### Exécution d'une séance — Historique d'exécution

Chaque exécution enregistre notamment :

- la date et l'heure de début ;
- la durée réelle ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur ;
- l’instantané fonctionnel de la séance ;
- les informations propres à chaque exercice exécuté.

Cet instantané est suffisamment complet pour restituer la structure, les paramètres et les libellés de la Séance exécutée, mais il reste volontairement léger. Dès leur introduction au MVP dans PRE-3 (D-333), il conserve les associations média ordonnées et leurs références stables sans dupliquer les fichiers physiques.

Une exécution n'est jamais modifiée après son enregistrement.

### Suivi et historique des séances — Création d'un historique

Un historique est créé dès le démarrage d'une séance.

Il est basé sur l'instantané enregistré au lancement de l'exécution.

Cet instantané comprend notamment :

- l’identifiant et le nom de la Séance source ;
- son Étiquette et la couleur portée par cette Étiquette ;
- le Compte à rebours initial ;
- la structure ordonnée des Cycles, Circuits et Exercices ;
- les paramètres fonctionnels nécessaires de chaque Exercice ;
- les zones corporelles nécessaires à la restitution fidèle de l’historique ;
- la Fin de séance ;
- les paramètres nécessaires à la génération du plan d’exécution.

Les informations média nécessaires à la restitution suivent le périmètre média courant ; l’historique conserve en priorité les données nécessaires à la fidélité fonctionnelle de l’Exécution.

L'instantané n'est jamais modifié après sa création.

### Suivi et historique des séances — Informations enregistrées

Chaque historique enregistre notamment :

- la date et l'heure de début ;
- la durée réelle ;
- le statut de l'exécution ;
- le ressenti de l'utilisateur ;
- le détail des exercices exécutés ;
- les temps réellement réalisés ;
- les éventuelles interruptions.

Ces informations restent définitivement associées à cette exécution.

## Profil et préférences

*Préférence facultative `silhouette` du Profil : contrat de donnée énoncé à la section [« Migration T03 — Catalogue des Exercices — Impacts de données de la revue des cartes »](06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md#migration-t03--catalogue-des-exercices--impacts-de-données-de-la-revue-des-cartes) ; il n’est pas recopié ici.*

### Entité Utilisateur

#### Définition

Un **Utilisateur** représente le propriétaire des données de l'application.

Dans la V1, un seul utilisateur local existe sur l'appareil.

#### Périmètre

Un utilisateur possède directement :

- ses informations générales ;
- sa couleur ;
- ses séances ;
- ses routines ;
- ses exécutions de séance ;
- ses Étiquettes de Séance ;
- ses Catégories d’Exercice ;
- ses zones corporelles ;
- ses préférences globales.

Il ne contient pas directement les exercices, les médias, les structures internes d'exécution ni les mécanismes d'authentification.

#### Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable pendant toute la durée de vie |
| Nom affiché | Nom ou pseudonyme | Facultatif | Peut rester vide |
| Photo de profil | Image du profil | Facultatif | Média local |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

#### Règles métier

- Une seule instance d'utilisateur existe dans la V1.
- Un utilisateur possède 0..n séances.
- Un utilisateur possède 0..n routines.
- Un utilisateur possède 0..n exécutions de séance.
- Un utilisateur possède une seule structure de préférences globales.
- Toutes les données métier appartiennent directement ou indirectement à un seul Utilisateur. Les racines d’agrégat persistantes portent la référence de propriétaire ; les objets enfants héritent de cette propriété par leur rattachement.

### Entité Préférences globales

#### Définition

Les **Préférences globales** regroupent les paramètres personnels influençant le comportement général de l'application.

Elles s'appliquent à toutes les séances et à toutes les exécutions, sans modifier leur définition.

#### Périmètre

Les préférences possèdent directement :

- les paramètres audio ;
- les paramètres d'affichage ;
- les paramètres d'exécution ;
- les valeurs proposées par défaut lors de la création de nouvelles séances ou exercices.

Elles ne contiennent pas directement :

- les séances ;
- les routines ;
- les exercices ;
- les exécutions de séance.

#### Attributs fonctionnels

| Attribut                                           | Description                                                                |  Caractère  | Règle principale                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------- | :---------: | ------------------------------------------------------------------------ |
| Sons activés                                       | Active les signaux sonores                                                 | Obligatoire | Préférence globale                                                       |
| Annonces vocales                                   | Active les annonces vocales                                                | Obligatoire | Préférence globale                                                       |
| Notifications                                      | Autorisation effective des rappels locaux                                  | Obligatoire | Non autorisées par défaut ; demande système lors de la première activation d’un rappel |
| Vibration                                          | Active les vibrations fonctionnelles de séance                             | Facultatif  | Valeur initiale activée ; n'affecte pas le feedback haptique systématique des roulettes numériques |
| Écran maintenu actif                               | Empêche la mise en veille pendant une exécution de séance                  | Facultatif  | Pendant l'exécution uniquement                                           |
| Durée par défaut d'un exercice Exercice           | Valeur initiale proposée                                                   | Facultatif  | Création uniquement                                                      |
| Pause entre les côtés par défaut              | Valeur globale du Profil utilisée pour initialiser `sideRecoverySeconds` lors de l’activation du changement de côté (Avec) d’un Exercice | Facultatif | `10 s` dans le Figma de référence ; valeur proposée à la création/activation bilatérale puis modifiable dans l’éditeur |
| Récupération après exercice par défaut              | Valeur proposée lors de l’ajout explicite d’une récupération | Facultatif | `30 s` dans le Figma de référence ; ajout explicite uniquement ; une modification ultérieure ne change pas les récupérations existantes |
| Date de création                                   | Date de création                                                           | Obligatoire | Générée automatiquement                                                  |
| Date de modification                               | Dernière modification                                                      | Obligatoire | Mise à jour automatiquement                                              |
| Durée du compte à rebours initial par défaut       | Durée proposée pour le compte à rebours initial d'une nouvelle séance      | Obligatoire | Valeur initiale : `10 s`                                                 |
| Texte vocal du compte à rebours initial par défaut | Texte vocal proposé pour le compte à rebours initial d'une nouvelle séance | Facultatif  | Valeur initiale : `Préparez-vous`                                        |
| Durée de la fin de séance par défaut               | Durée proposée pour la fin de séance d'une nouvelle séance                 | Obligatoire | Valeur initiale : `5 s`                                                  |
| Texte vocal de la fin de séance par défaut         | Texte vocal proposé pour la fin de séance d'une nouvelle séance            | Facultatif  | Valeur initiale : `Séance terminée, bravo`                               |
| Durée du compte à rebours d’Exercice par défaut    | Durée proposée pour le Compte à rebours propre d’un nouvel Exercice     | Obligatoire | Valeur proposée par le Profil                                             |
| Durée de la Fin d’exercice par défaut              | Durée proposée pour la Fin propre d’un nouvel Exercice                  | Obligatoire | Valeur proposée par le Profil                                             |
#### Règles métier

La Pause après chaque série n’est pas un défaut du Profil ; elle est initialisée à `0 s` dans la feuille de création (chapitre 08, paramètres d’exercice, CE-UI-10 §3). L’ancien attribut global est historique et ne doit pas être ajouté au modèle cible. Les valeurs déjà propres aux Exercices restent conservées.

- Chaque utilisateur possède une seule structure de préférences globales.
- Les préférences s'appliquent à toutes les séances et à toutes les exécutions.
- Modifier une préférence n'altère jamais les séances existantes.
- Les valeurs par défaut sont utilisées uniquement lors de la création de nouveaux éléments.
- Une exécution de séance utilise les préférences actives au moment de son démarrage.
- Une modification des préférences ne modifie jamais une exécution déjà en cours.
- Les préférences sont enregistrées automatiquement après chaque modification.
- Les valeurs par défaut du Compte à rebours initial et de la Fin de séance sont copiées dans la Séance lors de sa création.
- Les valeurs par défaut du Compte à rebours d’Exercice et de la Fin d’exercice sont proposées lors de la création d’un nouvel Exercice.
- Une modification ultérieure des Préférences globales ne modifie pas les séances déjà créées

## Référentiels

### Entité Étiquette

#### Définition

Une **Étiquette** permet de classer une **Séance**. Elle porte la couleur affichée de la Séance ; aucune couleur métier indépendante n’est stockée sur la Séance.

#### Périmètre

Une Étiquette possède son identité, son libellé et sa couleur persistante. Une Séance référence zéro ou une Étiquette.

#### Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Utilisateur | Propriétaire | Obligatoire | Une Étiquette appartient à un seul utilisateur |
| Nom | Libellé affiché | Obligatoire | Non vide après trim ; unicité selon normalisation canonique |
| Couleur | Couleur affichée de la Séance | Obligatoire | Valeur persistante issue de la palette contrôlée |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

#### Règles métier

- une Séance peut ne porter aucune Étiquette ;
- lorsqu’une Étiquette est associée, sa couleur est la couleur affichée de la Séance ;
- créer une nouvelle Étiquette depuis la Composition l’ajoute au référentiel utilisateur selon le parcours validé ;
- toute Étiquette est supprimable, y compris une valeur fournie initialement par KODJO ; la suppression la retire des choix futurs mais conserve son association aux Séances existantes qui l’utilisent ;
- créer une Étiquette dont le nom normalisé correspond à une Étiquette retirée réactive celle-ci (même identifiant, associations conservées, couleur choisie appliquée) (D-257) ;
- les Instantanés historiques conservent les informations nécessaires à la restitution du libellé et de la couleur.

### Entité Catégorie

#### Définition

Une **Catégorie** classe une **Exercice** et porte sa couleur sémantique. Elle est distincte des Zones corporelles.

#### Périmètre

Une Catégorie possède son identité, son libellé, sa couleur et son ordre d’affichage. Un nouvel Exercice valide référence exactement une Catégorie.

#### Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Utilisateur | Propriétaire | Obligatoire | Une Catégorie appartient à un seul utilisateur |
| Nom | Libellé affiché | Obligatoire | Non vide après trim ; unicité selon normalisation canonique |
| Couleur | Couleur sémantique de l’Exercice | Obligatoire | Valeur persistante issue de la palette contrôlée |
| Ordre d'affichage | Position dans les listes | Obligatoire | Déterministe |
| Date de création | Date de création | Obligatoire | Générée automatiquement |
| Date de modification | Dernière modification | Obligatoire | Mise à jour automatiquement |

#### Règles métier

- un nouvel Exercice valide porte exactement une Catégorie ;
- un Exercice porte au plus une Catégorie dans le modèle courant ;
- la Catégorie et les Zones corporelles sont deux dimensions indépendantes ;
- la couleur de la Catégorie est utilisée comme repère sémantique de l’Exercice dans les cartes et l’éditeur ;
- une Catégorie créée depuis l’éditeur devient disponible dans le référentiel utilisateur selon le parcours validé ;
- toute Catégorie est supprimable, y compris une valeur fournie initialement par KODJO ; la suppression la retire des choix futurs mais conserve son association aux Exercices existants qui l’utilisent et préserve l’historique.
- créer une Catégorie dont le nom normalisé correspond à une Catégorie retirée réactive celle-ci (même identifiant, associations conservées, couleur choisie appliquée) (D-257).

### Entité Zone corporelle

#### Définition

Une **Zone corporelle** désigne une partie du corps principalement sollicitée par un Exercice.

L’application fournit un référentiel utilisateur de Zones corporelles utilisé pour caractériser les Exercices. Il est initialisé avec des valeurs par défaut mais reste administrable par l’utilisateur dans le MVP.

#### Périmètre

Une Zone corporelle possède directement :

- son identité ;
- son nom ;
- son ordre d’affichage.

Un nouvel Exercice valide référence une ou plusieurs Zones corporelles. Une zone corporelle ne contient pas directement les exercices qui l’utilisent.

#### Attributs fonctionnels

| Attribut | Description | Caractère | Règle principale |
| --- | --- | :---: | --- |
| Identifiant | Identifiant unique | Obligatoire | Stable |
| Nom | Libellé affiché | Obligatoire | Unique dans le référentiel |
| Ordre d’affichage | Position dans les listes | Obligatoire | Défini par l’application |

#### Règles métier

- Un nouvel Exercice valide est associé à une ou plusieurs Zones corporelles ; la sélection reste multiple.
- Les Zones corporelles constituent un référentiel utilisateur administrable.
- L’utilisateur peut créer, renommer et supprimer une Zone corporelle.
- Toutes les Zones, y compris les dix valeurs initiales fournies par KODJO, sont supprimables.
- La suppression d’une Zone utilisée demande confirmation, la retire des choix futurs, conserve ses associations aux Exercices existants et ne modifie pas les Instantanés/Exécutions historiques.
- Créer une Zone dont le nom normalisé correspond à une Zone retirée réactive celle-ci (même identifiant, associations conservées) (D-257).

#### Valeurs initiales du référentiel (D-093, révisée par D-199)

1. Cou
2. Épaules
3. Bras
4. Poignets et mains
5. Dos
6. Hanches et bassin
7. Cuisses
8. Genoux
9. Jambes
10. Chevilles et pieds

Le jeu initial ne contient pas de zone `Corps entier` et ne distingue pas gauche/droite. Ces dix valeurs sont des valeurs par défaut, non une liste fermée : le référentiel peut évoluer par création, renommage ou suppression utilisateur. Les identifiants restent stables ; un renommage ne change pas l’identité de la Zone.

## Sujets transverses

### Vue d'ensemble

Contenu identique à la section [« Règles métier et calculs »](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#règles-métier-et-calculs) : il n’est pas recopié ici.

#### Objectif et périmètre

Ce chapitre décrit le modèle de données fonctionnel de l'application.

Il définit les principales entités métier, leurs relations, leur cycle de vie et les règles garantissant la cohérence des données.

Il est indépendant de toute technologie d'implémentation. Il ne décrit ni la structure de la base de données, ni les classes applicatives, ni les API.

Le modèle couvre les domaines fonctionnels suivants :

1. la définition des séances ;
2. leur planification par des routines ;
3. leur exécution ;
4. l'historique des exécutions ;
5. les référentiels et préférences de l'utilisateur.

Dans le MVP, toutes les données sont stockées localement sur l'appareil.

#### Principes structurants

Le modèle de données fonctionnel est indépendant de la technologie de persistance. Les identifiants des entités sont stables et doivent rester compatibles avec l’ajout ultérieur d’une synchronisation cloud ou multi-appareils. Le choix du stockage local et des mécanismes de persistance relève du chapitre 12 – Architecture technique.

- Une **Séance** décrit le contenu d'un entraînement.
- Une **Routine** porte un créneau et une liste ordonnée de contenus SESSION/ACTIVITY.
- Une même séance peut être associée à plusieurs routines.
- Une séance contient un **cycle**.
- Un cycle contient un **Circuit** (conteneur technique `Tour`).
- Le cycle et le Circuit possèdent chacun un nombre de répétitions.
- Un Circuit contient une suite ordonnée d'Exercices ; un Tour est une répétition complète de ce Circuit.
- Un Exercice ne possède pas de type `Exercice` ou `Récupération`.
- Un Exercice possède un nombre de Séries propre, de 1 à 99 (D-092), une Pause après chaque série d’un même côté et, lorsqu’elle est bilatérale, une `sideRecoverySeconds` facultative exécutée entre les deux côtés. La récupération post-exercice appartient à l’occurrence, pas à l’`ActivityDefinition`.
- Une **Exécution** est créée au démarrage d’une source exécutable : une Séance ou, à partir de T03, un Exercice persistant dans le MVP.
- Chaque Exécution conserve un **instantané fonctionnel** immuable et allégé de sa source.
- Toute modification ultérieure d'une séance ou d'une routine est sans effet sur les exécutions déjà enregistrées.
- Les structures utilisées par le moteur d'exécution sont distinctes des entités métier.

#### Vue d'ensemble du modèle

##### Liste des entités

| Entité | Rôle dans l'application | Nature |
| --- | --- | --- |
| Utilisateur | Propriétaire des données | Principale |
| Séance | Définition réutilisable d'un entraînement | Principale |
| Cycle | Structure ordonnée de la séance portant son propre nombre de répétitions | Structure interne de séance |
| Circuit (conteneur technique `Tour`) | Conteneur ordonné d'exercices portant son propre nombre de répétitions | Structure interne de séance |
| Routine | Créneau et liste ordonnée de références `SESSION`/`ACTIVITY` | Principale |
| Occurrence planifiée | Trace historisée d'une planification arrivée à échéance | Principale |
| Exercice | Action élémentaire d'une séance | Principale |
| Média | Média associé à un Exercice ; affichable dans le Catalogue MVP | Métier |
| Étiquette | Classement d’une Séance et source de sa couleur affichée | Métier |
| Catégorie | Classement d’un Exercice et source de sa couleur sémantique | Métier |
| Zone corporelle | Partie du corps sollicitée | Métier |
| Exécution | Réalisation effective d’une source `SESSION` ou `ACTIVITY` | Principale |
| Préférences globales | Paramètres généraux | Configuration |

#### Décisions structurantes du modèle

| ID     | Décision                                                                                                                                                                                                     | Version        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| DM-001 | Le modèle cible ne possède aucun type d’Exercice `Exercice` ou `Récupération`. Une `ActivityDefinition` porte éventuellement `sideRecoverySeconds`; la récupération post-exercice est contextuelle à l’occurrence. | D-208 |
| DM-002 | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec phases (R × durée du motif) ou, sans phases, avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip ni phases, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. | D-247/D-248/v13 |
| DM-003 | Une séance peut contenir plusieurs cycles visibles ou aucun (D-451). | MVP |
| DM-004 | Un cycle contient une suite non vide de circuits et/ou exercices directs ; aucun cycle imbriqué (D-451). | MVP |
| DM-005 | Le cycle et le Tour sont répétés par leurs paramètres de répétition.                                                                                                                                         | V1             |
| DM-006 | Une même Séance ou une même `ActivityDefinition` peut être planifiée par plusieurs Routines ; chaque Routine porte une liste ordonnée de références SESSION/ACTIVITY (D-328). | MVP — D-206 |
| DM-007 | Une Exécution crée automatiquement un Instantané fonctionnel immuable et allégé de sa source (`SESSION` ou `ACTIVITY`).                                                                                                                                       | V1             |
| DM-008 | Les occurrences futures sont calculées dynamiquement à partir des Routines et ne sont pas stockées. À leur échéance, elles sont historisées afin de conserver leur résultat.                                 | V1             |
| DM-009 | Les exceptions de planification sont prévues pour une version ultérieure.                                                                                                                                    | V2             |
| DM-010 | Une seule entité Utilisateur locale existe dans la V1.                                                                                                                                                       | V1             |
| DM-011 | La cardinalité Cycle et Tour est limitée à 1 dans le MVP, mais le modèle est conçu pour permettre ultérieurement une collection ordonnée de Cycles par Séance et une collection ordonnée de Tours par Cycle. | Évolution      |
| DM-012 | Un Cycle, un Tour et une `SessionActivity` appartiennent à une seule Séance. Une `ActivityDefinition` du MVP T03 est autonome et peut être copiée dans plusieurs Séances ; ses copies ne restent pas liées. | MVP T03 |
| DM-013 | Un Exercice possède un nombre de Séries propre, entier de 1 à 99 (D-092). Une Série n'est pas une entité autonome. | V1 |
| DM-014 | Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases. | D-247/D-248/v13 |
| DM-015 | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec phases (R × durée du motif) ou, sans phases, avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip ni phases, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel. | D-247/D-248/v13 |
| DM-017 | Dans la version actuelle, le Tour ne porte aucun changement de côté exposé. Tout champ technique historique de direction Tour est conservé pour compatibilité mais contraint à `UNILATERAL`. | 24/09/2026 |
| DM-018 | Un Exercice peut porter un Compte à rebours propre et une Fin d’exercice propre. | 24/09/2026 |
| DM-019 | Un Point d’arrêt est un élément ordonné de Composition ; son attente n’est pas comptée dans la durée. | 24/09/2026 |
| DM-020 | La Séance porte une Étiquette ; l’Exercice porte une Catégorie ; les Zones corporelles restent une association distincte de l’Exercice. | 24/09/2026 |
| DM-016 | N est persisté ; total dérivé, inversion uniquement Durée uniforme. État de roulette non persisté. | D-248/v13 |

#### Relations principales

```text
UTILISATEUR
│
├── possède 0..n SÉANCES
│       │
│       ├── porte une ÉTIQUETTE de Séance
│       ├── contient 0..n EXERCICES AVANT LE CYCLE
│       ├── contient 1 CYCLE
│       │      │
│       │      ├── nombre de répétitions
│       │      ├── contient 1 CIRCUIT (conteneur technique TOUR)
│       │      │      │
│       │      │      ├── nombre de répétitions
│       │      │      └── contient 0..n EXERCICES DANS LE CIRCUIT
│       │      └── contient 0..n EXERCICES APRÈS LE CIRCUIT ET DANS LE CYCLE
│       └── contient 0..n EXERCICES APRÈS LE CYCLE ET AVANT LA FIN DE SÉANCE
│
├── possède 0..n ROUTINES
│       └── porte 1..n ENTRÉES ordonnées → SÉANCE ou EXERCICE PERSISTANT
│
├── possède 0..n EXÉCUTIONS
│       ├── possède 1 ORIGINE `SESSION` ou `ACTIVITY`
│       ├── référence 0..1 SÉANCE ou 0..1 ACTIVITÉ PERSISTANTE
│       ├── contient 1 INSTANTANÉ DE SOURCE
│       └── contient 1 ÉTAT D'EXÉCUTION
│
├── possède 0..n CATÉGORIES
├── possède 0..n ZONES CORPORELLES
└── possède 1 PRÉFÉRENCES GLOBALES
```

Les cardinalités représentées correspondent aux règles fonctionnelles du MVP. La représentation technique devra néanmoins conserver Cycles et Tours sous forme de collections ordonnées afin que les cardinalités puissent évoluer ultérieurement.


## Données et réserves — actualisation du 25/10

**D-445 — décisions validées le 25/10 :** C01–C07 et C09 sont clos ; C08 seul reste différé sur le périmètre MVP. [Spécification consolidée v7](../KODJO-Niveaux-Recherche-Parcours-Regles-v7.md).



## Modèle actif et instantanés — D-445

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du contenu partagé sont visibles à la prochaine lecture des définitions et des séances ; aucun mécanisme de propagation de copies de contenu n’est nécessaire. Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

| Objet / propriété | Nullabilité / responsabilité |
|---|---|
| Mouvement.id | Identité obligatoire, stable ; existence indépendante des exercices |
| Mouvement.nom / clé canonique | Nom principal requis et unique selon espaces/casse/accents ; alias non uniques autorisés |
| ActivityDefinition.movementId | Référence active obligatoire et intègre |
| SessionActivity.movementId | Référence active directe obligatoire et intègre ; changement de mouvement par remplacement d’occurrence |
| SessionActivity paramètres | Valeurs locales complètes et indépendantes ; aucune surcharge dépendant d’une définition Catalogue supprimable |
| Instantané.sourceMovementId | Identité obligatoire, immuable ; pas de cascade ni jointure obligatoire pour afficher/exécuter le contenu figé |
| Autres exercices / existence d’exécution | Données calculées pour le dialogue, pas un compteur de séries ni un état d’utilisation irréversible |
| Rang / total / suffixe - Nn | Dérivés, non persistés dans le nom, les exercices ou instantanés |

La structure des phases appartient au mouvement ; les valeurs restent propres à chaque définition et occurrence. Dans une **correction du même mouvement**, conserver les valeurs des phases conservées par `WorkPhase.id` stable ; ne pas réutiliser un identifiant supprimé. Une nouvelle phase n’hérite d’aucune durée inventée. Les exercices concernés peuvent rester explicitement incomplets après la correction partagée ; les signaler et demander la complétion avant leur prochain lancement. L’exercice directement édité reste soumis à sa validation normale. Ne pas imposer la complétion immédiate de tous les autres exercices.

Dans un **changement de mouvement/niveau**, transférer par rang, jamais par égalité d’identifiants entre mouvements : sans→sans, durée reprise ; sans→phases, durées vides ; phases→sans, cible de série conservée (jamais remplacée par la somme) ; phases→phases, rangs communs repris, surplus source abandonné, surplus cible à compléter. Mode, séries, cibles, pauses, charge, côtés, récupération et position sont conservés sous les contraintes existantes. Annuler restitue intégralement l’occurrence précédente.

La lecture partagée supprime la synchronisation du contenu, pas la vérification de compatibilité des paramètres. Le moteur ne lance pas un exercice incomplet et ne relit aucun mouvement après création de l’instantané.


### Phases — clarification PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Référence normative : [PHC-20261026](../KODJO-Phases-Guidage-Cyclique-2026-10-26.md). La règle Répétitions sans bip = non calculable concerne désormais les exercices sans phases : avec phases, R × durée du motif donne une estimation nominale, jamais une mesure. Arrêt mixte et guidage après objectif avant Suivant restent les deux points distincts décrits dans cette référence. [clos par D-446 du 26/10/2026 : l’arrêt mixte se représente par les séries variables, avec phases ; en Répétitions chiffrées, le motif continue de boucler, sans signal, entre la cible et Suivant] Les anciennes captures sont des preuves datées ; alignement Figma et code non revendiqué.


## Réordonnancement des niveaux depuis le catalogue des mouvements — 27/10/2026

Source : instruction de Hermann du 27/10/2026. Règles 6 et 7 reproduites sans reformulation ; règle 8 remplacée par la clarification validée par Hermann le 27/10/2026. Les règles 1 à 5 et 9 sont au chapitre 10, section de même titre. Rattachement : D-437, D-439, D-445 ; lignes « Groupe sur Mouvement » et « Rang / total / suffixe - Nn » du présent chapitre.

##### Règle 6 — texte de référence

6. **Effet sur les données.** Le rang n'est pas une donnée : il se dérive de l'ordre des membres. Réordonner réécrit la seule clé de tri du mouvement déplacé ; aucune autre écriture n'est nécessaire et rien ne cascade. Les rangs restent contigus et sont recalculés à la lecture. Retiens la clé de tri fractionnaire ou lexicographique, qui limite l'écriture à une ligne ; une clé entière contiguë obligerait à réécrire toute la famille.

##### Règle 7 — texte de référence

7. **Effet sur le reste.** L'identité du mouvement ne change pas. Les exercices qui le référencent continuent de le référencer, les instantanés et l'historique ne sont pas touchés, conformément à `sourceMovementId` conservé sans rang. Seul change le niveau affiché sur les cartes et l'ordre proposé dans le menu « Changer de niveau ».

##### Règle 8 — clarification validée par Hermann le 27/10/2026

8. **Archivage et filtres.** Archiver ou restaurer un membre conserve son appartenance et sa clé de tri ; ces opérations ne modifient pas les niveaux. Un filtre masque des membres sans recalculer les niveaux des membres visibles. Supprimer définitivement un membre peut modifier les rangs et le total affichés des membres restants, sans réécrire leurs clés de tri ni modifier leurs identités ou leurs instantanés.

Le calcul porte sur la famille complète, membres archivés compris, avant filtrage. Aucun rang n’est persisté et aucune place n’est réservée après suppression définitive. Cette clarification est conforme à MFN-05 et à la règle 6 ; le point est clos. Elle ne modifie pas les conditions existantes d’autorisation de suppression ni ne valide les parcours de rattachement/détachement de C08.


## Projection Catalogue des séances — 27/10/2026

La carte unique est une projection de la Séance D-449, pas une nouvelle nature d'objet. Son nombre d'exercices est le nombre de composants exercice présents dans la composition, sans multiplication par tours/cycles/séries et sans compter les récupérations. Catégories et zones proviennent des mouvements référencés ; les catégories affichées sont dédupliquées dans l'ordre de première apparition. Étiquette conservée dans les données et les filtres, absente de la carte. Visuel dérivé selon la cascade du §1 de la [spécification](../KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md) ; aucun nouveau champ photo de séance n'est imposé. Le détail conserve l'arbre Cycle/Circuit/Exercice, au plus deux décalages ; il ne transforme pas ni n'aplatit la composition persistée. Niveaux absents du nom et de la carte, filiation et instantanés inchangés. Les règles de titre du §8 relèvent de l'édition et ne réécrivent pas automatiquement les séances existantes à la lecture du catalogue.
