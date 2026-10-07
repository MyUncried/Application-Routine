# KODJO — Prompt de mise à jour documentaire : le Bip de cadence et les règles de durée

**Date :** 07/10/2026
**Fichier Figma :** `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » (`510:101`)

**Objet.** Ce document remplace, sur le sujet de la cadence et des durées, tout ce qui a été écrit avant lui — y compris le prompt du 07/10 au matin et la révision 2 du dossier d'alignement du code. Les décisions prises depuis invalident plusieurs de leurs énoncés, et les sections 7 et 8 ci-dessous les listent explicitement pour qu'aucun ne survive par inadvertance.

**Figma fait foi** pour tout ce qui suit. Les écrans ont été mis à jour avant la rédaction de ce document.

---

## 1. Ce qui change, en bref

Le paramètre « Cadence » devient **« Bip de cadence »**. Le renommage n'est pas cosmétique : il dit ce que le paramètre fait — émettre un signal sonore — et c'est de là que découle tout le reste.

Trois conséquences en chaîne :

1. Le paramètre cesse d'appartenir au mode Répétitions. Il devient **transverse aux trois modes d'exécution**.
2. C'est le bip qui rend la durée estimable. Sans bip, rien ne cale le rythme, donc **aucune durée n'est calculée** — l'application n'invente plus de valeur.
3. La convention d'estimation à 2 secondes par répétition est **abandonnée**.

---

## 2. Définition des paramètres

### 2.1 Bip de cadence

| Propriété | Valeur |
|---|---|
| Libellé | **Bip de cadence** |
| Nature | signal sonore périodique, émis pendant la série |
| Plage | 0 à 10 secondes |
| Valeur 0 | s'affiche **« Aucun »** (masculin) |
| Valeur par défaut | Aucun |
| Contrôle | stepper, comme ses voisins |
| Portée | les trois modes d'exécution — Durée, Répétitions, À l'échec |

**Ce que le bip fait** : il émet un signal à intervalle régulier pendant la série, pour que l'utilisateur cale son rythme dessus.

**Ce que le bip ne fait pas** : il n'incrémente pas le compteur de répétitions, ne déclenche aucune transition, et ne termine pas la série. C'est l'utilisateur qui termine. Le bip informe le geste, il ne le commande pas.

**Pourquoi la plage s'arrête à 10 secondes.** Une répétition dure entre une et dix secondes : un squat excentrique lent tourne autour de six, un tempo prescrit 3-1-3-1 en fait huit. Au-delà, ce n'est plus un rythme de répétition mais une tenue de position, qui se règle en mode Durée. La plage de 1 à 60 s envisagée précédemment était surdimensionnée et imposait une roulette ; elle est abandonnée.

**Place dans l'interface.** Le bip appartient à la famille des signaux sonores minutés, qui se lit dans l'ordre temporel : **Compte à rebours** avant l'exercice, **Bip de cadence** pendant, **Fin d'exercice** après. Dans la modale il est toutefois placé **juste au-dessus de « Durée totale »**, parce que c'est lui qui en alimente le calcul et que le lecteur doit pouvoir suivre la chaîne du paramètre au résultat.

### 2.2 Vocabulaire

Le glossaire « cadence / rythme / fréquence » envisagé précédemment **n'a plus d'objet** : le libellé dit maintenant ce que le paramètre fait, il n'y a plus d'ambiguïté à lever. Ne pas l'écrire.

La phrase de synthèse **conserve ses formulations actuelles** — décision explicite, prise pour ne pas complexifier. Elle continue donc de parler de répétitions « cadencées » là où le libellé dit « bip ». Écart assumé.

---

## 3. Règles fonctionnelles — la durée totale

### 3.1 Au niveau d'une activité

| Mode d'exécution | Bip de cadence | Durée totale |
|---|---|---|
| Durée | Aucun | valeur exacte, **aucun symbole** |
| Durée | réglé | valeur exacte, **aucun symbole** |
| Répétitions | Aucun | **omise** — la ligne n'est pas affichée |
| Répétitions | réglé | `≈` valeur |
| À l'échec | Aucun | **omise** |
| À l'échec | réglé | **omise** |

Trois lectures de ce tableau, à reprendre dans la documentation :

**Le bip ne change le résultat qu'en un seul endroit.** Partout ailleurs c'est le mode qui décide : en mode Durée le minuteur impose la valeur, en mode À l'échec la série n'a par définition pas de terme.

**« Omise » signifie que la ligne disparaît**, pas qu'elle affiche un tiret, un zéro ou une valeur grisée.

**La présence de pauses ne change jamais le symbole.** Les pauses sont chronométrées, donc toujours déterminables : elles modifient la valeur, pas sa nature.

### 3.2 Au niveau d'une séance

| Composition de la séance | Symbole |
|---|---|
| Toutes les activités en mode Durée | aucun — durée exacte |
| Au moins une activité estimée, aucune sans durée | `≈` |
| Au moins une activité sans durée | `≥` |

Le `≥` ne subsiste qu'à ce niveau, et il y dit quelque chose de vrai : les activités dont on sait quelque chose totalisent ce montant, les autres s'y ajoutent sans borne connue. Au niveau d'une activité, `≥` n'a aucun cas d'emploi.

### 3.3 Convention de calcul

Vérifiée sur l'écran « 13 Répétitions avec cadence » : 4 séries × 15 répétitions × 4 s = 240 s de travail, plus 3 × 15 s de pause entre séries = 45 s, soit 285 s affichés `≈ 4 min 45 s`.

**Durée totale = travail + pauses entre séries.** Le compte à rebours et la fin d'exercice n'y entrent pas. Les pauses comptent pour n − 1 intervalles, pas n.

---

## 4. Comportement des steppers

Règle générale du composant Stepper, applicable à tous les champs numériques, pas seulement au bip.

| Geste | Effet |
|---|---|
| Appui simple | 1 pas |
| Maintien, après ~500 ms | répétition au pas de 1 |
| Maintien prolongé, après ~2 s | pas de 5, **arrondi au multiple de 5** |
| Maintien au-delà de ~4 s | pas de 10, **arrondi au multiple de 10** |
| Relâchement | retour immédiat au pas de 1 |

L'arrondi au multiple est la pièce essentielle : sans lui, un passage au pas de 5 depuis 13 s donnerait 18, 23, 28, et les valeurs rondes resteraient hors d'atteinte. Avec lui on passe à 15, 20, 25, 30, et le retour au pas de 1 au relâchement permet l'ajustement fin.

L'accélération est **proportionnée à la plage** : sur « Bip de cadence » (0 à 10 s), « Compte à rebours » et « Fin d'exercice », le pas de 5 ne sera jamais atteint, et c'est voulu. En pratique elle ne sert que sur « Pause après chaque série ».

C'est un comportement, il ne se maquette pas. Il s'inscrit dans la description du composant Stepper au DSF.

---

## 5. Écrans modifiés

### 5.1 Écrans traités

| Écran | Modification |
|---|---|
| Création activité — Paramètres en modale — 13 Répétitions avec cadence | Ligne renommée, passée au premier niveau, placée au-dessus de « Durée totale ». Valeur convertie en stepper (4 s). Durée `≈ 4 min 45 s` conservée. |
| Création activité — Paramètres en modale — 10 Répétitions (mode activé) | Idem, stepper à « Aucun ». **Ligne « Durée totale » supprimée.** Modale raccourcie d'une ligne. |
| Création activité — Paramètres en modale — 10b Répétitions (copie) | Idem écran 10. Correctif de passage : le trait au-dessus de « Séries variables » démarre désormais avec son texte (314 px depuis x = 52). |
| Séries variables — 3 Répétitions variables (scénario E) | Idem écran 10. Phrase de synthèse ramenée à « 3 séries de 12, 10 et 8 répétitions. », sans ligne de durée. |
| Changement de mode — 11 Cibles à renseigner | Idem écran 10. |

### 5.2 Écran supprimé

**Création activité — Paramètres en modale — 14 Cadence (roulette ouverte).** Il n'existait que pour montrer la roulette de sélection de la cadence. Le passage au stepper l'a rendu sans objet.

### 5.3 Règles de mise en page, mises à jour

La règle « Cadence est indentée sous Répétitions » **est supprimée**. Le bip est au premier niveau (x = 36), avec un séparateur de 330 px à partir de x = 36.

Restent inchangées les autres règles d'indentation : « Séries variables » et « Durée d'une série » sous « Séries » ; « Répétitions » et « Pause après chaque série » sous « Séries » ; « Ordre des côtés » et « Pause entre les côtés » sous « Changement de côté ».

Quand la ligne « Durée totale » disparaît, la modale **raccourcit d'une ligne (42 px) par le haut** et reste collée au bas de l'écran.

---

## 6. Modèle de données et développement

| Élément | Nature | Détail |
|---|---|---|
| Champ de cadence | **Renommé et élargi** | L'ancien `repetitionIntervalSeconds` devient un intervalle de bip. Le nom doit suivre — il ne décrit plus une propriété des répétitions. Entier 0 à 10, 0 valant « aucun bip ». |
| Validation | **Assouplie** | La contrainte « non nul uniquement si mode = Répétitions » tombe : le champ est valide dans les trois modes. |
| Retour des calculs de durée | **Quatre niveaux** | exact, approximatif, minorant, omis. `omitted` est un niveau de retour, pas un zéro accompagné d'un drapeau à interpréter au rendu. |
| Convention de 2 s par répétition | **Supprimée** | Elle ne doit plus apparaître nulle part, ni comme estimation d'affichage, ni comme valeur de migration. |
| État moteur | **Ajouté** | Ordonnancement du signal sonore périodique pendant la série, comportement en arrière-plan et écran verrouillé, reprise après suspension système. |

**Sur le coût du bip côté moteur.** La modale porte déjà deux signaux sonores minutés — compte à rebours et fin d'exercice — donc la plomberie audio existe. Ce qui est nouveau, c'est qu'un métronome se répète pendant plusieurs minutes là où ces deux-là se déclenchent une fois. C'est ce point qu'il faut qualifier, pas l'audio en lui-même.

**Prérequis inchangé.** Les migrations SQLite s'arrêtent à la 008 et `ActivityDefinition` porte encore `repetitionCount`, `seriesCount` et `pauseSeconds` en scalaires. Rien de ce document n'est implémentable avant la migration qui introduit `SeriesParameters` et les objets de pause.

---

## 7. Énoncés devenus faux, à retirer de la documentation

| Énoncé | Statut |
|---|---|
| « Cadence », comme nom du paramètre | remplacé par « Bip de cadence » |
| Le paramètre n'existe qu'en mode Répétitions | faux — il est transverse aux trois modes |
| Plage de 1 à 60 secondes | remplacée par 0 à 10 |
| La valeur « Aucune » | devient « Aucun », et vaut 0 sur le stepper |
| Sélection par roulette | remplacée par un stepper |
| Convention de 2 s par répétition | supprimée |
| En mode Répétitions sans cadence, durée notée `≥` | faux — la durée est omise |
| En mode Répétitions non cadencé, durée notée `≈` | faux — la durée est omise |
| En mode Répétitions avec cadence, aucun symbole | faux — le symbole est `≈` |
| `≥` au niveau d'une activité | n'existe plus ; `≥` ne subsiste qu'au niveau séance |
| Glossaire cadence / rythme / fréquence | sans objet, ne pas écrire |
| Cadence indentée sous Répétitions | faux — premier niveau |
| La cadence est un paramètre purement déclaratif, sans effet à l'exécution | faux — le bip est émis pendant la série |
| Écran « 14 Cadence (roulette ouverte) » | supprimé |

---

## 8. Fichier Excel à compléter

Le classeur `generateur-phrase-activite_v13.xlsx` reste la spécification exécutable de la phrase de synthèse. **Les phrases ne changent pas.** Ce qui doit être complété, ce sont les cas manquants :

1. Une colonne **Bip de cadence**, applicable aux trois modes et non plus au seul mode Répétitions.
2. Les combinaisons **mode Durée avec bip** et **mode À l'échec avec bip** — phrase inchangée, durée inchangée. Ces lignes documentent que le bip n'y produit aucun effet sur le calcul.
3. Les combinaisons **mode Répétitions sans bip** — la colonne de durée doit porter l'omission, pas une valeur.
4. La feuille **Calcul des durées** doit refléter les quatre niveaux de retour et la convention « travail + pauses entre séries, n − 1 intervalles ».

---

## 9. Reste à faire

1. **Déployer la ligne « Bip de cadence » sur les modales qui ne la portent pas encore** — une vingtaine d'écrans, en modes Durée et À l'échec, puisque le paramètre y existe désormais.
2. **Vérifier les `≥` de niveau séance.** Les écrans de catalogue et de composition affichent `≥ 11 min 3 s`, `≥ 21 min` et `≥ 30 s`. Sous la nouvelle règle ils restent justifiés dès lors que la séance contient une activité sans durée — ce qui est le cas de « Composition séance — Standard — Séries variables », qui comporte une activité « 10 rép. » sans bip. À confirmer écran par écran. Le `≥ 30 s` du catalogue des exercices est en revanche de niveau activité : il doit disparaître.
3. **Recalculer le résidu du scénario E.** Sa valeur de 3 min 15 s était recopiée du scénario A et ne dérivait d'aucun calcul ; la ligne ayant été supprimée, le point est clos pour cet écran, mais il faut vérifier qu'aucune autre valeur n'a été héritée de la même façon.
4. **Inscrire le comportement des steppers** dans la description du composant au DSF.
