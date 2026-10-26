# KODJO — Niveaux, recherche de gestes, parcours et règles

Date : 24 octobre 2026
Version 5, définitive. Tous les arbitrages produit sont rendus.
Remplace les v2, v3 et v4 du 24 octobre.

KODJO est une application généraliste, fitness first. Dans l'interface, l'utilisateur manipule des **exercices**, des **gestes** et des **niveaux**. Le terme **mouvement** appartient au modèle interne et n'apparaît jamais à l'écran.

---

## 1. Concepts

Un **geste** décrit ce qui est effectué : nom, alias éventuels, description, médias, classification corporelle et structure éventuelle des phases.

Un **exercice** associe un geste à des **paramètres d'exécution** : mode, durées, répétitions, séries, pauses, charge, côtés.

Plusieurs exercices peuvent partager le même geste avec des paramètres différents. Ils partagent alors sa classification en niveaux.

Un **niveau** est la position d'un geste dans une progression ordonnée de variantes. Chaque variante possède sa propre identité de geste. Des exercices ne forment pas des niveaux au seul motif que leurs durées, charges ou répétitions diffèrent.

Exemple : tenir une même planche 30, 45 ou 60 secondes fait trois jeux de paramètres, pas trois gestes ni trois niveaux.

---

## 2. Règles générales des niveaux

### N01 — Absence de niveau

Un geste créé indépendamment commence sans groupe de progression.

**Sur la fiche d'un exercice**, la commande de niveau est un contrôle interactif : elle affiche son état vide, le seul mot **« Niveau »**, variante `Rôle=Niveau, État=Vide` du `Sélecteur classification` (`9925:41506`), comme l'état vide de Catégorie affiche « Catégorie ». La commande reste touchable pour créer une progression.

**Sur les cartes et les lignes purement informatives**, rien n'est affiché. Ces supports ne portent pas de commande, donc pas d'état vide à montrer.

Aucun libellé négatif n'est employé nulle part. La très grande majorité des gestes n'appartiendra jamais à une progression ; écrire « Aucun » ferait porter une négation à presque toutes les cartes, dans une place déjà disputée.

### N02 — Progression linéaire

Un geste appartient au maximum à un groupe de niveaux.

Le groupe représente une progression linéaire, ordonnée explicitement par l'utilisateur. Aucun branchement ni passage automatique au niveau suivant.

Le groupe n'est pas présenté comme un objet autonome à nommer.

### N03 — Rang relatif et calculé

Le rang est la position actuelle du geste dans son groupe. Le total est le nombre de gestes du groupe.

Ni le rang ni le total ne sont stockés comme propriétés d'un exercice ou d'une exécution. Ils sont dérivés du groupe.

Ajouter, retirer ou déplacer un geste modifie les rangs affichés des autres membres sans changer leur identité.

**Aucune limite métier au nombre de niveaux d'un groupe.** Les trois variantes graphiques de `icon/niveau` sont une contrainte de dessin, pas une règle. Les progressions réelles dépassent couramment cinq échelons : la progression pompes de Hybrid Calisthenics en compte onze, celle de Convict Conditioning dix, les progressions tractions et squats six à huit. La rééducation est plus courte, trois à cinq phases, mais le produit reste généraliste. Un refus au sixième niveau toucherait précisément les utilisateurs qui se servent le plus des niveaux.

**Retirer un geste de son groupe** signifie qu'il n'a plus de niveau. Ce n'est ni une suppression du geste, ni une indisponibilité de quoi que ce soit.

### N04 — Créer un niveau

Ajouter un niveau crée trois choses indissociables : un nouveau geste, un exercice associé avec ses paramètres, et le rattachement à la progression du geste d'origine. Un niveau ne se crée jamais seul.

**L'utilisateur choisit en termes de difficulté, pas de position : « Plus facile que X » ou « Plus difficile que X ».** Le système place le nouveau geste avant ou après en conséquence.

Les termes « niveau inférieur » et « niveau supérieur » sont écartés : en français ils se lisent aussi bien comme une difficulté que comme une position dans la liste, et les deux ne coïncident que si la liste a été rangée du facile au difficile, ce que rien ne garantit. Le choix par la difficulté rend l'ordre du facile au difficile vrai par construction.

