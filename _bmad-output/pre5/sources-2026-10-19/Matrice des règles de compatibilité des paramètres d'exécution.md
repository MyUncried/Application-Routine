# Matrice des règles de compatibilité des paramètres d'exécution

Oct 19, 2026 · @Hermann

## Les axes

Relevés dans les écrans `Création activité — Paramètres (modale)` de la page `Prototype MVP`, le 19 octobre. Onze axes, dont sept commandés par un contrôle binaire ou segmenté.

| Axe | Valeurs | Position dans la modale |
| --- | --- | --- |
| Mode | `Répétitions` · `Durée` | Segmenté, en tête |
| Condition d'arrêt | `À l'échec` · `À la cible` | Segmenté |
| Phases de l'exercice | `Avec` · `Sans` | Segmenté |
| Type de série | `Variables` · `Identiques` | Segmenté |
| Charge | `Avec` · `Sans` | Segmenté |
| Changement de côté | `Avec` · `Sans` | Segmenté |
| Cadence | `Sans` · `1 s` · `2 s` · `5 s` · `Autre` | Segmenté |
| Nombre de séries | Entier | Valeur |
| Durée d'une série, ou tableau des séries | Durée, ou lignes | Valeur ou tableau |
| Pause | Durée | Valeur, ou colonne du tableau |
| Compte à rebours, Fin d'exercice | Durées | Valeurs, exclues du total |

Trois axes sont nouveaux depuis le dernier relevé et modifient les conclusions antérieures : `Condition d'arrêt`, `Charge` et `Type de série` comme contrôle explicite. **La charge existe désormais**, y compris en colonne du tableau des séries variables, avec des valeurs en kilogrammes. La décision antérieure qui écartait le mode répétition des phases faute de charge est donc à réexaminer.

### L'enchainement n'est pas un axe de l'exercice

Tu l'as listé parmi les axes à croiséser, mais il n'apparaît dans aucun écran de paramètres. Il existe uniquement au niveau de la séance, sous la forme des deux variantes d'exécution `Par alternance` et `Par exercice`, visibles sur Tabata et Intervalles 30/30.

C'est le premier trou, et il est structurel : un exercice ne sait pas s'il sera joué en circuit ou seul, alors que cela change ce que l'écran d'exécution affiche, `Tour 3/8` contre `Série 3/8`.

## La matrice

Sept axes font vingt et un couples. Onze seulement portent une contrainte réelle. Les dix autres sont libres et n'ont pas à être décrits.

### Couples contraints

| Couple | Règle | Effet à l'affichage | Établi |
| --- | --- | --- | --- |
| Phases × Type de série | Phases incompatibles avec séries variables | Ligne Phases verrouillée, sans texte d'incompatibilité | Oui, écran dédié |
| Phases × Durée d'une série | La durée est déterminée soit par les phases, soit par la série, jamais les deux | Ligne conservée avec le total, non modifiable | Oui |
| Phases × Format imposant la durée | Autorisé, avec la dernière phase calculée | Dernière durée en valeur calculée, aucun blocage à la validation | Oui, écran Tabata |
| Phases × présence de phases | Le chevron n'apparaît que si des phases existent | `Aucune` sans chevron, `N phases` avec chevron | Oui |
| Condition d'arrêt × Durée d'une série | À l'échec supprime la durée comme paramètre | La cellule affiche `à l'échec` au lieu d'une valeur | Oui, tableau des variables |
| Condition d'arrêt × Durée de l'exercice | À l'échec rend le total incalculable | **Non traité**, voir contradictions | Non |
| Mode × Tableau des séries variables | Les colonnes changent avec le mode | `Répétitions · Pause` ou `Durée · Pause` | Oui |
| Charge × Tableau des séries variables | Avec charge ajoute une colonne | `Durée · Pause · Charge`, valeurs en kg | Oui, écran dédié |
| Type de série × Pause | Identiques donne une pause unique, Variables une pause par ligne | Valeur simple ou colonne | Oui |
| Nombre de séries × Pause | Une seule série rend la pause sans objet | **Non traité**, la ligne Pause reste affichée | Non |
| Mode × Condition d'arrêt | Combinaison libre, les quatre croisements existent | Aucun | Implicite |

#### Condition d'arrêt × Type de série

En séries variables, la condition d'arrêt n'est plus saisie : **elle est déduite du tableau et affichée en lecture seule**, puisque chaque ligne porte sa propre condition. Trois valeurs possibles.

| Contenu du tableau | Valeur affichée |
| --- | --- |
| Toutes les lignes portent une cible, durée ou répétitions | `À la cible` |
| Toutes les lignes portent `à l'échec` | `À l'échec` |
| Les deux coexistent | `À la cible et à l'échec` |

