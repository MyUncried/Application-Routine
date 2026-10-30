# KODJO — Niveaux, recherche et mouvement partagé — v7

> **C08 — actualisation du 28/10/2026.** La [composition des familles depuis le catalogue](DSF-FAMILLES-CATALOGUE-MOUVEMENTS-2026-10-28.md), règles A à E et CE-MVT-03, est désormais définie : rattacher, détacher et dissoudre une famille par geste. Les mentions antérieures « C08 différé » restent historiques pour ces opérations ; elles ne sont plus une restriction active. La suppression définitive d'un mouvement reste distincte et n'est pas clôturée par ce lot.

> **Référence ciblée — parcours Mouvement, 27/10/2026.** [Création et modification des mouvements](DSF-MOUVEMENTS-CREATION-EDITION-2026-10-27.md) remplace, sur ce périmètre seulement, les anciens écrans de création d’exercice : nouveau gabarit, structure des phases sans durées, modification et variante depuis le catalogue des mouvements. Le crayon et la création de variante depuis une séance ne sont plus des parcours cibles. Les règles de recherche R01–R08 et de sauvegarde C03 restent applicables. Les autres lots de la simplification ne sont pas déclarés documentés ou livrés par cette mise à jour.

Date : 25 octobre 2026. Statut : décisions C01–C07 et C09 validées par Hermann ; C08 a été complété le 28/10 pour la composition des familles depuis le catalogue (renvoi en tête). D-445.

Cette version remplace la v6 dans les points ci-dessous. Les sources v6 et le relevé Figma initial restent des preuves historiques, pas des instructions concurrentes. Les décisions sont intégrées aux chapitres 01 à 13 et aux contrats. Ce document ne prétend pas que le code ni les maquettes ont déjà été alignés.

## 1. Décisions et vocabulaire

KODJO est généraliste, fitness first. Mouvement, exercice, niveau et paramètres d’exécution sont les termes de l’interface et du modèle. La structure Séance → Cycle technique → Circuit → Exercice est inchangée.

| ID | Décision validée | Statut |
|---|---|---|
| C01 | Nom de mouvement unique après normalisation espaces/casse/accents ; alias partagés possibles | Clos |
| C02 | Variante : description et médias vierges ; catégorie et zones reprises ; nom commencé conservé avec invite grise (compléter le nom), non persistée et effacée à la reprise de saisie | Clos |
| C03 | Nom modifié : dialogue toujours ; nom inchangé et contenu modifié : confirmation si autre exercice ou exécution enregistrée ; sinon silencieux | Clos |
| C04 | Cible du 27/10 : modification depuis la fiche au catalogue des mouvements ; lecture seule depuis une séance (CE-MVT-01) | Ancienne portée remplacée |
| C05 | Contenu courant lu directement depuis le mouvement ; paramètres locaux ; instantanés et exécution en cours figés ; phases manquantes signalées avant lancement | Clos |
| C06 | Pastille Niveau N, état vide Niveau ; sans pastille, suffixe - Nn calculé près du nom, jamais stocké | Clos |
| C07 | Catalogue d’entretien des mouvements compatible avec recherche/sélection dans le parcours de création | Clos — aucune contradiction |
| C08 | Composition des familles depuis le catalogue : règles A à E du 28/10 et CE-MVT-03 ; suppression du mouvement distincte | Clos pour rattacher/détacher/dissoudre la famille ; cycle de vie du mouvement non clôturé |
| C09 | Commande Niveau active hors crayon ; sélectionner un autre niveau ne reclasse pas le mouvement courant | Clos |

## 2. Modèle et cycle de vie

Une `ActivityDefinition` référence directement un mouvement et porte ses paramètres propres. Une `SessionActivity` possède son identifiant et référence **directement le mouvement**, sans dépendance de contenu envers l’exercice Catalogue ; elle porte une copie locale complète des paramètres au moment de l’insertion, puis les conserve indépendamment. Elle ne conserve pas une copie modifiable du nom, de la description, des médias, de la catégorie, des zones ni de la structure des phases.

Les corrections du contenu partagé sont visibles à la prochaine lecture des définitions et des séances ; aucun mécanisme de propagation de copies de contenu n’est nécessaire. Modifier les paramètres Catalogue ne modifie pas ceux des séances. Supprimer ou archiver la définition Catalogue ne casse pas les occurrences.

Au démarrage, résoudre le contenu courant avec les paramètres de l’exercice puis construire un instantané autonome. Cet instantané, l’exécution déjà démarrée et les historiques ne changent plus avec le mouvement. Leur `sourceMovementId` conserve l’identité exécutée, sans rang stocké ; la classification actuelle peut être résolue séparément à la lecture.

