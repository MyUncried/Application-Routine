# Formats de séance — analyse d'impacts

Oct 14, 2026 · @Hermann

KODJO introduit un champ invisible, le type de séance, posé à la création et immuable ensuite : il décide quels paramètres sont verrouillés, lesquels disparaissent de l'écran, comment la séance s'exécute et comment elle se lit en synthèse. Ce document décrit le concept et ce qu'il change, pour en faire analyser les impacts.

## Le concept

Trois champs nouveaux sur la séance, invisibles pour l'utilisateur, qu'il ne faut pas confondre.

**Format appliqué** porte une règle d'exécution : Tabata, EMOM, AMRAP, Death by, For time, Intervalles 30/30. Il est posé à la création et ne change plus, parce qu'il conditionne les champs présentés à la composition. Une séance vierge ne peut pas devenir un EMOM en cours de route.

**Origine de création** porte le modèle d'où la séance est partie, y compris quand ce modèle ne contraint rien. Une séance issue de Renforcement reste une séance libre : son origine est conservée pour le reporting, elle ne porte aucune règle. Les cinq départs rapides et Libre n'alimentent que ce champ.

**Paramètres du format** porte ce que le format impose. Trois natures y cohabitent et ne se traitent pas pareil : les **constantes du format**, fixées par la règle et identiques d'une séance à l'autre, comme le 20 s / 10 s d'un Tabata ; les **réglages de la séance**, choisis une fois à la création et valables pour toute la séance, comme la fenêtre d'un EMOM ou l'incrément d'un Death by ; les **valeurs calculées**, déduites des deux premières, comme la durée totale. Seules les constantes sont immuables.

Les douze entrées de l'écran de création ne doivent pas être fondues en une seule énumération dans le modèle : cela ferait porter une logique d'exécution à de simples modèles de préremplissage. Un format se reconnaît à ce qu'il retire des mains de l'utilisateur ; un départ rapide ne retire rien, il évite la page blanche.

Deux conséquences suivent, et ce sont elles qu'il faut analyser : le format décide des champs affichés à la composition et de la façon dont l'exécution lit une fin de séance ; l'origine, elle, ne sert qu'à classer.

## Les douze modèles de départ

L'écran de création propose douze entrées, en deux sections : six formats, cinq départs rapides, et Libre en dernier. C'est une liste d'écran, pas une énumération du modèle : les six premières alimentent le format appliqué, les six autres seulement l'origine de création.

| Entrée | Alimente | Parcours | Fin | Ce qu'elle pose |
| --- | --- | --- | --- | --- |
| Tabata | Format | De tours | Nombre de tours | 8 × 20 s / 10 s |
| Intervalles 30/30 | Format | De tours | Nombre de tours | 30 s de travail, 30 s de pause |
| EMOM | Format | De tours | Nombre de tours | Une fenêtre fixe, identique pour tous les exercices |
| AMRAP | Format | De tours | Durée | Autant de tours que possible dans la durée |
| For time | Format | De tours | Nombre de tours | Volume fixé, le temps est la mesure |
| Death by | Format | De tours | Max | Charge croissante par tour, l'arrêt est la mesure |
| Renforcement | Origine | De tours | Nombre de tours | Trois séries, pause entre séries |
| Gainage · Mobilité | Origine | De tours | Nombre de tours | Postures tenues, pas de répétitions |
| Superset | Origine | De tours | Nombre de tours | Deux exercices enchaînés sans pause |
| Progression | Origine | De séries | 1 tour | Charge ou volume croissant d'une série à l'autre |
| À l'échec | Origine | De tours | Nombre de tours | Trois séries avec cible à l'échec |
| Libre | Origine | Au choix | Nombre de tours | Rien |

Les six dernières lignes ne posent que des valeurs de départ : le parcours et la fin indiqués y sont des valeurs préremplies, que l'utilisateur peut changer. Sur les six premières, ils sont verrouillés.

Deux cas demandent attention. **À l'échec** n'a pas vocation à devenir un format : l'échec est une cible posée au niveau de la série, et le départ rapide ne fait que l'utiliser. Verrouiller sa récupération ne suffirait d'ailleurs pas à rendre deux séances comparables. **Death by** ne peut pas créer ses séries à l'avance, puisque le nombre de tours n'est connu qu'après coup : ses séries naissent au fil de l'exécution.

## Ce que chaque format fait des paramètres

Deux états seulement, et c'est l'état déjà acté qu'on réutilise. **Verrouillé** : valeur effective, visible, non modifiable, accompagnée de sa raison. **Libre** : saisi normalement. Un paramètre imposé mais bien exécuté reste visible, il ne disparaît pas de l'écran : le masquer reviendrait à le confondre avec un paramètre sans effet.