**L'ordre exprime le classement de difficulté choisi par l'utilisateur.** L'application ne juge ni ne certifie cette difficulté ; elle enregistre un classement déclaré.

Cette règle **amende D-439**, qui prescrivait l'insertion après l'origine.

### N05 — Première progression

Lorsqu'un geste est sans groupe, l'ajout d'une première variante crée un groupe de deux gestes.

| Choix | Geste d'origine | Nouveau geste |
|---|---|---|
| Plus facile que X | Niveau 2 | Niveau 1 |
| Plus difficile que X | Niveau 1 | Niveau 2 |

Les exercices déjà associés au geste d'origine affichent son rang nouvellement calculé.

### N06 — Groupe réduit à un membre

Si un seul geste reste dans un groupe, il revient à l'état vide de N01, sans rang ni total.

L'identifiant technique du groupe peut être conservé ; cette conservation n'impose aucune présentation.

### N07 — Identité et performances

Chaque geste conserve une identité indépendante de son rang.

Les performances sont regroupées par geste, sous réserve des conditions de comparabilité. Un groupe de niveaux ne fusionne jamais les performances de ses membres.

Réordonner les niveaux ne modifie ni les relevés ni leur rattachement au geste exécuté.

### N08 — Variante sans différence décrite

À l'enregistrement d'une variante dont **le nom, les alias, la description, le média et la structure des phases sont tous identiques** à ceux de son origine, l'écran signale qu'aucune différence n'a été décrite :

> Aucune différence n'a été décrite entre ce geste et X. Si la seule différence est dans les durées, les charges ou les répétitions, ce n'est pas un niveau, c'est un autre jeu de paramètres sur le même geste.

**Trois actions, et la règle n'est pas bloquante :**

- **Modifier le geste**, qui revient au brouillon de contenu ;
- **Garder le même geste**, qui bascule la variante en second exercice sur le geste d'origine ;
- **Créer quand même la variante**, qui poursuit la création telle quelle.

**Ce que la règle constate et ce qu'elle ne constate pas.** Elle constate l'absence de différence *décrite* dans les champs comparés. Elle ne certifie pas que les deux gestes sont réellement le même, l'utilisateur pouvant avoir une raison que les champs ne portent pas. Elle ne garantit pas davantage que les gestes d'un groupe soient visuellement distincts dans une liste : une différence peut se trouver dans les phases, ou dans une partie tronquée de la description.

---

## 3. La recherche d'un geste

Cette section est nouvelle. Son absence est le manque qui laisse le champ libre au comportement observé en développement : le bouton de recherche ouvre une liste **non filtrée**, sans rapport avec le nom saisi.

### R01 — État de la règle actuelle

La règle en vigueur, MFN-06, dit : « Une suggestion **peut** être proposée sur la base d'un **nom proche** […] Une recherche explicite reste accessible **indépendamment de la similarité du nom**. »

Trois constats, vérifiables par lecture :

- « nom proche » n'est défini nulle part : aucune normalisation, aucun algorithme, aucun seuil, donc rien à implémenter ni à recetter ;
- « peut être proposée » est permissif : ne rien proposer respecte la règle ;
- « indépendamment de la similarité du nom » voulait dire que l'accès reste ouvert même sans suggestion ; la phrase se lit aussi comme disant que la recherche ne dépend pas du nom.

**La règle actuelle autorise donc le comportement observé.** Déterminer ce qui l'a effectivement produit relève de l'analyse technique et n'est pas affirmé ici. Ce qui suit remplace la règle.

### R02 — Définition de la proximité de nom

#### Normalisation

Espaces réduits, casse ignorée, diacritiques retirés par décomposition NFD, ponctuation et traits d'union traités comme des séparateurs. Une fonction de ce type existe déjà dans le domaine, utilisée pour l'unicité des catégories ; sa réutilisation relève de l'analyse technique.

#### Tokens

Découpage sur les séparateurs, puis :

- **retrait des mots fonctionnels** : de, du, des, la, le, les, l, sur, sous, en, avec, à, au, aux, un, une, et, pour, par ;
- **rognage de pluriel prudent** : la finale `s` ou `x` n'est retirée que si le radical restant compte **au moins 4 caractères**. « pompes » donne « pompe », « genoux » donne « genou », mais « dos » et « bras » restent intacts. La finale `es` suit la même règle.

