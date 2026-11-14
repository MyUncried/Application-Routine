# For time — Règles de gestion des séries et des tours

État cible à implémenter. Ces règles corrigent le comportement actuel de la composition et du récapitulatif.

## Structure

**FT-1** Un For time se compose, dans l’ordre : des exercices en **buy-in** (0 à n), un **circuit de tours** (1 à n exercices en rôle **Tour**), des exercices en **buy-out** (0 à n). Le buy-in et le buy-out s’exécutent **une seule fois** sur l’ensemble du For time ; les exercices en tour s’enchaînent à chaque tour.

**FT-2** Le **nombre de tours** est une propriété du For time (au moins 1). Il est défini à la composition et vaut pour tous les exercices en tour.

## Séries

**FT-3** Quel que soit son rôle, un exercice porte ses séries dans sa configuration d’exécution : mode Répétitions ou Durée, séries **identiques** ou **variables**, une cible par série. Cette configuration est l’**unique source de vérité**. Elle se modifie à l’identique dans la composition et dans le récapitulatif (même modale, mêmes contrôles, mêmes valeurs).

**FT-4** **Buy-in et buy-out** : le nombre de séries est libre (au moins 1), identiques ou variables, exécutées une fois. Il est indépendant du nombre de tours.

**FT-5** **Tour** : le nombre de séries est égal au nombre de tours du For time, pour tous les exercices en tour. Il ne se règle pas exercice par exercice. Le choix porte sur les cibles : *identiques* (même cible à chaque tour) ou *variables* (une cible par tour, par exemple 21 – 15 – 9).

**FT-6** Chaque série a un objectif. Il n’existe aucune série sans objectif en For time, et « À l’échec » n’y est pas proposé.

## Cohérence avec le nombre de tours

**FT-7** Quand le nombre de tours change, les séries de tous les exercices en tour sont mises à jour : en cas d’augmentation, séries identiques répétées, séries variables complétées avec la dernière valeur ; en cas de diminution, les dernières séries sont supprimées. Aucune série orpheline ni manquante.

**FT-8** Un exercice ajouté en rôle Tour est créé avec autant de séries identiques que de tours.

## Changement de rôle

**FT-9** Tour → buy-in ou buy-out : les séries sont conservées telles quelles et deviennent propres à l’exercice (plus liées au nombre de tours).

**FT-10** Buy-in ou buy-out → tour : les séries sont ajustées au nombre de tours (identiques : valeur répétée ; variables : tronquées ou complétées avec la dernière valeur).

**FT-11** Le changement de rôle ne laisse aucun état caché : composition, récapitulatif et exécution présentent les mêmes séries.

## Récapitulatif

**FT-12** Le récapitulatif affiche, pour chaque exercice, ses séries réelles (nombre et cibles) lues dans sa configuration ; il ne déduit rien du rôle. Toute modification faite dans le récapitulatif est écrite dans la configuration de l’exercice et se retrouve à l’identique après sauvegarde et réouverture, y compris dans la composition.

## Exécution

**FT-13** Phases du mouvement : pour un exercice en tour, elles sont ignorées à l’exécution (aucun affichage, bip ni annonce vocale de phase) ; le paramètre reste stocké tel que défini avec le geste. Pour un buy-in ou un buy-out, les phases et la cadence suivent le paramétrage de l’exercice.

## Recette

1. Buy-in à 3 séries variables : composition et récapitulatif affichent 3 séries, modifiables dans les deux vues.
2. Exercice en tour : séries égales au nombre de tours, cibles identiques ou variables modifiables dans les deux vues, valeurs conservées après sauvegarde et réouverture.
3. Passer de 3 à 4 tours, puis de 4 à 2 : les exercices en tour suivent, sans série vide.
4. Échanger les rôles d’un buy-in et d’un exercice en tour : aucune valeur perdue de façon silencieuse, aucune série sans objectif, deux vues identiques.
5. Un exercice en tour ayant des phases : aucune phase à l’exécution, paramètre conservé.