| Format | Constantes du format, verrouillées | Réglages de la séance | Libres à l'exercice |
| --- | --- | --- | --- |
| Tabata | 20 s de travail, 10 s de pause, 8 séries, parcours de tours | Nombre de tours | Exercices, récupération après exercice, étiquette |
| Intervalles 30/30 | 30 s de travail, 30 s de pause, parcours de tours | Nombre de tours | Exercices, récupération |
| EMOM | Fenêtre identique pour tous les exercices, parcours de tours | Durée de la fenêtre, nombre de tours | Exercices, objectif de répétitions |
| AMRAP | Fin par durée, parcours de tours | Durée totale | Exercices, répétitions par exercice |
| For time | Volume fixé, parcours de tours | Nombre de tours, répétitions | Exercices |
| Death by | Fin par Max, parcours de tours, séries créées au fil de l'exécution | Fenêtre, incrément par tour | Exercices |

La colonne du milieu est celle qui manquait : ces valeurs sont choisies une fois à la création, valent pour toute la séance, et ne sont plus modifiables ensuite sans changer la séance. Elles ne sont ni des constantes du format ni des paramètres libres d'exercice.

Les cinq départs rapides et Libre ne verrouillent rien : toutes les colonnes sont libres, et seule l'origine de création est conservée.

Deux points à ne pas traiter comme des exceptions de format. L'**objectif** est une valeur déclarée, pas une contrainte : sur EMOM, l'utilisateur annonce un nombre de répétitions à viser, rien ne l'empêche de faire moins, et la séance reste valide. Le **compte à rebours** et la **fin d'exercice** ne s'exécutent déjà pas au sein d'une séance, quel que soit le format : EMOM n'introduit ici aucune règle propre, il hérite de la règle générale.

## Le circuit et ses bornes

Deux dimensions indépendantes, qu'il ne faut pas ranger dans la même énumération : **comment on parcourt** le circuit, et **ce qui le termine**.

**Circuit de tours** : on fait toutes les séries d'un exercice, puis toutes celles du suivant, et l'ensemble se répète. Soit `(A1 A2 A3 B1 B2 B3) × N`. C'est la norme.

**Circuit de séries** : on fait une série de chaque exercice, puis on reprend à la suivante. Soit `A1 B1 A2 B2 A3 B3`. Réservé aux progressions et aux pyramides, où la charge évolue d'une série à l'autre.

La condition de fin est une autre dimension : un **nombre de tours** atteint, une **durée** écoulée, ou **Max**, c'est-à-dire l'arrêt déclaré par l'utilisateur. Un AMRAP est donc un circuit de tours terminé par une durée, pas un troisième type de circuit.

La fin par durée et la fin par Max sont réservées aux formats : dans une séance libre, le sélecteur ne propose que les deux parcours et une fin par nombre de tours.

Les incompatibilités se concentrent sur En durée :

- La fin par durée exclut un nombre de tours fixé : c'est le temps qui arrête.
- La fin par durée exclut le circuit de séries : enchaîner des séries à charge évolutive dans un temps borné ne produit aucune mesure interprétable.
- La fin par durée exclut les séries variables, pour la même raison : on ne sait pas combien de passages auront lieu.
- La fin par Max exclut la création des séries à l'avance : c'est le cas Death by, où le nombre de tours n'est connu qu'après coup.

Les autres combinaisons sont libres. De tours et de séries se combinent avec n'importe quelle borne numérique, avec des séries identiques ou variables, avec ou sans pause.

## La lecture d'un arrêt

Trois notions à ne pas confondre, et c'est le point le plus structurant pour l'exécution. Le **motif de fin** dit pourquoi la séance s'est arrêtée : terme atteint, arrêt déclaré, abandon. Le **résultat atteint** dit ce qui a été fait : tours accomplis, répétitions, temps. L'**état d'achèvement** dit comment la séance se range : terminée, partielle, interrompue.

| Condition de fin | Motif de fin possible | État d'achèvement |
| --- | --- | --- |
| Nombre de tours | Terme atteint, ou arrêt avant le terme | Terminée, ou partielle |
| Durée | Temps écoulé, ou arrêt avant le terme | Terminée, ou partielle |
| Max | Limite atteinte, ou abandon | Terminée si la limite est déclarée, partielle sinon |

La dernière ligne est celle qui demande une commande explicite. Sur une borne Max, atteindre sa limite est une fin normale et la séance est complète. Mais tout appui sur Stop ne vaut pas déclaration de limite : il faut distinguer, dans l'interface, le geste qui dit j'ai atteint ma limite de celui qui dit j'arrête là. Sans cette distinction, un abandon serait enregistré comme une performance.

Sur un Death by, l'utilisateur déclare son nombre de tours à chaque passage. Quand il déclare ne plus pouvoir, cet arrêt n'est pas un échec de la séance, c'est son résultat : motif de fin « limite atteinte », résultat « tour N », état « terminée ».

L'échec au niveau d'une série suit la même logique, à un niveau plus fin : c'est une **cible par série**, qui existe dans les deux modes d'exécution, durée comme répétitions. Ce n'est ni un mode d'exécution ni une propriété globale de l'exercice. Le départ rapide « À l'échec » ne fait que préremplir trois séries avec cette cible.

## Impacts sur le modèle de données

