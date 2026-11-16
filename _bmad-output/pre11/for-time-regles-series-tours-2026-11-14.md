# For time — Règles de gestion des séries et des tours

État cible à implémenter. Ces règles corrigent le comportement actuel de la composition et du récapitulatif.

## Structure

**FT-1** Un For time se compose, dans l’ordre : des exercices en **buy-in** (0 à n), un **circuit de tours** (1 à n exercices en rôle **Tour**), des exercices en **buy-out** (0 à n). Le buy-in et le buy-out s’exécutent **une seule fois** sur l’ensemble du For time ; les exercices en tour s’enchaînent à chaque tour.

**FT-2** Le **nombre de tours** est une propriété du For time (au moins 1). Il est défini à la composition et vaut pour tous les exercices en tour.

## Séries

**FT-3** Quel que soit son rôle, un exercice porte ses séries dans sa configuration d’exécution : mode Répétitions ou Durée, séries **identiques** ou **variables**, une cible par série. Cette configuration est l’**unique source de vérité**. Elle se modifie à l’identique dans la composition et dans le récapitulatif (même modale, mêmes contrôles, mêmes valeurs).

[FT-4 précisé le 14/11/2026 (corrections 1 et 2 de Hermann du 14/11/2026, `_bmad-output/pre11/for-time-corrections-1-2-2026-11-14.md`, correction 2, règle 1) : le nombre de séries est propre à chaque bloc et commun à tous ses exercices ; il se choisit au questionnaire (« Sans » ou un nombre).] [Complété le 14/11/2026 au soir — « Pour les exercices en buy in et en buy out, je dois pouvoir ajouter ou supprimer des séries dans la composition de séance » : il se règle aussi dans la modale de chaque exercice du bloc, et vaut alors pour tout le bloc.] [Remplacé le 14/11/2026 (recette, m2 et m3), Hermann : « Les exercices de buy in (et de buy out) sont indépendants, changer le nombre de séries de l’un ne doit avoir aucun impact sur l’autre. » Chaque exercice du buy-in ou du buy-out a son propre nombre de séries ; le questionnaire en donne le nombre initial.]

**FT-4** **Buy-in et buy-out** : le nombre de séries est libre (au moins 1), identiques ou variables, exécutées une fois. Il est indépendant du nombre de tours.

**FT-5** **Tour** : le nombre de séries est égal au nombre de tours du For time, pour tous les exercices en tour. Il ne se règle pas exercice par exercice. Les cibles sont **toujours enregistrées tour par tour** : une valeur par tour, par exemple 21 – 15 – 9 ou 10 – 10 – 10. « Identiques » n’est qu’un raccourci de saisie (une valeur saisie s’applique à tous les tours), jamais un mode de stockage. Chaque tour reste modifiable individuellement, dans la composition comme dans le récapitulatif ; quand toutes les valeurs sont égales, l’affichage peut indiquer « identiques ».

[Version du matin, remplacée le 14/11/2026 (pièce jointe mise à jour, corrections 1 et 2 de Hermann du 14/11/2026, `_bmad-output/pre11/for-time-corrections-1-2-2026-11-14.md`) : « Le choix porte sur les cibles : *identiques* (même cible à chaque tour) ou *variables* (une cible par tour, par exemple 21 – 15 – 9). »]

**FT-6** Chaque série a un objectif. Il n’existe aucune série sans objectif en For time, et « À l’échec » n’y est pas proposé.

## Cohérence avec le nombre de tours

**FT-7** Quand le nombre de tours change, les séries de tous les exercices en tour sont mises à jour : en cas d’augmentation, séries identiques répétées, séries variables complétées avec la dernière valeur ; en cas de diminution, les dernières séries sont supprimées. Aucune série orpheline ni manquante. [Remplacé le 15/11/2026 — recette ft-i6, ft-m5 et h1 (Hermann : « La dernière valeur ne doit pas être reprise » ; « Buy In (1 serie) passé en mode Tour (3 tours de circuit) : les valeurs des Nouvelles séries doivent être entrée manuellement, pas de reprise automatique de valeur. ») : toute série ajoutée (nombre de tours augmenté, buy-in ou buy-out passé en Tour, séries identiques comprises) est à renseigner ; aucune valeur reprise.]