« Pompes sur les genoux » et « Pompes genoux » produisent le même ensemble `{pompe, genou}`.

#### Recouvrement de tokens

Coefficient de Dice sur les deux ensembles :

```
Dice(A,B) = 2 × correspondances / (|A| + |B|)
```

Une correspondance vaut **1** si les deux tokens sont identiques après normalisation, **0,5** s'ils sont rapprochés par distance d'édition selon la règle ci dessous. Chaque token ne peut servir qu'à une correspondance, la meilleure.

#### Distance d'édition entre tokens

Appliquée uniquement aux tokens restés sans correspondance exacte, sous **trois conditions cumulatives** :

1. les deux tokens commencent par la même lettre ;
2. leur différence de longueur est au plus de 2 ;
3. la distance est au plus de 1 pour des tokens de 5 caractères ou moins, 2 au delà.

La première condition est celle qui tranche le cas limite : **« fente » et « pente » sont à une distance de 1 et la seule règle de distance ne les sépare pas.** Elles diffèrent par leur initiale et sont donc écartées, tandis que « burpes » et « burpees » ou « squatt » et « squat » sont conservés. Les fautes de frappe portent rarement sur la première lettre.

Un rapprochement de ce type vaut une demi correspondance et ne peut donc jamais, à lui seul, porter une paire au dessus du seuil haut.

#### Trigrammes

**Construits token par token, jamais sur la chaîne entière.** Chaque token est encadré de deux caractères de garde, découpé en séquences de trois caractères, et les ensembles de tous les tokens sont réunis. C'est cette construction par token qui rend la mesure indépendante de l'ordre des mots : des trigrammes calculés sur la chaîne complète inclueraient les frontières entre mots et dépendraient de leur ordre.

Comparaison par coefficient de Dice sur les deux ensembles réunis.

#### Score de nom

```
score = 0,55 × Dice(tokens) + 0,35 × Dice(trigrammes) + 0,10 × préfixe
```

Le terme de préfixe vaut 1 si l'une des deux chaînes normalisées est préfixe de l'autre, 0 sinon.

#### Seuils, bornes non chevauchantes

| Score | Comportement |
|---|---|
| `score ≥ 0,75` | Suggestion présentée d'elle même |
| `0,45 ≤ score < 0,75` | Résultat listé, sans suggestion spontanée |
| `score < 0,45` | Non présenté |

Ces coefficients et ces seuils sont un **point de départ**, ajustés pendant le développement contre le jeu de cas de référence de R07. Aucun apprentissage, aucun réglage utilisateur, aucune calibration récurrente n'est prévu.

#### Signaux Catégorie et Zones corporelles

Lorsque ces champs sont renseignés dans le brouillon, ils **enrichissent le classement pendant la saisie** :

- `+ 0,10` si la catégorie est partagée ;
- `+ 0,10` si au moins une zone corporelle est partagée.

Ces bonus **ne peuvent pas faire franchir le seuil haut à eux seuls** : un candidat dont le score de nom est inférieur à 0,65 reste en dessous de 0,75 quels que soient les bonus. Ils réordonnent, ils ne promeuvent pas.

**Aucune vérification supplémentaire n'est déclenchée à la sauvegarde.** Ces signaux agissent uniquement sur le classement pendant la saisie, et jamais après un choix explicite de geste indépendant.

#### Ce que la recherche ne fait pas

Elle **propose des rapprochements et ne conclut jamais à l'identité** de deux gestes. Aucun rattachement, aucune fusion, aucune présélection n'en découle. Les différences de formulation restent visibles dans les résultats : les noms sont affichés tels qu'ils ont été saisis, jamais sous leur forme normalisée.

#### Mise en œuvre

Clé canonique, ensemble de tokens et ensemble de trigrammes sont calculés **à l'écriture**, au moment de l'enregistrement du geste, et conservés à côté de son nom. La recherche devient alors un parcours en mémoire sur l'ensemble des gestes disponibles, sans index à maintenir.

Les trois couches sont des fonctions pures, testables unitairement. Le coût réel du parcours, le choix d'un éventuel index et les volumes à partir desquels la question se pose relèvent de l'analyse technique.