Les relations actives vers le mouvement doivent rester intègres, depuis les définitions **et les occurrences de séance**. L’absence de contrainte référentielle et la tolérance d’orphelins concernent la filiation des instantanés, pas le contenu vivant. La suppression explicite d’un mouvement encore référencé par un exercice est interdite ; son parcours reste dans C08. La suppression du dernier exercice ne supprime jamais le mouvement : un mouvement peut exister sans exercice et reste recherchable.

### Création et unicité

Nom principal unique par clé canonique (espaces normalisés, casse ignorée, accents retirés). Erreur visible pendant la saisie et garantie à l’enregistrement, y compris en cas d’écriture concurrente ; aucune fusion implicite. Les alias restent facultatifs et peuvent être partagés ; un résultat unique par mouvement, retenu sur sa meilleure correspondance. L’unicité de nom et la similarité de recherche sont deux mécanismes distincts.

Un mouvement indépendant commence sans groupe. La variante crée un mouvement distinct et son exercice ; choisir Plus facile / Plus difficile pour l’insérer avant / après l’origine. Description et médias vierges ; catégorie et zones reprises et ajustables selon les règles de classification existantes. Conserver le nom commencé et afficher l’aide grise « (compléter le nom) » ; cette aide disparaît à la reprise de saisie sans effacer le nom, n’est jamais persistée et ne satisfait pas l’unicité. La recherche de similarité est désactivée après le choix explicite de variante ; le contrôle d’unicité reste actif à la sauvegarde.

L’ancien avertissement N08 permettant une variante homonyme ne peut plus contourner l’unicité. Deux noms différents peuvent néanmoins désigner deux créations indépendantes ; aucune fusion rétroactive de leurs records n’est prévue.

## 3. Dialogue unique de sauvegarde

Les paramètres restent directement modifiables. Le crayon ouvre un brouillon du **mouvement partagé** depuis sa fiche au catalogue des mouvements (cible du 27/10, CE-MVT-01). Une reprise depuis une séance reste en lecture seule. Nom, alias, description, médias, catégorie, zones et structure des phases sont du contenu ; la commande Niveau reste active indépendamment du crayon.

À l’enregistrement d’une modification d’un mouvement existant :

| Condition | Dialogue / résultat |
|---|---|
| Nom modifié, avec ou sans autre exercice et avec ou sans historique | Toujours : Mettre à jour ce mouvement / Créer un nouveau mouvement / Annuler ; choix explicite, sans présélection |
| Nom inchangé, contenu modifié, au moins un autre exercice lié ou une exécution enregistrée | Confirmation de mise à jour uniquement : Annuler / Confirmer |
| Nom inchangé, contenu modifié, ni autre exercice lié ni exécution enregistrée | Sauvegarde silencieuse du même mouvement |
| Aucun changement de contenu ; paramètres seuls ; reclassement seul | Aucun dialogue de mouvement |

Le changement de nom est une modification du nom effectivement enregistré ; une variation de casse ou d’accent peut donc être une correction à confirmer, même si la clé d’unicité reste identique. Le contrôle d’unicité exclut l’identité en cours d’édition ; une création distincte doit disposer d’une clé différente des mouvements existants.

« Autre exercice » couvre les définitions Catalogue et les occurrences persistées de séance utilisant le mouvement, hors objet édité ; les lignes sont comptées une fois, sans multiplication par les séries, tours ou planifications. Les occurrences historisées sont traitées par la condition d’existence d’une exécution, pas ajoutées au compteur d’exercices. L’existence se recherche par identité de mouvement, pour SESSION comme ACTIVITY, et non par nom. Une séance simplement enregistrée n’est pas une exécution passée. Aucun indicateur d’utilisation irréversible déclenché par insertion n’est requis.

Le dialogue indique la portée réelle et le nombre d’autres exercices concernés ; zéro autre exercice ne masque pas l’enjeu historique. Un renommage corrigé conserve l’identité : les anciens et nouveaux noms peuvent légitimement partager leurs performances. Créer un nouveau mouvement conserve l’original et rattache l’exercice édité à la nouvelle identité. Depuis une séance, ce choix remplace l’occurrence par une nouvelle occurrence dans le brouillon ; les exécutions antérieures gardent leur filiation. Le rattachement éventuel à un groupe reste explicite. [arbitrage de Hermann du 26/10/2026 (Q10) : aucun rattachement automatique au groupe après « Créer un nouveau mouvement » ; rattachement ultérieur par C08, différé]