- **Séance** gagne trois champs : `format appliqué`, vide pour une séance libre ; `origine de création`, qui garde le modèle de départ même quand il ne contraint rien ; `paramètres du format`, structure dont il faut distinguer constantes, réglages de séance et valeurs calculées.
- **Circuit** porte un parcours, de tours ou de séries, et une condition de fin, nombre de tours, durée ou Max. Deux champs, pas un.
- **Exercice** n'a pas de champ nouveau, mais chacun de ses paramètres doit pouvoir porter l'état verrouillé avec sa raison. C'est une dépendance nouvelle : jusqu'ici un exercice se lisait seul.
- **Série** gagne une cible à l'échec, disponible dans les deux modes d'exécution.
- **Exécution** enregistre séparément le motif de fin, le résultat atteint et l'état d'achèvement, et le niveau où l'arrêt s'est produit, tour ou série.

La **charge** est une extension à concevoir : sans elle, une progression ne se mesure qu'au volume. Le **tempo** demande d'abord d'être défini avant qu'on puisse conclure qu'il manque. Le bip de cadence existe déjà, mais il ne mesure ni n'impose le mouvement : il donne un repère sonore, ce qui n'est pas la même chose qu'un tempo d'exécution.

## Impacts sur les écrans et le parcours

Le parcours de création passe de deux étapes à quatre, identiques pour les douze modèles.

1. **Composer une séance** : la grille des douze modèles, trois colonnes, deux sections, formats puis départs rapides, Libre en dernière case.
2. **Paramètres du modèle** : une phrase qui dit ce que le format pose, et le bloc des paramètres imposés, en lecture seule.
3. **Récapitulatif** : le nom prérempli du format, l'étiquette, les paramètres, et le bouton qui mène à la composition.
4. **Composition préremplie** : la séance avec ses exercices et ses valeurs verrouillées.

Trois conséquences pour les écrans existants.

La **modale de paramètres d'exercice** doit connaître le format de la séance qui l'appelle, puisque c'est lui qui décide des valeurs verrouillées et de leur raison. Elle n'a pas à masquer le compte à rebours ni la fin d'exercice sur EMOM : ces deux lignes ne s'exécutent déjà pas au sein d'une séance, quel que soit le format, et la règle générale suffit.

Le **sélecteur de circuit** perd une valeur dans une séance libre : En durée n'y est plus proposée, elle n'apparaît que portée par un format.

La **carte de séance** porte désormais le format : un cadre carré de 64 px à gauche, aux couleurs du format, avec son motif et son nom. La catégorie textuelle en a été retirée, puisque le cadre la porte en image. Sur la carte d'exercice, le même cadre porte la nature de l'exercice et la ligne de texte porte la zone corporelle.

## Impacts sur l'exécution et la synthèse

À l'exécution, le type de séance décide de trois choses : ce que l'écran affiche pendant l'effort, ce qui déclenche le passage à l'activité suivante, et comment un arrêt est interprété.

Sur EMOM, la fenêtre court et le passage est automatique à son terme, qu'il reste du temps ou non ; l'appui sert à mesurer le repos restant, pas à avancer. Sur Tabata et Intervalles 30/30, le rythme est imposé et le bip de cadence est indicatif. Sur AMRAP, seul le chrono global arrête. Sur Death by, chaque tour attend une déclaration de l'utilisateur.

En synthèse, il faut se garder d'un raccourci. Le format **classe** les séances ; il ne les rend pas comparables à lui seul. Deux Tabata peuvent différer par leurs exercices, leurs volumes, leur récupération, les côtés travaillés ou les charges. Inversement, deux exécutions d'une même séance libre sont parfaitement comparables. C'est le **protocole effectivement exécuté** qui détermine la comparabilité, pas l'étiquette de format.

Ce que le format apporte au reporting est donc plus modeste et plus sûr : toute séance exécutée est déjà classée, sans rien demander de plus à l'utilisateur, et l'origine de création permet de suivre ce dont les gens partent. La comparaison, elle, se construit sur les paramètres réellement identiques d'une exécution à l'autre.

## Points ouverts

- **Comment l'interface distingue « limite atteinte » de « j'arrête »** sur une borne Max. C'est la condition pour ne pas enregistrer un abandon comme une performance.
- **Quels paramètres doivent être identiques** pour que deux exécutions soient déclarées comparables. Verrouiller la récupération n'y suffit pas à lui seul.
- **La charge** reste à concevoir comme extension du modèle d'exercice.
- **Le tempo** reste à définir avant d'être déclaré manquant : préciser ce qu'il mesure ou impose, et ce qui le distingue du bip de cadence.
- **Le nom du modèle fait-il le nom de la séance ?** Aujourd'hui le format préremplit le nom. À confirmer quand plusieurs séances du même format coexisteront.
- **Couverture des formats** : reste à trancher si Pyramide mérite une entrée propre ou reste un cas de Progression.

## Sources

Ce document reprend les décisions prises en conception sur le fichier Figma KODJO, page `Conception — Hors MVP`, rangée des formats, et les composants `DSF / Cards / Séance` et `DSF / Cards / Exercice`. Aucune source externe.