### R03 — Déclenchement et comportement

**La saisie du nom déclenche la recherche.** Ce n'est pas une faculté : au dessus du seuil haut, la suggestion est présentée.

L'entrée de recherche explicite reste accessible même lorsqu'aucun geste n'atteint les seuils.

Le comportement de l'écran de recherche tient en trois cas :

| Situation | Comportement |
|---|---|
| Requête renseignée, résultats | Les résultats correspondants, classés par pertinence décroissante |
| Requête renseignée, aucun résultat | L'absence de résultat est annoncée, avec une action **Voir tous les gestes** |
| Requête vide | Tous les gestes, selon l'ordre de parcours du Catalogue |

L'écran s'ouvre avec le nom saisi comme requête, préremplie et effaçable. **Il n'existe pas de liste filtrée coexistant avec une zone « tous les gestes »** : une seule liste, dont le contenu dépend de la requête.

### R04 — Contenu d'un résultat

L'écran `9959:19623`, « Création exercice — Geste — Recherche d'un geste », porte déjà le bon modèle de ligne : un gabarit photo de 48 × 48, le nom du geste, puis une ligne de contexte adaptée à l'origine du résultat :

- **« Niveau 2 sur 3 · 2 exercices »** pour un geste classé ;
- **« 1 exercice »** pour un geste sans groupe ;
- **« Créé dans une séance · 1 exercice »** pour un geste local.

Deux ajouts : les **zones corporelles**, meilleur discriminant après la photo entre deux homonymes, et la **première ligne de la description**, tronquée.

Cette ligne de contexte règle au passage un écart consigné le 23 octobre : la suggestion annonce « déjà dans votre catalogue », ce qui est faux pour un geste créé dans une séance. Le mécanisme correct existe sur l'écran de recherche, il doit être employé aussi sur la suggestion.

### R05 — Alias

Les **alias sont des noms alternatifs facultatifs du geste**, saisis et modifiables avec ses autres champs de contenu. Ils répondent à ce qu'aucun algorithme de chaînes ne peut faire : rapprocher « pompes » de « push-up », « fentes » de « lunges », « gainage » de « planche ».

Règles :

- le nom principal et les alias **participent tous à la recherche** ;
- **un geste n'apparaît qu'une fois** dans les résultats, classé selon sa meilleure correspondance, quel que soit le nom qui l'a fait remonter ;
- **deux gestes distincts peuvent partager un alias** sans que cela crée le moindre rattachement entre eux ;
- les alias appartiennent au geste. **Ce ne sont pas des noms propres aux exercices** qui l'utilisent.

Un alias est modifiable comme le reste du contenu du geste, et relève donc des mêmes règles de correction partagée.

### R06 — Portée de la recherche dans le produit

D-221 et RM-221 excluent aujourd'hui toute recherche globale ou locale des Catalogues. Cette exclusion est **retirée**.

Elle n'a jamais défini ce qu'elle excluait : elle nommait des écrans archivés, pas un concept. Et elle obligeait toute recherche légitime à se déclarer en dérogation, ce qu'a dû faire D-439 pour la recherche de geste.

Énoncé de remplacement, qui décrit ce qui existe sans rien verrouiller :

> Les listes de Catalogue se réduisent par leurs filtres et leur tri. Deux rapprochements textuels existent : le nom d'un geste à la création, défini par R02 à R05, et le sélecteur d'insertion d'exercices dans une séance, avec ses filtres Catégorie et Zones corporelles. Un champ de recherche dans les listes de Catalogue n'est pas réalisé à ce stade.

### R07 — Jeu de cas de référence

Les coefficients et les seuils de R02 étant un point de départ, c'est un **jeu de cas automatisés** qui tient lieu de définition opérationnelle du comportement attendu, et qui conditionne toute évolution de la formule.

**Couverture.** Huit familles : correspondances exactes ; accents et casse ; pluriels, y compris les mots courts que le rognage doit épargner ; fautes de frappe ; noms partiels ; ordre des mots ; alias ; et **différences significatives**, c'est à dire des paires qui ne doivent pas se rapprocher.

**Ce qui est vérifié**, pour chaque requête :