Annuler conserve le brouillon et ne persiste rien. Confirmer reste visible mais indisponible avant sélection lorsqu’un choix est requis. Une variante explicitement choisie et un mouvement neuf sont des créations : pas de seconde question sur la correction de l’origine. Aucun bouton additionnel de création distincte dans l’édition n’est ajouté ; la recommandation antérieure de ce second mécanisme est retirée. L’application ne déduit pas la différence sémantique entre correction et nouveau mouvement.

## 4. Phases et paramètres

La structure des phases appartient au mouvement ; les valeurs restent propres à chaque définition et occurrence. Dans une **correction du même mouvement**, conserver les valeurs des phases conservées par `WorkPhase.id` stable ; ne pas réutiliser un identifiant supprimé. Une nouvelle phase n’hérite d’aucune durée inventée. Les exercices concernés peuvent rester explicitement incomplets après la correction partagée ; les signaler et demander la complétion avant leur prochain lancement. L’exercice directement édité reste soumis à sa validation normale. Ne pas imposer la complétion immédiate de tous les autres exercices.

Dans un **changement de mouvement/niveau**, transférer par rang, jamais par égalité d’identifiants entre mouvements : sans→sans, durée reprise ; sans→phases, durées vides ; phases→sans, cible de série conservée (jamais remplacée par la somme) ; phases→phases, rangs communs repris, surplus source abandonné, surplus cible à compléter. Mode, séries, cibles, pauses, charge, côtés, récupération et position sont conservés sous les contraintes existantes. Annuler restitue intégralement l’occurrence précédente.

La lecture partagée supprime la synchronisation du contenu, pas la vérification de compatibilité des paramètres. Le moteur ne lance pas un exercice incomplet et ne relit aucun mouvement après création de l’instantané.

## 5. Niveaux, affichage et catalogues

Un mouvement appartient au maximum à un groupe linéaire. Rang et total dérivés, aucun plafond métier. Première variante plus facile : origine 2 / variante 1 ; plus difficile : origine 1 / variante 2. Un groupe singleton revient à l’état vide. Les performances restent séparées par mouvement ; les conditions de comparabilité ne sont pas dans l’identifiant.

La commande Niveau reste active hors crayon. Changer choisit une autre variante, Ajouter crée un niveau, Réordonner change le classement. Catalogue : naviguer vers le mouvement choisi et choisir explicitement un exercice si plusieurs jeux de paramètres existent. Séance : préparer le remplacement, conserver les paramètres compatibles, puis valider ou annuler. La sélection d’un niveau ne modifie pas le rang de l’origine.

Affichage conforme au relevé : pastille « Niveau N », commande vide « Niveau » ; carte sans pastille : suffixe « - Nn » près du nom, absent sans niveau. Le suffixe est dérivé, jamais une partie du nom persistant ni de sa clé d’unicité. Le choix et l’accessibilité donnent le rang et le total réels. L’icône à trois variantes n’est pas un plafond ; la réalisation graphique des rangs supérieurs reste à terminer, sans rouvrir C06.

Le catalogue d’entretien des mouvements peut exister, avec représentation des groupes en piles ; il ne remplace pas la recherche dans la création, y compris depuis une séance. Aucun détour obligatoire par ce catalogue. La recherche inclut les mouvements sans exercice et ceux créés localement.

**C08 — actualisé le 28/10 :** rattacher un indépendant, détacher et dissoudre une famille depuis le catalogue sont définis par les règles A à E et CE-MVT-03. La suppression du mouvement reste un parcours distinct. Distinguer retrait du groupe (mouvement conservé) et suppression du mouvement. Le mouvement survit dans tous les cas à la suppression des exercices qui l’utilisent.

## 6. Recherche et tests automatiques

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

**Aucune vérification supplémentaire n'est déclenchée à la sauvegarde.** Ces signaux agissent uniquement sur le classement pendant la saisie, et jamais après un choix explicite de mouvement indépendant.

#### Ce que la recherche ne fait pas

Elle **propose des rapprochements et ne conclut jamais à l'identité** de deux mouvements. Aucun rattachement, aucune fusion, aucune présélection n'en découle. Les différences de formulation restent visibles dans les résultats : les noms sont affichés tels qu'ils ont été saisis, jamais sous leur forme normalisée.

#### Mise en œuvre

Clé canonique, ensemble de tokens et ensemble de trigrammes sont calculés **à l'écriture**, au moment de l'enregistrement du mouvement, et conservés à côté de son nom. La recherche devient alors un parcours en mémoire sur l'ensemble des mouvements disponibles, sans index à maintenir.

Les trois couches sont des fonctions pures, testables unitairement. Le coût réel du parcours, le choix d'un éventuel index et les volumes à partir desquels la question se pose relèvent de l'analyse technique.