**FT-8** Un exercice ajouté en rôle Tour est créé avec autant de séries identiques que de tours.

## Changement de rôle

**FT-9** Tour → buy-in ou buy-out : les séries sont conservées telles quelles et deviennent propres à l’exercice (plus liées au nombre de tours).

**FT-10** Buy-in ou buy-out → tour : les séries sont ajustées au nombre de tours (identiques : valeur répétée ; variables : tronquées ou complétées avec la dernière valeur). [Remplacé le 15/11/2026 — recette ft-i6, ft-m5 et h1 (Hermann : « La dernière valeur ne doit pas être reprise » ; « Buy In (1 serie) passé en mode Tour (3 tours de circuit) : les valeurs des Nouvelles séries doivent être entrée manuellement, pas de reprise automatique de valeur. ») : toute série ajoutée (nombre de tours augmenté, buy-in ou buy-out passé en Tour, séries identiques comprises) est à renseigner ; aucune valeur reprise.]

**FT-11** Le changement de rôle ne laisse aucun état caché : composition, récapitulatif et exécution présentent les mêmes séries.

## Récapitulatif

**FT-12** Le récapitulatif affiche, pour chaque exercice, ses séries réelles (nombre et cibles) lues dans sa configuration ; il ne déduit rien du rôle. Toute modification faite dans le récapitulatif, y compris la valeur d’un tour 2 ou 3, est écrite dans la configuration de l’exercice : elle apparaît aussitôt dans la composition et se retrouve à l’identique après sauvegarde et réouverture. Inversement, toute modification faite dans la composition apparaît dans le récapitulatif.

[Version du matin, remplacée le 14/11/2026 : « Toute modification faite dans le récapitulatif est écrite dans la configuration de l’exercice et se retrouve à l’identique après sauvegarde et réouverture, y compris dans la composition. »]

## Exécution

**FT-13** Phases du mouvement : pour un exercice en tour, elles sont ignorées à l’exécution (aucun affichage, bip ni annonce vocale de phase) ; le paramètre reste stocké tel que défini avec le geste. Pour un buy-in ou un buy-out, les phases et la cadence suivent le paramétrage de l’exercice.

## Recette

1. Buy-in à 3 séries variables : composition et récapitulatif affichent 3 séries, modifiables dans les deux vues.
2. Exercice en tour : séries égales au nombre de tours, une valeur enregistrée par tour ; modifier les tours 2 et 3 dans le récapitulatif met à jour la composition (et inversement), valeurs conservées après sauvegarde et réouverture.

   [Version du matin, remplacée le 14/11/2026 : « 2. Exercice en tour : séries égales au nombre de tours, cibles identiques ou variables modifiables dans les deux vues, valeurs conservées après sauvegarde et réouverture. »]
3. Passer de 3 à 4 tours, puis de 4 à 2 : les exercices en tour suivent, sans série vide.
4. Échanger les rôles d’un buy-in et d’un exercice en tour : aucune valeur perdue de façon silencieuse, aucune série sans objectif, deux vues identiques.
5. Un exercice en tour ayant des phases : aucune phase à l’exécution, paramètre conservé.

## Mode d'exécution (14/11/2026)

Décision de Hermann du 14/11/2026 (« C'est exactement ça, Buy In, tous les tours de A, tous les tours de B..., Buy out » ; « Correction — For time : ajouter le mode d’exécution « En alternance » / « À la suite » » ; règle levée). FT-20 à FT-23 (Doc Figma « For time — Règles de gestion des séries et des tours ») : Exécution « En alternance » (défaut) ou « À la suite », dès deux exercices en tour : en alternance A, B, A, B… par tour ; à la suite toutes les séries de A, puis toutes celles de B ; buy-in et buy-out une seule fois, au début et à la fin ; séries de chaque exercice en tour = nombre de tours (de séries) dans les deux modes ; chrono, pauses exclues, résultat inchangés. Figma « For time — Récapitulatif » `8624:30672`, FT-20 à FT-23. En « À la suite », « Nombre de séries » et « Repos entre les séries ». Ces quatre règles ne sont pas recopiées ici mot pour mot : le Doc Figma reste leur source.