Le troisième cas est déjà construit, sur `Séries variables, cas mixte`, où le contrôle segmenté est remplacé par une valeur simple. C'est la même application du principe de détermination unique : la table décide, le contrôle ne fait que rapporter.

En séries identiques, le contrôle redevient segmenté et modifiable, avec deux valeurs seulement.

### Couples libres

Charge, Changement de côté et Cadence se combinent avec Mode, Condition d'arrêt et Phases sans contrainte observée. Charge fonctionne aussi bien en mode Durée, tenir une charge pendant trente secondes étant un cas valide.

### La règle de fond qui organise le reste

Un seul principe explique presque toutes les contraintes ci-dessus : **une grandeur ne peut être déterminée qu'une fois.** La durée d'une série vient des phases, ou de la série, ou du format, jamais de deux sources. C'est ce qui produit le verrouillage avec les séries variables, la valeur calculée de la dernière phase, et la cellule `à l'échec`.

Énoncée ainsi, cette règle couvre aussi les cas non encore traités, et c'est elle qu'il faut écrire dans la documentation plutôt que la liste des onze couples.

## Les trous

Six cas qu'aucune règle ni aucun écran ne couvre, classés par conséquence.

**L'enchainement n'existe pas au niveau de l'exercice.** Détaillé plus haut. Un exercice ne porte pas l'information qui décide entre `Tour 3/8` et `Série 3/8` à l'exécution. C'est le trou le plus large, parce qu'il touche le modèle et pas seulement l'affichage.

**La convention `≥` pour les totaux incalculables est appliquée de façon inégale.** Quand une série va jusqu'à l'échec, la durée de l'exercice n'est pas calculable. La convention existe et fonctionne : `Séries variables, cas mixte` affiche `Durée totale : ≥ 2 min 15 s`, et l'écran d'exécution Progression affiche `/ ≥ 09:00`. Mais deux écrans à l'échec affichent un total sec, sans le signe. Ce n'est donc pas une règle manquante, c'est une règle à appliquer partout.

**Changement de côté et séries variables ne se croisent pas.** Le tableau des séries variables n'a pas de colonne de côté. Si les côtés alternent par série, rien ne l'exprime. Les popovers `Ordre des côtés`, `Les deux côtés à chaque série` et `Un côté après l'autre` existent, mais aucun écran ne les montre avec des séries variables.

**Cadence et phases ne se croisent pas.** Un bip de cadence à 1 s pendant une phase de 8 s est possible mais personne n'a dit si le bip se réinitialise à chaque changement de phase.

**Une seule série laisse la pause affichée.** Sans objet, puisqu'il n'y a pas de série suivante.

**AMRAP n'a pas de plafond de temps.** Déjà signalé. La piste retenue est le mode Durée avec un plafond au lieu d'une cadence, plus l'objectif par tour.

### Un trou qui n'en est peut-être plus un

Le mode répétition des phases avait été écarté au motif qu'il fallait la charge pour qu'il ait du sens. La charge existe maintenant. La décision peut être réexaminée, mais elle reste hors du périmètre en cours.

## Contradictions dans les écrans

Quatre écrans portent des valeurs qui se contredisent entre le résumé, le tableau et le total calculé. Je les signale une fois, sans y revenir : ce sont peut-être des valeurs de démonstration non mises à jour, et c'est à toi de juger.

| Écran | Ce que dit le résumé | Ce que dit le reste de l'écran |
| --- | --- | --- |
| `Séries variables en Répétition Avec Cadence` | 3 séries de durée variable, 30 s, 45 s puis 1 min | Le tableau donne 12, 10 puis 8 répétitions, la seconde colonne étant la pause |
| `Séries variables (tableau replié)` | 3 séries menées jusqu'à l'échec | `Durée de l'exercice · 3 min 15 s`, or un exercice à l'échec n'a pas de durée calculable |
| `Phases verrouillées (séries variables)` | 3 séries de durée variable, 30 s, 45 s puis 1 min, total 3 min 15 s | Le tableau donne `à l'échec` sur les trois lignes, avec des pauses de 10, 20 et 30 s |
| `Une seule série` | 3 séries de 1 min 30 s, total 5 min 15 s | `Nombre de séries · 1 série`, et `Durée de l'exercice · 3 min 40 s` |

Le cas `Une seule série` porte trois valeurs incompatibles sur le même écran. Avec une série de 1 min 30 s, un compte à rebours de 10 s et une fin d'exercice de 5 s, le total attendu est 1 min 30 s, les deux derniers étant exclus du calcul.

Les deux cas qui mélangent `à l'échec` et un total calculé ne sont pas des erreurs de saisie mais le symptôme du trou décrit plus haut : tant que la règle n'existe pas, l'écran affiche un total par défaut.

### Point de détail

Le libellé du segment est `A la cible`, sans accent, sur tous les écrans. Il partira tel quel dans le code et dans les assertions.