### R03 — Déclenchement et comportement

**La saisie du nom déclenche la recherche.** Ce n'est pas une faculté : au dessus du seuil haut, la suggestion est présentée.

L'entrée de recherche explicite reste accessible même lorsqu'aucun mouvement n'atteint les seuils.

Le comportement de l'écran de recherche tient en trois cas :

| Situation | Comportement |
|---|---|
| Requête renseignée, résultats | Les résultats correspondants, classés par pertinence décroissante |
| Requête renseignée, aucun résultat | L'absence de résultat est annoncée, avec une action **Voir tous les mouvements** |
| Requête vide | Tous les mouvements, selon l'ordre de parcours du Catalogue |

L'écran s'ouvre avec le nom saisi comme requête, préremplie et effaçable. **Il n'existe pas de liste filtrée coexistant avec une zone « tous les mouvements »** : une seule liste, dont le contenu dépend de la requête.

### R04 — Contenu d'un résultat

Un résultat représente un mouvement, pas un exercice paramétré. Utiliser les composants Carte — Mouvement et Carte — Mouvement — Résultat (références du DSF du 25/10). Montrer nom, média et contexte permettant le choix, dont description, zones et origine locale si nécessaire. Un mouvement local reste proposable sans publication d’un exercice Catalogue. `9959:19623` est désormais un catalogue d’entretien ; ce n’est plus la référence du sélecteur de création.