- les résultats attendus sont présents ;
- leur classement, lorsqu'il est pertinent ;
- **l'absence de doublon par geste**, un geste n'apparaissant qu'une fois quel que soit le nom ou l'alias qui l'a fait remonter ;
- le déclenchement ou non de la suggestion, selon les seuils.

**Ce qui n'est pas vérifié.** Les tests portent sur le comportement attendu, **jamais sur la reproduction de la formule**. Un test qui recalculerait un score pour le comparer à une valeur attendue n'apporterait rien et interdirait toute évolution du calcul.

**Discipline.** Toute modification des coefficients, des seuils ou de l'algorithme relance le jeu complet. Chaque défaut réel corrigé y ajoute son cas, pour prévenir sa réapparition.

**Responsabilité.** Les coefficients sont ajustés par le développeur sur la base de ces résultats. La vérification est automatique et ne requiert aucun arbitrage produit.

**Cas minimaux**, à compléter mais pas à réduire. Les trois derniers viennent de défauts réellement rencontrés pendant la conception.

| Famille | Requête | Attendu |
|---|---|---|
| Correspondance exacte | `Squat` | `Squat` en tête |
| Accents et casse | `ETIREMENTS` | `Étirements` au dessus du seuil haut |
| Pluriel | `Pompe` | `Pompes` au dessus du seuil haut |
| Pluriel, mot court épargné | `Dos` | `Dos` rapproché, le radical n'étant pas rogné |
| Faute de frappe | `squatt` | `Squat` rapproché |
| Nom partiel | `Pompes genoux` | `Pompes sur les genoux` au dessus du seuil haut |
| Ordre des mots | `genoux pompes` | Même score que `Pompes genoux` |
| Alias | `push-up` | `Pompes` rapproché, et une seule fois |
| Différence significative | `Fente` | `Pente` non rapproché, initiales différentes |
| Différence significative | `Fentes avant` | `Fentes arrière` jamais suggéré comme le même geste |

---

## 4. Parcours — Créer un exercice

1. L'utilisateur ouvre la création et saisit le nom.
2. La saisie déclenche la recherche selon R02 et R03.
3. Les résultats comprennent les gestes du Catalogue et ceux créés localement dans une séance.
4. Aucune sélection ni attribution automatique.
5. L'utilisateur peut utiliser un geste existant, créer une variante à partir d'un résultat, ou poursuivre sans sélectionner pour créer un geste indépendant.
6. La recherche explicite reste accessible si les suggestions ne conviennent pas.

Une sélection n'écrase jamais silencieusement des informations déjà saisies.

### Utiliser un geste existant

Le contenu du geste est repris en lecture seule, l'utilisateur définit les paramètres du nouvel exercice. Écran de référence `9891:39982`.

Le niveau affiché est celui du geste repris. Le crayon « Modifier le geste » (`icon/modifier`, `9925:41240`) ouvre la modification de son contenu dans le brouillon, selon les règles de correction partagée.

### Créer une variante

**Possible dès les résultats de recherche**, sans avoir à adopter le geste d'abord.

Ce choix ouvre le même parcours que « Ajouter un niveau » : choix plus facile ou plus difficile, adaptation du contenu, paramètres, enregistrement.

La décision d'identité étant explicite, **la sauvegarde ne repose aucune question de correction de l'original**. Cela corrige l'écart consigné le 23 octobre : « le câblage actuel variante → confirmation est non conforme ».

N08 s'applique si aucune différence n'a été décrite, sans bloquer.

### Créer un geste indépendant

Le geste est créé sans groupe, commande de niveau à l'état vide. La ressemblance du nom avec un geste existant ne provoque jamais de rattachement implicite, et **aucune vérification supplémentaire n'est posée à la sauvegarde** après ce choix explicite.

---

## 5. Parcours — Consulter et modifier un exercice du Catalogue

**L'ouverture depuis le Catalogue reste directement en édition**, conformément à D-437 et D-438.

Deux portées distinctes, sur le même écran :

- **les paramètres de l'exercice et ses référentiels** se modifient directement sur l'écran, sans commande préalable ;
- **le contenu du geste**, partagé avec les autres exercices qui l'utilisent, s'ouvre par le crayon « Modifier le geste » placé en haut à droite de la zone de contexte (`icon/modifier`, `9925:41240`). C'est la seule commande d'édition de l'écran, et elle ne concerne que le geste.