Dans le panneau sous le nom, cinq résultats au maximum ; **la présentation des actions dépend du parcours**. En création de Mouvement, une carte Résultat conserve « Ajouter un niveau » à droite, sans bouton « Utiliser ce mouvement ». Depuis la Composition / création d'un Exercice, la carte Composition n'a aucun bouton ; la sélection existante reste attachée au parcours, pas à une nouvelle commande visuelle. Entrée ne sélectionne pas de résultat. L’ordre ne change pas pendant un appui. L’accès explicite à la recherche reste disponible selon R03. [Spécification PRE-9 de l'affichage des résultats](KODJO-Resultats-recherche-mouvements-PRE9-2026-10-30.md).

### R05 — Alias

Les **alias sont des noms alternatifs facultatifs du mouvement**, saisis et modifiables avec ses autres champs de contenu. Ils répondent à ce qu'aucun algorithme de chaînes ne peut faire : rapprocher « pompes » de « push-up », « fentes » de « lunges », « gainage » de « planche ».

Règles :

- le nom principal et les alias **participent tous à la recherche** ;
- **un mouvement n'apparaît qu'une fois** dans les résultats, classé selon sa meilleure correspondance, quel que soit le nom qui l'a fait remonter ;
- **deux mouvements distincts peuvent partager un alias** sans que cela crée le moindre rattachement entre eux ;
- les alias appartiennent au mouvement. **Ce ne sont pas des noms propres aux exercices** qui l'utilisent.

Un alias est modifiable comme le reste du contenu du mouvement, et relève donc des mêmes règles de correction partagée.

### R06 — Portée de la recherche dans le produit

D-221 et RM-221 excluent aujourd'hui toute recherche globale ou locale des Catalogues. Cette exclusion est **retirée**.

Elle n'a jamais défini ce qu'elle excluait : elle nommait des écrans archivés, pas un concept. Et elle obligeait toute recherche légitime à se déclarer en dérogation, ce qu'a dû faire D-439 pour la recherche de mouvement.

Énoncé de remplacement, qui décrit ce qui existe sans rien verrouiller :

> Les listes de Catalogue se réduisent par leurs filtres et leur tri. Deux rapprochements textuels existent : le nom d'un mouvement à la création, défini par R02 à R05, et le sélecteur d'insertion d'exercices dans une séance, avec ses filtres Catégorie et Zones corporelles. Le catalogue de mouvements sert à leur entretien ; la sélection d’un mouvement reste dans le parcours de création. Les autres recherches Catalogue ne sont pas généralisées par cette décision.

### R07 — Jeu de cas de référence

Les coefficients et les seuils de R02 étant un point de départ, c'est un **jeu de cas automatisés** qui tient lieu de définition opérationnelle du comportement attendu, et qui conditionne toute évolution de la formule.

**Couverture.** Huit familles : correspondances exactes ; accents et casse ; pluriels, y compris les mots courts que le rognage doit épargner ; fautes de frappe ; noms partiels ; ordre des mots ; alias ; et **différences significatives**, c'est à dire des paires qui ne doivent pas se rapprocher.

**Ce qui est vérifié**, pour chaque requête :

- les résultats attendus sont présents ;
- leur classement, lorsqu'il est pertinent ;
- **l'absence de doublon par mouvement**, un mouvement n'apparaissant qu'une fois quel que soit le nom ou l'alias qui l'a fait remonter ;
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
| Différence significative | `Fentes avant` | `Fentes arrière` jamais suggéré comme le même mouvement |

---


## 7. Sélection dans une séance et historique

Le sélecteur d’exercices conserve recherche, filtres Catégorie/Zones, sélections entre requêtes et compteur global. Insertion selon le tri courant du Catalogue puis date de création et identifiant croissants. Une insertion crée une occurrence avec référence au mouvement et copie de paramètres, jamais une dépendance à l’exercice Catalogue.

Les historiques conservent le contenu exécuté, les paramètres et les relevés figés au démarrage. Aucun rang stocké ; classification actuelle résoluble séparément. Les lignes compactes du Suivi `1992:8996` restent sans rang. Les médias utilisés par les instantanés restent protégés du nettoyage physique.

## 8. Validation et limites de réalisation

Base vierge autorisée, aucune migration requise. [D-440 assouplie les 23 et 24/10/2026 (migration 012, annotation de D-440 et MFN-12) ; arbitrage de Hermann du 26/10/2026 (Q1, Q2) : C05 appliqué intégralement dans PRE-7 (occurrence sans copie persistante du contenu partagé ni synchronisation, intégrité des références actives, instantanés autonomes et figés) ; migration 013 de réinitialisation ponctuelle, exécutée une seule fois : Profil, Catégories, Zones corporelles et Étiquettes conservés avec leurs personnalisations ; Mouvements, groupes de Niveaux, Exercices, Séances et associations devenues obsolètes réinitialisés ; migration 012 inchangée ; voir l’annotation de D-445 au chapitre 07] Les scénarios MFN/AC du chapitre 10 portent le dialogue dans toutes ses branches, l’unicité, la création de variante, le remplacement d’occurrence, la lecture partagée, les phases incomplètes et le gel de l’exécution. Le corpus R07 reste automatique, en CI ; aucun nouveau réglage utilisateur.

Les huit points fonctionnels sont clos. Restent distinctement : décision de périmètre C08, travail d’alignement du code et de Figma, représentation des rangs supérieurs et exports restants bloqués par le quota Figma lors du relevé. Les captures du 25/10 ne sont pas retouchées ; les écarts ne remplacent pas D-445.


### Phases — clarification PHC-20261026

Les phases forment un motif cyclique de guidage : un passage complet correspond à une répétition guidée. Chaque phase conserve une durée en secondes. La somme des phases est la durée du motif, jamais la durée cible de la série. Les modes Durée et Répétitions, avec cible chiffrée ou À l’échec, sont compatibles ; seules les séries variables restent incompatibles avec les phases. [remplacé par D-446 du 26/10/2026 : les phases sont aussi compatibles avec les séries variables ; une seule séquence de phases et de durées, commune à toutes les séries] La condition d’arrêt appartient à la série. En Durée chiffrée, la cible indépendante termine la série à échéance, même au milieu d’une phase. À l’échec, le guidage boucle jusqu’à Suivant. En Répétitions chiffrées, R motifs donnent une durée nominale R × somme des phases ; Suivant conserve la validation manuelle existante. Chaque nouvelle série recommence à la première phase. Les cycles guidés ne prouvent pas les répétitions effectivement réalisées.

Modifier, ajouter ou supprimer une phase ne réécrit pas la cible de série. Toutes les durées de phase sont éditables, y compris sous un format à durée imposée : aucune dernière phase calculée, aucune adaptation proportionnelle pour faire tenir le motif dans la série. Une durée manquante reste à renseigner ; ne pas inventer une durée depuis l’objectif de série. Les bornes existantes des phases restent des bornes du motif, indépendantes de celles de la cible. Le retrait 2 → 1 conserve le passage à Sans mais ne remplace plus la cible par la durée restante. Sans phases conserve également la cible existante.

Référence normative : [PHC-20261026](KODJO-Phases-Guidage-Cyclique-2026-10-26.md). La règle Répétitions sans bip = non calculable concerne désormais les exercices sans phases : avec phases, R × durée du motif donne une estimation nominale, jamais une mesure. Arrêt mixte et guidage après objectif avant Suivant restent les deux points distincts décrits dans cette référence. [clos par D-446 du 26/10/2026 : l’arrêt mixte se représente par les séries variables, avec phases ; en Répétitions chiffrées, le motif continue de boucler, sans signal, entre la cible et Suivant] Les anciennes captures sont des preuves datées ; alignement Figma et code non revendiqué.