La proposition d'une consultation préalable suivie d'un crayon est écartée : elle ajoute un geste à l'action fréquente pour servir la rare, et elle ferait cohabiter deux crayons de portées différentes sur le même écran.

### Modifier l'exercice

- Modifier ses paramètres ne change pas son niveau.
- Corriger le contenu du même geste conserve son identité et sa position.
- Une correction partagée concerne les définitions Catalogue utilisant ce geste ; son étendue est annoncée, avec le nombre réel d'exercices concernés.
- Si la modification correspond à un geste distinct, une nouvelle identité est créée et son rattachement éventuel est explicite.

Le dialogue d'identité reste conditionnel : geste déjà utilisé **et** modification du nom, des alias, de la description, du média ou de la structure des phases. Il n'est pas déclenché pour les seuls paramètres ni pour un reclassement.

### Ajouter un niveau

1. Toucher la commande de niveau.
2. Choisir « Ajouter un niveau ».
3. Indiquer **plus facile** ou **plus difficile** que le geste courant.
4. Adapter le contenu repris et définir les paramètres.
5. Enregistrer le nouveau geste et son exercice.

Le geste d'origine et ses paramètres sont conservés. Les rangs affichés sont recalculés.

### Changer de niveau dans le Catalogue

La commande permet de naviguer vers un autre geste du groupe. Popover `9577:19843`, actions « Changer de niveau » et « Ajouter un niveau ».

Si plusieurs exercices utilisent le geste choisi, leurs résumés de paramètres permettent de désigner celui à consulter. Aucun jeu de paramètres n'est choisi silencieusement.

Cette navigation ne transforme pas l'exercice d'origine.

---

## 6. L'écran Niveaux

Écran de réordonnancement de la progression, liste à poignées.

**La liste est présentée par rang croissant, donc par difficulté croissante.** L'ordre étant déjà porté par les rangs affichés, aucune ligne d'orientation n'est nécessaire.

**Le nom seul ne suffit pas**, et c'est structurel : rien n'oblige deux niveaux à porter des noms différents. Une liste de deux « Adducteurs » est inutilisable.

Chaque ligne porte donc :

- la poignée de déplacement et le rang ;
- **la vignette du média**, 36 × 36, à gauche du nom ;
- le nom du geste ;
- **un extrait de la description**, en seconde ligne, tronqué ;
- le nombre d'exercices qui utilisent ce geste, à droite.

L'écran compte peu de lignes, ce qui autorise ce niveau de contenu.

**Cas de deux lignes restant indiscernables**, ni média ni description : l'écran le signale et invite à ajouter une description ou un média. N08 attire l'attention sur ce cas à la création sans l'empêcher, et des gestes dans cette situation existent déjà en base.

Le réordonnancement manuel exprime le classement choisi par l'utilisateur. L'application l'enregistre sans le juger.

---

## 7. Parcours — Ajouter des exercices dans une séance

Le sélecteur présente les exercices du Catalogue disponibles, avec leur geste, leur niveau éventuel et leur résumé de paramètres.

Il comporte une **recherche textuelle** et des **filtres Catégorie et Zones corporelles**.

Les sélections sont conservées lorsque la recherche ou les filtres changent. Un compteur indique le nombre total d'exercices sélectionnés, y compris ceux momentanément masqués.

**Ordre d'insertion.** D-165 prescrit l'ordre courant de la liste filtrée, ce qui perd son sens lorsque les sélections proviennent de plusieurs requêtes successives. L'insertion suit **le critère de tri courant du Catalogue des exercices**, appliqué à l'ensemble des exercices sélectionnés. **Départage stable des égalités** : à valeur de tri identique, par date de création croissante, puis par identifiant croissant. Le résultat ne dépend ni de l'ordre des touchers ni de celui des requêtes.

L'insertion crée des copies indépendantes. Le contenu du geste est verrouillé, les paramètres autorisés restent modifiables.

La recherche d'exercices à insérer et la recherche de gestes pendant une création ont des finalités distinctes : la seconde peut proposer un geste local sans le publier au Catalogue.

---

## 8. Parcours — Changer le niveau d'un exercice dans une séance

1. L'utilisateur ouvre la copie d'un exercice.
2. Il touche sa commande de niveau.
3. Il sélectionne un autre geste de la même progression.
4. Le système prépare le remplacement en reprenant les paramètres.
5. S'il reste des valeurs qui ne peuvent pas être reprises sans hypothèse, l'utilisateur complète celles là seulement.
6. La validation applique le remplacement ; l'annulation conserve intégralement l'exercice précédent.

Le contenu du nouveau geste reste verrouillé.

### Conservation des paramètres

**Le changement conserve les paramètres et n'introduit aucun verrou supplémentaire.** Les contraintes existantes du moteur et du format continuent de s'appliquer, inchangées.

**Ce qui ne dépend pas du geste est repris tel quel :** mode d'exécution, nombre de séries, cibles, pauses, charge, changement de côté, récupération, position dans la séance ou le circuit.

**Les phases se reprennent par correspondance ordonnée**, rang par rang : la première phase du nouveau geste reçoit la durée de la première phase de l'ancien, et ainsi de suite. **L'égalité d'identifiants de phases ne constitue jamais une correspondance**, deux gestes différents pouvant porter les mêmes.

Quatre cas, et seul le deuxième et la fin du quatrième demandent quelque chose à l'utilisateur :

| Départ | Arrivée | Traitement |
|---|---|---|
| Sans phases | Sans phases | La durée de série est reprise. Rien à compléter |
| Sans phases | Avec phases | Les durées des phases sont vides. Les répartir depuis une durée unique supposerait une hypothèse, donc elles sont demandées |
| Avec phases | Sans phases | La durée de série vaut la somme des durées de phases. C'est un calcul exact, rien n'est demandé |
| Avec phases | Autre structure | Les rangs communs reçoivent les durées correspondantes. Les phases en surplus dans le nouveau geste restent vides et sont demandées. Les durées en surplus de l'ancien sont abandonnées |

La position dans la séance et la récupération contextuelle sont préservées. **Les exécutions passées restent inchangées.**

### Filiation

Le changement de niveau est un changement de geste. Pour respecter la filiation immuable, il crée une nouvelle occurrence remplaçant l'ancienne dans le brouillon, portant l'identité du geste choisi.

Les exécutions déjà enregistrées restent attachées au geste réellement exécuté. Aucun exercice Catalogue n'est créé automatiquement par ce remplacement.

---

## 9. L'affichage du niveau

### Sur la fiche d'un exercice

Composant `Zone bleue — Nom et média` (`9029:18368`), rangée Catégorie / Zones / Niveau. La commande affiche « Niveau X » ; le choix du niveau affiche aussi le total. **État vide selon N01 : le mot « Niveau ».**

### Sur les lignes disposant d'une ligne de contexte

Recherche d'un geste, sélecteur d'insertion, écran Niveaux : **le texte complet, « Niveau 2 sur 3 »**, comme l'écran `9959:19623` le fait déjà. **Rien si le geste n'a pas de groupe.**

### Sur les cartes

Catalogue et Composition. **La jauge `icon/niveau` (`9932:44044`) suivie de `2/3`**, soit une trentaine de points. La jauge seule ne suffit pas : le relevé du 23 octobre impose que le rang soit annoncé en texte, ce que porte le libellé accessible, qui énonce « Niveau 2 sur 3 ».

**Le niveau ne se place pas dans la rangée du résumé des paramètres.** Cette rangée mesure environ 79 points, que `10 rép. / 1 min` remplit déjà à elle seule. Y ajouter une trentaine de points tronquerait la prescription, qui est l'information la plus utile de la carte. Le niveau qualifie le geste, pas l'exécution : **il se range avec le nom**, dont il est l'attribut, et ne dispute donc la place à rien.

Le placement exact relève du recensement des écrans à cartes.

**Rien si le geste n'a pas de groupe.**

Deux cartes portant le même nom ne se distinguent que par leur niveau. C'est la raison pour laquelle il doit figurer sur la carte et non seulement sur la fiche.

---

## 10. L'historique et la classification

**L'historique ne stocke aucun rang de niveau.** Il conserve ce qui a été exécuté : le contenu copié, les paramètres, les relevés, et la filiation vers le geste.

**La classification actuelle reste exploitable dans l'historique.** Lorsqu'une présentation ou une analyse a besoin du niveau, elle le résout à la lecture en suivant la filiation vers le geste et son groupe. Cette résolution ne modifie jamais l'instantané enregistré. C'est elle qui permettra à un graphe de progression d'ordonner les exécutions par rang, sans qu'aucun rang n'ait été figé à l'enregistrement.

Si un geste a été retiré de son groupe, il n'a simplement plus de niveau. Ce n'est pas une source indisponible, et le contenu comme les relevés restent intacts.

**L'affichage du niveau sur chaque ligne de l'historique est une question de présentation**, tranchée séparément et sans conséquence sur le modèle. Sur l'écran « Suivi — Séances — Vue déployée » (`1992:8996`), où une séance se lit tour par tour en lignes compactes du type « ✓ Squat assisté — Terminée », le rang n'est pas affiché : la ligne est déjà dense, et un rang qui change après coup y serait plus déroutant qu'utile sans la mention qui l'explique. Cette décision porte sur cette vue, pas sur l'exploitation de la classification.

---

## 11. Conséquences sur la documentation existante

| Règle actuelle | Modification |
|---|---|
| MFN-06 : « suggestion **peut** être proposée sur nom proche », proximité non définie | Recherche déclenchée par la saisie ; proximité définie par R02 ; seuils explicites et non chevauchants |
| MFN-06 : recherche accessible « indépendamment de la similarité du nom » | Remplacée par R03 : accès maintenu, liste unique dont le contenu dépend de la requête |
| D-221 et RM-221 : aucune recherche globale ni locale dans les Catalogues | **Retirées.** Remplacées par l'énoncé positif de R06 |
| RM-013 : « Supersédée par D-221. Aucune recherche globale ni locale de Catalogue n'est incluse dans le MVP » | **Retirée** avec D-221, dont elle n'était que le renvoi |
| D-439 : insertion du nouveau niveau après l'origine | Amendée : choix plus facile / plus difficile, insertion avant ou après |
| D-439 : la recherche de geste ne généralise pas la recherche exclue par D-221 | Sans objet, l'exclusion étant retirée |
| D-165 : insertion selon l'ordre de la liste filtrée | Précisée : critère de tri courant du Catalogue, départage stable |
| Câblage variante → confirmation | Non conforme, confirmé : une variante explicite s'enregistre directement |
| Sélecteur d'exercices sans recherche ni filtres | Recherche et filtres Catégorie et Zones, sélections conservées, compteur |
| Remplacement de geste sans parcours détaillé | Parcours du § 8, avec les quatre cas de phases |
| Filiation réservée aux statistiques | Également utilisée pour résoudre la classification actuelle |
| Aucun alias de geste | Alias facultatifs, participant à la recherche (R05) |

**Non retenues** par rapport à la proposition initiale : le libellé « Niveau : Aucun », remplacé par l'état vide existant ; l'affichage du rang sur les lignes compactes du Suivi ; l'état « classification indisponible », qui confondait retrait de groupe et suppression de source ; l'ouverture du Catalogue en consultation suivie d'un crayon.

---

## 12. À vérifier en analyse technique

Les points suivants sont des hypothèses de conception, pas des faits établis par cette spécification :

- la réutilisation d'une fonction de normalisation existante plutôt qu'une nouvelle ;
- le coût réel du parcours en mémoire, les volumes à partir desquels un index devient utile, et le choix de ce mécanisme ;
- les coefficients et les seuils de R02, ajustés par le développeur contre le jeu de cas de R07.

## 13. Points restant ouverts

**La représentation des rangs supérieurs dans Figma.** Le nombre de niveaux étant sans limite, `icon/niveau` doit couvrir plus de trois rangs. La jauge reste lisible jusqu'à cinq tranches environ ; au delà, c'est la forme texte, `3/8`, qui porte l'information. Travail de symboles différé, sans incidence sur les règles.

**Le recensement des écrans à cartes** devant porter le niveau, et le placement exact de la jauge auprès du nom sur chacun d'eux.

**Défaut de composant, antérieur à ces travaux :** les deux variantes `Rôle=Zone` du `Sélecteur classification` affichent « Catégorie » au lieu de « Zones », dans l'état vide comme dans l'état renseigné.

